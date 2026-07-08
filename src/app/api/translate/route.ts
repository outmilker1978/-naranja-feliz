import { NextResponse } from "next/server";
import { FUNCTION_WORDS } from "@/data/spanish-function-words";

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const YANDEX_API_KEY = process.env.YANDEX_API_KEY;
const YANDEX_FOLDER_ID = process.env.YANDEX_FOLDER_ID;

export async function POST(req: Request) {
  const { text, source = "es", target = "ru" } = await req.json();
  if (!text || typeof text !== "string") return NextResponse.json({ error: "No text" }, { status: 400 });

  const clean = text.trim();

  // Если одно слово и оно в словаре служебных — возвращаем грамматическое объяснение
  if (!/\s/.test(clean)) {
    const fw = FUNCTION_WORDS[clean.toLowerCase()];
    if (fw) {
      let explanation = `[${fw.type}] ${fw.explanation}`;
      if (fw.note) explanation += ` (${fw.note})`;
      return NextResponse.json({ translation: explanation, functionWord: true });
    }
  }

  // Yandex Translate
  if (YANDEX_API_KEY) {
    try {
      const res = await fetch("https://translate.api.cloud.yandex.net/translate/v2/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Api-Key ${YANDEX_API_KEY}` },
        body: JSON.stringify({
          folderId: YANDEX_FOLDER_ID,
          texts: [text],
          sourceLanguageCode: source.toUpperCase(),
          targetLanguageCode: target,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ translation: data.translations?.[0]?.text ?? text });
      }
    } catch {}
  }

  // DeepL fallback
  if (DEEPL_API_KEY) {
    try {
      const res = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ auth_key: DEEPL_API_KEY, text, source_lang: "ES", target_lang: "RU" }),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ translation: data.translations?.[0]?.text ?? text });
      }
    } catch {}
  }

  // Google Translate
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=ru&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const t = data?.[0]?.[0]?.[0];
      if (t) return NextResponse.json({ translation: t });
    }
  } catch {}

  // LibreTranslate
  try {
    const res = await fetch("https://libretranslate.com/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, source: "es", target: "ru", format: "text" }),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ translation: data.translatedText ?? text });
    }
  } catch {}

  // MyMemory
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=es|ru`);
    if (res.ok) {
      const data = await res.json();
      if (data?.responseStatus === 200 && data?.responseData?.translatedText) {
        return NextResponse.json({ translation: data.responseData.translatedText });
      }
    }
  } catch {}

  return NextResponse.json({ translation: null });
}
