# Component paste-tests (MVP-049)

How to test each library component in Power Apps Studio before publishing it. About 10 minutes each. Use your **developer environment**, never a production one.

## Every component

1. Create a blank canvas app (tablet is easiest).
2. **Settings → Updates:** check that **Modern controls and themes** and **Enhanced component properties** are on.
3. **Components** tab (next to Screens in the tree view) → **New component**. Select an empty part of Studio, so the new component isn't selected.
4. Copy the component's YAML (from `/admin/components` → the component → "Show the YAML to paste") and press **Ctrl+V**.
5. ✅ The component appears with the name shown below, and its **Properties** panel lists every property in its table.
   ❌ If there's an error, copy its text. Then right-click your empty "Component1" → **View code** → **Copy code** and send that too.
6. Insert it on **Screen1** (**Insert → Custom**) and rename the instance as shown below.
7. Work through its table. Then: **keyboard** (in preview, Tab to it and use Enter or Space), **resize** the instance, and **dark theme** if your app has one.
8. In `/admin/components`, record your **Studio version** (Settings → Support → Session details → "Studio version"). Then publish.

Tell the agent about anything that didn't work, with a screenshot if you can; it fixes the YAML, and the next release updates the draft (your test record is cleared, so test it again).

## Button: `lcsButton` → name it `MyButton`

The pilot checklist (`.nav-mock/components/pilot-test-checklist.md`) has the full table for 0.1.0: Label, Appearance, IconName, IsBusy, ClickCount, OnClick, FormatLabel, IsValidLabel, ResetCount. **0.2.0** adds a timer inside the component (`Timer@2.1.0`, our first), so check the paste first, then:

**Timers run only in preview (F5)** in Studio. Test the rows marked ⏱ in preview.

| Kind | Do this | Expect |
| --- | --- | --- |
| Input | Set `AccentColor` to `RGBA(124, 58, 237, 1)` | A purple Primary button; hover and pressed are darker purples |
| Input | Set `Theme` to `"Dark"`, `Screen1.Fill` to `RGBA(31, 31, 31, 1)`, then try each `Appearance` | Light text and borders; Secondary looks like Outline; Subtle has no light hover |
| Input | `IsBusy` true, in both themes | "Working…", greyed, not selectable |
| Input ⏱ | `RequireConfirm` true, `OnClick` set to `Notify("Deleted")`; select once | Red, a warning icon, "Select again" |
| Event ⏱ | Select again within 4 seconds | "Deleted"; the button is back to normal |
| Input ⏱ | Select once, then wait 4 seconds | Back to normal, no message |
| Output ⏱ | A label: `MyButton.IsArmed` | true only while it waits |


## Text field: `lcsTextField` → name it `txtEmail`

| Kind | Do this | Expect |
| --- | --- | --- |
| Input | Set `Label` to `"Work email"`, `Required` to `true` | The label reads "Work email *" |
| Input | Set `MaxLength` to `20` and type | The count shows "n/20" and stops at 20 |
| Input | Set `ErrorMessage` to `"Taken"` | "Taken" shows in red and the box turns red |
| Event | Set `OnChange` to `Notify(Value)`; type, then click away | A message with the text, once you leave the box |
| Output | Add a label: `txtEmail.Value & " / " & txtEmail.IsValid` | It updates as you type |
| InputFunction | Set `Validate` to `If(IsMatch(Text, Match.Email) \|\| IsBlank(Text), "", "Enter an email")`; type "abc" and leave | "Enter an email" shows |
| Action | A button with `txtEmail.Reset()` | The box goes back to `DefaultValue` and the error clears |
| Required | Clear the box and leave it (with `ErrorMessage` empty) | "This field is required." |

**0.3.0:** `Format`. Type, then leave the box (Tab), for each:

| Format | Type | Expect |
| --- | --- | --- |
| `"Email"` | `sam@` | "⚠ Enter an email address like name@example.com." |
| `"Phone"` | `call me` | "⚠ Enter a phone number with digits, spaces and + ( ) -." |
| `"Number"` | `3.5.1` | "⚠ Enter a number, such as 42 or 3.5." |
| `"Url"` | `example.com` | "⚠ Enter a web address that starts with https://." |
| `"PostalCodeCA"` | `k1a 0b1`, then `12345` | No error, then "⚠ Enter a postal code like K1A 0B1." |
| `"ZipCodeUS"` | `12345-6789`, then `1234` | No error, then "⚠ Enter a ZIP code like 12345 or 12345-6789." |
| Any | Empty box, `Required` off | No error; `IsValid` is true |
| Any | A bad value; label `txtEmail.IsValid` | false |

