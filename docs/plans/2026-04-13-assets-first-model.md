# Assets Exist Independently

*April 13, 2026. Product and UX spec.*

## The question

When a VFX coordinator drags a comp into a shared collection for Framestore, and Framestore uploads a delivery back into that collection, where do those files live? What happens when the coordinator wants to see the delivery in their workspace? What if the collection gets deleted?

The answer to these questions determines whether users trust the system or buy a hard drive.

## The model

An asset exists the moment it enters the system. It doesn't need a folder. It doesn't need a collection. It has an identity, metadata, and access rules. Everything else is optional organization.

### Three layers, each independent

**Assets** are the atoms. A VFX comp, a PDF brief, a cut, a delivery from Framestore. Each has a unique identity, a type, metadata, and an access trail. An asset can exist in zero folders and zero collections and still be findable via search.

**Folders** are spatial organization. Your VFX workspace has a folder tree: Shots, Reference, Vendor Deliveries. This is how you arrange your desk. Every file you drop into a workspace folder becomes an asset automatically. Folders are a view into assets filtered by location.

**Collections** are semantic organization. "Framestore Deliveries," "EP301 VFX Pulls," "Finals." This is how you group work for a purpose. A collection references assets. Adding an asset to a collection doesn't move it. Removing it from a collection doesn't delete it.

### What this means for users

| Action | What happens |
|--------|-------------|
| Drop a file into VFX workspace | File becomes an asset. Visible to VFX team via workspace and search. Invisible to everyone else. |
| Add an asset to a collection | Asset now appears in the collection too. Still in its original folder. No duplication. |
| Share a collection with Framestore | Framestore sees the assets in the collection. Can't see the VFX workspace. |
| Framestore uploads a delivery | Delivery becomes an asset in the collection. No workspace folder needed. Coordinator sees it in the collection. |
| Coordinator drags delivery into workspace folder | Asset now also appears in the workspace folder. Still in the collection too. One asset, two views. |
| Delete the collection | Collection goes away. Assets remain wherever else they exist. |
| Delete an asset from a folder | Removed from that folder. If it's in other folders or collections, still there. |

## Why this is better

### For the VFX coordinator (sender)

Today: "I shared this folder, but when the vendor uploads back, where does it go? Do I need a special folder for that? What if I move the folder?"

With this model: "I shared a collection. Everything the vendor uploads appears there. I can file it into my workspace when I'm ready, or leave it in the collection. Moving my workspace folders doesn't break anything."

### For the vendor (receiver)

Today: "I can see some files but I don't know if I'm allowed to download them. When I upload, I don't know if it worked."

With this model: "I see exactly what was shared with me. I upload my delivery. It's there permanently. The coordinator's note tells me what's expected."

### For the production coordinator (oversight)

Today: "I can't tell who has access to what. If a folder moves, access breaks."

With this model: "Every asset has an access trail. Collections don't depend on folder positions. I can see every path someone has to an asset and revoke any of them."

## The privacy guarantee

The department workspace is a privacy boundary. Everything inside is visible to the department. Nothing leaks out without an explicit share or release.

Assets uploaded by external parties (vendors) into shared collections exist inside the collection, not inside the department workspace. The department coordinator decides when and whether to pull them into the workspace. The vendor's uploads are scoped to the collection.

## User scenarios

### Scenario 1: VFX turnover to vendor

1. Sarah creates collection "Framestore EP301"
2. Drags 5 VFX comps from her workspace into the collection
3. Shares with Framestore team, upload enabled, adds note: "First turnover, smoke ref coming Thursday"
4. James (Framestore) sees 5 assets. Downloads plates. Uploads 3 comps back.
5. Sarah sees 3 new assets in "Framestore EP301." Drags them into her VFX/Vendor Deliveries folder when ready.
6. The comps are now in both the collection and the workspace folder. One asset, two views.

### Scenario 2: Editorial shares cut with VFX

1. Lisa adds locked cut to "Editorial-to-VFX" collection
2. VFX team gets notification. Cut appears in collection.
3. Mike can preview and download from the collection.
4. Mike does NOT see the cut in the Editorial workspace. Only in the collection.
5. If Mike wants it in his VFX workspace, he drags it into a folder.

### Scenario 3: Director reviews character designs

1. Priya adds approved designs to "Character Concepts" collection
2. Shares with David, view only
3. David sees designs in the collection and via smart collection search.
4. David cannot see the Art & Design workspace.

### Scenario 4: Vendor uploads without workspace

1. James uploads a delivery to "Framestore EP301" collection
2. The delivery is an asset. It has no workspace folder.
3. It's findable by anyone with access to the collection.
4. Sarah can drag it into her VFX workspace later. Or not.
5. If the collection is deleted, the asset still exists. An admin can find it via search.

## How this relates to real Content Hub

The production Content Hub (CDrive + Dublin) already separates files from assets. CDrive handles file storage. Dublin handles asset metadata and collections. An ingestion pipeline connects them.

Our model simplifies the pipeline: every workspace file is automatically an asset (no manual ingestion step). But the separation of concerns is the same: folders are organization, assets are identity, collections are sharing.

## Open questions

1. **Orphaned assets**: If an asset is removed from all collections and folders, should there be an "Unfiled" view? Or is search sufficient?

2. **Storage attribution**: If Framestore uploads 500GB of deliveries, who pays for storage? Platform question, not UX, but affects whether we show storage usage per collection.

3. **Bulk filing**: When Sarah drags 50 vendor deliveries into her workspace, the reference-first model (toast with "Move instead") applies. Is the toast sufficient at scale, or do we need a batch filing view?

4. **Version identity**: If Framestore uploads v2 of a comp that already exists as v1, should the system detect and link them as versions of the same asset? Or are they separate assets the coordinator merges manually?
