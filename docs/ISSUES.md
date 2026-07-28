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
