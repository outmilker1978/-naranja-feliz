import { GraduationCap, BookOpen, MessageCircle, Bell, Settings, Search, ArrowRight, Check, Star, Sun, Sparkles, Heart, Zap, Globe, Trophy, Flame } from "lucide-react";
import Link from "next/link";

export default function DesignPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-24">

        {/* Header */}
        <section>
          <div className="flex items-center gap-4 mb-3">
            <span className="text-4xl">🍊</span>
            <h1 className="text-5xl font-bold text-accent tracking-tight">Naranja Feliz</h1>
          </div>
          <p className="text-xl text-muted max-w-2xl">Дизайн-система — энергия солнца, страсть Испании, сочность апельсина</p>
          <div className="flex gap-3 mt-4">
            <span className="badge badge-orange">v3.0</span>
            <span className="badge badge-gray">Испанский огонь</span>
          </div>
        </section>

        {/* Brand story */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 via-orange-500 to-gold-300 p-12 sm:p-16 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <Flame className="w-10 h-10 mb-4 text-gold-200" strokeWidth={1.5} />
            <h2 className="text-4xl font-bold mb-4 tracking-tight">Цвет бренда</h2>
            <p className="text-lg text-white/80 max-w-xl">
              Красно-оранжевый испанского флага и южного солнца. Апельсиновые ноты — как акценты тепла и уюта. Фон — натуральный пергамент.
            </p>
          </div>
        </section>

        {/* Colors */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-accent tracking-tight">Цвета</h2>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
            {["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"].map(s => (
              <div key={s} className="space-y-1">
                <div className="h-20 rounded-2xl" style={{ backgroundColor: `var(--color-primary-${s})` }} />
                <p className="text-xs text-muted text-center">primary-{s}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-3">
            <div className="space-y-1">
              <div className="h-20 rounded-2xl" style={{ backgroundColor: "#FF8C2E" }} />
              <p className="text-xs text-muted text-center">orange-500</p>
            </div>
            <div className="space-y-1">
              <div className="h-20 rounded-2xl" style={{ backgroundColor: "#DBA500" }} />
              <p className="text-xs text-muted text-center">gold-500</p>
            </div>
            <div className="space-y-1">
              <div className="h-20 rounded-2xl" style={{ backgroundColor: "#1A1A2E" }} />
              <p className="text-xs text-muted text-center">accent</p>
            </div>
            <div className="space-y-1">
              <div className="h-20 rounded-2xl" style={{ backgroundColor: "#FEFCF9" }} />
              <p className="text-xs text-muted text-center">surface</p>
            </div>
            <div className="space-y-1">
              <div className="h-20 rounded-2xl" style={{ backgroundColor: "#3DDC84" }} />
              <p className="text-xs text-muted text-center">secondary (лист)</p>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-accent tracking-tight">Типографика</h2>
          <div className="card p-10 space-y-8">
            <div>
              <p className="text-xs text-muted mb-2">H1 — 56px Bold</p>
              <h1 className="text-6xl sm:text-7xl font-bold text-accent tracking-tight leading-[1.05]">Заголовок<br />страницы</h1>
            </div>
            <div>
              <p className="text-xs text-muted mb-2">H2 — 36px Bold</p>
              <h2 className="text-4xl font-bold text-accent tracking-tight">Секция на странице</h2>
            </div>
            <div>
              <p className="text-xs text-muted mb-2">H3 — 28px Bold</p>
              <h3 className="text-3xl font-bold text-accent tracking-tight">Заголовок карточки</h3>
            </div>
            <div>
              <p className="text-xs text-muted mb-2">Body — 17px / 1.75 line-height</p>
              <p className="text-[1.0625rem] text-muted leading-relaxed max-w-2xl">
                Испанский язык — это не просто набор правил и слов. Это ключ к целому миру: музыке, литературе, общению с 500 миллионами человек по всему миру. Каждый урок приближает тебя к новой культуре.
              </p>
            </div>
            <div>
              <p className="text-xs text-muted mb-2">Body small — 14px</p>
              <p className="text-sm text-muted">Вспомогательный текст, подписи, мета-информация</p>
            </div>
          </div>
        </section>

        {/* Buttons — bigger */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-accent tracking-tight">Кнопки</h2>
          <div className="card p-10 space-y-10">
            <div className="space-y-4">
              <p className="text-sm font-semibold text-accent">Основные (btn-gradient)</p>
              <div className="flex flex-wrap gap-5 items-center">
                <button className="btn-gradient btn-lg">Начать учиться</button>
                <button className="btn-gradient">Попробовать бесплатно</button>
                <button className="btn-gradient btn-sm">Ok</button>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-sm font-semibold text-accent">Второстепенные (btn-ghost)</p>
              <div className="flex flex-wrap gap-5 items-center">
                <button className="btn-ghost btn-lg">Войти</button>
                <button className="btn-ghost">Подробнее о курсе</button>
                <button className="btn-ghost btn-sm">Отмена</button>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-sm font-semibold text-accent">С иконками</p>
              <div className="flex flex-wrap gap-5 items-center">
                <button className="btn-gradient btn-lg"><GraduationCap className="w-6 h-6" /> Мои курсы</button>
                <button className="btn-ghost btn-lg"><BookOpen className="w-6 h-6" /> Словарь</button>
                <button className="btn-gradient"><Sparkles className="w-6 h-6" /> Продолжить урок</button>
                <button className="btn-ghost"><Globe className="w-5 h-5" /> Выбрать язык</button>
                <button className="btn-gradient btn-sm"><Check className="w-5 h-5" /> Готово</button>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-sm font-semibold text-accent">Специальные</p>
              <div className="flex flex-wrap gap-5 items-center">
                <button className="btn-gradient btn-lg" style={{background: "linear-gradient(135deg, #DBA500 0%, #F5C800 100%)", boxShadow: "0 4px 14px rgba(219, 165, 0, 0.4)"}}>
                  <Trophy className="w-6 h-6" /> Премиум
                </button>
                <button className="btn-ghost btn-lg" style={{borderColor: "#DBA500", color: "#DBA500"}}>
                  <Star className="w-5 h-5" /> В избранное
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Cards — bigger */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-accent tracking-tight">Карточки</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center">
                <GraduationCap className="w-16 h-16 text-white/80" strokeWidth={1.5} />
              </div>
              <div className="p-6 space-y-3">
                <h3 className="text-xl font-bold text-accent">Испанский A1</h3>
                <p className="text-sm text-muted">Базовый курс для начинающих. 12 уроков с интерактивной практикой и проверкой.</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="badge badge-orange">A1 — Начальный</span>
                  <span className="text-sm font-bold text-primary-500 flex items-center gap-1">Продолжить <ArrowRight className="w-4 h-4" /></span>
                </div>
              </div>
            </div>
            <div className="card overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-secondary-400 to-primary-400 flex items-center justify-center">
                <MessageCircle className="w-16 h-16 text-white/80" strokeWidth={1.5} />
              </div>
              <div className="p-6 space-y-3">
                <h3 className="text-xl font-bold text-accent">Разговорный клуб</h3>
                <p className="text-sm text-muted">Практика с носителями языка. Каждую неделю новые темы и обсуждения.</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="badge badge-green">По подписке</span>
                  <span className="text-sm font-bold text-primary-500 flex items-center gap-1">Записаться <ArrowRight className="w-4 h-4" /></span>
                </div>
              </div>
            </div>
            <div className="card overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-primary-500 to-orange-300 flex items-center justify-center">
                <Zap className="w-16 h-16 text-white/80" strokeWidth={1.5} />
              </div>
              <div className="p-6 space-y-3">
                <h3 className="text-xl font-bold text-accent">Грамматика</h3>
                <p className="text-sm text-muted">45% пройдено</p>
                <div className="w-full bg-primary-100 rounded-full h-3">
                  <div className="bg-gradient-to-r from-primary-500 to-primary-400 h-3 rounded-full" style={{ width: "45%" }} />
                </div>
                <span className="text-xs text-muted">4 из 8 уроков</span>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-bold text-accent pt-4">Glass-карточки</h3>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="glass-card p-8 space-y-3">
              <h3 className="text-xl font-bold text-accent">Прозрачный стиль</h3>
              <p className="text-sm text-muted">Для использования поверх градиентов и фонов</p>
            </div>
            <div className="glass-card p-8 space-y-3" style={{ background: "rgba(255,255,255,0.65)" }}>
              <h3 className="text-xl font-bold text-accent">Light вариант</h3>
              <p className="text-sm text-muted">Более прозрачный, для hero-секций</p>
            </div>
          </div>
        </section>

        {/* Badges */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-accent tracking-tight">Бейджи</h2>
          <div className="card p-8 flex flex-wrap gap-3">
            <span className="badge badge-orange">A1 — Начальный</span>
            <span className="badge badge-orange">A2 — Элементарный</span>
            <span className="badge badge-green">Опубликован</span>
            <span className="badge badge-gray">Черновик</span>
            <span className="badge" style={{ background: "#F3E8FF", color: "#7C3AED" }}>По подписке</span>
            <span className="badge badge-green">✓ Пройден</span>
            <span className="badge" style={{ background: "linear-gradient(135deg, #FFF8F0, #FFEAD0)", color: "#FF8C2E" }}>🍊 Апельсиновый</span>
            <span className="badge flex items-center gap-1" style={{ background: "#FFF0ED", color: "#FF4D2D" }}><Sparkles className="w-3.5 h-3.5" /> Новинка</span>
          </div>
        </section>

        {/* Forms */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-accent tracking-tight">Формы</h2>
          <div className="card p-10 space-y-6 max-w-lg">
            <div>
              <label className="block text-sm font-bold text-accent mb-2">Email</label>
              <input type="email" placeholder="you@example.com" className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-bold text-accent mb-2">Пароль</label>
              <input type="password" placeholder="••••••••" className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-bold text-accent mb-2">Уровень</label>
              <select className="w-full">
                <option>A1 — Начальный</option>
                <option>A2 — Элементарный</option>
                <option>B1 — Средний</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-accent mb-2">О себе</label>
              <textarea rows={3} placeholder="Расскажите о своих целях..." className="w-full" />
            </div>
            <div className="flex gap-3 pt-2">
              <button className="btn-gradient flex-1">Отправить</button>
              <button className="btn-ghost flex-1">Отмена</button>
            </div>
          </div>
        </section>

        {/* Gradients */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-accent tracking-tight">Градиенты</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { from: "#FF4D2D", to: "#FF6B4A", label: "Испанский огонь" },
              { from: "#FF4D2D", to: "#FF8C2E", label: "Огонь → Апельсин" },
              { from: "#FF8C2E", to: "#DBA500", label: "Апельсин → Золото" },
              { from: "#FF4D2D", to: "#DBA500", label: "Огонь → Золото" },
              { from: "#1A1A2E", to: "#2D2D4E", label: "Тёмный" },
              { from: "#DBA500", to: "#F5C800", label: "Золотой" },
            ].map((g, i) => (
              <div key={i} className="h-28 rounded-2xl flex items-end p-5 text-white font-bold text-base"
                style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}>
                {g.label}
              </div>
            ))}
          </div>
        </section>

        {/* Icons */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-accent tracking-tight">Иконки</h2>
          <div className="card p-8 grid grid-cols-6 sm:grid-cols-10 gap-8">
            {[GraduationCap, BookOpen, MessageCircle, Bell, Settings, Search, Heart, Star, Sun, Sparkles, Zap, Check, ArrowRight, Globe, Trophy, Flame].map((Icon, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Icon className="w-7 h-7 text-primary-500" strokeWidth={1.5} />
                <span className="text-[11px] text-muted truncate w-full text-center">{Icon.displayName?.replace("Icon", "") ?? ""}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Hero mockup */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-accent tracking-tight">Hero-секция</h2>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-primary-50 to-surface p-16 sm:p-20 text-center border border-border">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute top-[-30%] left-[-20%] w-[60%] h-[60%] rounded-full bg-gradient-to-r from-primary-300/20 to-transparent blur-3xl" />
              <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-l from-secondary-200/15 to-transparent blur-3xl" />
            </div>
            <div className="relative">
              <span className="text-8xl inline-block mb-6 animate-float">🍊</span>
              <h1 className="text-6xl sm:text-7xl font-bold text-accent tracking-tight max-w-3xl mx-auto leading-[1.05]">
                Испанский язык <br /><span className="text-primary-500">с огоньком</span>
              </h1>
              <p className="text-xl text-muted mt-6 max-w-xl mx-auto">
                Мотивация в каждой дольке. Учись с удовольствием, в своём темпе.
              </p>
              <div className="flex flex-wrap justify-center gap-5 mt-10">
                <button className="btn-gradient btn-lg glow-orange">Начать учиться бесплатно</button>
                <button className="btn-ghost btn-lg">Войти</button>
              </div>
              <div className="flex items-center justify-center gap-6 mt-10 text-sm text-muted">
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-primary-500" /> 500+ учеников</span>
                <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-gold-400" /> 4.9 рейтинг</span>
                <span className="flex items-center gap-1.5"><Flame className="w-4 h-4 text-primary-500" /> Живые уроки</span>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-accent tracking-tight">Шапка</h2>
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🍊</span>
                <span className="font-bold text-primary-500 text-xl">Naranja Feliz</span>
              </div>
              <nav className="flex items-center gap-6">
                <Link href="#" className="text-base font-medium text-muted hover:text-accent transition-colors">Курсы</Link>
                <Link href="#" className="text-base font-medium text-muted hover:text-accent transition-colors">Словарь</Link>
                <Link href="#" className="text-base font-medium text-muted hover:text-accent transition-colors">Чат</Link>
                <div className="flex items-center gap-3 ml-3">
                  <span className="text-base font-semibold text-accent">Денис</span>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center text-white text-base font-bold shadow-md">
                    Д
                  </div>
                </div>
              </nav>
            </div>
          </div>
        </section>

        {/* Banner / CTA */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-accent tracking-tight">CTA-баннер</h2>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 via-orange-500 to-gold-400 p-12 sm:p-16 text-white">
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />
            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-8">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight">Готов начать?</h2>
                <p className="text-lg text-white/80">Первый урок — бесплатно. Без обязательств.</p>
              </div>
              <button className="btn-gradient btn-lg" style={{background: "white", color: "#FF4D2D", boxShadow: "0 4px 20px rgba(0,0,0,0.15)"}}>
                Записаться → <Sparkles className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-accent tracking-tight">Подвал</h2>
          <div className="card p-10">
            <div className="grid sm:grid-cols-4 gap-10">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🍊</span>
                  <span className="font-bold text-primary-500 text-lg">Naranja Feliz</span>
                </div>
                <p className="text-sm text-muted">Мотивация в каждой дольке</p>
              </div>
              {[
                { title: "Обучение", links: ["Курсы", "Словарь", "Карточки", "Чат"] },
                { title: "О нас", links: ["О школе", "Преподаватели", "Отзывы", "Контакты"] },
                { title: "Правовое", links: ["Политика", "Договор оферты", "Реквизиты"] },
              ].map((col, i) => (
                <div key={i}>
                  <h4 className="text-base font-bold text-accent mb-4">{col.title}</h4>
                  <ul className="space-y-3">
                    {col.links.map((l, j) => (
                      <li key={j}><Link href="#" className="text-sm text-muted hover:text-primary-500 transition-colors">{l}</Link></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-10 pt-8 text-center text-sm text-muted">
              © 2026 Naranja Feliz. Сделано с 🍊 и ❤️
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
