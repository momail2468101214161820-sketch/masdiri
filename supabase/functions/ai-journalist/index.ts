import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-admin-pin",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function getCurrentPin(): Promise<string> {
  const { data } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", "admin_code")
    .maybeSingle();
  if (data?.value && typeof data.value === "string") return data.value;
  return Deno.env.get("ADMIN_PIN") ?? "7777";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Admin-only: only the editorial dashboard should call this.
  const headerPin = req.headers.get("X-Admin-Pin") ?? "";
  const currentPin = await getCurrentPin();
  if (headerPin !== currentPin) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { text } = await req.json();
    if (typeof text !== "string" || text.length === 0 || text.length > 10000) {
      return new Response(JSON.stringify({ error: "Invalid text payload" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: `أنت "صائد الأخبار" داخل "صوت البلد | صوتك واصل". أعد إنتاج الخبر بالكامل بأسلوب صحفي احترافي موسّع، بحيث يفهمه القارئ دون الرجوع لأي مصدر خارجي.

قواعد إلزامية:
- إعادة صياغة 100% (ممنوع النسخ).
- مقدمة Hook + 6 إلى 12 فقرة تفصيلية + خلفية سياقية (لماذا/كيف/متى/الأطراف/التأثير/المتوقع) + تحليل خفيف + خاتمة.
- لغة عربية فصيحة رسمية، فقرات مقسمة، مناسبة لـ Google Discover.
- ممنوع ذكر أي وكالة/جريدة/موقع/قناة، وممنوع الكلمات: منصة، موقع، صحيفة، جريدة، مؤسسة إعلامية، News، Media، Press، Magazine.
- ممنوع روابط أو "..." في نهاية النص.
- الاسم الوحيد المسموح: "صوت البلد".
- العنوان قوي SEO Friendly (≤ 65 حرف)، الملخص 140-160 حرف.

أجب بصيغة JSON فقط بالشكل التالي:
{"refined": "النص المعاد صياغته بالكامل بفقرات مفصولة بسطرين", "title": "العنوان", "summary": "الملخص 140-160 حرف"}`
          },
          { role: "user", content: text },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز الحد المسموح، حاول لاحقاً" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { refined: content, title: "", summary: "" };
    } catch {
      parsed = { refined: content, title: "", summary: "" };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("AI journalist error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
