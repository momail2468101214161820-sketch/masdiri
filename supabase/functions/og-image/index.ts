// Dynamic Open Graph image generator — 1200x630 PNG per article.
// URL: /functions/v1/og-image?id=<short_id|uuid>&v=<cache-buster>
//
// Works for any platform that fetches og:image server-side (Google, X,
// LinkedIn, Discord, Slack, Telegram, iMessage, Signal preview servers).
// WhatsApp / Facebook also fetch this URL — but only after the page itself
// exposes the per-article <meta og:image> in the initial HTML, which on a
// pure SPA requires SSR/prerender at the edge (Cloudflare Worker on a custom
// domain). The image endpoint itself is already ready for that day — no
// changes will be needed here once a prerender layer is in front.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import satori from "https://esm.sh/satori@0.10.13";
import { Resvg, initWasm } from "https://esm.sh/@resvg/resvg-wasm@2.6.2";

// ─── one-time WASM + font init, cached across invocations ────────────────────
let wasmReady: Promise<void> | null = null;
function ensureWasm() {
  if (!wasmReady) {
    wasmReady = (async () => {
      const res = await fetch(
        "https://esm.sh/@resvg/resvg-wasm@2.6.2/index_bg.wasm",
      );
      await initWasm(await res.arrayBuffer());
    })();
  }
  return wasmReady;
}

let fontBoldCache: ArrayBuffer | null = null;
let fontRegularCache: ArrayBuffer | null = null;
async function getFonts() {
  if (fontBoldCache && fontRegularCache) {
    return { bold: fontBoldCache!, regular: fontRegularCache! };
  }
  // Resolve current TTF URLs from Google Fonts (version-proof).
  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=Cairo:wght@400;900&subset=arabic",
    { headers: { "User-Agent": "Mozilla/5.0" } },
  ).then((r) => r.text());
  const matches = [...css.matchAll(/url\((https:\/\/[^)]+\.ttf)\)/g)].map((m) => m[1]);
  // Order in CSS: 400 then 900.
  const [regUrl, boldUrl] = matches;
  const [regBuf, boldBuf] = await Promise.all([
    fetch(regUrl).then((r) => r.arrayBuffer()),
    fetch(boldUrl).then((r) => r.arrayBuffer()),
  ]);
  fontRegularCache = regBuf;
  fontBoldCache = boldBuf;
  return { bold: fontBoldCache!, regular: fontRegularCache! };
}

async function imgToDataUrl(url: string): Promise<string | null> {
  try {
    const abs = url.startsWith("//") ? `https:${url}` : url;
    // Always normalize via weserv into a fixed 1200x630 JPEG so satori
    // gets predictable dimensions and a format it can decode reliably.
    const fetchUrl = `https://images.weserv.nl/?url=${
      encodeURIComponent(abs.replace(/^https?:\/\//, ""))
    }&w=1200&h=630&fit=cover&output=jpg&q=82`;
    const res = await fetch(fetchUrl, { redirect: "follow" });
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    let bin = "";
    const chunk = 0x8000;
    for (let i = 0; i < buf.length; i += chunk) {
      bin += String.fromCharCode.apply(
        null,
        buf.subarray(i, i + chunk) as unknown as number[],
      );
    }
    return `data:image/jpeg;base64,${btoa(bin)}`;
  } catch {
    return null;
  }
}

