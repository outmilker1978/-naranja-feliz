"use client";

import { useEffect } from "react";
import twemoji from "@twemoji/api";

const BASE = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/";

const OPTIONS = {
  base: BASE,
  folder: "svg",
  ext: ".svg",
  className: "twemoji",
  attributes: () => ({
    loading: "lazy",
    style: "width:1.2em;height:1.2em;display:inline-block;vertical-align:-0.2em;",
  }),
};

function isEditable(node: Node): boolean {
  const el = node instanceof HTMLElement ? node : node.parentElement;
  return !!el?.closest?.('[contenteditable="true"], .tiptap-editor, input, textarea');
}

function parseEl(el: HTMLElement) {
  if (isEditable(el)) return;
  const leaves = el.querySelectorAll("*");
  leaves.forEach(child => {
    if (child.children.length === 0 && !isEditable(child)) {
      try { twemoji.parse(child as HTMLElement, OPTIONS); } catch {}
    }
  });
  if (el.children.length === 0) {
    try { twemoji.parse(el, OPTIONS); } catch {}
  }
}

export function TwemojiGlobal() {
  useEffect(() => {
    let observer: MutationObserver | null = null;

    const init = () => {
      document.body.childNodes.forEach(n => {
        if (n instanceof HTMLElement) parseEl(n);
      });
      observer?.disconnect();
      observer = new MutationObserver(mutations => {
        for (const m of mutations) {
          for (const node of m.addedNodes) {
            if (node instanceof HTMLElement && !isEditable(node)) {
              parseEl(node);
            }
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    };

    // Запускаем только после полной загрузки страницы (гидратация React завершена),
    // чтобы не сломать SSR-рендер.
    let t1: ReturnType<typeof setTimeout>;
    if (document.readyState === "complete") {
      t1 = setTimeout(init, 600);
    } else {
      window.addEventListener("load", () => { t1 = setTimeout(init, 600); });
    }

    return () => {
      clearTimeout(t1);
      observer?.disconnect();
      window.removeEventListener("load", init as unknown as EventListener);
    };
  }, []);

  return null;
}
