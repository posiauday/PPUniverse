---
title: "Refresh failed: a Power BI checklist from first look to fix"
slug: refresh-failures-checklist
type: REFERENCE
technology: POWER_BI
topic: refresh-and-gateways
excerpt: "Why a Power BI semantic model stops refreshing, in the order to check it: credentials, gateway, privacy levels, time-outs, size limits and paused schedules, with the fix for each and the limits that cause them."
searchPhrase: "power bi refresh failed"
---
A failed refresh shows up as a stale report, a warning icon in the workspace or an email to the model owner. The cause is almost always one of a handful of things, and checking them in the right order saves an afternoon.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026. "Semantic model" is what Power BI used to call a dataset; the REST API still says datasets.

## Step 1: Read the actual error

1. In the workspace, select the semantic model, then **Refresh** → **Refresh history**.
2. Each attempt shows its status, start time, duration and error message. The first failed attempt after a run of successes tells you what changed.
3. A **Completed** refresh can still hide problems. "Completed with warnings" means the data loaded, but something is broken, often a measure pointing at a column that no longer exists. Those visuals show errors or blanks, so read the warnings too.

> [!TIP]
> Note **when** it started failing. A failure that began on one exact day usually means a password changed, a gateway was updated or someone renamed a source table that day.

## Step 2: Credentials (the most common cause)

**Symptoms:**
- "The credentials provided … are invalid";
- "Access to the resource is forbidden";
- the refresh stops right after someone changed a password.

**Why it happens:**
- the account used for the source changed its password, or it expired;
- cached credentials in the service went stale;
- for **OAuth** sources such as SharePoint Online and Dynamics 365, the sign-in token lasts about an hour. A refresh that loads for longer than that can fail with a credentials error part-way through.

**Fix:**
1. Open the semantic model's **Settings** → **Data source credentials**, select **Edit credentials** and sign in again.
2. If the service keeps using old credentials, clear your browser cache, sign in to Power BI again, and open `https://app.powerbi.com?alwaysPromptForContentProviderCreds=true` to force a new prompt.
3. For SharePoint Online over OAuth, sign in with the **same account you use for the Power BI service**.
4. OAuth sources must be in the **same tenant** as your Power BI service; connections across tenants aren't supported with OAuth2.

## Step 3: The gateway (for on-premises data)

Any source inside your network, such as SQL Server, file shares or on-premises SharePoint, refreshes through an **on-premises data gateway**.

**Symptoms:** "gateway unreachable" or "GatewayNotReachable", or a gateway marked offline in the semantic model's **Gateway and cloud connections** settings.

**Check, in order:**
1. **Is the gateway online?** Look in the semantic model's settings. If it's offline, check the machine it runs on: is it on, and is the gateway service running?
2. **Is it up to date?** An outdated gateway is a known cause of `GatewayNotReachable` when you set credentials, and the refresh history warns when a version is about to stop working. Install the latest version.
3. **Too many refreshes at once?** One gateway handles at most **30 concurrent refreshes**. The error says "There are too many refreshes occurring concurrently". Add gateways to the cluster to share the load.
4. **Personal mode** gateways lose their stored credentials if you uninstall and reinstall them. Re-enter the credentials in **Manage data sources** afterwards.

> [!TIP]
> Microsoft recommends separate gateways for **Import** models and **DirectQuery or live** models, so the big scheduled imports don't slow down reports that query the source on every click.

## Step 4: "Information is needed in order to combine data"

**Symptom:** the refresh works in Power BI Desktop but fails in the service with a privacy or "firewall" error, such as *"…is accessing data sources that have privacy levels which cannot be used together."*

**Why it happens:** in Desktop, **Always ignore privacy level settings** was switched on. The service has no such option, so a query that combines sources with different privacy levels is blocked.

**Fix:**
1. In Desktop, go to **Options** → **Global** → **Privacy**, and also **Current file** → **Privacy**. Stop ignoring privacy levels.
2. Set the sources' privacy levels correctly (usually **Organizational** for company data), and fix any query that now errors.
3. Republish, then set the data source credentials in the service to **Organizational**.
4. Privacy settings aren't published with the file, so reapply them in the service's data source settings after publishing.

## Step 5: Time-outs and size

