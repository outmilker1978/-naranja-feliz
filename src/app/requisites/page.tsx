import Link from "next/link";

export default function RequisitesPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-accent mb-8">Реквизиты и контакты</h1>

      <section className="space-y-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-accent mb-3">Исполнитель</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border">
              <dt className="text-muted">ФИО</dt>
              <dd className="text-accent font-medium">Брель Наталья Михайловна</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <dt className="text-muted">ИНН</dt>
              <dd className="text-accent font-medium">780208331442</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <dt className="text-muted">Статус</dt>
              <dd className="text-accent font-medium">Самозанятая</dd>
            </div>
          </dl>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-accent mb-3">Контакты</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border">
              <dt className="text-muted">Телефон</dt>
              <dd className="text-accent font-medium">
                <a href="tel:+79112100863" className="hover:text-primary-500 transition-colors">+7 (911) 210-08-63</a>
              </dd>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <dt className="text-muted">Email</dt>
              <dd className="text-accent font-medium">
                <a href="mailto:hamul@mail.ru" className="hover:text-primary-500 transition-colors">hamul@mail.ru</a>
              </dd>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <dt className="text-muted">Telegram</dt>
              <dd className="text-accent font-medium">
                <a href="https://t.me/NataLiBrel" target="_blank" rel="noopener noreferrer" className="hover:text-primary-500 transition-colors">@NataLiBrel</a>
              </dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-muted">Сайт</dt>
              <dd className="text-accent font-medium">
                <Link href="/" className="hover:text-primary-500 transition-colors">naranja.outmilk.online</Link>
              </dd>
            </div>
          </dl>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-accent mb-3">Как получить доступ после оплаты</h2>
          <p className="text-sm text-muted leading-relaxed">
            После успешной оплаты подписка продлевается автоматически. Срок действия
            добавляется к текущему (или начинается с даты оплаты, если подписки не было).
            Все материалы курсов становятся доступны сразу. Уведомление о продлении
            приходит в личный кабинет.
          </p>
        </div>
      </section>
    </div>
  );
}
