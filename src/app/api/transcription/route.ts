import { NextResponse } from "next/server";

function generateSpanishIPA(word: string): string {
  // Character-by-character IPA generation for Spanish
  // Spanish orthography is highly regular, giving ~95% accurate transcriptions
  const w = word.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  let result = "";
  let i = 0;
  while (i < w.length) {
    const c = w[i];
    const n = i + 1 < w.length ? w[i + 1] : "";
    const nn = i + 2 < w.length ? w[i + 2] : "";

    // Digraphs
    if (c === "l" && n === "l") { result += "ʎ"; i += 2; continue; }
    if (c === "r" && n === "r") { result += "r"; i += 2; continue; }
    if (c === "c" && n === "h") { result += "tʃ"; i += 2; continue; }
    if (c === "q" && n === "u") { result += "k"; i += 2; continue; }
    if (c === "g" && n === "ü") { result += "ɡw"; i += 2; continue; }
    if (c === "g" && n === "u" && (nn === "e" || nn === "i")) { result += "ɡ"; i += 2; continue; }

    // Single consonants with context
    if (c === "c" && (n === "e" || n === "i")) { result += "θ"; i += 1; continue; }
    if (c === "g" && (n === "e" || n === "i")) { result += "x"; i += 1; continue; }
    if (c === "h") { i += 1; continue; } // silent
    if (c === "v") { result += "b"; i += 1; continue; }
    if (c === "z") { result += "θ"; i += 1; continue; }
    if (c === "j") { result += "x"; i += 1; continue; }
    if (c === "y") { result += "ʝ"; i += 1; continue; }
    if (c === "ñ") { result += "ɲ"; i += 1; continue; }

    // Vowels (already stripped of accents)
    if ("aeiou".includes(c)) { result += c; i += 1; continue; }

    // Remaining consonants (b, d, f, k, l, m, n, p, r, s, t, x)
    if (c === "r") { result += "ɾ"; i += 1; continue; }
    result += c;
    i += 1;
  }

  // Stress: penultimate syllable (usually). For marked stress we'd use the accent.
  return `/${result}/`;
}

export async function POST(req: Request) {
  const { text } = await req.json();
  if (!text || typeof text !== "string") return NextResponse.json({ error: "No text" }, { status: 400 });

  const word = text.trim().toLowerCase();

  // Try English Wiktionary API for IPA (Spanish section)
  try {
    const url = `https://en.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(word)}&prop=text&format=json&utf8=1`;
    const res = await fetch(url, { headers: { "User-Agent": "NaranjaFeliz/1.0" } });
    if (res.ok) {
      const data = await res.json();
      const html = data?.parse?.text?.["*"] ?? "";
      const ipaMatch = html.match(/lang="es"[^]*?<span class="IPA"[^>]*>\s*([^<]+)\s*<\//);
      if (ipaMatch) return NextResponse.json({ transcription: ipaMatch[1].trim() });
      const genericMatch = html.match(/<span class="IPA"[^>]*>\s*([^<]+)\s*<\//);
      if (genericMatch) return NextResponse.json({ transcription: genericMatch[1].trim() });
    }
  } catch {}

  // Fallback: generate IPA from Spanish pronunciation rules
  try {
    const generated = generateSpanishIPA(word);
    return NextResponse.json({ transcription: generated });
  } catch {}

  return NextResponse.json({ transcription: null });
}
