import { useState } from "react";
import { Helmet } from "react-helmet-async";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";

const SITE = "https://soutalbalad.lovable.app";

interface StaticPageProps {
 slug: string;
 title: string;
 description: string;
 children: React.ReactNode;
}

const StaticPage = ({ slug, title, description, children }: StaticPageProps) => {
 const url = `${SITE}/${slug}`;
 return (
 <div className="min-h-screen flex flex-col">
 <Helmet>
 <title>{`${title} | مصدري للأخبار المصرية والعالمية`}</title>
 <meta name="description" content={description} />
 <link rel="canonical" href={url} />
 <meta property="og:type" content="website" />
 <meta property="og:title" content={`${title} | صوت البلد`} />
 <meta property="og:description" content={description} />
 <meta property="og:url" content={url} />
 <meta name="twitter:card" content="summary_large_image" />
 <meta name="twitter:title" content={`${title} | صوت البلد`} />
 <meta name="twitter:description" content={description} />
 <script type="application/ld+json">{JSON.stringify({
 "@context": "https://schema.org",
 "@type": "WebPage",
 name: title,
 description,
 url,
 inLanguage: "ar",
 isPartOf: { "@type": "WebSite", name: "مصدري للأخبار المصرية والعالمية", url: SITE },
 })}</script>
 <script type="application/ld+json">{JSON.stringify({
 "@context": "https://schema.org",
 "@type": "BreadcrumbList",
 itemListElement: [
 { "@type": "ListItem", position: 1, name: "الرئيسية", item: `${SITE}/` },
 { "@type": "ListItem", position: 2, name: title, item: url },
 ],
 })}</script>
 </Helmet>
 <SiteHeader />
 <main className="container py-10 flex-1">
 <nav aria-label="مسار التصفح" className="text-sm mb-6 flex items-center gap-1 text-muted-foreground">
 <a href="/" className="hover:text-[hsl(var(--gold))]">الرئيسية</a>
 <ChevronLeft className="w-3.5 h-3.5 opacity-50" />
 <span className="text-foreground font-semibold">{title}</span>
 </nav>
 <article
 className="max-w-3xl mx-auto rounded-2xl p-8 border-2"
 style={{
 borderColor: "hsl(var(--gold)/0.35)",
 background: "linear-gradient(180deg, hsl(var(--card)), hsl(var(--background)))",
 boxShadow: "0 12px 40px -16px hsl(var(--gold)/0.25)",
 }}
 >
 <h1 className="newspaper-heading text-4xl mb-2 text-gold-shine" style={{ fontFamily: "'Amiri', serif" }}>{title}</h1>
 <p className="text-sm text-muted-foreground mb-8">{description}</p>
 <div className="prose prose-lg max-w-none rtl space-y-4 leading-relaxed text-foreground/90 [&_h2]:newspaper-heading [&_h2]:text-2xl [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-[hsl(var(--gold))] [&_ul]:list-disc [&_ul]:pr-6 [&_a]:text-[hsl(var(--gold))] [&_a]:underline">
 {children}
 </div>
 </article>
 </main>
 <SiteFooter />
 </div>
 );
};

export const AboutPage = => (
 <StaticPage slug="about" title="من نحن" description="مصدري للأخبار المصرية والعالمية — تعرّف على هويتنا وقيادتنا ورسالتنا.">
 <p><strong>مصدري للأخبار المصرية والعالمية</strong> هو الاسم الرسمي الذي يصلك من قلب الحدث، نقدّم لك الخبر المصري بصدق وسرعة ودقة، ونرافقك على مدار الساعة في السياسة والاقتصاد والرياضة والتكنولوجيا وكل ما يهم الشارع المصري.</p>
 <h2>قيادتنا</h2>
 <p>برئاسة <strong>البشمبرمج/ خالد عاطف عبدالحكيم</strong>.</p>
 <p>تطوير التقنيات والمسؤول عن الأنظمة: <strong>البشمبرمج والمطور التقني خالد عاطف عبدالحكيم عويس</strong>.</p>
 <h2>رسالتنا</h2>
 <p>«مصدري للأخبار المصرية والعالمية» — شعار نلتزم به: نسمع منك، ننقل عنك، ونوصل صوتك للمسؤول وللرأي العام.</p>
 <h2>قِيَمنا</h2>
 <ul>
 <li>المصداقية أولاً قبل السبق.</li>
 <li>اللغة الرسمية الراقية المحترمة للمتلقي.</li>
 <li>السرعة بلا تأخير، والدقة بلا تنازل.</li>
 <li>احترام خصوصية المستخدم وحماية بياناته.</li>
 </ul>
 </StaticPage>
);

