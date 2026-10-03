---
title: "Your first agent: instructions, knowledge and testing"
slug: your-first-agent
type: TUTORIAL
technology: COPILOT_STUDIO
topic: build-your-agent
excerpt: "Build a Copilot Studio agent that answers questions from your own content, and test it properly before anyone else sees it. Instructions that work, knowledge that's scoped, and a repeatable test set."
---
> [!NOTE]
> **As of September 2026.** Copilot Studio changes often. This tutorial describes agents built with the **standard harness**, the long-standing building experience. Microsoft is also rolling out a new experience built on the GitHub Copilot harness, where some screens and names differ. Check Microsoft Learn for the version you see.

It takes minutes to create an agent in Copilot Studio and much longer to make one people can trust. The difference is almost never the model. It's three things you control:

- **Clear instructions:** what the agent is for, and how it should behave.
- **Scoped knowledge:** where its answers come from.
- **Real testing:** before anyone else sees it.

This tutorial builds a simple internal agent, an IT help agent that answers questions from an IT support SharePoint site, and covers each of the three properly.

## Step 1: create the agent

Sign in to Copilot Studio and choose the environment your organisation uses for agents. Then either:

- **Describe it in your own words** (up to 1,024 characters). Copilot Studio drafts a name, description and instructions, and suggests knowledge and tools. You can accept, edit or dismiss each suggestion.
- **Create a blank agent** and write everything yourself.

Describing is quicker; blank gives you more control. Either way, the result lands on the agent's **Overview** page, where you'll do the rest.

Give the agent a **name** and **description** that say exactly what it does, for example: "Answers questions about laptops, accounts and Wi-Fi from the IT support site." Copilot Studio's orchestrator uses names and descriptions to decide what to use, so vague descriptions lead to vague behaviour.

## Step 2: write instructions that work

Instructions tell the agent how to behave: its role, its tone, what it should do, and what to do when it doesn't know. Microsoft's guidance for writing them comes down to a few habits:

- **Structure them with Markdown:** headings, bullet lists, and numbered steps only where order matters.
- **Say what to do, with precise verbs,** such as "ask", "search" or "use". Don't only list what to avoid.
- **Name the knowledge and tools** the agent should use. In the instructions editor, type `/` to insert a reference to a specific knowledge source, tool, topic or variable.
- **Specify tone, length and format.** If you don't, the model guesses, and guesses vary.
- **Define your organisation's terms and acronyms.**

Here's a starting point for the IT help agent:

```text
# Role
You help employees with IT questions about laptops, accounts, Wi-Fi and printing.

# How to answer
- Use only the IT Support SharePoint site to answer.
- Keep answers short: a one-line summary, then up to five numbered steps.
- Include a link to the page you used.
- Use a friendly, plain tone. No jargon without explaining it.

# When you can't answer
- If the site doesn't cover the question, say so, and give the IT Service Desk
  contact from the "Contact us" page.
- Never guess at passwords, account names or security settings.

# Terms
- "SSPR" means self-service password reset.
```

> [!TIP]
> "When you can't answer" matters more than it looks. An agent without it tends to fill gaps with plausible-sounding text. An agent with it says "I don't know" and points to a person, which is what builds trust.

## Step 3: add knowledge, and keep it narrow

On the **Overview** page, select **Add knowledge** and choose **SharePoint**. Enter the URL of the IT support site.

Two things to know about SharePoint knowledge:

- **The agent answers with the user's permissions.** When someone asks a question, it searches only content that person can open. Keep the default sign-in setting, **Authenticate with Microsoft**, so it knows who they are.
- **Only some content is read.** The agent reads modern SharePoint pages and common documents, such as Word, PowerPoint and PDF. It doesn't use classic ASPX pages or modern pages built with SPFx components. New or changed content appears only after SharePoint's search index catches up.

Leave **Web Search** and general knowledge **off** for now. When they're on, the agent can answer from the public web or from the model's own training when your content doesn't cover a question. That makes answers richer but harder to verify. Microsoft's own documentation warns that general knowledge increases the risk of incorrect answers. Turn them on later, deliberately, if you decide you need them.

## Step 4: test in the test pane

Select **Test** to open the **Test your agent** pane, and ask the questions real users will ask, in the way they'll ask them:

- "My laptop won't connect to the office Wi-Fi."
- "how do i reset my password"
- "Can I install software myself?"
- Something the site doesn't cover, such as "What's the cafeteria menu?"

For each answer, check three things:

1. **Is it correct?** Compare it with the source page.
2. **Did it use the right source?** The citation should point to the page you'd expect.
3. **Did it follow the instructions?** Look at length, format, the link, and the "I don't know" behaviour.

The **activity map** shows the plan the agent made for each question, including which knowledge or tools it chose and how long each step took. When an answer is wrong, the map usually shows why: the wrong source, or no source at all. Use **Reset** to start a fresh conversation after you change instructions.

## Step 5: turn your questions into a test set

Testing in the chat pane checks one conversation at a time, and it's hard to repeat exactly. **Agent evaluation** runs a whole set of test cases at once, and runs the same set again after every change.

Create a test set from the **Evaluate** option in the test pane:

- **Where test cases come from.** You can write them yourself, generate them from the agent's instructions and knowledge, or reuse questions you asked in the test chat.
- **Text match** checks for exact or partial wording.
- **Similarity** compares the meaning of the answer with an expected answer.
- **Quality** judges relevance, groundedness, completeness and whether the agent correctly declined to answer.

Include the question the agent shouldn't answer. A good agent passes by declining.

> [!TIP]
> Save twenty to thirty real questions as your first test set, and run it before every publish. It's the fastest way to notice that a change to the instructions fixed one answer and broke three others.

## Step 6: publish to a small group first

When the test set passes, select **Publish**. Publishing needs a name, description and instructions, and it can't be done on a trial licence. After the first publish, every later change stays in draft until you publish again.

Then choose where people will use it on the **Channels** tab, for example **Microsoft Teams and Microsoft 365 Copilot**:

- **Start small.** Share it with a pilot group, not the whole organisation.
- **Expect an approval step.** Depending on your organisation's settings, an admin may have to approve the agent in the Microsoft 365 admin center before it appears in the Agent Store.

## Checklist

- The name and description say exactly what the agent does.
- Instructions set the role, the format, and what to do when the agent can't answer.
- Knowledge is limited to the sources the agent needs; web search and general knowledge are off unless chosen deliberately.
- Answers were checked for correctness, source and format in the test pane.
- A saved test set, including questions the agent should decline, runs before every publish.
- The first release goes to a pilot group.

The steps follow Microsoft's documented behaviour for Copilot Studio agents using the standard harness, as of September 2026. The example instructions and the test approach are our own recommendations.

## Sources

- [Create and delete agents (Microsoft Learn)](https://learn.microsoft.com/microsoft-copilot-studio/authoring-first-bot)
- [Write agent instructions (Microsoft Learn)](https://learn.microsoft.com/microsoft-copilot-studio/authoring-instructions)
- [Write effective instructions for declarative agents (Microsoft Learn)](https://learn.microsoft.com/microsoft-365/copilot/extensibility/declarative-agent-instructions)
- [Test your agent (Microsoft Learn)](https://learn.microsoft.com/microsoft-copilot-studio/authoring-test-bot)
- [About agent evaluation (Microsoft Learn)](https://learn.microsoft.com/microsoft-copilot-studio/analytics-agent-evaluation-intro)
- [Quotas and limits (Microsoft Learn)](https://learn.microsoft.com/microsoft-copilot-studio/requirements-quotas)
