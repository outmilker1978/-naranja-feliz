# Naranja Feliz вЂ” РђСЂС…РёС‚РµРєС‚СѓСЂР°, РёРЅС„СЂР°СЃС‚СЂСѓРєС‚СѓСЂР° Рё СЂР°Р·РІС‘СЂС‚С‹РІР°РЅРёРµ

## 1. РћР±С‰Р°СЏ Р°СЂС…РёС‚РµРєС‚СѓСЂР°

```
РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ (Р±СЂР°СѓР·РµСЂ)
    в†“
naranja.outmilk.online
    в†“
Yandex API Gateway (РїСЂРѕРєСЃРё)
    в†“
Yandex Serverless Container (Next.js SSR, 1GB RAM, 1vCPU)
    в†“
Yandex Serverless Container (Next.js SSR, 1GB RAM, 1vCPU)
    в”‚
    в”њв”Ђв”Ђв†’ /api/storage/[...path] (РїСЂРѕРєСЃРё СЃ Sharp: СЂРµСЃР°Р№Р· 1920px, JPEG q80)
    в”‚       в†“
    в”‚   Supabase Storage (server-to-server fetch вЂ” РЅРµ Р±Р»РѕРєРёСЂСѓРµС‚СЃСЏ РїСЂРѕРІР°Р№РґРµСЂРѕРј)
    в”‚
    в”њв”Ђв”Ђв†’ /api/auth/signup (admin.createUser СЃ auto-confirm)
    в”њв”Ђв”Ђв†’ /api/auth/login (signInWithPassword + cookie)
    в”њв”Ђв”Ђв†’ /api/auth/forgot-password (resetPasswordForEmail)
    в”њв”Ђв”Ђв†’ /api/auth/update-password (updateUser)
    в”‚
    в”њв”Ђв”Ђв†’ Supabase (PostgreSQL + Auth)
    в”њв”Ђв”Ђв†’ Supabase Storage (lesson-files bucket)
    в””в”Ђв”Ђв†’ Yandex Translate API (РїРµСЂРµРІРѕРґ СЃР»РѕРІ РЅР° СѓСЂРѕРєР°С…)
```

## 2. РРЅС„СЂР°СЃС‚СЂСѓРєС‚СѓСЂР° (Yandex Cloud)

### РћСЂРіР°РЅРёР·Р°С†РёСЏ
- **Cloud ID:** b1gnm48rbktakl54i8vb
- **Folder ID:** b1gsrqv6ri6jr7ue41fc
- **Default Zone:** ru-central1-a

### Serverless Container
- **Container ID:** bba12ti21lgmv9glfl7k
- **РќР°Р·РІР°РЅРёРµ:** naranja-backend
- **РЎРѕСЃС‚РѕСЏРЅРёРµ:** ACTIVE
- **Р РµСЃСѓСЂСЃС‹:** 1GB RAM, 1 vCPU (100%), С‚Р°Р№РјР°СѓС‚ 300s, concurrency 8
- **РћР±СЂР°Р·:** `cr.yandex/crpusm23v7g9ch5c5t9h/naranja-backend:deploy-XXX`
- **РЎРµСЂРІРёСЃРЅС‹Р№ Р°РєРєР°СѓРЅС‚ (naranja-container-sa):** ajep2inmg605fd6ttbb2

### Container Registry
- **Registry ID:** crpusm23v7g9ch5c5t9h
- **Р РµРїРѕР·РёС‚РѕСЂРёР№:** `naranja-backend` (С‚РѕР»СЊРєРѕ РѕРЅ, naranja-feliz СѓРґР°Р»С‘РЅ)

### API Gateway
- **РЎРїРµРєСѓР»СЏС†РёСЏ:** gateway-spec.yaml
- **Р”РѕРјРµРЅ:** naranja.outmilk.online

### РЎРµСЂРІРёСЃРЅС‹Рµ Р°РєРєР°СѓРЅС‚С‹
1. **ajep2inmg605fd6ttbb2** (naranja-container-sa) вЂ” РґР»СЏ РєРѕРЅС‚РµР№РЅРµСЂР°
   - Р РѕР»Рё: `container-registry.images.puller` (РЅР° registry), `serverless-containers.editor` (РЅР° РєРѕРЅС‚РµР№РЅРµСЂ)
2. **ajefscetirf01br3unuc** (naranja-github-actions) вЂ” РґР»СЏ GitHub Actions
   - Р РѕР»Рё: `container-registry.images.pusher` (РЅР° registry), `serverless-containers.editor` (РЅР° РєРѕРЅС‚РµР№РЅРµСЂ), `iam.serviceAccounts.user` (РЅР° container-sa)

## 3. CI/CD (GitHub Actions)

### РљР°Рє СЂР°Р±РѕС‚Р°РµС‚
1. РџСѓС€ РІ РІРµС‚РєСѓ `main` в†’ GitHub Actions
2. РЈСЃС‚Р°РЅРѕРІРєР° Р·Р°РІРёСЃРёРјРѕСЃС‚РµР№, СЃР±РѕСЂРєР° Next.js, СЃР±РѕСЂРєР° Docker-РѕР±СЂР°Р·Р°
3. РџСѓС€ РѕР±СЂР°Р·Р° РІ Yandex Container Registry
4. РЎРѕР·РґР°РЅРёРµ РЅРѕРІРѕР№ СЂРµРІРёР·РёРё Serverless Container
5. Health check (HTTP 200)

### Р¤Р°Р№Р»: `.github/workflows/deploy.yml`
### Р¤Р°Р№Р»: `.github/workflows/cron-subscription.yml` вЂ” РµР¶РµРґРЅРµРІРЅС‹Р№ cron СѓРІРµРґРѕРјР»РµРЅРёР№ Рѕ РїРѕРґРїРёСЃРєРµ (06:00 UTC)
### РЎРµРєСЂРµС‚С‹ GitHub: `YC_SA_KEY_JSON`, `SUPABASE_SERVICE_ROLE_KEY`, `YANDEX_API_KEY`, `SMTP_USER`, `SMTP_PASS`, `CRON_SECRET`

РџРѕРґСЂРѕР±РЅРµРµ вЂ” РІ `docs/CI_CD_PIPELINE.md`.

## 4. Supabase
- **URL:** https://zphehhzgbudetyzezunk.supabase.co
- **РџР»Р°РЅ:** Free Tier
- **РљР»СЋС‡Рё:** РІ `.env.local` Рё GitHub Secrets

### РўР°Р±Р»РёС†С‹
(СЃРј. `supabase/migration.sql` Рё `docs/ADMIN_GUIDE.md`)

## 5. Yandex Translate
- **API Key:** РІ `.env.local` РєР°Рє `YANDEX_API_KEY`
- **Folder ID:** b1gsrqv6ri6jr7ue41fc
- **Р¦РµРїРѕС‡РєР°:** Yandex в†’ DeepL (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ) в†’ Google в†’ LibreTranslate в†’ MyMemory

