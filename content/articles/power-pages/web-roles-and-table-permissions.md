---
title: "Web roles and table permissions: securing portal data"
slug: web-roles-and-table-permissions
type: PATTERN
technology: POWER_PAGES
topic: access-and-permissions
excerpt: "On a Power Pages site, Dataverse security roles don't protect your data; web roles and table permissions do. A pattern for deciding who can see and change which records, and the shortcuts that quietly expose everything."
searchPhrase: "power pages web roles"
---
The most common security mistake on Power Pages sites comes from Dataverse experience. Makers assume the security roles they set up for internal apps also protect the website. They don't. Visitors to a Power Pages site are **Contacts**, and what they can reach is decided by **web roles**, **table permissions** and **page permissions**.

The good news is that Power Pages is secure by default: until you grant access, lists and forms show nothing. The risk is in how you grant it.

## How the pieces fit

- **Web roles:**
  - **Every signed-in visitor** automatically gets the **Authenticated Users** role.
  - **Every visitor who isn't signed in** gets **Anonymous Users**.
  - **Custom web roles**, such as "Partner" or "Reviewer", are assigned to specific contacts. A contact can hold several roles, and their access adds up.
- **Table permissions:** grant a web role privileges (Read, Create, Write, Delete, Append, Append To) on a Dataverse table, for a set of records defined by the **access type**.
- **Page permissions:** control which web roles can open a page.

Table permissions apply wherever the site reads data: lists, forms, Liquid templates and the Web API.

## Choose the access type first

The access type decides **which records** a permission covers. Choosing it well is most of the job.

| Access type | Covers | Use for |
| --- | --- | --- |
| **Global** | Every record in the table | Truly public reference data: published events, a product catalogue |
| **Contact** | Records related to the signed-in visitor's contact | "My requests", "my applications" |
| **Account** | Records related to the visitor's account (their organisation) | "Our company's orders", shared across colleagues |
| **Self** | Only the visitor's own contact record | Letting people edit their own profile |
| **Parent** (child permissions) | Records reached through a related record the visitor already has access to | Line items of an order the visitor can see |
| **Custom** (preview, enhanced authorization sites only) | Records matching a FetchXML filter | Rules a relationship can't express |

## The pattern

### 1. Design relationships before permissions

Every table that holds visitor-specific data needs a lookup to **Contact** or **Account**. Without one, the only access types available are Global or Custom, and Global is almost always too broad.

### 2. Grant the narrowest access type that works

Start from Self, Contact or Account. Use **Parent** for child records, so access to an order automatically covers its lines. Reach for **Global** only when you'd be happy to see every row of the table published on the open web, because for the Anonymous role, that's what it means.

### 3. Grant only the privileges the page needs

A status page needs **Read**. An application form needs **Create**, and maybe **Write** while it's a draft. Very few external scenarios need **Delete**.

### 4. Keep the default roles minimal

Microsoft's security guidance singles out the two default roles. **Authenticated Users** and **Anonymous Users** apply to everyone in their group, so give them the minimum. Put anything more powerful on a **custom web role** assigned to specific contacts.

### 5. Treat Anonymous as public

Anything you grant to Anonymous Users is public data access. Grant it Create, Read, Write or Delete only when the business requirement is explicitly public, such as an open feedback form.

### 6. Protect pages separately

Give every non-public page **page permissions**. Hiding a page from navigation doesn't secure it: someone can still type the address.

### 7. Never rely on the browser for security

Don't filter records in JavaScript and call it security. Visitors can change or bypass client-side code. Table permissions are enforced on the server; that's the only filter that counts.

## The Web API needs extra care

If you enable the Power Pages **Web API**:

- **Enable it only for the tables** that need it.
- **List exactly which columns** it can return.
- **Never pair it with Global access** on sensitive data. Microsoft calls out that combination: the API lets a visitor query every record their role can reach, without any page to limit them.

> [!WARNING]
> Column permissions for the Web API don't protect data shown elsewhere. A sensitive column can still appear through search, Liquid, FetchXML, forms or lists. Keep sensitive columns off every rendering path that doesn't need them.

## Test it like an attacker

Before going public:

- **Sign in as two different test visitors.** Confirm each sees only their own records.
- **Visit every page signed out.** Check that protected pages ask you to sign in.
- **Change a record ID in the address bar** to one belonging to the other test user. You should get no data.
- **Run the security scan** in the design studio's **Security** workspace.

## Checklist

- Every visitor-specific table has a lookup to Contact or Account.
- Table permissions use Self, Contact, Account or Parent access; Global only for public data.
- Privileges are limited to what each page needs.
- The default roles hold minimal permissions; powerful access sits on custom web roles.
- Every non-public page has page permissions.
- Web API access is limited to specific tables and columns.
- Access was tested with two accounts, signed out, and by changing record IDs.

The pattern follows Microsoft's documented Power Pages security model and its security best practices as of September 2026. The order of steps and the test approach are our own recommendations.

## Sources

- [Power Pages security (Microsoft Learn)](https://learn.microsoft.com/power-pages/security/power-pages-security)
- [Configuring table permissions (Microsoft Learn)](https://learn.microsoft.com/power-pages/security/table-permissions)
- [Apply security best practices to your Power Pages site (Microsoft Learn)](https://learn.microsoft.com/power-pages/security/security-best-practices)
- [Tutorial: Display data securely on your site (Microsoft Learn)](https://learn.microsoft.com/power-pages/getting-started/tutorial-display-data-securely)
