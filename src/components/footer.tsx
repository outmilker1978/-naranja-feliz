import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🍊</span>
              <span className="font-bold text-primary-500 text-lg">Naranja Feliz</span>
            </div>
            <p className="text-sm text-muted">Мотивация в каждой дольке</p>
          </div>
          {[
            { title: "Обучение", links: [{ label: "Курсы", href: "/courses" }, { label: "Словарь", href: "/tools/vocabulary" }, { label: "Карточки", href: "/tools/cards" }, { label: "Чат", href: "/tools/chat" }] },
            { title: "О нас", links: [{ label: "О школе", href: "/" }, { label: "Преподаватели", href: "/admin/teachers" }, { label: "Отзывы", href: "/" }, { label: "Контакты", href: "/" }] },
            { title: "Правовое", links: [{ label: "Политика", href: "/" }, { label: "Договор оферты", href: "/" }, { label: "Реквизиты", href: "/" }] },
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
