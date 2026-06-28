// Public prep-results lookup. Returns at most a small page of rows
// matching a seat number (exact) or a student name (prefix/substring).
// The underlying table is fully locked down at the RLS layer — this
// function is the ONLY way the data is exposed to the client.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
 "Access-Control-Allow-Origin": "*",
 "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
 Deno.env.get("SUPABASE_URL")!,
 Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

serve(async (req) => {
 if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
 if (req.method !== "POST") {
 return new Response(JSON.stringify({ error: "POST only" }), {
 status: 400,
 headers: { ...corsHeaders, "Content-Type": "application/json" },
 });
 }

 let body: any;
 try { body = await req.json; } catch {
 return new Response(JSON.stringify({ error: "Invalid JSON" }), {
 status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
 });
 }

 const seat = typeof body.seat_number === "string" ? body.seat_number.trim : "";
 const name = typeof body.student_name === "string" ? body.student_name.trim : "";

 // Reject empty / abusive queries
 if (!seat && (!name || name.length < 3)) {
 return new Response(
 JSON.stringify({ error: "أدخل رقم الجلوس أو اسم لا يقل عن 3 أحرف" }),
 { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
 );
 }

 let q = supabase.from("prep_results_2026").select("*");
 if (seat) {
 if (!/^\d{1,10}$/.test(seat)) {
 return new Response(
 JSON.stringify({ error: "رقم جلوس غير صالح" }),
 { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
 );
 }
 q = q.eq("seat_number", Number(seat)).limit(1);
 } else {
 // sanitize wildcards
 const safe = name.replace(/[%_]/g, "").slice(0, 60);
 q = q.ilike("student_name", `%${safe}%`).limit(20);
 }

 const { data, error } = await q;
 if (error) {
 return new Response(JSON.stringify({ error: error.message }), {
 status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
 });
 }
 return new Response(JSON.stringify({ data: data ?? }), {
 status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
 });
});
