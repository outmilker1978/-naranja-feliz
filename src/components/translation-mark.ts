import { Mark } from "@tiptap/core";

export interface TranslationMarkOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    translationMark: {
      setTranslationMark: (translation: string) => ReturnType;
      unsetTranslationMark: () => ReturnType;
    };
  }
}

export const TranslationMark = Mark.create<TranslationMarkOptions>({
  name: "translationMark",

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      translation: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute("data-translate"),
        renderHTML: (attrs) => {
          if (!attrs.translation) return {};
          return { "data-translate": attrs.translation };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-translate]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", { class: "translated-text", ...HTMLAttributes }, 0];
  },

  addCommands() {
    return {
      setTranslationMark: (translation: string) => ({ commands }) => {
        return commands.setMark(this.name, { translation });
      },
      unsetTranslationMark: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },
});
