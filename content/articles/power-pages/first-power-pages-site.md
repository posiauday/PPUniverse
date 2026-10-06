---
title: "Build your first Power Pages site on Dataverse"
slug: first-power-pages-site
type: TUTORIAL
technology: POWER_PAGES
topic: build-your-site
excerpt: "Create a Power Pages site that lists, creates and updates Dataverse records for signed-in visitors, with security set up properly from the first page instead of bolted on before launch."
searchPhrase: "build power pages site"
---
Power Pages lets you build an external website on the same Dataverse data your apps and flows use: a place where customers, partners or citizens can apply, register, report or check a status. This tutorial builds a small site that lets signed-in visitors submit requests and see only their own.

It follows Microsoft's documented steps, and adds the security decisions that are easy to skip when you're focused on getting the first page working.

## Before you start

- **Environment.** Create the site in a dedicated environment, not the default one. Microsoft advises against the default environment, which every user in the tenant shares, so data can leak between projects.
- **Licence or trial.** You need a Power Pages licence or trial. A trial gives you 30 days. When it ends, the site is suspended but not deleted straight away: you have seven days to convert it to production.
- **Visibility.** New sites are **private** by default. Only makers and the organisation users you grant access can see them. Keep it that way until you're ready to launch.

## Step 1: create the site

1. Go to Power Pages and choose your environment.
2. Select **Start with a template**. Preview the templates, choose one close to what you need (or a starter layout, or **Blank page**), and select **Choose this template**.
3. Check the site name and web address, then select **Done**.

Provisioning takes a few minutes. The **design studio** then opens. It has workspaces for:

- **Pages:** building and arranging pages.
- **Styling:** themes.
- **Data:** Dataverse tables, views and forms.
- **Set up:** site administration.
- **Security:** web roles, permissions and the security scan.

## Step 2: model the data

The example is a **Service Request** table. In the **Data** workspace, create the table with these columns:

| Column | Type | Notes |
| --- | --- | --- |
| Title | Text (primary name) | Shown in lists |
| Description | Multiple lines of text | |
| Status | Choice | Submitted, In progress, Resolved |
| Requested by | Lookup to **Contact** | Links each request to the visitor who made it |

The **Requested by** lookup matters. On a Power Pages site, every signed-in visitor is a **Contact** record. A lookup to Contact is what lets the site show each person only their own requests.

Then, in the same workspace:

- **Create a view** listing title, status and created date. The site's list component uses it.
- **Create a form** with Title and Description, then **save and publish** it. The site's form component uses it.

## Step 3: add the pages

Add three pages in the **Pages** workspace:

1. **My requests:** a **list** component, using your view.
2. **New request:** a **form** component in insert mode, using your form.
3. **Request details:** a form component in edit or read-only mode.

Link them up. Set the list's **Create** button to open **New request**, and its row link to open **Request details**.

Preview the site. The list is empty, even though records exist. That's expected: Power Pages blocks access to Dataverse data by default until you grant it.

## Step 4: grant access, narrowly

Access is granted with **table permissions**, which are assigned to **web roles**:

- **Authenticated Users:** every signed-in visitor.
- **Anonymous Users:** everyone who isn't signed in.

Select the list, choose **Permissions**, and create a table permission for **Service Request**:

- **Access type:** **Contact access**, using the **Requested by** relationship. Each visitor sees only records linked to their own contact.
- **Privileges:** **Read**, **Create** and **Write**. Not **Delete**, unless you want visitors to delete requests.
- **Web role:** **Authenticated Users**.

> [!WARNING]
> Microsoft's tutorials often use **Global** access to get data on screen quickly. Global access means every user in that web role can reach **every record** in the table. For anything personal or business-sensitive, use Contact, Account, Self or parent-child access instead, and treat anything granted to Anonymous Users as public.

## Step 5: protect the pages too

Table permissions protect the **data**; **page permissions** protect the **page**. Restrict **My requests**, **New request** and **Request details** to Authenticated Users. Microsoft's security guidance is explicit: hiding a page from the menu doesn't secure it.

## Step 6: check before going public

- **Run the security scan** in the **Security** workspace, and resolve what it finds.
- **Test as two different visitors.** Each should see only their own requests.
- **Test signed out.** The pages should send you to sign in, not show data.
- **Go public.** Only then switch **Site visibility** to **Public**. The site restarts, which takes a few minutes. Remember that from then on, edits are visible to visitors immediately.

## Checklist

- The site is in a dedicated environment, not the default one.
- Every table the site uses has a relationship to Contact or Account where access depends on the visitor.
- Table permissions use Contact, Account, Self or parent-child access; Global only for truly public data.
- Anonymous Users get no create, write or delete permissions unless the site is meant to accept public submissions.
- Every non-public page has page permissions.
- The security scan is clean, and access was tested with two accounts before going public.

The steps follow Microsoft's documented behaviour for Power Pages as of September 2026. The example table and the order of checks are our own.

## Sources

- [Create a site with Power Pages (Microsoft Learn)](https://learn.microsoft.com/power-pages/getting-started/create-manage)
- [Tutorial: Create, update and read Dataverse information on pages (Microsoft Learn)](https://learn.microsoft.com/power-pages/getting-started/tutorial-dataverse-website)
- [Tutorial: Display data securely on your site (Microsoft Learn)](https://learn.microsoft.com/power-pages/getting-started/tutorial-display-data-securely)
- [Apply security best practices to your Power Pages site (Microsoft Learn)](https://learn.microsoft.com/power-pages/security/security-best-practices)
- [Site visibility in Power Pages (Microsoft Learn)](https://learn.microsoft.com/power-pages/security/site-visibility)
