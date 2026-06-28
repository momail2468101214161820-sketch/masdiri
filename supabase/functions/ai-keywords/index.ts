import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title = "", summary = "", content = "" } = await req.json();
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const text = `${title}\n${summary}\n${content}`.slice(0, 8000);

    const prompt = `أنت خبير SEO عربي. اقترح كلمات مفتاحية للبحث في جوجل لهذا الخبر.
أعد JSON فقط بهذا الشكل:
{
  "focus_keyword": "أهم كلمة مفتاحية رئيسية (2-4 كلمات)",
  "keywords": ["كلمة 1", "كلمة 2", ...]
}
أعطني 8-12 كلمة مفتاحية عربية واقعية يبحث بها الناس فعلاً، متنوعة بين قصيرة وطويلة (long-tail)، بدون رموز أو ترقيم.

الخبر:
${text}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: errText }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }

    return new Response(JSON.stringify({
      focus_keyword: parsed.focus_keyword || "",
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
