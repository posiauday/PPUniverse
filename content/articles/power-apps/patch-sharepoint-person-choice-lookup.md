---
title: "Patch a SharePoint Person column from Power Apps, plus Choice and Lookup columns"
slug: patch-sharepoint-person-choice-lookup
type: TUTORIAL
technology: POWER_APPS
topic: data-and-delegation
excerpt: "Power Apps Patch fails on a SharePoint Person column, a Choice or a Lookup because each needs a record, not text. Copy-ready formulas for every complex column, single and multi-select, plus the errors and how to read them."
searchPhrase: "power apps patch sharepoint person column"
---
A form saves fine with **SubmitForm**, but your own **Patch** fails, or seems to do nothing, as soon as it touches a SharePoint **Person**, **Choice** or **Lookup** column. The reason is the same every time: those are **complex** columns. Power Apps expects a **record** with the right fields, not the text you see on screen.

> [!ANSWER] Quick answer
> 1. [Choice](#2-choice-columns): `{ Status: { Value: "Approved" } }`
> 2. [Lookup](#3-lookup-columns): `{ Customer: { Id: 12, Value: "Contoso" } }`, with the ID from the other list.
> 3. [Person](#4-person-columns): a record with `Claims: "i:0#.f|membership|" & Lower(email)`, plus DisplayName, Email, Department, JobTitle and Picture.
> 4. [Still failing?](#1-see-the-real-error-first) Wrap Patch in `IfError` to see SharePoint's message. Easiest of all: a combo box on `Choices(List.Column)`, patching its `.Selected`.

> [!NOTE]
> Checked against Microsoft Learn on 8 October 2026. The examples use a list called `Requests`; use your own list and column names.

## 1. See the real error first

Patch rarely fails loudly. Wrap it so you see SharePoint's message:

```powerfx
IfError(
    Patch(Requests, Defaults(Requests), { Title: txtTitle.Value }),
    Notify("Save failed: " & FirstError.Message, NotificationType.Error)
)
```

The message usually names the column at fault, such as "Field 'Department' is required" or "The specified user could not be found".

## 2. Choice columns

A Choice column takes a record with a `Value` field.

```powerfx
Patch(Requests, ThisItem, { Status: { Value: "Approved" } })
```

**Safer:** take the record from the column's own choices, so a typo can't save a value that isn't on the list:

```powerfx
Patch(
    Requests, ThisItem,
    { Status: LookUp(Choices(Requests.Status), Value = "Approved") }
)
```

**Multi-select choice:** a table of those records.

```powerfx
Patch(Requests, ThisItem, { Tags: Table({ Value: "Urgent" }, { Value: "Finance" }) })
// or, from a combo box with Items = Choices(Requests.Tags):
Patch(Requests, ThisItem, { Tags: cmbTags.SelectedItems })
```

## 3. Lookup columns

A Lookup column takes a record with the **ID** of the item in the other list and its display **Value**.

```powerfx
Patch(Requests, ThisItem, { Customer: { Id: 12, Value: "Contoso" } })
```

If you have the customer's item from the other list, map it:

```powerfx
With(
    { c: LookUp(Customers, Title = "Contoso") },
    Patch(Requests, ThisItem, { Customer: { Id: c.ID, Value: c.Title } })
)
```

Or use a combo box with **Items** set to `Choices(Requests.Customer)`, which already returns `Id` and `Value`:

```powerfx
Patch(Requests, ThisItem, { Customer: cmbCustomer.Selected })
```

> [!TIP]
> Patching a LookUp result from the other list directly (`{ Customer: LookUp(Customers, …) }`) works for **Dataverse** lookups, not SharePoint ones. SharePoint needs the `Id` and `Value` record.

## 4. Person columns

A Person column takes a record that identifies the user by their **claims** string. Fill every field; send empty text for the ones you don't have.

```powerfx
Patch(
    Requests, ThisItem,
    {
        AssignedTo: {
            Claims: "i:0#.f|membership|" & Lower(User().Email),
            DisplayName: User().FullName,
            Email: User().Email,
            Department: "",
            JobTitle: "",
            Picture: ""
        }
    }
)
```

To pick someone else, the simplest is a combo box with **Items** set to `Choices(Requests.AssignedTo)`, then patch `cmbAssignee.Selected`. To search the whole directory instead, use the Office 365 Users connector and build the record from the result:

```powerfx
With(
    { u: cmbPeople.Selected },  // Items: Office365Users.SearchUserV2({ searchTerm: Self.SearchText }).value
    Patch(
        Requests, ThisItem,
        {
            AssignedTo: {
                Claims: "i:0#.f|membership|" & Lower(u.Mail),
                DisplayName: u.DisplayName,
                Email: u.Mail,
                Department: "",
                JobTitle: "",
                Picture: ""
            }
        }
    )
)
```

**Multi-person column:** a table of those records.

```powerfx
Patch(
    Requests, ThisItem,
    {
        Reviewers: ForAll(
            cmbReviewers.SelectedItems As r,
            {
                Claims: "i:0#.f|membership|" & Lower(r.Mail),
                DisplayName: r.DisplayName,
                Email: r.Mail,
                Department: "",
                JobTitle: "",
                Picture: ""
            }
        )
    }
)
```

> [!WARNING]
> The person must be a member of your organisation who can be found in the directory. A guest, a shared mailbox, or an email with a typo fails with "The specified user could not be found".

## 5. The simple columns, for completeness

| SharePoint column | What to patch | Example |
| --- | --- | --- |
| Single line of text | Text | `{ Title: txtTitle.Value }` |
| Number, Currency | A number, not text | `{ Amount: Value(txtAmount.Value) }` |
| Yes/No | `true` or `false` | `{ Paid: chkPaid.Checked }` |
| Date and Time | A date | `{ DueDate: dpDue.SelectedDate }` |
| Choice, Lookup, Person | A record (above) | `{ Status: { Value: "Open" } }` |
| Clear any of them | `Blank()` | `{ AssignedTo: Blank() }` |

## When it still fails

| Error or symptom | Check |
| --- | --- |
| "Field 'X' is required" | Every required column needs a value when you **create** an item, including **Title** |
| "The specified user could not be found" | The claims string: the `i:0#.f\|membership\|` prefix and a lowercase, correct email |
| "Invalid lookup value" or wrong item linked | The `Id` must be the ID in the **other** list, not this one |
| Saves a choice that isn't on the list | Use `LookUp(Choices(…), Value = …)` so only real choices can be saved |
| Nothing happens, no error | Wrap Patch in `IfError` (section 1), and check **Monitor** for the request |
| Works for you, fails for others | They need **Edit** permission on the list |

If you're filtering big lists to find the item to patch, see [Power Apps delegation and the 500-row limit](/learn/power-apps-delegation-500-rows).

## Sources

- Microsoft Learn: [Patch function](https://learn.microsoft.com/power-platform/power-fx/reference/function-patch)
- Microsoft Learn: [Choices function](https://learn.microsoft.com/power-platform/power-fx/reference/function-choices)
- Microsoft Learn: [IfError function](https://learn.microsoft.com/power-platform/power-fx/reference/function-iferror)
- Microsoft Learn: [Connect to SharePoint from a canvas app: data type mappings](https://learn.microsoft.com/power-apps/maker/canvas-apps/connections/connection-sharepoint-online#power-apps-data-type-mappings)
- Microsoft Learn: [Office 365 Users connector](https://learn.microsoft.com/connectors/office365users/)