const contactSchema = z.object({
 name: z.string.trim.min(2, "الاسم قصير جداً").max(80, "الاسم طويل جداً"),
 email: z.string.trim.email("بريد إلكتروني غير صالح").max(200),
 message: z.string.trim.min(10, "الرسالة قصيرة جداً").max(2000, "الرسالة طويلة جداً"),
});

const ContactForm = => {
 const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
 const [sent, setSent] = useState(false);
 const [loading, setLoading] = useState(false);

 const onSubmit = async (e: React.FormEvent) => {
 e.preventDefault;
 const parsed = contactSchema.safeParse(form);
 if (!parsed.success) {
 toast({ title: "خطأ في البيانات", description: parsed.error.issues[0].message, variant: "destructive" });
 return;
 }
 setLoading(true);
 try {
 const { supabase } = await import("@/integrations/supabase/client");
 const { error } = await supabase.from("messages").insert({
 name: parsed.data.name,
 email: parsed.data.email,
 subject: form.subject?.slice(0, 200) || null,
 message: parsed.data.message,
 source: "web",
 user_agent: navigator.userAgent.slice(0, 500),
 });
 if (error) {
 toast({ title: "تعذر إرسال الرسالة", description: error.message, variant: "destructive" });
 setLoading(false);
 return;
 }
 const body = `الاسم: ${parsed.data.name}\nالبريد: ${parsed.data.email}\n\n${parsed.data.message}`;
 const wa = `?text=${encodeURIComponent(body)}`;
 window.open(wa, "_blank", "noopener,noreferrer");
 setSent(true);
 } finally {
 setLoading(false);
 }
 };

 if (sent) {
 return (
 <div className="rounded-xl border-2 p-6 flex items-start gap-3" style={{ borderColor: "hsl(var(--gold)/0.4)" }}>
 <CheckCircle2 className="w-6 h-6 text-[hsl(var(--gold))] shrink-0 mt-0.5" />
 <div>
 <h3 className="font-bold text-lg mb-1">تم استلام رسالتك بنجاح</h3>
 <p className="text-sm text-muted-foreground m-0">سيتواصل معك فريق صوت البلد في أقرب وقت ممكن عبر القنوات الرسمية.</p>
 </div>
 </div>
 );
 }

 return (
 <form onSubmit={onSubmit} className="grid gap-4 not-prose">
 <div className="grid gap-1.5">
 <label htmlFor="c-name" className="text-sm font-semibold">الاسم الكامل</label>
 <input id="c-name" type="text" required maxLength={80} value={form.name}
 onChange={(e) => setForm({ ...form, name: e.target.value })}
 className="w-full rounded-lg border-2 px-3 py-2.5 bg-background focus:outline-none focus:border-[hsl(var(--gold))]"
 style={{ borderColor: "hsl(var(--gold)/0.3)" }} />
 </div>
 <div className="grid gap-1.5">
 <label htmlFor="c-email" className="text-sm font-semibold">البريد الإلكتروني</label>
 <input id="c-email" type="email" required maxLength={200} value={form.email} dir="ltr"
 onChange={(e) => setForm({ ...form, email: e.target.value })}
 placeholder="you@example.com"
 className="w-full rounded-lg border-2 px-3 py-2.5 bg-background focus:outline-none focus:border-[hsl(var(--gold))]"
 style={{ borderColor: "hsl(var(--gold)/0.3)" }} />
 </div>
 <div className="grid gap-1.5">
 <label htmlFor="c-subject" className="text-sm font-semibold">الموضوع (اختياري)</label>
 <input id="c-subject" type="text" maxLength={200} value={form.subject}
 onChange={(e) => setForm({ ...form, subject: e.target.value })}
 className="w-full rounded-lg border-2 px-3 py-2.5 bg-background focus:outline-none focus:border-[hsl(var(--gold))]"
 style={{ borderColor: "hsl(var(--gold)/0.3)" }} />
 </div>
 <div className="grid gap-1.5">
 <label htmlFor="c-msg" className="text-sm font-semibold">الرسالة</label>
 <textarea id="c-msg" required rows={6} maxLength={2000} value={form.message}
 onChange={(e) => setForm({ ...form, message: e.target.value })}
 className="w-full rounded-lg border-2 px-3 py-2.5 bg-background resize-y focus:outline-none focus:border-[hsl(var(--gold))]"
 style={{ borderColor: "hsl(var(--gold)/0.3)" }} />
 </div>
 <button type="submit" disabled={loading}
 className="rounded-lg px-5 py-2.5 font-bold text-[hsl(var(--royal-navy))] disabled:opacity-60"
 style={{ background: "hsl(var(--gold))" }}>
 {loading ? "جاري الإرسال..." : "إرسال الرسالة"}
 </button>
 <p className="text-xs text-muted-foreground m-0">سيتم توجيه رسالتك إلى فريق صوت البلد عبر القناة الرسمية. لن نشارك بريدك مع أي طرف ثالث.</p>
 </form>
 );
};

