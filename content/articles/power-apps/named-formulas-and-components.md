---
title: "Named formulas and components: a structure that scales"
slug: named-formulas-and-components
type: PATTERN
technology: POWER_APPS
topic: formulas-and-components
excerpt: "Most slow, fragile Power Apps canvas apps share one cause: everything lives in App.OnStart and copied controls. Here is a structure built on named formulas, user-defined functions and a component library."
searchPhrase: "power apps named formulas"
---
Canvas apps usually start small and grow by copying. A variable gets set in `App.OnStart`, a header gets copied onto every screen, a formula gets pasted into ten galleries. Two years later the app takes ages to open, nobody dares change the header, and fixing one bug means fixing it ten times.

This pattern keeps an app maintainable as it grows. It has three layers:

1. **Named formulas** for values the app calculates.
2. **User-defined functions** for logic it reuses.
3. **A component library** for UI it repeats.

## Layer 1: named formulas instead of App.OnStart

`App.OnStart` runs its statements in order, and the app can't show its first screen until they finish. Every `Set` and `ClearCollect` there adds to the load time, and a variable set there can be changed anywhere else in the app.

**Named formulas** in the `App.Formulas` property replace most of it. You write `name = expression`, and the name can be used anywhere. The examples in this article use Dataverse: the built-in **Users** table, and a **Tasks** table with a text column **Status**, a date column **DueDate** and a lookup column **Assigned To** that points to Users.

```powerfx
// App.Formulas
UserEmail = User().Email;
UserProfile = LookUp(Users, 'Primary Email' = UserEmail);
IsManager = UserProfile.Title = "Manager";
MyOpenTaskCount = CountIf(Tasks, Status = "Open" && 'Assigned To'.'Primary Email' = UserEmail);
```

Microsoft documents several advantages over variables:

- **Always available.** There is no start-up step that must run first, and named formulas can refer to each other in any order.
- **Always up to date.** When something a formula depends on changes, its value recalculates. `MyOpenTaskCount` stays right after a record is added, with no `Set` to remember.
- **Can't be overwritten.** The definition is the single source of truth. No other formula can change it.
- **Calculated only when needed.** A formula used only on the third screen isn't evaluated until that screen needs it, so the first screen appears sooner.

Microsoft reports that moving `Set` and `Collect` calls from `App.OnStart` to `App.Formulas` has cut Power Apps Studio load times by as much as 80% in some large apps.

> [!TIP]
> `CountIf` on Dataverse is delegated and exact up to 50,000 rows. On SharePoint, `CountIf` and `CountRows` aren't delegated, so they count only the first 500 (or 2,000) rows. A named formula doesn't change that; delegation rules still apply to what's inside it.

> [!NOTE]
> Named formulas can't be changed with `Set`, so they don't replace state. Keep `Set` for values the user actually changes, such as a selected filter or the current step of a wizard. Use named formulas for everything that is calculated from something else.

Because named formulas are never reassigned, drop the `var` prefix for them. `UserEmail` reads better than `varUserEmail` and says what it is.

## Layer 2: user-defined functions for repeated logic

When the same calculation appears in several places with different inputs, turn it into a **user-defined function**. It's defined in `App.Formulas` too, with typed parameters and a return type:

```powerfx
// App.Formulas
DaysOverdue(Due: Date): Number = Max(0, DateDiff(Due, Today(), TimeUnit.Days));

StatusColour(Status: Text): Color =
    Switch(Status,
        "Open", Color.SteelBlue,
        "Blocked", Color.Firebrick,
        "Done", Color.SeaGreen,
        Color.Gray);
```

Then every gallery uses the same rule:

```powerfx
// A label in a gallery
Text(DaysOverdue(ThisItem.DueDate)) & " days overdue"
```

A few rules from Microsoft's documentation to know before you rely on them:

- **Every parameter and the return value must have a type.**
- **Most functions can't have side effects.** A function that must change state, for example one that calls `Set` or `Notify`, wraps its body in curly braces and is a *behavior* function. Use those sparingly.
- **Recursion isn't supported yet.**
- **Record parameters are matched strictly.** A record you pass can't include fields the parameter type doesn't define.

## Layer 3: a component library for repeated UI

Anything that appears on more than one screen, such as a header, a navigation menu or a status badge, belongs in a **component**. Build components in a **component library** rather than inside a single app. Microsoft recommends this as the way to reuse components across apps:

- **Apps keep a dependency on the library**, and makers are told when a component has an update.
- **Libraries move between environments** in Dataverse solutions.
- **Components from a library also work on custom pages** in model-driven apps.

Design each component so its inputs and outputs are explicit:

- **Input properties** carry everything the component needs, such as `Title`, `Items` or `ThemeColour`.
- **Output properties** return what the host app needs back, such as the selected item.
- **Leave "Access app scope" off.** A component that reads global variables or controls directly is tied to one app. Library components can't access app scope at all, which is exactly the discipline you want.

> [!WARNING]
> If a consuming app edits a library component locally, Power Apps copies it into the app and the link to the library is removed. That copy no longer receives updates. Make changes in the library, and consider turning off **Allow customization** on components that must stay standard.

## Putting it together

A typical screen in this structure reads like this:

```powerfx
// Header component instance
cmpHeader.Title: "My tasks (" & MyOpenTaskCount & ")"
cmpHeader.UserName: UserProfile.'Full Name'

// Gallery items
Filter(Tasks, 'Assigned To'.'Primary Email' = UserEmail && Status = "Open")

// Badge inside the gallery
cmpStatusBadge.Label: ThisItem.Status
cmpStatusBadge.Fill: StatusColour(ThisItem.Status)
```

Each piece has one home. Change how a status colour is chosen, and every badge updates. Change the header, publish the library, and every app is offered the update.

## Moving an existing app over

You don't need a rewrite. Work in this order:

1. **Move the values in `App.OnStart` that never change after they're calculated** into `App.Formulas`, one at a time, testing as you go.
2. **Find the formulas you've pasted in several places.** Turn each into a user-defined function.
3. **Find the controls you've copied between screens.** Rebuild the most copied one as a library component, and replace the copies.
4. **Keep `Set` only for real state**, such as user choices and navigation context.

> [!TIP]
> Don't make `App.StartScreen` depend on a named formula that reads a global variable set in `App.OnStart`. Microsoft warns that this can cause a race in which the start screen isn't applied correctly.

## Checklist

- `App.OnStart` holds only true start-up actions, not calculated values.
- Calculated values are named formulas without a `var` prefix.
- Logic used in more than one place is a typed user-defined function.
- Repeated UI is a component in a library, with explicit input and output properties.
- Consuming apps don't edit library components locally.

The examples follow Microsoft's documented behaviour for named formulas, user-defined functions and component libraries. Some of these features have changed recently, so check that your Power Apps Studio version supports them before you rely on them.

## Sources

- [App object: the Formulas property (Microsoft Learn)](https://learn.microsoft.com/power-platform/power-fx/reference/object-app#formulas-property)
- [Build large and complex canvas apps (Microsoft Learn)](https://learn.microsoft.com/power-apps/maker/canvas-apps/working-with-large-apps)
- [Code optimization (Microsoft Learn)](https://learn.microsoft.com/power-apps/guidance/coding-guidelines/code-optimization)
- [Canvas component overview (Microsoft Learn)](https://learn.microsoft.com/power-apps/maker/canvas-apps/create-component)
- [Component library (Microsoft Learn)](https://learn.microsoft.com/power-apps/maker/canvas-apps/component-library)
