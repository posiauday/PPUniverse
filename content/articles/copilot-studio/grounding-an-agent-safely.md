---
title: "Grounding an agent safely: what to connect and what to keep out"
slug: grounding-an-agent-safely
type: PATTERN
technology: COPILOT_STUDIO
topic: knowledge-and-grounding
excerpt: "A Copilot Studio agent doesn't create new access, but it makes existing access easy to use. Oversharing that nobody noticed in SharePoint becomes an answer anyone can ask for. A pattern for connecting knowledge and tools without leaking what shouldn't leak."
searchPhrase: "grounding a copilot agent safely"
---
> [!NOTE]
> **As of September 2026.** Copilot Studio's security and governance controls are changing quickly, including agent identities and data policies. This article describes the controls documented for agents built with the standard harness. Check Microsoft Learn for what's available in your tenant.

The usual fear about agents is that they'll reveal something users aren't allowed to see. For most knowledge sources, that isn't how they work: SharePoint and Dataverse knowledge answer with the **user's own permissions**, so the agent only finds what that person could already open.

The real risk is different. An agent makes existing access **easy to use**:

- **A folder shared with "everyone" years ago** now answers questions.
- **An uploaded HR spreadsheet** is visible to everyone who can chat with the agent.
- **A tool connected with the maker's account** lets every user act with the maker's rights.

This pattern is about closing those gaps before you publish.

> [!ANSWER] Quick answer
> 1. [Know which sources check each user's permissions](#principle-1-know-which-sources-check-permissions): connect restricted content from SharePoint or Dataverse, never upload it.
> 2. [Clean up oversharing before you connect a site](#principle-2-clean-up-oversharing-before-you-connect): loose permissions become loose answers.
> 3. [Require sign-in](#principle-3-require-sign-in) for internal agents, and [resolve security scan findings before publishing](#principle-6-check-before-and-after-publishing).

## Principle 1: know which sources check permissions

| Source | Permission-checked for each user? |
| --- | --- |
| SharePoint (connected), and files from SharePoint or OneDrive | Yes: users get answers only from content they can open |
| Dataverse tables | Yes: through the user's security roles |
| Uploaded files | **No:** anyone who can use the agent can get answers from them |
| Public websites and Web Search | Not applicable: public content |

So the first rule is simple: **never upload a document that not every user of the agent may read.** If content is restricted, connect it from SharePoint, where its permissions travel with it.

## Principle 2: clean up oversharing before you connect

Because the agent respects SharePoint permissions, loose permissions become loose answers. Microsoft's guidance for agents grounded in SharePoint is to fix sharing first:

- **Start with well-governed, low-risk sites** for your pilot, not the whole tenant.
- **Make sure every connected site has a named owner.**
- **Remove legacy sharing**, such as "Everyone except external users" on sites that don't need it.
- **Use SharePoint Advanced Management**, where you have it, to find overshared sites. Set default sharing links to specific people.

> [!TIP]
> Before connecting a site, ask one test user from outside the owning team to search it in SharePoint. Whatever they can find, they can ask the agent about. If that list surprises you, fix the site first.

## Principle 3: require sign-in

New agents default to **Authenticate with Microsoft**, which uses the user's Microsoft Entra ID account and makes permission-checked knowledge work. A maker can switch this to **No authentication**, so anyone with the link can chat.

For internal agents, keep authentication on. Admins can enforce this with a data policy that blocks the **Chat without Microsoft Entra ID authentication in Copilot Studio** connector. Makers can then only publish agents that require sign-in.

## Principle 4: choose knowledge types deliberately, and enforce it

Admins can use data policies in the Power Platform admin center to block whole types of knowledge source:

| To block makers from using | Block this connector |
| --- | --- |
| Files uploaded from a device | Knowledge source with documents in Copilot Studio |
| Files from SharePoint or OneDrive | Knowledge source with SharePoint and OneDrive in Copilot Studio |
| Public websites | Knowledge source with public websites and data in Copilot Studio |

Note the trap in the first row: blocking **documents** stops local uploads only. It doesn't stop files added from SharePoint or OneDrive.

Keep **Web Search** and general knowledge off unless the agent's purpose needs them. They don't leak internal data, but they let the agent answer from sources you don't control, and Microsoft warns that general knowledge increases the risk of incorrect answers.

## Principle 5: tools act as someone; decide who

Knowledge only reads. **Tools** (connectors, flows, HTTP requests) can also change things, and they run with a connection that belongs to someone:

- **With the user's credentials,** each person can only do what they could do themselves. Copilot Studio lets makers set tools to use the user's credentials by default.
- **With the maker's credentials** or a shared account, every user acts with that account's rights. That's sometimes intended, but it must be a decision, not an accident.

Prefer user credentials for any tool that reads personal or restricted data, or that writes anything. When a shared connection is genuinely needed, limit what the tool can do. Put it behind a topic that asks for confirmation. Log its use.

Admins can also use data policies to block connectors as tools, block HTTP requests, and block event triggers, which limits what autonomous agents can do without a person in the loop.

## Principle 6: check before and after publishing

- **Security scan.** Copilot Studio flags risky configurations to the maker before publishing, such as changed security defaults and potential data exfiltration paths in knowledge and tools. Treat every warning as a question to answer, not a box to click past.
- **Sensitivity labels.** For SharePoint knowledge, makers and users can see the highest sensitivity label of the sources used in an answer, and the label on each reference.
- **Sharing limits.** Admins can set sharing rules, including a maximum number of viewers per agent, and stop makers from sharing with whole security groups.
- **Audit.** Maker and agent activity is recorded in Microsoft Purview audit logs, and can be monitored in Microsoft Sentinel.

## Checklist

- Restricted content is connected from SharePoint or Dataverse, never uploaded.
- Connected SharePoint sites have owners and no legacy oversharing.
- Internal agents require sign-in, enforced by data policy.
- Knowledge types, Web Search and general knowledge are chosen deliberately.
- Tools use the user's credentials unless a shared account is a documented decision.
- Security scan findings are resolved before publishing, and sharing is limited to the intended audience.

The controls follow Microsoft's documented security and governance features for Copilot Studio as of September 2026. The principles and their order are our own recommendations.

## Sources

- [Key concepts: Copilot Studio security and governance (Microsoft Learn)](https://learn.microsoft.com/microsoft-copilot-studio/security-and-governance)
- [Configure data policies for agents (Microsoft Learn)](https://learn.microsoft.com/microsoft-copilot-studio/admin-data-loss-prevention)
- [Secure your Copilot Studio projects (Microsoft Learn)](https://learn.microsoft.com/microsoft-copilot-studio/guidance/sec-gov-phase3)
- [Optimizing SharePoint content for Employee Self-Service agents (Microsoft Learn)](https://learn.microsoft.com/microsoft-365/copilot/employee-self-service/optimization-sharepoint)
- [Add unstructured data as a knowledge source (Microsoft Learn)](https://learn.microsoft.com/microsoft-copilot-studio/knowledge-add-unstructured-data)
