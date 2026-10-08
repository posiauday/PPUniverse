---
title: "Knowledge sources compared: SharePoint, websites, Dataverse and files"
slug: knowledge-sources-compared
type: COMPARISON
technology: COPILOT_STUDIO
topic: knowledge-and-grounding
excerpt: "Where a Copilot Studio agent gets its answers decides who can see what, how fresh the answers are, and how much you have to maintain. A side-by-side comparison of the main knowledge sources and when to use each."
searchPhrase: "copilot studio knowledge sources"
---
> [!NOTE]
> **As of September 2026.** Knowledge options in Copilot Studio change often. This comparison describes agents built with the standard harness. Limits and the list of available sources can differ by environment, licence and region, so check the current Microsoft Learn pages before you design around a number.

Adding knowledge to a Copilot Studio agent looks like one decision, "point it at our content". It's actually several, because each type of source behaves differently in three ways that matter:

- **Permissions:** does the agent check what each user is allowed to see?
- **Freshness:** when the content changes, when does the agent know?
- **Effort:** what do you have to maintain?

> [!ANSWER] Quick answer
> 1. [Content that changes weekly or more, with access that varies by person](#sharepoint): connect **SharePoint**.
> 2. [Records and structured data](#dataverse-tables): use **Dataverse**.
> 3. [A handful of stable, non-sensitive documents](#uploaded-files): upload them. Public information you already publish: [public websites](#public-websites).

## Side by side

| Source | Who can get answers from it | How fresh | Good for |
| --- | --- | --- | --- |
| **Public websites** | Anyone who can use the agent; no sign-in needed | As fresh as Bing's index of the site | Public product docs, policies already on your website |
| **Uploaded files** | Anyone who can use the agent | Static: a copy taken at upload; changes need a new upload | A small set of stable, non-sensitive documents |
| **SharePoint (connected)** | Only users who can open the content themselves | Follows SharePoint's search index | Intranet pages and document sites that change often |
| **Files from SharePoint or OneDrive (via Upload files)** | Only users who can open the files themselves | Synchronised every four to six hours | Specific files or folders, with page-level citations for PDFs |
| **Dataverse tables** | Only users with access through their security roles | Live data | Structured business records, such as products or cases |
| **Copilot connectors** (ServiceNow, Confluence and others) | Depends on the connector and its indexing | Depends on the connector | Knowledge bases held outside Microsoft 365 |

The table summarises Microsoft's documented behaviour, in our wording.

## Public websites

The agent searches Bing, restricted to the sites you list: up to 25 in an agent that uses generative orchestration. No sign-in is involved, so answers are the same for everyone.

Only list sites you own or trust, because the agent will repeat what they say. Don't confuse this with the separate **Web Search** setting on the **Overview** page. That setting searches **all** public websites Bing indexes whenever a question might benefit from the web.

## Uploaded files

You upload Word, PowerPoint, Excel or PDF files, and they're stored and indexed in Dataverse. Two things surprise people:

- **They don't update.** An uploaded file is a copy. If the original changes, the agent keeps using the old version until someone uploads it again.
- **They're not permission-checked.** Anyone with access to the agent can get answers from an uploaded file, whoever they are.

Use uploads for small, stable, shareable content. Never use them for restricted documents.

## SharePoint

There are two ways to use SharePoint, and they behave differently.

**SharePoint as a connected source** (add knowledge, then SharePoint, then a site URL):

- **Uses the user's Microsoft Entra ID sign-in.** It returns only what that person can access.
- **Supports up to 25 site URLs** per agent with generative orchestration.
- **Reads modern pages and common documents.** It doesn't read classic ASPX pages, or modern pages that use SPFx components.
- **Is blocked entirely by Restricted SharePoint Search.** If your tenant has it turned on, SharePoint knowledge returns nothing until the sites are added to the allowed list.

**Files and folders from SharePoint** (Upload files, then SharePoint):

- **Copies the content into Dataverse** and indexes it there. That uses Dataverse storage.
- **Synchronises every four to six hours.**
- **Still checks the user's permission** before using a file in an answer.
- **Supports up to 1,000 files, 50 folders and 10 levels of subfolders** per source.
- **Gives page-level citations for PDFs**, so users can jump to the exact page.

> [!WARNING]
> Documents with a **Confidential** or **Highly Confidential** sensitivity label, or with a password, can't be indexed through the upload path. They show as ready but never produce answers. If an agent seems to ignore a document, check its label first.

## Dataverse tables

Dataverse knowledge lets the agent answer from structured records, such as "Which products in the Lighting category are out of stock?", using the user's own access. It suits data that already lives in Power Platform apps, and it's always current, because it reads the tables rather than a copy.

## Limits that shape the design

- **500 knowledge objects per agent** across all types (files, folders, sites and so on).
- **Five source types at a time.** Microsoft's documentation for unstructured data says an agent can currently use only five different sources at once, for example SharePoint, Dataverse and OneDrive.
- **Upload limits:** files up to 512 MB each, and up to 500 uploaded files.

## Choosing

- **Content changes weekly or more, and access varies by person:** SharePoint as a connected source.
- **A defined set of files, PDFs where page citations help:** Upload files from SharePoint.
- **Public information you already publish:** public websites.
- **A handful of stable, non-sensitive reference documents:** uploaded files.
- **Records and structured data:** Dataverse.
- **Your knowledge base lives in ServiceNow, Confluence or similar:** the matching Copilot connector.

Whichever you choose, the agent can only be as good as the content. Out-of-date pages, duplicates and contradicting documents produce out-of-date, duplicated and contradicting answers. Clean the source before you blame the agent.

The comparison follows Microsoft's documented behaviour for Copilot Studio knowledge sources as of September 2026. The recommendations in "Choosing" are our own.

## Sources

- [Knowledge sources summary (Microsoft Learn)](https://learn.microsoft.com/microsoft-copilot-studio/knowledge-copilot-studio)
- [Unstructured data as a knowledge source (Microsoft Learn)](https://learn.microsoft.com/microsoft-copilot-studio/knowledge-unstructured-data)
- [Add unstructured data as a knowledge source (Microsoft Learn)](https://learn.microsoft.com/microsoft-copilot-studio/knowledge-add-unstructured-data)
- [Quotas and limits (Microsoft Learn)](https://learn.microsoft.com/microsoft-copilot-studio/requirements-quotas)
- [SharePoint knowledge sources don't return results (Microsoft Learn)](https://learn.microsoft.com/troubleshoot/power-platform/copilot-studio/knowledge/sharepoint-no-response)