export const ContactPage = => (
 <StaticPage slug="contact" title="اتصل بنا" description="تواصل مع فريق صوت البلد عبر النموذج الرسمي أو الواتساب أو البريد الإلكتروني.">
 <p>يسعدنا تواصلك معنا في أي وقت. يمكنك استخدام النموذج التالي لإرسال رسالتك مباشرة، أو التواصل عبر القنوات الرسمية أسفل الصفحة.</p>
 <h2>نموذج التواصل المباشر</h2>
 <ContactForm />
 <h2>البريد الإلكتروني للدعم</h2>
 <p dir="ltr"><a href="mailto:support@soutalbalad.app">support@soutalbalad.app</a></p>
 <h2>الواتساب الرسمي</h2>
 <p><a href="" target="_blank" rel="noopener noreferrer" dir="ltr">+20 100 618 8795</a></p>
 <h2>قناة صوت البلد على واتساب</h2>
 <p><a href="https://whatsapp.com/channel/0029VbCnhMfJJhzc9msXWG0n" target="_blank" rel="noopener noreferrer">انضم للقناة الرسمية</a></p>
 <h2>للإعلانات والرعاية</h2>
 <p>للحجز والاستفسار عن الباقات الإعلانية، تواصل معنا مباشرة على رقم الواتساب الرسمي بالأعلى.</p>
 </StaticPage>
);