| Limit | Shared capacity (Pro) | Premium, PPU or Fabric capacity |
| --- | --- | --- |
| Longest a scheduled refresh can run | **2 hours** | **5 hours** (refreshes through the XMLA endpoint aren't limited) |
| Largest imported model | **1 GB** | Larger (no 1 GB limit) |
| Uncompressed data processed per refresh | **10 GB** | No such limit |
| Scheduled refreshes per day | **8** | **48** |

**When a refresh times out or runs out of room:**
- **Load less.** Remove unused columns and rows; high-cardinality columns such as timestamps to the second, or long free text, cost the most.
- **Check query folding.** If Power Query can't push your filters back to the source, it downloads everything and filters afterwards. Fix this in Desktop before you publish.
- **Use incremental refresh** for large fact tables, so each run loads only the recent part.
- **Split one huge model** into smaller ones.
- **For slow SQL queries**, raise the source's command time-out in Power Query, for example `[CommandTimeout=#duration(0, 2, 0, 0)]`.

```powerquery
let
    Source = Sql.Database("server.database.windows.net", "Sales", [CommandTimeout = #duration(0, 2, 0, 0)])
in
    Source
```

## Step 6: The schedule itself

Sometimes nothing failed; the refresh simply didn't run.

- **Disabled after 4 failures in a row.** Power BI turns the schedule off after **four consecutive failures**, or straight away for an error that needs a settings change, such as expired credentials. You can't change that threshold. Fix the cause, then switch **Configure a refresh schedule** back on and select **Apply**.
- **Paused after 2 months unused.** If nobody opens any report or dashboard built on the model for **two months**, scheduled refresh pauses and the owner is emailed. Open any report on it to resume, then check the schedule is on.
- **Started late.** Power BI aims to start within **15 minutes** of the scheduled time but can be up to an hour late when the service is busy. It may also start up to 5 minutes early.
- **The daily limit.** The 8 (or 48) scheduled slots reset daily at **12:01 AM** in the model's chosen time zone. On shared capacity, refreshes started through the REST API count toward the 8; refreshes started with the **Refresh now** button don't.

## Step 7: The data refreshed, but the report didn't change

- **Dashboard tiles** can take **10–15 minutes** to catch up after a refresh. If they still don't, pin the visual again.
- **A file from OneDrive or SharePoint** may be set to **restrict updates**. The model then won't pick up changes saved to the `.pbix` file until the owner refreshes it by hand, or switches the setting to automatic updates if their admin allows it.
- **DirectQuery and live connections** don't import data on a schedule, so the report shows whatever the source returns when someone opens it.

## Stay ahead of failures

- **Failure emails.** Leave **Send refresh failure notification emails to the semantic model owner** on, and add a team mailbox under **Email these contacts when the refresh fails**. Those contacts must be in your organization; external addresses aren't supported.
- **Scripts and flows don't email.** Refreshes started manually or by Power Automate never send failure emails, so add your own alert in the flow.
- **Check the warning icons.** Look over a workspace's models every week or so: a small warning icon marks a model with errors.

## Sources

- Microsoft Learn: [Data refresh in Power BI](https://learn.microsoft.com/power-bi/connect-data/refresh-data)
- Microsoft Learn: [Configure scheduled refresh](https://learn.microsoft.com/power-bi/connect-data/refresh-scheduled-refresh)
- Microsoft Learn: [Troubleshoot refresh scenarios](https://learn.microsoft.com/power-bi/connect-data/refresh-troubleshooting-refresh-scenarios)
- Microsoft Learn: [Troubleshoot the on-premises data gateway](https://learn.microsoft.com/data-integration/gateway/service-gateway-tshoot)
- Microsoft Learn: [Troubleshoot Power BI gateway (personal mode)](https://learn.microsoft.com/power-bi/connect-data/service-admin-troubleshooting-power-bi-personal-gateway)
- Microsoft Learn: [Incremental refresh: time limits](https://learn.microsoft.com/power-bi/connect-data/incremental-refresh-overview#time-limits)
- Microsoft Learn: [Refresh a .pbix file stored on OneDrive or SharePoint Online](https://learn.microsoft.com/power-bi/connect-data/refresh-desktop-file-onedrive)
