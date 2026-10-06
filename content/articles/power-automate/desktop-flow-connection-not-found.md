---
title: "Desktop flow won't run from the cloud: 'connection not found', session and credential errors fixed"
slug: desktop-flow-connection-not-found
type: TUTORIAL
technology: POWER_AUTOMATE
topic: desktop-flows
excerpt: "The machine runtime says Connected but the cloud flow can't run the desktop flow. The checks for machine, connection, session and credentials, and the fix for each common error code: MachineNotFound, WindowsIdentityIncorrect, AttendedUserSessionNotActive, SessionExistsForTheUserWhenUnattended and more."
searchPhrase: "desktop flow connection not found"
---
A cloud flow that runs a desktop flow depends on four things lining up: the **machine** is registered and online, the **desktop flow connection** works, the right **Windows session** exists (or doesn't), and the **credentials** can sign in. "Connected" in the machine runtime only proves the first. Here's how to check the rest.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026.

## The four checks

### 1. Is the cloud flow pointing at the right machine?

- **Find which machine you're on.** Open the **Power Automate machine runtime** app on the computer and select **View machine in portal**. Make sure that's the machine (or machine group) your desktop flow connection uses.
- **Was the machine copied?** A virtual machine that was **cloned after** Power Automate was installed and registered causes confusing errors. Delete the machine in the portal and register it again.
- **Can it reach Power Automate?** In the machine runtime, select **Troubleshoot** → **Launch diagnostic tool**. The machine needs outbound access to `*.dynamics.com`, `*.servicebus.windows.net`, `*.gateway.prod.island.powerapps.com` and `*.api.powerplatform.com`.

### 2. Does the connection still work?

Go to **Connections** in the Power Automate portal and find the **desktop flow connection**. If it shows an error, edit it and enter the credentials again. A connection points at **one machine or machine group**: if that machine or group was deleted (**XrmMachineGroupNotFound**), re-create it and update the connection.

### 3. Is the Windows session in the state the run mode needs?

This is the most common cause, and the rules are opposite for the two run modes.

| Run mode | The machine must… | Licence |
| --- | --- | --- |
| **Attended** | Have the connection's user **signed in, with the screen unlocked** | Premium user (includes attended RPA) |
| **Unattended** | Have **nobody** signed in as that user (no active, locked or disconnected session) | Process (unattended bot), or an unattended add-on |

For **unattended** runs, Power Automate creates its own remote desktop session, runs the flow behind a locked screen, then signs out. That means:
- the connection's user must be allowed to open a **remote desktop** session on the machine, usually as a member of **Remote Desktop Users**;
- on Windows 10 and 11, **any** signed-in session, even a locked one, blocks the run;
- the session's screen resolution can differ from the one you built on, so set the resolution for unattended runs if your flow clicks on screen positions;
- unattended flows can't run with **elevated** (administrator) privileges.

### 4. Can the credentials sign in?

- **The username format must match how the machine is joined:**
  - Microsoft Entra joined or hybrid joined: `user@domain.com`;
  - domain joined only: `DOMAIN\user`;
  - local account: `.\user` or `machinename\user`.

  Run `dsregcmd /status` on the machine to see which it is.
- **Passwords only.** Windows Hello PINs and smart-card-only sign-in aren't supported for desktop flow connections.
- **The quickest test:** sign in to the machine with **Remote Desktop**, using exactly the connection's username and password.

## Error codes and fixes

| Error | Run mode | Means | Fix |
| --- | --- | --- | --- |
| **MachineNotFound** | Both | The machine was unregistered, or the environment moved region | Check the machine is still registered in the runtime and the portal; check the connection |
| **WindowsIdentityIncorrect** | Both | The connection's credentials can't sign in on the machine | Fix the username format or password; test with Remote Desktop |
| **AttendedUserNotLoggedIn** | Attended | The connection's user isn't signed in on that machine | Sign in on the target machine as that user; confirm the machine in the runtime |
| **AttendedUserSessionNotActive** | Attended | The user is signed in, but the session is locked or disconnected | Unlock the session, or switch to unattended |
| **NoSessionFoundForPasswordless** | Attended | Attended run with no open session | Sign in on the machine, or use unattended mode |
| **SessionExistsForTheUserWhenUnattended** | Unattended | The same user is signed in (even locked) | Sign that user out completely |
| **UnattendedUserSessionLocked** / **Disconnected** | Unattended | A leftover locked or disconnected session | Sign out of it |
| **UIFlowServiceNoRdpPermissions** | Unattended | The Power Automate service can't list Windows sessions | Add `NT SERVICE\UIFlowService` to **Remote Desktop Users**, then restart |
| **SessionCreationInvalidCredentials** | Unattended | The session couldn't be created with these credentials | Usually the username format (above) |
| **AccountLockedOut** | Unattended | Too many failed sign-ins locked the account | Check that password rotation isn't leaving an old password in the connection |
| **SessionNotFound** | Unattended | The session vanished, for example after a reboot or on a cloned VM | Re-run; re-register a cloned machine |
| **UIFlowAlreadyRunning** | Both | The machine has reached its session limit, or the user is already signed in | Wait, or cancel the parent cloud flow run |
| **UnsupportedRpaScriptSchemaVersion** | Both | The flow was saved by a newer Power Automate for desktop | Update Power Automate for desktop on the machine |

> [!TIP]
> If attended runs fail with **AttendedUserSessionNotActive** or **AttendedUserNotLoggedIn** even when you're signed in, check that `NT SERVICE\UIFlowService` is in **Remote Desktop Users** on the machine (Computer Management → Local Users and Groups → Groups).

## Make unattended runs reliable

- **Use a dedicated service account** whose password doesn't expire mid-week, or update the connection when it rotates.
- **Keep the machine signed out** of that account, or turn on **Reuse sessions for unattended runs** in the machine's settings.
- **Use a machine group** of two or more machines, so one busy or rebooting machine doesn't stop the queue.

## Sources

- Microsoft Learn: [Error codes when running attended or unattended desktop flows](https://learn.microsoft.com/troubleshoot/power-platform/power-automate/desktop-flows/troubleshoot-errors-running-attended-or-unattended-desktop-flows)
- Microsoft Learn: [Troubleshoot desktop flow run queue errors](https://learn.microsoft.com/troubleshoot/power-platform/power-automate/desktop-flows/troubleshoot-desktop-flow-run-queue-errors)
- Microsoft Learn: [Invalid credentials error when running desktop flows](https://learn.microsoft.com/troubleshoot/power-platform/power-automate/desktop-flows/invalid-credentials-errors-running-desktop-flows)
- Microsoft Learn: [Run unattended desktop flows](https://learn.microsoft.com/power-automate/desktop-flows/run-unattended-desktop-flows)
- Microsoft Learn: [Troubleshoot desktop flows runtime](https://learn.microsoft.com/power-automate/desktop-flows/troubleshoot)
- Microsoft Learn: [Trigger desktop flows from cloud flows: prerequisites](https://learn.microsoft.com/power-automate/desktop-flows/trigger-desktop-flows#prerequisites)
- Microsoft Learn: [Types of Power Automate licenses: RPA entitlements](https://learn.microsoft.com/power-platform/admin/power-automate-licensing/types#license-entitlements)
