// Auto news fetcher: pulls from Youm7 + Al-Masry Al-Youm RSS, rewrites with Gemini
// in "مصدري" style, and publishes automatically. Skips duplicates by hash.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-pin",
};

async function verifyAdmin(req: Request): Promise<boolean> {
  // Cron / server-to-server bypass via CRON_SECRET (Authorization: Bearer <CRON_SECRET> or x-cron-secret header)
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const auth = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
    const xcron = req.headers.get("x-cron-secret") || req.headers.get("X-Cron-Secret") || "";
    if (bearer === cronSecret || xcron === cronSecret) return true;
  }
  const provided = req.headers.get("x-admin-pin") || req.headers.get("X-Admin-Pin");
  if (!provided) return false;
  const { data } = await supabase.from("admin_settings").select("value").eq("key", "admin_code").maybeSingle();
  const current = (data?.value && typeof data.value === "string") ? data.value : (Deno.env.get("ADMIN_PIN") ?? "7777");
  return provided === current;
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

type NewsSource = { name: string; urls: string[]; base: string };

const SOURCES: NewsSource[] = [
  {
    name: "اليوم السابع",
    urls: [
      "https://www.youm7.com/rss/SectionRss?SectionID=65",
      "https://news.google.com/rss/search?q=site%3Ayoum7.com&hl=ar&gl=EG&ceid=EG:ar",
    ],
    base: "youm7",
  },
  {
    name: "المصري اليوم",
    urls: [
      "https://www.almasryalyoum.com/rss/rssfeeds",
      "https://news.google.com/rss/search?q=site%3Aalmasryalyoum.com&hl=ar&gl=EG&ceid=EG:ar",
    ],
    base: "almasryalyoum",
  },
  // بعض المواقع تحجب RSS المباشر أحياناً، لذلك لكل مصدر رابط احتياطي عبر Google News RSS.
  {
    name: "الوطن",
    urls: [
      "https://news.google.com/rss/search?q=site%3Aelwatannews.com&hl=ar&gl=EG&ceid=EG:ar",
      "https://news.google.com/rss/search?q=site%3Aelwatannews.com%20when%3A1d&hl=ar&gl=EG&ceid=EG:ar",
    ],
    base: "elwatan",
  },
  {
    name: "الأهرام",
    urls: [
      "https://news.google.com/rss/search?q=site%3Aahram.org.eg&hl=ar&gl=EG&ceid=EG:ar",
      "https://news.google.com/rss/search?q=site%3Agate.ahram.org.eg%20when%3A1d&hl=ar&gl=EG&ceid=EG:ar",
    ],
    base: "ahram",
  },
  {
    name: "نيوزروم",
    urls: [
      "https://www.newsroom.info/rss",
      "https://www.newsroom.info/feed",
      "https://www.newsroom.info/rss.xml",
      "https://news.google.com/rss/search?q=site%3Anewsroom.info&hl=ar&gl=EG&ceid=EG:ar",
      "https://news.google.com/rss/search?q=site%3Anewsroom.info%20when%3A1d&hl=ar&gl=EG&ceid=EG:ar",
    ],
    base: "newsroom",
  },
];

const RSS_SCAN_LIMIT = 100;
const MAX_INSERT_PER_SOURCE = 5;
const MIN_SOURCE_LENGTH = 60; // حد قبول المصدر قبل الذكاء الاصطناعي حتى لا يتوقف الصائد بسبب ملخصات RSS القصيرة
const MIN_ARTICLE_LENGTH = 450; // حد المقال النهائي بعد الصياغة فقط
const AI_REWRITE_LIMIT_PER_RUN = 8; // كل خبر يُقبل لا بد أن يمر على AI
const DEFAULT_NEWS_IMAGE = "https://masdiri.lovable.app/images/logo.png";


function pickSourcesForRun(fullRun: boolean): NewsSource[] {
  if (fullRun) return SOURCES;
  const minute = new Date().getUTCMinutes();
  return [SOURCES[minute % SOURCES.length]];
}

// Parse Arabic-formatted pubDate like: "الجمعة، 26 يونيو 2026 01:00 ص"
const AR_MONTHS: Record<string, number> = {
  "يناير": 0, "فبراير": 1, "مارس": 2, "إبريل": 3, "ابريل": 3, "أبريل": 3,
  "مايو": 4, "يونيو": 5, "يونية": 5, "يوليو": 6, "يوليه": 6, "يولية": 6,
  "أغسطس": 7, "اغسطس": 7, "سبتمبر": 8, "أكتوبر": 9, "اكتوبر": 9,
  "نوفمبر": 10, "ديسمبر": 11,
};
function parsePubDate(s: string): number {
  if (!s) return NaN;
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.getTime();
  // Arabic format
  const m = s.match(/(\d{1,2})\s+([^\s\d]+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(ص|م)?)?/);
  if (m) {
    const day = parseInt(m[1]);
    const mon = AR_MONTHS[m[2]];
    const year = parseInt(m[3]);
    let hour = m[4] ? parseInt(m[4]) : 0;
    const min = m[5] ? parseInt(m[5]) : 0;
    if (m[6] === "م" && hour < 12) hour += 12;
    if (m[6] === "ص" && hour === 12) hour = 0;
    if (mon !== undefined) return Date.UTC(year, mon, day, hour, min);
  }
  return NaN;
}



async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 9000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchRssItems(src: NewsSource) {
  let lastError = "RSS unavailable";
  for (const feedUrl of src.urls) {
    try {
      const res = await fetchWithTimeout(feedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "application/rss+xml, application/xml, text/xml, */*;q=0.8",
          "Accept-Language": "ar-EG,ar;q=0.9,en;q=0.6",
          "Accept-Language": "ar-EG,ar;q=0.9,en;q=0.6",
          ...(initHeaders()),
        },
      }, 14000);
      if (!res.ok) throw new Error(`RSS fetch ${res.status}`);
      const xml = await res.text();
      if (!/<item[\s>]/i.test(xml)) throw new Error("RSS returned no items");
      const items = parseRss(xml);
      if (items.length === 0) throw new Error("RSS parse returned 0 items");
      return { items, feedUrl };
    } catch (e) {
      lastError = `${e instanceof Error ? e.message : String(e)} @ ${feedUrl}`;
      console.warn(`RSS source failed for ${src.name}:`, lastError);
    }
  }
  throw new Error(lastError);
}

function initHeaders(): Record<string, string> {
  return { "Cache-Control": "no-cache" };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\s+/g, " ").trim();
}

