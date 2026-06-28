import React, { useMemo } from "react";

/**
 * Smart Arabic news content renderer.
 *
 * Takes raw `content` (whatever format it was stored in — single block,
 * single newlines, or proper paragraphs) and turns it into a polished,
 * semantic article body:
 *
 * - Detects subheadings (short lines ending with ":") → <h2>
 * - Detects bullet/dash/number lists → <ul>/<ol>
 * - Detects pull-quotes («…» or "…" lines) → <blockquote>
 * - Splits long unbroken text into ~2-sentence paragraphs
 * - Drops sentinel CTA blocks (WhatsApp/phone footers) added by old fetchers
 *
 * Applied at render time, so old articles get the same polished layout
 * as new ones without any DB migration.
 */
type Block =
 | { kind: "h2"; text: string }
 | { kind: "p"; text: string }
 | { kind: "quote"; text: string }
 | { kind: "ul"; items: string }
 | { kind: "ol"; items: string };

const SENTENCE_SPLIT = /(?<=[\.\!\?؟\u06D4])\s+(?=[\u0600-\u06FFA-Za-z])/g;

function cleanRaw(raw: string): string {
 return raw
 .replace(/\r\n/g, "\n")
 .replace(/\n*-{2,}\n*[\s\S]*?(whatsapp\.com\/channel|wa\.me|للتواصل|قناة صوت البلد)[\s\S]*$/i, "")
 .replace(/(📲|📱|☎|📞)[^\n]*?(whatsapp\.com\/channel|wa\.me|\+?20[\s\d]+|01[\s\d]+)[^\n]*/gi, "")
 .replace(/\n{3,}/g, "\n\n")
 .trim;
}

function splitLongParagraph(text: string): string {
 if (text.length < 320) return [text];
 const sentences = text.split(SENTENCE_SPLIT).filter(Boolean);
 if (sentences.length < 3) return [text];
 const out: string = ;
 let buf: string = ;
 let len = 0;
 for (const s of sentences) {
 buf.push(s);
 len += s.length;
 if (len > 260 || buf.length >= 3) {
 out.push(buf.join(""));
 buf = ;
 len = 0;
 }
 }
 if (buf.length) out.push(buf.join(""));
 return out;
}

function classifyLine(line: string): "h2" | "quote" | "bullet" | "number" | "p" {
 const t = line.trim;
 if (!t) return "p";
 if (/^[•\-–—*]\s+/.test(t)) return "bullet";
 if (/^\d{1,2}[\.\)\-]\s+/.test(t)) return "number";
 if (/^[«"][^«"]{10,}[»"]\s*$/.test(t)) return "quote";
 // Short line ending with ":" or "؟" looking like a subheading
 if (t.length <= 90 && /[:：]$/.test(t)) return "h2";
 return "p";
}

function parse(raw: string): Block {
 const cleaned = cleanRaw(raw);
 if (!cleaned) return ;
 const paragraphs = cleaned.split(/\n{2,}/);
 const blocks: Block = ;

 for (const para of paragraphs) {
 const lines = para.split("\n").map((l) => l.trim).filter(Boolean);
 if (!lines.length) continue;

 // List detection: multiple lines all bullets/numbers
 const allBullets = lines.every((l) => classifyLine(l) === "bullet");
 const allNumbers = lines.every((l) => classifyLine(l) === "number");
 if (lines.length > 1 && allBullets) {
 blocks.push({ kind: "ul", items: lines.map((l) => l.replace(/^[•\-–—*]\s+/, "")) });
 continue;
 }
 if (lines.length > 1 && allNumbers) {
 blocks.push({ kind: "ol", items: lines.map((l) => l.replace(/^\d{1,2}[\.\)\-]\s+/, "")) });
 continue;
 }

 for (const line of lines) {
 const kind = classifyLine(line);
 if (kind === "h2") {
 blocks.push({ kind: "h2", text: line.replace(/[:：]\s*$/, "") });
 } else if (kind === "quote") {
 blocks.push({ kind: "quote", text: line.replace(/^[«"]|[»"]$/g, "").trim });
 } else if (kind === "bullet") {
 blocks.push({ kind: "ul", items: [line.replace(/^[•\-–—*]\s+/, "")] });
 } else if (kind === "number") {
 blocks.push({ kind: "ol", items: [line.replace(/^\d{1,2}[\.\)\-]\s+/, "")] });
 } else {
 for (const chunk of splitLongParagraph(line)) {
 blocks.push({ kind: "p", text: chunk });
 }
 }
 }
 }
 return blocks;
}

