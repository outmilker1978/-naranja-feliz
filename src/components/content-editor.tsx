"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { BookOpen, PenLine, MessageCircle, BarChart3, GraduationCap, Target, Sparkles, Flame, Library, Layers, Bell, Star, Heart, Globe, Music, Palette, Lightbulb, Users, Check, ArrowRight, Book, FileText, Image, Camera, Headphones, Clock, Calendar, Settings, Shield, Award, Briefcase, Crown, Feather, Gift, Key, Lock, Mail, Map, Phone, PieChart, Rocket, Search, ThumbsUp, Trophy, Wand, Zap, Smile, Type, Compass, Volume2, Eye, Share2, Coffee, Flag, RefreshCw, Trash2, Upload, Download, Plus, Minus, Edit3, ExternalLink, Grid, List, Sliders, Video } from "lucide-react";

const ICONS = [
  { name: "BookOpen", comp: BookOpen },
  { name: "PenLine", comp: PenLine },
  { name: "MessageCircle", comp: MessageCircle },
  { name: "BarChart3", comp: BarChart3 },
  { name: "GraduationCap", comp: GraduationCap },
  { name: "Target", comp: Target },
  { name: "Sparkles", comp: Sparkles },
  { name: "Flame", comp: Flame },
  { name: "Library", comp: Library },
  { name: "Layers", comp: Layers },
  { name: "Bell", comp: Bell },
  { name: "Star", comp: Star },
  { name: "Heart", comp: Heart },
  { name: "Globe", comp: Globe },
  { name: "Music", comp: Music },
  { name: "Palette", comp: Palette },
  { name: "Lightbulb", comp: Lightbulb },
  { name: "Users", comp: Users },
  { name: "Book", comp: Book },
  { name: "Camera", comp: Camera },
  { name: "Headphones", comp: Headphones },
  { name: "Award", comp: Award },
  { name: "Crown", comp: Crown },
  { name: "Rocket", comp: Rocket },
  { name: "Trophy", comp: Trophy },
  { name: "Zap", comp: Zap },
  { name: "Compass", comp: Compass },
  { name: "Coffee", comp: Coffee },
  { name: "Smile", comp: Smile },
  { name: "Eye", comp: Eye },
];

const TYPES: { value: string; label: string }[] = [
  { value: "news", label: "Новость" },
  { value: "article", label: "Статья" },
  { value: "ad", label: "Реклама" },
  { value: "page_section", label: "Секция страницы" },
  { value: "teacher", label: "Преподаватель" },
];

const CATEGORIES: Record<string, { value: string; label: string }[]> = {
  page_section: [
    { value: "hero", label: "Hero — главный экран (заголовок, подзаголовок, кнопка)" },
    { value: "features", label: "Преимущества — блок «Почему Naranja Feliz?» (карточки с иконками)" },
    { value: "about", label: "О школе" },
    { value: "testimonials", label: "Отзывы" },
    { value: "faq", label: "Вопросы и ответы" },
    { value: "cta", label: "CTA — призыв к действию" },
  ],
};



const CATEGORY_HELP: Record<string, string> = {
  hero: "Редактирование главного экрана: большой заголовок, подзаголовок (по умолчанию «Motivación en cada gajo»), текст кнопки. Слайд-шоу и статистика (кол-во курсов/уроков) — автоматические.",
  features: "Блок «Почему Naranja Feliz?» — карточки преимуществ. Редактируется заголовок секции и до 6 карточек с иконкой, заголовком, описанием и ссылкой.",
  about: "Текст и фото о школе.",
  testimonials: "Отзывы учеников: имя, текст, аватар.",
  faq: "Частые вопросы: вопрос + ответ.",
  cta: "Призыв к действию: текст, кнопка, ссылка.",
};

interface Props {
  initial?: any;
  blockId?: string;
}

