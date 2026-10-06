---
title: "Power Pages Web API cheat sheet: setup, site settings, the wildcard change and error codes"
slug: power-pages-web-api-cheat-sheet
type: REFERENCE
technology: POWER_PAGES
topic: liquid-and-code
excerpt: "Everything to make /_api calls work: the site settings per table, why Webapi/<table>/fields = * stopped working on 14 September 2026 and how to fix it, the CSRF token wrapper, table permissions, what the Web API can't do, and every status and error code with its fix."
---
The Power Pages Web API lets your page scripts create, read, update and delete Dataverse rows through `/_api/…`, without a form. It's a **subset** of the Dataverse Web API, so the setup and limits differ. Here's all of it on one page.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026.

> [!WARNING]
> **Did your Web API calls start failing in September 2026?** Since **14 September 2026**, `Webapi/<table>/fields = *` (the wildcard) **no longer works on any site**. Requests to those tables fail until you list the columns. New sites couldn't use it from August 2026. Fix: see "Columns" below. An admin can request a one-time, short **extension** under **Manage exemptions** in the Power Platform admin center, but the change itself still has to be made.

## Turn it on for a table

Site settings, using the table's **logical name**, such as `contact`:

| Site setting | Value |
| --- | --- |
| `Webapi/contact/enabled` | `true` |
| `Webapi/contact/fields` | `fullname,emailaddress1,mobilephone`: the logical names your code uses |
| `Webapi/contact/UseFieldsFromView` | `true` (optional): also allows the columns shown in a public system view named **Power Pages Web API Columns**. Site version 9.8.8.x or later |
| `Webapi/error/innererror` | `true` while debugging only: adds inner error details to responses |

## Columns: replacing the wildcard

List **every** column your code touches, and only those:

| Where it appears in your code | Example | Allow |
| --- | --- | --- |
| A response you read | `result.fullname` | `fullname` |
| A create or update body | `{ emailaddress1: … }` | `emailaddress1` |
| `$select` | `$select=fullname,mobilephone` | both |
| `$filter` | `$filter=statuscode eq 1` | `statuscode` |
| `$orderby` | `$orderby=createdon desc` | `createdon` |
| `$expand` | `$expand=primarycontactid($select=fullname)` | the relationship and the nested columns |

- **System view option:** only columns **displayed** in the view count, from the **primary** table only. Columns used only for filtering or sorting in the view don't count. Changes take up to **five minutes**.
- **Lookups:** use the OData property name `_<column>_value`, for example `_primarycontactid_value`.
- **Help is available:** since 2 September 2026, the **Security Agent** (Security workspace → *Data Security* prompt) and the Power Pages plugin's `/migrate-webapi-selectall` skill suggest the columns for you. Review the suggestions, then test.

## Call it: the CSRF token

The user's session handles sign-in, but **every request needs a CSRF token** in the `__RequestVerificationToken` header. A shortened version of Microsoft's sample wrapper (the full sample also checks that the sign-in session is still valid):

```javascript
(function (webapi, $) {
  function safeAjax(ajaxOptions) {
    var deferredAjax = $.Deferred();
    shell.getTokenDeferred().done(function (token) {
      ajaxOptions.headers = ajaxOptions.headers || {};
      ajaxOptions.headers["__RequestVerificationToken"] = token;
      $.ajax(ajaxOptions).done(deferredAjax.resolve).fail(deferredAjax.reject);
    }).fail(function () { deferredAjax.rejectWith(this, arguments); });
    return deferredAjax.promise();
  }
  webapi.safeAjax = safeAjax;
})(window.webapi = window.webapi || {}, jQuery);
```

```javascript
webapi.safeAjax({
  type: "POST",
  url: "/_api/contacts",
  contentType: "application/json",
  data: JSON.stringify({ fullname: "Sample" }),
  success: function (res, status, xhr) { console.log(xhr.getResponseHeader("entityid")); }
});
```