## 6. РџСЂРѕРєСЃРё-СЂРѕСѓС‚ `/api/storage/[...path]`
- **РќР°Р·РЅР°С‡РµРЅРёРµ:** СЃРµСЂРІРµСЂ-СЃРµСЂРІРµСЂРЅС‹Р№ fetch РґРѕ Supabase Storage (РѕР±С…РѕРґРёС‚ Р±Р»РѕРєРёСЂРѕРІРєРё РїСЂРѕРІР°Р№РґРµСЂР°)
- **Upstream:** `https://zphehhzgbudetyzezunk.supabase.co/storage/v1/object/public/{path}`
- **РџРѕРґРґРµСЂР¶РєР° signed URL:** РїСѓС‚СЊ `/api/storage/object/sign/{bucket}/{file}?token=...` РїСЂРѕРєСЃРёСЂСѓРµС‚ РЅР° `/storage/v1/object/sign/{path}?token=...` (РЅСѓР¶РµРЅ РґР»СЏ СЃС‚Р°СЂС‹С… Р·Р°РїРёСЃРµР№, РіРґРµ URL Р±С‹Р» signed)
- **РђРІС‚РѕСЂРёР·Р°С†РёСЏ upstream:** `Authorization: Bearer <anon key>` (Р±РµР· РЅРµРіРѕ вЂ” 403 РґР»СЏ `lesson-files/uploads/*/*.mp3`)
- **РљР°СЂС‚РёРЅРєРё** (ext РІ IMG_EXTS + Sharp-РїР°СЂР°РјРµС‚СЂС‹): РїР°С‚С‡РµРЅРЅС‹Р№ Next-fetch + Sharp (resize `?w`/`?q`/`?fm`, JPEG q80, 1920px max, EXIF-РѕСЂРёРµРЅС‚Р°С†РёСЏ, WebP/AVIF РїРѕ Accept), `Cache-Control: public, max-age=86400`, in-memory РєСЌС€ 10 РјРёРЅ (`X-Storage-Cache`)
- **РќРµ-РєР°СЂС‚РёРЅРєРё (Р°СѓРґРёРѕ/РІРёРґРµРѕ/PDF):** С‡С‚РµРЅРёРµ С‡РµСЂРµР· `node:https` `rawGet`/`rawGetRetryFull` (5 РїРѕРїС‹С‚РѕРє, backoff) вЂ” **РќР• С‡РµСЂРµР· Next-patched fetch** (СЂРІС‘С‚СЃСЏ РЅР° Range-РѕС‚РІРµС‚Р°С… Р°РїСЃС‚СЂРёРјР°, `TypeError: terminated`). РџСЂРѕРґ: Р±СѓС„РµСЂРЅС‹Р№ РѕС‚РІРµС‚ С†РµР»РёРєРѕРј (С„Р°Р№Р»С‹ в‰¤8 РњР‘). Dev: РєР°Рї Р»СЋР±РѕР№ Range >1 РњР‘ Рё GET Р±РµР· Range РґРѕ 1 РњР‘ вЂ” РїР»РµРµСЂ С‡РёС‚Р°РµС‚ РєСѓСЃРєР°РјРё; РµСЃР»Рё С„Р°Р№Р» РјР°С‚РµСЂРёР°Р»Р»РёР·РѕРІР°РЅ вЂ” 302 РЅР° СЃС‚Р°С‚РёРєСѓ
- **Dev-РјРµРґРёР° (`/_media/`):** `<audio>/<video>` РІ dev РёРґСѓС‚ РќР• РЅР° РґРёРЅР°РјРёС‡РµСЃРєРёР№ РјР°СЂС€СЂСѓС‚ (dev-СЃРµСЂРІРµСЂ РЅРµ РґРѕСЃС‚Р°РІР»СЏРµС‚ С‚РµР»Рѕ dynamic-route РѕС‚РІРµС‚Р° РґР»СЏ `Accept-Encoding: identity`, РѕРґРёРЅР°РєРѕРІРѕ РґР»СЏ 200/206/302), Р° РЅР° СЃС‚Р°С‚РёС‡РµСЃРєРёР№ `/api/dev/media` + `scripts/materialize-media.mjs` (РјР°С‚РµСЂРёР°Р»Р»РёР·Р°С†РёСЏ РєСѓСЃРєР°РјРё 1 РњР‘, retry 6, РѕС‚РґРµР»СЊРЅС‹Р№ node-РїСЂРѕС†РµСЃСЃ) в†’ С„Р°Р№Р» РєР»Р°РґС‘С‚СЃСЏ РІ `public/_media/<basename>` (gitignored) Рё РѕС‚РґР°С‘С‚СЃСЏ СЃС‚Р°С‚РёРєРѕР№ Next (Р»СЋР±РѕР№ Range Р·Р° ~7 РјСЃ). Р¤СЂРѕРЅС‚: `src/components/lesson-blocks/media-asset.tsx` (`MediaAsset`) РІ dev РЅР°РїСЂР°РІР»СЏРµС‚ src РЅР° `/_media/<basename>`, РІ РїСЂРѕРґ вЂ” РЅР° РїСЂРѕРєСЃРё
- **РџСЂРѕС‡РµРµ:** РЅРµ-image С„Р°Р№Р»С‹ (РІРёРґРµРѕ, Р°СѓРґРёРѕ, PDF) вЂ” passthrough Р±РµР· РёР·РјРµРЅРµРЅРёР№ (РїСЂРѕРґ)
- **РћС‚Р»Р°РґРєР° СЃР±РѕСЂРєРё:** `/api/dev/media` вЂ” dev-only (РІ РїСЂРѕРґРµ 404)

## 7. РћРїС‚РёРјРёР·Р°С†РёСЏ РёР·РѕР±СЂР°Р¶РµРЅРёР№ РЅР° С„СЂРѕРЅС‚РµРЅРґРµ (next/image + StorageImage)
- РљРѕРјРїРѕРЅРµРЅС‚ `StorageImage` (`src/components/storage-image.tsx`, РѕР±С‘СЂС‚РєР° РЅР°Рґ next/image) вЂ” РґР»СЏ РєРѕРЅС‚РµРЅС‚РЅС‹С… РєР°СЂС‚РёРЅРѕРє РёР· Supabase Storage.
- Storage-URL (public Рё signed) Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё РїРµСЂРµРїРёСЃС‹РІР°СЋС‚СЃСЏ РІ РїСЂРѕРєСЃРё-РїСѓС‚СЊ `/api/storage/...` (`toProxyPath`/`isProxyable`); responsive srcset (`?w=256..2560`), Р»РµРЅРёРІР°СЏ Р·Р°РіСЂСѓР·РєР°, `priority` С‚Р°Рј РіРґРµ РЅР°РґРѕ, Р·Р°С‰РёС‚Р° РѕС‚ layout-shift (fill/РїСЂРѕРїРѕСЂС†РёРё).
- Р’СЃС‘ РѕСЃС‚Р°Р»СЊРЅРѕРµ (РІРЅРµС€РЅРёРµ hotlink-Рё: Google Drive / РЇРЅРґРµРєСЃ.Р”РёСЃРє, gif, svg, Р»РѕРєР°Р»СЊРЅС‹Рµ Р°СЃСЃРµС‚С‹ `/logo-128.png`) fallback РЅР° РѕР±С‹С‡РЅС‹Р№ `<img>` (`raw`) вЂ” С‡РµСЂРµР· РїСЂРѕРєСЃРё РЅРµ РіРѕРЅСЏРµС‚СЃСЏ.
- `next.config.ts`: `images.loader: "custom"` (loader в†’ `/api/storage`), `images.formats: ["image/avif","image/webp"]`.
- `upload-file` Р±РѕР»СЊС€Рµ **РЅРµ СЃРѕР·РґР°С‘С‚ signed URL** вЂ” РІРѕР·РІСЂР°С‰Р°РµС‚ public URL (`/object/public/`), Р±Р°РєРµС‚ `lesson-files` РїСѓР±Р»РёС‡РЅС‹Р№.
- Р Р°СЃРїСЂРѕСЃС‚СЂР°РЅРµРЅРѕ РЅР° РІСЃРµ РїСѓР±Р»РёС‡РЅС‹Рµ СЃС‚СЂР°РЅРёС†С‹: РіР»Р°РІРЅР°СЏ, catalog, content/[id], reviews, about, teachers, teachers/[id], content-carousel, СЃР»Р°Р№РґС€РѕСѓ, CTA.
- РўСЏР¶С‘Р»С‹Рµ РєР»РёРµРЅС‚СЃРєРёРµ Р±РёР±Р»РёРѕС‚РµРєРё (editor/ProseMirror, recharts) РїРѕРґС‚РІРµСЂР¶РґРµРЅС‹ **РІРЅРµ РїСѓР±Р»РёС‡РЅРѕРіРѕ РїСѓС‚Рё** вЂ” route-splitting РЅРµ С‚СЏРЅРµС‚ РёС… РЅР° Р»РµРЅРґРёРЅРі.

## 8. Auth (Р°РІС‚РѕСЂРёР·Р°С†РёСЏ)
- **Р РµРіРёСЃС‚СЂР°С†РёСЏ:** `POST /api/auth/signup` в†’ `admin.createUser({ email_confirm: true })` в†’ СЃСЂР°Р·Сѓ РІС…РѕРґ
- **Р’С…РѕРґ:** `POST /api/auth/login` в†’ `signInWithPassword()` в†’ СѓСЃС‚Р°РЅРѕРІРєР° cookie С‡РµСЂРµР· `pendingCookies`
- **Р’С‹С…РѕРґ:** `POST /api/auth/logout` в†’ РѕС‡РёСЃС‚РєР° СЃРµСЃСЃРёРё
- **РЎР±СЂРѕСЃ РїР°СЂРѕР»СЏ:** `/forgot-password` в†’ `resetPasswordForEmail()` в†’ РїРёСЃСЊРјРѕ в†’ `/auth/callback` в†’ `/reset-password` в†’ `updateUser()`
- **Auth callback:** `/auth/callback` в†’ `exchangeCodeForSession()` в†’ СЂРµРґРёСЂРµРєС‚ РЅР° NEXT_PUBLIC_SITE_URL (РЅРµ РЅР° request.url)
- **РўРµРєСѓС‰РёР№ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ (BFF):** `GET /api/auth/me` в†’ РІРѕР·РІСЂР°С‰Р°РµС‚ `{ user: { id, email, user_metadata } }` РёР· СЃРµСЂРІРµСЂРЅРѕР№ СЃРµСЃСЃРёРё (РєСѓРєРё). РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ **РєР»РёРµРЅС‚СЃРєРёРјРё** СЃС‚СЂР°РЅРёС†Р°РјРё/РєРѕРјРїРѕРЅРµРЅС‚Р°РјРё РІРјРµСЃС‚Рѕ Р±СЂР°СѓР·РµСЂРЅРѕРіРѕ `supabase.auth.getUser()`. Р­С‚Рѕ СѓР±РёСЂР°РµС‚ РїСЂСЏРјРѕР№ РІС‹Р·РѕРІ Supabase РёР· Р±СЂР°СѓР·РµСЂР° в†’ РЅРµС‚ Р·Р°РІРёСЃР°РЅРёР№ РЅР° РјРµРґР»РµРЅРЅС‹С… СЃРµС‚СЏС…, Рё Р·Р°РґР°С‘С‚ РЅР°РїСЂР°РІР»РµРЅРёРµ **BFF** (Frontend С…РѕРґРёС‚ РІ РЅР°С€ API, РЅРµ РІ Supabase РЅР°РїСЂСЏРјСѓСЋ).

