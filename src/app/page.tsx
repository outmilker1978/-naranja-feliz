import React from "react";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { cookies } from "next/headers";
import { Check, Star, Sparkles, ArrowRight, BookOpen, MessageCircle, Bell, PenLine, BarChart3, GraduationCap, Target, Quote, Flame, Library, Layers, Heart, Globe, Music, Palette, Lightbulb, Users, Book, FileText, Image, Camera, Headphones, Clock, Calendar, Settings, User as UserIcon, Shield, Award, Briefcase, Crown, Feather, Gift, Key, Lock, Mail, Map, Phone, PieChart, Rocket, Search, ThumbsUp, Trophy, Wand, Zap, Smile, Type, Compass, Volume2, Eye, Share2, Coffee, Flag, RefreshCw, Trash2, Upload, Download, Plus, Minus, Edit3, ExternalLink, Grid, List, Sliders, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import SlideshowBackground from "@/components/slideshow-background";
import CarouselSection from "@/components/carousel-section";

const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen, PenLine, MessageCircle, BarChart3, GraduationCap, Target, Sparkles, Flame, Library, Layers, Bell, Star, Heart, Globe, Music, Palette, Lightbulb, Users, Book, FileText, Image, Camera, Headphones, Clock, Calendar, Settings, User: UserIcon, Shield, Award, Briefcase, Crown, Feather, Gift, Key, Lock, Mail, Map, Phone, PieChart, Rocket, Search, ThumbsUp, Trophy, Wand, Zap, Smile, Type, Compass, Volume2, Eye, Share2, Coffee, Flag, RefreshCw, Trash2, Upload, Download, Plus, Minus, Edit3, ExternalLink, Grid, List, Sliders, Video,
};

const CARDS_COLORS = [
  { from: "#FF4D2D", to: "#FF6B4A", icon: "#fff" },
  { from: "#6366F1", to: "#818CF8", icon: "#fff" },
  { from: "#22C55E", to: "#4ADE80", icon: "#fff" },
  { from: "#F59E0B", to: "#FBBF24", icon: "#fff" },
  { from: "#EC4899", to: "#F472B6", icon: "#fff" },
  { from: "#14B8A6", to: "#2DD4BF", icon: "#fff" },
];

