---
title: "Power Pages forms and lists always use table permissions"
slug: power-pages-table-permissions-enforced
kind: DEPRECATION
technology: POWER_PAGES
action: "Check table permissions and roles"
source: https://learn.microsoft.com/power-pages/important-changes-deprecations#table-permission-changes-for-forms-and-lists-on-new-websites
effective: 2026-06-01
replacement: "Table permissions with web roles"
---
From June 2026, Power Pages enforces table permissions on every form and list, whatever the Enable Table Permissions setting says. A form or list that worked because the setting was off now needs a table permission tied to the right web role. For anonymous access, use a table permission on the Anonymous Users role.