If Studio rejects a pattern, copy the error: Power Fx accepts only part of regular expression syntax.

## Dialog: `lcsDialog` → name it `dlgDelete`

Set the instance's **Width** to `Parent.Width`, **Height** to `Parent.Height`, and keep it last in the tree view.

| Kind | Do this | Expect |
| --- | --- | --- |
| Action | A button with `dlgDelete.Open()` | The screen dims and the dialog shows |
| Event | Set `OnConfirm` to `Notify("Deleted")`; open it and select **Delete** | It closes, then "Deleted" |
| Event | Set `OnCancel` to `Notify("Kept")`; open it and select **Cancel** | It closes, then "Kept" |
| Output | A label: `dlgDelete.IsOpen & " / " & dlgDelete.Result` | "true / " while open; "false / Confirmed" or "false / Cancelled" after |
| Input | Set `CancelText` to `""` | One button only (an alert) |
| Action | `dlgDelete.Close()` from a timer or another button while open | It closes with no answer |
| Clicks | While it's open, click where a screen button is behind the dimmed area | Nothing behind it is clicked |

## Toast: `lcsToast` → name it `tstMain`

| Kind | Do this | Expect |
| --- | --- | --- |
| Action | A button with `tstMain.Show("Saved.", "Success")` | A green bar with ✓ |
| Action | Try `"Info"`, `"Warning"`, `"Error"` and `"Other"` | Blue, amber, red; "Other" shows as Info |
| Input | Set `ActionText` to `"Undo"` | An Undo button on the bar |
| Event | Set `OnAction` to `Notify("Undo")`; select **Undo** | The bar closes, then "Undo" |
| Event | Set `OnDismiss` to `Notify("Closed")`; select the ✕ | The bar closes, then "Closed" |
| InputFunction | Set `FormatMessage` to `Kind & ": " & Message` | "Success: Saved." |
| Output | A label: `tstMain.IsOpen & " / " & tstMain.CurrentKind` | Matches what's showing |
| Action | `tstMain.Hide()` | It closes, without OnDismiss |

**0.2.0** adds a timer (`Timer@2.1.0`) and a collection inside the component.

**Timers run only in preview (F5)** in Studio. Test the rows marked ⏱ in preview.

| Kind | Do this | Expect |
| --- | --- | --- |
| Input ⏱ | Leave `Duration` at 6; Show a message | It closes by itself after about 6 seconds |
| Input ⏱ | `Duration` 0 | It stays until ✕ |
| Action ⏱ | Select the Show button three times quickly | The first message, with "(2 more)"; each closes into the next |
| Output | A label: `tstMain.QueueCount` | 2, then 1, then 0 |
| Action | `tstMain.Hide()` with messages queued | It closes and the queue is empty |
| Input | `Theme` `"Dark"` on a dark screen; Show each kind | Dark bars with light text |
| Input | `AccentColor` purple; Show an `"Info"` message | A purple border and a light purple tint |


## Tabs: `lcsTabs` → name it `tabsRequest`

| Kind | Do this | Expect |
| --- | --- | --- |
| Input | Set `Items` to `["Overview", "Details", "History"]` and `DefaultTab` to `"Details"` | Three tabs, Details selected |
| Input | Set `Look` to `"Filled"`, then `"Subtle"`, `"Transparent"` | The look changes |
| Output | A label: `tabsRequest.SelectedTab` | It follows your clicks |
| Event | Set `OnChange` to `Notify(Tab)` | A message with the new tab's name |
| Action | A button with `tabsRequest.SelectTab("History")` | History is selected |
| OutputFunction | In Screen1.OnVisible: `Set(gblTabs, tabsRequest.ItemsFromText("Open, Waiting, Done"))`, then set `Items` to `gblTabs` | Three tabs: Open, Waiting, Done |
| Keyboard | Tab to the tabs, then the arrow keys | The selection moves |

**0.2.0:**

| Kind | Do this | Expect |
| --- | --- | --- |
| Input | `Counts` to `Table({Tab: "Details", Count: 3})` | The tab reads "Details (3)" |
| Output | Select Details; the `SelectedTab` label | "Details", without the count |
| Event | `OnChange` to `Notify(Tab)`; select Details | "Details", without the count |
| Input | Change the count while Details is selected | The number changes; Details stays selected |
| Input | `HiddenTabs` to `"History"` | Two tabs |


