"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const TYPES: { value: string; label: string }[] = [
  { value: "news", label: "Новость" },
  { value: "article", label: "Статья" },
  { value: "ad", label: "Реклама" },
  { value: "page_section", label: "Секция страницы" },
];

const CATEGORIES: Record<string, { value: string; label: string }[]> = {
  news: [{ value: "announcement", label: "Анонс" }, { value: "event", label: "Мероприятие" }, { value: "achievement", label: "Достижение" }],
  article: [{ value: "grammar", label: "Грамматика" }, { value: "culture", label: "Культура" }, { value: "tips", label: "Советы" }],
  ad: [{ value: "banner", label: "Баннер" }, { value: "promo", label: "Акция" }],
  page_section: [
    { value: "hero", label: "Hero — шапка сайта" },
    { value: "features", label: "Преимущества (карточки)" },
    { value: "about", label: "О школе" },
    { value: "testimonials", label: "Отзывы" },
    { value: "faq", label: "Вопросы и ответы" },
    { value: "cta", label: "CTA — призыв к действию" },
  ],
};

const CATEGORY_HELP: Record<string, string> = {
  hero: "Заголовок, подзаголовок, текст кнопки. Появляется в самом верху главной.",
  features: "Список карточек с иконкой, заголовком и описанием. Показывается после Hero.",
  about: "Текст и фото о школе.",
  testimonials: "Отзывы учеников: имя, текст, аватар.",
  faq: "Частые вопросы: вопрос + ответ.",
  cta: "Призыв к действию: текст, кнопка, ссылка.",
};

interface Props {
  initial?: any;
}

