// Renders a LinkedIn post HTML (see SKILL.md) to post.png (1080x1350, or
// 1080x1080 with --square) or, with --pdf, every <section class="slide"> to
// carousel.pdf. Uses the Playwright that packages/e2e already installs.
//   node .claude/skills/linkedin-post/render.mjs <post.html> [--square] [--pdf]
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(resolve("packages/e2e/package.json"));
const { chromium } = require("@playwright/test");

const [file, ...flags] = process.argv.slice(2);
if (!file) throw new Error("Usage: node render.mjs <post.html> [--square] [--pdf]");
const square = flags.includes("--square");
const pdf = flags.includes("--pdf");
const width = 1080;
const height = square ? 1080 : 1350;

const browser = await chromium.launch(
  process.env.CHROME ? { executablePath: process.env.CHROME } : {},
);
const page = await browser.newPage({ viewport: { width, height } });
await page.goto(pathToFileURL(resolve(file)).href, { waitUntil: "networkidle" });
// The site's own fonts, by absolute path, so a copied template renders
// wherever it lives (the template's relative URLs work only in place).
const fontDir = pathToFileURL(resolve("apps/web/assets/fonts")).href;
await page.addStyleTag({
  content: [
    ["Bricolage Grotesque", "bricolage-grotesque-latin", "normal", "200 800"],
    ["Instrument Serif", "instrument-serif-italic-latin", "italic", "400"],
    ["Geist", "geist-latin", "normal", "100 900"],
    ["Geist Mono", "geist-mono-latin", "normal", "100 900"],
  ]
    .map(
      ([family, file, style, weight]) =>
        `@font-face{font-family:"${family}";src:url("${fontDir}/${file}.woff2") format("woff2");font-style:${style};font-weight:${weight}}`,
    )
    .join(""),
});
await page.evaluate(() => document.fonts.ready);
if (square) await page.addStyleTag({ content: ".slide{height:1080px}" });
const out = dirname(resolve(file));
if (pdf) {
  await page.addStyleTag({ content: "@page{size:1080px " + height + "px;margin:0}.slide{break-after:page}" });
  await page.pdf({ path: `${out}/carousel.pdf`, width: `${width}px`, height: `${height}px`, printBackground: true });
  console.log(`${out}/carousel.pdf`);
} else {
  await page.locator(".slide").first().screenshot({ path: `${out}/post.png` });
  console.log(`${out}/post.png`);
}
await browser.close();
