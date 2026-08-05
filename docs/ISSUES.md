# Issues & Changelog — Naranja Feliz

## Формат

```
№ | Проблема / Фича | Анализ / Решение | Статус
```

Статусы: `бэклог` → `в работе` → `готово` → `проверено` → `релиз`

---

## Текущие

| № | Проблема | Анализ | Статус |
|---|---|---|---|
| #1 | /about — иконка «читать далее» рендерится как текст | `page.tsx:285,373` — `button_icon` вставлялся в `<span>` как строка. Переписал на `ICON_MAP` — теперь рисует Lucide-компонент, если имя совпадает | проверено |
| #2 | HERO статистика: 1 курс, 10 уроков (неверно) | `page.tsx:174` — всегда берёт `courseCount`/`lessonCount` из БД, CMS-статы только c `slice(2)`. `content-editor.tsx:114` — убрал хардкод "10 уроков" | проверено |
| #3 | Статистика не доступна учителям | API stats уже пускает teacher, layout не блокирует, tools-panel показывает ссылку. Работает без изменений | проверено |
| #4 | Админы видны ученикам в чате как учителя | `chat/teachers/route.ts:26` — `.in("role",[teacher,admin])` → `.eq("role",teacher)`. Ученик видит только учителей | проверено |
| #9 | FillBlankBlock — курсор сбрасывается при вводе символа (regression) | `dangerouslySetInnerHTML` пересоздаёт DOM на каждый рендер. **Фикс:** initHTML через `useEffect` + `ref`, без `dangerouslySetInnerHTML` в JSX | проверено |
| #10 | GroupDragBlock — форма редактирования не открывается после добавления | `addBlock` вызывал `router.refresh()` который сбрасывал `editingIndex`. **Фикс:** убран `router.refresh()` из `addBlock` | проверено |
| #11 | AttemptsDots — переделать: вертикально, внизу, с текстовым комментарием | AttemptsDots переписан: точки вертикальные (5px), отображаются рядом с кнопкой, показывают текст «Неверно, осталось N попыток» / «Верно!» / «Попытки исчерпаны» | проверено |
| #13 | GroupDragBlock — написать рендерер с drag-and-drop | Слова анонимные, перемешанные. Drag пул→слот, слот→слот, слот→пул. Клик-фоллбек. Сохранение ответа + попытки + восстановление при перезагрузке | проверено |
| #14 | DragOrderBlock / ImagePickBlock — восстановление ответа при перезагрузке | Загрузка saved-ответа из block_submissions, восстановление позиций/выбора | проверено |
| #15 | OrangeDivider — renderHTML с лишней скобкой | Лишний `],` в return-массиве renderHTML. Убран, билд проходит | проверено |
| #16 | TiptapEditor — bold активен при пустом тексте | Добавлен useEffect: сброс bold-маркера, если в HTML нет `<strong>/<b>` | проверено |
| #17 | textarea ввода слов группы — Enter/пробел режут текст | Убран `filter(Boolean)` из onChange. Фильтрация только в buildContent | проверено |
| #18 | Большие фото не загружаются (413 Payload Too Large) | Yandex Cloud Gateway не пропускает >10MB. Фикс: добавил клиентскую компрессию (canvas → resize 1920px → JPEG 80) перед отправкой | готово |
| #19 | Админ не видит курс учителя | RPC `check_course_access` не имел проверки `role='admin'`. Обновлён в Supabase. + Добавлен `isAdmin` bypass на страницы курса, урока и списка | готово |
| #20 | Пропал функционал «отметить урок пройденным» | `CompleteLessonButton` и `LessonProgressTracker` импортированы в `[lessonId]/page.tsx:5-6`, но НЕ отрендерены в JSX (потерялись в рефакторинге v0.5.0 `df65c8f`). + `AutoCompleteLesson:26` не включает `group_drag`. **Проверка кода:** кнопка уже отрендерена (`page.tsx:133`), авто-прогресс включает `group_drag` и `memory`. Работает | готово |
| #21 | Новая фича: Игра в пары (memory/matching) | Тип блока memory: 12/16/20 карточек, рандомная раскладка, шаги, авто-прогресс. Кнопки размера с форматом. Шрифт Twemoji ограничен unicode-range. SQL выполнен. Задеплоено v0.6.0 | релиз |
| #22 | Новая фича: Эмодзи-пикер в редакторе | 8 групп смайлов, вставка в место курсора, не закрывается после вставки. Цветной шрифт Twemoji Mozilla (public/fonts.css). Задеплоено v0.6.0 | релиз |
| #23 | Уведомления о подписке не работали (сайт + email) | Мгновенно при входе + cron ежедневно. SMTP Яндекс (пароль приложения). subscription_email_log для retry. Дедупликация. Задеплоено v0.6.0 | релиз |
| #24 | Новая фича: Кредитная система доступа | Подарок/кредит/списание/закрытие. Оплата гасит долг. История операций. UI учителя и ученика. Задеплоено v0.6.0 | релиз |
| #25 | Новая фича: Директор школы | is_director + /api/set-director + UI. Запросы продления/доступа → директору, иначе учителям. Задеплоено v0.6.0 | релиз |
| #26 | ЮKassa не настроена | `YOO_KASSA_SHOP_ID` и `YOO_KASSA_SECRET_KEY` пустые в .env.local — оплата упадёт. Нужны ключи из личного кабинета ЮKassa. Отложено пользователем | бэклог |
| #27 | Модалка «Доступ к курсам» дёргается/мелькает | dismissed фиксируется, URL-параметры очищаются. Задеплоено v0.6.0 | релиз |
| #28 | Сайт очень медленно грузится на мобильном интернете | На 4G страница списка курсов и инструмент редактирования контента грузятся слишком долго. Нужна оптимизация: ленивые чанки, меньший бандл, кэширование, image optimization. Пригодится для будущего Android-приложения | бэклог |
| #29 | FillBlank: «Проверить» не активирует сохранение/прогресс | isDisabled = saved || !hasAnyValue. Кнопка активна при введённых значениях. Задеплоено v0.6.0 | релиз |
| #30 | Модалка «Доступ к курсам» — редкое мерцание при выносе мыши за её пределы | После фикса #27 основное мерцание ушло. Остаток: если вывести курсор за границы модалки (на затемнение), изредка она мигает. Внутри модалки при наведении на поля мерцания нет | бэклог |

