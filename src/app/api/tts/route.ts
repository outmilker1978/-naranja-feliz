import { NextResponse } from "next/server";
import crypto from "crypto";

// Озвучка испанского текста:
// 1) Microsoft Edge "Read Aloud" neural TTS (public endpoint, no key) — мужской Dario/Jorge.
// 2) Google Translate TTS (бесплатно, без ключа) — надёжный запасной, если Edge недоступен.
// Применяется, когда у клиента нет испанского голоса (или только женские монотонные).
const EDGE_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const EDGE_VERSION = "1-130.0.2849.4";
const EDGE_URL = "https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1";

const MALE_VOICES = ["es-ES-DarioNeural", "es-MX-JorgeNeural", "es-ES-AlvaroNeural"];

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function edgeTts(text: string, voice: string): Promise<Response | null> {
  const tick = String(Math.floor(Date.now() / 300));
  const randomWord = crypto.randomBytes(5).toString("hex");
  const secMsGec = crypto.createHash("sha256").update(tick + randomWord + EDGE_TOKEN).digest("hex");
  const connectionId = crypto.randomUUID();
  const requestId = crypto.randomUUID();

  const endpoint = `${EDGE_URL}?TrustedClientToken=${EDGE_TOKEN}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=${EDGE_VERSION}&ConnectionId=${connectionId}`;
  const ssml =
    `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='es'>` +
    `<voice name='${voice}'><prosody pitch='+0Hz' rate='-10.00%' volume='+0.00%'>${escapeXml(text)}</prosody></voice>` +
    `</speak>`;

  let resp: Response;
  try {
    resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Accept-Encoding": "identity",
        "Origin": "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.2849.4",
        "Content-Type": "application/ttsml+xml",
        "X-RequestId": requestId,
        "X-Timestamp": new Date().toISOString(),
        "X-ConnectionId": connectionId,
      },
      body: ssml,
    });
  } catch {
    return null;
  }

  if (!resp.ok) return null;
  const buf = Buffer.from(await resp.arrayBuffer());
  if (!buf.length) return null;
  return new NextResponse(new Uint8Array(buf), { status: 200, headers: { "Content-Type": resp.headers.get("content-type") || "audio/mpeg" } });
}

async function googleTts(text: string): Promise<NextResponse> {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=es&q=${encodeURIComponent(text.slice(0, 200))}`;
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      "Referer": "https://translate.google.com/",
    },
  });
  if (!resp.ok) return NextResponse.json({ error: "tts fallback unavailable" }, { status: 502 });
  const buf = Buffer.from(await resp.arrayBuffer());
  if (!buf.length) return NextResponse.json({ error: "empty audio" }, { status: 502 });
  return new NextResponse(new Uint8Array(buf), { status: 200, headers: { "Content-Type": "audio/mpeg" } });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const text = (url.searchParams.get("text") || "").slice(0, 500);
  const voiceParam = url.searchParams.get("voice");
  const voice = voiceParam || MALE_VOICES[0];

  if (!text.trim()) {
    return NextResponse.json({ error: "missing text" }, { status: 400 });
  }

  const male = MALE_VOICES.includes(voice);
  if (!voiceParam || !male) {
    const edge = await edgeTts(text, voice);
    if (edge) return edge;
    if (voiceParam && !male) return googleTts(text);
  }

  for (const v of MALE_VOICES) {
    const edge = await edgeTts(text, v);
    if (edge) return edge;
  }

  return googleTts(text);
}