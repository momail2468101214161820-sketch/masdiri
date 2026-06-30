// Auto news fetcher: DISABLED VERSION
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-pin",
};

Deno.serve(async (req) => {
  // التعامل مع طلبات الـ CORS المبدئية
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // إرجاع استجابة تفيد بتعطيل الصائد بنجاح دون تنفيذ أي عمليات جلب أو استهلاك للذكاء الاصطناعي
  return new Response(
    JSON.stringify({ 
      ok: true, 
      message: "News fetcher and AI rewriting are currently disabled.",
      mode: "disabled"
    }), 
    {
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    }
  );
});
