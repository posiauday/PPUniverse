/**
 * The About, Privacy and Terms pages (MVP-032; docs/final-decisions.md,
 * "About, Privacy and Terms pages", 2026-10-02). Written by the agent at the
 * product owner's direct instruction, from an inventory of what the code
 * actually does on that date: the data it stores, the cookies it sets, what
 * it logs and which services it uses. When any of those change, these pages
 * change in the same pull request, with a new date. No statement here is a
 * compliance claim.
 *
 * Markdown, rendered by the article renderer (no raw HTML), so the pages get
 * the same type, headings and contents list as a guide.
 */

export const OPERATOR_NAME = "Uday Posia";
export const CONTACT_EMAIL = "contact@lowcodestacks.com";

/** The date the Terms took effect. Also the PolicyVersion `version` recorded
 * when someone accepts the Terms (migration
 * 20261002000000_add_policy_versions_2026_10_02). */
export const POLICY_EFFECTIVE_DATE = "2026-10-02";
export const POLICY_EFFECTIVE_LABEL = "October 2, 2026";

/** The date the current Privacy notice took effect: it changed when the
 * Updates badge shipped (MVP-033 slice D), which keeps a date in the
 * visitor's browser. Its PolicyVersion row is migration
 * 20261003000300_add_privacy_policy_version_2026_10_03. */
export const PRIVACY_EFFECTIVE_DATE = "2026-10-03";
export const PRIVACY_EFFECTIVE_LABEL = "October 3, 2026";

export interface InfoPage {
  path: "/about" | "/privacy" | "/terms";
  title: string;
  /** The serif accent part of the heading. */
  accent: string;
  eyebrow: string;
  description: string;
  markdown: string;
}

const contact = `[${CONTACT_EMAIL}](mailto:${CONTACT_EMAIL})`;

export const ABOUT_PAGE: InfoPage = {
  path: "/about",
  title: "About LowCodeStacks",
  accent: "who's behind it",
  eyebrow: "About",
  description:
    "LowCodeStacks is an independent site of free Power Platform guides, run by Uday Posia in Saskatchewan, Canada. Here's what it covers and how guides are written.",
  markdown: `LowCodeStacks is an independent site of free, practical guides for Microsoft Power Platform: Power Apps, Power Automate, Power BI, Copilot Studio, Dataverse and Power Pages. It is run by ${OPERATOR_NAME}, in Saskatchewan, Canada.

## Why it exists

Low-code apps are quick to build and easy to get subtly wrong. A gallery that stops at 500 rows, a total that doesn't add up, an approval that waits forever: these are the problems people actually hit, and the fixes are scattered across documentation, forums and videos.

LowCodeStacks puts each fix in one place, written so you can apply it today.

## How guides are written

Every guide follows the same shape:

- **The symptom** you actually see, so you can recognise your problem.
- **The fix**, as code or steps you can use, next to the version that breaks.
- **The why**, with links to the official Microsoft documentation the guide relies on, so you can check it yourself.

Guides are dated, and are corrected when a product changes. If you spot something wrong or out of date, please email ${contact}.

## What it covers

- **Tutorials** that fix a problem in front of you.
- **Comparisons** that help you pick the right tool before you build.
- **Patterns** for structures that hold up as an app grows.
- **KPI guides** for measuring whether a solution is working.

Reusable components and templates will follow, each with its own licence and compatibility notes.

## Independent

LowCodeStacks isn't affiliated with, endorsed by or certified by Microsoft. Microsoft, Power Apps, Power Automate, Power BI, Copilot Studio, Dataverse and Power Pages are trademarks of the Microsoft group of companies.

## Contact

Questions, corrections or ideas for a guide: ${contact}.
`,
};

