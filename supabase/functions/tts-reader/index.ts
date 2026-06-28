import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text } = await req.json();
    if (!text || text.length > 5000) {
      return new Response(JSON.stringify({ error: "النص فارغ أو طويل جداً" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Use AI to create an SSML-enhanced version of the text for better Arabic TTS
    // Then use browser's built-in speechSynthesis on the client side
    // Return a cleaned/phonetic version optimized for Arabic TTS
    const cleanText = text
      .replace(/---[\s\S]*$/, "") // Remove CTA block
      .replace(/https?:\/\/\S+/g, "") // Remove URLs
      .replace(/📱|📞|📲|🔴|✅|🗑️|📌/g, "") // Remove emojis
      .replace(/\n{2,}/g, ". ") // Replace multiple newlines with pause
      .trim();

    return new Response(JSON.stringify({ cleanText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
