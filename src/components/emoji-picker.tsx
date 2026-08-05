"use client";

import { useState } from "react";
import { Smile } from "lucide-react";
import { emojiImgHtml } from "@/lib/emoji";

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: "Смайлы",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😍", "🥰", "😘", "😋", "😎", "🤩", "🥳", "😏", "😌", "🤗", "🙃", "🤭", "🤔", "🤨", "😐", "😴", "🤤", "😪", "😷", "🤒", "🥴", "🤯", "😳", "🥺", "😢", "😭", "😤", "😡", "🤬", "🤮", "😱", "😨", "😰", "😥", "🤪", "😜", "🤓", "🥸", "👻", "💀", "🤖", "👽", "🎃", "😺", "😸", "😹", "😻", "🙀"],
  },
  {
    label: "Жесты",
    emojis: ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️", "👋", "🤝", "🙏", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "💪", "🤳", "💅", "🫰", "🫶", "👀", "🧠", "🦷", "🦴", "👂", "👃", "👄", "👅"],
  },
  {
    label: "Сердца",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "💌", "✨", "⭐", "🌟", "💫", "🔥", "💥", "⚡", "💯", "🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉", "🎖️", "🏅", "🪙", "💎"],
  },
  {
    label: "Животные",
    emojis: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🦟", "🦂", "🐢", "🐍", "🦎", "🦖", "🐙", "🦑", "🦀", "🐠", "🐟", "🐬", "🐳", "🦈", "🐊", "🦩", "🦜"],
  },
  {
    label: "Еда",
    emojis: ["🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🥑", "🥦", "🥬", "🥒", "🌽", "🥕", "🧄", "🧅", "🥔", "🍠", "🥐", "🥨", "🥯", "🍞", "🥖", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🌭", "🍔", "🍟", "🍕", "🥪", "🌮", "🌯", "🥗", "🍲", "🍜", "🍝", "🍣", "🍤", "🍦", "🍧", "🍨", "🍩", "🍪", "🎂", "🍰", "🧁", "🍫", "🍬", "🍭", "🍯", "☕", "🍵", "🥤", "🍺", "🍷"],
  },
  {
    label: "Активности",
    emojis: ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸", "🥅", "🏒", "🏑", "🥍", "🏏", "⛳", "🏹", "🎣", "🥊", "🥋", "🎽", "⛸️", "🥌", "🎿", "⛷️", "🏂", "🏋️", "🤸", "🤺", "🤾", "🏌️", "🏇", "🧘", "🏄", "🏊", "🤽", "🚣", "🧗", "🚵", "🚴", "🏆", "🥇", "🥈", "🥉", "🎮", "🕹️", "🎲", "🎯", "🎳", "🎸", "🎹", "🎺", "🎻", "🥁", "🎤", "🎧", "🎬", "🎨", "🎭", "📚", "✏️", "📝"],
  },
  {
    label: "Символы",
    emojis: ["✅", "❌", "❎", "➰", "➿", "❗", "❕", "❓", "❔", "‼️", "⁉️", "⚠️", "🔅", "🔆", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "🟤", "⚫", "⚪", "🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "⬛", "⬜", "🔶", "🔷", "🔸", "🔹", "🔺", "🔻", "🔘", "🔗", "🔒", "🔓", "🔑", "🔨", "🛠️", "⚙️", "🧲", "💡", "🔦", "🕯️", "📌", "📍", "📎", "📏", "✂️", "🖍️", "🖊️", "📞", "📱", "💻", "⌚", "⏰", "📅", "📈", "📊", "📁", "🗂️", "📂", "📚", "📖"],
  },
  {
    label: "Природа",
    emojis: ["☀️", "🌤️", "⛅", "🌥️", "☁️", "🌦️", "🌧️", "⛈️", "🌩️", "🌨️", "❄️", "☃️", "⛄", "🌬️", "💨", "🌪️", "🌫️", "🌈", "☔", "💧", "💦", "🌊", "🌋", "🏔️", "🗻", "🏕️", "🌄", "🌅", "🌇", "🌆", "🌃", "🌉", "🌁", "🌌", "🌠", "🌃", "🏞️", "🌳", "🌲", "🌴", "🌵", "🌾", "🌿", "🍀", "🍁", "🍂", "🍃", "🌸", "🌺", "🌻", "🌼", "🌷", "🌹", "🥀", "🌎", "🌍", "🌏"],
  },
];

function EmojiImg({ emoji }: { emoji: string }) {
  return <span dangerouslySetInnerHTML={{ __html: emojiImgHtml(emoji) }} />;
}

export function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState(0);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title="Вставить смайлик"
        className={`p-1.5 rounded transition-colors ${open ? "bg-primary-200 text-accent" : "text-zinc-600 hover:bg-primary-50 hover:text-primary-500"}`}
      >
        <Smile className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 bg-white rounded-xl shadow-xl border border-zinc-200 p-2 w-72">
            <div className="flex gap-1 mb-2 flex-wrap">
              {EMOJI_GROUPS.map((g, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setGroup(i)}
                  className={`w-7 h-7 rounded flex items-center justify-center text-sm transition-colors ${i === group ? "bg-primary-100" : "hover:bg-zinc-100"}`}
                  title={g.label}
                >
                  <EmojiImg emoji={g.emojis[0]} />
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wide">{EMOJI_GROUPS[group].label}</span>
              <button type="button" onClick={() => setOpen(false)} className="text-[10px] text-zinc-400 hover:text-zinc-600">✕</button>
            </div>
            <div className="grid grid-cols-8 gap-0.5 max-h-52 overflow-y-auto">
              {EMOJI_GROUPS[group].emojis.map((e, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { onSelect(e); }}
                  className="w-8 h-8 rounded flex items-center justify-center hover:bg-primary-50 transition-colors"
                >
                  <EmojiImg emoji={e} />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