export interface ArticleBodyProps {
 content: string;
 fontSize?: number;
 /** Optional split point — renders blocks before this index, then `between`, then the rest. */
 splitAt?: number;
 between?: React.ReactNode;
 className?: string;
}

export function ArticleBody({
 content,
 fontSize = 19,
 splitAt,
 between,
 className,
}: ArticleBodyProps) {
 const blocks = useMemo( => parse(content || ""), [content]);
 if (!blocks.length) return null;

 const splitIndex =
 typeof splitAt === "number" && between
 ? Math.max(1, Math.min(blocks.length - 1, splitAt))
 : -1;

 const renderBlock = (b: Block, i: number) => {
 switch (b.kind) {
 case "h2":
 return (
 <h2
 key={i}
 className="font-amiri font-black text-foreground mt-10 mb-4 leading-tight border-r-4 pr-4 py-1"
 style={{
 borderColor: "hsl(var(--gold))",
 fontSize: `clamp(1.35rem, 2.2vw, 1.7rem)`,
 }}
 >
 {b.text}
 </h2>
 );
 case "quote":
 return (
 <blockquote
 key={i}
 className="my-7 mx-0 p-5 rounded-2xl bg-gradient-to-l from-[hsl(var(--gold)/0.08)] to-transparent border-r-4 font-amiri text-foreground/90"
 style={{
 borderColor: "hsl(var(--gold))",
 fontSize: `clamp(1.1rem, 1.7vw, 1.4rem)`,
 lineHeight: 1.9,
 }}
 >
 <span className="text-[hsl(var(--gold))] text-3xl leading-none ml-1 align-top">«</span>
 {b.text}
 <span className="text-[hsl(var(--gold))] text-3xl leading-none mr-1 align-top">»</span>
 </blockquote>
 );
 case "ul":
 return (
 <ul key={i} className="my-5 space-y-2 pr-6 list-none">
 {b.items.map((it, j) => (
 <li
 key={j}
 className="relative pr-5 text-foreground/90 font-cairo before:content-['◆'] before:absolute before:right-0 before:top-1.5 before:text-[hsl(var(--gold))] before:text-sm"
 style={{ fontSize: `${fontSize - 1}px`, lineHeight: 1.9 }}
 >
 {it}
 </li>
 ))}
 </ul>
 );
 case "ol":
 return (
 <ol key={i} className="my-5 space-y-2 pr-8 list-decimal marker:text-[hsl(var(--gold))] marker:font-black">
 {b.items.map((it, j) => (
 <li
 key={j}
 className="text-foreground/90 font-cairo pr-2"
 style={{ fontSize: `${fontSize - 1}px`, lineHeight: 1.9 }}
 >
 {it}
 </li>
 ))}
 </ol>
 );
 case "p":
 default:
 return (
 <p
 key={i}
 className="font-cairo text-foreground/90 mb-5 text-right sm:text-justify"
 style={{
 fontSize: `${fontSize}px`,
 lineHeight: 1.95,
 letterSpacing: "0.005em",
 wordSpacing: "0.03em",
 hyphens: "auto",
 }}
 >
 {b.text}
 </p>
 );
 }
 };

 if (splitIndex < 0) {
 return (
 <div className={className} style={{ maxWidth: "72ch" }}>
 {blocks.map(renderBlock)}
 </div>
 );
 }
 return (
 <div className={className} style={{ maxWidth: "72ch" }}>
 {blocks.slice(0, splitIndex).map(renderBlock)}
 {between}
 {blocks.slice(splitIndex).map((b, i) => renderBlock(b, i + splitIndex))}
 </div>
 );
}
