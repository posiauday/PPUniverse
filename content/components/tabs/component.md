---
title: "Tabs and segmented control"
slug: tabs
category: navigation-and-layout
summary: "Tabs or a segmented control on the modern tab list, with the selected tab as an output, a change event, a SelectTab action and four looks, from one setting."
access: OPEN
version: 0.1.0
modernControls: yes
---
## When to use it

Use **lcsTabs** to split one screen into sections (Overview, Details, History), or as a **segmented control** that filters a list (Open, Waiting, Done). It wraps the modern tab list and adds what you'd otherwise rebuild each time:

- **SelectedTab**: the selected tab's text;
- **ItemsFromText(List)**: turns `"Open, Waiting, Done"` into tabs;
- **OnChange(Tab)**: runs when the user picks a different tab;
- **SelectTab(Tab)**: selects a tab from your app.

## Use it

Name it `tabsRequest` and set its tabs:

```powerfx
// tabsRequest.Items
["Overview", "Details", "History"]
```

Show each section only on its tab:

```powerfx
// cntOverview.Visible
tabsRequest.SelectedTab = "Overview"

// cntHistory.Visible
tabsRequest.SelectedTab = "History"
```

Set the tabs from text, such as a setting stored in a list. Keep it in a variable: an input that reads its own instance's outputs can cause a circular reference warning.

```powerfx
// Screen.OnVisible
Set(gblStatusTabs, tabsStatus.ItemsFromText("Open, Waiting, Done"))

// tabsStatus.Items
gblStatusTabs
```

Filter a gallery with a segmented control:

```powerfx
// tabsStatus.Look
"Filled"

// galRequests.Items
Filter(Requests, Status.Value = tabsStatus.SelectedTab)
```

Load data only when a tab opens:

```powerfx
// tabsRequest.OnChange
If(Tab = "History", ClearCollect(colHistory, Filter(History, RequestId = locId)))
```

Go back to the first tab after saving:

```powerfx
tabsRequest.SelectTab("Overview")
```

## Accessibility

- Set `AccessibleName` to what the tabs switch between, such as "Request sections". Screen readers read it with the tabs.
- The modern tab list supports the keyboard: Tab to it, then use the arrow keys.
- Keep tab names to one or two words.

## Known limits

- **ItemsFromText** is an output function, so it only uses its `List` parameter. That's how Power Apps function properties work.
- `SelectTab` and `DefaultTab` must match one of `Items` exactly.
- Two to seven tabs work best. The tab list doesn't scroll if there are more than fit.

## Change log

- **0.1.0:** first version, for testing in Power Apps Studio.