function decodeHtml(value: string): string {
  return value
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function normalizeTitleForHash(title: string): string {
  return title
    .replace(/\s*[-–—|]\s*(اليوم السابع|المصري اليوم|الوطن|الأهرام|بوابة الأهرام|أخبار مصر)\s*$/u, "")
    .replace(/["'“”‘’]/g, "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function parseRss(xml: string) {
  const items: Array<{ title: string; link: string; description: string; image?: string; pubDate?: string }> = [];
  const itemRegex = /<item[\s\S]*?<\/item>/g;
  const matches = xml.match(itemRegex) || [];
  for (const item of matches) {
    const title = stripHtml(decodeHtml(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || ""));
    const link = decodeHtml(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "");
    const description = stripHtml(decodeHtml(
      item.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/)?.[1]
      || item.match(/<description>([\s\S]*?)<\/description>/)?.[1]
      || ""
    ));
    const image = decodeHtml(
      item.match(/<enclosure[^>]*url=["']([^"']+)["']/)?.[1]
      || item.match(/<media:content[^>]*url=["']([^"']+)["']/)?.[1]
      || item.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/)?.[1]
      || item.match(/<img[^>]*(?:data-original|data-src|src)=["']([^"']+)["']/)?.[1]
      || ""
    ) || undefined;
    const pubDate = (item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || item.match(/<dc:date>([\s\S]*?)<\/dc:date>/)?.[1] || "").trim();
    if (title && link) items.push({ title, link, description, image, pubDate });
  }
  return items;
}

function isTruncated(raw: string): boolean {
  if (!raw) return true;
  const tail = raw.trim().slice(-12);
  // أي محتوى ينتهي بعلامات الحذف يدل على بتر من RSS/جوجل نيوز
  if (/(\.\.\.|…|\[\.\.\.\])\s*$/.test(tail)) return true;
  return false;
}

function isJunkFeedItem(title: string, description: string, link: string): boolean {
  const t = normalizeTitleForHash(title);
  const d = stripHtml(description || "");
  const url = (link || "").toLowerCase();
  if (!t || t.length < 10) return true;
  if (/^(الصفحه الرئيسيه|الرئيسيه|اختيارات|كتاب|اعلانات|وظائف|اتصل بنا|من نحن)$/u.test(t)) return true;
  if (/(الصفحة الرئيسية|الصفحه الرئيسيه|اختيارات الوطن سبورت|كتاب الأهرام|شركة الاسكندرية لتوزيع الكهرباء)/u.test(title)) return true;
  if (/(\/authors?\/|\/writers?\/|\/category\/|\/section\/|\/tags?\/|\/home\/?$)/i.test(url)) return true;
  if (d.length < 70 && !/(قال|أعلن|أكد|كشف|شهد|أوضح|قررت|سجل|انطلق|تستعد|تعرف|موعد|نتيجة|أسعار|عاجل)/u.test(`${title} ${d}`)) return true;
  return false;
}

function dedupeParagraphs(text: string): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of text.split(/\n{2,}/)) {
    const key = p.replace(/\s+/g, " ").trim();
    if (!key) continue;
    if (seen.has(key)) continue;
    // امنع تكرار جملة كاملة داخل فقرة
    const sentences = key.split(/(?<=[.!؟])\s+/);
    const seenS = new Set<string>();
    const uniq = sentences.filter((s) => {
      const k = s.trim();
      if (!k || seenS.has(k)) return false;
      seenS.add(k);
      return true;
    });
    const cleaned = uniq.join(" ");
    seen.add(cleaned);
    out.push(cleaned);
  }
  return out.join("\n\n");
}

function formatArticleContent(raw: string): string {
  if (!raw) return "";
  let t = raw
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/www\.\S+/gi, "")
    .replace(/(اضغط|اقرأ|تابع|شاهد)\s+(هنا|المزيد|على الرابط|التفاصيل)[^\n.]*/gi, "")
    .replace(/المصدر\s*[:،\-]?\s*[^\n]*/gi, "")
    // احذف نهائياً أي اسم مصدر/وكالة/جريدة/قناة منافسة من نص الخبر
    .replace(/\b(اليوم\s*السابع|المصري\s*اليوم|بوابة\s*الأهرام|الأهرام|الوطن\s*سبورت|الوطن|المصراوي|مصراوي|الدستور|صدى\s*البلد|الشروق|الأخبار|الجمهورية|الفجر|البديل|اليوم\s*المصري|في\s*الفن|كووورة|كورة|يلا\s*كورة|بي\s*ان\s*سبورتس?|سكاي\s*نيوز(?:\s*عربية)?|العربية(?:\.نت)?|الجزيرة(?:\.نت)?|روسيا\s*اليوم|RT|بي\s*بي\s*سي|BBC|CNN|سي\s*ان\s*ان|رويترز|أ\s?ف\s?ب|AFP|Reuters|AP|Bloomberg|بلومبرغ|Google\s*News?|جوجل\s*نيوز|نيوزروم|نيوز\s*روم|Newsroom|newsroom\.info|فيسبوك|تويتر|إكس|انستغرام|إنستغرام|تيك\s*توك|يوتيوب|واتساب)\b\s*[:،\-]?/gi, "")
    .replace(/(نقلاً?\s*عن|بحسب|وفقاً?\s*ل(?:ما\s*(?:نشره|نشرته|أعلنه|أعلنته|ذكره|ذكرته))?|ذكر(?:ت)?\s+(?:موقع|جريدة|صحيفة|قناة|وكالة|منصة)|أفاد(?:ت)?\s+(?:موقع|جريدة|صحيفة|قناة|وكالة|منصة)|كما\s+(?:ذكر|أفاد|نشر|أعلن)\s+(?:موقع|جريدة|صحيفة|قناة|وكالة|منصة)|كشف(?:ت)?\s+(?:موقع|جريدة|صحيفة|قناة|وكالة))[^.\n،]*[.،\n]?/gi, "")
    .replace(/\b(موقع|منصة|جريدة|صحيفة|قناة|وكالة)\s+[^\s.،\n]+/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    // أزل علامات الحذف المتروكة من المصدر
    .replace(/\s*(?:\.\.\.|…|\[\.\.\.\])\s*$/g, ".")
    // نظّف الفواصل والمسافات المكررة الناتجة عن الحذف
    .replace(/\s*،\s*،+/g, "،")
    .replace(/\(\s*\)/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();

  const sentences = t.split(/(?<=[.!؟])\s+/).filter(Boolean);
  // 🛡️ شبكة أمان: لو آخر جملة لا تنتهي بعلامة ترقيم تامة فهي مقطوعة — احذفها بدلاً من نشرها ناقصة
  while (sentences.length > 1) {
    const last = sentences[sentences.length - 1].trim();
    if (/[.!؟]$/.test(last) && last.length > 15) break;
    sentences.pop();
  }
  // تأكيد إغلاق الجملة الأخيرة بنقطة لو لسه مفتوحة
  if (sentences.length > 0) {
    const lastIdx = sentences.length - 1;
    if (!/[.!؟]$/.test(sentences[lastIdx].trim())) {
      sentences[lastIdx] = sentences[lastIdx].trim() + ".";
    }
  }
  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += 2) {
    paragraphs.push(sentences.slice(i, i + 2).join(" "));
  }
  return dedupeParagraphs(paragraphs.join("\n\n"));
}



function summarize(text: string): string {
  return stripHtml(text).replace(/\s+/g, " ").slice(0, 170).trim();
}

