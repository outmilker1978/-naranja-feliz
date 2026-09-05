"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { ResizableImage } from "@/components/resizable-image";
import { TranslationMark } from "@/components/translation-mark";
import { OrangeDividerExtension } from "@/components/tiptap-divider";
import { speakSpanish } from "@/lib/speech";
import { EmojiPicker } from "@/components/emoji-picker";
import { createClient } from "@/lib/supabase/client";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  Heading1, Heading2, Heading3, Quote, LinkIcon, ImageIcon, Languages, Undo, Redo, Eye, Edit3, Volume2, AlignLeft, AlignCenter, AlignRight, Table as TableIcon,
} from "lucide-react";

function ToolBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active ? "bg-primary-200 text-accent" : "text-zinc-600 hover:bg-primary-50 hover:text-primary-500"
      }`}
    >
      {children}
    </button>
  );
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Напишите текст урока...",
}: {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const [preview, setPreview] = useState(false);
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showTableDialog, setShowTableDialog] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableHeader, setTableHeader] = useState(true);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      LinkExtension.configure({ openOnClick: false }),
      ResizableImage,
      TranslationMark,
      OrangeDividerExtension,
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph", "image", "tableCell", "orangeDivider"] }),
      Table.configure({ allowTableNodeSelection: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor text-content focus:outline-none min-h-[300px] px-4 py-3",
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Ссылка:", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const compressImage = useCallback(async (file: File): Promise<File> => {
    if (!file.type.startsWith("image/") || file.size < 1024 * 1024) return file;
    const img = await createImageBitmap(file);
    let w = img.width, h = img.height;
    if (w > 1920) { h = Math.round(h * 1920 / w); w = 1920; }
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);
    img.close();
    return new Promise<File>(resolve => canvas.toBlob(b => resolve(new File([b!], file.name, { type: "image/jpeg" })), "image/jpeg", 80));
  }, []);

  const uploadFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editor) return;
    let file = e.target.files?.[0];
    if (!file) return;
    file = await compressImage(file);

    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload-file", { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Upload failed" }));
      alert("Ошибка загрузки: " + (err.error || res.statusText));
      return;
    }
    const { url: publicUrl } = await res.json();

    const isImage = /\.(png|jpe?g|gif|webp)(\?|$)/i.test(publicUrl);
    const isAudio = /\.(mp3|ogg|wav)(\?|$)/i.test(publicUrl);
    const isVideo = /\.(mp4|webm)(\?|$)/i.test(publicUrl);

    if (isImage) {
      editor.chain().focus().setImage({ src: publicUrl }).run();
    } else if (isAudio) {
      editor.chain().focus().insertContent(`<audio src="${publicUrl}" controls></audio>`).run();
    } else if (isVideo) {
      editor.chain().focus().insertContent(`<video src="${publicUrl}" controls></video>`).run();
    } else {
      editor.chain().focus().insertContent(`<a href="${publicUrl}" target="_blank">${file.name}</a>`).run();
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [editor, supabase]);

  const hasTranslationAtSelection = useCallback(() => {
    if (!editor) return false;
    const { from, to, empty } = editor.state.selection;
    if (empty) {
      return (editor.state.storedMarks || editor.state.selection.$from.marks()).some(
        (m: import("@tiptap/pm/model").Mark) => m.type.name === "translationMark"
      );
    }
    let found = false;
    editor.state.doc.nodesBetween(from, to, (node) => {
      if (node.marks?.some((m: import("@tiptap/pm/model").Mark) => m.type.name === "translationMark")) {
        found = true;
        return false;
      }
    });
    return found;
  }, [editor]);

  const [isTransActive, setIsTransActive] = useState(false);

  useEffect(() => {
    if (!editor) return;
    const check = () => setIsTransActive(hasTranslationAtSelection());
    editor.on("selectionUpdate", check);
    check();
    return () => { editor.off("selectionUpdate", check); };
  }, [editor, hasTranslationAtSelection]);

  // Reset default bold mark if content has no actual bold text
  useEffect(() => {
    if (!editor) return;
    const hasBoldContent = editor.getHTML().includes("<strong>") || editor.getHTML().includes("<b>");
    if (!hasBoldContent && editor.isActive("bold")) {
      editor.commands.unsetBold();
    }
  }, [editor]);

  const toggleTranslation = useCallback(async () => {
    if (!editor) return;
    if (hasTranslationAtSelection()) {
      editor.chain().focus().unsetTranslationMark().run();
      return;
    }
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    if (!selectedText || selectedText.length > 500) return;
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selectedText, source: "es", target: "ru" }),
      });
      const data = await res.json();
      const translation = data.translation || "";
      if (translation) {
        editor.chain().focus().setTranslationMark(translation).run();
        (editor.view.dom as HTMLElement).blur();
      }
    } catch {}
  }, [editor, hasTranslationAtSelection]);

  if (!editor) return null;

  if (preview) {
    return (
      <PreviewWithTranslations html={editor.getHTML()} onBack={() => setPreview(false)} />
    );
  }

  return (
    <div className="border border-zinc-300 rounded-lg overflow-hidden">
      <div className="flex items-center gap-1 px-3 py-2 bg-zinc-50 border-b border-zinc-300 flex-wrap">
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Жирный"><Bold className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Курсив"><Italic className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Подчеркнутый"><UnderlineIcon className="w-4 h-4" /></ToolBtn>
        <span className="w-px h-5 bg-zinc-300 mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Заголовок 1"><Heading1 className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Заголовок 2"><Heading2 className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Заголовок 3"><Heading3 className="w-4 h-4" /></ToolBtn>
        <span className="w-px h-5 bg-zinc-300 mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Маркированный список"><List className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Нумерованный список"><ListOrdered className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Цитата"><Quote className="w-4 h-4" /></ToolBtn>
        <EmojiPicker onSelect={(e) => editor.chain().focus().insertContent(e).run()} />
        <span className="w-px h-5 bg-zinc-300 mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Выровнять влево"><AlignLeft className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Выровнять по центру"><AlignCenter className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Выровнять вправо"><AlignRight className="w-4 h-4" /></ToolBtn>
        <span className="w-px h-5 bg-zinc-300 mx-1" />
        <ToolBtn onClick={setLink} active={editor.isActive("link")} title="Вставить ссылку"><LinkIcon className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={toggleTranslation} active={isTransActive} title="Перевод (повторное нажатие убирает)"><Languages className="w-4 h-4" /></ToolBtn>
        <span className="w-px h-5 bg-zinc-300 mx-1" />
        <ToolBtn onClick={() => setShowTableDialog(true)} active={editor.isActive("table")} title="Таблица"><TableIcon className="w-4 h-4" /></ToolBtn>
        {editor.isActive("table") && (
          <>
            <span className="w-px h-5 bg-zinc-300 mx-1" />
            <ToolBtn onClick={() => editor.chain().focus().addColumnBefore().run()} title="Столбец слева"><span className="text-xs font-bold">┃◀</span></ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().addColumnAfter().run()} title="Столбец справа"><span className="text-xs font-bold">▶┃</span></ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().addRowBefore().run()} title="Строка сверху"><span className="text-xs font-bold">─▲</span></ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().addRowAfter().run()} title="Строка снизу"><span className="text-xs font-bold">▼─</span></ToolBtn>
            <span className="w-px h-5 bg-zinc-300 mx-1" />
            <ToolBtn onClick={() => editor.chain().focus().deleteColumn().run()} title="Удалить столбец"><span className="text-xs font-bold">┃✕</span></ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().deleteRow().run()} title="Удалить строку"><span className="text-xs font-bold">─✕</span></ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().deleteTable().run()} title="Удалить таблицу"><span className="text-xs font-bold">⊞✕</span></ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().toggleHeaderRow().run()} active={editor.isActive("tableHeader")} title="Заголовок"><span className="text-xs font-bold">H</span></ToolBtn>
          </>
        )}
        <label className="p-1.5 rounded text-zinc-600 hover:bg-primary-50 hover:text-primary-500 cursor-pointer transition-colors" title="Загрузить файл с компа">
          <ImageIcon className="w-4 h-4" />
          <input ref={fileInputRef} type="file" accept="image/*,audio/*,video/*,.pdf" onChange={uploadFile} className="hidden" />
        </label>
        <span className="w-px h-5 bg-zinc-300 mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Отменить"><Undo className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Повторить"><Redo className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => {
          editor.chain().focus().insertContent('<div data-type="orange-divider"></div>').run();
        }} title="Разделитель">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <path d="M2 12h5" /><path d="M17 12h5" />
            <path d="M7 12l2-2" /><path d="M7 12l2 2" />
            <path d="M17 12l-2-2" /><path d="M17 12l-2 2" />
            <path d="M12 7V2" /><path d="M12 2l-1.5 1.5M12 2l1.5 1.5" />
          </svg>
        </ToolBtn>
        <span className="w-px h-5 bg-zinc-300 mx-1" />
        <button
          onClick={() => setPreview(true)}
          className="flex items-center gap-1 px-2 py-1 rounded text-sm text-zinc-600 hover:bg-primary-50 hover:text-primary-500 transition-colors"
        >
          <Eye className="w-4 h-4" /> Предпросмотр
        </button>
      </div>

      {showTableDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowTableDialog(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-accent mb-4">Вставка таблицы</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Столбцы</label>
                <input type="number" min={1} max={10} value={tableCols} onChange={e => setTableCols(parseInt(e.target.value) || 3)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Строки</label>
                <input type="number" min={1} max={20} value={tableRows} onChange={e => setTableRows(parseInt(e.target.value) || 3)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={tableHeader} onChange={e => setTableHeader(e.target.checked)} />
                Заголовок таблицы (первая строка)
              </label>
              <div className="border border-zinc-200 rounded-lg p-3 bg-zinc-50">
                <p className="text-xs text-zinc-400 mb-2">Предпросмотр:</p>
                <div className="grid gap-px bg-zinc-300" style={{ gridTemplateColumns: `repeat(${tableCols}, 1fr)` }}>
                  {Array.from({ length: tableRows * tableCols }).map((_, i) => (
                    <div key={i} className={`p-2 text-center text-xs ${i < tableCols && tableHeader ? "bg-primary-100 text-primary-700 font-medium" : "bg-white text-zinc-500"}`}>
                      {i < tableCols && tableHeader ? `Заголовок ${i + 1}` : `${Math.floor(i / tableCols) + 1}:${(i % tableCols) + 1}`}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowTableDialog(false)}
                className="flex-1 px-4 py-2 text-sm rounded-lg border border-zinc-300 text-zinc-600 hover:bg-zinc-50">Отмена</button>
              <button onClick={() => {
                editor.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: tableHeader }).run();
                setShowTableDialog(false);
              }} className="flex-1 px-4 py-2 text-sm rounded-lg bg-primary-500 text-white hover:bg-primary-600">
                Вставить
              </button>
            </div>
          </div>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}

function PreviewWithTranslations({ html, onBack }: { html: string; onBack: () => void }) {
  const [popup, setPopup] = useState<{ text: string; translation: string; x: number; y: number } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleContext = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const translateSpan = target.closest("[data-translate]") as HTMLElement | null;
      if (translateSpan) {
        e.preventDefault();
        setPopup({
          text: translateSpan.textContent || "",
          translation: translateSpan.getAttribute("data-translate") || "",
          x: e.clientX,
          y: e.clientY,
        });
      } else {
        setPopup(null);
      }
    };
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPopup(null);
      }
    };
    container.addEventListener("contextmenu", handleContext);
    document.addEventListener("mousedown", handleClick);
    return () => {
      container.removeEventListener("contextmenu", handleContext);
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  const speak = (text: string) => {
    speakSpanish(text);
  };

  return (
    <div>
      <button onClick={onBack}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-zinc-300 text-zinc-600 hover:bg-zinc-50 transition-colors mb-2"
      >
        <Edit3 className="w-4 h-4" /> Вернуться к редактору
      </button>
      <div ref={containerRef}
        className="text-content min-h-[300px] p-4 border border-zinc-200 rounded-lg bg-white"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {popup && (
        <div ref={popupRef}
          className="fixed z-50 bg-white rounded-xl shadow-xl border border-border p-4 max-w-sm"
          style={{ left: popup.x + 12, top: popup.y + 12 }}
        >
          <p className="text-sm font-semibold text-accent mb-1">{popup.text}</p>
          <p className="text-sm text-muted mb-3">{popup.translation}</p>
          <button onClick={() => speak(popup.text)}
            className="flex items-center gap-1.5 text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors">
            <Volume2 className="w-4 h-4" /> Прослушать
          </button>
        </div>
      )}
    </div>
  );
}
