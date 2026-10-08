---
title: "Ground an agent on Dataverse tables: setup, notes and files, and why it answers generically"
slug: agent-on-dataverse-tables
type: TUTORIAL
technology: COPILOT_STUDIO
topic: knowledge-and-grounding
excerpt: "Add Dataverse tables as knowledge in Copilot Studio so the agent answers from your own records, such as cases, assets or orders, with each user seeing only what they're allowed to. The prerequisites, the 15-table limit, searching notes and attached files (preview), and the fixes when the agent ignores the source."
searchPhrase: "ground copilot studio agent on dataverse tables"
---
Most business answers live in **Dataverse**: cases, orders, assets, contacts. Adding tables as **knowledge** lets an agent answer questions like "which high-priority cases opened this week are still unresolved?" straight from those rows. Since September 2026 it can also reason over **notes and attached files** in those rows, in preview.

> [!ANSWER] Quick answer
> 1. [Turn on **Dataverse search** and use **Authenticate with Microsoft**](#before-you-start): without them, Dataverse knowledge isn't available.
> 2. [Give columns clear display names and descriptions](#make-the-data-easy-to-find): the agent finds data through table and column metadata.
> 3. [Test with a low-permission account](#before-you-start) before you launch.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026.

## Before you start

| Requirement | Why |
| --- | --- |
| **Dataverse search** is on in the environment | The agent finds rows through Dataverse search. If it's off, Dataverse doesn't appear as a knowledge option at all. An admin turns it on |
| The agent's authentication is **Authenticate with Microsoft** | **No authentication** and **Authenticate manually** aren't supported for Dataverse knowledge |
| **You** can read the tables | Tables you can't access don't appear when you add knowledge |

Users sign in with Microsoft, and Microsoft says Copilot Studio tailors answers to **who is asking and what they're allowed to see**. Always test with a low-permission account before you launch.

## Add the tables

1. Open the agent, go to **Build**, and select **Knowledge**.
2. Select **Add knowledge → Dataverse**.
3. Select up to **15 tables** for this knowledge source. Search helps; suggestions are based on the agent's name.
4. **Write a real description:** what's in these tables and which questions they answer. The agent uses the description to decide **when** to search this source.
5. Select **Add to agent**.

> [!TIP]
> Test with questions that need **filtering**, not just a lookup, for example "unresolved cases opened this week". Microsoft's advice: if answers come back thin, the fix is usually a **better description**, not a different table.

## Make the data easy to find

Dataverse knowledge has no synonym or glossary settings in Copilot Studio. It uses the **table and column metadata** instead:
- give columns **clear display names and descriptions** in Dataverse, for example "SLA breach date", not "cr12_dt2";
- give the knowledge source a clear **name and description**;
- use **skills** to teach the agent your organisation's own words.

## Search notes and attached files (preview)

By default, the agent reasons over **structured** columns. To include long text (**Multiline Text**) and documents in **File** columns:

1. In **Power Apps → Dataverse → Tables**, open the table and turn on **Searchable** for those columns.
2. Under **Views**, open the **Quick Find View**, add the columns, and add them to **Find by** (**Edit find table columns**).
3. **Save and publish.**

Points to know:
- If the knowledge source was added **before** you made these columns searchable, it can take **up to two days** to catch up. Adding the knowledge source again speeds this up.
- The search index uses **extra Dataverse capacity**, which costs money. Check with your admin.
- Inside attached files, **tables, images, and text in languages your organisation doesn't use** aren't supported yet.

## Limits

- Up to **15 tables** per knowledge source.
- **Virtual tables:** only those using the Finance and Operations data provider.
- Preview features roll out at different times, so they may not appear in your tenant yet.

## When it doesn't work

| Symptom | Fix |
| --- | --- |
| **Dataverse isn't offered**, or no tables can be added | Turn on Dataverse search in the environment (admin) |
| A **table is missing** from the list | You lack read access to it; get a security role that covers it |
| The agent **answers generically** and ignores the data | Improve the knowledge source's name and description; confirm the agent uses **Authenticate with Microsoft** |
| **Notes or files** never show up in answers | Make those columns searchable and add them to the **Quick Find View**, then allow time or re-add the source |
| A **banner says an admin must act**, and Dataverse, Dynamics 365 or uploaded files can't be added | The environment's Dataverse search-and-index setting doesn't support agent knowledge. An admin changes it; existing sources then work again without being re-added |

## Sources

- Microsoft Learn: [Add Dataverse tables to your agent as a knowledge source](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/knowledge-add-dataverse-tables)
- Microsoft Learn: [What's new in Copilot Studio: September 2026](https://learn.microsoft.com/microsoft-copilot-studio/whats-new)
- Microsoft Learn: [Configure Dataverse search for your environment](https://learn.microsoft.com/power-platform/admin/configure-relevance-search-organization)
- Microsoft Learn: [Security FAQs for Copilot Studio](https://learn.microsoft.com/microsoft-copilot-studio/security-faq)
- Microsoft Learn: [Configure user authentication: Authenticate with Microsoft](https://learn.microsoft.com/microsoft-copilot-studio/configuration-end-user-authentication#authenticate-with-microsoft)
