---
title: "Files and attachments in flows: email attachments, Forms uploads and list attachments to SharePoint"
slug: files-and-attachments-in-flows
type: TUTORIAL
technology: POWER_AUTOMATE
topic: triggers-and-design
excerpt: "Save email attachments, Microsoft Forms uploads and SharePoint list attachments into a library folder. The trigger settings that matter, how to skip signature images, why .msg attachments don't show up, and the fixes for empty files and 400 Bad Request."
searchPhrase: "save email attachments to sharepoint"
---
Most file flows, such as saving email attachments to SharePoint, come down to the same move: **get a file's name and content from one place, and create a file with them somewhere else.** The tricky part is getting the content, which differs by source. Here are the three sources people ask about most.

> [!ANSWER] Quick answer
> 1. [Every save needs a folder, a file name with its extension, and the content itself](#the-pattern): empty content fails with **400 Bad Request**.
> 2. [For email attachments, set **Include Attachments** to **Yes**](#1-email-attachments-to-a-sharepoint-folder) in the trigger, or their content is empty.
> 3. [Loop over the attachments](#1-email-attachments-to-a-sharepoint-folder) with **Apply to each**, and **Create file** for each one.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026.

## The pattern

Every "save it somewhere" action, such as SharePoint **Create file** or OneDrive **Create file**, needs:
- a **folder path**;
- a **file name**, including its extension;
- the **file content** itself, not a link to the file.

If the content is empty, the action fails, usually with **400 Bad Request**. Most of the fixes below are about making sure the content is really there.

## 1. Email attachments to a SharePoint folder

1. Trigger: **When a new email arrives (V3)**, or **When a new email arrives in a shared mailbox (V2)**.
2. In the trigger's advanced settings:
   - **Include Attachments: Yes.** This is the important one. With **No**, the trigger still lists the attachments' names, but their **content is empty**, and **Create file** fails with 400 Bad Request.
   - **Only with Attachments: Yes**, if the flow is only about attachments.
3. Add **Apply to each** over the trigger's **Attachments**.
4. Inside it, add SharePoint **Create file**:
   - **File Name:** the attachment's **Name**;
   - **File Content:** the attachment's **Content**.

### Skip signature images

Logos and images in email signatures are attachments too, marked **Is Inline**. To save only real attachments, put a **Filter array** before the loop: keep items where `isInline` is equal to `false`. Then loop over the filtered list.

```text
@equals(item()?['isInline'], false)
```

### Avoid name clashes

Two emails can both carry `invoice.pdf`. Make each name unique, for example by putting the received date in front:

```text
concat(formatDateTime(triggerOutputs()?['body/receivedDateTime'], 'yyyyMMdd-HHmmss'), '-', items('Apply_to_each')?['name'])
```

### Limits

- The email triggers **skip** any email larger than **50 MB**, or your Exchange admin's limit if that's lower. They can also skip protected emails.
- The connector handles at most **49 MB** of email content.

## 2. Emails attached to emails (.msg, .eml) and invitations (.ics)

An email or meeting attached to another email is an **item attachment**, not a file. The Office 365 Outlook connector **doesn't return item attachments**: the trigger shows the email has an attachment, but the list is empty.

Your options:
- **Ask senders to zip them.** EML, MSG and ICS files inside a **.zip** come through as normal file attachments.
- **Save the whole email instead** with **Export email (V2)**, which returns the email as an **.eml** file you can save with **Create file**.
- **Use Microsoft Graph** through the **HTTP with Microsoft Entra ID** connector to read item attachments. This is for experienced makers; see Microsoft's connector notes.

## 3. Microsoft Forms uploads to a SharePoint folder

A Forms file-upload answer isn't a file. It's **text containing JSON** that describes the uploaded files: their name, link and ID.

1. Trigger: **When a new response is submitted**. Then add **Get response details** for the same form.
2. Submit one test response **with a file**, open the run, and copy the upload question's output.
3. Add **Parse JSON**. For **Content**, choose the upload question's answer, select **Generate from sample**, and paste what you copied.
4. Add **Apply to each** over the **Parse JSON** body, because one question can accept several files.
5. Inside it:
   - **Get file content** (OneDrive for Business) with the file's **id**;
   - SharePoint **Create file** with the file's **name** and the content from step 5's first action.

> [!TIP]
> Only want the first file? Skip the loop and use `first(body('Parse_JSON'))?['id']`, the expression Microsoft's own Forms example uses.

## 4. SharePoint list item attachments to a library

List attachments need two calls:

1. **Get attachments** for the item. This returns a list of names and **file identifiers**.
2. **Apply to each** attachment:
   - **Get attachment content**, using the **File identifier**;
   - **Create file** with the attachment's name and that content.

Going the other way, **Add attachment** puts a file onto a list item.

## When it goes wrong

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| **400 Bad Request** on Create file, with an email trigger | **Include Attachments** is **No**, so the content is empty | Set it to **Yes** |
| Created files are 0 bytes or won't open | You passed a link, an ID or text instead of the file content | Pass the **Content** output of a "get content" action |
| 400 Bad Request with a strange file name | The name contains characters SharePoint doesn't allow | Clean the name with `replace()` before **Create file** |
| `.msg` or `.eml` attachments missing | Item attachments aren't returned by the connector | Zip them, export the email, or use Graph (section 2) |
| Some emails never trigger the flow | Over 50 MB, or protected | Check the message size and protection |
| An approval rejects the attachment | Approval attachments need **base64** content | Most file actions already return it; for your own text, use `base64()` |

## Sources

- Microsoft Learn: [Office 365 Outlook connector: attachments, item attachments, limits and triggers](https://learn.microsoft.com/connectors/office365/)
- Microsoft Learn: [Issues triggering emails with attachments from a shared mailbox](https://learn.microsoft.com/troubleshoot/power-platform/power-automate/flow-run-issues/issues-triggering-emails-with-attachments-from-shared-mailbox)
- Microsoft Learn: [Common ways to use a form in a flow: find the uploaded file](https://learn.microsoft.com/power-automate/forms/popular-scenarios#use-a-json-schema-to-find-the-uploaded-file)
- Microsoft Learn: [SharePoint connector actions: Get attachments, Get attachment content, Create file](https://learn.microsoft.com/sharepoint/dev/business-apps/power-automate/sharepoint-connector-actions-triggers#sharepoint-actions)
- Microsoft Learn: [Cloud flow error code reference: BadRequest](https://learn.microsoft.com/power-automate/error-reference#connector-and-api-errors)
- Microsoft Learn: [Common errors creating approvals: attachments](https://learn.microsoft.com/troubleshoot/power-platform/power-automate/approvals/common-errors-creating-and-assigning-flow-approvals)