### Р—Р°РєР°Р»РєР° СЃРѕРµРґРёРЅРµРЅРёР№ Рє Supabase (РЅР°РґС‘Р¶РЅРѕСЃС‚СЊ)
- РќР° **РІСЃРµС… СЃРµСЂРІРµСЂРЅС‹С…** Supabase-РєР»РёРµРЅС‚Р°С… (`createClient/createAdminClient/createServiceClient`, `middleware.ts`, auth-СЂРѕСѓС‚С‹, `tools-panel-wrapper`) РїСЂРёРјРµРЅСЏРµС‚СЃСЏ `supabaseFetch` РёР· `lib/supabase/server.ts` вЂ” РѕР±С‘СЂС‚РєР°, С„РѕСЂСЃРёСЂСѓСЋС‰Р°СЏ `Connection: close` РЅР° РєР°Р¶РґРѕРј Р·Р°РїСЂРѕСЃРµ.
- **Р—Р°С‡РµРј:** РґРѕР»РіРѕР¶РёРІСѓС‰РёР№ РїСЂРѕС†РµСЃСЃ РЅР°РєР°РїР»РёРІР°РµС‚ В«РїСЂРѕС‚СѓС…С€РёРµВ» keep-alive СЃРѕРєРµС‚С‹ Рє Supabase в†’ СЃР»СѓС‡Р°Р№РЅС‹Р№ Р·Р°РїСЂРѕСЃ Р·Р°РІРёСЃР°Р» РЅР° 20вЂ“70СЃ (РѕСЃРѕР±РµРЅРЅРѕ РІ dev Рё РЅР° РјРµРґР»РµРЅРЅС‹С… СЃРµС‚СЏС…). `Connection: close` РЅРµ РґР°С‘С‚ РїРµСЂРµРёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РїСЂРѕС‚СѓС…С€РёРµ СЃРѕРєРµС‚С‹ в†’ СЃС‚Р°Р±РёР»СЊРЅРѕСЃС‚СЊ.
- **РћРіСЂР°РЅРёС‡РµРЅРёРµ:** СЌС‚Рѕ Р·Р°РєР°Р»РєР° РЅР°РґС‘Р¶РЅРѕСЃС‚Рё, Р° РЅРµ РѕРїС‚РёРјСѓРј. РџСЂР°РІРёР»СЊРЅРµРµ вЂ” РЅР°СЃС‚СЂРѕРёС‚СЊ undici Agent (keepAliveTimeout) Рё **СЃРѕРєСЂР°С‚РёС‚СЊ С‡РёСЃР»Рѕ РїРѕСЃР»РµРґРѕРІР°С‚РµР»СЊРЅС‹С… Р·Р°РїСЂРѕСЃРѕРІ** (СЃРј. РЅР°РїСЂР°РІР»РµРЅРёРµ B + RPC). Р”Р»СЏ РЅРёР·РєРѕРіРѕ С‚СЂР°С„РёРєР° С‚РµРєСѓС‰РµРµ СЂРµС€РµРЅРёРµ РїСЂРёРµРјР»РµРјРѕ.

### РќР°РїСЂР°РІР»РµРЅРёРµ BFF (РІР°Р¶РЅРѕ РґР»СЏ Android)
- Р‘СЂР°СѓР·РµСЂ/РјРѕР±РёР»СЊРЅС‹Р№ РєР»РёРµРЅС‚ **РЅРµ РґРѕР»Р¶РµРЅ** С…РѕРґРёС‚СЊ РІ Supabase РЅР°РїСЂСЏРјСѓСЋ (Р°РЅРѕРЅ-РєР»СЋС‡ + Р·Р°РІРёСЃР°РЅРёСЏ). Р’СЃРµ РґР°РЅРЅС‹Рµ вЂ” С‡РµСЂРµР· РЅР°С€ Next-API (`/api/*`), СЃРµСЂРІРµСЂ вЂ” РµРґРёРЅСЃС‚РІРµРЅРЅС‹Р№, РєС‚Рѕ Р·РЅР°РµС‚ СЃРµРєСЂРµС‚С‹.
- РљРѕРЅС‚РµРЅС‚РЅС‹Рµ СЃС‚СЂР°РЅРёС†С‹ (СѓСЂРѕРєРё, РєСѓСЂСЃС‹) СѓР¶Рµ СЃРѕР±РёСЂР°СЋС‚СЃСЏ РЅР° СЃРµСЂРІРµСЂРµ. РљР»РёРµРЅС‚СЃРєРёРµ СЃС†РµРЅР°СЂРёРё, РєРѕС‚РѕСЂС‹Рј РЅСѓР¶РµРЅ `getUser`, РїРµСЂРµРІРѕРґСЏС‚СЃСЏ РЅР° `/api/auth/me`.

## 9. Р®Kassa
- **РЎС‚Р°С‚СѓСЃ:** РќР• РќРђРЎРўР РћР•РќРђ
- **shop_id / secret_key:** РѕР¶РёРґР°СЋС‚СЃСЏ РѕС‚ РјРµРЅРµРґР¶РµСЂР° Р®Kassa

## 10. GitHub
- **Р РµРїРѕР·РёС‚РѕСЂРёР№:** https://github.com/outmilker1978/-naranja-feliz.git
- **Р’РµС‚РєР°:** main (РµРґРёРЅСЃС‚РІРµРЅРЅР°СЏ, Р·Р°С‰РёС‰С‘РЅРЅР°СЏ)

## 11. .env.local (Р»РѕРєР°Р»СЊРЅР°СЏ СЂР°Р·СЂР°Р±РѕС‚РєР°)
```
NEXT_PUBLIC_SUPABASE_URL=https://zphehhzgbudetyzezunk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_... (СЂРµР°Р»СЊРЅС‹Р№ вЂ” С‚РѕР»СЊРєРѕ РІ .env.local, РЅРµ РєРѕРјРјРёС‚РёС‚СЊ, СѓР±СЂР°РЅРѕ РёР· РґРѕРєРѕРІ РїРѕ РіРёРіРёРµРЅРµ) 
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3100
YANDEX_API_KEY=...
YANDEX_FOLDER_ID=b1gsrqv6ri6jr7ue41fc
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=naranja-feliz@yandex.ru
SMTP_PASS=<РїР°СЂРѕР»СЊ РїСЂРёР»РѕР¶РµРЅРёСЏ РЇРЅРґРµРєСЃ, СЃРѕР·РґР°РЅРЅС‹Р№ РІ id.yandex.ru/security/app-passwords>
SMTP_FROM=naranja-feliz@yandex.ru
CRON_SECRET=<СЃР»СѓС‡Р°Р№РЅР°СЏ СЃС‚СЂРѕРєР° РґР»СЏ Р·Р°С‰РёС‚С‹ cron endpoint>
YOO_KASSA_SHOP_ID=
YOO_KASSA_SECRET_KEY=
```

## 12. Р›РѕРєР°Р»СЊРЅР°СЏ СЂР°Р·СЂР°Р±РѕС‚РєР°
```bash
npm install
npm run dev      # localhost:3100
npm run build    # production СЃР±РѕСЂРєР° (output: standalone)
```

## 13. РЎР¶Р°С‚РёРµ РёР·РѕР±СЂР°Р¶РµРЅРёР№
- **РџСЂРё Р·Р°РіСЂСѓР·РєРµ:** Sharp (JPEG mozjpeg q82, PNGв†’WebP, СЂРµСЃР°Р№Р· >1920px), fallback РїСЂРё РѕС€РёР±РєРµ
- **РџР°РєРµС‚РЅРѕРµ:** `scripts/compress-storage.mjs` вЂ” РїСЂРѕС€С‘Р»СЃСЏ РїРѕ РІСЃРµРј bucket-С„Р°Р№Р»Р°Рј >300KB
- **Р§РµСЂРµР· РїСЂРѕРєСЃРё:** `/api/storage/[...path]` вЂ” Sharp РЅР° Р»РµС‚Сѓ (JPEG q80, 1920px)

## 14. РўРµСЃС‚РѕРІС‹Рµ Р°РєРєР°СѓРЅС‚С‹
- РЈС‡РёС‚РµР»СЊ Рё СѓС‡РµРЅРёРє вЂ” РІ Supabase Auth, roles РІ `profiles`

## 15. РЎРёСЃС‚РµРјР° Р±Р»РѕРєРѕРІ РєРѕРЅС‚РµРЅС‚Р° РїРѕСЂС‚Р°Р»Р°

### РўРёРїС‹ Р±Р»РѕРєРѕРІ
- **page_section** вЂ” СЃС‚Р°С‚РёС‡РЅС‹Рµ СЃРµРєС†РёРё РіР»Р°РІРЅРѕР№: hero (locked), features, about, testimonials, faq, cta (locked). РљР°Р¶РґР°СЏ вЂ” РѕРґРЅР° Р·Р°РїРёСЃСЊ РІ `content` СЃ `type=page_section` Рё `category`.
- **news** вЂ” РєРѕР»Р»РµРєС†РёСЏ РЅРѕРІРѕСЃС‚РµР№ (РѕРґРЅР° Р·Р°РїРёСЃСЊ = РѕРґРЅР° РЅРѕРІРѕСЃС‚СЊ), РіСЂСѓРїРїРёСЂСѓСЋС‚СЃСЏ РІ Р±Р»РѕРє "РќРѕРІРѕСЃС‚Рё".
- **article** / **ad** вЂ” РґРёРЅР°РјРёС‡РµСЃРєРёРµ Р±Р»РѕРєРё РёР· `content_blocks` С‚Р°Р±Р»РёС†С‹, СЃРѕРґРµСЂР¶Р°С‚ СЃСЃС‹Р»РєРё РЅР° Р·Р°РїРёСЃРё РІ `content`.

