---
title: "Copilot Studio knowledge: limits, sign-in rules and why the agent finds nothing"
slug: knowledge-limits-and-fixes
type: REFERENCE
technology: COPILOT_STUDIO
topic: knowledge-and-grounding
excerpt: "Every knowledge-source limit in one place (websites, SharePoint, files, Dataverse), the sign-in setting each channel needs, and a checklist for when an agent answers 'I don't know' or won't publish."
searchPhrase: "copilot studio knowledge limits"
---
An agent that can't find an answer it should know is rarely broken. Usually a limit was reached quietly, a file is too big to read, or the agent's sign-in setting doesn't fit the source or channel. This page puts those rules side by side.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026. Copilot Studio changes often, so check the **Sources** list for Microsoft's current figures.

## Knowledge sources at a glance

How many sources an agent can search at once depends on its **orchestration** mode, set in the agent's settings: **generative** or **classic**. A **Create generative answers** node inside a topic always uses the classic limits.

| Source | Generative orchestration | Classic orchestration | Who it searches as |
| --- | --- | --- | --- |
| Public websites (searched with Bing) | 25 | 4 | Nobody: public content only |
| SharePoint (site URLs) | 25 | 4 per generative answers node | The person chatting |
| Uploaded files | All files (not counted in the 25) | Limited by Dataverse file storage | Nobody: stored with the agent |
| Dataverse | No fixed limit | 2 sources, up to 15 tables each | The person chatting |
| Enterprise data through connectors | No fixed limit | 2 per agent | The person chatting |

**Across the whole agent:**
- up to **500 knowledge sources** of all types;
- up to **500 uploaded files**, each up to **512 MB**;
- up to **1,000 topics** and **200 trigger phrases** per topic;
- instructions for a Microsoft 365 Copilot agent up to **8,000 characters**.

> [!WARNING]
> A **Create generative answers** node in a topic always works the classic way, even when the agent uses generative orchestration. So its public-website limit is **4**, not 25. More than 4 makes publishing fail with **TooManyPublicSiteSearchSources**.

### SharePoint specifics

- **File size** depends on licensing:
  - without a Microsoft 365 Copilot licence in the same tenant, generative answers read SharePoint files up to **7 MB**;
  - with that licence and **tenant graph grounding with semantic search** turned on, up to **200 MB**.

  Bigger files can still appear in search results, but their contents aren't used for answers.
- **Pages:** only **modern** SharePoint pages are read. Classic ASPX pages, and modern pages that contain SPFx components, are ignored.
- **File types:** Word, PowerPoint and PDF files on a site can be used.
- **Links aren't followed.** The agent reads the files and pages you add, not the pages they link to. Add a linked site as its own source if you need it.
- **Protected content is skipped.** Files labelled **Confidential** or **Highly confidential**, and password-protected files, can't be indexed. They may still show as **Ready** but never contribute to answers.
- **Uploading a SharePoint folder** (the "Upload files → SharePoint" route) syncs up to 1,000 files, 50 folders and 10 levels of subfolders per source, every **4–6 hours**.

## The sign-in setting must fit the channel and the source

In **Settings → Security → Authentication**, choose one of three options:

| Option | Works in | Can use SharePoint and Dataverse knowledge? | Notes |
| --- | --- | --- | --- |
| **No authentication** | Websites and any public channel | **No**: only public sites and uploaded files | Anyone with the link can chat. Tools that need the user's own credentials won't work |
| **Authenticate with Microsoft** (default for new agents) | Teams, Microsoft 365 Copilot, Power Apps | Yes, as the person chatting | The **only** option the Teams and Microsoft 365 channel accepts. Users aren't asked to sign in again |
| **Authenticate manually** | Websites, apps and other channels | Yes, with extra set-up (below) | Needed when you publish outside Microsoft's own apps but still want sign-in |

