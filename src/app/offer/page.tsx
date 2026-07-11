export default function OfferPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-accent mb-8">Пользовательское соглашение</h1>

      <div className="prose prose-sm max-w-none text-muted space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-accent mt-8 mb-3">1. Общие положения</h2>
          <p>
            Настоящее Пользовательское соглашение (далее — Соглашение) регулирует отношения между 
            Брель Натальей Михайловной (ИНН 780208331442) (далее — Исполнитель) и пользователем 
            (далее — Пользователь) по использованию сервиса Naranja Feliz, доступного на сайте 
            naranja.outmilk.online (далее — Сайт).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-accent mt-8 mb-3">2. Предмет соглашения</h2>
          <p>
            Исполнитель предоставляет Пользователю доступ к образовательным материалам по испанскому языку 
            в форме интерактивных уроков, упражнений, словаря и чата с преподавателем (далее — Услуги).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-accent mt-8 mb-3">3. Стоимость и оплата</h2>
          <p>
            Доступ к Услугам осуществляется по подписке. Стоимость подписки указана на странице 
            <a href="/pricing" className="text-primary-500 hover:underline"> /pricing</a>. 
            Оплата производится через платёжный сервис ЮKassa. Подписка продлевается на срок, 
            соответствующий выбранному тарифу, с даты успешного списания средств.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-accent mt-8 mb-3">4. Порядок оказания услуг</h2>
          <p>
            После оплаты подписка активируется автоматически. Пользователь получает доступ ко всем 
            материалам курсов, отмеченных как «По подписке», на весь срок действия подписки.
            Доступ к личному кабинету, инструментам (словарь, карточки, чат) сохраняется 
            даже после окончания подписки.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-accent mt-8 mb-3">5. Права и обязанности сторон</h2>
          <p>
            Исполнитель обязуется обеспечить доступ к Услугам в соответствии с условиями оплаченного тарифа.
            Пользователь обязуется не распространять материалы курсов третьим лицам и не использовать 
            сервис для целей, противоречащих законодательству РФ.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-accent mt-8 mb-3">6. Реквизиты</h2>
          <p>
            Полные реквизиты Исполнителя доступны на странице 
            <a href="/requisites" className="text-primary-500 hover:underline"> /requisites</a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-accent mt-8 mb-3">7. Контакты</h2>
          <p>
            По всем вопросам можно обращаться по адресу электронной почты <a href="mailto:hamul@mail.ru" className="text-primary-500 hover:underline">hamul@mail.ru</a>,
            по телефону <a href="tel:+79112100863" className="text-primary-500 hover:underline">+7 (911) 210-08-63</a>
            {' '}или в Telegram <a href="https://t.me/NataLiBrel" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">@NataLiBrel</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
