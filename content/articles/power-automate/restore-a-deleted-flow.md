---
title: "Restore a deleted flow in Power Automate (cloud and desktop flows)"
slug: restore-a-deleted-flow
type: TUTORIAL
technology: POWER_AUTOMATE
topic: run-and-monitor
excerpt: "Deleted a cloud flow by mistake? You have 21 days. How an admin gets it back with a button flow or PowerShell, what to do after it's restored, how to recover a deleted desktop flow, and how to make sure you never need to."
searchPhrase: "restore deleted flow power automate"
---
Deleting a flow doesn't remove it straight away. For **21 days** it's kept as a *soft-deleted* flow, and an environment admin can bring it back. After that, nobody can restore it, not even Microsoft Support. So act quickly.

> [!ANSWER] Quick answer
> 1. [Act within 21 days](#before-you-start): only an **environment admin** can restore a deleted cloud flow.
> 2. [Run **Restore Deleted Flow as Admin**](#option-1-a-button-flow-no-powershell) from a button flow, or [use PowerShell](#option-2-powershell).
> 3. [Check its connections, then turn it on](#after-its-restored): a restored flow comes back turned off.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026.

## Before you start

- **Who can do it:** an **environment admin** of the environment the flow was in. A maker who isn't an admin can't restore a flow, so send your admin the flow's name, its environment and roughly when it was deleted.
- **Which flows:** cloud flows inside or outside a solution can be restored this way. **Desktop flows** work differently (see below).
- **The deadline:** 21 days after deletion.

## Option 1: a button flow (no PowerShell)

1. In the same environment, create an **instant cloud flow** with a **Manually trigger a flow** trigger.
2. Add the action **Restore Deleted Flow as Admin**, from the **Power Automate Management** connector.
3. Choose the **Environment** the flow was deleted from.
4. In **Flow**, choose the deleted flow's display name.
5. Save, then run the flow.

When the run succeeds, the flow is back in its original environment.

## Option 2: PowerShell

Use this when you need the list of deleted flows, or want to restore several at once.

1. Install the latest **Microsoft.PowerApps.Administration.PowerShell** module. Older versions don't know the `-IncludeDeleted` parameter.
2. Sign in:

```powershell
Add-PowerAppsAccount
```

3. List the environment's flows, including those deleted in the last 21 days. Add part of the name to narrow the list:

```powershell
Get-AdminFlow "Invoice" -EnvironmentName <environment-name> -IncludeDeleted $true
```

4. Copy the **FlowName** value (an ID) of the flow you want back, and restore it:

```powershell
Restore-AdminFlow -EnvironmentName <environment-name> -FlowName <flow-id>
```

> [!TIP]
> The environment name is in any flow's address: `make.powerautomate.com/environments/<environment-name>/flows/...`. Copy it whole, including a prefix such as `Default-`.

## After it's restored

A restored flow comes back **turned off**. Before you turn it on:
1. **Open it and check its connections.** Fix any that show a warning.
2. **Check what was missed.** Nothing ran while the flow was deleted, so items created in that time may need handling by hand.
3. **Check its owners and run-only users** on the flow's details page.
4. **Turn it on**, then watch the first few runs.

## Desktop flows

The 21-day restore covers cloud flows. To recover a deleted **desktop flow**:

| You have | You can recover | How |
| --- | --- | --- |
| An exported solution that contains it | Everything | Import that solution again |
| An environment backup from before the deletion | Everything | Restore the backup into a **new** environment, add the flow to a solution there, export it, and import it into the original environment |
| A machine where the flow once ran from the Power Automate for desktop console | Actions only | Open the local `script.robin` file under `%localappdata%\Microsoft\Power Automate Desktop\Console\Workspace\<flow id>\`, and paste the actions into a new flow |
| Dataverse auditing on the **Process** table | Actions only | Find the **Delete** event in the audit summary, then copy the flow's **Definition** |

"Actions only" means UI elements, images and connection references are lost and must be rebuilt.

If you sign in to Power Automate for desktop with a **personal Microsoft account**, desktop flows are stored in OneDrive (`Apps\Power Automate Desktop For Windows`). Restore them from the OneDrive recycle bin.

## So you never need this again

- **Build important flows in solutions,** and export the solution regularly. A solution file can always be imported again, even long after 21 days.
- **Add a co-owner** to business-critical flows, so one person leaving or tidying up can't remove the only copy.
- **Keep production in its own environment,** where only a few people can delete things.

## Sources

- Microsoft Learn: [Restore deleted flows](https://learn.microsoft.com/power-automate/how-tos-restore-deleted-flow)
- Microsoft Learn: [Restore-AdminFlow](https://learn.microsoft.com/powershell/module/microsoft.powerapps.administration.powershell/restore-adminflow)
- Microsoft Learn: [Restore a deleted desktop flow](https://learn.microsoft.com/power-automate/desktop-flows/how-to/restore-deleted-desktop-flow)
- Microsoft Learn: [Guide to cloud flow sharing and permissions](https://learn.microsoft.com/power-automate/guide-to-cloud-flow-sharing-permissions)
