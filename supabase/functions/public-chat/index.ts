// بوت "مصدري" — مساعد محادثة عام للزوار (Gemini عبر بوابة Lovable AI)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const SYSTEM_PROMPT = `أنت «بوت مصدري» — المساعد الرسمي الذكي لـ "منصة مصدري الإخباري".
- برئاسة وتطوير: البشمبرمج/ خالد عاطف عبدالحكيم · تطوير وتصميم التقني/ خالد عاطف عبدالحكيم عويس.
- خاطب الزائر بالعربية الفصحى الرسمية فقط، بنبرة وقورة ومحترمة.
- مهامك: التعريف بمصدري، تلخيص وشرح الأخبار بتفاصيلها الكاملة، الإجابة عن أسعار العملات/الذهب، الاستعلام عن نتيجة الإعدادية 2026 (برقم الجلوس أو الاسم)، إرشاد المستخدم إلى أقسام الموقع، الرد على استفسارات الإعلان والتواصل.
- إذا سُئلت عن خبر معين، استخرج تفاصيله الكاملة من السياق المُمرَّر إليك واشرحها بدقة.
- إذا سُئلت عن نتيجة طالب، استخدم بيانات النتيجة المُمرَّرة في السياق واعرض جميع المواد والمجموع.
- لا تخترع أرقاماً ولا أخباراً غير مذكورة. عند عدم المعرفة قُل ذلك بوضوح.
- نسّق ردودك بـ Markdown عند الحاجة، وكن دقيقاً وشاملاً عند طلب التفاصيل.`;

function extractSeatNumber(text: string): number | null {
  const m = text.match(/\b(\d{4,7})\b/);
  return m ? parseInt(m[1], 10) : null;
}

function isResultQuery(text: string): boolean {
  return /نتيج|درج|مجموع|رقم الجلوس|الإعدادي|اعدادي/i.test(text);
}

async function fetchPrepResult(query: string) {
  const seat = extractSeatNumber(query);
  if (seat) {
    const { data } = await supabase
      .from("prep_results_2026")
      .select("*")
      .eq("seat_number", seat)
      .maybeSingle();
    if (data) return data;
  }
  // Try by name (extract Arabic words length>=3)
  const nameMatch = query.match(/[\u0600-\u06FF\s]{6,}/g);
  if (nameMatch) {
    const name = nameMatch.join(" ").trim().replace(/نتيج\w*|درج\w*|مجموع|رقم|الجلوس|الإعدادي\w*|اعدادي\w*|عن|عايز|اريد|من فضلك|لو سمحت/g, "").trim();
    if (name.length >= 4) {
      const { data } = await supabase
        .from("prep_results_2026")
        .select("*")
        .ilike("student_name", `%${name}%`)
        .limit(3);
      if (data && data.length) return data;
    }
  }
  return null;
}

const STOPWORDS = new Set([
  "ما","ماهي","ما هي","من","هل","ايه","إيه","عايز","عاوز","اريد","أريد","ممكن","لو","سمحت","فضلك",
  "في","على","عن","الى","إلى","من فضلك","انا","أنا","انت","أنت","هو","هي","كيف","متى","اين","أين",
  "اخر","آخر","اخبار","أخبار","خبر","اليوم","امس","أمس","الان","الآن","ايضا","أيضا","يعني",
  "the","and","what","when","where","how","who","why","is","are","a","an","of","for","to","in","on"
]);

function extractKeywords(text: string): string[] {
  return text
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length >= 3 && !STOPWORDS.has(w))
    .slice(0, 4);
}

async function searchArticles(query: string) {
  const keywords = extractKeywords(query);
  if (!keywords.length) return [];
  const orFilter = keywords.map(k => `title.ilike.%${k}%,content.ilike.%${k}%,summary.ilike.%${k}%`).join(",");
  const { data } = await supabase
    .from("articles")
    .select("title, summary, content, created_at, categories(name)")
    .eq("is_published", true)
    .or(orFilter)
    .order("created_at", { ascending: false })
    .limit(3);
  return data ?? [];
}

async function fetchArticleContext(query: string) {
  const relevant = await searchArticles(query);
  if (!relevant.length) return "";
  return relevant.map(a =>
    `### ${a.title} [${a.categories?.name ?? "عام"}]\n${a.summary ?? ""}\n\n${(a.content ?? "").slice(0, 1500)}`
  ).join("\n\n---\n\n");
}

