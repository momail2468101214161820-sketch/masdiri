import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
 "Access-Control-Allow-Origin": "*",
 "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-admin-pin",
};

const supabase = createClient(
 Deno.env.get("SUPABASE_URL")!,
 Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function getCurrentPin: Promise<string> {
 const { data } = await supabase
 .from("admin_settings")
 .select("value")
 .eq("key", "admin_code")
 .maybeSingle;
 if (data?.value && typeof data.value === "string") return data.value;
 return Deno.env.get("ADMIN_PIN") ?? "7777";
}

const tools = [
 {
 type: "function",
 function: {
 name: "create_article",
 description: "Create and publish a new news article",
 parameters: {
 type: "object",
 properties: {
 title: { type: "string", description: "Article title" },
 content: { type: "string", description: "Full article content" },
 summary: { type: "string", description: "Short summary" },
 category: { type: "string", description: "Category name: سياسة, رياضة, حوادث, اقتصاد, تكنولوجيا, أسعار" },
 image_url: { type: "string", description: "Image URL" },
 is_breaking: { type: "boolean", description: "Is breaking news" },
 is_pinned: { type: "boolean", description: "Pin to top" },
 },
 required: ["title", "content"],
 },
 },
 },
 {
 type: "function",
 function: {
 name: "update_article",
 description: "Update an existing article by its title (partial match)",
 parameters: {
 type: "object",
 properties: {
 search_title: { type: "string", description: "Part of the article title to find" },
 title: { type: "string", description: "New title" },
 content: { type: "string", description: "New content" },
 summary: { type: "string", description: "New summary" },
 image_url: { type: "string", description: "New image URL" },
 is_breaking: { type: "boolean", description: "Is breaking" },
 is_pinned: { type: "boolean", description: "Pin to top" },
 },
 required: ["search_title"],
 },
 },
 },
 {
 type: "function",
 function: {
 name: "delete_article",
 description: "Delete an article by title (partial match)",
 parameters: {
 type: "object",
 properties: {
 search_title: { type: "string", description: "Part of the article title to find and delete" },
 },
 required: ["search_title"],
 },
 },
 },
 {
 type: "function",
 function: {
 name: "toggle_ad",
 description: "Activate or deactivate an ad by slot name",
 parameters: {
 type: "object",
 properties: {
 slot: { type: "string", description: "Ad slot: header, sidebar, in-article" },
 is_active: { type: "boolean", description: "Set active or inactive" },
 },
 required: ["slot", "is_active"],
 },
 },
 },
 {
 type: "function",
 function: {
 name: "list_articles",
 description: "List recent articles from the database",
 parameters: {
 type: "object",
 properties: {
 limit: { type: "number", description: "Number of articles to list (default 10)" },
 category: { type: "string", description: "Filter by category name" },
 },
 },
 },
 },
 {
 type: "function",
 function: {
 name: "manage_category",
 description: "Create or delete a news category",
 parameters: {
 type: "object",
 properties: {
 action: { type: "string", enum: ["create", "delete", "list"], description: "Action to perform" },
 name: { type: "string", description: "Category name (Arabic)" },
 slug: { type: "string", description: "Category slug (English)" },
 },
 required: ["action"],
 },
 },
 },
 {
 type: "function",
 function: {
 name: "create_ad",
 description: "Create a new advertisement",
 parameters: {
 type: "object",
 properties: {
 slot: { type: "string", description: "Ad slot: header, sidebar, in-article" },
 image_url: { type: "string", description: "Ad image URL" },
 video_url: { type: "string", description: "Ad video URL (MP4/WebM)" },
 target_url: { type: "string", description: "Click-through URL" },
 ad_type: { type: "string", enum: ["image", "video", "gif"], description: "Ad type" },
 start_date: { type: "string", description: "Start date ISO format" },
 end_date: { type: "string", description: "End date ISO format" },
 },
 required: ["slot"],
 },
 },
 },
 {
 type: "function",
 function: {
 name: "fetch_news_headlines",
 description: "بحث عن آخر الأخبار العربية حول موضوع معين وإعادة صياغتها بأسلوب رسمي",
 parameters: {
 type: "object",
 properties: {
 topic: { type: "string", description: "الموضوع المطلوب البحث عنه" },
 },
 required: ["topic"],
 },
 },
 },
 {
 type: "function",
 function: {
 name: "web_search",
 description: "بحث على الويب باستخدام جوجل عبر Gemini للحصول على معلومات محدثة ومصادر موثقة",
 parameters: {
 type: "object",
 properties: {
 query: { type: "string", description: "استعلام البحث" },
 },
 required: ["query"],
 },
 },
 },
 {
 type: "function",
 function: {
 name: "generate_image",
 description: "Generate an exclusive image for a news article based on a text description",
 parameters: {
 type: "object",
 properties: {
 prompt: { type: "string", description: "Description of the image to generate (in English or Arabic)" },
 article_title: { type: "string", description: "Optional: article title to link the image to" },
 },
 required: ["prompt"],
 },
 },
 },
 {
 type: "function",
 function: {
 name: "analyze_image",
 description: "Analyze an uploaded image - extract text (OCR) or describe its contents",
 parameters: {
 type: "object",
 properties: {
 image_url: { type: "string", description: "URL of the image to analyze" },
 task: { type: "string", enum: ["describe", "extract_text", "both"], description: "What to do with the image" },
 },
 required: ["image_url"],
 },
 },
 },
 {
 type: "function",
 function: {
 name: "manage_video",
 description: "Create or list videos in the video hub",
 parameters: {
 type: "object",
 properties: {
 action: { type: "string", enum: ["create", "list", "delete"], description: "Action to perform" },
 title: { type: "string", description: "Video title" },
 description: { type: "string", description: "Video description" },
 video_url: { type: "string", description: "Video URL" },
 thumbnail_url: { type: "string", description: "Thumbnail image URL" },
 category: { type: "string", description: "Category name" },
 search_title: { type: "string", description: "Part of title to search (for delete)" },
 },
 required: ["action"],
 },
 },
 },
 {
 type: "function",
 function: {
 name: "update_currency_rates",
 description: "تحديث أسعار العملات والذهب المعروضة في الموقع (قائمة كاملة تستبدل الحالية)",
 parameters: {
 type: "object",
 properties: {
 rates: {
 type: "array",
 description: "قائمة الأسعار",
 items: {
 type: "object",
 properties: {
 name: { type: "string", description: "اسم العملة أو نوع الذهب (مثال: ذهب عيار 21)" },
 buy: { type: "string", description: "سعر الشراء" },
 sell: { type: "string", description: "سعر البيع" },
 trend: { type: "string", enum: ["up", "down"], description: "اتجاه السعر" },
 },
 required: ["name", "buy", "sell", "trend"],
 },
 },
 },
 required: ["rates"],
 },
 },
 },
];


async function executeTool(name: string, args: any): Promise<string> {
 try {
 if (name === "create_article") {
 let category_id = null;
 if (args.category) {
 const { data: cats } = await supabase.from("categories").select("id, name");
 const cat = cats?.find((c: any) => c.name === args.category);
 if (cat) category_id = cat.id;
 }
 const { error } = await supabase.from("articles").insert({
 title: args.title,
 content: args.content || "",
 summary: args.summary || null,
 image_url: args.image_url || null,
 category_id,
 is_breaking: args.is_breaking || false,
 is_pinned: args.is_pinned || false,
 is_published: true,
 });
 if (error) return `خطأ: ${error.message}`;
 return `تم التنفيذ بنجاح. ✅ تم نشر الخبر "${args.title}" - `;
 }

 if (name === "update_article") {
 const { data: articles } = await supabase.from("articles").select("id, title").ilike("title", `%${args.search_title}%`).limit(1);
 if (!articles?.length) return `لم يتم العثور على خبر بهذا العنوان.`;
 const updates: any = {};
 if (args.title) updates.title = args.title;
 if (args.content) updates.content = args.content;
 if (args.summary) updates.summary = args.summary;
 if (args.image_url) updates.image_url = args.image_url;
 if (args.is_breaking !== undefined) updates.is_breaking = args.is_breaking;
 if (args.is_pinned !== undefined) updates.is_pinned = args.is_pinned;
 const { error } = await supabase.from("articles").update(updates).eq("id", articles[0].id);
 if (error) return `خطأ: ${error.message}`;
 return `تم التنفيذ بنجاح. ✅ تم تحديث "${articles[0].title}"`;
 }

 if (name === "delete_article") {
 const { data: articles } = await supabase.from("articles").select("id, title").ilike("title", `%${args.search_title}%`).limit(1);
 if (!articles?.length) return `لم يتم العثور على خبر بهذا العنوان.`;
 const { error } = await supabase.from("articles").delete.eq("id", articles[0].id);
 if (error) return `خطأ: ${error.message}`;
 return `تم التنفيذ بنجاح. 🗑️ تم حذف "${articles[0].title}"`;
 }

 if (name === "toggle_ad") {
 const { error } = await supabase.from("ads").update({ is_active: args.is_active }).eq("slot", args.slot);
 if (error) return `خطأ: ${error.message}`;
 return `تم التنفيذ بنجاح. ${args.is_active ? "✅ تم تفعيل" : "⛔ تم تعطيل"} إعلان ${args.slot}`;
 }

 if (name === "list_articles") {
 const { data } = await supabase.from("articles").select("id, title, is_breaking, is_pinned, created_at, categories(name)").order("created_at", { ascending: false }).limit(args.limit || 10);
 if (!data?.length) return "لا توجد أخبار متاحة حالياً.";
 return data.map((a: any, i: number) => `${i + 1}. ${a.is_pinned ? "📌 " : ""}${a.is_breaking ? "🔴 " : ""}${a.title} (${a.categories?.name || "بدون قسم"})`).join("\n");
 }

 if (name === "manage_category") {
 if (args.action === "list") {
 const { data } = await supabase.from("categories").select("name, slug");
 if (!data?.length) return "لا توجد أقسام مسجلة. يُرجى إنشاء قسم أولاً.";
 return data.map((c: any, i: number) => `${i + 1}. ${c.name} (${c.slug})`).join("\n");
 }
 if (args.action === "create") {
 if (!args.name || !args.slug) return "محتاج اسم القسم والـ slug تفضّل";
 const { error } = await supabase.from("categories").insert({ name: args.name, slug: args.slug });
 if (error) return `خطأ: ${error.message}`;
 return `تم التنفيذ بنجاح. ✅ تم إضافة قسم "${args.name}"`;
 }
 if (args.action === "delete") {
 if (!args.name) return "محتاج اسم القسم تفضّل";
 const { error } = await supabase.from("categories").delete.eq("name", args.name);
 if (error) return `خطأ: ${error.message}`;
 return `تم التنفيذ بنجاح. 🗑️ تم حذف قسم "${args.name}"`;
 }
 return "أمر غير معروف";
 }

 if (name === "create_ad") {
 const { error } = await supabase.from("ads").insert({
 slot: args.slot,
 image_url: args.image_url || null,
 video_url: args.video_url || null,
 target_url: args.target_url || null,
 ad_type: args.ad_type || "image",
 is_active: true,
 start_date: args.start_date || null,
 end_date: args.end_date || null,
 });
 if (error) return `خطأ: ${error.message}`;
 return `تم التنفيذ بنجاح. ✅ تم إضافة إعلان في ${args.slot}`;
 }

 if (name === "fetch_news_headlines" || name === "web_search") {
 const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
 if (!LOVABLE_API_KEY) return "LOVABLE_API_KEY غير متوفر";
 const query = args.topic || args.query;
 const isNews = name === "fetch_news_headlines";
 const systemPrompt = isNews
 ? "أنت محرر إخباري رسمي يستخدم بحث جوجل المباشر. ابحث عن آخر الأخبار العربية الموثوقة حول الموضوع، واكتب 5 عناوين بأسلوب صحفي رصين. لكل عنوان: ملخص من سطرين + رابط المصدر بصيغة [اسم المصدر](URL). اختم بقسم 📚 **المصادر** يحوي قائمة بكل الروابط المستخدمة."
 : "أنت محرك بحث ذكي يعمل بالاتصال المباشر مع جوجل. قدّم إجابة دقيقة منظمة بالعربية الفصحى مع نقاط رئيسية. لا تجب من ذاكرتك بل من نتائج البحث. اختم دائماً بقسم 📚 **المصادر** يحوي روابط بصيغة Markdown [العنوان](URL).";
 const userPrompt = isNews ? `ابحث في جوجل عن آخر الأخبار حول: ${query}` : query;

 // Try multiple grounding tool formats (gateway compatibility shifts)
 const attempts: any = [
 { tools: [{ type: "google_search" }] },
 { tools: [{ google_search: {} }] },
 { tools: [{ type: "google_search_retrieval" }] },
 {}, // plain fallback
 ];
 for (const extra of attempts) {
 const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
 method: "POST",
 headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
 body: JSON.stringify({
 model: "google/gemini-2.5-pro",
 messages: [
 { role: "system", content: systemPrompt },
 { role: "user", content: userPrompt },
 ],
 ...extra,
 }),
 });
 if (!resp.ok) continue;
 const data = await resp.json;
 const text = data.choices?.[0]?.message?.content;
 if (text) {
 // Extract grounding metadata if Gemini returned it
 const grounding = data.choices?.[0]?.grounding_metadata
 ?? data.choices?.[0]?.message?.grounding_metadata;
 const urls: string = grounding?.grounding_chunks
 ?.map((c: any) => c?.web?.uri).filter(Boolean) ?? ;
 if (urls.length && !text.includes("📚")) {
 return text + "\n\n📚 **المصادر (Google):**\n" + urls.map((u, i) => `${i + 1}. ${u}`).join("\n");
 }
 return text;
 }
 }
 return "تعذّر إتمام البحث في الوقت الحالي.";
 }



 if (name === "generate_image") {
 const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
 if (!LOVABLE_API_KEY) return "LOVABLE_API_KEY غير متوفر";

 const imgResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
 method: "POST",
 headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
 body: JSON.stringify({
 model: "google/gemini-3.1-flash-image-preview",
 messages: [{ role: "user", content: `Generate a high-quality news editorial image: ${args.prompt}. Professional photojournalism style, HD quality, no text overlay.` }],
 modalities: ["image", "text"],
 }),
 });

 if (!imgResp.ok) return "تعذّر توليد الصورة. يُرجى إعادة المحاولة.";
 const imgData = await imgResp.json;
 const imageBase64 = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
 
 if (!imageBase64) return "تعذّر توليد الصورة. يُرجى المحاولة بوصف مختلف.";

 // Upload to storage
 const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
 const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
 const fileName = `generated-${Date.now}.png`;

 const { error: uploadError } = await supabase.storage
 .from("article-images")
 .upload(fileName, bytes, { contentType: "image/png" });

 if (uploadError) return `خطأ في رفع الصورة: ${uploadError.message}`;

 const { data: urlData } = supabase.storage.from("article-images").getPublicUrl(fileName);
 const publicUrl = urlData.publicUrl;

 // Optionally link to article
 if (args.article_title) {
 const { data: articles } = await supabase.from("articles").select("id").ilike("title", `%${args.article_title}%`).limit(1);
 if (articles?.length) {
 await supabase.from("articles").update({ image_url: publicUrl }).eq("id", articles[0].id);
 return `تم التنفيذ بنجاح. 🎨 تم توليد الصورة وربطها بالخبر "${args.article_title}"\n\nرابط الصورة: ${publicUrl}`;
 }
 }

 return `تم التنفيذ بنجاح. 🎨 تم توليد صورة حصرية\n\nرابط الصورة: ${publicUrl}\n\nيمكن استخدامها في أي خبر.`;
 }

 if (name === "analyze_image") {
 const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
 if (!LOVABLE_API_KEY) return "LOVABLE_API_KEY غير متوفر";

 const task = args.task || "both";
 let prompt = "";
 if (task === "describe") prompt = "صف هذه الصورة بالتفصيل باللغة العربية. اذكر كل العناصر المرئية والألوان والأشخاص والنص إن وجد.";
 else if (task === "extract_text") prompt = "استخرج كل النصوص الموجودة في هذه الصورة بالضبط كما هي مكتوبة. إذا لم يكن هناك نص، قل ذلك.";
 else prompt = "1. صف هذه الصورة بالتفصيل باللغة العربية.\n2. استخرج كل النصوص الموجودة فيها إن وجدت.";

 const analyzeResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
 method: "POST",
 headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
 body: JSON.stringify({
 model: "google/gemini-2.5-flash",
 messages: [{
 role: "user",
 content: [
 { type: "text", text: prompt },
 { type: "image_url", image_url: { url: args.image_url } },
 ],
 }],
 }),
 });

 if (!analyzeResp.ok) return "فشل تحليل الصورة";
 const analyzeData = await analyzeResp.json;
 return analyzeData.choices?.[0]?.message?.content || "لا توجد نتائج";
 }

 if (name === "update_currency_rates") {
 if (!Array.isArray(args.rates) || !args.rates.length) return "قائمة الأسعار فارغة.";
 const { error } = await supabase.from("admin_settings").upsert(
 { key: "currency_rates", value: JSON.stringify(args.rates), updated_at: new Date.toISOString },
 { onConflict: "key" },
 );
 if (error) return `خطأ: ${error.message}`;
 return `تم التنفيذ بنجاح. تم تحديث ${args.rates.length} عملة/سعر ذهب.`;
 }


 if (name === "manage_video") {
 if (args.action === "list") {
 const { data } = await supabase.from("videos").select("title, created_at, is_published").order("created_at", { ascending: false }).limit(10);
 if (!data?.length) return "لا توجد فيديوهات متاحة حالياً.";
 return data.map((v: any, i: number) => `${i + 1}. ${v.title} ${v.is_published ? "✅" : "⛔"}`).join("\n");
 }
 if (args.action === "create") {
 if (!args.title || !args.video_url) return "محتاج عنوان ورابط الفيديو تفضّل";
 let category_id = null;
 if (args.category) {
 const { data: cats } = await supabase.from("categories").select("id, name");
 const cat = cats?.find((c: any) => c.name === args.category);
 if (cat) category_id = cat.id;
 }
 const { error } = await supabase.from("videos").insert({
 title: args.title,
 description: args.description || null,
 video_url: args.video_url,
 thumbnail_url: args.thumbnail_url || null,
 category_id,
 is_published: true,
 });
 if (error) return `خطأ: ${error.message}`;
 return `تم التنفيذ بنجاح. 🎬 تم إضافة فيديو "${args.title}"`;
 }
 if (args.action === "delete") {
 if (!args.search_title) return "محتاج عنوان الفيديو تفضّل";
 const { data } = await supabase.from("videos").select("id, title").ilike("title", `%${args.search_title}%`).limit(1);
 if (!data?.length) return "لم يتم العثور على الفيديو المطلوب.";
 const { error } = await supabase.from("videos").delete.eq("id", data[0].id);
 if (error) return `خطأ: ${error.message}`;
 return `تم التنفيذ بنجاح. 🗑️ تم حذف فيديو "${data[0].title}"`;
 }
 return "أمر غير معروف";
 }

 return "أمر غير معروف";
 } catch (e) {
 return `خطأ: ${e instanceof Error ? e.message : "unknown"}`;
 }
}

