---
title: "People picker"
slug: people-picker
category: inputs-and-forms
summary: "Search your directory as people type, choose one person or several with avatar chips, Add me, suggested people, a limit, and everyone's emails ready for Outlook or Teams. Your app does the search, so it works with Office 365 Users or any list."
access: MEMBERS
version: 0.1.0
modernControls: yes
---
## When to use it

Use **lcsPeoplePicker** whenever your app asks for people: approvers, an owner, a manager, the team on a project. The classic combo box with Office 365 Users works, but every maker rebuilds the same pieces around it. This component has them:

- **Search as you type.** When the user pauses, the component runs `OnSearch(Query)` in your app. Your app searches Office 365 Users, Dataverse or a list, and puts the people in `Results`. The component holds no connection, so it pastes into any app.
- **Chips with avatars.** Each chosen person shows as a chip with their initials in a colour that stays the same for each name, and a button to remove them.
- **One person or several.** `MaxPeople` caps the list. `1` makes a single-person picker; `0` means no limit.
- **Add me.** Set `Me` to the signed-in user and an Add me button appears next to the label.
- **Suggested people** while the box is empty, such as the user's manager or the people they picked last time.
- **Outputs your app reads:** `People` (a table), `Emails` (separated by semicolons, ready for Outlook or Teams), `Count` and `IsValid`, plus `OnChange(ChosenEmails)`.
- A label, a hint, a required marker, your `AccentColor` and a `Dark` theme, like the Text field.

## Use it

The examples call it `pplApprovers` on your screen, with the **Office 365 Users** connection added to your app.

Search the directory as the user types:

```powerfx
// pplApprovers.OnSearch
ClearCollect(
    colFound,
    ShowColumns(
        Office365Users.SearchUserV2({ searchTerm: Query, top: 8 }).value,
        DisplayName, Mail, JobTitle
    )
)

// pplApprovers.Results
colFound
```

Turn on Add me, and suggest the user's manager:

```powerfx
// pplApprovers.Me
{ DisplayName: User().FullName, Mail: User().Email, JobTitle: "" }

// pplApprovers.Suggestions
ShowColumns(Table(Office365Users.Manager(User().Email)), DisplayName, Mail, JobTitle)
```

Up to three approvers, at least one:

```powerfx
// pplApprovers.MaxPeople
3

// pplApprovers.Required
true
```

Email everyone chosen:

```powerfx
Office365Outlook.SendEmailV2(pplApprovers.Emails, "Please approve", "A request is waiting for you.")
```

Save them in a SharePoint Person column that allows several people:

```powerfx
Patch(
    Requests, ThisItem,
    {
        Approvers: ForAll(
            pplApprovers.People,
            {
                Claims: "i:0#.f|membership|" & Lower(Mail),
                DisplayName: DisplayName,
                Email: Mail,
                Department: "",
                JobTitle: JobTitle,
                Picture: ""
            }
        )
    }
)
```

Show a record's people when it loads, and start again when another record is picked:

```powerfx
// pplApprovers.DefaultPeople
ForAll(galRequests.Selected.Approvers, { DisplayName: DisplayName, Mail: Email, JobTitle: JobTitle })

// galRequests.OnSelect
pplApprovers.Reset()
```

No connection yet? Try it with a small table of your own:

```powerfx
// Screen1.OnVisible
ClearCollect(
    colStaff,
    { DisplayName: "Avery Brooks", Mail: "avery.brooks@example.com", JobTitle: "Finance manager" },
    { DisplayName: "Sam Rivera", Mail: "sam.rivera@example.com", JobTitle: "Maker" }
)

// pplApprovers.OnSearch
ClearCollect(colFound, Search(colStaff, Query, DisplayName, Mail))
```

## Accessibility

- The search box is named by the label and says how many people are chosen ("Approvers, search people, 2 chosen").
- Each person in the results is a button named "Add" and their name. Each chip's remove button is named "Remove" and their name.
- Errors appear after the user changes the field, start with ⚠ and turn the box red, so they don't rely on colour alone.
- The avatars are decoration: the person's name is always written next to them.

## Known limits

- The search runs when the user pauses typing, through a hidden timer that checks the box every 0.4 seconds. In Studio, timers run only in Preview (F5), so search there.
- Power Apps can't draw outside a component, so the results list lives inside it. The component is 380 tall to hold four results; make it taller or shorter to suit your screen.
- The chips show two rows, two to a row, then scroll.
- Avatars show initials, not photos. Photos need a connection call for every person, which slows the search down.
- `Results`, `Suggestions`, `DefaultPeople` and `Me` need exactly the columns DisplayName, Mail and JobTitle. Use `ShowColumns` (or `ForAll` to rename) as the examples do.
- People are matched by email, ignoring case, so the same person can't be added twice.

## Change log

- **0.1.0:** first version: search through `OnSearch`, chips with avatars, `MaxPeople`, Add me, suggested people, `People`, `Emails`, `Count`, `IsValid`, `Clear` and `Reset`.
