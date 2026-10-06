---
title: "Power Pages licensing explained: who counts as an authenticated or anonymous user"
slug: power-pages-licensing-explained
type: REFERENCE
technology: POWER_PAGES
topic: go-live-and-monitor
excerpt: "How Power Pages counts users each month, who is never counted, and how internal staff with Power Apps or Dynamics 365 licences are handled. Plus subscription packs versus pay-as-you-go, the pages and visitors that are exempt, and where to watch consumption."
---
Power Pages isn't licensed per page view or per login any more. It's licensed per **unique user, per website, per calendar month**, in two kinds: **authenticated** (signed in) and **anonymous** (just browsing). Knowing exactly who counts saves real money, and avoids surprises at go-live.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026. Prices change; see Microsoft's licensing FAQ for current figures.

## Authenticated users

- **Who:** anyone who **signs in** through any identity provider: Microsoft Entra ID, a local account, Google, and so on.
- **Counted:** once per **website** per **calendar month**, however many times they sign in.
- **What makes them unique:** the Dataverse **contact** record they're mapped to. One contact equals one user, even across many sign-ins.
- **Several sites:** someone who signs in to three websites counts **three times**, once per site.

## Anonymous users

- **Who:** visitors who browse without signing in.
- **What makes them unique:** an anonymous ID in a **browser cookie**. A new browser, a new device or cleared cookies means a new ID, and another count.
- **Browse, then sign in:** a visitor who browses anonymously and then signs in the **same day (UTC)** is counted **only as authenticated**.

## Never counted

| Situation | Why it matters |
| --- | --- |
| Websites in **trial** or **private** mode | Develop and test without spending capacity |
| People with a **Power Apps per user** licence, or a **Dynamics 365 enterprise** licence that covers the site | Internal staff often cost nothing extra (see below) |
| Visits only to **sign-in, register, invitation** or external-sign-in callback pages | A site whose only public page is sign-in doesn't need anonymous capacity |
| System pages starting with `/_`, such as `/_services` and `/_resource` | |
| Responses that are **redirects (3xx)**, **client errors (4xx)** or **server errors (5xx)** | |
| Requests only for **static files** (CSS, JavaScript, images) | |
| **Bots and crawlers** | |
| Uptime monitors that send a **non-browser** user agent | Point monitors at `/_services/about` to be safe |

> [!TIP]
> If your whole site is for signed-in users, protect the **home page with page permissions**, not with a JavaScript redirect. A client-side redirect can leave pages reachable anonymously, and those visits count.

## Internal staff

Employees signing in with Microsoft Entra ID can be covered by licences they may already have:

| Their licence | Covers |
| --- | --- |
| **Power Apps per user** | Unlimited Power Pages websites |
| **Power Apps per app** | One website, in the environment the per-app capacity is assigned to |
| **Dynamics 365 enterprise** | Unlimited websites that map to the licensed Dynamics 365 app, in the same environment |
| None of these | An **authenticated user** subscription or pay-as-you-go, like any external user |

For these licences to be recognised, users must sign in with **Microsoft Entra ID** through the built-in provider, and the licence must be in the **same tenant** as the site.

## Subscription or pay-as-you-go?

| | Subscription capacity | Pay-as-you-go |
| --- | --- | --- |
| How it works | Buy packs in advance: **100** authenticated or **500** anonymous users per pack, per website, per month | Billed for the actual monthly active users, through an Azure subscription linked to the environment |
| Minimum per environment | **25** authenticated, **200** anonymous | None |
| Unused capacity | Doesn't roll over to next month | Not applicable |
| Good for | Steady, predictable traffic | New sites, seasonal peaks, unknown demand |

If an environment has pay-as-you-go turned on, **prepaid capacity assigned to it is ignored**. Move that capacity to another environment.

Both include **Dataverse storage** with the licence. Each website no longer needs 1 GB of Dataverse capacity, as it did under the old portals model.

## Watching consumption

- **Power Platform admin center → Billing → Licenses → Power Pages:** see capacity assigned and consumed per environment, overage, and history.
- **Downloadable reports:** daily counts of first-time users per site. Sum a month's **Billed quantity** to get the monthly total.
- **Analytics tools count differently.** Application Insights or Google Analytics run in the browser, include error pages, and miss blocked scripts. Their numbers won't match the meters, and that's expected.

## Sources

- Microsoft Learn: [Power Platform licensing FAQs: Power Pages](https://learn.microsoft.com/power-platform/admin/powerapps-flow-licensing-faq#power-pages)
- Microsoft Learn: [Pay-as-you-go meters: Power Pages](https://learn.microsoft.com/power-platform/admin/pay-as-you-go-meters#how-do-meters-work)
- Microsoft Learn: [Pay-as-you-go known issues and FAQ](https://learn.microsoft.com/power-platform/admin/pay-as-you-go-issues-faq#frequently-asked-questions)
- Microsoft Learn: [Manage and monitor Power Pages capacity](https://learn.microsoft.com/power-pages/admin/capacity-management)
- Microsoft Learn: [Website capacity consumption reports](https://learn.microsoft.com/power-pages/admin/website-consumption-reports)
