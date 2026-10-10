/**
 * Drafted team posts that start the conversation on each component's page
 * (MVP-053; docs/final-decisions.md, 2026-10-10, "Team posts start the
 * conversation on components"). Each is a real tip from the component's own
 * guide (content/components/<slug>/component.md, "Known limits") and a
 * question. They only fill the box on the component's admin page: nothing is
 * posted until an admin reads, edits and posts it. Keyed by the component's
 * slug; the same text rules as any comment apply (component-starters.test.ts).
 */
export const COMPONENT_STARTERS: Readonly<Record<string, string>> = {
  button: `Welcome! One tip first: the select-again-to-confirm wait runs on a timer, and Power Apps Studio only runs timers in preview (F5). Test it there; in the published app it always runs.

Which look are you using (Primary, Secondary, Outline or Subtle), and in which brand colour? If the paste fails or something behaves differently in your Studio version, tell us here with the version number.`,

  "data-table": `Welcome! A tip before you start: the table shows text, so turn numbers and dates into text in Rows, such as Text(DueDate, "mmm d"). And it draws every row you give it, so page big tables.

What are you showing in it: tasks, orders, requests? Tell us which view you use most (table, cards or list) and what's missing.`,

  "date-time-picker": `Welcome! Worth knowing: WorkingDays counts Monday to Friday only and can't read BlockedDates, so subtract your holidays in the app if you need them.

What do you use it for: leave requests, bookings, deadlines? If your region's dates or time zones behave unexpectedly, share the details here.`,

  dialog: `Welcome! One thing to know: a Power Apps component can't move keyboard focus into itself when it opens, so focus stays where it was. Keep the message short, with the buttons right under it.

Which kind are you using most: confirm, alert, form or danger with type-to-confirm? Ask here if a setup doesn't work the way you expect.`,

  fab: `Welcome! A tip: with SpeedDial on, the component is always as big as the open menu, and the button sits in its corner. The empty area lets taps through while the menu is closed, but leave room above it.

What's the main action on your screen: Add new, or something else? Share your speed-dial setups and questions here.`,

  "navigation-shell": `Welcome! Our favourite tip: each screen has its own copy of the menu, so keep it the same everywhere with one global table (gblMenu) in App.Formulas, and set Items to it.

How many screens does your app have, and does the bottom bar on phones fit them? Ask here about roles, badges or themes.`,

  pagination: `Welcome! Worth knowing: LastN(FirstN(...)) isn't delegable, so it works on collections and up to your app's data row limit (500 by default). For bigger tables, load each page yourself in OnPageChange.

What data source are you paging: SharePoint, Dataverse, SQL? Share how you load pages; it helps the next person.`,

  "people-picker": `Welcome! A tip: Results, Suggestions, DefaultPeople and Me need exactly the columns DisplayName, Mail and JobTitle, so use ShowColumns, or ForAll to rename, as the examples do.

Are you searching Office 365 Users or your own list? Tell us how it goes with a large directory, and ask anything here.`,

  states: `Welcome! One tip: keep the state in a variable rather than setting State straight from StateFor. An input that reads its own instance's outputs can cause a circular reference warning.

Which state do your lists hit most: empty, loading or error? Share what your empty-state messages say; good ones are worth copying.`,

  stepper: `Welcome! Worth knowing: CanLeaveStep runs for every step GoToStep passes, so keep it quick, with no data calls in it.

Is yours a form wizard, project stages or an approval chain? Tell us how many steps you have and whether horizontal or vertical works better for you.`,

  tabs: `Welcome! A tip: the modern tab list can't disable one tab, so hide it by name instead. And CountRows with Filter isn't delegable on large lists, so keep big counts in variables your app refreshes.

Tabs or segmented control: which look suits your app? Ask here if your counts or SelectTab don't behave as expected.`,

  "text-field": `Welcome! Worth knowing: Validate can only use its Text parameter. For checks that need other data, such as "is this email taken?", check in your app and pass the result in through ErrorMessage.

Which formats do you check most: email, phone, postal code? Share your own Validate formulas here; others will use them.`,

  toast: `Welcome! One tip: the toast closes itself on a timer, and Power Apps Studio only runs timers in preview (F5). In the published app it always runs.

What do you show in it: saves, errors, Undo? Remember screen readers don't announce it automatically, so for an important error also move attention to the field at fault. Questions welcome here.`,

  "tree-view": `Welcome! A tip: ExpandAll() opens only nodes whose children are already in Nodes. It doesn't run OnExpand, so it won't load children that aren't loaded yet.

What are you showing in it: folders, categories, an org chart? Tell us how deep your tree goes (it shows up to five levels) and ask anything here.`,
};

/** The drafted opener for a component, or an empty box when there's none. */
export function componentStarter(slug: string): string {
  return COMPONENT_STARTERS[slug] ?? "";
}