const truncate = (s: string, n: number) =>
  s.length > n ? s.slice(0, n - 1) + "…" : s;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return new Response("missing id", { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const isNumeric = /^\d+$/.test(id);
    const base = supabase
      .from("articles")
      .select("title, summary, image_url, images, is_breaking, categories(name)");
    const { data: article } = await (isNumeric
      ? base.eq("short_id", Number(id))
      : base.eq("id", id)
    ).maybeSingle();

    if (!article) {
      return new Response("not found", { status: 404, headers: corsHeaders });
    }

    // Resolve a primary image URL.
    let imgUrl: string | null = (article as any).image_url ?? null;
    const images = (article as any).images;
    if (!imgUrl && Array.isArray(images) && images.length) {
      imgUrl = typeof images[0] === "string" ? images[0] : images[0]?.url ?? null;
    }

    const [imgData, fonts] = await Promise.all([
      imgUrl ? imgToDataUrl(imgUrl) : Promise.resolve(null),
      getFonts(),
    ]);
    await ensureWasm();

    const title = truncate(String((article as any).title ?? ""), 140);
    const categoryName = (article as any).categories?.name as string | undefined;
    const isBreaking = !!(article as any).is_breaking;

    const tree: any = {
      type: "div",
      props: {
        style: {
          width: 1200,
          height: 630,
          display: "flex",
          position: "relative",
          fontFamily: "Cairo",
          background: "#07152f",
          color: "#ffffff",
        },
        children: [
          // Background image as a full-cover img element
          imgData
            ? {
              type: "img",
              props: {
                src: imgData,
                width: 1200,
                height: 630,
                style: {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: 1200,
                  height: 630,
                  objectFit: "cover",
                },
              },
            }
            : null,
          // Dark gradient overlay so text stays readable
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                top: 0,
                left: 0,
                width: 1200,
                height: 630,
                background: "rgba(7,21,47,0.65)",
                display: "flex",
              },
            },
          },
          // Gold left border accent
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                top: 0,
                left: 0,
                width: 8,
                height: 630,
                background: "#f5c84b",
                display: "flex",
              },
            },
          },
          // Top-right brand
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                top: 28,
                right: 36,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      color: "#f7d36b",
                      fontSize: 32,
                      fontWeight: 900,
                      display: "flex",
                    },
                    children: "صوت البلد",
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      color: "rgba(255,255,255,0.88)",
                      fontSize: 18,
                      fontWeight: 400,
                      marginTop: 4,
                      display: "flex",
                    },
                    children: "صوتك واصل",
                  },
                },
              ],
            },
          },
          // Top-left badge (breaking / category)
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                top: 32,
                left: 32,
                padding: "10px 22px",
                background: isBreaking ? "#dc2626" : "#f5c84b",
                color: isBreaking ? "#ffffff" : "#07152f",
                fontSize: 22,
                fontWeight: 900,
                borderRadius: 8,
                display: "flex",
              },
              children: isBreaking ? "عاجل" : (categoryName || "خبر"),
            },
          },
          // Gold underline above title
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                right: 40,
                bottom: 290,
                width: 160,
                height: 6,
                background: "#f5c84b",
                display: "flex",
              },
            },
          },
          // Title
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                right: 40,
                left: 40,
                bottom: 150,
                color: "#ffffff",
                fontSize: title.length > 80 ? 44 : 54,
                fontWeight: 900,
                lineHeight: 1.35,
                textAlign: "right",
                display: "flex",
                
              },
              children: title,
            },
          },
          // Credits — Presidency
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                right: 40,
                bottom: 86,
                color: "#f7d36b",
                fontSize: 24,
                fontWeight: 900,
                display: "flex",
              },
              children: "برئاسة د/ محمد الحاجري",
            },
          },
          // Credits — Developer
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                right: 40,
                bottom: 44,
                color: "rgba(255,255,255,0.85)",
                fontSize: 17,
                fontWeight: 400,
                display: "flex",
              },
              children:
                "تطوير وتصميم: المطور التقني / البشمبرمج خالد عاطف عبدالحكيم عويس",
            },
          },
          // Domain bottom-left
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                left: 40,
                bottom: 44,
                color: "#f7d36b",
                fontSize: 22,
                fontWeight: 900,
                display: "flex",
              },
              children: "soutalbalad.lovable.app",
            },
          },
        ].filter(Boolean),
      },
    };

    const svg = await satori(tree, {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Cairo", data: fonts.regular, weight: 400, style: "normal" },
        { name: "Cairo", data: fonts.bold, weight: 900, style: "normal" },
      ],
    });

    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
    const png = resvg.render().asPng();

    return new Response(png, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
      },
    });
  } catch (err) {
    console.error("og-image error:", err);
    return new Response(`og-image error: ${(err as Error).message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