### РџРѕСЂСЏРґРѕРє Р±Р»РѕРєРѕРІ
- **РђРґРјРёРЅРєР°:** `buildSectionBlocks` в†’ STATIC_BLOCK_DEFS (featuresв†’aboutв†’testimonialsв†’faqв†’news) + content_blocks, СЃРѕСЂС‚РёСЂРѕРІРєР°: hero first, cta last, РѕСЃС‚Р°Р»СЊРЅРѕРµ РїРѕ `sort_order`.
- **РџРѕСЂС‚Р°Р» (page.tsx):** Hero в†’ Courses в†’ Features в†’ About в†’ Testimonials в†’ FAQ в†’ News в†’ Article/Ad Р±Р»РѕРєРё в†’ CTA. РљР°Р¶РґРѕР№ СЃРµРєС†РёРё РїСЂРёСЃРІР°РёРІР°РµС‚СЃСЏ `order` (sort_order РёР· Р‘Р” РґР»СЏ page_sections/content_blocks, Infinity РґР»СЏ CTA).

### Р РµРѕСЂРґРµСЂ Р±Р»РѕРєРѕРІ (`moveBlock`)
1. РљРѕРїРёСЂСѓРµС‚СЃСЏ РјР°СЃСЃРёРІ `sectionBlocks`, РјРµРЅСЏСЋС‚СЃСЏ РјРµСЃС‚Р°РјРё РґРІР° СЃРѕСЃРµРґРЅРёС… Р±Р»РѕРєР°.
2. locked-Р±Р»РѕРєРё (hero, cta) РёСЃРєР»СЋС‡Р°СЋС‚СЃСЏ РёР· РїРµСЂРµРЅСѓРјРµСЂР°С†РёРё.
3. Р’СЃРµ unlocked-Р±Р»РѕРєРё РїРѕР»СѓС‡Р°СЋС‚ `sort_order = index Г— 1000`.
4. РЎС‚Р°С‚РёРєРё РѕР±РЅРѕРІР»СЏСЋС‚СЃСЏ С‡РµСЂРµР· `/api/content/reorder`, РґРёРЅР°РјРёРєРё вЂ” С‡РµСЂРµР· `/api/content-blocks/reorder`.
5. РџРѕСЃР»Рµ СЃРѕС…СЂР°РЅРµРЅРёСЏ вЂ” `fetchAll()` РїРµСЂРµРіСЂСѓР¶Р°РµС‚ РґР°РЅРЅС‹Рµ СЃ СЃРµСЂРІРµСЂР°.

### Р РµРѕСЂРґРµСЂ РІРЅСѓС‚СЂРё Р±Р»РѕРєР° (`moveItemInBlock`)
- Р’СЃРµ items Р±Р»РѕРєР° РїРѕР»СѓС‡Р°СЋС‚ РїРѕСЃР»РµРґРѕРІР°С‚РµР»СЊРЅС‹Рµ sort_order (0, 1, 2...) С‡РµСЂРµР· `/api/content/reorder`.

## 16. Р’Р°Р¶РЅС‹Рµ С„Р°Р№Р»С‹
| Р¤Р°Р№Р» | РќР°Р·РЅР°С‡РµРЅРёРµ |
|------|-----------|
| `Dockerfile` | РњРЅРѕРіРѕСЃС‚Р°РґРёР№РЅР°СЏ СЃР±РѕСЂРєР° Next.js (standalone) |
| `gateway-spec.yaml` | API Gateway routes |
| `.github/workflows/deploy.yml` | CI/CD pipeline |
| `supabase/migration.sql` | РЎС…РµРјР° Рё РјРёРіСЂР°С†РёРё Р‘Р” |
| `next.config.ts` | output: "standalone" |
| `.dockerignore` | РСЃРєР»СЋС‡РµРЅРёСЏ РґР»СЏ Docker |
| `src/proxy.ts` | Middleware (Next.js 16 proxy convention) |
| `src/lib/image-proxy.ts` | РЈС‚РёР»РёС‚Р° Р·Р°РјРµРЅС‹ URL РЅР° РїСЂРѕРєСЃРё-СЂРѕСѓС‚ |
| `src/app/api/storage/[...path]/route.ts` | Proxy-СЂРѕСѓС‚ СЃ Sharp |
| `src/app/api/auth/signup/route.ts` | Р РµРіРёСЃС‚СЂР°С†РёСЏ СЃ auto-confirm |
| `src/app/api/auth/login/route.ts` | РЎРµСЂРІРµСЂРЅС‹Р№ РІС…РѕРґ |
| `src/app/api/auth/forgot-password/route.ts` | РЎР±СЂРѕСЃ РїР°СЂРѕР»СЏ |
| `src/app/api/auth/update-password/route.ts` | РћР±РЅРѕРІР»РµРЅРёРµ РїР°СЂРѕР»СЏ |
| `src/app/auth/callback/route.ts` | Auth callback |
| `scripts/compress-storage.mjs` | РџР°РєРµС‚РЅРѕРµ СЃР¶Р°С‚РёРµ С„РѕС‚Рѕ РІ Storage |
## 17. TipTap Editor Extensions

РўРµРєСЃС‚РѕРІС‹Рµ Р±Р»РѕРєРё СѓСЂРѕРєРѕРІ РёСЃРїРѕР»СЊР·СѓСЋС‚ TipTap СЂРµРґР°РєС‚РѕСЂ (`tiptap-editor.tsx`). Р—Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅРЅС‹Рµ СЂР°СЃС€РёСЂРµРЅРёСЏ:

| Р Р°СЃС€РёСЂРµРЅРёРµ | РўРёРї | Р РѕР»СЊ |
|-----------|-----|------|
| `StarterKit` | Р‘Р°РЅРґР» | РџР°СЂР°РіСЂР°С„С‹, Р·Р°РіРѕР»РѕРІРєРё, СЃРїРёСЃРєРё, С„РѕСЂРјР°С‚РёСЂРѕРІР°РЅРёРµ |
| `Underline` | Mark | РџРѕРґС‡С‘СЂРєРёРІР°РЅРёРµ |
| `LinkExtension` | Mark | РЎСЃС‹Р»РєРё |
| `ResizableImage` | Node (React NodeView) | `<img>` СЃ СЂРµСЃР°Р№Р·РѕРј, РІС‹СЂР°РІРЅРёРІР°РЅРёРµ С‡РµСЂРµР· TextAlign |
| `TranslationMark` | Mark | Р Р°Р·РјРµС‚РєР° `data-translate` РґР»СЏ РїРµСЂРµРІРѕРґР° |
| `OrangeDividerExtension` | Node (React NodeView) | Р”РµРєРѕСЂР°С‚РёРІРЅС‹Р№ СЂР°Р·РґРµР»РёС‚РµР»СЊ (SVG) |
| `Placeholder` | Extension | РџР»РµР№СЃС…РѕР»РґРµСЂ СЂРµРґР°РєС‚РѕСЂР° |
| `TextAlign` | Extension | Р’С‹СЂР°РІРЅРёРІР°РЅРёРµ С‚РµРєСЃС‚Р° Рё РёР·РѕР±СЂР°Р¶РµРЅРёР№ (`types: ["heading", "paragraph", "image"]`) |

Р”РІР° РєР°СЃС‚РѕРјРЅС‹С… NodeView РёСЃРїРѕР»СЊР·СѓСЋС‚ `ReactNodeViewRenderer` вЂ” РІ СЂРµРґР°РєС‚РѕСЂРµ СЂРµРЅРґРµСЂСЏС‚СЃСЏ React-РєРѕРјРїРѕРЅРµРЅС‚Р°РјРё, РІ СЃРѕС…СЂР°РЅС‘РЅРЅРѕРј HTML (`editor.getHTML()`) СЃРµСЂРёР°Р»РёР·СѓСЋС‚СЃСЏ С‡РµСЂРµР· `renderHTML()`.

## 18. Per-course РґРѕСЃС‚СѓРї

### РЎС…РµРјР° СЂР°Р±РѕС‚С‹
1. РЎС‚СѓРґРµРЅС‚ РІРёРґРёС‚ РєСѓСЂСЃ СЃ Р±РµР№РґР¶РµРј В«РџРѕ Р·Р°РїСЂРѕСЃСѓВ» в†’ РЅР°Р¶РёРјР°РµС‚ В«Р—Р°РїСЂРѕСЃРёС‚СЊ РґРѕСЃС‚СѓРї Сѓ СѓС‡РёС‚РµР»СЏВ»
2. РЈС‡РёС‚РµР»СЊ РїРѕР»СѓС‡Р°РµС‚ СѓРІРµРґРѕРјР»РµРЅРёРµ СЃРѕ СЃСЃС‹Р»РєРѕР№ РЅР° СѓС‡РёС‚РµР»СЊСЃРєСѓСЋ СЃ РѕС‚РєСЂС‹С‚РѕР№ РјРѕРґР°Р»РєРѕР№ СЃС‚СѓРґРµРЅС‚Р°
3. РЈС‡РёС‚РµР»СЊ РІС‹Р±РёСЂР°РµС‚ РєСѓСЂСЃ(С‹) Рё СЃСЂРѕРє в†’ В«Р’С‹РґР°С‚СЊ РґРѕСЃС‚СѓРїВ»
4. API СЃРѕР·РґР°С‘С‚ Р·Р°РїРёСЃСЊ РІ course_access + Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё upsert РІ enrollments
5. РЎС‚СѓРґРµРЅС‚ РїРѕР»СѓС‡Р°РµС‚ СѓРІРµРґРѕРјР»РµРЅРёРµ в†’ РїРµСЂРµС…РѕРґРёС‚ РІ СЃРїРёСЃРѕРє РєСѓСЂСЃРѕРІ в†’ РєСѓСЂСЃ СѓР¶Рµ СЃ РїСЂРѕРіСЂРµСЃСЃРѕРј Рё СѓСЂРѕРєР°РјРё