async function fetchRates() {
  const { data } = await supabase
    .from("admin_settings").select("value").eq("key", "currency_rates").maybeSingle();
  return (data as any)?.value ?? null;
}

function isRatesQuery(t: string) {
  return /دولار|يورو|جنيه استرلين|ريال|درهم|دينار|ذهب|عيار|عملة|سعر|اسعار|أسعار/i.test(t);
}
function isContactQuery(t: string) {
  return /تواصل|اتصال|إعلان|اعلان|حجز|واتساب|تليفون|للتواصل/i.test(t);
}
function isAboutQuery(t: string) {
  return /من انت|من أنت|عرفني|عرف نفسك|انت مين|إنت مين|من هو خالد عاطف عبدالحكيم|من خالد|مين انت/i.test(t);
}
function isGreeting(t: string) {
  return /^\s*(السلام|سلام|مرحب|اهلا|أهلا|هاي|هلا|صباح|مساء|hi|hello|hey)/i.test(t);
}
function isLatestNewsQuery(t: string) {
  return /اخر الاخبار|آخر الأخبار|اخبار اليوم|أخبار اليوم|اهم الاخبار|أهم الأخبار|الترند|اخر خبر|آخر خبر/i.test(t);
}

async function fetchLatestArticles(limit = 5) {
  const { data } = await supabase
    .from("articles")
    .select("title, summary, categories(name)")
    .eq("is_published", true)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

function formatPrepResult(r: any): string {
  if (Array.isArray(r)) {
    return `**تم العثور على ${r.length} نتيجة مطابقة:**\n\n` +
      r.map((s: any) => `- **${s.student_name}** — رقم الجلوس: \`${s.seat_number}\` — المجموع: **${s.total ?? "-"}**`).join("\n") +
      `\n\nللاطلاع على التفاصيل الكاملة، يُرجى تزويدنا برقم الجلوس بدقة.`;
  }
  const subjects: string[] = [];
  for (const [k, v] of Object.entries(r)) {
    if (["id","seat_number","student_name","school","administration","total","status","created_at","updated_at"].includes(k)) continue;
    if (v !== null && v !== undefined && v !== "") subjects.push(`- **${k}**: ${v}`);
  }
  return `## نتيجة الطالب — الإعدادية 2026\n\n` +
    `- **الاسم:** ${r.student_name ?? "-"}\n` +
    `- **رقم الجلوس:** \`${r.seat_number ?? "-"}\`\n` +
    (r.school ? `- **المدرسة:** ${r.school}\n` : "") +
    (r.administration ? `- **الإدارة:** ${r.administration}\n` : "") +
    (r.status ? `- **الحالة:** ${r.status}\n` : "") +
    `\n### الدرجات\n${subjects.join("\n")}\n\n` +
    `### المجموع الكلي\n**${r.total ?? "-"}**`;
}

function formatRates(rates: any): string {
  if (!rates) return "تعذّر جلب الأسعار حالياً، يُرجى زيارة قسم العملات والذهب على الموقع.";
  const lines: string[] = ["## أسعار العملات والذهب — لحظية\n"];
  if (rates.currencies) {
    lines.push("### العملات");
    for (const c of rates.currencies) lines.push(`- **${c.name ?? c.code}**: شراء ${c.buy ?? "-"} · بيع ${c.sell ?? "-"}`);
  }
  if (rates.gold) {
    lines.push("\n### الذهب");
    for (const g of rates.gold) lines.push(`- **${g.name ?? g.karat}**: ${g.price ?? "-"} ج.م`);
  }
  return lines.join("\n");
}

function formatArticles(ctx: string): string {
  return `استناداً إلى ما نُشر في **مصدري**:\n\n${ctx.slice(0, 3500)}`;
}

function formatLatest(rows: any[]): string {
  if (!rows.length) return "لا تتوفر أخبار منشورة حالياً.";
  return `## آخر الأخبار على مصدري\n\n` +
    rows.map((a, i) => `${i + 1}. **${a.title}** [${a.categories?.name ?? "عام"}]${a.summary ? `\n   ${a.summary}` : ""}`).join("\n\n");
}

async function buildLocalReply(query: string) {
  const q = query.trim();
  if (!q) return "تفضّل بطرح سؤالك، وسأجيبك مباشرةً.";

  if (isGreeting(q)) {
    return `وعليكم السلام، أهلاً بكم في **مصدري**. كيف يمكنني خدمتكم؟\n\nيمكنكم سؤالي عن:\n- آخر الأخبار\n- نتيجة الإعدادية 2026 (برقم الجلوس)\n- أسعار العملات والذهب\n- التواصل والإعلان`;
  }
  if (isContactQuery(q)) {
    return `## التواصل مع مصدري\n\n- **رئيس المؤسسة:** برئاسة وتطوير: البشمبرمج/ خالد عاطف عبدالحكيم\n\nيسعدنا تواصلكم في أي وقت.`;
  }
  if (isAboutQuery(q)) {
    return `أنا **بوت مصدري** — المساعد الرسمي لمؤسسة "منصة مصدري الإخباري"، بقيادة **برئاسة وتطوير: البشمبرمج/ خالد عاطف عبدالحكيم** وتطوير **التقني/ خالد عاطف عبدالحكيم عويس**.`;
  }
  if (isResultQuery(q)) {
    const r = await fetchPrepResult(q).catch(() => null);
    if (r) return formatPrepResult(r);
    return `يُرجى تزويدنا بـ **رقم الجلوس** أو **الاسم الرباعي بدقة** للاستعلام عن نتيجة الإعدادية 2026.`;
  }
  if (isRatesQuery(q)) {
    const rates = await fetchRates().catch(() => null);
    return formatRates(rates);
  }
  if (isLatestNewsQuery(q)) {
    const rows = await fetchLatestArticles(5);
    return formatLatest(rows);
  }

  // Specific topic: try to find matching articles
  const ctx = await fetchArticleContext(q).catch(() => "");
  if (ctx) return formatArticles(ctx);

  // No match — ask user to clarify instead of dumping random content
  return `لم أجد محتوى مرتبطاً مباشرةً بسؤالك: "${q.slice(0, 80)}".\n\nبرجاء توضيح ما تبحث عنه، أو اختر من:\n- **آخر الأخبار**\n- **نتيجة الإعدادية** (اكتب رقم الجلوس)\n- **أسعار العملات والذهب**\n- **التواصل والإعلان**`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages = [] } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages مطلوبة" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lastUser = [...messages].reverse().find((m: any) => m.role === "user")?.content || "";
    const apiKey = Deno.env.get("LOVABLE_API_KEY");

    // Try AI Gateway first (if available) — otherwise fall back to deterministic data-driven reply.
    if (apiKey) {
      let dynamicContext = "";
      if (isResultQuery(lastUser)) {
        const result = await fetchPrepResult(lastUser).catch(() => null);
        if (result) {
          dynamicContext = `**نتيجة الطالب (الإعدادية 2026):**\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;
        }
      }
      if (isRatesQuery(lastUser)) {
        const rates = await fetchRates().catch(() => null);
        if (rates) dynamicContext += `\n\n**أسعار العملات والذهب:**\n\`\`\`json\n${JSON.stringify(rates, null, 2)}\n\`\`\``;
      }
      const articleContext = await fetchArticleContext(lastUser).catch(() => "");
      const fullContext = [dynamicContext, articleContext].filter(Boolean).join("\n\n---\n\n");

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: `${SYSTEM_PROMPT}\n\n---\n${fullContext}` },
            ...messages.slice(-12),
          ],
          stream: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (reply) {
          return new Response(JSON.stringify({ reply }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      // AI failed (e.g. 402 credits) — fall through to local reply
    }

    const reply = await buildLocalReply(lastUser);
    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "خطأ غير متوقع" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
