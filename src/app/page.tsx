import { createClient, createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { cookies } from "next/headers";
import { Check, Star, Sparkles, ArrowRight, BookOpen, MessageCircle, Bell, PenLine, BarChart3, GraduationCap, Target, Quote, Flame } from "lucide-react";
import SlideshowBackground from "@/components/slideshow-background";
import CarouselSection from "@/components/carousel-section";

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
      svc.from("content").select("*").eq("type", "page_section").eq("status", "published").is("scheduled_at", null),
      svc.from("content").select("*, profiles!inner(id, full_name, avatar_url)").eq("type", "news").eq("status", "published").is("scheduled_at", null).order("created_at", { ascending: false }).limit(6),
      svc.from("content").select("*, profiles!inner(id, full_name, avatar_url)").eq("type", "article").eq("status", "published").is("scheduled_at", null).order("created_at", { ascending: false }).limit(3),
      svc.from("content").select("*").eq("type", "ad").eq("status", "published").is("scheduled_at", null).limit(5),
    ]);
    sections = sRes.data ?? [];
    news = nRes.data ?? [];
    articles = aRes.data ?? [];
    ads = adRes.data ?? [];
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

  if (user) {
    const cookieStore = await cookies();
    const viewRole = cookieStore.get("view_role")?.value;
    const { data: p } = await svc.from("profiles").select("role, full_name, avatar_url").eq("id", user.id).maybeSingle();
    profileName = p?.full_name ?? null;
    avatarUrl = p?.avatar_url ?? null;
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

  return (
    <div className="flex flex-col min-h-screen">

      {/* Hero — photo from top edge to "Курсы" section */}
      <section className="relative flex flex-col items-center text-center px-6 pt-0 pb-6 overflow-hidden min-h-[90vh]">
        <SlideshowBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-accent/15 to-accent/70" />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-r from-primary-500/10 to-transparent blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-l from-secondary-400/10 to-transparent blur-3xl" />
        {/* Title block at top */}
        <div className="relative z-10 flex flex-col items-center pt-3 sm:pt-5">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white max-w-4xl leading-[1.05] tracking-tight" style={{ textShadow: "0 4px 16px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.3)" }}>
            {hero?.content?.title ? hero.content.title : <>Испанский язык<br /><span className="text-gold-400" style={{ textShadow: "0 4px 20px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4)" }}>с огоньком</span></>}
          </h1>
          {(hero?.content?.subtitle) ? (
            <p className="text-xl sm:text-2xl text-white mt-8 max-w-2xl mx-auto" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>{hero.content.subtitle}</p>
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
              <p className="text-white max-w-3xl mx-auto leading-relaxed" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
                <em className="text-gold-400 font-bold not-italic text-4xl sm:text-5xl lg:text-6xl block tracking-tight">Motivación en cada gajo</em>
                <span className="block text-2xl sm:text-3xl lg:text-4xl mt-2 font-bold tracking-tight">— мотивация в каждой дольке</span>
              </p>
            </>
          )}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            {user ? (
              <Link href="/courses" className="btn-gradient btn-lg glow-orange">Перейти к курсам <Sparkles className="w-5 h-5" /></Link>
            ) : (
              <>
                <Link href="/register" className="btn-gradient btn-lg glow-orange">{hero?.content?.cta_text ?? "Начать учиться бесплатно"}</Link>
                <Link href="/login" className="btn-ghost btn-lg text-white border-white/30 hover:border-white/60">Войти</Link>
              </>
            )}
          </div>
          <div className="flex items-center justify-center gap-5 mt-6 text-sm text-white/80">
            <span className="flex items-center gap-1.5" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}><Check className="w-4 h-4 text-secondary-400" /> 500+ учеников</span>
            <span className="flex items-center gap-1.5" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}><Star className="w-4 h-4 text-gold-400" /> 4.9 рейтинг</span>
            <span className="flex items-center gap-1.5" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}><Flame className="w-4 h-4 text-gold-400" /> Живые уроки</span>
          </div>
        </div>
        {/* Quick access cards — pushed to bottom */}
        {user && (
          <div className="relative z-10 w-full max-w-5xl mx-auto flex items-stretch justify-center gap-3 mt-auto mb-4">
            {myCourses.length > 0 && (
              <Link href="/courses" className="bg-white/80 backdrop-blur-md rounded-xl p-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group flex flex-col flex-1 min-w-0 gap-3">
                <div className="rounded-xl bg-gradient-to-br from-primary-500 to-primary-400 flex items-center gap-3 p-4">
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0"><BookOpen className="w-5 h-5 text-white" /></div>
                  <h3 className="text-lg font-bold text-white">Мои курсы</h3>
                </div>
                <div className="flex flex-col flex-1 justify-between text-left">
                  <p className="text-sm text-muted">{myCourses.length} курс{myCourses.length > 1 ? "ов" : ""}</p>
                  <span className="text-sm font-semibold text-primary-500 mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">Управлять <ArrowRight className="w-4 h-4" /></span>
                </div>
              </Link>
            )}
            {enrolledCourses.length > 0 && (
              <Link href="/courses" className="bg-white/80 backdrop-blur-md rounded-xl p-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group flex flex-col flex-1 min-w-0 gap-3">
                <div className="rounded-xl bg-gradient-to-br from-gold-400 to-orange-500 flex items-center gap-3 p-4">
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0"><GraduationCap className="w-5 h-5 text-white" /></div>
                  <h3 className="text-lg font-bold text-white">Обучение</h3>
                </div>
                <div className="flex flex-col flex-1 justify-between text-left">
                  <p className="text-sm text-muted">
                    {enrolledCourses.length} курс{enrolledCourses.length > 1 ? "ов" : ""}
                    {pendingSubmissions > 0 && <><span className="mx-1.5 text-muted">·</span><PenLine className="w-3.5 h-3.5 inline text-secondary-600" /> {pendingSubmissions}</>}
                  </p>
                  <span className="text-sm font-semibold text-primary-500 mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">Перейти <ArrowRight className="w-4 h-4" /></span>
                </div>
              </Link>
            )}
            <Link href="/tools/chat" className="bg-white/80 backdrop-blur-md rounded-xl p-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group flex flex-col flex-1 min-w-0 gap-3">
              <div className="rounded-xl bg-gradient-to-br from-secondary-400 to-secondary-500 flex items-center gap-3 p-4">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0"><MessageCircle className="w-5 h-5 text-white" /></div>
                <h3 className="text-lg font-bold text-white">Чат</h3>
              </div>
              <div className="flex flex-col flex-1 justify-between">
                <p className="text-sm text-muted">Задать вопрос, обсудить урок</p>
                <span className="text-sm font-semibold text-primary-500 mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">Открыть <ArrowRight className="w-4 h-4" /></span>
              </div>
            </Link>
            <Link href="/notifications" className="bg-white/80 backdrop-blur-md rounded-xl p-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group flex flex-col flex-1 min-w-0 gap-3">
              <div className="rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center gap-3 p-4">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0"><Bell className="w-5 h-5 text-white" /></div>
                <h3 className="text-lg font-bold text-white">Уведомления</h3>
              </div>
              <div className="flex flex-col flex-1 justify-between">
                <p className="text-sm text-muted">Проверка ответов, новости</p>
                <span className="text-sm font-semibold text-primary-500 mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">Открыть <ArrowRight className="w-4 h-4" /></span>
              </div>
            </Link>
            {myCourses.length > 0 && (
              <Link href="/admin/submissions" className="bg-white/80 backdrop-blur-md rounded-xl p-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group flex flex-col flex-1 min-w-0 gap-3">
                <div className="rounded-xl bg-gradient-to-br from-primary-500 to-orange-400 flex items-center gap-3 p-4">
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0"><PenLine className="w-5 h-5 text-white" /></div>
                  <h3 className="text-lg font-bold text-white">Проверка</h3>
                </div>
                <div className="flex flex-col flex-1 justify-between text-left">
                  <p className="text-sm text-muted">Ответы студентов на проверку</p>
                  <span className="text-sm font-semibold text-primary-500 mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">Открыть <ArrowRight className="w-4 h-4" /></span>
                </div>
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Courses */}
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

      {/* Features */}
      <section className="px-6 py-12 max-w-6xl mx-auto w-full">
        <h2 className="text-3xl sm:text-4xl font-bold text-accent text-center mb-6 tracking-tight">
          {features?.content?.title ?? "Почему Naranja Feliz?"}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(features?.content?.items?.length > 0
            ? (features.content.items as { icon?: string; title: string; description: string }[])
            : [
                { title: "Интерактивные уроки", description: "Тексты, аудио, видео, задания — всё для погружения в испанский" },
                { title: "Разнообразные задания", description: "Вставь слово, перетащи ответ, выбери картинку — учись играючи" },
                { title: "Проверка преподавателем", description: "Каждое задание проверяет учитель с подробным комментарием" },
                { title: "Отслеживай прогресс", description: "Дольки показывают, сколько ты уже прошёл" },
                { title: "Чат с учителем", description: "Задай вопрос в любое время, не выходя из платформы" },
                { title: "Уровни A1–C2", description: "От начального до продвинутого — выбирай свой темп" },
              ]
          ).map((item, i) => (
            <div key={i} className="card p-5 text-center hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center mx-auto mb-3">
                {i === 0 ? <BookOpen className="w-7 h-7 text-primary-500" /> :
                 i === 1 ? <PenLine className="w-7 h-7 text-primary-500" /> :
                 i === 2 ? <MessageCircle className="w-7 h-7 text-primary-500" /> :
                 i === 3 ? <BarChart3 className="w-7 h-7 text-primary-500" /> :
                 i === 4 ? <MessageCircle className="w-7 h-7 text-primary-500" /> :
                 <Target className="w-7 h-7 text-primary-500" />}
              </div>
              <h3 className="text-lg font-bold text-accent">{item.title}</h3>
              <p className="text-sm text-muted mt-2 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* News */}
      {news && news.length > 0 && (
        <section className="px-6 py-12" style={{ backgroundColor: "#F5F5F7" }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-accent text-center mb-6 tracking-tight">Новости школы</h2>
            <CarouselSection>
              {news.slice(0, 6).map(item => (
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
      )}

      {/* Articles */}
      {articles && articles.length > 0 && (
        <section className="px-6 py-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-accent text-center mb-6 tracking-tight">Полезные статьи</h2>
            <CarouselSection>
            {articles.map(item => (
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
      )}

      {/* Ads */}
      {ads && ads.length > 0 && ads.map(ad => (
        <section key={ad.id} className="px-6 py-6 max-w-4xl mx-auto">
          <a href={ad.content?.link || "#"} target="_blank" rel="noopener noreferrer" className="card overflow-hidden block group">
            {ad.cover_image || ad.content?.image ? (
              <img src={ad.cover_image || ad.content?.image} alt={ad.title} className="w-full h-52 object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="h-40 flex items-center justify-center bg-gradient-to-r from-primary-500 via-orange-500 to-gold-400">
                <p className="text-white font-bold text-xl">{ad.title || ad.content?.caption || "Реклама"}</p>
              </div>
            )}
            {ad.content?.caption && <div className="p-4 text-center text-sm text-muted">{ad.content.caption}</div>}
          </a>
        </section>
      ))}

      {/* About */}
      {about && (
        <section className="px-6 py-12 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-accent mb-3 tracking-tight">{about.content?.title ?? "О школе"}</h2>
          <div className="text-muted leading-relaxed max-w-2xl mx-auto text-lg">{about.content?.text && <p>{about.content.text}</p>}</div>
          {about.cover_image && <div className="overflow-hidden rounded-2xl max-w-lg mx-auto shadow-md"><img src={about.cover_image} alt="" className="w-full transition-transform duration-500 hover:scale-105" /></div>}
        </section>
      )}

      {/* Testimonials */}
      {testimonials?.content?.items?.length > 0 && (
        <section className="px-6 py-12" style={{ backgroundColor: "#F5F5F7" }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-accent text-center mb-6 tracking-tight">{testimonials.content?.title ?? "Отзывы"}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {(testimonials.content.items as { author: string; text: string; avatar?: string }[]).map((item, i) => (
                <div key={i} className="card p-5 flex flex-col">
                  <Quote className="w-7 h-7 text-primary-200 mb-2" />
                  <p className="text-sm text-muted italic leading-relaxed">&ldquo;{item.text}&rdquo;</p>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                    {item.avatar ? <img src={item.avatar} alt="" className="w-11 h-11 rounded-full object-cover" />
                      : <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center text-white font-bold">{item.author[0]}</div>}
                    <span className="font-bold text-accent">{item.author}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faq?.content?.items?.length > 0 && (
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
      )}

      {/* CTA */}
      <section className="relative overflow-hidden px-6 py-16 sm:py-20 text-center">
        <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: "url('/images/bg/quino-al-tFbN1bnBynU-unsplash.jpg')"}} />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/85 via-orange-500/85 to-gold-400/85" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />
        <div className="relative">
          <span className="text-6xl sm:text-7xl block mb-4 animate-float" style={{ animation: 'float 7s ease-in-out infinite' }}>🍊</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{ctaSection?.content?.text ?? "Готов начать?"}</h2>
          <p className="text-lg text-white/80 mt-3 max-w-md mx-auto">{ctaSection?.content?.subtitle ?? "Первый урок — бесплатно. Без обязательств."}</p>
          <Link
            href={ctaSection?.content?.link ?? (user ? "/courses" : "/register")}
            className="inline-flex btn-gradient btn-lg glow-orange mt-6"
            style={{background: "white", color: "#FF4D2D", boxShadow: "0 4px 20px rgba(0,0,0,0.15)"}}
          >
            {ctaSection?.content?.button_text ?? (user ? "К курсам" : "Записаться →")} <Sparkles className="w-5 h-5" />
          </Link>
        </div>
      </section>


    </div>
  );
}