// Returns an English slug matching public.categories.slug.
// Weighted scoring: each keyword group contributes a score; title hits weigh 3x.
// If max score < threshold → safe fallback "general" (auto-created in DB).
// 22-category official taxonomy (الهيكلية الرسمية لمصدري)
const CATEGORY_RULES: Array<{ slug: string; patterns: RegExp[]; weight?: number }> = [
  { slug: "obituaries", patterns: [
    /\b(وفاة|نعى|نعي|نعت|ينعى|عزاء|تشييع|الجنازة|جنازة|الراحل|الفقيد|الفقيدة|في ذمة الله|إلى رحمة الله|الصلاة على)\b/g,
  ]},
  { slug: "caricature", patterns: [
    /\b(كاريكاتير|كاريكاتور|رسم ساخر|رسوم ساخرة|الكاريكاتير اليومي)\b/g,
  ]},
  { slug: "live", patterns: [
    /\b(بث مباشر|البث المباشر|تغطية مباشرة|لحظة بلحظة|نقل حي|بالفيديو المباشر)\b/g,
  ]},
  { slug: "multimedia", patterns: [
    /\b(بودكاست|البودكاست|تقرير مصور|فيديوجراف|إنفوجراف|فيديو حصري|بالفيديو|بالصور والفيديو)\b/g,
  ]},
  { slug: "citizen", patterns: [
    /\b(شكوى|شكاوى|صحافة المواطن|مواطنون يشكون|أهالي|سكان منطقة|مطالب الأهالي|أزمة في حي|بلاغات المواطنين)\b/g,
  ]},
  { slug: "weather", patterns: [
    /\b(طقس|الأرصاد|أرصاد جوية|درجات الحرارة|موجة حر|موجة برد|أمطار|عاصفة|رياح|سيول|انخفاض درجات|ارتفاع درجات|نشرة جوية|الطقس غدا)\b/g,
  ]},
  { slug: "heritage", patterns: [
    /\b(آثار|الآثار|أثري|متحف|المتحف|اكتشاف أثري|مومياء|الفراعنة|الحضارة المصرية|بعثة أثرية|ترميم|مقبرة|تمثال|نقوش|توت عنخ آمون)\b/g,
  ]},
  { slug: "autos", patterns: [
    /\b(سيارة|سيارات|موديل|مرسيدس|بي إم دبليو|تويوتا|هيونداي|كيا|تسلا|قيادة ذاتية|محرك|سعر السيارة|معرض السيارات|دراجة نارية|موتوسيكل)\b/g,
  ]},
  { slug: "realestate", patterns: [
    /\b(عقار|عقارات|شقة|شقق|فيلا|كمبوند|مشروع سكني|العاصمة الإدارية|سعر المتر|تشطيب|وحدة سكنية|التجمع|الشيخ زايد|هايد بارك)\b/g,
  ]},
  { slug: "tourism", patterns: [
    /\b(سياحة|سياحي|سفر|مطار|طيران|رحلات|فندق|فنادق|الأقصر|أسوان|شرم الشيخ|الغردقة|مرسى علم|تأشيرة|فيزا سياحية|وجهة سياحية)\b/g,
  ]},
  { slug: "energy", patterns: [
    /\b(الطاقة المتجددة|طاقة شمسية|طاقة الرياح|بيئة|التغير المناخي|الاحتباس الحراري|انبعاثات|كهرباء|قطع الكهرباء|محطة كهرباء|تلوث|البيئة)\b/g,
  ]},
  { slug: "women-family", patterns: [
    /\b(المجلس القومي للمرأة|تمكين المرأة|الأمومة|الأم|الأسرة|الأطفال|الطفل|التربية|عنف ضد المرأة|الزواج|المطلقات)\b/g,
  ]},
  { slug: "lifestyle", patterns: [
    /\b(موضة|أزياء|ديكور|طبخ|طهي|وصفة|وصفات|تطوير الذات|نصائح|لايف ستايل|تخسيس|رشاقة|عناية بالبشرة)\b/g,
  ]},
  { slug: "society", patterns: [
    /\b(ظاهرة اجتماعية|قضايا الأسرة|المجتمع المصري|تنمر|طلاق|تعاطي|إدمان|مبادرة مجتمعية|محافظات|قرية|عشوائيات)\b/g,
  ]},
  { slug: "science-health", patterns: [
    /\b(صحة|طبيب|مستشفى|دواء|علاج|وباء|فيروس|لقاح|مرض|جراحة|سرطان|قلب|سكر|ضغط|كورونا|كوفيد|اكتشاف علمي|أبحاث|الباحثون|دراسة علمية|ناسا|الفضاء)\b/g,
  ]},
  { slug: "accidents", patterns: [
    /\b(حادث|حوادث|جريمة|جرائم|قتيل|قتلى|مقتل|ضحايا|ضحية|زلزال|حريق|حرائق|انفجار|نيابة|محكمة|ضبط|بلاغ|سرقة|اغتيال|اصطدام|غرق|مصرع|تصادم|طعن|إطلاق نار)\b/g,
  ]},
  { slug: "education", patterns: [
    /\b(وزارة التربية|وزير التعليم|التعليم|مدرسة|مدارس|طالب|طلاب|طلبة|امتحان|امتحانات|نتيجة|نتائج|الثانوية|الإعدادية|الابتدائية|الجامعة|جامعات|كلية|تنسيق|الأزهر)\b/g,
  ]},
  { slug: "technology", patterns: [
    /\b(تكنولوجيا|ذكاء اصطناعي|تطبيق|إنترنت|هاتف|آيفون|سامسونج|جوجل|فيسبوك|واتساب|تيك توك|تقنية|روبوت|سوفتوير|تحديث|أندرويد|iOS|ChatGPT|ميتا|أمن سيبراني|قرصنة)\b/g,
  ]},
  { slug: "entertainment", patterns: [
    /\b(فنان|فنانة|مسلسل|سينما|مهرجان|أغنية|ألبوم|مطرب|مطربة|ممثل|ممثلة|فيلم|مسرح|دراما|كليب|نجم|نجمة|حفل غنائي|الجونة|هوليوود)\b/g,
  ]},
  { slug: "sports", patterns: [
    /\b(الأهلي|الزمالك|كرة القدم|مباراة|الدوري|كأس|لاعب|منتخب|بطولة|مدرب|هدف|أهداف|ملعب|الكرة|التشكيل|كاف|فيفا|تصفيات|نهائي|انتقالات|صفقة|الميركاتو)\b/g,
  ]},
  { slug: "economy", patterns: [
    /\b(اقتصاد|بنك|استثمار|تمويل|صادرات|واردات|تضخم|ميزانية|موازنة|بترول|نفط|غاز|تجارة|قرض|صندوق النقد|البنك المركزي|بورصة|دولار|يورو|ذهب|عيار|سعر|أسعار|الفراخ|البنزين|تسعيرة)\b/g,
  ]},
  { slug: "politics", patterns: [
    /\b(وزير|وزارة|حكومة|رئيس|برلمان|سياسة|دبلوماس|سفير|اتفاقية|قمة|انتخاب|الرئاسة|مجلس النواب|الجيش|الخارجية|السيسي|غزة|فلسطين|إسرائيل|نتنياهو|بوتين|ترامب|الأمم المتحدة)\b/g,
  ]},
];

const INFER_CONFIDENCE_MIN = 2;