**Things that catch people out:**
- **Teams group chats and channels** can't use knowledge that needs the user's own sign-in, such as SharePoint. That works in **one-to-one chats only**, by design.
- **Manual authentication with SharePoint** needs an Entra ID app registration with the delegated **Sites.Read.All** and **Files.Read.All** permissions, consent granted, and those two scopes added next to `profile openid` in the agent's authentication settings. If anything is missing, the agent doesn't error: it simply finds nothing. Generic OAuth isn't supported for SharePoint knowledge.
- **Your admin can override you.** Admins can set per-environment rules, such as "Require Microsoft authentication". An agent whose setting no longer fits is blocked from publishing and stops answering until it's changed.

## "The agent says it doesn't know": a checklist

Work down the list; most cases end in the first four.

1. **Is the source status Ready?** Right after you add files, the status can briefly say Ready, switch to In progress, then Ready again. Wait for the second Ready.
2. **Can the person chatting see that content?** SharePoint, Dataverse and connector sources answer *as the user*. If they can't open the file in SharePoint, the agent can't use it for them. Test with their account, not yours.
3. **Is the file small enough?** Check the 7 MB / 200 MB SharePoint rule above. For a large reference document, upload it to the agent instead (up to 512 MB).
4. **Is the content readable?** Look for sensitivity labels, password protection, a classic SharePoint page, or text that's only inside images. Images are only read inside PDF files.
5. **Is it the right channel?** In a Teams group chat or channel, SharePoint knowledge won't work, so test in a one-to-one chat.
6. **Is SharePoint search restricted?** If your tenant turned on **Restricted SharePoint Search**, SharePoint knowledge is blocked unless the site is on the allowed list. Ask your SharePoint admin.
7. **Too many sources?** With more than 25 sources, generative orchestration picks which ones to search by their **descriptions**. Give every source a short, specific description of what it contains.
8. **Did you publish after changing it?** Edits only reach users after **Publish**. In Teams, an existing conversation can keep the old version. Type "start over" to refresh it.

## "It won't publish": a checklist

- **Open the Review panel.** **Blocking** issues stop publishing; **warnings** don't. Typical blockers: a data policy blocks a tool or knowledge source, the authentication setting conflicts with a policy, or no channel is set up.
- **Too many public sites** in a generative answers node shows as **TooManyPublicSiteSearchSources**. Keep each node to 4.
- **Check everything the agent depends on.** Flows, connectors and knowledge sources must all exist and be connected in this environment, especially after importing a solution.

## Users can't reach it in Teams

- **"You don't have access to talk to this bot":** the agent can be installed, but the user isn't allowed to use it. In the Teams admin center, check the org-wide custom app settings, and that the **Shared Power Apps** app is allowed. Then check the agent is shared with that user.
- **Rate limits:** Teams limits how fast agents can send messages, so keep replies concise.
- **No sign-out:** users of an authenticated agent can't sign out explicitly. That's fine for use inside your organization, but it fails Teams Store certification if you plan to list the agent publicly.

## Sources

- Microsoft Learn: [Quotas and limits](https://learn.microsoft.com/microsoft-copilot-studio/requirements-quotas)
- Microsoft Learn: [Knowledge sources summary](https://learn.microsoft.com/microsoft-copilot-studio/knowledge-copilot-studio)
- Microsoft Learn: [Add SharePoint as a knowledge source](https://learn.microsoft.com/microsoft-copilot-studio/knowledge-add-sharepoint)
- Microsoft Learn: [SharePoint knowledge sources don't return results](https://learn.microsoft.com/troubleshoot/power-platform/copilot-studio/knowledge/sharepoint-no-response)
- Microsoft Learn: [Publish fails because of Bing sources](https://learn.microsoft.com/troubleshoot/power-platform/copilot-studio/knowledge/agent-publish-fails-bing-sources)
- Microsoft Learn: [Configure user authentication](https://learn.microsoft.com/microsoft-copilot-studio/configuration-end-user-authentication)
- Microsoft Learn: [Configure authentication for agents (admin)](https://learn.microsoft.com/power-platform/admin/security/configure-authentication-controls-for-agents)
- Microsoft Learn: [Connect an agent to Teams and Microsoft 365: known limitations](https://learn.microsoft.com/microsoft-copilot-studio/publication-add-bot-to-microsoft-teams#known-limitations)
- Microsoft Learn: [Review agent readiness and status](https://learn.microsoft.com/microsoft-copilot-studio/agents-experience/authoring-agent-status)