### API Endpoints (РЅРѕРІС‹Рµ)
| Endpoint | РњРµС‚РѕРґ | РќР°Р·РЅР°С‡РµРЅРёРµ |
|----------|-------|-----------|
| /api/course-access/request | POST | РЎС‚СѓРґРµРЅС‚ Р·Р°РїСЂР°С€РёРІР°РµС‚ РґРѕСЃС‚СѓРї (СѓРІРµРґРѕРјР»РµРЅРёРµ СѓС‡РёС‚РµР»СЏРј/Р°РґРјРёРЅР°Рј) |
| /api/course-access/grant | POST | РЈС‡РёС‚РµР»СЊ РІС‹РґР°С‘С‚ РґРѕСЃС‚СѓРї (course_access + enrollments) |
| /api/course-access/check?courseId=X | GET | РџСЂРѕРІРµСЂРєР° РґРѕСЃС‚СѓРїР° (С‡РµСЂРµР· RPC check_course_access) |
| /api/course-access/student-courses?studentId=X | GET | РЎРїРёСЃРѕРє РІС‹РґР°РЅРЅС‹С… РґРѕСЃС‚СѓРїРѕРІ СѓС‡РµРЅРёРєР° (РґР»СЏ РјРѕРґР°Р»РєРё) |
| /api/course-access/revoke | POST | РћС‚Р·С‹РІ РґРѕСЃС‚СѓРїР° (СѓРґР°Р»РµРЅРёРµ course_access + enrollment) |

### РўР°Р±Р»РёС†С‹ Р‘Р”
- **course_access** вЂ” student_id, course_id, granted_by, granted_at, expires_at, eason
- **profiles** вЂ” РґРѕР±Р°РІР»РµРЅРѕ РїРѕР»Рµ subscription_requested_at (timestamp)

### Owner bypass
РЎРѕР·РґР°С‚РµР»СЊ РєСѓСЂСЃР° (`created_by`) РІСЃРµРіРґР° РёРјРµРµС‚ РґРѕСЃС‚СѓРї вЂ” `check_course_access` РЅРµ РІС‹Р·С‹РІР°РµС‚СЃСЏ РµСЃР»Рё `user.id === course.created_by`. Р РµР°Р»РёР·РѕРІР°РЅРѕ РІ:
- `courses/[courseId]/page.tsx` вЂ” `isOwner` РїСЂРѕРїСѓСЃРєР°РµС‚ РїСЂРѕРІРµСЂРєСѓ
- `courses/page.tsx` вЂ” `ownedIds` РґРѕР±Р°РІР»СЏСЋС‚СЃСЏ Рє СЃРїРёСЃРєСѓ РґРѕСЃС‚СѓРїРЅС‹С… РєСѓСЂСЃРѕРІ
- `api/course-access/check/route.ts` вЂ” РїСЂРѕРІРµСЂРєР° `course.created_by === user.id` в†’ `{ hasAccess: true }`

### RPC
- check_course_access(uid uuid, cid uuid) вЂ” РІРѕР·РІСЂР°С‰Р°РµС‚ true РµСЃР»Рё РµСЃС‚СЊ РґРµР№СЃС‚РІСѓСЋС‰Р°СЏ Р·Р°РїРёСЃСЊ РІ course_access (expires_at IS NULL OR expires_at > now())

### Р¤СЂРѕРЅС‚РµРЅРґ
- CourseAccessControl вЂ” РјРѕРґР°Р»РєР° РІС‹РґР°С‡Рё/РѕС‚Р·С‹РІР° РґРѕСЃС‚СѓРїР° РІ СѓС‡РёС‚РµР»СЊСЃРєРѕР№
- RequestAccessButton вЂ” РєРЅРѕРїРєР° Р·Р°РїСЂРѕСЃР° РґРѕСЃС‚СѓРїР° РЅР° СЃС‚СЂР°РЅРёС†Рµ РєСѓСЂСЃР°
- EnrollButton вЂ” РїСЂРё 403 (РґРѕСЃС‚СѓРї РѕРіСЂР°РЅРёС‡РµРЅ) РјРµРЅСЏРµС‚ С‚РµРєСЃС‚ РЅР° В«Р—Р°РїСЂРѕСЃРёС‚СЊ РґРѕСЃС‚СѓРї Сѓ СѓС‡РёС‚РµР»СЏВ»
- РЎС‚СЂР°РЅРёС†С‹: orce-dynamic РґР»СЏ Р°РєС‚СѓР°Р»СЊРЅРѕСЃС‚Рё РґР°РЅРЅС‹С…

### Р’Р°Р¶РЅС‹Рµ С„Р°Р№Р»С‹ (РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕ)
| Р¤Р°Р№Р» | РќР°Р·РЅР°С‡РµРЅРёРµ |
|------|-----------|
| src/app/api/course-access/request/route.ts | Р—Р°РїСЂРѕСЃ РґРѕСЃС‚СѓРїР° |
| src/app/api/course-access/grant/route.ts | Р’С‹РґР°С‡Р° РґРѕСЃС‚СѓРїР° + auto-enrollment |
| src/app/api/course-access/check/route.ts | РџСЂРѕРІРµСЂРєР° РґРѕСЃС‚СѓРїР° |
| src/app/api/course-access/student-courses/route.ts | РЎРїРёСЃРѕРє РґРѕСЃС‚СѓРїРѕРІ СѓС‡РµРЅРёРєР° |
| src/app/api/course-access/revoke/route.ts | РћС‚Р·С‹РІ РґРѕСЃС‚СѓРїР° |
| src/app/(dashboard)/admin/teachers/course-access-control.tsx | РњРѕРґР°Р»РєР° РІС‹РґР°С‡Рё |
| src/app/(dashboard)/courses/[courseId]/request-access-button.tsx | РљРЅРѕРїРєР° Р·Р°РїСЂРѕСЃР° |
| src/app/(dashboard)/courses/enroll-button.tsx | РЈРјРЅР°СЏ РєРЅРѕРїРєР° (403в†’Р·Р°РїСЂРѕСЃ) |

## 19. РџРѕРґРїРёСЃРєР° Рё СѓРІРµРґРѕРјР»РµРЅРёСЏ

### РЎС‚Р°С‚СѓСЃС‹ РїРѕРґРїРёСЃРєРё
- `profiles.subscription_until` вЂ” РґР°С‚Р° РѕРєРѕРЅС‡Р°РЅРёСЏ. NULL = РїРѕРґРїРёСЃРєРё РЅРµС‚.
- `profiles.credit_days` вЂ” РєСЂРµРґРёС‚ (РґРЅРё РІ РґРѕР»Рі РѕС‚ С€РєРѕР»С‹, РїРѕРіР°С€Р°РµС‚СЃСЏ РѕРїР»Р°С‚РѕР№).
- `subscription_credit_history` вЂ” РёСЃС‚РѕСЂРёСЏ РѕРїРµСЂР°С†РёР№ (gift/credit/payment/writeoff/close).
- `check_subscription(uid)` RPC вЂ” true РµСЃР»Рё `subscription_until > now()`.

### РЈРІРµРґРѕРјР»РµРЅРёСЏ Рѕ РїРѕРґРїРёСЃРєРµ
- **РЎС‚Р°РґРёРё:** Р·Р° 5 РґРЅРµР№, Р·Р° 1 РґРµРЅСЊ, В«Р·Р°РєРѕРЅС‡РёР»Р°СЃСЊВ».
- **РњРµС…Р°РЅРёРєР°:** РµРґРёРЅС‹Р№ РјРѕРґСѓР»СЊ `src/lib/subscription-reminders.ts`:
  - `getReminderStage(daysLeft)` вЂ” С‚РµРєСЃС‚ РґР»СЏ СЃР°Р№С‚Р° (title/body/link в†’ `/settings`) Рё email (subject/text в†’ `/pricing`).
  - `ensureSubscriptionReminder()` вЂ” РґРµРґСѓРїР»РёРєР°С†РёСЏ РїРѕ `title+body` (СЃР°Р№С‚) Рё РїРѕ С‚Р°Р±Р»РёС†Рµ `subscription_email_log` (email, retry РїСЂРё СЃР±РѕРµ SMTP).
  - `sendSubscriptionEmail()` вЂ” nodemailer С‡РµСЂРµР· SMTP РЇРЅРґРµРєСЃ, РѕС€РёР±РєРё Р»РѕРіРёСЂСѓСЋС‚СЃСЏ РІ console.error.
- **Р—Р°РїСѓСЃРє:**
  1. **РњРіРЅРѕРІРµРЅРЅРѕ РїСЂРё РІС…РѕРґРµ** вЂ” `SubscriptionCheckOnLogin` РІ `(dashboard)/layout.tsx` в†’ GET `/api/subscription/check` (emailMode "only-on-create").
  2. **Р•Р¶РµРґРЅРµРІРЅС‹Р№ cron** вЂ” `/api/cron/subscription-expiry` (Р·Р°С‰РёС‰С‘РЅ CRON_SECRET), РІС‹Р·С‹РІР°РµС‚СЃСЏ GitHub Actions `cron-subscription.yml` (06:00 UTC, emailMode "always").

