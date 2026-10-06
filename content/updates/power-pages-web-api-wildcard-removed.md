---
title: "Power Pages Web API no longer accepts * for table columns"
slug: power-pages-web-api-wildcard-removed
kind: RETIREMENT
technology: POWER_PAGES
action: "List Web API columns explicitly"
source: https://learn.microsoft.com/power-pages/important-changes-deprecations#wildcard-value--in-web-api-field-configuration
effective: 2026-09-14
replacement: "An explicit column list or the Power Pages Web API Columns view"
---
Since 14 September 2026, a Webapi/<table>/fields site setting of * no longer works on any Power Pages site, and Web API calls to those tables fail. New sites couldn't use it from August 2026. Replace * with the logical names of the columns your code uses, or use the Power Pages Web API Columns system view. An admin can request a short extension under Manage exemptions.