export const PRIVACY_PAGE: InfoPage = {
  path: "/privacy",
  title: "Privacy notice",
  accent: "in plain words",
  eyebrow: `Privacy · Effective ${PRIVACY_EFFECTIVE_LABEL}`,
  description:
    "What LowCodeStacks collects, why, who processes it, and how to see, correct or delete your information. No ads, no analytics, no tracking cookies.",
  markdown: `This notice explains what personal information LowCodeStacks collects, why, and what you can do about it. It applies to lowcodestacks.com.

LowCodeStacks is run by ${OPERATOR_NAME}, in Saskatchewan, Canada, who is responsible for the personal information described here. For anything about your privacy, email ${contact}.

## The short version

- You can read every guide without an account. We don't run ads, analytics or tracking cookies.
- If you sign in, we store your email address and what's needed to keep you signed in.
- We never sell your information.
- You can ask to see, correct or delete it at any time.

## When you browse

**No tracking.** The site has no advertising, no analytics service, no tracking pixels and no third-party scripts. Our fonts are served from our own site, so your browser doesn't contact a font service.

**Server logs.** To keep the site working and secure, our application records each request: the page or address requested, the result, and how long it took. It doesn't record your IP address or email address. When you search the site, the words you type are recorded too, so we can see what people look for.

**Our hosting provider** may also keep standard request logs, which can include IP addresses and browser details, as part of running the service.

## When you sign in

Signing in is by a link sent to your email; there's no password. When you sign in, we store:

- **Your email address**, and when you confirmed it.
- **Your sign-in sessions:** when each started and when it expires (after 30 days). You can see and end them on your account page. Sign-in links expire after 24 hours.
- **Your choices:** whether you accepted the Terms, and whether you agreed to receive optional emails, each with the date.
- **A record of emails we sent you:** the type of email and whether it was sent. Not the address or the content.
- **Deletion requests**, if you make one, and what happened to them.
- **Free components you claim**, once they're available: which ones you have access to, and when you downloaded them.

## Emails

We send email only when you ask for it: a sign-in link, or confirmation of a request you made. We don't currently send newsletters or marketing email. If we ever do, it will be only to people who opt in, every message will have an unsubscribe link, and you can switch it off on your account page at any time.

## Cookies

We use only the cookies the site needs:

- **Sign-in cookies** keep you signed in and protect sign-in forms. They are set only when you use the sign-in page or are signed in, and the session cookie lasts up to 30 days.
- **\`lcs-theme\`** remembers light or dark mode, and is set only if you choose one. It lasts a year.

There are no advertising, analytics or tracking cookies.

## Stored in your browser

- **\`lcs-updates-last-visit\`** remembers when you last opened the Updates page, so the Updates badge can count what's new since then. It's kept in your browser's local storage only and is never sent to us. Clearing your browser's site data removes it.

## Why we use your information

- To sign you in and keep your account secure.
- To send the emails you ask for.
- To keep the site running, fix problems and protect it from abuse.
- To understand which topics people look for, from search terms that aren't linked to you.

We don't use your information for anything else without asking you first.

## Who processes it for us

We use a few service providers to run the site. They process information only to provide their service to us:

- **Netlify** hosts the website.
- **Supabase** hosts the database that stores account information.
- **Resend** delivers the emails you ask for.

These providers may store or process information outside Canada, including in the United States. While it's there, it can be accessed by courts, law enforcement and national security authorities of that country under its laws.

We don't sell, rent or trade personal information. We would disclose it only if required by law.

## How long we keep it

- Account information is kept while your account exists.
- Sign-in sessions expire after 30 days, and sign-in links after 24 hours.
- Records of your choices and of deletion requests are kept as proof of what you asked for, even after the rest of your account information is removed.
- Logs are kept only as long as needed to run and protect the site.

## Your choices and rights

You can ask to **see** the personal information we hold about you, to **correct** it, or to **delete** your account. Email ${contact} from the address on your account, or use the deletion request on your account page. We'll reply within 30 days. If we need longer, we'll tell you why within those 30 days.

You can withdraw consent to optional emails at any time on your account page.

If you're not satisfied with how we handle a privacy concern, please tell us first. You can also complain to the [Office of the Privacy Commissioner of Canada](https://www.priv.gc.ca/).

## How we protect it

The site is served only over HTTPS. Sign-in links are single-use and expire. Account pages are visible only to you, and administrative actions are limited to the site's operator.

## Children

LowCodeStacks is written for people who build business software, and isn't directed at children.

## Changes to this notice

When this notice changes, we'll update it here and change its effective date. If a change affects how we use information you've already given us, we'll ask you first.

This notice took effect on ${PRIVACY_EFFECTIVE_LABEL}.
`,
};