### РўР°Р±Р»РёС†Р° subscription_email_log
- `user_id`, `stage` (in_5_days / in_1_day / expired), `UNIQUE(user_id, stage)`.
- РќСѓР¶РЅР° РґР»СЏ РїРѕРІС‚РѕСЂРЅРѕР№ РѕС‚РїСЂР°РІРєРё РїРёСЃСЊРјР°: РµСЃР»Рё SMTP СѓРїР°Р» РІ РїРµСЂРІС‹Р№ СЂР°Р·, РїРёСЃСЊРјРѕ СѓР№РґС‘С‚ РїСЂРё СЃР»РµРґСѓСЋС‰РµРј Р·Р°РїСѓСЃРєРµ.

### РљР»СЋС‡РµРІС‹Рµ С„Р°Р№Р»С‹
| Р¤Р°Р№Р» | РќР°Р·РЅР°С‡РµРЅРёРµ |
|------|-----------|
| src/lib/subscription-reminders.ts | Р›РѕРіРёРєР° СѓРІРµРґРѕРјР»РµРЅРёР№ + email |
| src/app/api/subscription/check/route.ts | РњРіРЅРѕРІРµРЅРЅР°СЏ РїСЂРѕРІРµСЂРєР° РїСЂРё РІС…РѕРґРµ |
| src/app/api/cron/subscription-expiry/route.ts | Cron СѓРІРµРґРѕРјР»РµРЅРёР№ |
| src/app/api/subscription/extend/route.ts | Р’С‹РґР°С‡Р° РїРѕРґР°СЂРєР°/РєСЂРµРґРёС‚Р°/СЃРїРёСЃР°РЅРёРµ |
| src/app/api/subscription/credit-history/route.ts | РСЃС‚РѕСЂРёСЏ РѕРїРµСЂР°С†РёР№ |
| src/app/api/subscription/request-extend/route.ts | Р—Р°РїСЂРѕСЃ РїСЂРѕРґР»РµРЅРёСЏ |
| src/app/(dashboard)/settings/credit-history.tsx | РСЃС‚РѕСЂРёСЏ РєСЂРµРґРёС‚Р° РґР»СЏ СѓС‡РµРЅРёРєР° |
| src/components/subscription-check-on-login.tsx | РљР»РёРµРЅС‚СЃРєРёР№ С…СѓРє РїСЂРё РІС…РѕРґРµ |

## 20. Р”РёСЂРµРєС‚РѕСЂ С€РєРѕР»С‹
- `profiles.is_director` вЂ” С„Р»Р°Рі (СЃС‚Р°РІРёС‚ Р°РґРјРёРЅ, С‚РѕР»СЊРєРѕ РѕРґРёРЅ РґРёСЂРµРєС‚РѕСЂ).
- Р—Р°РїСЂРѕСЃ РїСЂРѕРґР»РµРЅРёСЏ РїРѕРґРїРёСЃРєРё в†’ РґРёСЂРµРєС‚РѕСЂСѓ (РµСЃР»Рё РµСЃС‚СЊ), РёРЅР°С‡Рµ РїРµСЂРІРѕРјСѓ СѓС‡РёС‚РµР»СЋ.
- Р—Р°РїСЂРѕСЃ РґРѕСЃС‚СѓРїР° Рє РєСѓСЂСЃСѓ в†’ РґРёСЂРµРєС‚РѕСЂСѓ (РµСЃР»Рё РµСЃС‚СЊ), РёРЅР°С‡Рµ РІСЃРµРј СѓС‡РёС‚РµР»СЏРј.
- `src/lib/director.ts` + `src/app/api/set-director/route.ts`.

## 21. RPC-Р°РіСЂРµРіР°С†РёСЏ (СЌС‚Р°Рї B1 РѕРїС‚РёРјРёР·Р°С†РёРё, v0.7.2)
РЎРµСЂРІРµСЂРЅС‹Рµ СЃС‚СЂР°РЅРёС†С‹ РїРѕР»СѓС‡Р°СЋС‚ РґР°РЅРЅС‹Рµ **РѕРґРЅРёРј РІС‹Р·РѕРІРѕРј** Postgres-С„СѓРЅРєС†РёРё РІРјРµСЃС‚Рѕ 6вЂ“12 РїРѕСЃР»РµРґРѕРІР°С‚РµР»СЊРЅС‹С… Р·Р°РїСЂРѕСЃРѕРІ (51в†’5). Р¤СѓРЅРєС†РёРё РІ `supabase/rpc-aggregation.sql` (РїСЂРёРјРµРЅС‘РЅ РІ Supabase):

| Р¤СѓРЅРєС†РёСЏ | РЎС‚СЂР°РЅРёС†Р° | Р‘С‹Р»Рѕ Р·Р°РїСЂРѕСЃРѕРІ | РЎС‚Р°Р»Рѕ |
|---------|----------|:---:|:---:|
| `get_home_data(uid)` | Р“Р»Р°РІРЅР°СЏ `/` | 10 | 1 |
| `get_course_page(uid, cid)` | РљСѓСЂСЃ `/courses/[courseId]` | 6 | 1 |
| `get_lesson_page(uid, cid, lid)` | РЈСЂРѕРє `/courses/[courseId]/[lessonId]` | 12 | 1 |
| `get_course_list(uid)` | РЎРїРёСЃРѕРє `/courses` | 9 | 1+1 |
| `get_chat_data(uid)` | Р§Р°С‚ `/tools/chat` | 5вЂ“7 | 1 (v0.8.0, СЃРј. В§23) |

- Р’СЃРµ С„СѓРЅРєС†РёРё вЂ” `SECURITY DEFINER` (`SET search_path='public'`), РїСЂРёРЅРёРјР°СЋС‚ `uid` Рё РїСЂРѕРІРµСЂСЏСЋС‚ РґРѕСЃС‚СѓРї РІРЅСѓС‚СЂРё SQL.
- Р›РѕРіРёРєР° СЂРµРґРёСЂРµРєС‚РѕРІ СЃРѕС…СЂР°РЅРёР»Р°СЃСЊ: РЅРµРѕРїСѓР±Р»РёРєРѕРІР°РЅРЅС‹Р№ СѓСЂРѕРє РІРёРґРёС‚ С‚РѕР»СЊРєРѕ РІР»Р°РґРµР»РµС† (`@page.tsx:42-44`), РѕС‚СЃСѓС‚СЃС‚РІРёРµ РґРѕСЃС‚СѓРїР° в†’ СЂРµРґРёСЂРµРєС‚ РЅР° `/courses`.
- РРЅРґРµРєСЃС‹: `lesson_blocks(lesson_id, order_index)`, `enrollments(student_id)`, `course_access(student_id)`, `lesson_progress(student_id, lesson_id)`, `content(type,status,sort_order)`, `chat_messages(chat_id, created_at)` Рё РґСЂ. вЂ” 14 С€С‚СѓРє.
- РћР±РЅРѕРІР»РµРЅРёРµ С„СѓРЅРєС†РёРё РїРѕСЃР»Рµ РїСЂР°РІРєРё SQL: РїРµСЂРµР·Р°РїСѓСЃС‚РёС‚СЊ `CREATE OR REPLACE FUNCTION ...` РІ Supabase SQL Editor.

## 22. Р¤РёРєСЃС‹ UX (v0.7.3)

### `<Avatar>` вЂ” РµРґРёРЅС‹Р№ Р°РІР°С‚Р°СЂ (`src/components/avatar.tsx`)
- Р’СЃРµ Р°РІР°С‚Р°СЂС‹ (С€Р°РїРєР°, РЅР°СЃС‚СЂРѕР№РєРё, С‡Р°С‚, СѓРІРµРґРѕРјР»РµРЅРёСЏ, СѓС‡РёС‚РµР»СЊСЃРєР°СЏ, РїСЂРѕРІРµСЂРєР°) РёРґСѓС‚ С‡РµСЂРµР· РєРѕРјРїРѕРЅРµРЅС‚ `<Avatar>`:
  - URL С‡РµСЂРµР· РїСЂРѕРєСЃРё `/api/storage` СЃ `?w={size}&q=65&fm=webp` (РјР°Р»РµРЅСЊРєРёР№ РІРµСЃ).
  - Р•СЃР»Рё РєР°СЂС‚РёРЅРєР° РЅРµ РіСЂСѓР·РёС‚СЃСЏ (`onError`) вЂ” РїРѕРєР°Р·С‹РІР°РµС‚СЃСЏ РїРµСЂРІР°СЏ Р±СѓРєРІР° РёРјРµРЅРё (fallback).
- Р—Р°РјРµРЅРёР» СЃС‹СЂС‹Рµ `<img>` РІ: `user-menu`, `dashboard-header`, `settings-form`, `tools/chat`, `notifications`, `admin/teachers/profile-list`, `admin/submissions/submissions-list`, `admin/courses/[courseId]`, `content/[id]`, `submission-thread`.

### РљСЌС€ РєР°СЂС‚РёРЅРѕРє РІ РїСЂРѕРєСЃРё (`src/app/api/storage/[...path]/route.ts`)
- In-memory РєСЌС€ РѕР±СЂР°Р±РѕС‚Р°РЅРЅС‹С… РєР°СЂС‚РёРЅРѕРє: `Map` (РєР»СЋС‡ вЂ” URL), TTL 10 РјРёРЅ, Р»РёРјРёС‚ 500 Р·Р°РїРёСЃРµР№, LRU-evict.
- РџРѕРІС‚РѕСЂРЅС‹Р№ Р·Р°РїСЂРѕСЃ С‚РѕРіРѕ Р¶Рµ URL в†’ `X-Storage-Cache: hit` (РЅРµ РїРѕРІС‚РѕСЂСЏРµС‚ sharp/fetch).
- РћС‚РІРµС‚С‹ СЃ `Cache-Control: public, max-age=86400, s-maxage=86400, immutable` вЂ” Р±СЂР°СѓР·РµСЂ РЅРµ РїРµСЂРµРєР°С‡РёРІР°РµС‚.