- In URLs, use the **entity set name** (`/_api/contacts`). In site settings, use the **logical name** (`contact`). Mixing them up is the most common mistake.
- Operation names and URLs are **case-sensitive**.

## Security

- Every call follows **table permissions** through the user's **web roles**, and optionally **column permissions**. An anonymous caller needs an Anonymous Users role with the right table permission.
- Prefer the narrowest scope: Contact or Account scope, not Global.

## What it can't do

- **Configuration tables** (`adx_…`: web pages, site settings, web roles, table permissions, and so on) aren't available.
- **Dataverse actions and functions** can't be called.
- **No optimistic concurrency.** The Dataverse Web API's `If-Match`/ETag check (`412 Precondition Failed`) isn't in the Power Pages list of responses, so don't rely on it.
- It's meant for **your site's own pages**, not for integrating other apps or other Power Pages sites.
- **Licensing:** anonymous callers count toward anonymous capacity; signed-in callers need authenticated capacity.

## Status codes

| Code | Means | Usually fix |
| --- | --- | --- |
| **200 / 204** | Success (with or without data) | — |
| **400** | An invalid argument, such as **InvalidAttribute** | Check the column's logical name and type |
| **401** | **MissingPortalRequestVerificationToken** or **MissingPortalSessionCookie** | Use the token wrapper; check the session |
| **403** | A table or column permission is missing | Add the permission or column to the user's web role |
| **404** | The resource doesn't exist, **or the table isn't enabled** for the Web API | Check `Webapi/<table>/enabled` and the entity set name |
| **405** | Wrong method for the resource, such as PATCH on a collection | Target a single row: `/_api/contacts(<id>)` |
| **413** | Request too large | Send less per call |
| **500 / 501 / 503** | Unexpected error, not implemented, or service unavailable | Retry later; check whether the operation is supported |

## Error codes in the response body

| Code | Name | Fix |
| --- | --- | --- |
| `90040100` | InvalidAttribute | The column doesn't exist, so check the logical name |
| `90040101` | AttributePermissionIsMissing | The column isn't in `Webapi/<table>/fields`. This is the common one after the wildcard change |
| `90040102` | TablePermissionWriteIsMissingDuringUpdate | Add **Write** to the table permission |
| `90040103` | TablePermissionCreateIsMissing | Add **Create** |
| `90040104` | TablePermissionDeleteIsMissing | Add **Delete** |
| `90040105` / `90040106` | Append / Append To missing | Add **Append** and **Append To** on the two related tables |
| `90040107` | HttpAntiForgeryException | The token doesn't match; get a fresh one with `shell.getTokenDeferred()` |
| `90040109` | MissingPortalSessionCookie | The session expired or is invalid; sign in again |
| `9004010C` | ResourceDoesNotExists | Wrong entity set name or path segment |
| `9004010D` | CDSError | A Dataverse error. Turn on `Webapi/error/innererror` to see it |

**Known issue:** a `GET` on a table whose table permissions chain several one-to-many or many-to-many levels, with Parental, Contact or Account scopes, can return a Dataverse error. Microsoft's workaround is a **FetchXML** query.

## Sources

- Microsoft Learn: [Power Pages Web API overview](https://learn.microsoft.com/power-pages/configure/web-api-overview)
- Microsoft Learn: [Web API requests fail after the wildcard is deprecated](https://learn.microsoft.com/troubleshoot/power-platform/power-pages/migrate-web-api-wildcard)
- Microsoft Learn: [Compose HTTP requests and handle errors](https://learn.microsoft.com/power-pages/configure/web-api-http-requests-handle-errors)
- Microsoft Learn: [Write, update and delete operations using the Web API](https://learn.microsoft.com/power-pages/configure/write-update-delete-operations)
- Microsoft Learn: [Dataverse Web API status codes, for comparison](https://learn.microsoft.com/power-apps/developer/data-platform/webapi/compose-http-requests-handle-errors#identify-status-codes)
