# دليل تبديل دومين الموقع — مصدري

الهدف: تستطيع ربط دومين جديد (مثلاً `masdiri.com`) دون البحث في عشرات الملفات.

---

## 1. الواجهة الأمامية (React) — مكان واحد فقط

كل صفحات `src/` و `scripts/prerender-articles.ts` تقرأ الدومين من:

```
src/lib/siteUrl.ts
```

لتغيير الدومين أضف متغيّر بيئة في ملف `.env` بالمشروع:

```
VITE_SITE_URL=https://your-new-domain.com
```

ثم أعد بناء/تشغيل المشروع. لا حاجة لتعديل أي مكوّن، canonical، og:url، JSON-LD، أزرار المشاركة، أو لوحة SEO — كلها تتبع `SITE_URL` تلقائيًا.

---

## 2. وظائف Supabase (Edge Functions) — متغيّر بيئة واحد

الوظائف التالية تقرأ من متغيّر `SITE_URL` (مع fallback للدومين الحالي):

- `supabase/functions/dynamic-sitemap/index.ts`
- `supabase/functions/dynamic-rss/index.ts`
- `supabase/functions/indexnow-submit/index.ts`
- `supabase/functions/gsc-indexing/index.ts`
- `supabase/functions/news-fetcher/index.ts` (صورة افتراضية)
- `supabase/functions/og-image/index.ts` (التذييل)

أضِف السر `SITE_URL` من لوحة الأسرار (Secrets) في Lovable Cloud وستتبعه كل الوظائف فورًا.

---

## 3. ملفات ثابتة يقرأها زحّافات Google مباشرة — تحديث يدوي

استبدل `masdiri.lovable.app` بالدومين الجديد في:

- `index.html`               ← (canonical, og:url, twitter:url, JSON-LD)
- `public/robots.txt`        ← (Sitemap: ...)
- `public/llms.txt`          ← (روابط مرجعية)
- `public/sitemap.xml`
- `public/sitemap-index.xml`
- `public/sitemap-news.xml`
- `public/news-sitemap.xml`
- `public/image-sitemap.xml`

> ملاحظة: ملفات `public/sitemap*.xml` تشير حاليًا إلى عناوين وظائف Supabase الديناميكية (المُحدَّثة آليًا)، لذا غالبًا لا تحتاج تعديل ما لم تنقل المشروع كاملاً.

---

## 4. لا تنسَ

- بعد التبديل: شغّل دفعة IndexNow من لوحة الإدارة لإخطار محرّكات البحث.
- حدّث الدومين في Google Search Console و Bing Webmaster.
- في Lovable: Project Settings → Domains → Connect Domain.