export const TERMS_PAGE: InfoPage = {
  path: "/terms",
  title: "Terms of use",
  accent: "the fair rules",
  eyebrow: `Terms · Effective ${POLICY_EFFECTIVE_LABEL}`,
  description:
    "The terms for using LowCodeStacks: how you may use the guides and code samples (code is MIT-licensed), accounts, disclaimers and governing law.",
  markdown: `These terms apply when you use lowcodestacks.com. By using the site you agree to them. LowCodeStacks is run by ${OPERATOR_NAME} ("we", "us"), in Saskatchewan, Canada. Questions: ${contact}.

## Using the site

You're welcome to read, bookmark and share everything here. Please don't:

- try to break into, overload or disrupt the site, or get around its security;
- use automated tools to copy the site in bulk;
- use the site for anything unlawful.

## Your account

You don't need an account to read the guides. If you create one, it's tied to your email address, and you sign in with links sent there. Keep access to that email secure, because anyone who can read it can sign in as you. You can end your sessions or ask for your account to be deleted at any time.

We may suspend an account that's being used to harm the site or other people.

## What you can reuse

**Code samples are free to use.** You may copy, change and use the code in our guides in your own projects, including commercial ones, under the [MIT License](#mit-license) below. You don't need to ask.

**Text and images are ours.** The writing, diagrams and images on LowCodeStacks are © ${OPERATOR_NAME} (LowCodeStacks). You may quote short excerpts with a link back to the page. Please don't republish whole guides or large parts of them.

**Components and templates**, when available, each come with their own licence, shown on their page. That licence is what applies to them.

## MIT License

The code samples published on lowcodestacks.com are made available under the MIT License:

> Copyright (c) ${POLICY_EFFECTIVE_DATE.slice(0, 4)} ${OPERATOR_NAME} (LowCodeStacks)
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Guides are general information

Guides are written carefully and link to the official documentation they rely on, but they're general information, not professional advice for your situation. Microsoft products change often, and what works in one environment may not in another.

Test anything you use in a safe environment before relying on it, and keep backups. You're responsible for how you apply what you read here.

## No warranty

The site and everything on it are provided "as is", without warranties of any kind, to the extent the law allows.

## Limitation of liability

To the extent the law allows, we aren't liable for any indirect or consequential loss, or for loss of data, profits or business, arising from your use of the site or its content. Nothing in these terms limits any liability that can't be limited by law.

## Trademarks and independence

LowCodeStacks isn't affiliated with, endorsed by or certified by Microsoft. Microsoft, Power Apps, Power Automate, Power BI, Copilot Studio, Dataverse and Power Pages are trademarks of the Microsoft group of companies, used here only to name the products the guides are about.

## Links to other sites

Guides link to other sites, such as Microsoft's documentation. We don't control them and aren't responsible for their content.

## Privacy

How we handle personal information is explained in the [Privacy notice](/privacy).

## Changes to these terms

We may update these terms. When we do, we'll change the effective date below. Continuing to use the site after a change means you accept the updated terms.

## Governing law

These terms are governed by the laws of the Province of Saskatchewan and the federal laws of Canada that apply there. Any dispute will be handled by the courts of Saskatchewan, unless the law where you live gives you the right to bring it elsewhere.

These terms took effect on ${POLICY_EFFECTIVE_LABEL}.
`,
};

export const INFO_PAGES = [ABOUT_PAGE, PRIVACY_PAGE, TERMS_PAGE] as const;