serve(async (req) => {
 if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

 // Admin-only endpoint: require the PIN header that matches the current admin PIN.
 const headerPin = req.headers.get("X-Admin-Pin") ?? "";
 const currentPin = await getCurrentPin;
 if (headerPin !== currentPin) {
 return new Response(JSON.stringify({ error: "Unauthorized" }), {
 status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
 });
 }

 try {
 const { messages } = await req.json;
 const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
 if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

 const systemPrompt = `أنت "العقل التنفيذي" — المساعد التحريري الرسمي لـ "صوت البلد".

الهوية:
- الاسم: صوت البلد (Sout Al-Balad).
- الرئاسة: برئاسة وتطوير: البشمبرمج/ خالد عاطف عبدالحكيم.
- التصميم والتطوير: تطوير وتصميم التقني/ خالد عاطف عبدالحكيم عويس.
- اذكر هذه الهوية باحترام عند الاستفسار عنها، ولا تنسبها لغير أصحابها.

الهوية والنبرة:
- التزم بالعربية الفصحى الرسمية في جميع الردود.
- أسلوب صحفي رصين خالٍ من العامية والأمثال الشعبية والإيموجي المبالغ فيه.
- عند نجاح أي إجراء قل: "تم التنفيذ بنجاح."
- عند الخطأ اشرح السبب بوضوح واقترح الحل.

القدرات الكاملة (تحكم شامل في الموقع):
1. تحرير الأخبار وصياغتها بأسلوب صحفي رسمي.
2. نشر/تعديل/حذف الأخبار والإعلانات والأقسام والفيديوهات عبر الأدوات المتاحة.
3. البحث على الويب عبر جوجل (web_search و fetch_news_headlines) مع ذكر المصادر.
4. توليد صور تحريرية حصرية وتحليل الصور (OCR).
5. إدارة الأخبار العاجلة والمثبّتة والإعلانات المجدولة.
6. تحديث أسعار العملات والذهب عبر أداة update_currency_rates.

قواعد التحرير:
- لغة فصحى دقيقة، عناوين موجزة، ملخصات واضحة.
- اذكر المصدر عند توفره من نتائج البحث.
- لا تنشر أي خبر قبل عرض معاينة JSON لموافقة الإدارة.

الأقسام: سياسة، رياضة، حوادث، اقتصاد، تكنولوجيا، محافظات، فن، ثقافة، صحة، أسعار، أسعار الذهب.`;



 const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
 method: "POST",
 headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
 body: JSON.stringify({
 model: "google/gemini-2.5-pro",
 messages: [{ role: "system", content: systemPrompt }, ...messages],
 tools,
 stream: true,
 }),
 });

 if (!response.ok) {
 const status = response.status;
 if (status === 429) return new Response(JSON.stringify({ error: "تم تجاوز الحد المسموح، حاول لاحقاً" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
 if (status === 402) return new Response(JSON.stringify({ error: "يرجى إضافة رصيد" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
 throw new Error("AI gateway error");
 }

 const reader = response.body!.getReader;
 const decoder = new TextDecoder;
 let buffer = "";
 let fullContent = "";
 let toolCalls: any = ;
 let currentToolCall: any = null;

 while (true) {
 const { done, value } = await reader.read;
 if (done) break;
 buffer += decoder.decode(value, { stream: true });
 let idx: number;
 while ((idx = buffer.indexOf("\n")) !== -1) {
 let line = buffer.slice(0, idx);
 buffer = buffer.slice(idx + 1);
 if (line.endsWith("\r")) line = line.slice(0, -1);
 if (!line.startsWith("data: ")) continue;
 const jsonStr = line.slice(6).trim;
 if (jsonStr === "[DONE]") break;
 try {
 const parsed = JSON.parse(jsonStr);
 const delta = parsed.choices?.[0]?.delta;
 if (delta?.content) fullContent += delta.content;
 if (delta?.tool_calls) {
 for (const tc of delta.tool_calls) {
 if (tc.id) {
 currentToolCall = { id: tc.id, name: tc.function?.name || "", arguments: tc.function?.arguments || "" };
 toolCalls.push(currentToolCall);
 } else if (currentToolCall && tc.function?.arguments) {
 currentToolCall.arguments += tc.function.arguments;
 }
 }
 }
 } catch { /* partial */ }
 }
 }

 if (toolCalls.length > 0) {
 const toolResults: string = ;
 for (const tc of toolCalls) {
 try {
 const args = JSON.parse(tc.arguments);
 const result = await executeTool(tc.name, args);
 toolResults.push(result);
 } catch (e) {
 toolResults.push(`خطأ في تنفيذ الأمر: ${e}`);
 }
 }

 const followUpMessages = [
 { role: "system", content: systemPrompt },
 ...messages,
 { role: "assistant", content: fullContent || null, tool_calls: toolCalls.map(tc => ({ id: tc.id, type: "function", function: { name: tc.name, arguments: tc.arguments } })) },
 ...toolCalls.map((tc, i) => ({ role: "tool", tool_call_id: tc.id, content: toolResults[i] })),
 ];

 const finalResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
 method: "POST",
 headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
 body: JSON.stringify({ model: "google/gemini-2.5-pro", messages: followUpMessages, stream: true }),
 });

 if (!finalResp.ok) throw new Error("Follow-up AI error");
 return new Response(finalResp.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
 }

 const encoder = new TextEncoder;
 const sseData = `data: ${JSON.stringify({ choices: [{ delta: { content: fullContent } }] })}\n\ndata: [DONE]\n\n`;
 return new Response(encoder.encode(sseData), { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
 } catch (e) {
 console.error("AI chat error:", e);
 return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
 status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
 });
 }
});
