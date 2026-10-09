---
title: "Tree view"
slug: tree-view
category: navigation-and-layout
summary: "Folders, categories or an org chart as a tree that opens and closes, from one flat table, in one gallery. Load children only when a node opens, mark the selected node, and save which nodes were open."
access: OPEN
version: 0.1.0
modernControls: yes
---
## When to use it

Use **lcsTreeView** for anything nested: document folders, product categories, teams and their people, a site's pages. Power Apps has no tree control, and the usual workaround nests galleries inside galleries, which is slow and stops at two levels. This component:

- **Draws the whole tree in one gallery,** from one flat table: each node names its `ParentKey`.
- **Opens and closes nodes** with a chevron. An open folder shows an open-folder icon.
- **Loads children only when needed:** mark a node `HasChildren: true` without giving its children, and load them in `OnExpand(NodeKey)`. The tree shows them as soon as they arrive.
- **Marks the selected node** (a tint, a filled icon and bold text) and runs `OnNodeSelect(NodeKey)`.
- **Remembers what's open** as `ExpandedKeys`, so you can save it and open the same nodes next time.
- Goes up to five levels deep, with your `AccentColor` and a `Dark` theme.

## Use it

The examples call it `treeDocs` on your screen.

Give it your nodes as one table. `ParentKey` is blank for the top level:

```powerfx
// treeDocs.Nodes
ForAll(
    colFolders,
    {
        Key: Text(ID),
        ParentKey: If(IsBlank(ParentFolder), "", Text(ParentFolder.Id)),
        Label: Title,
        Icon: If(IsFolder, "Folder", "Document"),
        HasChildren: IsFolder
    }
)
```

Open what the user selects:

```powerfx
// treeDocs.OnNodeSelect
Set(gblFolder, LookUp(colFolders, Text(ID) = NodeKey))
```

Load a folder's children the first time it opens:

```powerfx
// treeDocs.OnExpand
If(
    IsEmpty(Filter(colFolders, Text(ParentFolder.Id) = NodeKey)),
    Collect(colFolders, Filter(Folders, ParentFolder.Id = Value(NodeKey)))
)
```

Open the same nodes as last time:

```powerfx
// App.OnStart
Set(gblOpenFolders, Coalesce(LookUp(Settings, Name = "OpenFolders").Value, ""))

// treeDocs.DefaultExpandedKeys
gblOpenFolders

// Wherever you save: the nodes open now
Patch(Settings, LookUp(Settings, Name = "OpenFolders"), { Value: treeDocs.ExpandedKeys })
```

Show where something is, with the actions:

```powerfx
// A button: open its folders, then select it
treeDocs.Expand("docs");
treeDocs.Expand("plans");
Set(gblCurrent, "q3")

// treeDocs.CurrentKey
gblCurrent
```

## Accessibility

- Each node is a button named by its label and level ("Plans, level 2"). Its chevron is a separate button that says what it does ("Expand Plans", "Collapse Plans").
- The selected node has a tint, a filled icon and bold text, so colour is never the only signal.
- All the words screen readers hear are inputs (`ExpandText`, `CollapseText`, `LevelText`, `TreeLabel`), for your language.

## Known limits

- **Up to five levels.** Deeper nodes don't show.
- **The arrow keys don't move through the tree.** Canvas components can't read key presses, so Tab moves from button to button.
- `Nodes` needs all five columns, with `HasChildren` true or false.
- `ExpandAll()` opens nodes whose children are already in `Nodes`. It doesn't run `OnExpand`, so it won't load children that aren't loaded yet.
- Up to 999 children under one node keep their order.

## Change log

- **0.1.0:** first version: one flat table, open and close, children loaded through `OnExpand`, selection, `ExpandedKeys`, and the `Expand`, `Collapse`, `ExpandAll` and `CollapseAll` actions.
