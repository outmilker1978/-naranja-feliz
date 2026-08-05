"use client";

import twemoji from "@twemoji/api";

const BASE = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/";

export function emojiImgHtml(emoji: string, cls = "twemoji"): string {
  return twemoji.parse(emoji, {
    base: BASE,
    folder: "svg",
    ext: ".svg",
    className: cls,
    attributes: () => ({
      alt: emoji,
      loading: "lazy",
      style: "width:1.2em;height:1.2em;display:inline-block;vertical-align:-0.2em;",
    }),
  });
}