export function scoreCategory(title: string, content: string): { slug: string; score: number; scores: Record<string, number> } {
  const t = title || "";
  const c = content || "";
  const scores: Record<string, number> = {};
  for (const rule of CATEGORY_RULES) {
    let s = 0;
    for (const p of rule.patterns) {
      const titleHits = (t.match(p) || []).length;
      const bodyHits = (c.match(p) || []).length;
      s += titleHits * 3 + bodyHits;
    }
    scores[rule.slug] = s;
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return { slug: best[0], score: best[1], scores };
}

function inferCategory(title: string, content: string): string {
  const { slug, score } = scoreCategory(title, content);
  return score >= INFER_CONFIDENCE_MIN ? slug : "general";
}


// Diverse paragraph pools — picked randomly so no two articles read the same.
const OPENERS = [
  (t: string) => `كشفت مصادر متابعة لـ"مصدري" تفاصيل جديدة بشأن ${t}، في تطور يفرض نفسه على أجندة المتابعين خلال الساعات الأخيرة.`,
  (t: string) => `تتصدر قضية ${t} اهتمام الرأي العام، وتضع "مصدري" القارئ في قلب المشهد بكل تفاصيله وخلفياته الموثقة.`,
  (t: string) => `في خطوة لافتة، برز ملف ${t} على السطح ليثير موجة واسعة من التفاعل، وترصد "مصدري" أبرز ما جرى وما يتوقع أن يجري لاحقاً.`,
  (t: string) => `حالة من الترقب تسود الشارع بعد تطورات ${t}، وتقدم "مصدري" قراءة هادئة ومنظمة لأبعاد الحدث بعيداً عن التهويل.`,
  (t: string) => `أعادت تطورات ${t} ترتيب الأولويات الإخبارية اليوم، حيث تتابع "مصدري" المستجدات لحظة بلحظة من مصادرها الخاصة.`,
];
const CONTEXTS = [
  (b: string) => `وتشير المعطيات الأولية إلى ${b}، في وقت تتسارع فيه الخطوات لاستيضاح الصورة كاملة أمام الرأي العام.`,
  (b: string) => `وتكشف تفاصيل إضافية أن ${b}، وهو ما يفتح الباب أمام قراءات متعددة لأبعاد ما جرى.`,
  (b: string) => `وفي تفاصيل أعمق، تبين أن ${b}، مع توقعات بإعلانات تكميلية خلال الفترة المقبلة.`,
  (b: string) => `وعلى صعيد متصل، أوضحت مصادر مطلعة أن ${b}، وهو ما يضع الحدث في سياقه الطبيعي.`,
];
const ANALYSES = [
  `ويأتي هذا التطور في توقيت حساس تتشابك فيه عوامل متعددة، ما يجعل قراءة المشهد تتطلب هدوءاً ودقة في تتبع كل جزئية على حدة.`,
  `وتتقاطع أبعاد هذا الملف مع ملفات أخرى مفتوحة، الأمر الذي يمنحه أهمية مضاعفة لدى المتابعين والمختصين على حد سواء.`,
  `وبينما تتضح بعض الزوايا، تبقى جوانب أخرى رهينة للمستجدات الميدانية التي قد تغير بوصلة الأحداث في أي لحظة.`,
  `ويرى مراقبون أن المشهد يحمل أكثر من قراءة، وأن المرحلة المقبلة كفيلة بحسم كثير من علامات الاستفهام المطروحة حالياً.`,
  `ويبدو أن تداعيات هذا الملف لن تتوقف عند حدوده الحالية، بل قد تمتد إلى ساحات أوسع خلال الأيام القليلة المقبلة.`,
];
const IMPACTS = [
  `وعلى صعيد التأثير، يترقب الجمهور انعكاسات هذه التطورات على الأرض، خاصة في ظل ما تحمله من رسائل واضحة للأطراف المعنية.`,
  `ويضع هذا الملف الجهات المختصة أمام مسؤولية مباشرة في الإفصاح والمتابعة، وهو ما يلتقي مع تطلعات شريحة واسعة من المواطنين.`,
  `وفي ضوء ذلك، يتصدر مطلب الشفافية والوضوح قائمة ما يطالب به الشارع، حرصاً على ترسيخ الثقة بين المؤسسات والجمهور.`,
  `ولا يمكن فصل هذا الحدث عن سياقه الأوسع، إذ يلامس مباشرة قطاعات تمس الحياة اليومية للمواطن المصري.`,
];
const CLOSERS = [
  `وتواصل "مصدري" متابعة الملف لحظة بلحظة، على وعد بنقل كل جديد فور وروده من مصادره الموثوقة، بصياغة مهنية تليق بقرائها.`,
  `وتؤكد "مصدري" التزامها بتقديم المعلومة كاملة دون اجتزاء، مع تحديث القارئ بكل ما يستجد على هذا الملف.`,
  `ويبقى المشهد مفتوحاً على كل الاحتمالات، وتظل "مصدري" منبراً أميناً لنقل الحقيقة كما هي دون زيادة أو نقصان.`,
  `وفي انتظار ما ستكشفه الساعات المقبلة، تواصل "مصدري" متابعاتها الميدانية لإطلاع جمهورها أولاً بأول.`,
];
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function buildLocalArticle(title: string, content: string): string {
  const clean = formatArticleContent(content).replace(/\s*(?:\.|،)?\s*$/u, "");
  const base = clean || title;
  // قسّم النص الأصلي إلى فقرات حقيقية واستخدمها كأساس
  const sourceParas = base.split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 60);
  const bodyParas = sourceParas.length > 0 ? sourceParas.slice(0, 4) : [`${base} وفق ما توفر من معلومات حتى الآن.`];
  const paras = [
    pick(OPENERS)(title),
    ...bodyParas,
    pick(ANALYSES),
    pick(IMPACTS),
    pick(CLOSERS),
  ];
  return dedupeParagraphs(paras.join("\n\n"));
}



function fallbackRewrite(title: string, content: string) {
  const formatted = formatArticleContent(content);
  const complete = formatted.length >= MIN_ARTICLE_LENGTH ? formatted : buildLocalArticle(title, formatted || content);
  return {
    title,
    summary: summarize(complete),
    content: complete,
    category: inferCategory(title, complete),
  };
}