## Empty, loading and error states: `lcsStates` → name it `stsRequests`

| Kind | Do this | Expect |
| --- | --- | --- |
| Input | Set `State` to `"Empty"`, `"Loading"`, `"Error"`, then `""` | The circle, the spinner, the red "!", then nothing |
| Input | Leave `Title` and `Message` empty | The default text for each state |
| Input | Set `ActionText` to `"Try again"` with `State` `"Error"` | An outline button |
| Event | Set `OnAction` to `Notify(State)`; select the button | "Empty" or "Error" |
| Output | A label: `stsRequests.IsShowing` | true for the three states, false for `""` |
| OutputFunction | A label: `stsRequests.StateFor(false, true, 3)` | "Error" |

**0.2.0:**

| Kind | Do this | Expect |
| --- | --- | --- |
| Input | `State` `"Skeleton"`, `Title` `"Loading requests…"` | A small grey line and four grey placeholder rows |
| Input | `SkeletonRows` 2, then 12 | Two rows; then as many as fit (four) |
| Input | `AccentColor` purple; `State` `"Loading"`, then `"Empty"` | A purple spinner; a purple button |
| Input | `Theme` `"Dark"` on a dark screen, each state | Light text, dark circles and rows |
| Output | `stsRequests.IsShowing` with `"Skeleton"` | true |

## Date and time picker: `lcsDatePicker` → name it `dtpDue`

New controls for this library: `ModernDatePicker@1.0.0` and `ModernDropdown@1.0.0`. Check the paste first.

| Kind | Do this | Expect |
| --- | --- | --- |
| Input | Leave `Mode` at `"Date"`; open the calendar and pick a day | The date shows as "Mon d, yyyy" |
| Event | `OnChange` to `Notify(Text(Start, "mmm d, yyyy"))`; pick a day, then a quick pick | A message each time |
| Input | `ShowPresets` true; select Today, Tomorrow, In a week | The date changes to each |
| Input | `Mode` `"DateTime"`; pick a date and a time | A time list beside the date; `Value` (in a label) has the time |
| Input | `TimeStep` 30, `Use24Hour` true | Times every 30 minutes, 00:00 to 23:30 |
| Input | `Mode` `"DateTime"`, `ShowTimeZone` true | The hint ends with your time zone, such as "(UTC-6)" |
| Input | `Mode` `"Range"`; pick an end before the start | "⚠ The end date must be on or after the start date." |
| Input | `Mode` `"Range"`, select This week | Monday to Sunday; `Days` 7 |
| Input | `BlockWeekends` true; pick a Saturday | "⚠ Choose a weekday. Weekends aren't available." |
| Input | `BlockWeekends` true, `Mode` `"Range"`; select This week | Monday to Friday (quick picks skip weekends) |
| Input | `BlockedDates` to `[Date(2026, 12, 25)]`; pick that day | "⚠ That day isn't available. Choose another." |
| Input | `MinDate` `Today()` | Days before today are greyed out |
| Input | `Required` true; pick a date, then clear it | "⚠ Choose a date." |
| OutputFunction | A label: `dtpDue.WorkingDays(Date(2026, 3, 2), Date(2026, 3, 8))` | 5 |
| Action | A button: `dtpDue.SetDates(Date(2026, 1, 5), Date(2026, 1, 9))` | The field shows those dates |
| Action | A button: `dtpDue.Reset()` | Back to the defaults, no error |
| Input | `Theme` `"Dark"` on a dark screen; `AccentColor` purple | Light text, a purple calendar |

## People picker: `lcsPeoplePicker` → name it `pplApprovers`

New for this library: `TextInputType.Search` and `TriggerOutput.Delayed` on the modern text input, and `WrapCount` and `AccessibleLabel` on a gallery. Check the paste first. If Studio rejects the action named `Reset` (the Date picker has one too), tell me and I'll rename both.

Set up a test table first, so no connection is needed: `Screen1.OnVisible` to `ClearCollect(colStaff, {DisplayName: "Avery Brooks", Mail: "avery.brooks@example.com", JobTitle: "Finance manager"}, {DisplayName: "Jordan Lee", Mail: "jordan.lee@example.com", JobTitle: "Product owner"}, {DisplayName: "Priya Nair", Mail: "priya.nair@example.com", JobTitle: "Developer"})`, then `OnSearch` to `ClearCollect(colFound, Search(colStaff, Query, DisplayName, Mail))` and `Results` to `colFound`. Search only in Preview (F5): timers don't run in the editor.