export const PrivacyPage = => (
 <StaticPage slug="privacy-policy" title="سياسة الخصوصية" description="سياسة خصوصية صوت البلد: جمع البيانات، الكوكيز، إعلانات Google AdSense، وحقوق المستخدم.">
 <p>آخر تحديث: 28 يونيو 2026</p>
 <p>نحرص في <strong>مصدري للأخبار المصرية والعالمية</strong> على حماية خصوصية زوارنا والتعامل مع بياناتهم بأعلى درجات الأمانة والشفافية. توضّح هذه السياسة طبيعة البيانات التي نجمعها وكيفية استخدامها وحقوقك تجاهها.</p>

 <h2>1. البيانات التي نجمعها</h2>
 <ul>
 <li>بيانات تصفّح أساسية: نوع المتصفح، نظام التشغيل، الصفحات المُزارة، ومدة الزيارة.</li>
 <li>عنوان IP بشكل مجهول الهوية لأغراض الأمان والإحصاءات.</li>
 <li>البريد الإلكتروني عند الاشتراك الاختياري في النشرة أو إرسال نموذج التواصل.</li>
 <li>اشتراك الإشعارات (Push Notifications) عند موافقتك الصريحة فقط.</li>
 </ul>

 <h2>2. ملفات تعريف الارتباط (Cookies)</h2>
 <p>نستخدم ملفات الكوكيز لتحسين تجربتك، حفظ تفضيلاتك (مثل الوضع الليلي)، وقياس أداء الموقع. يمكنك التحكم بها أو حذفها من إعدادات متصفحك في أي وقت.</p>

 <h2>3. خدمة Google AdSense والإعلانات</h2>
 <p>يستعين موقع صوت البلد بخدمة <strong>Google AdSense</strong> لعرض الإعلانات. تستخدم Google ومزوّدوها الخارجيون ملفات تعريف الارتباط لعرض إعلانات مبنية على زياراتك السابقة لهذا الموقع أو لمواقع أخرى على الإنترنت.</p>
 <ul>
 <li>تستخدم Google ملف الكوكيز DART لعرض الإعلانات حسب اهتمام المستخدم.</li>
 <li>يمكنك إيقاف استخدام كوكيز DART بزيارة <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">سياسة إعلانات Google</a>.</li>
 <li>يمكنك إدارة تفضيلات الإعلانات عبر <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">إعدادات إعلانات Google</a>.</li>
 </ul>

 <h2>4. المعلنون من الأطراف الثالثة</h2>
 <p>قد يستخدم المعلنون الخارجيون أو شبكات الإعلانات تقنيات مثل الكوكيز و JavaScript وإشارات الويب (Web Beacons) لقياس فعالية إعلاناتهم وتخصيص محتواها. لا يصل صوت البلد إلى هذه المعلومات ولا يتحكم بها، ويخضع استخدامها لسياسات الخصوصية الخاصة بهم.</p>

 <h2>5. كيفية استخدامنا للبيانات</h2>
 <ul>
 <li>تحسين تجربة القراءة وسرعة الموقع.</li>
 <li>إرسال إشعارات الأخبار العاجلة لمن يطلبها.</li>
 <li>إحصاءات مجمّعة لتطوير المحتوى والخدمات.</li>
 <li>الرد على رسائل النموذج والاستفسارات الرسمية.</li>
 </ul>

 <h2>6. مشاركة البيانات</h2>
 <p>لا نبيع بياناتك الشخصية ولا نشاركها مع أي طرف ثالث لأغراض تسويقية. قد نُفصح عنها فقط استجابةً لطلب قانوني رسمي من جهة مختصة.</p>

 <h2>7. حماية البيانات والأمان</h2>
 <p>نطبّق إجراءات تقنية وتنظيمية مناسبة لحماية بياناتك من الوصول غير المصرّح به أو التعديل أو الإفصاح. تُخزَّن البيانات على خوادم آمنة وتُنقل عبر اتصالات مشفّرة (HTTPS).</p>

 <h2>8. حقوقك (متوافق مع GDPR)</h2>
 <ul>
 <li>الحق في الوصول إلى بياناتك ومعرفة ما نحتفظ به عنك.</li>
 <li>الحق في تصحيح أو تحديث بياناتك.</li>
 <li>الحق في طلب حذف بياناتك بشكل نهائي.</li>
 <li>الحق في سحب الموافقة على الإشعارات أو النشرة في أي وقت.</li>
 <li>الحق في الاعتراض على معالجة بياناتك لأغراض الإعلانات المُخصّصة.</li>
 </ul>
 <p>لممارسة أي من هذه الحقوق، راسلنا على <a href="mailto:support@soutalbalad.app" dir="ltr">support@soutalbalad.app</a>.</p>

 <h2>9. خصوصية الأطفال</h2>
 <p>لا يستهدف موقع صوت البلد الأطفال دون سن 13 عاماً، ولا نجمع عن قصد أي بيانات شخصية منهم.</p>

 <h2>10. التحديثات على هذه السياسة</h2>
 <p>قد نقوم بتحديث سياسة الخصوصية من حين لآخر. ستُنشر أي تعديلات على هذه الصفحة مع تحديث تاريخ "آخر تحديث" بالأعلى.</p>

 <h2>11. التواصل</h2>
 <p>لأي استفسار يخص الخصوصية، تواصل معنا عبر <a href="/contact">صفحة الاتصال</a> أو على البريد <a href="mailto:support@soutalbalad.app" dir="ltr">support@soutalbalad.app</a>.</p>
 </StaticPage>
);