async function rewriteWithAI(title: string, content: string) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

  // Limit raw input to avoid eating output tokens
  const trimmedContent = (content || "").slice(0, 6000);

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      max_tokens: 12288,
      temperature: 0.7,

      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `أنت "صائد الأخبار" داخل "مصدري للأخبار المصرية والعالمية". مهمتك إعادة إنتاج الخبر بالكامل (قديم/جديد/مستورد/عاجل) بأسلوب صحفي احترافي موسّع، بحيث يفهم القارئ الحدث بدون الرجوع لأي مصدر خارجي.

🧠 قواعد الكتابة (إلزامية):
- إعادة صياغة كاملة 100% — ممنوع نسخ أي جملة كما هي.
- مقدمة جذابة (Hook) توضح الحدث بسرعة.
- شرح تفصيلي موسّع: لا يقل عن 6 فقرات (حتى 12 حسب أهمية الحدث).
- اشرح الخلفية السياقية: لماذا؟ كيف؟ متى؟ من الأطراف؟ ما التأثير؟ ما المتوقع لاحقاً؟
- تحليل خفيف يوضح أهمية الخبر.
- خاتمة تلخص الحدث وتذكر التوقعات.
- لغة عربية فصيحة رسمية، تقسيم جيد للفقرات، يصلح لـ Google Discover.
- ⚠️ كل فقرة وكل جملة يجب أن تكون **مكتملة** ومنتهية بنقطة (.) أو علامة استفهام (؟) أو تعجب (!). ممنوع منعاً باتاً ترك أي جملة ناقصة أو مقطوعة.
- ممنوع "..." أو "…" أو "إلخ" أو "وما إلى ذلك" في نهاية النص أو وسطه. اختم بجملة تامة المعنى.
- إذا اقتربت من حد الإخراج، اختصر عدد الفقرات بدلاً من قطع الجملة الأخيرة. الأولوية للاكتمال.

🚫 ممنوع نهائياً ذكر:
- أي اسم وكالة/جريدة/موقع/قناة (اليوم السابع، الوطن، الأهرام، المصري اليوم، رويترز، AFP، Google، BBC، CNN...).
- العبارات: "نقلاً عن"، "بحسب موقع"، "ذكرت جريدة"، "أفاد موقع"، "وفقاً لما نشرته".
- الكلمات: منصة، موقع، صحيفة، جريدة، مؤسسة إعلامية، News، Media، Press، Magazine.
- أي روابط/URLs داخل النص.
- الاسم الوحيد المسموح: "مصدري".

🔍 SEO إلزامي:
- Meta Title قوي SEO Friendly (≤ 65 حرف، بدون اسم مصدر).
- Meta Description واضحة وطويلة (140–160 حرف).
- كلمات مفتاحية دقيقة مرتبطة بالحدث (8–15 كلمة).
- وصف صورة (alt) و caption احترافيان.

أعد الناتج JSON صالح فقط بالشكل التالي بالضبط (لا تُغفل أي حقل، استخدم [] للمصفوفات الفارغة و"" للنصوص الفارغة):
{
  "title": "...",
  "summary": "وصف SEO 140-160 حرف",
  "content": "المقال كاملاً 6-12 فقرة، فقرات مفصولة بسطرين",
  "category": "أحد: politics, economy, sports, entertainment, accidents, technology, education, science-health, society, lifestyle, weather, energy, autos, realestate, women-family, tourism, heritage, obituaries, general",
  "keywords": ["كلمة1","كلمة2","..."],
  "persons": ["اسم شخص بالكامل", "..."],
  "organizations": ["وزارة/شركة/جهة", "..."],
  "places": ["مدينة/محافظة/دولة", "..."],
  "image_alt": "وصف موجز للصورة (حتى 120 حرف)",
  "image_caption": "تعليق توضيحي للصورة (حتى 140 حرف)"
}`
        },
        { role: "user", content: `العنوان الأصلي: ${title}\n\nالمحتوى الخام:\n${trimmedContent}` },
      ],
    }),
  });


  if (!resp.ok) throw new Error(`AI gateway ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  const text: string = data.choices?.[0]?.message?.content || "";
  const finishReason = data.choices?.[0]?.finish_reason;
  const parsed = extractJson(text);
  if (!parsed || !parsed.title || !parsed.content) {
    throw new Error(`AI returned incomplete JSON (finish=${finishReason})`);
  }
  return parsed;
}

function extractJson(raw: string): any {
  let cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const start = cleaned.search(/\{/);
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  cleaned = cleaned.substring(start, end + 1);
  try { return JSON.parse(cleaned); } catch {}
  try {
    const fixed = cleaned
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/[\x00-\x1F\x7F]/g, " ");
    return JSON.parse(fixed);
  } catch { return null; }
}


// توليد صورة معبّرة عن الخبر عبر AI Gateway ورفعها للتخزين
async function generateArticleImage(title: string, summary: string): Promise<string | null> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return null;
  try {
    const prompt = `صورة صحفية احترافية واقعية عالية الجودة تعبّر عن خبر بعنوان: "${title}". ${summary ? "السياق: " + summary : ""}. أسلوب: تصوير صحفي إخباري مؤسسي رصين، إضاءة طبيعية، تفاصيل واقعية، بدون أي نصوص أو شعارات أو حروف عربية أو إنجليزية على الصورة، تكوين أفقي سينمائي.`;
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });
    if (!resp.ok) { console.error("img gen failed", resp.status, await resp.text()); return null; }
    const data = await resp.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return null;
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const path = `ai/${crypto.randomUUID()}.png`;
    const { error: upErr } = await supabase.storage.from("article-images").upload(path, bytes, { contentType: "image/png", upsert: false });
    if (upErr) { console.error("upload failed", upErr); return null; }
    const { data: pub } = supabase.storage.from("article-images").getPublicUrl(path);
    return pub.publicUrl;
  } catch (e) {
    console.error("generateArticleImage error", e);
    return null;
  }
}

function isStoredArticleImage(url?: string | null): boolean {
  return !!url && /\/storage\/v1\/object\/public\/article-images\//.test(url);
}

function imageExtension(contentType: string | null, url: string): string {
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("gif")) return "gif";
  const fromUrl = url.toLowerCase().match(/\.(png|webp|gif|jpe?g)(?:[?#]|$)/)?.[1];
  if (fromUrl === "jpeg") return "jpg";
  return fromUrl || "jpg";
}

async function mirrorImageToStorage(imageUrl: string | null, sourceUrl: string | null, keySeed: string): Promise<string | null> {
  if (!imageUrl) return null;
  if (isStoredArticleImage(imageUrl)) return imageUrl;
  try {
    const res = await fetchWithTimeout(imageUrl, {
      headers: {
        "User-Agent": BROWSER_UA,
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "ar,en;q=0.8",
        "Referer": safeAsciiReferer(sourceUrl),
      },
    }, 16000);
    const contentType = res.headers.get("content-type") || "";
    if (!res.ok || !contentType.startsWith("image/")) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength < 2048 || bytes.byteLength > 8_000_000) return null;
    const ext = imageExtension(contentType, imageUrl);
    const path = `news/${keySeed.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80)}.${ext}`;
    const { error: upErr } = await supabase.storage.from("article-images").upload(path, bytes, {
      contentType: contentType.split(";")[0] || `image/${ext}`,
      upsert: true,
    });
    if (upErr) { console.warn("mirror image upload failed", upErr.message); return null; }
    const { data: pub } = supabase.storage.from("article-images").getPublicUrl(path);
    return pub.publicUrl;
  } catch (e) {
    console.warn("mirrorImageToStorage failed", e);
    return null;
  }
}

function safeAsciiReferer(sourceUrl: string | null): string {
  if (!sourceUrl) return "https://www.google.com/";
  try {
    const url = new URL(sourceUrl);
    return `${url.protocol}//${url.hostname}/`;
  } catch {
    return "https://www.google.com/";
  }
}

async function ensureDisplayImage(imageUrl: string | null, title: string, summary: string | null, sourceUrl: string | null, keySeed: string): Promise<string | null> {
  const mirrored = await mirrorImageToStorage(imageUrl, sourceUrl, keySeed);
  if (mirrored) return mirrored;
  if (sourceUrl) {
    const fresh = await fetchRealImageFromSource(sourceUrl);
    const mirroredFresh = await mirrorImageToStorage(fresh, sourceUrl, `${keySeed}-fresh`);
    if (mirroredFresh) return mirroredFresh;
  }
  return await generateArticleImage(title, summary || "");
}

const CATEGORY_AR: Record<string, string> = {
  politics: "سياسة",
  economy: "اقتصاد",
  sports: "رياضة",
  entertainment: "فن ومشاهير",
  education: "تعليم",
  technology: "تكنولوجيا",
  "science-health": "علوم وطب",
  accidents: "حوادث وجرائم",
  society: "مجتمع",
  lifestyle: "منوعات ولايف ستايل",
  weather: "طقس ومناخ",
  energy: "طاقة وبيئة",
  autos: "سيارات ومخترعات",
  realestate: "عقارات وأسواق",
  "women-family": "مرأة وأسرة",
  tourism: "سياحة وسفر",
  heritage: "آثار ومتاحف",
  citizen: "صحافة المواطن",
  live: "بث مباشر وتغطيات",
  multimedia: "ملتيميديا",
  caricature: "كاريكاتير",
  obituaries: "وفيات وتعازي",
  general: "أخبار عامة",
};