| Kind | Do this | Expect |
| --- | --- | --- |
| Event | Type `an`, then pause | After a moment, Jordan Lee shows, with a coloured circle of initials and "Product owner · jordan.lee@example.com" |
| Input | Type `a` only | "Type at least 2 characters to search." |
| Input | Type `zz`, then pause | "No one found for "zz"." |
| Event | `OnChange` to `Notify(ChosenEmails)`; select Jordan Lee | A chip for Jordan Lee, the box empties, a message with jordan.lee@example.com |
| Event | Select the chip's ✕ | The chip goes, and a message shows the emails left |
| Input | `Me` to `{DisplayName: User().FullName, Mail: User().Email, JobTitle: ""}` | Add me shows next to the label; selecting it adds you, then Add me hides |
| Input | `Suggestions` to `colStaff`; empty the box | "Suggested" with the first three people not already chosen |
| Input | `MaxPeople` 3; add three people | The box hides; "That's the most this field allows (3)." |
| Input | `MaxPeople` 1; add one person | One chip across the width, the box hides, no limit message |
| Input | `Required` true; add someone, then remove them | "⚠ Choose at least one person." and a red box; `IsValid` (in a label) false |
| Output | A label: `pplApprovers.Emails & " / " & pplApprovers.Count` | The emails separated by semicolons, and the count |
| Input | `DefaultPeople` to `FirstN(colStaff, 2)` | Two chips when the screen loads |
| Action | Add a third person, then a button: `pplApprovers.Reset()` | Back to the two defaults |
| Action | A button: `pplApprovers.Clear()` | No chips, an empty box |
| Input | `Theme` `"Dark"` on a dark screen; `AccentColor` purple | Light text, dark chips, a purple focus line |
| Connection | With Office 365 Users: `OnSearch` from the guide (`SearchUserV2` with `ShowColumns`) | Real people from your directory |

## Pagination: `lcsPagination` → name it `pgOrders`

New for this library: a gallery of buttons seven to a row (`WrapCount`), the button icons `ChevronLeft`, `ChevronRight`, `ArrowPrevious` and `ArrowNext`, and 40-pixel-wide modern buttons. Check the paste first, and that a page number fits its button.

Set up first: `Screen1.OnVisible` to `ClearCollect(colOrders, ForAll(Sequence(312), {Title: "Order " & (1000 + Value)}))`, `pgOrders.TotalItems` to `CountRows(colOrders)`, and a gallery's `Items` to `LastN(FirstN(colOrders, pgOrders.LastRow), pgOrders.RowsOnPage)` with `ThisItem.Title` in a label.