export const TermsPage = => (
 <StaticPage slug="terms" title="شروط الاستخدام" description="القواعد المنظِّمة لاستخدامك صوت البلد.">
 <p>باستخدامك مصدري للأخبار المصرية والعالمية فإنك توافق على الشروط التالية:</p>
 <h2>الملكية الفكرية</h2>
 <p>جميع الأخبار والصور والتصاميم والشعارات حقوقها محفوظة لصوت البلد. يُمنع إعادة النشر دون إذن رسمي مكتوب أو دون الإشارة الواضحة للمصدر.</p>
 <h2>استخدام المحتوى</h2>
 <ul>
 <li>الاستخدام الشخصي مسموح به مع ذكر المصدر.</li>
 <li>الاستخدام التجاري يتطلب اتفاق مُسبق.</li>
 <li>يُمنع تحريف الأخبار أو اقتطاعها بشكل مُضلل.</li>
 </ul>
 <h2>التعليقات والمشاركات</h2>
 <p>أنت مسؤول عن أي محتوى تشاركه. نحتفظ بحق حذف أي محتوى مسيء أو مخالف للقانون أو للذوق العام.</p>
 <h2>إخلاء المسؤولية</h2>
 <p>نبذل قصارى جهدنا لتقديم محتوى دقيق، ولكنّ صوت البلد غير مسؤول عن أي قرارات تُتّخذ بناءً على المحتوى المنشور.</p>
 </StaticPage>
);

export const CookiesPage = => (
 <StaticPage slug="cookies" title="سياسة ملفات تعريف الارتباط" description="كيف يستخدم صوت البلد ملفات الكوكيز لتحسين تجربتك.">
 <p>تستخدم صوت البلد ملفات تعريف الارتباط (Cookies) لتحسين تجربة المستخدم وتسريع التصفّح.</p>
 <h2>أنواع الكوكيز التي نستخدمها</h2>
 <ul>
 <li><strong>ضرورية:</strong> لتشغيل الموقع وحفظ تفضيلاتك (الوضع الليلي، اللغة).</li>
 <li><strong>أداء:</strong> لقياس سرعة الصفحات وتحسينها.</li>
 <li><strong>إحصائية:</strong> لمعرفة الأخبار الأكثر قراءة وتطوير المحتوى.</li>
 </ul>
 <h2>التحكم بالكوكيز</h2>
 <p>يمكنك في أي وقت حذف ملفات الكوكيز أو منعها من إعدادات متصفحك. قد يؤثر ذلك على بعض ميزات التصفّح.</p>
 <h2>كوكيز الأطراف الثالثة</h2>
 <p>قد تستخدم بعض خدمات التحليلات (مثل Google) ملفات كوكيز خاصة بها بشكل مجهول الهوية لقياس الزيارات.</p>
 </StaticPage>
);

