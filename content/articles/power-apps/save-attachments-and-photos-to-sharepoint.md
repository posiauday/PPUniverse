---
title: "Save Power Apps attachments and photos to a SharePoint library"
slug: save-attachments-and-photos-to-sharepoint
type: TUTORIAL
technology: POWER_APPS
topic: data-and-delegation
excerpt: "Canvas apps can't write files to a SharePoint document library on their own. Here's the pattern that works: a Power Apps (V2) flow with a File input, called from the app with an attachment, a camera photo or a generated PDF. Plus list attachments with no flow, and the Dataverse file-column alternative."
---
A canvas app can **attach** files to a SharePoint **list item**, but it can't put a file into a **document library** by itself. The reliable way is to hand the file to a small **Power Automate flow** that runs **Create file**. Here's how, for the three things people usually want to save: an attachment, a photo and a PDF.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026.

## Pick the right destination

| You want | Use |
| --- | --- |
| Files attached to a **list item** | The **Attachments** control in a form, or the modern Attachments control (section 4). No flow needed |
| Files in a **document library**, with their own columns and versions | A **flow** with a File input (sections 1–3) |
| Files stored with a **Dataverse** row | A Dataverse **file column**, written straight from the app (section 5) |

## 1. Build the flow

1. In Power Apps Studio, open the **Power Automate** pane and select **Create new flow → Create from blank**.
2. **Delete** the default PowerApps trigger and add **PowerApps (V2)** instead.
3. In the trigger, select **Add an input**:
   - **File**, for the file content;
   - **Text**, renamed to *File Name*.
4. Add SharePoint **Create file**:
   - **Site Address** and **Folder Path**: your library;
   - **File Name**: the *File Name* input;
   - **File Content**: the trigger's file content.
5. Optional: add **Update file properties** to fill the library's columns, such as the related request ID.
6. **Save**, and close the pane. The flow now appears in the app's list.

## 2. Call it from the app

Flows with a File input take an object with **`name`** and **`contentBytes`**.

**From an attachment** (an Attachments control in a form):

```powerfx
ForAll(
    DataCardValue_Attachments.Attachments,
    SaveToLibrary.Run(
        ThisRecord.Name,
        { file: { name: ThisRecord.Name, contentBytes: ThisRecord.Value } }
    )
)
```

**From a photo** (Camera control):

```powerfx
Set(photoName, "Inspection-" & Text(Now(), "yyyymmdd-hhmmss") & ".jpg");
SaveToLibrary.Run(photoName, { file: { name: photoName, contentBytes: Camera1.Photo } })
```

**From a generated PDF** (the PDF function is **experimental**, so turn it on under *Settings → Upcoming features*):

```powerfx
SaveToLibrary.Run(
    "Report.pdf",
    { file: { name: "Report.pdf", contentBytes: PDF(ReportScreen) } }
)
```

Replace `SaveToLibrary` with your flow's name, as the app shows it.

> [!TIP]
> Give every file a **unique name**, for example with a date and time, a record ID or both. Two users saving `photo.jpg` would otherwise collide.

## 3. Tell the user it worked

Make the flow end with **Respond to a PowerApp or flow**, returning the new file's link. Then in the app:

```powerfx
Set(result, SaveToLibrary.Run(photoName, { file: { name: photoName, contentBytes: Camera1.Photo } }));
Notify("Saved: " & result.link, NotificationType.Success)
```

`link` is whatever output name you gave in **Respond to a PowerApp or flow**.

## 4. List attachments without a flow

If the files only need to live **on the list item**:
- **In a form:** the SharePoint **Attachments** card saves with **SubmitForm**. Set **MaxAttachments** and **MaxAttachmentSize** (in MB) on the control.
- **Without a form (preview):** the **modern Attachments** control can update a list item's attachments directly with **Patch**. Set its **Items** to the selected record's `Attachments`.

The classic Attachments control's **Items** must be the record's Attachment column. Collections and tables aren't supported.

## 5. Dataverse instead of SharePoint

If your app uses Dataverse, add a **file column** to the table. The modern Attachments control can then save a file straight into that column with **Patch**, mapping the file's name and content. Saving replaces the file already there. Keep **MaxAttachmentSize** within the column's maximum.

## When it goes wrong

| Symptom | Check |
| --- | --- |
| The flow isn't in the app's list | It must start with the **PowerApps (V2)** trigger. Refresh the flows pane |
| "Missing parameter", or the file is empty | Pass `{ file: { name: …, contentBytes: … } }`, not the control itself |
| Files saved but they won't open | Check the **extension** in the name matches the content, such as `.jpg` for camera photos |
| Works for you, fails for others | The flow uses **their** connection, so they need permission to add files to that library. Or set the flow to use your connection under **Run only users** |
| Large files fail | Lower **MaxAttachmentSize**, and test the biggest file you expect |

## Sources

- Microsoft Learn: [Work with the PDF function: pass a file to a flow with PowerApps (V2)](https://learn.microsoft.com/power-apps/maker/canvas-apps/how-to/pdf-function#use-in-a-power-automate-flow)
- Microsoft Learn: [Attachments control in Power Apps](https://learn.microsoft.com/power-apps/maker/canvas-apps/controls/control-attachments)
- Microsoft Learn: [Attachments modern control (preview)](https://learn.microsoft.com/power-apps/maker/canvas-apps/controls/modern-controls/modern-control-attachments)
- Microsoft Learn: [SharePoint connector actions: Create file, Add attachment](https://learn.microsoft.com/sharepoint/dev/business-apps/power-automate/sharepoint-connector-actions-triggers#sharepoint-actions)
- Microsoft Learn: [Upload files to SharePoint with metadata from model-driven apps](https://learn.microsoft.com/power-platform/architecture/reference-architectures/custom-page-file-upload)
