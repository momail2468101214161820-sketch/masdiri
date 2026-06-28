// جلب أسعار العملات والذهب تلقائيًا وتخزينها في admin_settings.currency_rates
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
 "Access-Control-Allow-Origin": "*",
 "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
 Deno.env.get("SUPABASE_URL")!,
 Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

interface Rate { name: string; buy: string; sell: string; trend: "up" | "down"; }

const SPREAD = 0.003; // فرق ~0.3% بين الشراء والبيع

const fmt = (n: number, d = 2) => n.toFixed(d);

async function fetchCurrencies: Promise<Record<string, number>> {
 // أسعار مقابل الجنيه المصري — مصدر مجاني بدون مفتاح
 const r = await fetch("https://open.er-api.com/v6/latest/USD");
 if (!r.ok) throw new Error(`currency api ${r.status}`);
 const j = await r.json;
 const usdToEgp = j.rates?.EGP;
 if (!usdToEgp) throw new Error("EGP rate missing");
 return {
 USD: usdToEgp,
 EUR: usdToEgp / j.rates.EUR,
 SAR: usdToEgp / j.rates.SAR,
 AED: usdToEgp / j.rates.AED,
 GBP: usdToEgp / j.rates.GBP,
 KWD: usdToEgp / j.rates.KWD,
 };
}

async function fetchGoldUsdPerOunce: Promise<number> {
 // سعر أوقية الذهب بالدولار — مصدر مجاني
 const r = await fetch("https://api.gold-api.com/price/XAU");
 if (!r.ok) throw new Error(`gold api ${r.status}`);
 const j = await r.json;
 const p = Number(j.price);
 if (!p) throw new Error("gold price missing");
 return p;
}

async function buildRates: Promise<Rate> {
 const [cur, oz] = await Promise.all([fetchCurrencies, fetchGoldUsdPerOunce]);
 const usdEgp = cur.USD;
 const gram24 = (oz / 31.1035) * usdEgp;
 const gram21 = gram24 * 21 / 24;
 const gram18 = gram24 * 18 / 24;
 const pound = gram21 * 8; // الجنيه الذهب = 8 جرام عيار 21
 const mid = (v: number) => ({ buy: fmt(v * (1 - SPREAD)), sell: fmt(v * (1 + SPREAD)) });
 const midI = (v: number) => ({ buy: fmt(v * (1 - SPREAD), 0), sell: fmt(v * (1 + SPREAD), 0) });
 return [
 { name: "الدولار الأمريكي", ...mid(cur.USD), trend: "up" },
 { name: "اليورو", ...mid(cur.EUR), trend: "up" },
 { name: "الريال السعودي", ...mid(cur.SAR), trend: "up" },
 { name: "الدرهم الإماراتي", ...mid(cur.AED), trend: "up" },
 { name: "الجنيه الإسترليني", ...mid(cur.GBP), trend: "up" },
 { name: "الدينار الكويتي", ...mid(cur.KWD), trend: "up" },
 { name: "ذهب عيار 24", ...midI(gram24), trend: "up" },
 { name: "ذهب عيار 21", ...midI(gram21), trend: "up" },
 { name: "ذهب عيار 18", ...midI(gram18), trend: "up" },
 { name: "الجنيه الذهب", ...midI(pound), trend: "up" },
 { name: "أوقية الذهب (عالمي)", ...mid(oz), trend: "up" },
 ];
}

Deno.serve(async (req) => {
 if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
 try {
 // قارن مع القيم السابقة لتحديد الاتجاه
 const { data: prev } = await supabase
 .from("admin_settings").select("value").eq("key", "currency_rates").maybeSingle;
 let prevMap: Record<string, number> = {};
 if (prev?.value) {
 try {
 const arr = JSON.parse(prev.value) as Rate;
 arr.forEach(r => { prevMap[r.name] = Number(r.buy); });
 } catch { /* ignore */ }
 }

 const rates = await buildRates;
 for (const r of rates) {
 const old = prevMap[r.name];
 if (old) r.trend = Number(r.buy) >= old ? "up" : "down";
 }

 const { error } = await supabase
 .from("admin_settings")
 .upsert({ key: "currency_rates", value: JSON.stringify(rates), updated_at: new Date.toISOString }, { onConflict: "key" });
 if (error) throw error;

 return new Response(JSON.stringify({ ok: true, count: rates.length, rates }), {
 headers: { ...corsHeaders, "Content-Type": "application/json" },
 });
 } catch (e) {
 return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "unknown" }), {
 status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
 });
 }
});
