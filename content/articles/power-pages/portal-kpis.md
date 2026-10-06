---
title: "Portal KPIs: sign-ups, self-service rate and form completion"
slug: portal-kpis
type: KPI_GUIDE
technology: POWER_PAGES
topic: go-live-and-monitor
excerpt: "A portal is worth having if it takes work off the team behind it. Five KPIs that show whether a Power Pages site is doing that, where each number comes from, and why your analytics and your licence report will never quite agree."
---
A Power Pages site usually exists to move work from a person to a page: customers check their own status instead of phoning, applicants submit complete forms instead of emailing attachments. Visitor counts don't tell you whether that's happening. These five KPIs do.

## The five KPIs

| KPI | Question it answers | Formula |
| --- | --- | --- |
| **Active users** | Are people using it? | Unique signed-in and anonymous visitors per month |
| **Sign-up conversion** | Do visitors become registered users? | New registrations ÷ unique anonymous visitors who reached the registration page |
| **Form completion rate** | Do people finish what they start? | Submitted records ÷ forms started |
| **Self-service rate** | Is it taking work off the team? | Requests handled through the portal ÷ all requests of that type, across all channels |
| **Contact reduction** | Did the old channels get quieter? | Phone and email contacts for the covered request types, before versus after |

Self-service rate and contact reduction are the KPIs that justify the portal. The others explain why they move.

## Where the numbers come from

### Traffic: the Power Platform admin center

Admins can see traffic for every site in the admin center. Look under **Power Pages**, then **Analytics**:

- **Daily, weekly and monthly active users**, split into authenticated, anonymous and all users.
- **Monthly active users** are counted over a rolling 30 days, and the dashboards show only the last 30 days of data, so export what you want to keep.
- **Public sites only.** Private sites aren't included.
- **Slow to settle.** The numbers are under-reported for the first days after the feature is turned on.

### Licensed usage: the capacity reports

The **capacity** views and downloadable reports in the admin center count what you're billed for: unique authenticated users and unique anonymous users per site per month. Use them for budgeting. Don't use them as your adoption metric, because they deliberately leave out some visits:

- **Some users aren't counted.** Users already licensed through Power Apps or Dynamics 365 don't count as authenticated users.
- **Some visits aren't counted.** Sign-in pages, redirects, errors, bots and crawlers don't count as anonymous visits.

### Forms and outcomes: Dataverse

Form completion and self-service rate come from the records themselves:

- **Count submitted records** per form or table, using **Created On**.
- **Record the channel.** Add a **Channel** choice column (Portal, Phone, Email, In person) to the request table, and set it automatically for portal submissions. Then the self-service rate is a simple count by channel.
- **Count abandoned drafts.** If your forms save drafts, or are multistep, count how many reach the final step against how many start.

### Behaviour on the page: Application Insights

For funnels (which page people leave on, which form step loses them), add web analytics such as Azure Application Insights to the site. Microsoft announced built-in site analytics configuration, using Application Insights from the **Set up** workspace, as a public preview for September 2026. Check whether it has reached your region.

> [!NOTE]
> Your analytics tool and your licence report will disagree, and that's expected. Microsoft explains why:
> - **Script blocking.** Client-side analytics need JavaScript and can be blocked by networks.
> - **Background requests.** They usually skip AJAX requests.
> - **Errors and special pages.** They count error responses and special pages that licensing excludes.
>
> Pick one source per KPI and stick to it.

## Measuring self-service honestly

Self-service rate is the KPI sponsors care about, and the easiest to overstate.

1. **Capture a baseline before launch:** monthly volume by channel for the request types the portal will handle.
2. **Count only request types the portal actually covers.** A portal for permit applications doesn't reduce billing calls.
3. **Watch the total, not just the share.** If portal submissions rise but phone calls don't fall, the portal has added demand, not moved it. That may be good, but it isn't savings.
4. **Count failed self-service.** People who start online and then phone anyway are a sign of a confusing form or missing status information.

## Setting targets

There are no official benchmarks for portal KPIs. Use your first full month after launch as the baseline, then:

- **Form completion low:** look at which step people leave on, and cut fields.
- **Sign-up conversion low:** check whether registration is really needed for that task, or whether a simpler sign-in provider would help.
- **Self-service flat:** check whether people can see their request's **status** online. Status checks are usually the biggest single reason people call.

## Checklist

- A pre-launch baseline exists for request volume by channel.
- Requests record their channel, so the self-service rate is a count, not a guess.
- Traffic KPIs come from admin center analytics; budgets come from the capacity reports.
- Form completion is measured from starts and submissions, not from page views.
- One source is chosen per KPI, and the difference between analytics and licensing counts is understood.

The data sources follow Microsoft's documentation for Power Pages analytics and licensing as of September 2026. The KPI definitions and the self-service method are our own recommendations.

## Sources

- [Monitor traffic to your websites (Microsoft Learn)](https://learn.microsoft.com/power-pages/admin/admin-center-analytics)
- [Manage and monitor capacity (Microsoft Learn)](https://learn.microsoft.com/power-pages/admin/capacity-management)
- [Pay-as-you-go meters: anonymous user meter (Microsoft Learn)](https://learn.microsoft.com/power-platform/admin/pay-as-you-go-meters)
- [Pay-as-you-go known issues and FAQ: analytics versus licensing counts (Microsoft Learn)](https://learn.microsoft.com/power-platform/admin/pay-as-you-go-issues-faq)
- [Configure site analytics and server logging, release plan (Microsoft Learn)](https://learn.microsoft.com/power-platform/release-plan/2026wave1/power-pages/configure-site-analytics-server-logging)