const FEATURE_COLORS = [
  { from: "#EEF2FF", to: "#E0E7FF", icon: "#6366F1" },
  { from: "#FFF7ED", to: "#FFEDD5", icon: "#F97316" },
  { from: "#F0FDF4", to: "#DCFCE7", icon: "#22C55E" },
  { from: "#FDF2F8", to: "#FCE7F3", icon: "#EC4899" },
  { from: "#F5F3FF", to: "#EDE9FE", icon: "#8B5CF6" },
  { from: "#FFF1F2", to: "#FFE4E6", icon: "#F43F5E" },
];

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const svc = createServiceClient();

  let sections: any[] = [];
  let news: any[] = [];
  let articles: any[] = [];
  let ads: any[] = [];
  try {
    const [sRes, nRes, aRes, adRes] = await Promise.all([
      svc.from("content").select("*").eq("type", "page_section").eq("status", "published").is("scheduled_at", null).order("sort_order", { ascending: true }),
      svc.from("content").select("*, profiles!inner(id, full_name, avatar_url)").eq("type", "news").eq("status", "published").is("scheduled_at", null).order("created_at", { ascending: false }).limit(6),
      svc.from("content").select("*, profiles!inner(id, full_name, avatar_url)").eq("type", "article").eq("status", "published").is("scheduled_at", null).order("created_at", { ascending: false }).limit(3),
      svc.from("content").select("*").eq("type", "ad").eq("status", "published").is("scheduled_at", null).limit(5),
    ]);
    sections = sRes.data ?? [];
    news = nRes.data ?? [];
    articles = aRes.data ?? [];
    ads = adRes.data ?? [];
  } catch {}

  let courseCount = 0;
  let lessonCount = 0;
  try {
    const [cRes, lRes] = await Promise.all([
      svc.from("courses").select("*", { count: "exact", head: true }),
      svc.from("lessons").select("*", { count: "exact", head: true }),
    ]);
    courseCount = cRes.count ?? 0;
    lessonCount = lRes.count ?? 0;
  } catch {}

  const getSection = (cat: string) => sections?.find(s => s.category === cat);
  const hero = getSection("hero");
  const features = getSection("features");
  const testimonials = getSection("testimonials");
  const faq = getSection("faq");
  const ctaSection = getSection("cta");
  const about = getSection("about");

  let profileName: string | null = null;
  let avatarUrl: string | null = null;
  let enrolledCourses: any[] = [];
  let myCourses: any[] = [];
  let pendingSubmissions: number = 0;
  let isSubActive = false;
  let profileRole: string | null = null;

  if (user) {
    const cookieStore = await cookies();
    const viewRole = cookieStore.get("view_role")?.value;
    const { data: p } = await svc.from("profiles").select("role, full_name, avatar_url, subscription_until").eq("id", user.id).maybeSingle();
    profileName = p?.full_name ?? null;
    avatarUrl = p?.avatar_url ?? null;
    profileRole = p?.role ?? null;
    isSubActive = !!(p?.subscription_until && new Date(p.subscription_until) > new Date());
    const mRole = user.user_metadata?.role;
    const isElevated = p?.role === "teacher" || p?.role === "admin" || mRole === "teacher" || mRole === "admin";
    const isTeacherView = isElevated && (viewRole === "teacher" || !viewRole);

    if (isTeacherView) {
      const { data: mc } = await svc.from("courses").select("id, title, image_url, level, access_mode").eq("created_by", user.id).limit(6);
      myCourses = mc ?? [];
    } else {
      const { data: enrolls } = await supabase.from("enrollments").select("course_id").eq("student_id", user.id);
      const enrolledIds = (enrolls ?? []).map(e => e.course_id);
      if (enrolledIds.length > 0) {
        const { data: ec } = await supabase.from("courses").select("id, title, image_url, level, access_mode").in("id", enrolledIds).limit(6);
        enrolledCourses = ec ?? [];
      }
      const { count } = await svc.from("block_submissions").select("*", { count: "exact", head: true }).eq("student_id", user.id).eq("reviewed", false);
      pendingSubmissions = count ?? 0;
    }
  }

  const { data: allCourses } = await supabase
    .from("courses").select("id, title, image_url, level, description, access_mode")
    .eq("published", true).order("created_at", { ascending: false }).limit(8);

  const sectionEntries: { key: string; order: number; render: () => React.ReactNode }[] = [];

  // Hero
  sectionEntries.push({ key: "hero", order: -99, render: () => (
    <section className="relative flex flex-col items-center text-center px-6 pt-0 pb-6 overflow-hidden min-h-[90vh]">
      <SlideshowBackground />
      <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-accent/15 to-accent/70" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-r from-primary-500/10 to-transparent blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-l from-secondary-400/10 to-transparent blur-3xl" />
      <div className="relative z-10 flex flex-col items-center pt-3 sm:pt-5">
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white max-w-4xl leading-[1.05] tracking-tight break-words" style={{ textShadow: "0 4px 16px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.3)" }}>
          {hero?.content?.title ? hero.content.title : <>Испанский язык<br /><span className="text-gold-400" style={{ textShadow: "0 4px 20px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4)" }}>с огоньком</span></>}
        </h1>
        {(hero?.content?.subtitle) ? (
          <p className="text-base sm:text-xl md:text-2xl text-white mt-8 max-w-2xl mx-auto break-words" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>{hero.content.subtitle}</p>
        ) : (
          <>
            <div className="flex items-center justify-center my-7 w-full max-w-xl mx-auto px-4">
              <svg width="100%" height="100" viewBox="-10 -20 560 120" className="text-white" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                <path d="M 12 40 L 170 40" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
                <path d="M 170 40 L 188 28" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M 170 40 L 188 52" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M 370 40 L 528 40" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
                <path d="M 370 40 L 352 28" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M 370 40 L 352 52" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M 162 32 C 152 18, 145 38, 162 32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                <path d="M 165 46 C 155 56, 148 42, 165 46" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                <path d="M 378 32 C 388 18, 395 38, 378 32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                <path d="M 375 46 C 385 56, 392 42, 375 46" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                <circle cx="270" cy="44" r="26" stroke="currentColor" strokeWidth="3.5" fill="none"/>
                <circle cx="255" cy="33" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <circle cx="287" cy="39" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <circle cx="260" cy="55" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <circle cx="282" cy="52" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <path d="M 270 18 Q 263 10, 270 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <path d="M 270 18 C 256 2, 238 2, 236 10 C 240 20, 256 22, 270 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <path d="M 270 18 C 284 2, 302 2, 304 10 C 300 20, 284 22, 270 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <p className="text-white max-w-3xl mx-auto leading-relaxed px-2" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
              <em className="text-gold-400 font-bold not-italic text-2xl sm:text-4xl md:text-5xl lg:text-6xl block tracking-tight break-words">Motivación en cada gajo</em>
              <span className="block text-lg sm:text-2xl md:text-3xl lg:text-4xl mt-2 font-bold tracking-tight break-words">— мотивация в каждой дольке</span>
            </p>
          </>
        )}
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          {user ? (
            <Link href="/courses" className="btn-gradient btn-lg glow-orange">Перейти к курсам <Sparkles className="w-5 h-5" /></Link>
          ) : (
            <>
              <Link href={hero?.content?.link || "/register"} className="btn-gradient btn-lg glow-orange">{hero?.content?.cta_text ?? "Начать учиться бесплатно"}</Link>
              <Link href="/login" className="btn-ghost btn-lg text-white border-white/30 hover:border-white/60">Войти</Link>
            </>
          )}
        </div>
        <div className="flex items-center justify-center gap-3 mt-6 text-sm text-white flex-wrap">
          {(hero?.content?.stats?.length > 0 ? hero.content.stats as { icon?: string; text?: string; link?: string }[] : [
            { icon: "BookOpen", text: `${courseCount} ${courseCount === 1 ? "курс" : courseCount < 5 ? "курса" : "курсов"}` },
            { icon: "BarChart3", text: `${lessonCount} ${lessonCount === 1 ? "урок" : lessonCount < 5 ? "урока" : "уроков"}` },
            { icon: "Flame", text: "Живые уроки" },
            { icon: "Star", text: "Тарифы", link: "/pricing" },
          ]).map((stat, i) => {
            const IconComp = ICON_MAP[stat.icon || "BookOpen"];
            const content = (
              <>
                {IconComp && <IconComp className="w-4 h-4" />}
                <span>{stat.text}</span>
              </>
            );
            if (stat.link) {
              return <Link key={i} href={stat.link} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors">{content}</Link>;
            }
            return <span key={i} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">{content}</span>;
          })}
        </div>
      </div>
      {user && (() => {
        const role = profileRole || user.user_metadata?.role || "student";
        const isTeacherView = role === "teacher" || role === "admin";
        const heroCards = (hero?.content?.cards as { icon?: string; title?: string; description?: string; link?: string; visibility?: string }[]) ?? [];
        const defaultCards: typeof heroCards = [
          { icon: "MessageCircle", title: "Чат", description: "Задать вопрос, обсудить урок", link: "/tools/chat", visibility: "all" },
          { icon: "Bell", title: "Уведомления", description: "Проверка ответов, новости", link: "/notifications", visibility: "all" },
          { icon: "BookOpen", title: "Мои курсы", description: "Продолжить обучение", link: "/courses", visibility: "all" },
          { icon: "PenLine", title: "Проверка", description: "Ответы студентов на проверку", link: "/admin/submissions", visibility: "teacher" },
        ];
        const cards = heroCards.length > 0 ? heroCards : defaultCards;
        return (
          <div className="relative z-10 w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-stretch gap-3 mt-auto mb-4 px-2 sm:px-0">
            {cards.filter(c => c.visibility === "all" || c.visibility === role || (c.visibility === "student" && !isTeacherView) || (c.visibility === "teacher" && isTeacherView)).map((card, i) => (
              <Link key={i} href={card.link || "#"} className="bg-white/80 backdrop-blur-md rounded-xl p-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group flex flex-col flex-1 min-w-0 gap-3">
                <div className="rounded-xl flex items-center gap-3 p-4" style={{ background: `linear-gradient(135deg, ${CARDS_COLORS[i % CARDS_COLORS.length].from}, ${CARDS_COLORS[i % CARDS_COLORS.length].to})` }}>
                  <div className="w-10 h-10 flex items-center justify-center shrink-0">{(() => { const Ic = ICON_MAP[card.icon || "BookOpen"]; return Ic ? <Ic className="w-5 h-5 sm:w-7 sm:h-7 text-white" /> : <span className="text-lg text-white">{card.icon}</span>; })()}</div>
                  <h3 className="text-lg font-bold text-white">{card.title || ""}</h3>
                </div>
                <div className="flex flex-col flex-1 justify-between text-left">
                  <p className="text-sm text-muted">{card.description || ""}</p>
                  <span className="text-sm font-semibold text-primary-500 mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">Открыть <ArrowRight className="w-4 h-4" /></span>
                </div>
              </Link>
            ))}
          </div>
        );
      })()}
    </section>
  )});

  // Courses
  sectionEntries.push({ key: "courses", order: -50, render: () => (
    <section className="px-6 py-12 max-w-6xl mx-auto w-full">
      <h2 className="text-3xl sm:text-4xl font-bold text-accent text-center mb-6 tracking-tight">Курсы</h2>
      <CarouselSection>
        {(user ? (myCourses.length > 0 ? myCourses : enrolledCourses.length > 0 ? enrolledCourses : []) : allCourses ?? []).slice(0, 8).map((course: any) => (
          <Link key={course.id} href={user ? `/courses/${course.id}` : "/register"} className="card overflow-hidden group flex-shrink-0 w-[85vw] sm:w-[calc(50vw-3rem)] lg:w-[calc(33.333vw-3.5rem)] max-w-sm snap-start">
            <div className="h-44 bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center overflow-hidden">
              {course.image_url ? <img src={course.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                : <span className="text-5xl opacity-30">🍊</span>}
            </div>
            <div className="p-4">
              <h3 className="font-bold text-accent group-hover:text-primary-500 transition-colors">{course.title}</h3>
              {course.description && <p className="text-sm text-muted mt-1 line-clamp-1">{course.description}</p>}
              <div className="flex items-center gap-2 mt-2">
                {course.level && <span className="badge badge-orange">{course.level}</span>}
                {course.access_mode === "subscription" && <span className="badge" style={{ background: "#F3E8FF", color: "#7C3AED" }}>По подписке</span>}
              </div>
            </div>
          </Link>
        ))}
        {(!allCourses || allCourses.length === 0) && !user && (
          <p className="text-center text-muted py-8 w-full">Курсы скоро появятся</p>
        )}
      </CarouselSection>
    </section>
  )});

  // Features
  if (features) sectionEntries.push({ key: "features", order: features.sort_order ?? 1, render: () => (
    <section className="px-6 py-12 max-w-6xl mx-auto w-full">
      <h2 className="text-3xl sm:text-4xl font-bold text-accent text-center mb-6 tracking-tight">
        {features?.content?.title ?? "Почему Naranja Feliz?"}
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {(features?.content?.items?.length > 0
          ? (features.content.items as { icon?: string; title: string; description: string }[])
          : [
              { icon: "BookOpen", title: "Интерактивные уроки", description: "Тексты, аудио, видео, задания — всё для погружения в испанский" },
              { icon: "PenLine", title: "Разнообразные задания", description: "Вставь слово, перетащи ответ, выбери картинку — учись играючи" },
              { icon: "MessageCircle", title: "Проверка преподавателем", description: "Каждое задание проверяет учитель с подробным комментарием" },
              { icon: "BarChart3", title: "Отслеживай прогресс", description: "Дольки показывают, сколько ты уже прошёл" },
              { icon: "MessageCircle", title: "Чат с учителем", description: "Задай вопрос в любое время, не выходя из платформы" },
              { icon: "Layers", title: "Уровни A1–C2", description: "От начального до продвинутого — выбирай свой темп" },
            ]
        ).map((item, i) => {
          const col = FEATURE_COLORS[i % FEATURE_COLORS.length];
          const IconComp = item.icon ? ICON_MAP[item.icon] : undefined;
          return (
          <div key={i} className="card p-4 sm:p-5 text-center hover:-translate-y-1 transition-all duration-300">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3"
              style={{ background: `linear-gradient(135deg, ${col.from}, ${col.to})` }}>
              {IconComp ? <IconComp className="w-5 h-5 sm:w-7 sm:h-7" style={{ color: col.icon }} /> : item.icon ? <span className="text-xl">{item.icon}</span> : null}
            </div>
            <h3 className="text-sm sm:text-lg font-bold text-accent break-words leading-tight">{item.title}</h3>
            <p className="text-xs sm:text-sm text-muted mt-1 sm:mt-2 leading-relaxed">{item.description}</p>
          </div>
          );
        })}
      </div>
    </section>
  )});

  // News
  if (news && news.length > 0) sectionEntries.push({ key: "news", order: Math.min(...news.map((n: any) => n.sort_order ?? 99)), render: () => (
    <section className="px-6 py-12" style={{ backgroundColor: "#F5F5F7" }}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-accent text-center mb-6 tracking-tight">Новости школы</h2>
        <CarouselSection>
          {news.slice(0, 6).map((item: any) => (
            <Link key={item.id} href={`/content/${item.id}`} className="card overflow-hidden group block flex-shrink-0 w-[85vw] sm:w-[calc(50vw-3rem)] lg:w-[calc(33.333vw-3.5rem)] max-w-sm snap-start">
              {item.cover_image && <div className="h-40 overflow-hidden"><img src={item.cover_image} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge badge-orange">Новость</span>
                  <span className="text-xs text-muted">{new Date(item.created_at).toLocaleDateString("ru")}</span>
                </div>
                <h3 className="font-bold text-accent group-hover:text-primary-500 transition-colors">{item.title}</h3>
                {item.excerpt && <p className="text-sm text-muted mt-2 line-clamp-2">{item.excerpt}</p>}
              </div>
            </Link>
          ))}
        </CarouselSection>
      </div>
    </section>
  )});

  // Articles
  if (articles && articles.length > 0) sectionEntries.push({ key: "articles", order: Math.min(...articles.map((a: any) => a.sort_order ?? 99)), render: () => (
    <section className="px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-accent text-center mb-6 tracking-tight">Полезные статьи</h2>
        <CarouselSection>
        {articles.map((item: any) => (
          <Link key={item.id} href={`/content/${item.id}`} className="card overflow-hidden group block flex-shrink-0 w-[85vw] sm:w-[calc(50vw-3rem)] lg:w-[calc(33.333vw-3.5rem)] max-w-sm snap-start">
            {item.cover_image && <div className="h-40 overflow-hidden"><img src={item.cover_image} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>}
            <div className="p-4">
              <span className="badge badge-orange">Статья</span>
              <h3 className="font-bold text-accent mt-1 group-hover:text-primary-500 transition-colors">{item.title}</h3>
              {item.excerpt && <p className="text-sm text-muted mt-2 line-clamp-3">{item.excerpt}</p>}
            </div>
          </Link>
        ))}
      </CarouselSection>
      </div>
    </section>
  )});

  // Ads
  if (ads && ads.length > 0) sectionEntries.push({ key: "ads", order: Math.min(...ads.map((a: any) => a.sort_order ?? 99)), render: () => (
    <section className="px-6 py-12 max-w-6xl mx-auto w-full space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {ads.map((ad: any) => (
          <a key={ad.id} href={ad.content?.link || "#"} target="_blank" rel="noopener noreferrer" className="card overflow-hidden block group">
            {ad.cover_image || ad.content?.image ? (
              <div className="relative">
                <img src={ad.cover_image || ad.content?.image} alt={ad.title}
                  className="w-full h-72 sm:h-80 object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-bold text-xl sm:text-2xl drop-shadow-lg">{ad.title}</p>
                  {ad.content?.caption && <p className="text-white/80 text-sm mt-1">{ad.content.caption}</p>}
                </div>
              </div>
            ) : (
              <div className="h-72 sm:h-80 flex items-center justify-center bg-gradient-to-r from-primary-500 via-orange-500 to-gold-400">
                <p className="text-white font-bold text-2xl">{ad.title || ad.content?.caption || "Реклама"}</p>
              </div>
            )}
          </a>
        ))}
      </div>
    </section>
  )});

  // About
  if (about) sectionEntries.push({ key: "about", order: about.sort_order ?? 1, render: () => (
    <section className="px-6 py-12 max-w-4xl mx-auto text-center">
      <h2 className="text-3xl sm:text-4xl font-bold text-accent mb-3 tracking-tight">{about.content?.title ?? "О школе"}</h2>
      <div className="text-muted leading-relaxed max-w-2xl mx-auto text-lg">{about.content?.text && <p>{about.content.text}</p>}</div>
      {(about.content?.image || about.cover_image) && <div className="overflow-hidden rounded-2xl max-w-lg mx-auto shadow-md"><img src={about.content?.image || about.cover_image} alt="" className="w-full transition-transform duration-500 hover:scale-105" /></div>}
      <div className="mt-6">
        <Link href="/about" className="btn-gradient px-5 py-2.5 text-sm inline-flex items-center gap-1">
          Читать полностью <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )});

  // Testimonials
  if (testimonials?.content?.items?.length > 0) sectionEntries.push({ key: "testimonials", order: testimonials.sort_order ?? 1, render: () => (
    <section className="px-6 py-12" style={{ backgroundColor: "#F5F5F7" }}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-accent text-center mb-6 tracking-tight">{testimonials.content?.title ?? "Отзывы"}</h2>
        <CarouselSection>
          {(testimonials.content.items as { author: string; text: string; avatar?: string }[]).map((item, i) => (
            <div key={i} className="relative overflow-hidden rounded-xl min-h-[28rem] sm:min-h-[32rem] group flex-shrink-0 w-[85vw] sm:w-[calc(50vw-3rem)] lg:w-[calc(33.333vw-3.5rem)] max-w-sm snap-start"
              style={item.avatar ? { backgroundImage: `url(${item.avatar})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}>
              {!item.avatar && <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-xl leading-relaxed italic drop-shadow-lg text-white/95">&ldquo;{item.text}&rdquo;</p>
                <p className="font-bold mt-3 drop-shadow-lg text-base text-white">{item.author}</p>
              </div>
            </div>
          ))}
        </CarouselSection>
      </div>
    </section>
  )});

  // FAQ
  if (faq?.content?.items?.length > 0) sectionEntries.push({ key: "faq", order: faq.sort_order ?? 1, render: () => (
    <section className="px-6 py-12 max-w-3xl mx-auto">
      <h2 className="text-3xl sm:text-4xl font-bold text-accent text-center mb-6 tracking-tight">{faq.content?.title ?? "Частые вопросы"}</h2>
      <div className="space-y-4">
        {(faq.content.items as { question: string; answer: string }[]).map((item, i) => (
          <details key={i} className="card p-5 group open:shadow-md transition-all">
            <summary className="font-bold text-accent cursor-pointer list-none flex items-center justify-between">
              {item.question}
              <span className="text-muted group-open:rotate-180 transition-transform text-sm">▼</span>
            </summary>
            <p className="text-sm text-muted mt-2 leading-relaxed">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )});

  // CTA always last
  sectionEntries.push({ key: "cta", order: 999, render: () => (
    <section className="relative overflow-hidden px-6 py-16 sm:py-20 text-center">
      <div className="absolute inset-0 bg-cover bg-center"
        style={{backgroundImage: `url('${ctaSection?.content?.bg_image || "https://zphehhzgbudetyzezunk.supabase.co/storage/v1/object/public/hero/quino-al-tFbN1bnBynU-unsplash.jpg"}')`}} />
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/85 via-orange-500/85 to-gold-400/85" />
      <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />
      <div className="relative">
        <img src="/logo-128.png" alt="Naranja Feliz" className="w-16 h-16 mx-auto mb-4" />
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{ctaSection?.content?.text ?? "Готов начать?"}</h2>
        <p className="text-lg text-white/80 mt-3 max-w-md mx-auto">{ctaSection?.content?.subtitle ?? "Первый урок — бесплатно. Без обязательств."}</p>
        <Link
          href={ctaSection?.content?.link ?? "/catalog"}
          className="inline-flex btn-gradient btn-lg glow-orange mt-6"
          style={{background: "white", color: "#FF4D2D", boxShadow: "0 4px 20px rgba(0,0,0,0.15)"}}
        >
          {ctaSection?.content?.button_text ?? "К курсам"} <Sparkles className="w-5 h-5" />
        </Link>
      </div>
    </section>
  )});

  sectionEntries.sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col min-h-screen">
      {sectionEntries.map(e => <React.Fragment key={e.key}>{e.render()}</React.Fragment>)}
    </div>
  );
}
