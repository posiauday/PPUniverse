---
title: "Move, upgrade or share an on-premises data gateway without breaking refresh"
slug: move-upgrade-share-a-gateway
type: TUTORIAL
technology: POWER_BI
topic: refresh-and-gateways
excerpt: "Move a gateway to new servers, add a second member to a cluster, update it month by month, and give people access to the gateway and its connections. Plus why someone 'can't see the gateway', and what to check when it's unreachable."
searchPhrase: "move on-premises data gateway"
---
The on-premises data gateway is the bridge between Power BI (and Power Apps, Power Automate and Fabric) and data inside your network. Most gateway trouble comes from four jobs: **moving** it, **updating** it, **sharing** it, and **network** changes. Done in the right order, none of them needs to break a single refresh.

> [!ANSWER] Quick answer
> 1. [Keep the recovery key in a shared password vault](#before-anything-find-the-recovery-key): Microsoft can't retrieve it, and moving or restoring needs it.
> 2. [Move with no downtime](#move-it-to-a-new-server-no-downtime): add the new server to the existing cluster, at the same version, then retire the old one.
> 3. [Update every month, one member at a time](#update-it-every-month): Microsoft supports only the last six releases.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026.

## Before anything: find the recovery key

You set a **recovery key** when the gateway was installed. It's needed to move, restore, take over, or add a member to the gateway. **Microsoft can't retrieve it for you.** Store it in your organisation's password vault, where more than one trusted admin can reach it.

## Share it: gateway roles and connection roles

There are **two separate permission layers**. "I can't see the gateway" or "I can't use the connection" almost always means one of them is missing.

**Gateway roles,** on the gateway cluster:

| Role | Can |
| --- | --- |
| **Admin** | Manage and update the gateway, create connections, add or remove users in any role, manage access to all connections |
| **Connection creator** | Create connections on the gateway and test its status. Can't manage it or add people |
| **Connection creator with sharing** | The above, plus share the gateway with others as connection creators |

**Connection roles,** on each connection (data source):

| Role | Can |
| --- | --- |
| **Owner** | Update credentials, delete the connection, and add Owners, Users or Users with sharing |
| **User** | Use the connection in Power BI reports and dataflows. Can't see or change credentials |
| **User with sharing** | Use it, and share it with others as User |

**Where:** Power Platform admin center → **Data** → **On-premises data gateways**. Select the gateway (or a connection), then **Manage users**.

> [!TIP]
> A person only sees the connections they have permission on. To use a gateway connection for a semantic model, they need a role on **that connection**. To manage the gateway itself, they need a gateway role too.

## Move it to a new server (no downtime)

The safest way is to **add the new server to the existing cluster**, then retire the old one:

1. On the new server, install the gateway. Sign in, choose **Add to an existing cluster**, pick the cluster, and enter its **recovery key**.
2. Make sure the new member runs the **same version** as the others. Mixed versions cause unexpected refresh failures, because a query can land on a member that can't run it.
3. Check that both members show as online, and run a test refresh.
4. **Disable** the old member, watch a day of refreshes, then **remove** it.

A cluster can have up to **10** members. Requests go to the **primary** member unless it's unavailable. The primary can't be removed while other members exist, because removing it removes the cluster.

**Replacing a dead server instead?** Install on the new machine and choose **Migrate, restore, or take over an existing gateway**, then pick the gateway and enter the recovery key. If the old machine is still running the gateway, uninstall it first.

## Update it every month

- **Updates aren't automatic.** A new gateway release comes out every month, and Microsoft supports **only the last six**.
- **Since August 2026, older gateways may fail to sign in.** Builds before May 2026, and unpatched January–April 2026 builds, may fail when you install, configure, recover or manage the gateway. Update them.
- **Update a cluster one member at a time:**
  1. disable the member;
  2. wait about **30 minutes** for its work to finish;
  3. update it;
  4. re-enable it, and move to the next.
- **Test first** on a development or test gateway if you have one, especially before big data refreshes.
- The gateway runs your Power Query transformations with **its own** version of the engine, so an old gateway can behave differently from Power BI Desktop.

## "Gateway unreachable" after a network change

The gateway only makes **outbound** connections; no inbound ports are needed. After it's registered, what matters is Azure Relay:
- `*.servicebus.windows.net` on ports **443** and **9350–9354**, plus **5671–5672**;
- sign-in and Power BI domains on **443** for setup and management.

Run the **Network ports test** in the gateway app after any firewall or proxy change. If only one member of a cluster fails, compare its **proxy settings** with the others.

## Lock it down

Admins can stop just anyone installing gateways: in the Power Platform admin center, turn on **Tenant administration for gateways**, then **Restrict users in your organization from installing gateways**, with named exceptions. This applies to the whole tenant, not per environment.

## Sources

- Microsoft Learn: [Manage security roles of an on-premises data gateway](https://learn.microsoft.com/data-integration/gateway/manage-security-roles)
- Microsoft Learn: [Install a gateway: add another gateway to create a cluster](https://learn.microsoft.com/data-integration/gateway/service-gateway-install#add-another-gateway-to-create-a-cluster)
- Microsoft Learn: [High-availability clusters and load balancing](https://learn.microsoft.com/data-integration/gateway/service-gateway-high-availability-clusters)
- Microsoft Learn: [Migrate, restore, or take over a gateway](https://learn.microsoft.com/data-integration/gateway/service-gateway-migrate)
- Microsoft Learn: [Update your gateway to avoid sign-in problems](https://learn.microsoft.com/data-integration/gateway/service-gateway-update-signin)
- Microsoft Learn: [Currently supported monthly updates](https://learn.microsoft.com/data-integration/gateway/service-gateway-monthly-updates)
- Microsoft Learn: [Power BI implementation planning: data gateways](https://learn.microsoft.com/power-bi/guidance/powerbi-implementation-planning-data-gateways#manage-gateways)
- Microsoft Learn: [Adjust communication settings: required ports](https://learn.microsoft.com/data-integration/gateway/service-gateway-communication#required-ports-for-the-gateway-to-function)
- Microsoft Learn: [Troubleshoot the on-premises data gateway](https://learn.microsoft.com/data-integration/gateway/service-gateway-tshoot)
