import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-3 md:grid-cols-4 gap-6 md:gap-10">
          <div className="col-span-3 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img src="/logo-128.png" alt="Naranja Feliz" loading="lazy" className="w-8 h-8" />
              <span className="font-bold text-primary-500 text-lg">Naranja Feliz</span>
            </Link>
            <p className="text-sm text-muted">Мотивация в каждой дольке</p>
          </div>
          {[
            { title: "Обучение", links: [{ label: "Курсы", href: "/courses" }, { label: "Словарь", href: "/tools/vocabulary" }, { label: "Карточки", href: "/tools/cards" }, { label: "Чат", href: "/tools/chat" }] },
            { title: "О нас", links: [{ label: "О школе", href: "/about" }, { label: "Преподаватели", href: "/teachers" }, { label: "Отзывы", href: "/reviews" }, { label: "Написать нам", href: "mailto:hamul@mail.ru" }] },
            { title: "Правовое", links: [{ label: "Пользовательское соглашение", href: "/offer" }, { label: "Реквизиты", href: "/requisites" }] },
          ].map((col, i) => (
            <div key={i}>
              <h4 className="text-base font-bold text-accent mb-4">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((l, j) => (
                  <li key={j}><Link href={l.href} className="text-sm text-muted hover:text-primary-500 transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border mt-10 pt-8 text-center text-sm text-muted">
          © {new Date().getFullYear()} Naranja Feliz. Сделано с 🍊 и ❤️
        </div>
      </div>
    </footer>
  );
}