export const EditorialPolicyPage = => (
 <StaticPage slug="editorial-policy" title="السياسة التحريرية" description="المبادئ والمعايير التي يلتزم بها صوت البلد في انتقاء الأخبار والتحقق منها ونشرها.">
 <p>يلتزم <strong>مصدري للأخبار المصرية والعالمية</strong> بأعلى معايير الصحافة المهنية في كل ما يُنشر على منصاته. تُحدد هذه السياسة المبادئ والإجراءات التي تحكم العملية التحريرية.</p>

 <h2>1. المبادئ الأساسية</h2>
 <ul>
 <li><strong>الدقة قبل السبق:</strong> لا يُنشر أي خبر قبل التحقق من مصادره الرسمية أو الموثوقة.</li>
 <li><strong>الاستقلالية التحريرية:</strong> القرارات التحريرية مستقلة تمامًا عن الجهات الإعلانية أو الممولة.</li>
 <li><strong>الموضوعية والحياد:</strong> الفصل الواضح بين الخبر والرأي، وعرض كل الأطراف بإنصاف.</li>
 <li><strong>احترام الكرامة الإنسانية:</strong> عدم نشر صور أو معلومات تنتهك خصوصية أو كرامة الأفراد.</li>
 <li><strong>الالتزام القانوني:</strong> احترام القوانين المصرية ومواثيق الشرف الصحفية.</li>
 </ul>

 <h2>2. مصادر الأخبار</h2>
 <p>نعتمد على مصادر متعددة ومتنوعة، تشمل: الوكالات الرسمية، الجهات الحكومية المختصة، المراسلين الميدانيين، وكالات الأنباء العالمية المعتمدة، ووسائل الإعلام الموثوقة. تُنسب كل المعلومات لمصدرها بشكل واضح ومباشر.</p>

 <h2>3. التحقق من الأخبار</h2>
 <ul>
 <li>كل خبر يمر بمرحلة تحقق من مصدرين مستقلين على الأقل قبل النشر.</li>
 <li>الصور والفيديوهات تخضع لفحص للتحقق من أصالتها وتاريخ التقاطها.</li>
 <li>الإحصائيات والأرقام تُراجَع مع الجهات المختصة قبل اعتمادها.</li>
 <li>لا نعتمد على الشائعات أو المصادر المجهولة دون تحقق مزدوج.</li>
 </ul>

 <h2>4. استخدام الذكاء الاصطناعي</h2>
 <p>نستعين بأدوات الذكاء الاصطناعي في إعادة الصياغة وتحسين العرض فقط، تحت إشراف بشري كامل. كل خبر مكتوب أو معاد صياغته بواسطة AI يخضع لمراجعة محرر مختص قبل النشر، ويُشار إلى ذلك بوضوح حين يقتضي الأمر.</p>

 <h2>5. التمييز بين الخبر والإعلان</h2>
 <p>المحتوى الإعلاني أو الترويجي يُميَّز بشكل واضح ومرئي بكلمة "إعلان" أو "محتوى مدفوع". لا يُسمح للمعلنين بالتأثير على المحتوى التحريري.</p>

 <h2>6. لغة النشر</h2>
 <p>نلتزم باللغة العربية الرسمية الراقية، ونتجنب الألفاظ المسيئة أو التحريضية أو الطائفية. يُحظر الترويج للعنف أو خطاب الكراهية أو التمييز.</p>

 <h2>7. حقوق الملكية الفكرية</h2>
 <p>نحترم حقوق الآخرين، ولا نعيد نشر محتوى محمي بحقوق نشر دون إذن أو إسناد واضح. للإبلاغ عن انتهاك، راسلنا على <a href="mailto:legal@soutalbalad.app" dir="ltr">legal@soutalbalad.app</a>.</p>

 <h2>8. التحديث والمراجعة</h2>
 <p>تُراجَع هذه السياسة دوريًا. أي تحديث جوهري يُعلَن عنه بوضوح على هذه الصفحة.</p>

 <h2>9. التواصل التحريري</h2>
 <p>للاستفسارات التحريرية أو الملاحظات المهنية: <a href="mailto:editor@soutalbalad.app" dir="ltr">editor@soutalbalad.app</a></p>
 </StaticPage>
);