async function processSource(src: NewsSource, runState: { aiCalls: number; aiLimit: number }) {
  const log = {
    source: src.name,
    status: "ok",
    items_found: 0,
    items_scanned: 0,
    items_inserted: 0,
    items_skipped: 0,
    items_duplicate: 0,
    items_without_image: 0,
    items_too_short: 0,
    items_failed: 0,
    categories_used: {} as Record<string, number>,
    categories_created: [] as string[],
    error: null as string | null,
  };
  try {
    const { items: allItems } = await fetchRssItems(src);
    // فلترة: من بداية 2026 وما بعدها فقط — إذا فشل التحليل اقبل الخبر (آخر الأخبار)
    const CUTOFF = Date.UTC(2026, 0, 1);
    const items = allItems.filter(it => {
      if (!it.pubDate) return true;
      const t = parsePubDate(it.pubDate);
      if (isNaN(t)) return true;
      return t >= CUTOFF;
    }).sort((a, b) => {
      const tb = parsePubDate(b.pubDate || "") || 0;
      const ta = parsePubDate(a.pubDate || "") || 0;
      return tb - ta;
    }).slice(0, RSS_SCAN_LIMIT);
    log.items_found = items.length;

    const { data: cats } = await supabase.from("categories").select("id, slug");
    const catMap: Record<string, string> = {};
    cats?.forEach(c => { catMap[c.slug] = c.id; });

    // Auto-create missing categories so every article lands in the right section.
    async function resolveCategoryId(slug: string): Promise<string | null> {
      if (catMap[slug]) return catMap[slug];
      const name = CATEGORY_AR[slug] || slug;
      try {
        const { data: newId, error } = await supabase.rpc("ensure_category" as any, { p_slug: slug, p_name: name });
        if (error) throw error;
        if (newId) {
          catMap[slug] = newId as string;
          log.categories_created.push(slug);
          return newId as string;
        }
      } catch (e) {
        console.warn("ensure_category failed for", slug, e);
      }
      return null;
    }

    for (const item of items) {
      if (log.items_inserted >= MAX_INSERT_PER_SOURCE) break;
      log.items_scanned++;
      // تنظيف عنوان المصدر (إزالة لاحقة " - اليوم السابع" مثلاً)
      const cleanTitle = item.title.replace(/\s*[-–—|]\s*(اليوم السابع|المصري اليوم|الوطن|الوطن سبورت|الأهرام|بوابة الأهرام|أخبار مصر)\s*$/u, "").trim();
      if (isJunkFeedItem(cleanTitle, item.description, item.link)) { log.items_skipped++; continue; }
      const titleKey = normalizeTitleForHash(cleanTitle).slice(0, 160);
      const titleHash = await sha256("title::" + titleKey);

      // فحص العنوان أولاً قبل فك روابط Google News الثقيلة؛ هذا يمنع بطء التنفيذ كل دقيقة.
      const { data: existingByTitle } = await supabase
        .from("articles")
        .select("id")
        .eq("content_hash", titleHash)
        .limit(1);
      if (existingByTitle && existingByTitle.length > 0) { log.items_duplicate++; log.items_skipped++; continue; }

      const resolvedSourceUrl = await resolveOriginalSourceUrl(item.link);
      const sourceUrlForSave = resolvedSourceUrl || item.link;
      const linkHash = await sha256("url::" + sourceUrlForSave.replace(/[?#].*$/, ""));

      // منع التكرار بالرابط بعد حل الرابط الحقيقي فقط للأخبار الجديدة المحتملة.
      const { data: existing } = await supabase
        .from("articles")
        .select("id")
        .or(`content_hash.eq.${linkHash},source_url.eq.${sourceUrlForSave}`)
        .limit(1);
      if (existing && existing.length > 0) { log.items_duplicate++; log.items_skipped++; continue; }

      try {
        // اجلب نص المقال الكامل من صفحة المصدر (بديل وصف RSS الفقير)
        const fullBody = await fetchFullArticleBody(sourceUrlForSave);
        const baseContent = (fullBody && fullBody.length > (item.description?.length || 0)) ? fullBody : item.description;

        // ارفض أي مصدر مبتور (ينتهي بـ ...) قبل الاستهلاك
        const sourceTruncated = isTruncated(baseContent || "");

        const formattedBase = formatArticleContent(baseContent);
        if (!formattedBase || formattedBase.length < MIN_SOURCE_LENGTH) {
          log.items_too_short++; log.items_skipped++; continue;
        }

        // الصياغة بالـAI إلزامية لكل خبر مقبول؛ إن فشلت أو رجعت مبتورة نسقط الخبر بدل نشره بهدلة.
        let rewritten: any = null;
        let aiErrorMessage: string | null = null;
        if (runState.aiCalls < runState.aiLimit) {
          runState.aiCalls++;
          try {
            rewritten = await rewriteWithAI(cleanTitle, formattedBase);
          } catch (aiErr) {
            aiErrorMessage = (aiErr as Error).message;
            console.warn("AI rewrite failed:", aiErrorMessage);
          }
        }

        // إن فشل AI بسبب الرصيد أو المزود: نبني مقالاً محلياً كاملاً بدلاً من إيقاف الصائد.
        if (!rewritten) {
          rewritten = fallbackRewrite(cleanTitle, formattedBase);
        }

        // نظّف عنوان الـAI من أي لاحقة مصدر متبقية
        const finalTitle = (rewritten.title || cleanTitle)
          .replace(/\s*[-–—|]\s*(اليوم السابع|المصري اليوم|الوطن|الوطن سبورت|الأهرام|بوابة الأهرام|أخبار مصر)\s*$/u, "")
          .trim();

        // الصورة الحقيقية: من RSS/المصدر، ثم تُحفظ محلياً حتى لا تكسرها حماية المواقع الخارجية على الموبايل.
        let imageUrl: string | null = item.image && isUsableOriginalImage(item.image) ? normalizeImageUrl(item.image, sourceUrlForSave) : null;
        if (!imageUrl) imageUrl = await fetchRealImageFromSource(sourceUrlForSave);

        // تنسيق المحتوى النهائي + إزالة التكرار + فحص البتر
        const formattedContent = formatArticleContent(rewritten.content || formattedBase);
        if (!formattedContent || formattedContent.length < MIN_ARTICLE_LENGTH) { log.items_too_short++; log.items_skipped++; continue; }
        if (isTruncated(formattedContent)) { log.items_too_short++; log.items_skipped++; continue; }

        const displayImageUrl = await ensureDisplayImage(imageUrl, finalTitle, rewritten.summary || null, sourceUrlForSave, titleHash);
        if (!displayImageUrl) { log.items_without_image++; log.items_skipped++; continue; }


        const aiSlug = (rewritten.category && typeof rewritten.category === "string")
          ? rewritten.category.trim().toLowerCase()
          : "";
        const knownAiSlug = aiSlug && (CATEGORY_AR as Record<string,string>)[aiSlug] ? aiSlug : null;
        const slug = knownAiSlug || inferCategory(finalTitle, formattedContent);

        // اقتراح أقسام جديدة دون إنشائها تلقائياً
        if (aiSlug && !knownAiSlug) {
          await supabase.from("suggested_categories").upsert({
            slug: aiSlug,
            name: aiSlug,
            reason: `AI suggested for: ${finalTitle.slice(0, 80)}`,
          }, { onConflict: "slug" }).then(() => {});
        }

        const categoryId = await resolveCategoryId(slug);
        log.categories_used[slug] = (log.categories_used[slug] || 0) + 1;

        // كشف التشابه (90%+) خلال آخر 7 أيام — دمج بدل نشر مكرر
        const { data: simRows } = await supabase.rpc("find_similar_article" as any, {
          _title: finalTitle,
          _content: formattedContent,
          _threshold: 0.6,
          _days: 7,
        });
        const similar = Array.isArray(simRows) && simRows.length > 0 ? simRows[0] : null;
        if (similar && Number(similar.similarity) >= 0.9) {
          // دمج: حدّث المقال الموجود إذا كانت النسخة الجديدة أطول
          const { data: existingRow } = await supabase
            .from("articles").select("id, content, merged_from_count")
            .eq("id", similar.id).maybeSingle();
          let added = 0;
          if (existingRow && (formattedContent.length > (existingRow.content?.length || 0))) {
            added = formattedContent.length - (existingRow.content?.length || 0);
            await supabase.from("articles").update({
              content: formattedContent,
              summary: rewritten.summary || null,
              image_alt: rewritten.image_alt || null,
              image_caption: rewritten.image_caption || null,
              keywords: Array.isArray(rewritten.keywords) ? rewritten.keywords.slice(0, 20) : [],
              persons: Array.isArray(rewritten.persons) ? rewritten.persons.slice(0, 20) : [],
              organizations: Array.isArray(rewritten.organizations) ? rewritten.organizations.slice(0, 20) : [],
              places: Array.isArray(rewritten.places) ? rewritten.places.slice(0, 20) : [],
              merged_from_count: (existingRow.merged_from_count || 0) + 1,
              last_merged_at: new Date().toISOString(),
              ai_rewritten: true,
            }).eq("id", similar.id);
          }
          await supabase.from("news_merge_log").insert({
            article_id: similar.id,
            source_url: sourceUrlForSave,
            source_name: src.name,
            similarity: Number(similar.similarity),
            reason: `Near-duplicate of "${(similar.title || "").slice(0,80)}"`,
            added_content_length: added,
          });
          log.items_duplicate++;
          log.items_skipped++;
          continue;
        }

        const payload = {
          title: finalTitle,
          content: formattedContent,
          summary: rewritten.summary || null,
          image_url: displayImageUrl,
          images: [{ url: displayImageUrl, position: "start" }],
          image_alt: rewritten.image_alt || finalTitle,
          image_caption: rewritten.image_caption || null,
          keywords: Array.isArray(rewritten.keywords) ? rewritten.keywords.slice(0, 20) : [],
          persons: Array.isArray(rewritten.persons) ? rewritten.persons.slice(0, 20) : [],
          organizations: Array.isArray(rewritten.organizations) ? rewritten.organizations.slice(0, 20) : [],
          places: Array.isArray(rewritten.places) ? rewritten.places.slice(0, 20) : [],
          ai_rewritten: aiErrorMessage ? false : true,
          category_id: categoryId,
          is_published: true,
          source_url: sourceUrlForSave,
          source_name: "مصدري للأخبار المصرية والعالمية",
          content_hash: titleHash,
        };
        const { data: inserted, error } = await supabase.from("articles").insert(payload).select("id").single();
        if (error) throw error;
        log.items_inserted++;
        // Fire web push (best-effort, non-blocking)
        try {
          const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push`;
          fetch(fnUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
            body: JSON.stringify({
              title: "📰 مصدري — خبر جديد",
              body: finalTitle,
              url: `/article/${inserted?.id || ""}`,
              image: displayImageUrl || undefined,
              tag: inserted?.id || titleHash,
              breaking: false,
            }),
          }).catch(() => {});
        } catch { /* ignore */ }
      } catch (e) {
        console.error("Item failed:", e);
        log.items_failed++;
        log.items_skipped++;
      }
    }
  } catch (e) {
    log.status = "error";
    log.error = e instanceof Error ? e.message : String(e);
  }
  await supabase.from("news_fetch_log").insert({
    source: log.source,
    status: log.status,
    items_found: log.items_found,
    items_inserted: log.items_inserted,
    items_skipped: log.items_skipped,
    error: log.error,
  });
  // تحديث صحة المصدر — مصدر واحد لا يوقف باقي النظام
  try {
    const { data: existing } = await supabase
      .from("news_sources_health").select("consecutive_failures, total_runs, total_inserted")
      .eq("source", log.source).maybeSingle();
    const failures = log.status === "ok" ? 0 : ((existing?.consecutive_failures || 0) + 1);
    const status = log.status === "ok"
      ? (log.items_inserted > 0 ? "ok" : "degraded")
      : (failures >= 3 ? "down" : "degraded");
    await supabase.from("news_sources_health").upsert({
      source: log.source,
      status,
      consecutive_failures: failures,
      total_runs: (existing?.total_runs || 0) + 1,
      total_inserted: (existing?.total_inserted || 0) + log.items_inserted,
      last_run_at: new Date().toISOString(),
      last_error: log.error,
      updated_at: new Date().toISOString(),
    }, { onConflict: "source" });
  } catch (_) { /* health update is best-effort */ }
  return log;
}

// إعادة معالجة الأخبار القديمة: تجلب صور حقيقية من رابط المصدر (وليس AI)
async function backfillMissingImages(limit = 50) {
  const { data: rows, error } = await supabase
    .from("articles")
    .select("id, title, summary, image_url, source_url")
    .or("image_url.is.null,image_url.eq.")
    .not("source_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { ok: false, error: error.message, updated: 0 };
  let updated = 0;
  for (const r of rows || []) {
    if (!r.source_url) continue;
    const sourceImage = await fetchRealImageFromSource(r.source_url);
    const url = await ensureDisplayImage(sourceImage, r.title, r.summary, r.source_url, r.id);
    if (!url) continue;
    const { error: upErr } = await supabase
      .from("articles")
      .update({ image_url: url, images: [{ url, position: "start" }] })
      .eq("id", r.id);
    if (!upErr) updated++;
  }
  return { ok: true, scanned: rows?.length || 0, updated };
}

async function repairBrokenImages(limit = 80) {
  const { data: rows, error } = await supabase
    .from("articles")
    .select("id, title, summary, image_url, source_url")
    .not("image_url", "like", "%/storage/v1/object/public/article-images/%")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { ok: false, error: error.message, repaired: 0 };
  let repaired = 0;
  for (const r of rows || []) {
    const fixed = await ensureDisplayImage(r.image_url, r.title, r.summary, r.source_url, r.id);
    if (!fixed || fixed === r.image_url) continue;
    const { error: upErr } = await supabase
      .from("articles")
      .update({ image_url: fixed, images: [{ url: fixed, position: "start" }] })
      .eq("id", r.id);
    if (!upErr) repaired++;
  }
  return { ok: true, scanned: rows?.length || 0, repaired };
}

// User-Agent حقيقي عشان المواقع المصرية متحجبش الـbot
const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// تجاهل صور اللوجو/الأيقونات فقط (share-img + default مسموحين لأنهم غالباً الصورة الحقيقية)
function isLogoLike(url: string): boolean {
  const u = url.toLowerCase();
  return /(\/logo[._-]|favicon|placeholder|sprite|site[-_]?logo|brand-logo|\/icons?\/)/.test(u);
}

function isProxyImage(url: string): boolean {
  const u = url.toLowerCase();
  return /(googleusercontent\.com|gstatic\.com|encrypted-tbn|news\.google\.com)/.test(u);
}

function isUsableOriginalImage(url: string): boolean {
  return !!url && !isLogoLike(url) && !isProxyImage(url);
}

function normalizeImageUrl(url: string, pageUrl: string): string | null {
  if (!url) return null;
  let cleaned = decodeHtml(url).replace(/\\\//g, "/").trim();
  if (cleaned.startsWith("//")) cleaned = "https:" + cleaned;
  try {
    return new URL(cleaned, pageUrl).toString();
  } catch {
    return null;
  }
}

function isGoogleNewsUrl(url: string): boolean {
  try { return new URL(url).hostname === "news.google.com"; } catch { return false; }
}

async function resolveOriginalSourceUrl(url: string): Promise<string | null> {
  if (!isGoogleNewsUrl(url)) return url;
  try {
    const page = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": BROWSER_UA,
        "Accept-Language": "ar,en;q=0.8",
      },
    }, 14000);
    if (!page.ok) return null;
    const html = await page.text();
    const articleId = html.match(/data-n-a-id=["']([^"']+)["']/)?.[1];
    const timestamp = html.match(/data-n-a-ts=["']([^"']+)["']/)?.[1];
    const signature = html.match(/data-n-a-sg=["']([^"']+)["']/)?.[1];
    if (!articleId || !timestamp || !signature) return null;

    const payload = [
      "garturlreq",
      [["ar", "EG", ["FINANCE_TOP_INDICES", "WEB_TEST_1_0_0"], null, null, 1, 1, "EG:ar", null, 180, null, null, null, null, null, 0, null, null, [Number(timestamp), 0]], "ar", "EG", 1, [2, 3, 4, 8], 1, 0, "655000234", 0, 0, null, 0],
      articleId,
      Number(timestamp),
      signature,
    ];
    const body = new URLSearchParams({
      "f.req": JSON.stringify([[["Fbv4je", JSON.stringify(payload), null, "generic"]]]),
    });
    const res = await fetchWithTimeout("https://news.google.com/_/DotsSplashUi/data/batchexecute", {
      method: "POST",
      headers: {
        "User-Agent": BROWSER_UA,
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "Referer": url,
      },
      body,
    }, 12000);
    if (!res.ok) return null;
    const text = await res.text();
    const unescapedText = text.replace(/\\\//g, "/");
    const matches = unescapedText.match(/https?:\/\/(?:www\.|m\.|gate\.)?(?:youm7\.com|elwatannews\.com|ahram\.org\.eg|almasryalyoum\.com)[^"\\\]]+/gi) || [];
    const original = matches.find(u => !u.includes("/amp/")) || matches[0];
    return original ? decodeURIComponent(original.replace(/\\\//g, "/")) : null;
  } catch (e) {
    console.warn("resolveOriginalSourceUrl failed", e);
    return null;
  }
}

// جلب الـHTML الخام لصفحة المصدر مع كاش بسيط داخل الاستدعاء
const _pageCache = new Map<string, string>();
async function fetchSourcePage(sourceUrl: string): Promise<{ html: string; finalUrl: string } | null> {
  try {
    const pageUrl = await resolveOriginalSourceUrl(sourceUrl) || sourceUrl;
    if (_pageCache.has(pageUrl)) return { html: _pageCache.get(pageUrl)!, finalUrl: pageUrl };
    const res = await fetchWithTimeout(pageUrl, {
      headers: {
        "User-Agent": BROWSER_UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ar,en;q=0.8",
        "Referer": "https://www.google.com/",
      },
    }, 12000);
    if (!res.ok) return null;
    const html = await res.text();
    _pageCache.set(pageUrl, html);
    return { html, finalUrl: pageUrl };
  } catch { return null; }
}


// جلب الصورة الحقيقية من رابط المصدر (og:image / twitter:image / أول <img>)
async function fetchRealImageFromSource(sourceUrl: string): Promise<string | null> {
  const page = await fetchSourcePage(sourceUrl);
  if (!page) return null;
  const { html, finalUrl } = page;
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/gi,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/gi,
    /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/gi,
    /<img[^>]+(?:data-original|data-src|data-lazy-src|src)=["']([^"']+)["']/gi,
  ];
  const candidates: string[] = [];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const normalized = normalizeImageUrl(m[1], finalUrl);
      if (normalized) candidates.push(normalized);
    }
  }
  return candidates.find(isUsableOriginalImage) || null;
}

// جلب نص المقال الكامل من صفحة المصدر
async function fetchFullArticleBody(sourceUrl: string): Promise<string | null> {
  const page = await fetchSourcePage(sourceUrl);
  if (!page) return null;
  const { html } = page;

  // 1) جرّب JSON-LD NewsArticle articleBody
  const ldMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const block of ldMatches) {
    const inner = block.replace(/<script[^>]*>|<\/script>/gi, "").trim();
    try {
      const json = JSON.parse(inner);
      const arr = Array.isArray(json) ? json : (json["@graph"] || [json]);
      for (const node of arr) {
        const body = node?.articleBody || node?.description;
        if (typeof body === "string" && body.length > 300) return body;
      }
    } catch { /* ignore */ }
  }

  // 2) جرّب الحاويات الشائعة للمقال
  const containerPatterns = [
    /<article[\s\S]*?<\/article>/i,
    /<div[^>]+(?:itemprop=["']articleBody["']|id=["'](?:articleBody|article-body|story-body|content-body)["']|class=["'][^"']*(?:article-body|story-body|post-content|entry-content|article__body|content-body|news-body)[^"']*["'])[\s\S]*?<\/div>/i,
  ];
  for (const re of containerPatterns) {
    const m = html.match(re);
    if (!m) continue;
    const block = m[0];
    const paras = Array.from(block.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
      .map(x => stripHtml(x[1]))
      .filter(t => t.length > 40 && !/^(اقرأ|اضغط|تابع|المصدر)/.test(t));
    if (paras.length >= 2) return paras.join("\n\n");
  }

  // 3) Fallback: og:description
  const og = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (og && og.length > 100) return decodeHtml(og);
  return null;
}

// استبدال الصور المولّدة بالـAI بصور حقيقية من المصدر
async function replaceAiImagesWithReal(limit = 30) {
  const { data: rows, error } = await supabase
    .from("articles")
    .select("id, source_url, image_url")
    .not("source_url", "is", null)
    .or("image_url.like.%/ai/%,image_url.like.%googleusercontent.com%,image_url.like.%gstatic.com%,image_url.is.null")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { ok: false, error: error.message, replaced: 0 };
  let replaced = 0;
  for (const r of rows || []) {
    if (!r.source_url) continue;
    const originalSourceUrl = await resolveOriginalSourceUrl(r.source_url) || r.source_url;
    const realUrl = await fetchRealImageFromSource(originalSourceUrl);
    if (!realUrl) continue;
    const { error: upErr } = await supabase
      .from("articles")
      .update({ image_url: realUrl, images: [{ url: realUrl, position: "start" }], source_url: originalSourceUrl })
      .eq("id", r.id);
    if (!upErr) replaced++;
  }
  return { ok: true, scanned: rows?.length || 0, replaced };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (!(await verifyAdmin(req))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  try {
    const url = new URL(req.url);
    let body: any = {};
    if (req.method === "POST") { try { body = await req.json(); } catch { /* empty */ } }
    const mode = url.searchParams.get("mode") || body?.mode;

    if (mode === "backfill") {
      const limit = Number(url.searchParams.get("limit") || body?.limit || 20);
      const result = await backfillMissingImages(limit);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "replace-ai-images") {
      const limit = Number(url.searchParams.get("limit") || body?.limit || 30);
      const result = await replaceAiImagesWithReal(limit);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "repair-images") {
      const limit = Number(url.searchParams.get("limit") || body?.limit || 80);
      const result = await repairBrokenImages(limit);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];
    // التشغيل التلقائي: يستخدم AI افتراضياً (تم رفع max_tokens والتعامل مع نقص الرصيد عبر fallback محلي).
    // يمكن تعطيله صراحة عبر ?ai=0 أو { "useAI": false }.
    const aiParam = url.searchParams.get("ai");
    const useAI = body?.useAI === false ? false : (aiParam === "0" ? false : true);
    const fullRun = body?.full === true || url.searchParams.get("full") === "1";
    const runState = { aiCalls: 0, aiLimit: useAI ? AI_REWRITE_LIMIT_PER_RUN : 0 };
    const selectedSources = pickSourcesForRun(fullRun);
    for (const src of selectedSources) results.push(await processSource(src, runState));
    if (!fullRun && results.reduce((sum, r) => sum + (r.items_inserted || 0), 0) === 0) {
      const selectedNames = new Set(selectedSources.map(s => s.name));
      for (const src of SOURCES.filter(s => !selectedNames.has(s.name))) {
        results.push(await processSource(src, runState));
        if (results.reduce((sum, r) => sum + (r.items_inserted || 0), 0) > 0) break;
      }
    }
    return new Response(JSON.stringify({ ok: true, mode: fullRun ? "full" : "automatic-with-fallback", ai: useAI, sources: results.map((r: any) => r.source), results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });


  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