export default function ContentEditor({ initial, blockId }: Props) {
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
  const [uploadingAd, setUploadingAd] = useState(false);
  const [uploadingAbout, setUploadingAbout] = useState(false);
  const [uploadingCtaBg, setUploadingCtaBg] = useState(false);

  // page_section fields
  const [sectionTitle, setSectionTitle] = useState(initial?.content?.title ?? "");
  const [sectionSubtitle, setSectionSubtitle] = useState(initial?.content?.subtitle ?? "");
  const [ctaText, setCtaText] = useState(initial?.content?.cta_text ?? "");
  const [ctaLink, setCtaLink] = useState(initial?.content?.link ?? "");
  const [buttonText, setButtonText] = useState(initial?.content?.button_text ?? "");
  const [articleButtonIcon, setArticleButtonIcon] = useState(initial?.content?.button_icon ?? "");
  const [aboutText, setAboutText] = useState(initial?.content?.text ?? "");
  const [aboutImage, setAboutImage] = useState(initial?.content?.image ?? "");
  const [aboutButtonText, setAboutButtonText] = useState(initial?.content?.button_text ?? "");
  const [aboutButtonIcon, setAboutButtonIcon] = useState(initial?.content?.button_icon ?? "");
  const [ctaBgImage, setCtaBgImage] = useState(initial?.content?.bg_image ?? "");
  const [heroStats, setHeroStats] = useState<{ icon: string; text: string; link?: string }[]>(
    initial?.content?.stats && Array.isArray(initial.content.stats) && initial.content.stats.length > 0
      ? initial.content.stats
      : [{ icon: "BookOpen", text: "1 курс", link: "" }, { icon: "BarChart3", text: "10 уроков", link: "" }, { icon: "Flame", text: "Живые уроки", link: "" }, { icon: "Star", text: "Тарифы", link: "/pricing" }]
  );
  const [heroCards, setHeroCards] = useState<{ icon: string; title: string; description: string; link: string; visibility: string }[]>(
    initial?.content?.cards && Array.isArray(initial.content.cards) && initial.content.cards.length > 0
      ? initial.content.cards
      : [{ icon: "MessageCircle", title: "Чат", description: "Задать вопрос, обсудить урок", link: "/tools/chat", visibility: "all" }, { icon: "Bell", title: "Уведомления", description: "Проверка ответов, новости", link: "/notifications", visibility: "all" }, { icon: "BookOpen", title: "Мои курсы", description: "Продолжить обучение", link: "/courses", visibility: "all" }, { icon: "PenLine", title: "Проверка", description: "Ответы студентов на проверку", link: "/admin/submissions", visibility: "teacher" }]
  );

  const [features, setFeatures] = useState<{ icon: string; title: string; description: string; link?: string; visibility?: string }[]>(
    initial?.content?.items && Array.isArray(initial.content.items) && initial.content.items.length > 0
      ? initial.content.items
      : []
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
  const [adButtonText, setAdButtonText] = useState(initial?.content?.button_text ?? "");

  // teacher fields
  const [teacherPhotos, setTeacherPhotos] = useState<string[]>(initial?.content?.photos ?? []);
  const [teacherQuote, setTeacherQuote] = useState(initial?.content?.quote ?? "");
  const [teacherBio, setTeacherBio] = useState(initial?.content?.text ?? "");
  const [teacherSocialVk, setTeacherSocialVk] = useState(initial?.content?.social?.vk ?? "");
  const [teacherSocialTg, setTeacherSocialTg] = useState(initial?.content?.social?.telegram ?? "");
  const [teacherSocialEmail, setTeacherSocialEmail] = useState(initial?.content?.social?.email ?? "");
  const [uploadingTeacherPhoto, setUploadingTeacherPhoto] = useState(false);

  useEffect(() => {
    const cats = CATEGORIES[type];
    if (cats && cats.length > 0 && !cats.find(c => c.value === category)) {
      setCategory(cats[0].value);
    }
  }, [type]);

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload-file", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
    return null;
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    const url = await uploadFile(file);
    if (url) setCoverImage(url);
    setUploading(false);
  };

  const handleUploadAd = async (file: File) => {
    setUploadingAd(true);
    const url = await uploadFile(file);
    if (url) setAdImage(url);
    setUploadingAd(false);
  };

  const handleUploadAbout = async (file: File) => {
    setUploadingAbout(true);
    const url = await uploadFile(file);
    if (url) setAboutImage(url);
    setUploadingAbout(false);
  };

  const handleUploadCtaBg = async (file: File) => {
    setUploadingCtaBg(true);
    const url = await uploadFile(file);
    if (url) setCtaBgImage(url);
    setUploadingCtaBg(false);
  };

  const buildContent = () => {
    if (type === "page_section") {
      switch (category) {
        case "hero": return { title: sectionTitle, subtitle: sectionSubtitle, cta_text: ctaText, link: ctaLink, stats: heroStats, cards: heroCards };
        case "features": return { title: sectionTitle, items: features };
        case "about": return { title: sectionTitle, text: aboutText, image: aboutImage, button_text: aboutButtonText || undefined, button_icon: aboutButtonIcon || undefined };
        case "testimonials": return { title: sectionTitle, items: testimonials };
        case "faq": return { title: sectionTitle, items: faqItems };
        case "cta": return { text: sectionTitle, subtitle: sectionSubtitle, button_text: buttonText, link: ctaLink, bg_image: ctaBgImage || undefined };
        default: return {};
      }
    }
    if (type === "ad") return { image: adImage, link: adLink, caption: adCaption, button_text: adButtonText || undefined };
    if (type === "teacher") {
      const social: Record<string, string> = {};
      if (teacherSocialVk) social.vk = teacherSocialVk;
      if (teacherSocialTg) social.telegram = teacherSocialTg;
      if (teacherSocialEmail) social.email = teacherSocialEmail;
      return { photos: teacherPhotos, quote: teacherQuote, text: teacherBio, social };
    }
    if (type === "article") {
      return { blocks: [{ type: "text", value: fullText || excerpt }], button_text: buttonText || undefined, button_icon: articleButtonIcon || undefined };
    }
    if (type === "news") {
      return { blocks: [{ type: "text", value: fullText || excerpt }] };
    }
    return [];
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const isSection = type === "page_section";
    const body: Record<string, any> = { type, status, scheduled_at: scheduledAt || null };
    if (isSection) {
      body.category = category;
      body.title = sectionTitle || category;
    } else {
      body.title = title;
      body.category = null;
    }
    if (type === "news" || type === "article") {
      body.excerpt = excerpt;
      body.cover_image = coverImage || undefined;
    }
    if (type === "teacher") {
      body.excerpt = excerpt;
      body.cover_image = null;
    }
    if (type === "ad") {
      body.cover_image = null;
    }
    body.content = buildContent();
    if (blockId) body.block_id = blockId;
    const url = initial?.id ? `/api/content/${initial.id}` : "/api/content";
    const method = initial?.id ? "PUT" : "POST";
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
        {type === "page_section" && (
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Категория</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="glass-input w-full px-3 py-2 rounded-lg text-sm">
              {(CATEGORIES[type] ?? []).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {CATEGORY_HELP[category] && <p className="text-xs text-zinc-400 mt-1">{CATEGORY_HELP[category]}</p>}
          </div>
        )}
      </div>

      {/* Title */}
      {type !== "page_section" && (
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Заголовок</label>
          <input value={title} onChange={e => setTitle(e.target.value)} autoComplete="off" name="content-title"
            className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
        </div>
      )}

      {/* Excerpt (for news/article) */}
      {(type === "news" || type === "article") && (
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Краткое описание (показывается в карточке)</label>
          <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2} className="glass-input w-full px-3 py-2 rounded-lg text-sm resize-none" />
        </div>
      )}

      {/* Button text & icon — only for articles */}
      {type === "article" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Текст кнопки</label>
            <input value={buttonText} onChange={e => setButtonText(e.target.value)} placeholder="Читать"
              className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Иконка кнопки</label>
            <div className="flex flex-wrap gap-1">
              <button type="button" onClick={() => setArticleButtonIcon("")}
                className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all text-xs text-zinc-400 ${!articleButtonIcon ? "border-primary-500 bg-primary-50 scale-110" : "border-zinc-200 hover:border-zinc-300"}`}>✕</button>
              {ICONS.map(ic => (
                <button key={ic.name} type="button" onClick={() => setArticleButtonIcon(ic.name)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${articleButtonIcon === ic.name ? "border-primary-500 bg-primary-50 scale-110" : "border-zinc-200 hover:border-zinc-300"}`}>
                  <ic.comp className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cover image — only for news/articles */}
      {(type === "news" || type === "article") && (
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
          {coverImage && <img src={coverImage} alt="" loading="lazy" className="mt-2 h-32 rounded-lg object-cover bg-zinc-100" />}
        </div>
      )}

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
              <p className="text-xs text-zinc-400 -mt-2">Настройка главного экрана (Hero). Если не заполнять — покажутся стандартные заголовки.</p>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Большой заголовок (H1)</label>
                <input value={sectionTitle} onChange={e => setSectionTitle(e.target.value)} placeholder='По умолчанию: "Испанский язык с огоньком"'
                  className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
                <p className="text-[10px] text-zinc-400 mt-0.5">Заменяет весь главный заголовок. Можно использовать HTML-теги.</p>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Подзаголовок</label>
                <input value={sectionSubtitle} onChange={e => setSectionSubtitle(e.target.value)} placeholder='Если оставить пустым — покажется "Motivación en cada gajo — мотивация в каждой дольке" с графикой'
                  className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
                <p className="text-[10px] text-zinc-400 mt-0.5">Если заполнить — заменит стандартный блок с графикой на обычный текст.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Текст кнопки (для неавторизованных)</label>
                  <input value={ctaText} onChange={e => setCtaText(e.target.value)} placeholder="По умолчанию: Начать учиться бесплатно"
                    className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Ссылка кнопки</label>
                  <input value={ctaLink} onChange={e => setCtaLink(e.target.value)} placeholder="/register"
                    className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-2">Статистика (4 пилюли под кнопками)</label>
                <p className="text-[10px] text-zinc-400 -mt-1 mb-2">Иконка, текст, ссылка. По умолчанию: кол-во курсов/уроков (из БД), «Живые уроки», «Тарифы».</p>
                  <div className="space-y-2">
                  {heroStats.map((s, i) => (
                    <div key={i} className="bg-white rounded-lg p-3 border border-zinc-200 relative">
                      <button onClick={() => setHeroStats(heroStats.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-xs text-red-400 hover:text-red-600">✕</button>
                      <div className="grid gap-2 pr-6">
                        <div>
                          <label className="block text-xs text-zinc-400 mb-0.5">Иконка</label>
                          <div className="flex flex-wrap gap-1">
                            {ICONS.map(ic => (
                              <button key={ic.name} type="button" onClick={() => { const c = [...heroStats]; c[i] = { ...c[i], icon: ic.name }; setHeroStats(c); }}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${s.icon === ic.name ? "border-primary-500 bg-primary-50 scale-110" : "border-zinc-200 hover:border-zinc-300"}`}>
                                <ic.comp className="w-4 h-4" />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-zinc-400 mb-0.5">Текст</label>
                            <input value={s.text ?? ""} onChange={e => { const c = [...heroStats]; c[i] = { ...c[i], text: e.target.value }; setHeroStats(c); }}
                              placeholder="1 курс" className="glass-input w-full px-2 py-1.5 rounded text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-400 mb-0.5">Ссылка (необязательно)</label>
                            <input value={s.link ?? ""} onChange={e => { const c = [...heroStats]; c[i] = { ...c[i], link: e.target.value }; setHeroStats(c); }}
                              placeholder="/pricing" className="glass-input w-full px-2 py-1.5 rounded text-sm" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {heroStats.length < 4 && (
                    <button onClick={() => setHeroStats([...heroStats, { icon: "BookOpen", text: "", link: "" }])}
                      className="text-xs text-primary-500 hover:underline">+ Добавить пилюлю</button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-2">Карточки быстрого доступа (для авторизованных)</label>
                <p className="text-[10px] text-zinc-400 -mt-1 mb-2">Макс 6. Показываются под Hero после входа. Иконка, заголовок, описание, ссылка, видимость.</p>
                <div className="space-y-3">
                  {heroCards.map((c, i) => (
                    <div key={i} className="bg-white rounded-lg p-3 border border-zinc-200 relative">
                      <button onClick={() => setHeroCards(heroCards.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-xs text-red-400 hover:text-red-600">✕</button>
                      <div className="grid gap-2 pr-6">
                        <div>
                          <label className="block text-xs text-zinc-400 mb-0.5">Иконка</label>
                          <div className="flex flex-wrap gap-1">
                            {ICONS.map(ic => (
                              <button key={ic.name} type="button" onClick={() => { const nc = [...heroCards]; nc[i] = { ...nc[i], icon: ic.name }; setHeroCards(nc); }}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${c.icon === ic.name ? "border-primary-500 bg-primary-50 scale-110" : "border-zinc-200 hover:border-zinc-300"}`}>
                                <ic.comp className="w-4 h-4" />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-400 mb-0.5">Заголовок</label>
                          <input value={c.title ?? ""} onChange={e => { const nc = [...heroCards]; nc[i] = { ...nc[i], title: e.target.value }; setHeroCards(nc); }}
                            placeholder="Чат" className="glass-input w-full px-2 py-1.5 rounded-lg text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-400 mb-0.5">Описание</label>
                          <input value={c.description ?? ""} onChange={e => { const nc = [...heroCards]; nc[i] = { ...nc[i], description: e.target.value }; setHeroCards(nc); }}
                            placeholder="Задать вопрос, обсудить урок" className="glass-input w-full px-2 py-1.5 rounded-lg text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-zinc-400 mb-0.5">Ссылка</label>
                            <input value={c.link ?? ""} onChange={e => { const nc = [...heroCards]; nc[i] = { ...nc[i], link: e.target.value }; setHeroCards(nc); }}
                              placeholder="/tools/chat" className="glass-input w-full px-2 py-1.5 rounded-lg text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-400 mb-0.5">Показывать</label>
                            <select value={c.visibility ?? "all"} onChange={e => { const nc = [...heroCards]; nc[i] = { ...nc[i], visibility: e.target.value }; setHeroCards(nc); }}
                              className="glass-input w-full px-2 py-1.5 rounded-lg text-sm">
                              <option value="all">Всем (ученик + учитель)</option>
                              <option value="teacher">Только учителям/админам</option>
                              <option value="student">Только ученикам</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {heroCards.length < 6 && (
                    <button onClick={() => setHeroCards([...heroCards, { icon: "BookOpen", title: "", description: "", link: "", visibility: "all" }])}
                      className="text-xs text-primary-500 hover:underline">+ Добавить карточку</button>
                  )}
                </div>
              </div>
            </>
          )}

          {category === "features" && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-400">⚠️ Это НЕ Hero. Hero — это самый верх страницы (заголовок + кнопки). А это блок <strong>«Почему Naranja Feliz?»</strong> — карточки преимуществ, до 6 шт. Показываются ПОСЛЕ курсов, ниже Hero.</p>
              <div className="space-y-3">
                {features.map((f, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 border border-zinc-200 relative">
                    <button onClick={() => setFeatures(features.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-xs text-red-400 hover:text-red-600">✕</button>
                    <div className="grid gap-2 pr-6">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-0.5">Иконка</label>
                          <div className="flex flex-wrap gap-1">
                            {ICONS.map(ic => (
                              <button key={ic.name} type="button" onClick={() => { const c = [...features]; c[i] = { ...c[i], icon: ic.name }; setFeatures(c); }}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${f.icon === ic.name ? "border-primary-500 bg-primary-50 scale-110" : "border-zinc-200 hover:border-zinc-300"}`}>
                                <ic.comp className="w-4 h-4" />
                              </button>
                            ))}
                          </div>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-0.5">Заголовок</label>
                        <input value={f.title ?? ""} onChange={e => { const c = [...features]; c[i] = { ...c[i], title: e.target.value }; setFeatures(c); }}
                          placeholder="Название" className="glass-input w-full px-2 py-1.5 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-0.5">Описание</label>
                        <input value={f.description ?? ""} onChange={e => { const c = [...features]; c[i] = { ...c[i], description: e.target.value }; setFeatures(c); }}
                          placeholder="Текст" className="glass-input w-full px-2 py-1.5 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-0.5">Ссылка (необязательно)</label>
                        <input value={f.link ?? ""} onChange={e => { const c = [...features]; c[i] = { ...c[i], link: e.target.value }; setFeatures(c); }}
                          placeholder="/courses" className="glass-input w-full px-2 py-1.5 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-0.5">Показывать</label>
                        <select value={f.visibility ?? "all"} onChange={e => { const c = [...features]; c[i] = { ...c[i], visibility: e.target.value }; setFeatures(c); }}
                          className="glass-input w-full px-2 py-1.5 rounded-lg text-sm">
                          <option value="all">Всем</option>
                          <option value="teacher">Только учителям/админам</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {features.length < 6 && (
                <button onClick={() => setFeatures([...features, { icon: "BookOpen", title: "", description: "", link: "", visibility: "all" }])}
                  className="text-xs text-primary-500 hover:underline">+ Добавить карточку</button>
              )}
              {features.length >= 6 && <p className="text-xs text-zinc-400">Максимум 6 карточек</p>}
            </div>
          )}

          {category === "about" && (
            <>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Текст о школе</label>
                <textarea value={aboutText} onChange={e => setAboutText(e.target.value)} rows={4} className="glass-input w-full px-3 py-2 rounded-lg text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Текст кнопки</label>
                  <input value={aboutButtonText} onChange={e => setAboutButtonText(e.target.value)} placeholder="Подробнее"
                    className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Иконка кнопки</label>
                  <div className="flex flex-wrap gap-1">
                    <button type="button" onClick={() => setAboutButtonIcon("")}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all text-xs text-zinc-400 ${!aboutButtonIcon ? "border-primary-500 bg-primary-50 scale-110" : "border-zinc-200 hover:border-zinc-300"}`}>✕</button>
                    {ICONS.map(ic => (
                      <button key={ic.name} type="button" onClick={() => setAboutButtonIcon(ic.name)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${aboutButtonIcon === ic.name ? "border-primary-500 bg-primary-50 scale-110" : "border-zinc-200 hover:border-zinc-300"}`}>
                        <ic.comp className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Фото</label>
                <div className="flex gap-2">
                  <input value={aboutImage} onChange={e => setAboutImage(e.target.value)} placeholder="URL или загрузи файл"
                    className="glass-input flex-1 px-3 py-2 rounded-lg text-sm" />
                  <label className="bg-zinc-100 text-zinc-600 px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-zinc-200 whitespace-nowrap">
                    {uploadingAbout ? "..." : "Загрузить"}
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadAbout(f); }} />
                  </label>
                </div>
                {aboutImage && <img src={aboutImage} alt="" loading="lazy" className="mt-2 h-32 rounded-lg object-cover bg-zinc-100" />}
              </div>
            </>
          )}

          {category === "testimonials" && (
            <ArrayEditor
              label="Отзывы"
              fields={[
                { key: "author", label: "Имя", placeholder: "Мария" },
                { key: "text", label: "Текст отзыва", placeholder: "..." },
                { key: "avatar", label: "Фото", placeholder: "URL или загрузи файл", optional: true, isImage: true },
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
              <p className="text-xs text-zinc-400 -mt-2">Отображается после всех секций, перед подвалом. Фон — изображение по умолчанию (можно заменить URL).</p>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Заголовок</label>
                <input value={sectionTitle} onChange={e => setSectionTitle(e.target.value)} placeholder="Готов начать?"
                  className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Подзаголовок</label>
                <input value={sectionSubtitle} onChange={e => setSectionSubtitle(e.target.value)} placeholder="Первый урок — бесплатно. Без обязательств."
                  className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Текст кнопки</label>
                  <input value={buttonText} onChange={e => setButtonText(e.target.value)} placeholder="К курсам"
                    className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Ссылка кнопки</label>
                  <input value={ctaLink} onChange={e => setCtaLink(e.target.value)} placeholder="/catalog"
                    className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Фон (изображение)</label>
                <div className="flex gap-2">
                  <input value={ctaBgImage} onChange={e => setCtaBgImage(e.target.value)} placeholder="URL или загрузи файл"
                    className="glass-input flex-1 px-3 py-2 rounded-lg text-sm" />
                  <label className="bg-zinc-100 text-zinc-600 px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-zinc-200 whitespace-nowrap">
                    {uploadingCtaBg ? "..." : "Загрузить"}
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadCtaBg(f); }} />
                  </label>
                </div>
                {ctaBgImage && <img src={ctaBgImage} alt="" loading="lazy" className="mt-2 h-32 rounded-lg object-cover bg-zinc-100" />}
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

      {/* === TEACHER FIELDS === */}
      {type === "teacher" && (
        <div className="border border-primary-100 rounded-xl p-4 space-y-4 bg-primary-50/30">
          <p className="text-xs font-medium text-primary-600 uppercase">Карточка преподавателя</p>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Краткое описание (для списка)</label>
            <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2} className="glass-input w-full px-3 py-2 rounded-lg text-sm resize-none" />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Фотографии</label>
            <div className="flex gap-2 mb-2">
              <input id="teacher-photo-input" type="file" accept="image/*" className="hidden"
                onChange={async e => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setUploadingTeacherPhoto(true);
                  const url = await uploadFile(f);
                  if (url) setTeacherPhotos([...teacherPhotos, url]);
                  setUploadingTeacherPhoto(false);
                  e.target.value = "";
                }} />
              <button onClick={() => document.getElementById("teacher-photo-input")?.click()} disabled={uploadingTeacherPhoto}
                className="bg-zinc-100 text-zinc-600 px-4 py-2 rounded-lg text-sm hover:bg-zinc-200 disabled:opacity-50">
                {uploadingTeacherPhoto ? "..." : "+ Добавить фото"}
              </button>
            </div>
            {teacherPhotos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {teacherPhotos.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="" loading="lazy" className="w-20 h-20 rounded-lg object-cover border border-zinc-200" />
                    <button onClick={() => setTeacherPhotos(teacherPhotos.filter((_, idx) => idx !== i))}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Цитата</label>
            <textarea value={teacherQuote} onChange={e => setTeacherQuote(e.target.value)} rows={2} className="glass-input w-full px-3 py-2 rounded-lg text-sm resize-none" />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Биография</label>
            <textarea value={teacherBio} onChange={e => setTeacherBio(e.target.value)} rows={4} className="glass-input w-full px-3 py-2 rounded-lg text-sm resize-none" />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-2">Социальные сети</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm w-24 text-zinc-500">VK</span>
                <input value={teacherSocialVk} onChange={e => setTeacherSocialVk(e.target.value)} placeholder="https://vk.com/..." className="glass-input flex-1 px-3 py-2 rounded-lg text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm w-24 text-zinc-500">Telegram</span>
                <input value={teacherSocialTg} onChange={e => setTeacherSocialTg(e.target.value)} placeholder="@nickname" className="glass-input flex-1 px-3 py-2 rounded-lg text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm w-24 text-zinc-500">Почта</span>
                <input value={teacherSocialEmail} onChange={e => setTeacherSocialEmail(e.target.value)} placeholder="email@example.com" className="glass-input flex-1 px-3 py-2 rounded-lg text-sm" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === AD FIELDS === */}
      {type === "ad" && (
        <div className="border border-primary-100 rounded-xl p-4 space-y-4 bg-primary-50/30">
          <p className="text-xs font-medium text-primary-600 uppercase">Рекламный баннер</p>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Изображение</label>
            <div className="flex gap-2">
              <input value={adImage} onChange={e => setAdImage(e.target.value)} placeholder="URL или загрузи файл"
                className="glass-input flex-1 px-3 py-2 rounded-lg text-sm" />
              <label className="bg-zinc-100 text-zinc-600 px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-zinc-200 whitespace-nowrap">
                {uploadingAd ? "..." : "Загрузить"}
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadAd(f); }} />
              </label>
            </div>
            {adImage && <img src={adImage} alt="" loading="lazy" className="mt-2 h-32 rounded-lg object-cover bg-zinc-100" />}
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Подпись</label>
            <input value={adCaption} onChange={e => setAdCaption(e.target.value)} autoComplete="off" name="ad-caption"
              className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Текст кнопки (стикер)</label>
            <input value={adButtonText} onChange={e => setAdButtonText(e.target.value)} placeholder="Жми" autoComplete="off" name="ad-btn"
              className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Ссылка</label>
            <input value={adLink} onChange={e => setAdLink(e.target.value)} autoComplete="off" name="ad-link"
              className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
          </div>
        </div>
      )}

      {/* Status + Schedule */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Статус</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setStatus("draft")}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${status === "draft" ? "bg-zinc-200 text-zinc-700" : "bg-zinc-100 text-zinc-400 hover:bg-zinc-150"}`}>
              Черновик
            </button>
            <button type="button" onClick={() => setStatus("published")}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${status === "published" ? "bg-green-200 text-green-800" : "bg-zinc-100 text-zinc-400 hover:bg-zinc-150"}`}>
              Опубликован
            </button>
          </div>
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
        <button onClick={handleSave} disabled={saving || (type !== "page_section" && !title.trim())}
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
  fields: { key: string; label: string; placeholder: string; optional?: boolean; isImage?: boolean }[];
  items: any[];
  onChange: (items: any[]) => void;
}) {
  const [uploadingIdx, setUploadingIdx] = useState<{ i: number; key: string } | null>(null);
  const add = () => onChange([...items, Object.fromEntries(fields.map(f => [f.key, ""]))]);
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i: number, key: string, val: string) => {
    const copy = [...items];
    copy[i] = { ...copy[i], [key]: val };
    onChange(copy);
  };
  const handleUpload = async (i: number, key: string, file: File) => {
    setUploadingIdx({ i, key });
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload-file", { method: "POST", body: formData });
      if (res.ok) { const d = await res.json(); if (d.url) update(i, key, d.url); }
    } catch {}
    setUploadingIdx(null);
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
                  <div className="flex gap-2">
                    <input value={item[f.key] ?? ""} onChange={e => update(i, f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="glass-input flex-1 px-2 py-1.5 rounded text-sm" />
                    {f.isImage && (
                      <label className="bg-zinc-100 text-zinc-600 px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:bg-zinc-200 whitespace-nowrap shrink-0">
                        {uploadingIdx?.i === i && uploadingIdx?.key === f.key ? "..." : "Загрузить"}
                        <input type="file" accept="image/*" className="hidden" onChange={e => { const fl = e.target.files?.[0]; if (fl) handleUpload(i, f.key, fl); }} />
                      </label>
                    )}
                  </div>
                  {f.isImage && item[f.key] && <img src={item[f.key]} alt="" loading="lazy" className="mt-1 h-20 rounded-lg object-cover bg-zinc-100" />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