### RPC `clear_lesson_answers(student_id, lesson_id)` (`supabase/rpc-aggregation.sql`)
- РЈРґР°Р»СЏРµС‚ РѕС‚РІРµС‚С‹ Р±Р»РѕРєР° (`block_submissions`) + РїСЂРѕРіСЂРµСЃСЃ СѓСЂРѕРєР° (`lesson_progress`) РІ **РѕРґРЅРѕР№ С‚СЂР°РЅР·Р°РєС†РёРё**.
- РљРЅРѕРїРєР° В«РћС‡РёСЃС‚РёС‚СЊ РѕС‚РІРµС‚С‹В» (`clear-answers-button.tsx`): 1 РІС‹Р·РѕРІ RPC + `router.refresh()` (Р±РµР· РїРѕР»РЅРѕР№ РїРµСЂРµР·Р°РіСЂСѓР·РєРё СЃС‚СЂР°РЅРёС†С‹).
- Р Р°РЅСЊС€Рµ Р±С‹Р»Рѕ 2 РєР»РёРµРЅС‚СЃРєРёС… Р·Р°РїСЂРѕСЃР° + `window.location.reload()` вЂ” СѓСЂРѕРє СЃ 13 Р±Р»РѕРєР°РјРё РІРёСЃ РІРёСЃРµР» ~1 РјРёРЅ.

### Р”РѕСЃС‚СѓРї Рє С‡РµСЂРЅРѕРІРёРєР°Рј СѓСЂРѕРєРѕРІ
- `page.tsx` СѓСЂРѕРєР°: СЂРµРґРёСЂРµРєС‚ РґР»СЏ РЅРµРѕРїСѓР±Р»РёРєРѕРІР°РЅРЅС‹С… СѓСЂРѕРєРѕРІ РїСЂРѕРїСѓСЃРєР°РµС‚ `isAdmin` Рё РІР»Р°РґРµР»СЊС†Р° РєСѓСЂСЃР°.
- RPC `get_course_page`: СЃРїРёСЃРѕРє СѓСЂРѕРєРѕРІ С„РёР»СЊС‚СЂСѓРµС‚ С‡РµСЂРЅРѕРІРёРєРё (`published OR Р°РґРјРёРЅ OR РІР»Р°РґРµР»РµС†`).

### РЎС‚Р°С‚РёСЃС‚РёРєР°
- `/api/stats` вЂ” `revalidate = 0` + `Cache-Control: no-store` (Р±С‹Р»Рё СѓСЃС‚Р°СЂРµРІС€РёРµ С†РёС„СЂС‹ РёР· РєСЌС€Р°).

## 23. РЎРєРѕСЂРѕСЃС‚СЊ РґР°С€Р±РѕСЂРґР° (v0.8.0, Р·Р°РґРµРїР»РѕРµРЅ вЂ” `73e60ff` в†’ `deploy-1788547720`)

### Р§Р°С‚ РЅР° 1 Р·Р°РїСЂРѕСЃ (`/api/chat/init`)
- `src/app/api/chat/init/route.ts`: `POST` в†’ RPC `get_chat_data(uid)` (РїСЂРѕС„РёР»СЊ, СѓС‡РёС‚РµР»СЏ, РёСЃС‚РѕСЂРёСЏ, РїРѕРґРїРёСЃРєР° РІ РѕРґРЅРѕР№ С‚СЂР°РЅР·Р°РєС†РёРё). Р•СЃР»Рё RPC СѓРїР°Р» вЂ” fallback `legacyInit()` РЅР° СЃС‚Р°СЂРѕР№ РєР»РёРµРЅС‚СЃРєРѕР№ Р»РѕРіРёРєРµ (С‡Р°С‚ РЅРµ Р»РѕРјР°РµС‚СЃСЏ).
- `tools/chat/page.tsx`: РЅР°С‡Р°Р»СЊРЅР°СЏ Р·Р°РіСЂСѓР·РєР° РѕРґРЅРёРј `fetch("/api/chat/init")` РІРјРµСЃС‚Рѕ `/api/auth/me` + `/api/chat/teachers` + `/api/chat`.

### Р”РµРґСѓРїР»РёРєР°С†РёСЏ СЃРµСЃСЃРёРё РЅР° РґР°С€Р±РѕСЂРґРµ (`src/lib/auth-cache.ts`)
- `getServerClient()` вЂ” `React.cache()`-РѕР±С‘СЂС‚РєР° РЅР°Рґ `createClient()`: **1 Supabase-РєР»РёРµРЅС‚ РЅР° HTTP-Р·Р°РїСЂРѕСЃ**.
- `getCurrentUser()` вЂ” `React.cache()`-РѕР±С‘СЂС‚РєР° РЅР°Рґ `auth.getUser()` + `profiles`: **1 `getUser` + 1 `profiles` РЅР° Р·Р°РїСЂРѕСЃ** (Р±С‹Р»Рѕ: 3Г—`getUser` РІ layout + 2Г—`profiles` РІ СЃС‚СЂР°РЅРёС†Р°С…, РєРѕС‚РѕСЂС‹Рµ РґСѓР±Р»РёСЂРѕРІР°Р»Рё РґСЂСѓРі РґСЂСѓРіР°).
- РџРµСЂРµРІРµРґРµРЅС‹: `(dashboard)/layout.tsx`, РєСѓСЂСЃС‹ (СЃРїРёСЃРѕРє/РєСѓСЂСЃ/СѓСЂРѕРє), `settings`, `admin/teachers`, `admin/submissions`, `admin/courses/[courseId]`, `admin/lessons/[lessonId]` (РґР»СЏ RLS-Р·Р°РїСЂРѕСЃРѕРІ вЂ” `getServerClient()`), `tools/chat`.
- Client-СЃС‚СЂР°РЅРёС†С‹ (`admin/stats`, `admin/history`, `admin/content*`, `admin/courses/new`) РёСЃРїРѕР»СЊР·СѓСЋС‚ `@/lib/supabase/client` вЂ” РЅРµ Р·Р°С‚СЂРѕРЅСѓС‚С‹.

### B7 (РєСЌС€ РїСѓР±Р»РёС‡РЅС‹С… СЃС‚СЂР°РЅРёС†) вЂ” РѕР±СЉСЏСЃРЅРµРЅРёРµ, РїРѕС‡РµРјСѓ РЅРµ СЃРґРµР»Р°РЅРѕ
- `export const revalidate = 60` РЅР° РїСѓР±Р»РёС‡РЅС‹Рµ СЃС‚СЂР°РЅРёС†С‹ (catalog/content/reviews/about/teachers) **РЅРµ РґР°С‘С‚ ISR**: СЃС‚СЂР°РЅРёС†С‹ РѕСЃС‚Р°СЋС‚СЃСЏ `Ж’ Dynamic`, С‚.Рє. `supabaseFetch` (`server.ts`) РґРµР»Р°РµС‚ РѕР±С‹С‡РЅС‹Р№ `fetch` Р±РµР· `next:{revalidate}`.
- Р’РєР»СЋС‡РµРЅРёРµ revalidate РїСЂРё РґР°РЅРЅС‹С… РёР· cookies/Р°РІС‚РѕСЂРёР·Р°С†РёРё СЂРёСЃРєРѕРІР°РЅРЅРѕ (СѓСЃС‚Р°СЂРµРІС€РёР№ РєРѕРЅС‚РµРЅС‚ СѓС‡РёС‚РµР»СЏ). РћС‚РєР»РѕРЅРµРЅРѕ РЅР° СЃРµСЃСЃРёРё 04.09.2026.

## РћС‚РґР°С‡Р° С„Р°Р№Р»РѕРІ РёР· Supabase Storage (v0.8.2, 05.09.2026)

### РџРѕС‚РѕР»РѕРє РїР»Р°С‚С„РѕСЂРјС‹
Yandex Serverless Containers РѕР±СЂРµР·Р°РµС‚ Р»СЋР±РѕР№ РѕС‚РІРµС‚ РЅР° **3 670 016 Р‘ (~3.5MB)** в†’ `JobResponseTooLong`, Сѓ РєР»РёРµРЅС‚Р° EOF/502/Р±РёС‚С‹Рµ С„Р°Р№Р»С‹. РќРµР»СЊР·СЏ РіРѕРЅСЏС‚СЊ С„Р°Р№Р»С‹ С†РµР»РёРєРѕРј С‡РµСЂРµР· С€Р»СЋР·.

