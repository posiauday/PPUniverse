---
name: linkedin-post
description: Draft a LinkedIn post for LowCodeStacks (text plus an on-brand image or carousel) in the Daylight design system. Use when the product owner asks for a LinkedIn post, social post or carousel about a guide, an update, a release or a Power Platform tip.
---
# LinkedIn post (LowCodeStacks, Daylight)

You draft; the product owner posts. Never post, schedule or connect to LinkedIn yourself.

## 1. Before writing
- **Get one source.** Every post points to one source: a published guide (`/learn/<slug>`), an update (`/updates#<slug>`), a hub, or a release. Read it first.
- **Verify every platform fact** against Microsoft Learn (use the Microsoft Learn tools) on the day you draft. This covers dates, limits, licensing, names and deprecations. Put the check date in your reply. If you can't verify a claim, cut it.
- **Know the brand rules:**
  - Never imply Microsoft endorsement. Never use Microsoft product logos or icons; use our own shapes and the X2 mark only.
  - Product names are plain text: "Power Apps", "Power BI", "Copilot Studio" and so on.
  - Use no Government of Saskatchewan names, data or screenshots.
  - Never copy competitor text or visuals.

## 2. The post text
- **Hook:** the first two lines stand alone, because LinkedIn cuts the rest behind "…more". State the problem or the surprising fact in plain words. No "🚀 Big news!" and no clickbait.
- **Body:** 3 to 6 short lines or a numbered list. One idea per line. Say what changed and what to do, in our own words.
- **Link:** one link to lowcodestacks.com, at the end of the post. Note in your reply that the product owner may prefer to put it in the first comment.
- **Hashtags:** 3 to 5, specific: `#PowerPlatform` `#PowerApps` `#PowerAutomate` `#PowerBI` `#CopilotStudio` `#Dataverse` `#PowerPages`. Use only ones that match the post.
- **Voice:** plain, practical, a little warm. Short sentences. No jargon without a gloss. At most two emoji, and none in the hook.
- **Length:** aim for 600 to 1,300 characters.

## 3. The image (Daylight)
Use `template.html` in this folder. It loads the site's own fonts from `apps/web/assets/fonts/`. Copy it to `marketing/linkedin/<YYYY-MM-DD>-<slug>/` in the scratchpad, fill it in, and render it with `render.mjs`, described below.

### Sizes
- **Single image:** 1080 × 1350 (portrait; takes the most feed space).
- **Square:** 1080 × 1080, when the product owner asks for it.
- **Carousel:** several 1080 × 1350 slides, exported as one PDF. Use 5 to 8 slides: a cover, one idea per slide, and a closing slide with the URL.

### Layout rules
These match the site's design system (`apps/web/app/globals.css`, "Daylight").
- **Page:** paper `#FBF8F3` background, ink `#14141A` text.
- **Hero panel:** one big rounded panel (radius 56 px at 1080 wide) in the technology's **tint**. Its small text uses that technology's **ink**:

  | Area | Tint | Ink |
  |---|---|---|
  | Power Apps | `#EDE4FF` | `#5B21B6` |
  | Power Automate | `#DCEBFF` | `#1E40AF` |
  | Power BI | `#FFF0C2` | `#92400E` |
  | Copilot Studio | `#D3F6EC` | `#115E59` |
  | Dataverse | `#D9F7E3` | `#065F46` |
  | Power Pages | `#FFDDEC` | `#9D174D` |
  | Governance & admin | `#E2E8F0` | `#334155` |
  | General / Guides | lime `#D9F99D` | ink `#14141A` |
  | Updates | `#FFF0C2` | `#92400E` |

- **Type:**
  - eyebrow in **Geist Mono**, uppercase, wide tracking, small;
  - headline in **Bricolage Grotesque**, weight 800, very large, tight leading, sentence case;
  - one accent phrase in **Instrument Serif** italic, in the tech ink colour;
  - body in **Geist**, 30 to 36 px.
- **Accents:** a lime `#A3E635` pill for "New", and black ink pill buttons with white text (decorative on an image). Decorative shapes are optional: a violet sphere, a coral pill or a lime pill. Use at most two, and never over text.
- **Mark:** the X2 "Code stack" mark plus the word "LowCodeStacks" in the top-left corner, and `lowcodestacks.com` at the bottom.
- **Contrast:** at least 4.5:1 for all text. Every pair in the table above already passes. Don't put ink-coloured text on a different tint.
- **Words:** no more than about 25 on a single image. The image carries the hook; the text carries the detail.
- **Trademarks:** if the image names Microsoft products, add a small footer line: "Independent site. Not affiliated with or endorsed by Microsoft."

## 4. Render
From the repo root (needs `pnpm install`; uses the Playwright that `packages/e2e` already has):
```
node .claude/skills/linkedin-post/render.mjs <path/to/post.html> [--square] [--pdf]
```
- **Default:** writes `post.png` at 1080 × 1350 next to the HTML.
- **`--pdf`:** writes a one-page-per-slide `carousel.pdf`. Each slide is a `<section class="slide">`.
- **Chromium:** set `CHROME=<path>` if Playwright's own Chromium isn't installed. In the cloud container that's `/opt/pw-browsers/chromium-*/chrome-linux/chrome`.

Then look at the PNG yourself. Check that nothing overflows, every word is readable and the hierarchy is clear. Fix and re-render before showing it.

## 5. Hand over
Reply with:
1. the post text, ready to paste;
2. the image path or paths, sent with SendUserFile;
3. the facts you verified, with the Microsoft Learn links and the check date;
4. one alternative hook.

Don't post it yourself and don't add tracking parameters, unless the product owner asks.
