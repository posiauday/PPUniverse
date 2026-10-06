---
title: "Dynamic row-level security with USERPRINCIPALNAME that actually filters"
slug: dynamic-row-level-security
type: PATTERN
technology: POWER_BI
topic: security-and-sharing
excerpt: "Dynamic row-level security in Power BI: one role, and every user sees only their rows. Build the user-mapping table, put the filter on the right table, avoid the bidirectional trap, assign people in the service, and test it properly, including guest users and why 'Test as role' can fool you."
searchPhrase: "power bi dynamic row level security"
---
Static RLS in Power BI needs a role per region. **Dynamic** row-level security uses one role whose rule asks "who's signed in?" and looks that person up in a mapping table. When it works, it's elegant. When it doesn't, users see **everything** or **nothing**. This pattern avoids both.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026.

## The model

```text
UserAccess (Email, RegionKey)        one row per person per region they may see
        │  many-to-one
     Region (RegionKey, RegionName)  dimension
        │  one-to-many
      Sales (RegionKey, Amount …)    fact
```

- **UserAccess** holds the sign-in name exactly as Power BI sees it, the **UPN** (usually the work email address), and what that person may see.
- One person can have several rows, one for each region.

## The rule: filter the dimension, not the fact

In **Modeling → Manage roles**, create a role such as *Regional access*. Select the **Region** table, switch to the **DAX editor**, and enter:

```dax
[RegionKey]
    IN CALCULATETABLE (
        VALUES ( UserAccess[RegionKey] ),
        UserAccess[Email] = USERPRINCIPALNAME ()
    )
```

Why this shape:
- The filter sits on **Region**, the table your facts hang from, so it flows down to **Sales** through a normal **single-direction** relationship.
- It reads the mapping table directly, so **UserAccess** doesn't need a relationship to Region at all, and you avoid bidirectional security filters.

> [!WARNING]
> The other common design filters **UserAccess** and relies on a relationship from UserAccess to Region with **Apply security filter in both directions**. It works, but Microsoft warns it can **slow queries**, and a table can have that option on only **one** of its bidirectional relationships. Prefer the rule above.

Also hide **UserAccess** from report view, so nobody browses who can see what.

## Assign people in the service

You can't assign members in Power BI Desktop. After publishing, open the semantic model's **Security** settings, choose the role, and add **people or security groups**. Prefer groups.

Then make sure RLS actually applies to them:
- RLS applies to **Viewers**, app audiences and people a report was shared with, **including viewers with Build** (for example in Analyze in Excel).
- **Admins, Members and Contributors** can edit the model, so **RLS doesn't apply** to them. Give restricted users the **Viewer** role or an **app**.

## Test it properly

1. **In Power BI Desktop:** **Modeling → View as**, tick the role and **Other user**, and enter a real UPN. With dynamic rules, this is the reliable test.
2. **A "Who am I" card:** a measure `Who am I = USERPRINCIPALNAME()` on a card shows exactly what Power BI resolves for the person viewing. Use it while you test, and then remove it.
3. **In the service, be careful:** **Test as role** checks role membership, but dynamic rules use **your own** UPN, not the person you're simulating. To check a specific user, especially a **guest**, sign in as that user.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| A user sees **nothing** | Their UPN in **UserAccess** is missing, misspelled or out of date (name changes happen); the mapping table has no data; or the relationship from **Region** to **Sales** is inactive. RLS only flows through **active** relationships |
| A user sees **everything** | They have Contributor or higher in the workspace, or **Write** on the model, so RLS doesn't apply |
| A **guest** (B2B) user sees nothing | For guests, `USERPRINCIPALNAME()` may return their email *or* a value like `user_partner.com#EXT#@yourtenant.onmicrosoft.com`. Check what the card shows, and store that form |
| Numbers look wrong for some users | The user is in **several roles** (roles combine), or aggregation tables aren't filtered the same way as the detail tables |
| Embedded report shows nothing | A **service principal** isn't a user. `USERPRINCIPALNAME()` returns the app's ID or empty, so pass an effective identity from the app instead |

## Sources

- Microsoft Learn: [Row-level security (RLS) with Power BI](https://learn.microsoft.com/fabric/security/service-admin-row-level-security)
- Microsoft Learn: [RLS guidance in Power BI Desktop: troubleshoot RLS](https://learn.microsoft.com/power-bi/guidance/rls-guidance#troubleshoot-rls)
- Microsoft Learn: [Bidirectional cross-filtering and the security filter](https://learn.microsoft.com/power-bi/transform-model/desktop-bidirectional-filtering)
- Microsoft Learn: [Semantic model permissions and RLS](https://learn.microsoft.com/power-bi/developer/embedded/datasets-permissions)
- Microsoft Learn: [Validate roles in Power BI Desktop: View as](https://learn.microsoft.com/power-bi/report-server/row-level-security-report-server#validate-the-roles-within-power-bi-desktop)
