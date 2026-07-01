
# Masdiri Plus — Complete Rebranding & Platform Rebuild

This is a very large scope. Below is what I'll do, phase by phase. I want to confirm a few key decisions before I start — see **Open Questions** at the bottom.

---

## Phase 1 — Remove the Automated News Scraper

- Delete edge functions: `news-fetcher`, `ai-journalist`, `ai-keywords`, `rates-fetcher`, `dynamic-rss`, `dynamic-sitemap`, `gsc-indexing`, `indexnow-submit`, `og-image`, `tts-reader` (audit each — keep only what's needed for manual workflow, likely just `admin-action` + `send-push` + `public-chat` if kept).
- Drop cron jobs (`pg_cron` schedules calling `news-fetcher`).
- Remove UI panels: `NewsFetcherPanel`, `SeoIndexingPanel`, `SeoKeywordsPanel`, `Phase2Dashboard`, `OgPreviewPanel`, `ApkReleasesPanel`.
- Delete DB helpers tied to scraping: `find_similar_article`, `clean_article_sources`, `clean_all_article_sources`, `sync_article_entities`, `auto_extract_article_metadata`, `auto_assign_article_category`, `infer_article_category`, `infer_tags`, `infer_governorate`, `bump_article_view_count` (keep), `phase2_dashboard_stats`, entity/merge/health/fetch-log tables.
- **Delete all scraper-generated articles** — keep only ones with `ai_rewritten = false` AND explicit manual origin.

## Phase 2 — Remove User Authentication

- Remove signup/login/forgot-password UI, `MandatoryOnboarding`, any auth-gated components.
- Keep **admin-only** PIN-based access to `/admin` (already exists via `ADMIN_PIN`).
- Public site becomes fully anonymous browsing.
- Update RLS: articles → public SELECT; comments/reactions → decide (see Q3).

## Phase 3 — New Brand Identity "Masdiri Plus"

Global find-and-replace across code + DB + configs:
- Name: **Masdiri Plus** / **مصدري بلس**
- Slogan: **مصدري بلس | الخبر من مصدره**
- Focus tags: بني سويف، قصص نجاح، مبادرات مجتمعية
- Footer credit: `👨‍💻 برئاسة وتطوير البشمبرمج: خالد عاطف عبدالحكيم`
- Domain: `https://masdiri.vercel.app/`
- Facebook: `https://www.facebook.com/masdiriplus` (header, footer, contact, `sameAs` in JSON-LD)
- Remove all "صوت البلد", "مصدري للأخبار المصرية والعالمية", "منصة مصدري الإخباري" strings and old phone numbers/branding.

## Phase 4 — UI/UX Redesign (Light Theme Only)

Rewrite `src/index.css` design tokens:
- Primary `#0EA5E9`, Secondary `#14B8A6`, Success `#22C55E`, Warning `#F59E0B`
- BG `#F8FAFC`, Surface `#FFFFFF`, Border `#E2E8F0`, Text `#1E293B`/`#64748B`
- Font: **Cairo** (headings + body)
- Remove dark theme, remove royal-navy/gold theme, remove `ThemeToggle`, `AutoNightMode`.
- Rebuild core layouts: `SiteHeader`, `SiteFooter`, `HeroBento` → new hero, `ArticleCard`, `MobileBottomNav`.
- New homepage sections: Hero → Latest → Most Read → Beni Suef → Success Stories → Inspiring People → Community Initiatives (categories tagged in DB).

## Phase 5 — Categories Refocus

Reseed `categories` table to:
`بني سويف`, `قصص نجاح`, `شخصيات ملهمة`, `مبادرات مجتمعية`, `إنجازات محلية`, `أخبار عامة`.
Migrate any surviving manual articles to closest new category.

## Phase 6 — SEO / AI Search

- Update `index.html` title/description/OG/Twitter/JSON-LD (Organization + NewsMediaOrganization + WebSite, `sameAs: [facebook]`).
- Per-route Helmet on Home, Category, Article, Static pages.
- Rebuild `public/robots.txt`, static `public/sitemap.xml` (or lightweight build-time generator based on `articles`).
- `public/manifest.webmanifest` → Masdiri Plus brand, colors.
- Article JSON-LD (`Article` + `BreadcrumbList`).
- `llms.txt` refreshed for AI crawlers.

## Phase 7 — Cleanup & Performance

- Remove unused: `PrepResultsPage`, `prep_results_2026` table + `prep-lookup` function (if you don't use it — see Q4), `SoutAlBaladBot`, `NewsCube3D`, `ProFeatures*` variants, `FloatingWhatsApp` (or repurpose to FB), `CurrencyWidget`, `BreakingTicker` (or keep), `TrendingTags`, unused ad components.
- Drop unused deps after removals.
- Lazy-load, image compression, Tailwind purge already on.

## Phase 8 — Verification

Typecheck, build, quick browser check of home + article + admin.

---

## Technical Notes

- Deleting scraper articles is **destructive and irreversible**. I'll identify them by `ai_rewritten = true` OR presence in `news_merge_log`/`news_fetch_log`. You'll approve the SQL before it runs.
- Removing auth means comments/reactions must either become anonymous (IP+captcha) or be removed. I recommend **remove** for simplicity.
- Edge function deletion: I'll delete after code is removed and published so rollback stays possible until then.

---

## Open Questions (please answer before I start)

1. **Comments & Reactions** — With no user auth, do you want me to (a) remove commenting entirely, or (b) allow anonymous comments with admin moderation?
2. **Prep Results 2026** feature (exam-results search) — keep or remove? It seems unrelated to the new Beni Suef focus.
3. **Bookmarks/Notifications/Push** — keep (localStorage + anonymous push) or remove?
4. **Existing manual articles** — do you have any? If yes, how do I distinguish them from scraped ones (any tag/field/author I can filter on)? If none, I'll wipe the `articles` table entirely and you'll start fresh.
5. **RSS feed** — keep a static/dynamic RSS for the new brand or remove entirely?

Once you answer these I'll execute the phases end-to-end.