export default function ContentEditor({ initial }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [type, setType] = useState(initial?.type ?? "news");
  const [category, setCategory] = useState(initial?.category ?? "announcement");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [coverImage, setCoverImage] = useState(initial?.cover_image ?? "");
  const [status, setStatus] = useState(initial?.status ?? "draft");
  const [scheduledAt, setScheduledAt] = useState(
    initial?.scheduled_at ? new Date(initial.scheduled_at).toISOString().slice(0, 16) : ""
  );

  const [uploading, setUploading] = useState(false);

  // page_section fields
  const [sectionTitle, setSectionTitle] = useState(initial?.content?.title ?? "");
  const [sectionSubtitle, setSectionSubtitle] = useState(initial?.content?.subtitle ?? "");
  const [ctaText, setCtaText] = useState(initial?.content?.cta_text ?? "");
  const [ctaLink, setCtaLink] = useState(initial?.content?.link ?? "");
  const [buttonText, setButtonText] = useState(initial?.content?.button_text ?? "");
  const [aboutText, setAboutText] = useState(initial?.content?.text ?? "");
  const [aboutImage, setAboutImage] = useState(initial?.content?.image ?? "");

  const [features, setFeatures] = useState<{ icon: string; title: string; description: string }[]>(
    initial?.content?.items ?? []
  );
  const [testimonials, setTestimonials] = useState<{ author: string; text: string; avatar: string }[]>(
    initial?.content?.items ?? []
  );
  const [faqItems, setFaqItems] = useState<{ question: string; answer: string }[]>(
    initial?.content?.items ?? []
  );

  const [fullText, setFullText] = useState("");
  const [adImage, setAdImage] = useState(initial?.content?.image ?? "");
  const [adLink, setAdLink] = useState(initial?.content?.link ?? "");
  const [adCaption, setAdCaption] = useState(initial?.content?.caption ?? "");

  useEffect(() => {
    const cats = CATEGORIES[type];
    if (cats && cats.length > 0 && !cats.find(c => c.value === category)) {
      setCategory(cats[0].value);
    }
  }, [type]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload-file", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      setCoverImage(data.url);
    }
    setUploading(false);
  };

  const buildContent = () => {
    if (type === "page_section") {
      switch (category) {
        case "hero": return { title: sectionTitle, subtitle: sectionSubtitle, cta_text: ctaText, link: ctaLink };
        case "features": return { title: sectionTitle, items: features };
        case "about": return { title: sectionTitle, text: aboutText, image: aboutImage };
        case "testimonials": return { title: sectionTitle, items: testimonials };
        case "faq": return { title: sectionTitle, items: faqItems };
        case "cta": return { text: sectionTitle, subtitle: sectionSubtitle, button_text: buttonText, link: ctaLink };
        default: return {};
      }
    }
    if (type === "ad") return { image: adImage, link: adLink, caption: adCaption };
    return type === "news" || type === "article"
      ? [{ type: "text", value: fullText || excerpt }]
      : [];
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const body = {
      type,
      category,
      title,
      excerpt,
      cover_image: coverImage || undefined,
      content: buildContent(),
      status,
      scheduled_at: scheduledAt || null,
    };
    const url = initial ? `/api/content/${initial.id}` : "/api/content";
    const method = initial ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) { const e = await res.json(); setError(e.error ?? "Ошибка"); setSaving(false); return; }
    router.push("/admin/content");
  };

  return (
    <div className="space-y-5">
      {/* Type + Category */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Тип материала</label>
          <select value={type} onChange={e => setType(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg text-sm">
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Категория</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg text-sm">
            {(CATEGORIES[type] ?? []).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          {CATEGORY_HELP[category] && <p className="text-xs text-zinc-400 mt-1">{CATEGORY_HELP[category]}</p>}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Заголовок</label>
        <input value={title} onChange={e => setTitle(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
      </div>

      {/* Excerpt (for news/article) */}
      {(type === "news" || type === "article") && (
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Краткое описание (показывается в карточке)</label>
          <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2} className="glass-input w-full px-3 py-2 rounded-lg text-sm resize-none" />
        </div>
      )}

      {/* Cover image */}
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Обложка</label>
        <div className="flex gap-2">
          <input value={coverImage} onChange={e => setCoverImage(e.target.value)} placeholder="URL или загрузи файл"
            className="glass-input flex-1 px-3 py-2 rounded-lg text-sm" />
          <label className="bg-zinc-100 text-zinc-600 px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-zinc-200 whitespace-nowrap">
            {uploading ? "..." : "Загрузить"}
            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
          </label>
        </div>
        {coverImage && <img src={coverImage} alt="" className="mt-2 h-32 rounded-lg object-cover bg-zinc-100" />}
      </div>

      {/* === PAGE SECTION FIELDS === */}
      {type === "page_section" && (
        <div className="border border-primary-100 rounded-xl p-4 space-y-4 bg-primary-50/30">
          <p className="text-xs font-medium text-primary-600 uppercase">Поля секции</p>

          {(category === "hero" || category === "features" || category === "about" || category === "testimonials" || category === "faq") && (
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Заголовок секции</label>
              <input value={sectionTitle} onChange={e => setSectionTitle(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
            </div>
          )}

          {category === "hero" && (
            <>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Подзаголовок</label>
                <input value={sectionSubtitle} onChange={e => setSectionSubtitle(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Текст кнопки</label>
                  <input value={ctaText} onChange={e => setCtaText(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Ссылка кнопки</label>
                  <input value={ctaLink} onChange={e => setCtaLink(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
                </div>
              </div>
            </>
          )}

          {category === "features" && (
            <ArrayEditor
              label="Карточки преимуществ"
              fields={[
                { key: "icon", label: "Иконка (emoji)", placeholder: "📚" },
                { key: "title", label: "Заголовок", placeholder: "Название" },
                { key: "description", label: "Описание", placeholder: "Текст" },
              ]}
              items={features}
              onChange={setFeatures}
            />
          )}

          {category === "about" && (
            <>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Текст о школе</label>
                <textarea value={aboutText} onChange={e => setAboutText(e.target.value)} rows={4} className="glass-input w-full px-3 py-2 rounded-lg text-sm resize-none" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Фото (URL)</label>
                <input value={aboutImage} onChange={e => setAboutImage(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
              </div>
            </>
          )}

          {category === "testimonials" && (
            <ArrayEditor
              label="Отзывы"
              fields={[
                { key: "author", label: "Имя", placeholder: "Мария" },
                { key: "text", label: "Текст отзыва", placeholder: "..." },
                { key: "avatar", label: "Аватар (URL)", placeholder: "https://...", optional: true },
              ]}
              items={testimonials}
              onChange={setTestimonials}
            />
          )}

          {category === "faq" && (
            <ArrayEditor
              label="Вопросы и ответы"
              fields={[
                { key: "question", label: "Вопрос", placeholder: "..." },
                { key: "answer", label: "Ответ", placeholder: "..." },
              ]}
              items={faqItems}
              onChange={setFaqItems}
            />
          )}

          {category === "cta" && (
            <>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Подзаголовок</label>
                <input value={sectionSubtitle} onChange={e => setSectionSubtitle(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Текст кнопки</label>
                  <input value={buttonText} onChange={e => setButtonText(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Ссылка</label>
                  <input value={ctaLink} onChange={e => setCtaLink(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* === ARTICLE / NEWS FULL TEXT === */}
      {(type === "news" || type === "article") && (
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Полный текст материала</label>
          <textarea value={fullText} onChange={e => setFullText(e.target.value)} rows={8}
            className="glass-input w-full px-3 py-2 rounded-lg text-sm resize-none" />
        </div>
      )}

      {/* === AD FIELDS === */}
      {type === "ad" && (
        <div className="border border-primary-100 rounded-xl p-4 space-y-4 bg-primary-50/30">
          <p className="text-xs font-medium text-primary-600 uppercase">Рекламный баннер</p>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Изображение (URL)</label>
            <input value={adImage} onChange={e => setAdImage(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Подпись</label>
            <input value={adCaption} onChange={e => setAdCaption(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Ссылка</label>
            <input value={adLink} onChange={e => setAdLink(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
          </div>
        </div>
      )}

      {/* Status + Schedule */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Статус</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg text-sm">
            <option value="draft">Черновик (не видно никому)</option>
            <option value="published">Опубликован</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">
            Запланировать публикацию
            <span className="text-zinc-300 ml-1">(пусто — сразу)</span>
          </label>
          <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
            className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving || !title.trim()}
          className="bg-primary-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50">
          {saving ? "Сохранение..." : initial ? "Сохранить изменения" : "Создать"}
        </button>
        <Link href="/admin/content" className="bg-zinc-100 text-zinc-700 px-6 py-2 rounded-lg text-sm hover:bg-zinc-200">
          Отмена
        </Link>
      </div>
    </div>
  );
}

function ArrayEditor({ label, fields, items, onChange }: {
  label: string;
  fields: { key: string; label: string; placeholder: string; optional?: boolean }[];
  items: any[];
  onChange: (items: any[]) => void;
}) {
  const add = () => onChange([...items, Object.fromEntries(fields.map(f => [f.key, ""]))]);
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i: number, key: string, val: string) => {
    const copy = [...items];
    copy[i] = { ...copy[i], [key]: val };
    onChange(copy);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-500">{label}</span>
        <button onClick={add} className="text-xs text-primary-500 hover:underline">+ Добавить</button>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="bg-white rounded-lg p-3 border border-zinc-200 relative">
            <button onClick={() => remove(i)} className="absolute top-2 right-2 text-xs text-red-400 hover:text-red-600">✕</button>
            <div className="grid gap-2 pr-6">
              {fields.map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-zinc-400 mb-0.5">{f.label}{f.optional ? " (необязательно)" : ""}</label>
                  <input value={item[f.key] ?? ""} onChange={e => update(i, f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="glass-input w-full px-2 py-1.5 rounded-lg text-sm" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