---

## История (закрытые)

_(крупные вехи и закрытые ишью)_

### 2026-07-19 — v0.5.0: divider + alignment + owner bypass + docs
- `d47463b` — fix: divider React NodeView, image alignment CSS fallback. Файлы: `tiptap-divider.tsx`, `resizable-image.tsx`, `block-renderer.tsx`, `tiptap-editor.tsx`
- `98c84a5` — fix: teacher/owner bypass для course access check
- `2912403` — fix: lesson blocks rendering, divider visibility
- `df65c8f` — v0.5.0: per-course access system + docs

### 2026-07-12 — deploy-1783879569 (стабильный релиз)
- Стабильная версия до v0.5.0

### 2026-07-07 — v0.4.3: proxy images, server auth, storage proxy
- `485aa98`

### 2026-07-06 — v0.4.2: reorder fix, features seed, CTA Infinity
- `6981d6b`

### 2026-07-04 — v0.4.1: image optimization, Docker Sharp
- `b201f09`, `0ab747f`

### 2026-07-03 — CI/CD pipeline stable
- 17 коммитов отладки GitHub Actions → Yandex Cloud деплой

### 2026-07-02 — deploy-016: lucide icons, Sharp, 4 cards, docs
- `26e409f`

### 2026-07-01 — deploy-015: first stable Yandex Cloud deploy
- Container: `bbaiqrnaqkaglikupvdm`, env vars fixed
- GitHub Actions настроены, YC_SA_KEY_JSON в secrets

### 2026-06-29 — MVP launch (portal + lessons + translations)
- `264bbd6`

---

## Инфраструктура

| Компонент | ID / URL | Статус |
|---|---|---|
| Container | `bba12ti21lgmv9glfl7k` — `naranja-backend` | ✅ ACTIVE |
| Gateway (новый) | `d5dgv9o24fhti6ds7hde` | ✅ ACTIVE |
| Домен | `naranja.outmilk.online` | ✅ привязан, сертификат ISSUED |
| Сертификат | `fpqc35fc9ueg8u78gacv` (Let's Encrypt) | ✅ до 2026-10-06 |
| Registry | `crpusm23v7g9ch5c5t9h` | ✅ |
| SA контейнера | `ajep2inmg605fd6ttbb2` | ✅ editor |
| SA GitHub Actions | `ajefscetirf01br3unuc` | ✅ pusher + editor + viewer |
| Supabase | `https://zphehhzgbudetyzezunk.supabase.co` | ✅ |
| Репозиторий | `https://github.com/outmilker1978/-naranja-feliz.git` | ✅ |