export const CorrectionsPolicyPage = => (
 <StaticPage slug="corrections" title="سياسة التصحيحات" description="آلية صوت البلد في تصحيح الأخطاء وضمان دقة المحتوى المنشور.">
 <p>الدقة قيمة عُليا في <strong>مصدري للأخبار المصرية والعالمية</strong>. نتعامل مع أي خطأ بشفافية تامة وفقًا للسياسة التالية:</p>

 <h2>1. الإبلاغ عن خطأ</h2>
 <p>إذا اكتشفت خطأً في أي خبر أو معلومة منشورة، نرحب بإبلاغنا فورًا عبر:</p>
 <ul>
 <li>البريد المخصص للتصحيحات: <a href="mailto:corrections@soutalbalad.app" dir="ltr">corrections@soutalbalad.app</a></li>
 <li>أو عبر <a href="/contact">نموذج التواصل الرسمي</a> مع تحديد رابط الخبر ووصف الخطأ.</li>
 </ul>

 <h2>2. مدة الاستجابة</h2>
 <ul>
 <li>الأخطاء الجوهرية: تُراجَع وتُصحَّح خلال <strong>3 ساعات</strong> من الإبلاغ.</li>
 <li>الأخطاء الإملائية والصياغية: تُعالَج خلال <strong>24 ساعة</strong>.</li>
 <li>الأخطاء التي تمس سُمعة أشخاص أو جهات: أولوية قصوى وتصحيح فوري.</li>
 </ul>

 <h2>3. آلية التصحيح</h2>
 <ul>
 <li>يُحدَّث الخبر مع إضافة ملاحظة واضحة "<em>تم تحديث/تصحيح هذا الخبر بتاريخ كذا</em>" أسفل المقال.</li>
 <li>الأخطاء الجوهرية تُذكر بتفاصيلها في قسم "التصحيحات والتنويهات" بنهاية المقال.</li>
 <li>عند الضرورة، يُنشر تنويه مستقل وبيان رسمي على الصفحة الرئيسية.</li>
 </ul>

 <h2>4. سحب الأخبار</h2>
 <p>لا نسحب الأخبار المنشورة إلا في حالات نادرة جدًا (مثل الأخبار الكاذبة الكاملة أو الأوامر القضائية). في حال السحب، يحل محل الخبر بيان توضيحي يشرح السبب.</p>

 <h2>5. حق الرد</h2>
 <p>يحق لأي شخص أو جهة وردت في أحد أخبارنا الحصول على فرصة الرد. ترسل طلبات الرد على: <a href="mailto:reply@soutalbalad.app" dir="ltr">reply@soutalbalad.app</a> ويُنشر الرد بنفس مستوى البروز قدر الإمكان.</p>

 <h2>6. سجل التصحيحات</h2>
 <p>نحتفظ بسجل عام للتصحيحات الجوهرية للشفافية الكاملة مع جمهورنا.</p>

 <h2>7. التزامنا</h2>
 <p>نؤمن أن الاعتراف بالخطأ وتصحيحه علنًا هو جوهر الصحافة المهنية. نشكر كل من يساعدنا على البقاء دقيقين.</p>
 </StaticPage>
);

export const OwnershipPage = => (
 <StaticPage slug="ownership" title="الملكية والتمويل" description="ملكية صوت البلد، مصادر تمويله، وهيكله الإداري بشفافية كاملة.">
 <p>إيمانًا بمبدأ الشفافية الذي نطالب به الآخرين، نوضّح فيما يلي كل ما يتعلق بملكية وتمويل <strong>مصدري للأخبار المصرية والعالمية</strong>.</p>

 <h2>الملكية</h2>
 <p>صوت البلد منصة إعلامية رقمية مستقلة مملوكة بالكامل لمؤسسيها، ولا تتبع لأي حزب سياسي أو جهة حكومية أو كيان أجنبي.</p>

 <h2>القيادة</h2>
 <ul>
 <li><strong>الرئيس التنفيذي ورئيس التحرير:</strong> البشمبرمج/ خالد عاطف عبدالحكيم</li>
 <li><strong>المدير التقني والمطور الرئيسي:</strong> البشمبرمج خالد عاطف عبدالحكيم عويس</li>
 </ul>

 <h2>مصادر التمويل</h2>
 <ul>
 <li>إيرادات الإعلانات (Google AdSense والإعلانات المباشرة).</li>
 <li>الشراكات والرعايات المُعلَنة بشفافية في كل مقال راعٍ.</li>
 <li>التمويل الذاتي من المؤسسين.</li>
 </ul>
 <p>لا نتلقى أي تمويل من جهات حكومية أو سياسية أو أجنبية، ولا نقبل تبرعات مشروطة بمحتوى تحريري.</p>

 <h2>السياسة الإعلانية</h2>
 <p>الفصل التام بين الإعلانات والمحتوى التحريري. أي محتوى مدفوع يُميَّز بوضوح. نرفض إعلانات: التبغ، المقامرة غير الشرعية، المحتوى الإباحي، أو أي منتجات/خدمات احتيالية.</p>

 <h2>الموقع الرئيسي</h2>
 <p>جمهورية مصر العربية.</p>

 <h2>للتواصل المؤسسي</h2>
 <p>الإدارة العامة: <a href="mailto:management@soutalbalad.app" dir="ltr">management@soutalbalad.app</a></p>
 <p>الإعلانات والشراكات: <a href="" target="_blank" rel="noopener noreferrer" dir="ltr">+20 100 618 8795</a></p>
 </StaticPage>
);

export default StaticPage;

