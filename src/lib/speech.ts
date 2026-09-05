const femaleNames = /helena|sabina|veronica|carmela|maria|marta|paula|mia|aida|elvira|alba|sonia|nuria|joy|lupe|palmira|dora|gloria|sally|andrea|teodora|paulina|leticia|reina|valeria|ana|rosa|silvia|lucia|lucía|cosimo.*(spanish)|monica|mónica/i;

// Мужские испанские голоса (Windows/Microsoft, Chrome, Android) — в порядке приоритета.
const maleNames = [
  /raul/i,
  /pablo/i,
  /jorge/i,
  /dario/i,
  /carlos/i,
  /diego/i,
  /andres/i,
  /andrés/i,
  /miguel/i,
  /jose/i,
  /josé/i,
  /javier/i,
  /alvaro/i,
  /álvaro/i,
  /manuel/i,
  /enrique/i,
  /ruben/i,
  /rubén/i,
  /sergio/i,
  /google espa/i,
];

function pickBestSpanishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const es = voices.filter((v) => (v.lang || "").toLowerCase().startsWith("es"));
  if (!es.length) return null;

  const scored = es.map((v) => {
    let s = 0;
    const knownIdx = maleNames.findIndex((r) => r.test(v.name));
    if (knownIdx >= 0) s -= knownIdx + 1; // известные мужские — в приоритете по порядку списка
    if (femaleNames.test(v.name)) s += 8; // женские — в самый конец (монотонные на Windows)
    const l = v.lang.toLowerCase();
    if (l.startsWith("es-es")) s -= 1;
    else if (l.startsWith("es-mx") || l.startsWith("es-us") || (l.startsWith("es") && l.length <= 5)) s += 0.5;
    else s += 2;
    return { v, s };
  });

  scored.sort((a, b) => a.s - b.s);
  return scored[0].v;
}

let cachedVoice: SpeechSynthesisVoice | null | undefined;

function resolveVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined && voices.some((v) => v === cachedVoice)) return cachedVoice;
  cachedVoice = pickBestSpanishVoice(voices);
  return cachedVoice;
}

// Единственная активная серверная озвучка: повторное нажатие гасит предыдущую,
// иначе кнопки дают «эхо» из нескольких синхронных речей.
let activeTts: HTMLAudioElement | null = null;
let activeTtsCleanup: (() => void) | null = null;
let localToken = 0;

export function stopSpeaking() {
  if (typeof window === "undefined") return;
  try { window.speechSynthesis?.cancel?.(); } catch {}
  if (activeTts) {
    const a = activeTts;
    activeTts = null;
    if (activeTtsCleanup) { activeTtsCleanup(); activeTtsCleanup = null; }
    try { a.pause(); a.removeAttribute("src"); a.load?.(); } catch {}
  }
  localToken++;
}

// Серверная озвучка (Microsoft Edge neural TTS, мужской Dario) —
// когда в системе нет испанских голосов ИЛИ есть только женские монотонные.
function playServerTtsFallback(text: string, onFinish: () => void) {
  if (typeof window === "undefined") return;
  const url = `/api/tts?text=${encodeURIComponent(text)}`;
  const a = new Audio(url);
  a.volume = 1;
  activeTts = a;
  const finish = () => {
    if (activeTts === a) {
      activeTts = null;
      if (activeTtsCleanup) { activeTtsCleanup(); activeTtsCleanup = null; }
    }
    onFinish();
  };
  activeTtsCleanup = finish;
  a.onended = finish;
  a.onerror = finish;
  a.play().catch(() => {
    try { a.pause(); a.removeAttribute("src"); } catch {}
    finish();
  });
}

export function speakSpanish(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  stopSpeaking();
  const synth = window.speechSynthesis;
  const token = localToken;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    if (localToken !== token) return; // новое проигрывание уже началось
    onEnd?.();
  };

  const speakLocal = (voice: SpeechSynthesisVoice) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice.lang;
    u.voice = voice;
    u.rate = 0.85;
    u.pitch = 1;
    u.onend = finish;
    u.onerror = finish;
    synth.speak(u);
  };

  // Возвращает true, если речь «запущена» (локально или серверным фолбэком).
  const tryPlay = (): boolean => {
    const chosen = resolveVoice(synth.getVoices());
    if (!chosen) return false;
    if (femaleNames.test(chosen.name)) {
      // Есть только женские испанские — берём серверный мужской голос.
      playServerTtsFallback(text, finish);
      return true;
    }
    speakLocal(chosen);
    return true;
  };

  // Голоса ещё не загрузились (Chrome грузит асинхронно) — ждём voiceschanged,
  // с таймаутом-страховкой на серверную озвучку.
  if (!synth.getVoices().length) {
    const once = () => {
      synth.removeEventListener("voiceschanged", once);
      if (localToken !== token || finished) return;
      if (!tryPlay()) playServerTtsFallback(text, finish);
    };
    synth.addEventListener("voiceschanged", once);
    setTimeout(() => {
      synth.removeEventListener("voiceschanged", once);
      if (localToken !== token || finished) return;
      if (!tryPlay()) playServerTtsFallback(text, finish);
    }, 1500);
    return;
  }

  if (!tryPlay()) playServerTtsFallback(text, finish);
}