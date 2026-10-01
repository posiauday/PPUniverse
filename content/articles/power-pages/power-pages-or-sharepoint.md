---
title: "Power Pages or a SharePoint site?"
slug: power-pages-or-sharepoint
type: COMPARISON
technology: POWER_PAGES
excerpt: "SharePoint is for your organisation and the guests it invites; Power Pages is for the public and for external users at scale. How to tell which you need, what each one costs, and when you need both."
---
"We need a site" can mean two very different things: a place for **your own people** to find information and work together, or a place for **people outside** your organisation to sign up, submit and track things. SharePoint is built for the first, Power Pages for the second. Choosing the wrong one costs either money or months.

## The short version

| | SharePoint site | Power Pages site |
| --- | --- | --- |
| **Built for** | Employees and invited guests | The public and external users, at scale |
| **Who can visit** | People in your Microsoft 365 tenant, plus guests you invite | Anyone on the internet (anonymously), or external users who sign in with an identity provider |
| **Data** | Pages, documents and lists | Dataverse tables, with lists and forms that read and write records |
| **Licensing** | Included in Microsoft 365 for your users | Capacity based: per unique user per site per month, with separate prices for authenticated and anonymous users |
| **Security model** | Site and item permissions | Web roles, table permissions with access types, and page permissions |
| **Typical uses** | Intranet, team sites, document libraries, news | Customer portals, applications and registrations, partner portals, public information with self-service |

## When SharePoint is the answer

- **The audience is your own staff.** Intranet news, policies, team documents.
- **You're collaborating with a small, known group of guests.** A partner you invite by name to a project site.
- **The content is mainly documents and pages,** and nobody outside needs to submit structured data that flows into your business processes.

SharePoint is already paid for in most Microsoft 365 plans, so for these jobs it's almost always the right choice.

## When Power Pages is the answer

- **The public needs to reach it**, without your organisation inviting each person.
- **External people need to sign in at scale,** using identity providers such as Microsoft Entra External ID, Microsoft or LinkedIn. Each signed-in visitor becomes a Contact in Dataverse.
- **Visitors submit or update structured data:** applications, registrations, cases, bookings. It lands in Dataverse, where your apps, flows and reports already work.
- **Each visitor must see only their own records,** enforced by table permissions on the server, not by hiding things in the page.

## What Power Pages costs

Power Pages is licensed by **capacity**: the number of unique users who visit each site in a calendar month. At Microsoft's list prices in its licensing FAQ, as of September 2026:

| Option | Unit | List price |
| --- | --- | --- |
| Authenticated users, subscription | Pack of 100 users per site per month | $200 per pack (lower tiers at higher volumes) |
| Anonymous users, subscription | Pack of 500 users per site per month | $75 per pack (lower tiers at higher volumes) |
| Authenticated users, pay-as-you-go | Per active user per site per month | $4 |
| Anonymous users, pay-as-you-go | Per active user per site per month | $0.30 |

A few rules change the sums:

- **Sign-in pages are free.** Visitors who only reach sign-in and registration pages aren't counted as anonymous users, and neither are bots, crawlers or error responses.
- **Some staff are already covered.** Internal users who already have a Power Apps per user licence, or a Dynamics 365 enterprise licence, aren't counted as Power Pages users.
- **Uniqueness depends on a cookie.** An anonymous visitor is identified by a browser cookie. The same person on a new browser or device, or after clearing cookies, counts again.
- **Trial and private sites cost nothing.** Sites in trial mode, and private sites, aren't counted by the pay-as-you-go meters.

Check the current Microsoft Power Platform Licensing Guide before budgeting; prices and terms change.

## When you need both

Many organisations run both, side by side:

- **SharePoint** for the internal side: the team's documents, procedures and news.
- **Power Pages** for the external side: the form customers fill in, and the page where they check its status.

Both work on Dataverse data through the apps and flows behind them.

> [!WARNING]
> If a Power Pages site stores documents in SharePoint through the Dataverse integration, SharePoint's permissions don't automatically follow Dataverse's record-level security. Microsoft documents a pattern for keeping those document libraries from being browsed directly. Plan for it before you store sensitive files.

## Quick decision rules

- **Only your staff:** SharePoint.
- **Your staff plus a few named guests:** SharePoint with guest access.
- **The public, or external users signing themselves up:** Power Pages.
- **Visitors must submit or manage structured records:** Power Pages.
- **Unsure:** list who the visitors are and what they must *do*. If the answer includes "people we don't know yet" and "submit data", it's Power Pages.

The comparison follows Microsoft's documentation for Power Pages and its published licensing FAQ as of September 2026. The decision rules are our own.

## Sources

- [What is Power Pages? (Microsoft Learn)](https://learn.microsoft.com/power-pages/introduction)
- [Power Platform licensing FAQs: Power Pages (Microsoft Learn)](https://learn.microsoft.com/power-platform/admin/powerapps-flow-licensing-faq#power-pages)
- [Pay-as-you-go meters (Microsoft Learn)](https://learn.microsoft.com/power-platform/admin/pay-as-you-go-meters)
- [Power Pages security (Microsoft Learn)](https://learn.microsoft.com/power-pages/security/power-pages-security)
- [Manage SharePoint document visibility in Dataverse solutions (Microsoft Learn)](https://learn.microsoft.com/power-platform/architecture/reference-architectures/sharepoint-dataverse-security)