| Kind | Do this | Expect |
| --- | --- | --- |
| Input | Nothing else | Pages 1 2 3 4 5 … 32, page 1 filled; "1–10 of 312 items"; the gallery shows Order 1001 to 1010; First and Previous grey |
| Event | `OnPageChange` to `Notify("Page " & NewPage & " of " & pgOrders.PageCount)`; select 5 | "Page 5 of 32"; 1 … 4 5 6 … 32; Order 1041 to 1050 |
| Input | Select Last page | Page 32; "311–312 of 312 items"; two orders; Next and Last grey |
| Input | Rows per page 50 | Back to page 1; 7 pages; 1–50 |
| Input | `ItemLabel` `"orders"`, `DefaultPageSize` 25, `PageSizes` `"10,25,50,100"` | 13 pages, "1–25 of 312 orders" |
| Input | `Compact` true | "Page 1 of 32" between the arrows, no page numbers |
| Input | `ShowFirstLast`, `ShowSummary` and `ShowPageSize` false | Only the arrows and the numbers; the component is 40 tall |
| Input | `TotalItems` 42 | Pages 1 to 5, no ellipses |
| Input | `TotalItems` 0 | "No items"; every arrow grey |
| Action | A button: `pgOrders.GoTo(20)` | Page 20 (no message: GoTo doesn't run OnPageChange) |
| Action | A button: `pgOrders.Reset()` | Page 1, 10 rows per page |
| Input | `Theme` `"Dark"` on a dark screen; `AccentColor` purple | Light text, the current page purple |

## Data table: `lcsDataTable` → name it `dtOrders`

New for this library, so check the paste first: `ModernCheckbox@1.0.0` (the YAML name is our best reading; if Studio rejects it, tell me, or set `Selectable` to false); `JSON()` of a colour inside the progress bar's picture; the button icon `MoreHorizontal`; and `BorderThickness` on a container. It pastes with four sample rows, so it shows something at once.

| Kind | Do this | Expect |
| --- | --- | --- |
| Input | Nothing else | Four orders: bold order numbers, blue/green/amber/grey status pills, a segmented progress bar, due dates, red/amber/green priority pills |
| Event | `OnRowSelect` to `Notify("Open " & RowId)`; select a row (not its checkbox or menu) | "Open 1002" |
| Input | Select the ⋯ on a row | A small menu opens in the row: View, Edit, Delete; the ⋯ turns into ✕ |
| Event | `OnRowAction` to `Notify(Action & " " & RowId)`; choose Edit | "Edit 1001"; the menu closes |
| Event | `OnSort` to `Notify(ColumnNumber & " " & Descending)`; select Customer, then again | "2 false", then "2 true"; the header shows ↑ then ↓ |
| Input | Tick two rows, then the header box | Rows tint in the accent colour; the header box selects all |
| Input | `BulkActions` `"Approve,Reject"` | "Select rows", Approve and Reject greyed; tick a row: "1 selected", the buttons work, Clear selection appears |
| Event | `OnBulkAction` to `Notify(Action & ": " & RowIds)`; tick two, select Approve | "Approve: 1001;1003" |
| Input | Select Cards, then List in the switch | Cards two or three across with pills, progress and "Due: …"; then a list with a coloured initial, pills and › |
| Event | `OnViewChange` to `Notify(NewView)` | "Cards", "List" |
| Input | `Density` `"Compact"` | 44-pixel rows |
| Input | `Loading` true | Grey placeholder rows |
| Input | `Rows` to `FirstN(dtOrders.Rows, 0)` | The empty state: an icon, "No items found" and the line under it |
| Action | Tick rows, then a button: `dtOrders.ClearSelection()` | No rows ticked |
| Input | `Theme` `"Dark"` on a dark screen; `AccentColor` purple | Light text, dark cards, purple progress and selection |

## Navigation shell: `lcsNavShell` → name it `navMain`

New for this library, so check the paste first: the modern button's `Align`, `PaddingLeft`, `VerticalAlign`, `PaddingTop` and `IconStyle`, and the Fluent icon names `Home`, `Cart`, `People`, `ChartMultiple`, `Settings` and `Navigation`. Then the big one: **setting the component's own X, Y, Width and Height from its outputs** (`navMain.ShellWidth` and so on). If Studio calls that a circular reference, tell me, and set Width to `240` and Height to `Parent.Height` instead.

Set `ScreenWidth` to `Parent.Width`, `ScreenHeight` to `Parent.Height`, and X, Y, Width and Height to `navMain.ShellX`, `ShellY`, `ShellWidth` and `ShellHeight`.

| Kind | Do this | Expect |
| --- | --- | --- |
| Input | Nothing else | A side menu on the left: "My app", Home marked (light blue, a bar on its left, a filled icon), Orders with a blue 3 |
| Event | `OnNavigate` to `Notify("Go to " & ItemKey)`; select Customers | "Go to customers"; Customers is marked |
| Input | `CurrentKey` `"reports"` | Reports is marked, whatever was selected |
| Event | `OnToggle` to `Notify(Collapsed)`; select the ☰ button | "true"; the menu shrinks to icons, Orders shows a small 3; hovering an icon shows its name |
| Output | A label: `navMain.ShellWidth` | 64 collapsed, 240 expanded |
| Output | A container with X, Y, Width and Height from `navMain.ContentX` … `ContentHeight` | It sits beside the menu and grows when you collapse it |
| Input | `HiddenKeys` `"reports"`, `DisabledKeys` `"settings"` | No Reports; Settings is greyed and does nothing |
| Input | `ScreenWidth` `390` | A bottom bar along the bottom: five icons with labels, the current one in a pale pill |
| Action | A button: `navMain.SetCollapsed(true)` | The side menu collapses |
| Input | `Theme` `"Dark"` on a dark screen; `AccentColor` purple | Light text on dark grey, a purple bar and badge |
| Keyboard | Tab through the menu | Each item and the ☰ button take focus; Enter selects |
