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