### РЎС…РµРјР° `/api/storage/[...path]` (v0.8.3)
1. **РљР°СЂС‚РёРЅРєРё** (`image/*`) вЂ” Р»РѕРєР°Р»СЊРЅС‹Р№ resize-РїСЂРѕРєСЃРё (РґРѕ 1920px, WebP/AVIF). **РЎРµРјР°С„РѕСЂ РЅР° 3 РїР°СЂР°Р»Р»РµР»СЊРЅС‹С… resize** (`imageSlots = 3`): РЅР° С…РѕР»РѕРґРЅРѕРј СЃС‚Р°СЂС‚Рµ sharp+upstream РЅРµ РіРѕРЅСЏСЋС‚ РІСЃРµ Р·Р°РїСЂРѕСЃС‹ СЂР°Р·РѕРј в†’ РёСЃС‡РµР·Р°РµС‚ В«502-С€С‚РѕСЂРјВ» (РёС€СЊСЋ #59). РћС‡РµСЂРµРґСЊ РїР»Р°С‚РЅР°СЏ (РѕР±РґСѓРјР°С‚СЊ РїСЂРё СЂРѕСЃС‚Рµ; Р°Р»СЊС‚РµСЂРЅР°С‚РёРІР° вЂ” СЃР»Р°Р№СЃ РїРѕ РїР°РјСЏС‚Рё РєРѕРЅС‚РµР№РЅРµСЂР°).
2. **РќРµ-РєР°СЂС‚РёРЅРєРё РЅР° РїСЂРѕРґРµ (`NODE_ENV !== "development"`)** вЂ” **307 в†’ РїРѕРґРїРёСЃР°РЅРЅС‹Р№ URL Supabase** (РёС€СЊСЋ #53, РђРљРўРР’РќРћ): `rawPostSign(bucket, path)` вЂ” РїСЂСЏРјРѕР№ REST `POST https://.../storage/v1/object/sign/<bucket>/<path>` (Р·Р°РіРѕР»РѕРІРєРё `apikey` + `Authorization: Bearer <anon>`, С‚РµР»Рѕ `{"expiresIn":21600}`, `node:https`, timeout 15СЃ) в†’ `307 Location: https://supabase.co<signedURL>`. РџРѕРґРїРёСЃСЊ Р°РЅРѕРЅ-РєР»СЋС‡РѕРј (Р±РµР· service-role). Р—Р°РїСЂРѕСЃ Р±СЂР°СѓР·РµСЂР° СЃСЂР°Р·Сѓ СѓС…РѕРґРёС‚ РЅР° Supabase вЂ” РїР»Р°С‚С„РѕСЂРјРµРЅРЅС‹Р№ РїРѕС‚РѕР»РѕРє С€Р»СЋР·Р° РЅРµ Р·Р°С‚СЂР°РіРёРІР°РµС‚СЃСЏ, С„Р°Р№Р» РѕС‚РґР°С‘С‚СЃСЏ С†РµР»РёРєРѕРј СЃ РЅР°С‚РёРІРЅС‹Рј Range. Р•СЃР»Рё `rawPostSign` РІРµСЂРЅСѓР» null вЂ” fallback РЅР° Рї.3-4.
3. **Р—Р°РїСЂРѕСЃ СЃ Range** (РµСЃР»Рё РїРѕРґРїРёСЃСЊ РЅРµ СѓРґР°Р»Р°СЃСЊ/РЅРµ-cСѓРґСЊР±Р°) вЂ” BFF РґРµР»Р°РµС‚ upstream `Range: bytes=0-1048575` (1MB), РѕС‚РґР°С‘С‚ 206 + `Content-Range`; РєР»РёРµРЅС‚ (media) СЃРєР»РµРёРІР°РµС‚ (`fix-range`).
4. **Plain GET** вЂ” РІРµР±-СЃС‚СЂР°РЅРёС†Р°-В«СЃР±РѕСЂС‰РёРєВ» (assist): JS РєР»РёРµРЅС‚Р° СЃР°Рј РІС‹РєР°С‚С‹РІР°РµС‚ СЃР»Р°Р№СЃС‹ РїРѕ 1MB Рё СЃРѕР±РёСЂР°РµС‚ Blob (PDF Рё РґСЂ.). РџСЂРѕРІРµСЂРµРЅРѕ end-to-end, СЂР°Р±РѕС‚Р°РµС‚ РґР»СЏ С„Р°Р№Р»РѕРІ Р»СЋР±С‹С… СЂР°Р·РјРµСЂРѕРІ.
- РљР°СЂС‚РёРЅРєРё `object/sign/...?token=` (СЃС‚Р°СЂС‹Рµ Р·Р°РїРёСЃРё) вЂ” РїСЂРѕРєСЃРёСЂСѓСЋС‚СЃСЏ РЅР° `storage/v1/object/sign/...` (Р±РµР· РїРѕРґРїРёСЃРё; СЂР°Р·РѕРІРѕРµ 400 вЂ” С‚СЂР°РЅР·РёС‚РЅС‹Р№ QoS, РєРѕРґ С‚СѓС‚ РЅРё РїСЂРё С‡С‘Рј, РёС€СЊСЋ #58).

### Service worker (`public/sw.js, v6`)
- v5 СЃРѕРґРµСЂР¶Р°Р» СЃРёРЅС‚Р°РєСЃРёС‡РµСЃРєСѓСЋ РѕС€РёР±РєСѓ (В«Unexpected token ')'В» РІ РІРµС‚РєРµ РєСЌС€Р° `/_next/static/`) вЂ” Р±СЂР°СѓР·РµСЂ РЅРµ РјРѕРі РёРЅСЃС‚Р°Р»Р»РёСЂРѕРІР°С‚СЊ СЃРІРµР¶РёР№ SW. Р’ v6 СЃРєРѕР±РєРё РїРѕС‡РёРЅРµРЅС‹, `node --check` РїСЂРѕС…РѕРґРёС‚. Р›РѕРіРёРєР° v5: Р±РµР· РєР»РѕРЅРёСЂРѕРІР°РЅРёСЏ RSC-РѕС‚РІРµС‚РѕРІ, Р±РµР· С‚Р°Р№РјР°СѓС‚Р° РЅР°РІРёРіР°С†РёРё, РєСЌС€ С‚РѕР»СЊРєРѕ `/_next/static/`. Р’РµСЂСЃРёСЏ вЂ” `nf-v{n}`; Р°РєС‚РёРІР°С†РёСЏ вЂ” РѕРґРЅР° РїРµСЂРµР·Р°РіСЂСѓР·РєР° Р±СЂР°СѓР·РµСЂР°.

### Origin РёР· С€Р»СЋР·Р° (`src/lib/request-origin.ts`)
Yandex gateway РЅР°РїСЂР°РІР»СЏРµС‚ Р·Р°РїСЂРѕСЃ РІ РєРѕРЅС‚РµР№РЅРµСЂ СЃ СЂРµР°Р»СЊРЅС‹Рј origin РєР°Рє `https://0.0.0.0:8080` вЂ” РЅРµР»СЊР·СЏ С‡РёС‚Р°С‚СЊ РёР· `request.url`/`headers.host`. Origin Р±РµСЂС‘С‚СЃСЏ РёР· `x-forwarded-proto`/`x-forwarded-host` (РёС… СЃС‚Р°РІРёС‚ С€Р»СЋР·), РёРЅР°С‡Рµ РїР°РґР°РµС‚ РЅР° `proto`/`host`, РІ СЃР°РјРѕРј РєСЂР°Р№РЅРµРј СЃР»СѓС‡Р°Рµ вЂ” `https://localhost:3000`.

### Р СѓС‡РЅРѕР№ РґРµРїР»РѕР№ вЂ” РћР‘РЇР—РђРўР•Р›Р¬РќРћ build-args + Environment
`NEXT_PUBLIC_*` Р·Р°РїРµРєР°СЋС‚СЃСЏ РЅР° СЃР±РѕСЂРєРµ. Р”Р»СЏ РїСЂРѕРґ-СЂРµРІРёР·РёРё РґРѕР»Р¶РЅС‹ СЃРѕРІРїР°РґР°С‚СЊ СЃРѕ `deploy.yml`:
- build-args: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL=https://naranja.outmilk.online`;
- `--environment` СЂРµРІРёР·РёРё: РїСЂРѕРґ-Р·РЅР°С‡РµРЅРёСЏ + СЃРµРєСЂРµС‚С‹ РёР· `.env.local` (SMTP, Yandex, CRON_SECRET).
- `.env.local` РќР• РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РґР»СЏ РїСЂРѕРґ-СЃР±РѕСЂРєРё: С‚Р°Рј `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.

### РР·РІРµСЃС‚РЅС‹Рµ РїСЂРѕР±Р»РµРјС‹ СЃСЂРµРґС‹ (05.09.2026, СѓСЃС‚СЂР°РЅРµРЅРѕ РІ v0.8.3)
- `SUPABASE_SERVICE_ROLE_KEY` СЃРјРµРЅРёР» СЃС…РµРјСѓ: РІ РЅРѕРІРѕР№ РїР°РЅРµР»Рё Supabase вЂ” **Publishable key** (`sb_publishable_...`, РїСѓР±Р»РёС‡РЅС‹Р№, Р°РЅР°Р»РѕРі anon) Рё **Secret key** (`sb_secret_<из .env.local / GH secrets>`, РїРѕР»РЅС‹Р№ РґРѕСЃС‚СѓРї, Р°РЅР°Р»РѕРі service_role). РЎС‚Р°СЂС‹Р№ service_role РїСЂРѕСЃСЂРѕС‡РµРЅ/СЃС…РµРјР° СѓРїСЂР°Р·РґРЅРµРЅР° (РёС€СЊСЋ #55). `.env.local`, GH secret `SUPABASE_SERVICE_ROLE_KEY` Рё `--environment` РїСЂРѕРґ-СЂРµРІРёР·РёРё РґРµСЂР¶Р°С‚СЊ Р°РєС‚СѓР°Р»СЊРЅС‹Р№ Secret key.
- GET-С‚РµСЃС‚С‹ Рє Supabase Storage С‚СЂРµР±СѓСЋС‚ Р”Р’Рђ Р·Р°РіРѕР»РѕРІРєР°: `apikey` + `Authorization: Bearer` вЂ” РёРЅР°С‡Рµ Р»РѕР¶РЅС‹Р№ `403 Invalid Compact JWS`.