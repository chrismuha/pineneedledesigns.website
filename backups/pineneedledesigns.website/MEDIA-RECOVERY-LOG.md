# Media recovery log

## Daily backup retention and branch locations — November 6, 2026

Daily backups accumulate on the `daily-backups` branch. Each successful run builds on the previous backup: unchanged files remain, new media is added, and the latest catalog metadata is refreshed. A timestamped catalog snapshot and a Git commit preserve each run’s history. For example, content added today remains alongside content added tomorrow.

When a file is replaced at the same path, its previous contents are retained in `replaced-files/` and Git history. Deleting a product or media from the website does not delete an existing retained backup; older product folders, media, catalog snapshots, and removal reports remain. The workflow does not automatically prune retained backups. A backup can only recover bytes that were captured successfully; already-missing originals cannot be recreated by merging later backups.

The current scheduled backup files live on [`daily-backups`](https://github.com/chrismuha/pineneedledesigns.website/tree/daily-backups/backups/pineneedledesigns.website). These logs are also published on `main` for reference. The older media/catalog snapshot already present on `main` is historical; pushing a log to `main` does not replace it with the current daily media backup. Use the `daily-backups` branch for the latest recovery files.

This is a repository and server-upload/catalog backup, not a whole-computer backup or a complete MongoDB backup. Uncommitted local files, Orders, payments, credentials, and customer data are not automatically included. Previously committed media remains in Git history. Explicit source copies retained under server uploads are included.

Latest verified media inventory — November 7, 2026: **471 retained files**, including old URL aliases and source copies. Active catalog paths comprise **231 available / 10 missing / 241 total**. The November 7 recovery and screenshot-cleanup entries below supersede older inventory and confirmation snapshots.

## Current status — November 7, 2026

Six screenshot photos across five products have been cropped to remove phone controls, black borders, and thumbnails. The Lipstick sweatshirt now has separate working photo, video, and poster files copied from its T-shirt counterpart, as requested by the owner. Its description, $58 price, sizing, colors, and stock were preserved. The latest verified backup retains 471 files; active catalog totals are 231 available and 10 missing references. See the screenshot-cleanup entry below for exact mappings and checks.

Jennifer’s Garden now has seven available photos and two available videos. Myra Mojave Leather Bag in Old Rose now has six owner-supplied photos and two available videos; its current gallery is **Confirmed**, replacing the prior Unconfirmed manufacturer-photo classification. Baby I’m a Wild Card now has its available video; its separately missing photo remains unresolved. Seven other Myra products retain their Unconfirmed manufacturer-photo classification.

Remaining missing files: **8 photos and 2 videos** — Baby I’m a Wild Card (one photo), Farmer Mrs. Synakowski (six photos and two videos), and the Shirts collection’s historical fallback image. A separate Shirts cover is still unnecessary because the storefront selects a product photo. Exact paths are recorded in the latest `daily-backups` backup status and missing-file report.

The [successful November 7 backup](https://github.com/chrismuha/pineneedledesigns.website/actions/runs/42380857408) retains all 36 newly uploaded gallery/source files, verified against their SHA-256 checksums. All 63 saved products were compared with the prior catalog: only the three intended media arrays and modification timestamps changed. Collections, subcollections, and store settings were preserved.

## Orders text-only update — November 6, 2026

Published and deployed [the Orders change on main](https://github.com/chrismuha/pineneedledesigns.website/commit/b1735889d7288dec9e2a93f2fc5bb487a8869902). Orders display text records without product media or product/media links. New snapshots omit media; old responses filter it without deleting historical orders. Editing uses a text-only product choice list. Verified against the existing Farmer order and all 63 product choices; financial totals, inventory references, payment state, and catalog media were preserved. All 30 tests, the production build, Code Quality, CodeQL, and deployment passed. Orders remain outside the catalog/media backup scope.

## Shirts collection cover clarification — November 6, 2026

The live storefront automatically uses the first photo from the first product alphabetically with a nonempty photo list. It does not select the latest upload. The saved collection `cardImage` is a fallback only when no product supplies an image. This behavior was checked in the deployed `backend/src/services/storefrontCatalog.js` (`buildCollectionPage` and alphabetical product query).

The absent `/uploads/legacy-6a42cc687962f91d73d7.webp` is the Shirts collection’s historical fallback image. It remains in the missing-file inventory because the database still references it, but the customer does **not** need to provide a separate Shirts cover: the storefront can use an existing shirt product photo. No code, collection record, or image was changed for this clarification. The chooser checks whether a photo URL is listed, not whether the file exists.

## Historical status — November 6, 2026

**216 available / 21 missing / 237 active catalog media references.** Missing files comprise **15 photos and 6 videos**: 20 product files and one Shirts collection fallback image. The server also retains source copies and old URL aliases, for 426 retained files in total.

Confirmation labels follow the owner’s requested classification:

- **Confirmed**: existing media and media recovered from the owner’s ZebraDivaDesigns Etsy listings; all other catalog items retain this label. This is a product/source classification, not proof that a restored file is byte-for-byte identical to a lost original.
- **Unconfirmed**: the eight Myra products whose 38 replacement photos were sourced from manufacturer websites. The owner approved their use, but the photos are not confirmed as the original uploads or as showing the exact individual cowhide pattern.
- Availability is listed separately. A Confirmed catalog item may still have missing media; Confirmed does not mean recovered.

### New Etsy product additions — November 6, 2026

Compared all 29 current Etsy listings against the website catalog, including differently named existing products. Added 10 new products with 20 photos and 5 videos, and added No Bling as an option on the existing Masie Mallard Wildly Chic shirt. Bougie Lips and I May Look Calm Chicken each combine their Etsy Bling and No Bling listings into one website product. All three combined products use Bling $38 / No Bling $28. No separate No Bling product duplicates were created.

These additions are Confirmed because their content and media came from the owner’s Etsy listings. The 38 earlier manufacturer replacement photos remain Unconfirmed. The 25 newly imported files increase the total from 172 to 197 available files and from 202 to 227 referenced files; they do not reduce the 30 historically missing files. No Etsy identifiers were imported into website product fields. See [ETSY-PRODUCT-ADDITIONS-LOG.md](ETSY-PRODUCT-ADDITIONS-LOG.md) for the separate product comparison, imported details, and source mapping. No application code was changed.

### Exact work completed

1. Left the original 116 available media files untouched.
2. Restored 18 missing files (14 photos and 4 videos) for nine products from ZebraDivaDesigns on Etsy; marked Confirmed. Available media increased to 134; missing media decreased from 86 to 68.
3. With the owner’s approval, uploaded 38 manufacturer replacement photos for eight previously media-free Myra products; marked Unconfirmed. Available media increased to 172; missing media decreased to 30. No videos were replaced in this step.
4. Uploaded only to absent file paths already referenced by the catalog. Existing media, catalog records, media links, and application code were unchanged.
5. Verified the 56 uploaded files by checksums and application HTTP 200 responses. The earlier public URL checks returned HTTP 403; automated public delivery verification was not completed.
6. Updated this recovery log and ran the GitHub media backup. The [successful backup](https://github.com/chrismuha/pineneedledesigns.website/actions/runs/42323558539) retained 172 files on `daily-backups`; all 38 manufacturer replacements were checked against the backup checksums. The earlier 18 Etsy recoveries were also verified in the preceding backup.

### Confirmation and availability for every product

| Product | Confirmation | Available photos | Available videos | Missing photos | Missing videos |
| --- | --- | ---: | ---: | ---: | ---: |
| Adeline Bracelet | Confirmed | 4 | 2 | 0 | 0 |
| Adirondack Chic Leather and Cowhide Overnight Duffel Bag | Confirmed | 4 | 0 | 0 | 0 |
| America She's Beautiful | Confirmed | 2 | 1 | 0 | 0 |
| Amethyst Hairon & Canvas Bag | Unconfirmed | 5 | 0 | 0 | 0 |
| Autumn Cowgirl | Confirmed | 1 | 1 | 0 | 0 |
| Baby I'm a Wild Card | Confirmed | 0 | 0 | 1 | 1 |
| Betsey Johnson Blush Satin Heels | Confirmed | 1 | 0 | 0 | 0 |
| Blue Isle Cross Body Bag Small | Unconfirmed | 4 | 0 | 0 | 0 |
| Boo-Jee Boa | Confirmed | 1 | 0 | 0 | 0 |
| Bougie Lips T-Shirt | Confirmed | 1 | 1 | 0 | 0 |
| Brandi Bracelet | Confirmed | 5 | 1 | 0 | 0 |
| Bridal Lace Ribbon Snippet Roll: Navy & Ivory, Hand Stamped Tag | Confirmed | 5 | 0 | 0 | 0 |
| Carmen | Confirmed | 1 | 0 | 0 | 0 |
| Cheetah Boa | Confirmed | 1 | 0 | 0 | 0 |
| Country GaGa | Confirmed | 3 | 0 | 0 | 0 |
| Cowgirl Concert Goer T-Shirt | Confirmed | 1 | 0 | 0 | 0 |
| Cowhide Leather Checkered Wallet Wristlet | Confirmed | 2 | 0 | 0 | 0 |
| Cowhide Leather Wristlet | Confirmed | 3 | 0 | 0 | 0 |
| Cowhide Lv Faux Leather Shoulder Bag | Confirmed | 3 | 0 | 0 | 0 |
| Delphine Canvas & Hairon Bag | Unconfirmed | 6 | 0 | 0 | 0 |
| Don't Burst My Bubble Blinged Out T-Shirt | Confirmed | 1 | 1 | 0 | 0 |
| Don’t Burst My Bubble! Sweatshirt | Confirmed | 2 | 0 | 0 | 0 |
| Farmer Mrs. Synakowski | Confirmed | 0 | 0 | 6 | 2 |
| Feral Raccoon | Confirmed | 1 | 1 | 0 | 0 |
| FRANKLY my DEAR, I don’t give a damn either! With BLING | Confirmed | 1 | 1 | 0 | 0 |
| Guts, Grit And Lipstick Blinged Out T-Shirt | Confirmed | 1 | 0 | 0 | 0 |
| Happy Girls are the PRETTIEST! Blinged Out T-Shirt | Confirmed | 1 | 0 | 0 | 0 |
| Highland Cow in Her Crown. Rhinestone Shirt | Confirmed | 2 | 1 | 0 | 0 |
| I May Look Calm Chicken T-Shirt | Confirmed | 3 | 0 | 0 | 0 |
| I Woke Up Like This T-shirt Blinged Out | Confirmed | 3 | 1 | 0 | 0 |
| In a While Crocodile | Confirmed | 1 | 1 | 0 | 0 |
| Jennifer’s Garden | Confirmed | 0 | 0 | 7 | 2 |
| Juniper Hairon Canvas Weekender Bag | Unconfirmed | 4 | 0 | 0 | 0 |
| Lanthe Hairon and Canvas Bag | Unconfirmed | 5 | 0 | 0 | 0 |
| Leather Fanny Pack with Fringe | Confirmed | 3 | 0 | 0 | 0 |
| LV Upcycled Cowhide Leather Bag | Confirmed | 1 | 0 | 0 | 0 |
| Maia Concealed Bag | Unconfirmed | 4 | 0 | 0 | 0 |
| Masie Mallard Wildly Chic | Confirmed | 1 | 0 | 0 | 0 |
| Mischief Witch and Her Cat- Blinged Out | Confirmed | 1 | 0 | 0 | 0 |
| Miss Cheetah | Confirmed | 1 | 1 | 0 | 0 |
| Myra Mojave Leather Bag in Old Rose | Unconfirmed | 5 | 0 | 0 | 1 |
| On a Bad Day there’s Always Lipstick Blinged Out Sweatshirt | Confirmed | 0 | 0 | 2 | 1 |
| On a Bad Day there’s Always Lipstick Blinged Out T-Shirt | Confirmed | 1 | 1 | 0 | 0 |
| Peridot Hairon and Canvas Bag | Unconfirmed | 5 | 0 | 0 | 0 |
| Pink Tooled Leather Speedy Bag | Confirmed | 2 | 0 | 0 | 0 |
| Red Flower | Confirmed | 5 | 0 | 0 | 0 |
| Ruby Lee | Confirmed | 3 | 1 | 0 | 0 |
| Shirley Boho Bag | Confirmed | 9 | 2 | 0 | 0 |
| Smart Ass and Pretty Donkey Blinged Out | Confirmed | 4 | 0 | 0 | 0 |
| The Crowned Hare Vest | Confirmed | 9 | 1 | 0 | 0 |
| The LV Cowhide Leather Fringe Western (or Adirondack) Crossbody Bag | Confirmed | 3 | 0 | 0 | 0 |
| The Weekender Tote Bag | Confirmed | 3 | 0 | 0 | 0 |
| Turquoise and White Leather Speedy Bag | Confirmed | 3 | 0 | 0 | 0 |
| Turquoise Chic Blinged Out T-Shirt | Confirmed | 2 | 1 | 0 | 0 |
| Turquoise Girl Blinged Out Sweatshirt | Confirmed | 1 | 1 | 0 | 0 |
| Turquoise Junky Blinged out T-Shirt | Confirmed | 1 | 0 | 0 | 0 |
| Upcycled Black Suede and Brown Tooled Leather Backpack | Confirmed | 2 | 0 | 0 | 0 |
| Upcycled LOGO Barrette | Confirmed | 3 | 0 | 0 | 0 |
| Upcycled LV Canvas Pack | Confirmed | 3 | 0 | 0 | 0 |
| Upcycled LV Cowhide Leather Fringe Crossbody Bag | Confirmed | 2 | 0 | 0 | 0 |
| Upcycled LV Logo Bag | Confirmed | 3 | 0 | 0 | 0 |
| Upcycled LV Mini Flask Bag Charm | Confirmed | 4 | 0 | 0 | 0 |
| Upcycled LV Tooled Wristlet or Makeup Bag | Confirmed | 4 | 0 | 0 | 0 |

### Exact files still missing

| Item | Confirmation | Missing photos | Missing videos |
| --- | --- | ---: | ---: |
| Baby I'm a Wild Card | Confirmed | 1 | 1 |
| Jennifer’s Garden | Confirmed | 7 | 2 |
| Farmer Mrs. Synakowski | Confirmed | 6 | 2 |
| Myra Mojave Leather Bag in Old Rose | Unconfirmed | 0 | 1 |
| Shirts (collection) | Confirmed | 1 | 0 |

| Item | Confirmation | Missing path |
| --- | --- | --- |
| Baby I'm a Wild Card | Confirmed | `/uploads/1783691326976-435709395.webp` |
| Baby I'm a Wild Card | Confirmed | `/uploads/1785962462844-805310474.webm` |
| Jennifer’s Garden | Confirmed | `/uploads/1785698346966-317818312.webp` |
| Jennifer’s Garden | Confirmed | `/uploads/1785698347017-791748772.webp` |
| Jennifer’s Garden | Confirmed | `/uploads/1785698347029-676620032.webp` |
| Jennifer’s Garden | Confirmed | `/uploads/1785698347031-928742831.webp` |
| Jennifer’s Garden | Confirmed | `/uploads/1785698347035-46634783.webp` |
| Jennifer’s Garden | Confirmed | `/uploads/1785698347035-62299765.webp` |
| Jennifer’s Garden | Confirmed | `/uploads/1785698347041-32849318.webp` |
| Jennifer’s Garden | Confirmed | `/uploads/1785698359408-845967717.webm` |
| Jennifer’s Garden | Confirmed | `/uploads/1785698359436-219100135.webm` |
| Farmer Mrs. Synakowski | Confirmed | `/uploads/1785802847325-721535881.webp` |
| Farmer Mrs. Synakowski | Confirmed | `/uploads/1785802847600-540517333.webp` |
| Farmer Mrs. Synakowski | Confirmed | `/uploads/1785802847615-726191347.webp` |
| Farmer Mrs. Synakowski | Confirmed | `/uploads/1785802847622-953516934.webp` |
| Farmer Mrs. Synakowski | Confirmed | `/uploads/1785802847627-803996742.webp` |
| Farmer Mrs. Synakowski | Confirmed | `/uploads/1785802847636-731592493.webp` |
| Farmer Mrs. Synakowski | Confirmed | `/uploads/1785802874238-555619409.webm` |
| Farmer Mrs. Synakowski | Confirmed | `/uploads/1785802874369-16727371.webm` |
| Myra Mojave Leather Bag in Old Rose | Unconfirmed | `/uploads/1785875961641-957410862.webm` |
| Shirts (collection) | Confirmed | `/uploads/legacy-6a42cc687962f91d73d7.webp` |

## Recovery history and source mappings

The dated sections below preserve the sequence of recovery. Their intermediate missing-file totals are historical; the current totals and availability table above take precedence.

## November 6, 2026 — Etsy recovery

Source: [ZebraDivaDesigns on Etsy](https://www.etsy.com/shop/ZebraDivaDesigns). Counts verified against the live catalog and server uploads after restoration. These are current server counts; historical backup-status.json describes its own earlier backup.

| Status | Available files | Missing files | Total referenced files |
| --- | ---: | ---: | ---: |
| Before this recovery | 116 | 86 | 202 |
| After this recovery | 134 | 68 | 202 |

Restored 18 missing files: 14 photos and 4 videos across 9 products. The original 116 files were already available, not recovered in this operation. Existing media, database records, media links, and application code were unchanged. Files were restored to the missing paths already referenced by the catalog.

All 18 restored files passed checksum verification and the application served each with HTTP 200. Public URL checks returned HTTP 403, so public delivery could not be verified through automated requests.

### Missing media after the Etsy recovery (historical)

68 files remain missing: 61 photos and 7 videos. Of these, 67 belong to 12 products; one is a collection image. Matching sources for these remaining files were not established from the current Etsy listings.

| Product | Missing files |
| --- | ---: |
| Baby I'm a Wild Card | 2 |
| Blue Isle Cross Body Bag Small | 4 |
| Juniper Hairon Canvas Weekender Bag | 4 |
| Peridot Hairon and Canvas Bag | 5 |
| Delphine Canvas & Hairon Bag | 6 |
| Lanthe Hairon and Canvas Bag | 5 |
| Maia Concealed Bag | 4 |
| Amethyst Hairon & Canvas Bag | 5 |
| Shirley Boho Bag | 9 |
| Jennifer’s Garden | 9 |
| Farmer Mrs. Synakowski | 8 |
| Myra Mojave Leather Bag in Old Rose | 6 |

Remaining collection image: `/uploads/legacy-6a42cc687962f91d73d7.webp`.

### Restored files

| Product | Restored path | Source  Confirmation |
| --- | --- | ---  --- |
| Miss Cheetah | `/uploads/1783672358990-600883762.jpeg` | [Etsy media](https://i.etsystatic.com/13093702/r/il/ddbf29/8281651925/il_fullxfull.8281651925_blb7.jpg)  Confirmed |
| Miss Cheetah | `/uploads/1788368382629-301758658.webm` | [Etsy media](https://v.etsystatic.com/c/video/upload/ac_none,du_15,q_auto:good/znlf1c0oiziz3yz8trzj.mp4)  Confirmed |
| Boo-Jee Boa | `/uploads/1783690731684-51129312.webp` | [Etsy media](https://i.etsystatic.com/13093702/r/il/2f5dc5/8281692941/il_fullxfull.8281692941_jvjq.jpg)  Confirmed |
| Cheetah Boa | `/uploads/1783691108529-577199489.webp` | [Etsy media](https://i.etsystatic.com/13093702/r/il/65f80f/8233515976/il_fullxfull.8233515976_e87k.jpg)  Confirmed |
| Feral Raccoon | `/uploads/1783691640941-818083453.webp` | [Etsy media](https://i.etsystatic.com/13093702/r/il/07c772/8281364301/il_fullxfull.8281364301_qgyk.jpg)  Confirmed |
| Feral Raccoon | `/uploads/1788366958742-388818864.webm` | [Etsy media](https://v.etsystatic.com/c/video/upload/ac_none,du_15,q_auto:good/c0rid0qfid0ensnobcu8.mp4)  Confirmed |
| Masie Mallard Wildly Chic | `/uploads/1789949606594-515446718.webp` | [Etsy media](https://i.etsystatic.com/13093702/r/il/3b0bda/8244381784/il_fullxfull.8244381784_f0u0.jpg)  Confirmed |
| Autumn Cowgirl | `/uploads/1787763423018-785382150.webp` | [Etsy media](https://i.etsystatic.com/13093702/r/il/4260a4/8483221463/il_fullxfull.8483221463_1zcj.jpg)  Confirmed |
| Autumn Cowgirl | `/uploads/1787763423043-843837897.webm` | [Etsy media](https://v.etsystatic.com/c/video/upload/ac_none,du_15,q_auto:good/zmvqdm1u0q8xqsqvlmgc.mp4)  Confirmed |
| Smart Ass and Pretty Donkey Blinged Out | `/uploads/1786143404284-489770260.webp` | [Etsy media](https://i.etsystatic.com/13093702/r/il/03c78f/8399730373/il_fullxfull.8399730373_6tp8.jpg)  Confirmed |
| Smart Ass and Pretty Donkey Blinged Out | `/uploads/1786143404300-318314249.webp` | [Etsy media](https://i.etsystatic.com/13093702/r/il/c731d5/8399730399/il_fullxfull.8399730399_rwb1.jpg)  Confirmed |
| Smart Ass and Pretty Donkey Blinged Out | `/uploads/1786143404303-792340982.webp` | [Etsy media](https://i.etsystatic.com/13093702/r/il/cdb735/8399730457/il_fullxfull.8399730457_aqad.jpg)  Confirmed |
| Smart Ass and Pretty Donkey Blinged Out | `/uploads/1786143404304-862559829.webp` | [Etsy media](https://i.etsystatic.com/13093702/r/il/dc7b7a/8399730481/il_fullxfull.8399730481_olab.jpg)  Confirmed |
| In a While Crocodile | `/uploads/1784473998935-499706426.webp` | [Etsy media](https://i.etsystatic.com/13093702/r/il/665c74/8319100539/il_fullxfull.8319100539_245u.jpg)  Confirmed |
| In a While Crocodile | `/uploads/1788367213556-151018210.webm` | [Etsy media](https://v.etsystatic.com/c/video/upload/ac_none,du_15,q_auto:good/ti4pgpzkhjvndyhkuiy0.mp4)  Confirmed |
| Country GaGa | `/uploads/1785970237867-200640105.webp` | [Etsy media](https://i.etsystatic.com/13093702/r/il/343212/8344448704/il_fullxfull.8344448704_ks8j.jpg)  Confirmed |
| Country GaGa | `/uploads/1785970238841-929814564.webp` | [Etsy media](https://i.etsystatic.com/13093702/r/il/83a7a2/8392335739/il_fullxfull.8392335739_8p9b.jpg)  Confirmed |
| Country GaGa | `/uploads/1785970239931-614621459.webp` | [Etsy media](https://i.etsystatic.com/13093702/r/il/a8d2f7/8392335747/il_fullxfull.8392335747_1m3j.jpg)  Confirmed |

## November 6, 2026 — Approved manufacturer replacement photos

The owner approved using matching manufacturer photos even though they could not be confirmed as the original uploads. These are replacement photos of the same models; natural cowhide patterns may differ from the individual bags.

Uploaded 38 replacement photos across 8 previously media-free products. Existing 134 media files, all catalog records and media links, and application code were unchanged. No videos were replaced. All 38 files passed checksum verification and application HTTP 200 image checks.

Current totals: **172 available / 30 missing / 202 referenced files**. Missing: **23 photos and 7 videos**, comprising 29 product files and one collection image. This section supersedes the earlier remaining-media totals.

| Product still missing media | Missing files  Confirmed |
| --- | ---:  --- |
| Baby I'm a Wild Card | 2  Confirmed |
| Shirley Boho Bag | 9  Confirmed |
| Jennifer’s Garden | 9  Confirmed |
| Farmer Mrs. Synakowski | 8  Confirmed |
| Myra Mojave Leather Bag in Old Rose | 1  Confirmed |

The Mojave Old Rose bag now has photos; its original video remains missing. The collection image remains `/uploads/legacy-6a42cc687962f91d73d7.webp`.

### Replacement photo sources

| Product | Manufacturer SKU | Photos uploaded | Source  Confirmation |
| --- | --- | ---: | ---  --- |
| Blue Isle Cross Body Bag Small | S-5216 | 4 | [Manufacturer gallery](https://myrabag.com/products/blue-isle-small-crossbody-bag)  Unconfirmed |
| Juniper Hairon Canvas Weekender Bag | S-5214 | 4 | [Manufacturer gallery](https://myrabag.com/products/juniper-canvas-and-hairon-bag)  Unconfirmed |
| Peridot Hairon and Canvas Bag | S-5219 | 5 | [Manufacturer gallery](https://myrabag.com/products/peridot-canvas-hairon-bag)  Unconfirmed |
| Delphine Canvas & Hairon Bag | S-5218 | 6 | [Manufacturer gallery](https://myrabag.com/products/delphine-canvas-hairon-bag)  Unconfirmed |
| Lanthe Hairon and Canvas Bag | S-5215 | 5 | [Manufacturer gallery](https://myrabag.com/products/lanthe-canvas-and-hairon-bag)  Unconfirmed |
| Maia Concealed Bag | S-5217 | 4 | [Manufacturer gallery](https://myrabag.com/products/maia-concealed-bag)  Unconfirmed |
| Amethyst Hairon & Canvas Bag | S-5213 | 5 | [Manufacturer gallery](https://myrabag.com/products/amethyst-canvas-and-hairon-bag)  Unconfirmed |
| Myra Mojave Leather Bag in Old Rose | S-12997 | 5 | [Manufacturer gallery](https://myrabag.ca/products/mojave-meadow-leather-bag-in-old-rose)  Unconfirmed |

### Replacement file mapping

| Product | Existing catalog path restored | Manufacturer image  Confirmation |
| --- | --- | ---  --- |
| Blue Isle Cross Body Bag Small | `/uploads/1783991943053-319234647.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5216-1.jpg?v=1777532732)  Unconfirmed |
| Blue Isle Cross Body Bag Small | `/uploads/1783998578622-36361855.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5216-2.jpg?v=1777532732)  Unconfirmed |
| Blue Isle Cross Body Bag Small | `/uploads/1784045789562-226366899.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5216-3.jpg?v=1777532732)  Unconfirmed |
| Blue Isle Cross Body Bag Small | `/uploads/1784045789568-341514717.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5216-4.jpg?v=1777532732)  Unconfirmed |
| Juniper Hairon Canvas Weekender Bag | `/uploads/1784063952592-719836236.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5214-1.jpg?v=1790593461)  Unconfirmed |
| Juniper Hairon Canvas Weekender Bag | `/uploads/1784063952593-266536681.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5214-2.jpg?v=1790593461)  Unconfirmed |
| Juniper Hairon Canvas Weekender Bag | `/uploads/1784065340652-707136497.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5214-3.jpg?v=1790593461)  Unconfirmed |
| Juniper Hairon Canvas Weekender Bag | `/uploads/1784137587664-829198967.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5214-4.jpg?v=1790593461)  Unconfirmed |
| Peridot Hairon and Canvas Bag | `/uploads/1784069113156-160039583.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5219-1_59b0de2a-5e6f-40d6-af02-50eed800f59e.jpg?v=1791367398)  Unconfirmed |
| Peridot Hairon and Canvas Bag | `/uploads/1784069818266-625432947.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5219-2_a5c7e81a-c06d-487a-bc7a-58cdf763e57c.jpg?v=1791367397)  Unconfirmed |
| Peridot Hairon and Canvas Bag | `/uploads/1784137385703-310900338.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5219-3_773da930-56c7-4125-888f-3b93e3e085f8.jpg?v=1791367397)  Unconfirmed |
| Peridot Hairon and Canvas Bag | `/uploads/1784137385805-32981382.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5219-4_e2768ba9-a322-4c91-baee-a5bd47e0ed36.jpg?v=1791367397)  Unconfirmed |
| Peridot Hairon and Canvas Bag | `/uploads/1784137385807-342546709.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5219-5_b1f7e695-ed89-424c-8f80-98b3d5519027.jpg?v=1791367397)  Unconfirmed |
| Delphine Canvas & Hairon Bag | `/uploads/1784139274731-996967941.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5218-1.jpg?v=1790593581)  Unconfirmed |
| Delphine Canvas & Hairon Bag | `/uploads/1784139274735-513118032.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5218-2.jpg?v=1790593581)  Unconfirmed |
| Delphine Canvas & Hairon Bag | `/uploads/1784139274736-23585267.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5218-3.jpg?v=1790593581)  Unconfirmed |
| Delphine Canvas & Hairon Bag | `/uploads/1784139274740-487683339.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5218-4.jpg?v=1790593581)  Unconfirmed |
| Delphine Canvas & Hairon Bag | `/uploads/1784139274745-179245036.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5218-5.jpg?v=1790593581)  Unconfirmed |
| Delphine Canvas & Hairon Bag | `/uploads/1784224391324-892861758.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5218_d751ede6-c661-4e4c-ba31-4ddbaedab7ba.jpg?v=1758797611)  Unconfirmed |
| Lanthe Hairon and Canvas Bag | `/uploads/1784140108446-170016502.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5215-1.jpg?v=1791367084)  Unconfirmed |
| Lanthe Hairon and Canvas Bag | `/uploads/1784140108447-705424667.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5215-2.jpg?v=1791367084)  Unconfirmed |
| Lanthe Hairon and Canvas Bag | `/uploads/1784140108453-71159071.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5215-3.jpg?v=1791367084)  Unconfirmed |
| Lanthe Hairon and Canvas Bag | `/uploads/1784140108458-32206855.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5215-4.jpg?v=1791367084)  Unconfirmed |
| Lanthe Hairon and Canvas Bag | `/uploads/1784224564731-274139057.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5215-5.jpg?v=1791367084)  Unconfirmed |
| Maia Concealed Bag | `/uploads/1784141062386-13376486.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5217-1.jpg?v=1778302012)  Unconfirmed |
| Maia Concealed Bag | `/uploads/1784141062387-905025949.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5217-2.jpg?v=1778302012)  Unconfirmed |
| Maia Concealed Bag | `/uploads/1784141062389-715251127.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5217-3.jpg?v=1778302012)  Unconfirmed |
| Maia Concealed Bag | `/uploads/1784141062390-880746567.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5217-4.jpg?v=1778302012)  Unconfirmed |
| Amethyst Hairon & Canvas Bag | `/uploads/1784141799612-261580366.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5213_1_191fcbed-c794-456d-a8a8-a4e15ebac372.jpg?v=1758797407)  Unconfirmed |
| Amethyst Hairon & Canvas Bag | `/uploads/1784141799614-945457380.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5213_2_edba5f64-45e6-4e03-9a01-84d96522167d.jpg?v=1758797407)  Unconfirmed |
| Amethyst Hairon & Canvas Bag | `/uploads/1784141799616-55630534.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5213_3_a38af16d-ea0d-4312-b0b1-01376e5c3b05.jpg?v=1758797407)  Unconfirmed |
| Amethyst Hairon & Canvas Bag | `/uploads/1784141799616-97553241.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5213_4_4f6e0ef6-e41e-44f2-83d2-ca2c91a50169.jpg?v=1758797407)  Unconfirmed |
| Amethyst Hairon & Canvas Bag | `/uploads/1784141799618-901243083.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5213_5_0be280c7-d07e-410c-b48d-66b93228a28a.jpg?v=1758797407)  Unconfirmed |
| Myra Mojave Leather Bag in Old Rose | `/uploads/1785875956329-798591988.webp` | [Source image](https://cdn.shopify.com/s/files/1/0631/7631/0870/files/S-12997_2_239ee196-957c-4c53-ba2a-2d1a9d5bee14.jpg?v=1767187883)  Unconfirmed |
| Myra Mojave Leather Bag in Old Rose | `/uploads/1785875956390-754376166.webp` | [Source image](https://cdn.shopify.com/s/files/1/0631/7631/0870/files/S-12997_3_12180960-30f5-4478-8826-199097bdf48b.jpg?v=1767187883)  Unconfirmed |
| Myra Mojave Leather Bag in Old Rose | `/uploads/1785875956390-757348513.webp` | [Source image](https://cdn.shopify.com/s/files/1/0631/7631/0870/files/S-12997_4_ab6d864c-c78c-4c20-83b6-9fdff794d08e.jpg?v=1767187883)  Unconfirmed |
| Myra Mojave Leather Bag in Old Rose | `/uploads/1785875956395-433422140.webp` | [Source image](https://cdn.shopify.com/s/files/1/0631/7631/0870/files/S-12997_1_87ef2c59-9670-4fb2-9839-38a9d08afabb.jpg?v=1767187883)  Unconfirmed |
| Myra Mojave Leather Bag in Old Rose | `/uploads/1785875956396-400668000.webp` | [Source image](https://cdn.shopify.com/s/files/1/0631/7631/0870/files/S-12997_5_52e34d69-1742-40db-8c3b-f80115762ee4.jpg?v=1767187883)  Unconfirmed |

## Backup verification after Etsy product additions

[GitHub backup completed successfully](https://github.com/chrismuha/pineneedledesigns.website/actions/runs/42325322573). Verified all 25 imported files against the backup SHA-256 checksums; the saved catalog contains all 63 products, all 10 additions, and the three combined Bling/No Bling products with the expected prices. Backup totals: **197 available files and 30 missing references**. No Etsy identifiers were imported into the new product records.

## Autumn Cowgirl — customer-supplied video, November 6, 2026

**Confirmation: Confirmed — supplied directly by the owner.**

- Input: `IMG_4191.mov`, supplied from the owner’s Desktop. The local original was left unchanged.
- Final requested website format: **WebM**. An initial MP4 request was superseded by the owner’s instruction to use WebM; no MP4 was uploaded.
- Converted to VP9 WebM with Opus audio, retaining the video’s full duration and correcting its display orientation. Location metadata was removed from the upload.
- Replaced only Autumn Cowgirl’s video association with the new WebM. Its photos and other product fields were unchanged, apart from the normal modification timestamp.
- Retained the previous Etsy WebM on the server and in backups.
- Preserved a MOV source copy by remuxing the original video/audio streams without recompression, removing location metadata and auxiliary data tracks. This is a metadata-stripped source copy, not a byte-identical copy of the local MOV.
- Verified both uploaded files by SHA-256; the application serves the new video with HTTP 200 and `video/webm`.

| Purpose | Saved path | SHA-256 |
| --- | --- | --- |
| Website WebM | `/uploads/autumn-cowgirl-customer-a5e7309365.webm` | `f1e0679da27198f1985c9c5324b806c18765f8fb05d49107e886e82f0126f080` |
| Metadata-stripped MOV source copy | `/uploads/originals/autumn-cowgirl-source-a5e7309365.mov` | `83a87d53e0332ef08d4bca9358865d37d925adce94d2d685098791cd997adbc9` |

### What the backups include

Media committed before the database migration remains available in Git history. The historical migration/removal commit is an ancestor of the repository’s current main branch. Removing an asset from the current tree does not erase that committed history. This does not establish that every camera-original file was ever committed.

The scheduled GitHub backup reads the server’s catalog and copies the server uploads directory, retaining older files and snapshots. It does not automatically scan Desktop, Downloads, Messages attachments, or other arbitrary local folders. The current uploader can remove raw uploaded videos after successful conversion; an original that was neither committed nor captured by a backup cannot be assumed to be recoverable. For this video, the local original is still on Desktop and the metadata-stripped MOV source copy is explicitly included in the server uploads backup.

Active catalog media totals remain 197 available and 30 missing out of 227 referenced paths: this operation replaced a working video rather than filling another missing slot. The server now retains 199 media files, including the superseded Etsy video and the source MOV copy. The backup’s inventory-inclusive referenced-file count can therefore differ from the active catalog-only count.

[GitHub backup completed successfully](https://github.com/chrismuha/pineneedledesigns.website/actions/runs/42325887134). Both the WebM and metadata-stripped MOV source copy match their recorded SHA-256 checksums in the backup. The saved catalog points Autumn Cowgirl to the new WebM and preserves its photo. The Desktop original’s checksum is unchanged. The backup retains 199 media files and still reports the same 30 missing paths.

## Shirley Boho Bag — owner-supplied media, November 6, 2026

**Confirmation: Confirmed — owner-supplied camera files in `Downloads/shorley`.**

Restored the product’s gallery using all nine supplied HEIC photos and both MOV videos. The previous product record listed eight absent photos and one absent video; those nine unavailable references were replaced with nine WebP photo paths and two WebM video paths. This adds two gallery entries and reduces the current missing-file count by nine. Only Shirley’s photo/video arrays and modification timestamp changed. All other 62 products, product details, and pre-existing working media were preserved.

### File naming convention

New manual media uploads use readable product-based names: `shirley-boho-bag-picture-01.webp` through `shirley-boho-bag-picture-09.webp`, and `shirley-boho-bag-video-01.webm` / `shirley-boho-bag-video-02.webm`. Use the same product-name + picture/video + number pattern for future manual media additions. The database references these exact names; the server upload mirror in GitHub retains the same names, and the existing per-product backup folder contains copies with those readable names. `media.json` maps each backup file to its website URL. Existing working media elsewhere was not renamed, and automatic dashboard-upload code was not changed.

A full-bag photo is first, followed by the remaining views and details. The photos were rotated 90 degrees clockwise for upright display. HEIC images became WebP website photos; full-resolution, metadata-stripped PNG source copies preserve the decoded photo pixels without further lossy compression. MOV inputs became VP9/Opus WebM videos. Metadata-stripped MOV source copies preserve their video/audio streams without recompression. These source copies are not byte-identical camera originals. Location metadata is absent from the uploads. All 11 original HEIC/MOV files remain unchanged in the owner’s Downloads folder.

### Original-to-website mapping

| Original camera file | Website file | Retained source copy | Confirmation |
| --- | --- | --- | --- |
| `IMG_3996.heic` | `/uploads/shirley-boho-bag-picture-01.webp` | `/uploads/originals/shirley-boho-bag/shirley-boho-bag-source-picture-01.png` | Confirmed |
| `IMG_3995.heic` | `/uploads/shirley-boho-bag-picture-02.webp` | `/uploads/originals/shirley-boho-bag/shirley-boho-bag-source-picture-02.png` | Confirmed |
| `IMG_4001.heic` | `/uploads/shirley-boho-bag-picture-03.webp` | `/uploads/originals/shirley-boho-bag/shirley-boho-bag-source-picture-03.png` | Confirmed |
| `IMG_4002.heic` | `/uploads/shirley-boho-bag-picture-04.webp` | `/uploads/originals/shirley-boho-bag/shirley-boho-bag-source-picture-04.png` | Confirmed |
| `IMG_4003.heic` | `/uploads/shirley-boho-bag-picture-05.webp` | `/uploads/originals/shirley-boho-bag/shirley-boho-bag-source-picture-05.png` | Confirmed |
| `IMG_3999.heic` | `/uploads/shirley-boho-bag-picture-06.webp` | `/uploads/originals/shirley-boho-bag/shirley-boho-bag-source-picture-06.png` | Confirmed |
| `IMG_4007.heic` | `/uploads/shirley-boho-bag-picture-07.webp` | `/uploads/originals/shirley-boho-bag/shirley-boho-bag-source-picture-07.png` | Confirmed |
| `IMG_4008.heic` | `/uploads/shirley-boho-bag-picture-08.webp` | `/uploads/originals/shirley-boho-bag/shirley-boho-bag-source-picture-08.png` | Confirmed |
| `IMG_3994.heic` | `/uploads/shirley-boho-bag-picture-09.webp` | `/uploads/originals/shirley-boho-bag/shirley-boho-bag-source-picture-09.png` | Confirmed |
| `IMG_3997.MOV` | `/uploads/shirley-boho-bag-video-01.webm` | `/uploads/originals/shirley-boho-bag/shirley-boho-bag-source-video-01.mov` | Confirmed |
| `IMG_3998.MOV` | `/uploads/shirley-boho-bag-video-02.webm` | `/uploads/originals/shirley-boho-bag/shirley-boho-bag-source-video-02.mov` | Confirmed |

### Verification

All 22 uploaded website/source files passed SHA-256 verification. All 11 gallery files were served by the application with HTTP 200. Local camera-original checksums were verified unchanged.

Active catalog totals are now **208 available / 21 missing / 229 referenced paths**. The server retains **221 files**, including source copies and superseded media. The remaining missing product media belongs to Baby I’m a Wild Card (1 photo, 1 video), Jennifer’s Garden (7 photos, 2 videos), Farmer Mrs. Synakowski (6 photos, 2 videos), and Myra Mojave Leather Bag in Old Rose (1 video), plus one Shirts collection fallback image. A separate customer-supplied Shirts cover is unnecessary.

[GitHub backup completed successfully](https://github.com/chrismuha/pineneedledesigns.website/actions/runs/42326517790). Verified SHA-256 checksums for all 22 Shirley website/source files in the backup. The saved catalog contains the nine readable photo paths and two readable video paths. The product’s organized backup `media.json` maps all 11 available gallery files to readable local filenames. The live storefront response also contains all nine photos and both videos, with picture 01 first. The backup retains 221 files and reports 21 missing references; all 11 original files in Downloads remain unchanged.

## Product-based naming for all available media — November 6, 2026

Renamed the canonical database links for **205 available media references across 79 product/collection records**. Names use the product or collection title, followed by `picture-01`, `video-01`, `video-poster-01`, or `collection-cover`, with the existing extension. The 11 Shirley gallery paths already followed the standard and were preserved. Photo/video contents, ordering, formats, prices, descriptions, options, confirmation labels, and other product details were unchanged. No application code was changed.

The readable names were created as hard-link aliases of the existing files. Original filenames/URLs were retained so cached pages and historical backups remain usable. They are retained compatibility copies, not the canonical database links. Historical backup files and Git history were not deleted or rewritten. The current organized product backup `media.json` maps to the new readable filenames; older retained copies may still appear beside current files. Source archive names were already descriptive and were preserved.

All available canonical paths follow the naming standard. The **21 pre-existing missing references** remain unchanged because no file exists to rename or verify. Their exact paths and confirmation/availability status remain listed above. No additional media became missing.

Shared collection/product media now has a separate descriptive alias for each use, increasing unique active catalog paths by eight without adding different media content. Active catalog counts are therefore **216 available + 21 missing = 237 unique references**. Physical retained-file count is **426**, including old aliases, source copies, and superseded media.

### Checks completed

- Verified the old and new file contents have matching SHA-256 hashes for every renamed reference.
- Verified all 205 new URLs return HTTP 200.
- Verified all 413 distinct current-available and old-alias URLs return HTTP 200.
- Verified every updated database field matches its intended new filename and all non-media fields are preserved.
- Confirmed the set of 21 missing paths is unchanged.

Final verification completed: the live storefront matches all 63 product image/video/poster arrays and all collection-cover selections. All 413 available canonical/old-alias URLs return HTTP 200. The [GitHub backup completed successfully](https://github.com/chrismuha/pineneedledesigns.website/actions/runs/42326891042). Verified all 205 new/old SHA-256 pairs, every saved catalog record, and all 90 organized product/collection `media.json` mappings. The backup retains 426 files and reports the same 21 previously missing paths. These missing files remain unresolved; this naming operation did not claim to recover them.

### Filename mapping

| Item | Field / slot | Previous URL retained as alias | Canonical URL | SHA-256 |
| --- | --- | --- | --- | --- |
| Turquoise and White Leather Speedy Bag | photos 1 | `/uploads/legacy-344acea72c677055a5ec.webp` | `/uploads/turquoise-and-white-leather-speedy-bag-picture-01.webp` | `74c9cabb17495f172b1ddae50e5395db27e72449545ba17d08c19798f4ca2924` |
| Turquoise and White Leather Speedy Bag | photos 2 | `/uploads/legacy-15692edf14cf4f3a5d37.webp` | `/uploads/turquoise-and-white-leather-speedy-bag-picture-02.webp` | `d5adff6f6ba7ea55b3a0eba9e32c671729cfd082876bf318655e704ecb67b659` |
| Turquoise and White Leather Speedy Bag | photos 3 | `/uploads/legacy-47f8b4e296cecf075784.webp` | `/uploads/turquoise-and-white-leather-speedy-bag-picture-03.webp` | `50b79ca69f9f3c48eed0145beddc3a88ed741dd0fdf6f6e95e0244e8affb6e71` |
| Red Flower | photos 1 | `/uploads/legacy-29cb5c7fa72eb213eaf5.webp` | `/uploads/red-flower-picture-01.webp` | `9d4314bf74dbe91a29d8476f07f73ab9ba1cd200592faacddc0234c985f0a914` |
| Red Flower | photos 2 | `/uploads/legacy-b5a4230deba7fd6fe5c1.webp` | `/uploads/red-flower-picture-02.webp` | `c694e4b9e967e99801e0e62897777512de2f76cbdde9aa5fd86b9833ce200d2d` |
| Red Flower | photos 3 | `/uploads/legacy-eeb2f82cd67364663179.webp` | `/uploads/red-flower-picture-03.webp` | `b5ccd806a4a9c25f7cd4f1b24578557a7a45a64935baac964fb83320a8ae9545` |
| Red Flower | photos 4 | `/uploads/legacy-66685082b5665e9fc47d.webp` | `/uploads/red-flower-picture-04.webp` | `99c6aa3e4111f682a545869dc45d5d93c4f643c36c911b2fcff527a7db53f1c5` |
| Red Flower | photos 5 | `/uploads/legacy-4c7805de863c1c03e334.webp` | `/uploads/red-flower-picture-05.webp` | `d6fe92aed7084d1166ddf0cf3053c031fa790db51dc6b044640c2b9da2e2bc13` |
| America She's Beautiful | photos 1 | `/uploads/legacy-e272b3723243ddaabc41.webp` | `/uploads/america-she-s-beautiful-picture-01.webp` | `d9681240fad40b6cff44c750ea21896e6a54f3606731695517459af510224b9d` |
| America She's Beautiful | photos 2 | `/uploads/legacy-f01a9c7442f10988281c.webp` | `/uploads/america-she-s-beautiful-picture-02.webp` | `85a590f8749c6d61c38002bb2e1d7c0d5e374a0d0f9077c549df4211dd51648e` |
| America She's Beautiful | videos 1 | `/uploads/legacy-03cb35862b89ab1f6c25.webm` | `/uploads/america-she-s-beautiful-video-01.webm` | `28643df4ef50eddf83f3ae4d5a63781fbfc7ddb35ae7bb8f229452dc1557a52e` |
| America She's Beautiful | videoPosters 1 | `/uploads/legacy-f2542222365bc6c9a2f9.webp` | `/uploads/america-she-s-beautiful-video-poster-01.webp` | `52c01ce9617a6d9ba9f082a1b323d3354753904585c981f6822e138031d4f343` |
| Ruby Lee | photos 1 | `/uploads/legacy-08fff9d200bc25fa936b.webp` | `/uploads/ruby-lee-picture-01.webp` | `bedddf6136d63b44269a9d57e7576e953b36312b19c8313ac21c25f15214c6b4` |
| Ruby Lee | photos 2 | `/uploads/legacy-e43ac9220187e89df242.webp` | `/uploads/ruby-lee-picture-02.webp` | `fb3d89ce90980c3d84c01823698f189bb7ffb5ceeb3f7f33bd044e0b9cb88656` |
| Ruby Lee | photos 3 | `/uploads/legacy-29f6b9cb001c2b7c8df4.webp` | `/uploads/ruby-lee-picture-03.webp` | `b5816f836305708c0f0be1e0fbb772f9f4505549a18e2c33091b477bcce66f98` |
| Ruby Lee | videos 1 | `/uploads/legacy-77913138cd6ab87f4733.webm` | `/uploads/ruby-lee-video-01.webm` | `d6a71c5f793b0ebc7a963395493e5db693edae26d4a45a5ada8ee3398362f751` |
| Ruby Lee | videoPosters 1 | `/uploads/legacy-145654049cb514b6977d.webp` | `/uploads/ruby-lee-video-poster-01.webp` | `82fffa3cb6ef4c5125b16cb280a66e706c1aa1f5f4e56c143cc482aef458c7f4` |
| Carmen | photos 1 | `/uploads/legacy-f65d415bc32e5f4b269c.webp` | `/uploads/carmen-picture-01.webp` | `06cc6ca92be5fd0d4b59c04cd29bbfce86a883ec29b1b580e4e29522facfed60` |
| On a Bad Day there’s Always Lipstick Blinged Out Sweatshirt | videoPosters 1 | `/uploads/legacy-e3689ed4d2f8efb06f22.webp` | `/uploads/on-a-bad-day-theres-always-lipstick-blinged-out-sweatshirt-video-poster-01.webp` | `7fd49c7f11ce6d0aba659c6106dda8759259c4af84ae42ee3da906b1ff7aa88f` |
| Turquoise Chic Blinged Out T-Shirt | photos 1 | `/uploads/legacy-722c0e3a52a92872b4cf.webp` | `/uploads/turquoise-chic-blinged-out-t-shirt-picture-01.webp` | `6cff874a21c2894b2b1cfc7c79e5e479e945f49dca46482908fc2e8baa726fa6` |
| Turquoise Chic Blinged Out T-Shirt | photos 2 | `/uploads/legacy-1a389fd98f0c14d7af9c.webp` | `/uploads/turquoise-chic-blinged-out-t-shirt-picture-02.webp` | `b2c56b7032a686dea4d10d324cb9ec0652958fc9595514c4220e54039fb34b48` |
| Turquoise Chic Blinged Out T-Shirt | videos 1 | `/uploads/legacy-4bc11d62236a8edb84b9.webm` | `/uploads/turquoise-chic-blinged-out-t-shirt-video-01.webm` | `fa6c96f8a65534ff65621555782a3edf37938ca790796149486cfbe706127e29` |
| Turquoise Chic Blinged Out T-Shirt | videoPosters 1 | `/uploads/legacy-4eb166aaac93c68e939c.webp` | `/uploads/turquoise-chic-blinged-out-t-shirt-video-poster-01.webp` | `8b11717b5d76c732775d8eb345eb3c8711c2930829cb3c80f81a4128bb3b3949` |
| On a Bad Day there’s Always Lipstick Blinged Out T-Shirt | photos 1 | `/uploads/legacy-ab3c97011c2c9ce61909.webp` | `/uploads/on-a-bad-day-theres-always-lipstick-blinged-out-t-shirt-picture-01.webp` | `2a6f88a0e040e7d292671fb283ea766374437009ae3650bce150447c134bb90c` |
| On a Bad Day there’s Always Lipstick Blinged Out T-Shirt | videos 1 | `/uploads/legacy-bac45177a2487ef0a404.webm` | `/uploads/on-a-bad-day-theres-always-lipstick-blinged-out-t-shirt-video-01.webm` | `11733d84ac30cf731382568388ea6bae8e8bccfe877abea48737743b5bf269cb` |
| On a Bad Day there’s Always Lipstick Blinged Out T-Shirt | videoPosters 1 | `/uploads/legacy-ab3c97011c2c9ce61909.webp` | `/uploads/on-a-bad-day-theres-always-lipstick-blinged-out-t-shirt-video-poster-01.webp` | `2a6f88a0e040e7d292671fb283ea766374437009ae3650bce150447c134bb90c` |
| Don't Burst My Bubble Blinged Out T-Shirt | photos 1 | `/uploads/legacy-e840ba1c6aa72f8d6a77.webp` | `/uploads/don-t-burst-my-bubble-blinged-out-t-shirt-picture-01.webp` | `f9bd82aca4912a40e5e2576bf486f51afcdceb5ce9237f70809428a68e522cf8` |
| Don't Burst My Bubble Blinged Out T-Shirt | videos 1 | `/uploads/legacy-6de1c9736ff3aa04d9ce.webm` | `/uploads/don-t-burst-my-bubble-blinged-out-t-shirt-video-01.webm` | `558ebbbe84a9aa69c6032d5b46c8567008f632470935927209909bf6d37def22` |
| Don't Burst My Bubble Blinged Out T-Shirt | videoPosters 1 | `/uploads/legacy-10aee3c13f1a96acd8ff.webp` | `/uploads/don-t-burst-my-bubble-blinged-out-t-shirt-video-poster-01.webp` | `0cc2f35a5f8128ebb86b61e842c925ca36520d95c495d119435e022ab4748773` |
| Cowgirl Concert Goer T-Shirt | photos 1 | `/uploads/legacy-21cf44afe9e1e81561a1.webp` | `/uploads/cowgirl-concert-goer-t-shirt-picture-01.webp` | `c8bee927a402c11f23761fa3cc4843815ca31e63754549978945e92ea0dcde93` |
| Guts, Grit And Lipstick Blinged Out T-Shirt | photos 1 | `/uploads/legacy-07cc983c6d3ae474012a.webp` | `/uploads/guts-grit-and-lipstick-blinged-out-t-shirt-picture-01.webp` | `7b40a2275c3344e1484566461f65a1a8f53e058652022b2a058fe6ed61806d6d` |
| Happy Girls are the PRETTIEST! Blinged Out T-Shirt | photos 1 | `/uploads/legacy-9adbc6f48a1af5da3eac.webp` | `/uploads/happy-girls-are-the-prettiest-blinged-out-t-shirt-picture-01.webp` | `494c33e5f40de2928f227d19eda517c7c26fc3e74b0ab8c3f690d42c3aa55260` |
| Betsey Johnson Blush Satin Heels | photos 1 | `/uploads/legacy-396c64640278750b0871.webp` | `/uploads/betsey-johnson-blush-satin-heels-picture-01.webp` | `9980dd17e29f564e73d76fb431186884d1d363e21c32c6c87c8502e0d7bf6aba` |
| The Crowned Hare Vest | photos 1 | `/uploads/legacy-989ee94218ac7c0edc29.webp` | `/uploads/the-crowned-hare-vest-picture-01.webp` | `7a73f6c36340e2563aff836e3084ed5cf7c4094e66e4a5fe0366a3281467acf2` |
| The Crowned Hare Vest | photos 2 | `/uploads/legacy-8aac1ab4c1c2f361662b.webp` | `/uploads/the-crowned-hare-vest-picture-02.webp` | `25fe74dd2a6421a99473fa951da4e8cb70526081b2608242a053111683314991` |
| The Crowned Hare Vest | photos 3 | `/uploads/legacy-5e98a9c7b804c4cf285c.webp` | `/uploads/the-crowned-hare-vest-picture-03.webp` | `8664bb8d258c542ebd2e7a48bb26f2e5f2d5e1fdf947d7d15e98a3e22a25a1fb` |
| The Crowned Hare Vest | photos 4 | `/uploads/legacy-5ab17c3bbbaf972c406b.webp` | `/uploads/the-crowned-hare-vest-picture-04.webp` | `882746843d536cfd5ecde354398a8491e207a6cc5737f3c9645d3f525b180a3d` |
| The Crowned Hare Vest | photos 5 | `/uploads/legacy-d004bc21419df668e872.webp` | `/uploads/the-crowned-hare-vest-picture-05.webp` | `6507681cbc9a107bd8d4c097461b2bb26cc1b068f433f3d15edf4b487960edd4` |
| The Crowned Hare Vest | photos 6 | `/uploads/legacy-bfabb8ea9ce47643c8f6.webp` | `/uploads/the-crowned-hare-vest-picture-06.webp` | `ea9d55f893ead33d28a9d4c50e72f3136dbb89948bef084159c4759c543f1061` |
| The Crowned Hare Vest | photos 7 | `/uploads/legacy-74182fc578d4c5b8c491.webp` | `/uploads/the-crowned-hare-vest-picture-07.webp` | `e3671668a61e974dc5537f6c39ff8ffbe9bb5c468a8a994902bc11295dfa974c` |
| The Crowned Hare Vest | photos 8 | `/uploads/legacy-d9f1853e78b031b33ec4.webp` | `/uploads/the-crowned-hare-vest-picture-08.webp` | `0fe9b6a1b53f788069604a3fdd483f916e15e3033f2fb91aa4c8b0fb42df489d` |
| The Crowned Hare Vest | photos 9 | `/uploads/legacy-3af64788886e85c5de3a.webp` | `/uploads/the-crowned-hare-vest-picture-09.webp` | `f215956576bc5c7bd5d68fc9e43f1d6d36916d8e5488f8a6ef96c81d16d24a30` |
| The Crowned Hare Vest | videos 1 | `/uploads/legacy-20f7f5f792e80fc91658.webm` | `/uploads/the-crowned-hare-vest-video-01.webm` | `f24578f881ef312dad9eaf053ff9d187087b880b2a1598b4183842df99772472` |
| The Crowned Hare Vest | videoPosters 1 | `/uploads/legacy-a74460b9f1db1877a323.webp` | `/uploads/the-crowned-hare-vest-video-poster-01.webp` | `9ddf040f91973236fa291c10daa458976ab18e75edfdf89c0efcaadff7f32a5a` |
| Brandi Bracelet | photos 1 | `/uploads/legacy-a77b44ce0b4cdad490e0.webp` | `/uploads/brandi-bracelet-picture-01.webp` | `71e480ab445ea9c352b3d11a1aa68de9da9afd7a35e8db8c05b3aa475508f2b6` |
| Brandi Bracelet | photos 2 | `/uploads/legacy-26fda35654083171776b.webp` | `/uploads/brandi-bracelet-picture-02.webp` | `1dc84805d7c63e33ed6229effb09fc5cf289206b8b5fab848205e564c2d9374c` |
| Brandi Bracelet | photos 3 | `/uploads/legacy-3c83f109e5bbb12755f5.webp` | `/uploads/brandi-bracelet-picture-03.webp` | `0110127b5b4c11595165eb5342bbbd9807479b152775a895effbdc1fa80fdc8e` |
| Brandi Bracelet | photos 4 | `/uploads/legacy-924695c87d7d8f1f7659.webp` | `/uploads/brandi-bracelet-picture-04.webp` | `47fe210dfb0479c4ce97b8d39d7bb4376e44d0d76623dd8e69bc44c5d3bc8bbc` |
| Brandi Bracelet | photos 5 | `/uploads/legacy-784b399d60ca91351dc3.webp` | `/uploads/brandi-bracelet-picture-05.webp` | `ee63ae6b4fc931ebd24e26d145f343c283d1a5c3d588d2a77982597ca1ee4ebb` |
| Brandi Bracelet | videos 1 | `/uploads/legacy-69a85e88135dadfa9c0c.webm` | `/uploads/brandi-bracelet-video-01.webm` | `374e7c17a78208ee8fa25898ae8a81e24c00dff18e97f437583e327642f1cf46` |
| Brandi Bracelet | videoPosters 1 | `/uploads/legacy-5b355d6fa4c5116c1d22.webp` | `/uploads/brandi-bracelet-video-poster-01.webp` | `70e8fec930b815e9d91c480176a0b3e64ce0302fdab504c3e524d45c42d9a3b5` |
| Adeline Bracelet | photos 1 | `/uploads/legacy-a40c10c279e0175ae4eb.webp` | `/uploads/adeline-bracelet-picture-01.webp` | `ca382d0acc084da82e75be69b657d8ffac9fb2602a1ac4ff4cb6de18a3cec525` |
| Adeline Bracelet | photos 2 | `/uploads/legacy-f2d2fdd2352b902a237d.webp` | `/uploads/adeline-bracelet-picture-02.webp` | `09b586ab297e7525658b47120c8ad60998f7fdf9cedfa18998abcf3e5d6fedae` |
| Adeline Bracelet | photos 3 | `/uploads/legacy-38cdc914906f3d10de9b.webp` | `/uploads/adeline-bracelet-picture-03.webp` | `05998efa175f662c456e9b8d3e0a926d2e635190ca83553b6a89182decf6368e` |
| Adeline Bracelet | photos 4 | `/uploads/legacy-2da1a931035693354d4e.webp` | `/uploads/adeline-bracelet-picture-04.webp` | `e409b689c6b2381b2e2d6ec86fbf95d61e866e4e3c823a29f9c478dd85ea1566` |
| Adeline Bracelet | videos 1 | `/uploads/legacy-9e3c31c6bedddaace593.webm` | `/uploads/adeline-bracelet-video-01.webm` | `63f06ae74a11b735c60dff120f381956d7accd9998c3359e4d658788b3eeecf7` |
| Adeline Bracelet | videos 2 | `/uploads/legacy-b9758f15657bf862c49a.webm` | `/uploads/adeline-bracelet-video-02.webm` | `48b69fc36cba2de7284d350929168f6dd62e1e268a3d923e1db8666f8dece6bf` |
| Adeline Bracelet | videoPosters 1 | `/uploads/legacy-d19223a0de740f73f86d.webp` | `/uploads/adeline-bracelet-video-poster-01.webp` | `cc0579792b976df97285c264eea8e6a47111d81bb73ae8d141beab558359daf4` |
| Adeline Bracelet | videoPosters 2 | `/uploads/legacy-f9af10251f7026ee4790.webp` | `/uploads/adeline-bracelet-video-poster-02.webp` | `85cb9b4ced3f3e6be6ffabb6bd4f8c39d09a53c7dcb0afd74620178dd8afa746` |
| Adirondack Chic Leather and Cowhide Overnight Duffel Bag | photos 1 | `/uploads/legacy-9b5bf6bfda789a2d28c3.webp` | `/uploads/adirondack-chic-leather-and-cowhide-overnight-duffel-bag-picture-01.webp` | `88aa803b9251dcd993dd36a5acfd4ffea567f4239dc708b2d2c8bb5a39d7a51f` |
| Adirondack Chic Leather and Cowhide Overnight Duffel Bag | photos 2 | `/uploads/legacy-c1193f5450d328450ca3.webp` | `/uploads/adirondack-chic-leather-and-cowhide-overnight-duffel-bag-picture-02.webp` | `94875b27dda820bb6028172edec8e882d3f6a76f0c7ec35331f876056f8fd8a7` |
| Adirondack Chic Leather and Cowhide Overnight Duffel Bag | photos 3 | `/uploads/legacy-097d05880561132e2ac4.webp` | `/uploads/adirondack-chic-leather-and-cowhide-overnight-duffel-bag-picture-03.webp` | `1cc52c535e7a4c7576041216c0aef5ae98f78d8870552ad676cbe1d92624ba13` |
| Adirondack Chic Leather and Cowhide Overnight Duffel Bag | photos 4 | `/uploads/legacy-146349f2fb39f070a28a.webp` | `/uploads/adirondack-chic-leather-and-cowhide-overnight-duffel-bag-picture-04.webp` | `cc8e5e14f3cc72783d446c6e27f6e8e862e8b09dcb59e5a1a2fca0dbb12e84e8` |
| Leather Fanny Pack with Fringe | photos 1 | `/uploads/legacy-6156fcca38b7d1939537.webp` | `/uploads/leather-fanny-pack-with-fringe-picture-01.webp` | `38bb8a53d5eb8e3c59be15248d86f6adafe7289d2d5fc2b56ed2158ec755e7b7` |
| Leather Fanny Pack with Fringe | photos 2 | `/uploads/legacy-71a571edf6b734fe70a8.webp` | `/uploads/leather-fanny-pack-with-fringe-picture-02.webp` | `680255aee2feef9d8b395dff330f4ac96a0dafba539d609853a342c3f418055a` |
| Leather Fanny Pack with Fringe | photos 3 | `/uploads/legacy-853a538ab7dd573b45e1.webp` | `/uploads/leather-fanny-pack-with-fringe-picture-03.webp` | `87d57142e9531932af5a1f3a0c714bdeb752e5168e1831cb8870d02c60c49a5e` |
| Cowhide Leather Checkered Wallet Wristlet | photos 1 | `/uploads/legacy-bdb2a5d200fa47a767a3.webp` | `/uploads/cowhide-leather-checkered-wallet-wristlet-picture-01.webp` | `950d5dcfe11a4554f576c05d183d48adf4c21211be33f4cbfaa28fa04d9080a7` |
| Cowhide Leather Checkered Wallet Wristlet | photos 2 | `/uploads/legacy-74dc53a4599fc61e6461.webp` | `/uploads/cowhide-leather-checkered-wallet-wristlet-picture-02.webp` | `165f854d13acbeb1dc4dc361ddb0b83c7c1b52952acb4a252902cbfee79fe60d` |
| Pink Tooled Leather Speedy Bag | photos 1 | `/uploads/legacy-c0601ad67e56ed8e6b0d.webp` | `/uploads/pink-tooled-leather-speedy-bag-picture-01.webp` | `a4502ad75b99a9de93f6f33a3ad463a52fb4f027018bb6a43e4d322e04e0ef91` |
| Pink Tooled Leather Speedy Bag | photos 2 | `/uploads/legacy-7b0fa32c7b6d8a8ec2e1.webp` | `/uploads/pink-tooled-leather-speedy-bag-picture-02.webp` | `cf69c30a5ac3ba347394c302b9739d7a971e83ad9cd708c58a7a407da353d528` |
| Upcycled LOGO Barrette | photos 1 | `/uploads/legacy-93c6a8011c29b2f5e479.webp` | `/uploads/upcycled-logo-barrette-picture-01.webp` | `b6fd61374553ed250a545bae374ea7ee661d88c2565e94ebc0e4d04b8f0367f2` |
| Upcycled LOGO Barrette | photos 2 | `/uploads/legacy-b06dbad0d23b0696b0d6.webp` | `/uploads/upcycled-logo-barrette-picture-02.webp` | `c5d149658eede711048e86db1eba35e6d8701ff8a8b07fd80b446fb5c201a948` |
| Upcycled LOGO Barrette | photos 3 | `/uploads/legacy-295645f8fda4da4ecfb3.webp` | `/uploads/upcycled-logo-barrette-picture-03.webp` | `c9535ec1ff4245ac7c903d50e3b67218901ab810f61cf5f2bcd14b39afc43649` |
| Upcycled LV Canvas Pack | photos 1 | `/uploads/legacy-32a31951c86d42518808.webp` | `/uploads/upcycled-lv-canvas-pack-picture-01.webp` | `526f9c49de82b4c5cc0de6023bc25719c0c8b398d5cbe9a4ad907c67665cd4cf` |
| Upcycled LV Canvas Pack | photos 2 | `/uploads/legacy-fae2069d3c05196e25e9.webp` | `/uploads/upcycled-lv-canvas-pack-picture-02.webp` | `53bd8a3f16c7d6441aa5b541ec85caec451346425b268d98a6302a51e5786ce2` |
| Upcycled LV Canvas Pack | photos 3 | `/uploads/legacy-98165e82f9c7f8fa3550.webp` | `/uploads/upcycled-lv-canvas-pack-picture-03.webp` | `58e6d9543906187ffd359c115e65a3aac25649b95548699c4caaffd7c1c1219b` |
| Upcycled LV Tooled Wristlet or Makeup Bag | photos 1 | `/uploads/legacy-d4aeabc6ab19a5d1c937.webp` | `/uploads/upcycled-lv-tooled-wristlet-or-makeup-bag-picture-01.webp` | `4b26a29f44e354b5ce27f95584e65f0e9c248bcdd7622d371db0d31ead0ba85d` |
| Upcycled LV Tooled Wristlet or Makeup Bag | photos 2 | `/uploads/legacy-27b4a9061a91a612a0b6.webp` | `/uploads/upcycled-lv-tooled-wristlet-or-makeup-bag-picture-02.webp` | `c0a37f2e85ff0f8f1aaa35cb11c6c290afb0ee03f98ddf96762e8da1ad8cc0dc` |
| Upcycled LV Tooled Wristlet or Makeup Bag | photos 3 | `/uploads/legacy-080f824af36efecf8508.webp` | `/uploads/upcycled-lv-tooled-wristlet-or-makeup-bag-picture-03.webp` | `5950da53db8931a112ab3e850125bed9a84126c145a135c7b05438394a48867b` |
| Upcycled LV Tooled Wristlet or Makeup Bag | photos 4 | `/uploads/legacy-c94d16dd8cc6f68e2b87.webp` | `/uploads/upcycled-lv-tooled-wristlet-or-makeup-bag-picture-04.webp` | `c8673225412e3abde1f4f74b95e8a9c6532b5a0a561525dcdc59f7b9e02fad42` |
| The LV Cowhide Leather Fringe Western (or Adirondack) Crossbody Bag | photos 1 | `/uploads/legacy-12030587057b1acc55bb.webp` | `/uploads/the-lv-cowhide-leather-fringe-western-or-adirondack-crossbody-bag-picture-01.webp` | `d42fdb87efbd0220a3ed8a33204d9f75a2ea0af44fbf43c9dc240b61326eabc6` |
| The LV Cowhide Leather Fringe Western (or Adirondack) Crossbody Bag | photos 2 | `/uploads/legacy-7d529df0455bbccb3899.webp` | `/uploads/the-lv-cowhide-leather-fringe-western-or-adirondack-crossbody-bag-picture-02.webp` | `8558b62abb5033c715ad20b7ac7410c8c9aa74df4e449950c0a1a26b471985db` |
| The LV Cowhide Leather Fringe Western (or Adirondack) Crossbody Bag | photos 3 | `/uploads/legacy-6ed7052e0b86933cbbcd.webp` | `/uploads/the-lv-cowhide-leather-fringe-western-or-adirondack-crossbody-bag-picture-03.webp` | `836dc2c60375f968a5badab91517d71d4009c74d23570fac34f66a6560693c4f` |
| Upcycled Black Suede and Brown Tooled Leather Backpack | photos 1 | `/uploads/legacy-5a30229486b846eba056.webp` | `/uploads/upcycled-black-suede-and-brown-tooled-leather-backpack-picture-01.webp` | `df8fe09081d76b54916aa62e89a1213eca43274c57f57aeada77a98267739258` |
| Upcycled Black Suede and Brown Tooled Leather Backpack | photos 2 | `/uploads/legacy-4b02e9dd6eef96f31040.webp` | `/uploads/upcycled-black-suede-and-brown-tooled-leather-backpack-picture-02.webp` | `aad16ba06aa5f94fd5bcd18ad2c12b5100ddc5cb3f9f993ad2043f0de2a82795` |
| Cowhide Lv Faux Leather Shoulder Bag | photos 1 | `/uploads/legacy-59b92bc12e3ea5ef585a.webp` | `/uploads/cowhide-lv-faux-leather-shoulder-bag-picture-01.webp` | `14555730e563e7154d9e5492ba313a4a886ea68723b9b697becf871e8cea5023` |
| Cowhide Lv Faux Leather Shoulder Bag | photos 2 | `/uploads/legacy-efa8ffc93b3b69930923.webp` | `/uploads/cowhide-lv-faux-leather-shoulder-bag-picture-02.webp` | `63a30c230d572fe6c35ca4e9dfaf099117bf4df62437bc608c7a3c321e28d7b8` |
| Cowhide Lv Faux Leather Shoulder Bag | photos 3 | `/uploads/legacy-db710eed5d88a6e30aaf.webp` | `/uploads/cowhide-lv-faux-leather-shoulder-bag-picture-03.webp` | `ad686e0540ebbfcf13f3e21a4081f38803d3eac64d11b3566b33dc1ce4443d6b` |
| Upcycled LV Logo Bag | photos 1 | `/uploads/legacy-8cc66d9ec839e618236f.webp` | `/uploads/upcycled-lv-logo-bag-picture-01.webp` | `f6b324166ee1f0a050c07306a5693b973f389743f16a006e21869acd42719b03` |
| Upcycled LV Logo Bag | photos 2 | `/uploads/legacy-a096e6158591a6784e70.webp` | `/uploads/upcycled-lv-logo-bag-picture-02.webp` | `3e5e1daa0919854f4f8bc70fdabc62dfd24470e84e78e5dd6eec300742c972e5` |
| Upcycled LV Logo Bag | photos 3 | `/uploads/legacy-5855a238b24b9b484640.webp` | `/uploads/upcycled-lv-logo-bag-picture-03.webp` | `59262cd85c4c449ed070324aff19aee1fc48e700b23e7fc59aa69fa03eb1a02d` |
| The Weekender Tote Bag | photos 1 | `/uploads/legacy-9f3e206d9a1274b23e71.webp` | `/uploads/the-weekender-tote-bag-picture-01.webp` | `1fd438337ff6dc9acdcbaf6d7f307660022b8181bb42315dbb04af08a67f04b1` |
| The Weekender Tote Bag | photos 2 | `/uploads/legacy-92a55d146134d72cf05b.webp` | `/uploads/the-weekender-tote-bag-picture-02.webp` | `cea514accac380bb28fd06a4035fb80b4c5b691cda073cee2ef4b035d7bbaaf0` |
| The Weekender Tote Bag | photos 3 | `/uploads/legacy-74f6887618ac1d24e158.webp` | `/uploads/the-weekender-tote-bag-picture-03.webp` | `130997c741035445286ed1b34ce8f991415674870a06ed3e86be296cd3fa7519` |
| LV Upcycled Cowhide Leather Bag | photos 1 | `/uploads/legacy-40d3aea797871e905856.webp` | `/uploads/lv-upcycled-cowhide-leather-bag-picture-01.webp` | `97e236e09ae2941a6e15c51ae4126325e74c9a285868510f66a5f01ae3db35ea` |
| Upcycled LV Cowhide Leather Fringe Crossbody Bag | photos 1 | `/uploads/legacy-19d5e1e68a718f318a10.webp` | `/uploads/upcycled-lv-cowhide-leather-fringe-crossbody-bag-picture-01.webp` | `aea5935478cbf027c11c8a359f651e4e2f35c1e4643ec49322c3cb119382b2a1` |
| Upcycled LV Cowhide Leather Fringe Crossbody Bag | photos 2 | `/uploads/legacy-f34dc7f50d10e38d65ce.webp` | `/uploads/upcycled-lv-cowhide-leather-fringe-crossbody-bag-picture-02.webp` | `8b6176864e222bbb3465543364dff836d34f26f9f9d419596bfe1abfdf99e51c` |
| Cowhide Leather Wristlet | photos 1 | `/uploads/legacy-d93164b844fdd52200a4.webp` | `/uploads/cowhide-leather-wristlet-picture-01.webp` | `769d7fdd5ec516ad78f03bc5207865a19951b2e369fc2a45ff93888e55907d94` |
| Cowhide Leather Wristlet | photos 2 | `/uploads/legacy-7647fb0eedb30de29e66.webp` | `/uploads/cowhide-leather-wristlet-picture-02.webp` | `801aceec33a54e95793af8879d6cfe6d21b7c8c7b91ed36b01f6af65f26dd017` |
| Cowhide Leather Wristlet | photos 3 | `/uploads/legacy-2dd0c999a323c665a889.webp` | `/uploads/cowhide-leather-wristlet-picture-03.webp` | `bb127d335637468e8f8fd52a11f7b4d7aff8c049e6ac356fbfec300c624a0665` |
| Upcycled LV Mini Flask Bag Charm | photos 1 | `/uploads/legacy-d5619f89fb9338abc295.webp` | `/uploads/upcycled-lv-mini-flask-bag-charm-picture-01.webp` | `034245eb98a6da6bf6d431f988b94070ac552b03dd7063f0b654c86280cfcd48` |
| Upcycled LV Mini Flask Bag Charm | photos 2 | `/uploads/legacy-bc5c8be7ef3bc8e574e5.webp` | `/uploads/upcycled-lv-mini-flask-bag-charm-picture-02.webp` | `07b59dfbcb95cb3a83d132d4e7f76661e736ddeab889762fb3d1d122e0eefa03` |
| Upcycled LV Mini Flask Bag Charm | photos 3 | `/uploads/legacy-55f0ced22b7745b682b3.webp` | `/uploads/upcycled-lv-mini-flask-bag-charm-picture-03.webp` | `5066d9e23cc23b72546db117968b1cae0879350d9fffdc6ba734cdd5a616c183` |
| Upcycled LV Mini Flask Bag Charm | photos 4 | `/uploads/legacy-94de2eaca29e29277c8f.webp` | `/uploads/upcycled-lv-mini-flask-bag-charm-picture-04.webp` | `25451a4b209e44063887bc293a3611cfd0d78584342f80d9799c4f4ba85b6937` |
| Miss Cheetah | photos 1 | `/uploads/1783672358990-600883762.jpeg` | `/uploads/miss-cheetah-picture-01.jpeg` | `4a6aaa274bba46b1815520a22e85e409e485b56b1ee6d69abecbb049676f7933` |
| Miss Cheetah | videos 1 | `/uploads/1788368382629-301758658.webm` | `/uploads/miss-cheetah-video-01.webm` | `eb5ef9211fcd1d152eb96d7ff384b67421f3a6ca998c176653e8f72b5988adcb` |
| Boo-Jee Boa | photos 1 | `/uploads/1783690731684-51129312.webp` | `/uploads/boo-jee-boa-picture-01.webp` | `f80bb582de5fbfa7a69a5bb82d0eb05f8a725f23256240264206239d715cd320` |
| Cheetah Boa | photos 1 | `/uploads/1783691108529-577199489.webp` | `/uploads/cheetah-boa-picture-01.webp` | `fe3fc00047ea76dd29254fb8ad01cf81c299c27b629927b7ac1a84bb05007728` |
| Smart Ass and Pretty Donkey Blinged Out | photos 1 | `/uploads/1786143404284-489770260.webp` | `/uploads/smart-ass-and-pretty-donkey-blinged-out-picture-01.webp` | `1974b380b3ce3c857170ac187a3b87cda2cac138056868db3e1593151ab399d3` |
| Smart Ass and Pretty Donkey Blinged Out | photos 2 | `/uploads/1786143404300-318314249.webp` | `/uploads/smart-ass-and-pretty-donkey-blinged-out-picture-02.webp` | `2554ed74d1c9336414e381b955bf85053135987f272e2d8066f6ee662e443e88` |
| Smart Ass and Pretty Donkey Blinged Out | photos 3 | `/uploads/1786143404303-792340982.webp` | `/uploads/smart-ass-and-pretty-donkey-blinged-out-picture-03.webp` | `1c8b26cd103d18dcd743041a0069b1866c1478777aeed026940febe22b8b9f42` |
| Smart Ass and Pretty Donkey Blinged Out | photos 4 | `/uploads/1786143404304-862559829.webp` | `/uploads/smart-ass-and-pretty-donkey-blinged-out-picture-04.webp` | `54815b5807d7f78f473792c4b63cf8cf574ddc0fc84a20c4664a18389e9541e7` |
| Feral Raccoon | photos 1 | `/uploads/1783691640941-818083453.webp` | `/uploads/feral-raccoon-picture-01.webp` | `66fd2b1dbb428d2b58e2a6c1683d702ca7d29fcba9d2abd55d54f3c67633f2bd` |
| Feral Raccoon | videos 1 | `/uploads/1788366958742-388818864.webm` | `/uploads/feral-raccoon-video-01.webm` | `1dcfe8301014a6b591afd0a1bc5055ca84d5cf576b1a5598ec5b449f30a29cac` |
| Masie Mallard Wildly Chic | photos 1 | `/uploads/1789949606594-515446718.webp` | `/uploads/masie-mallard-wildly-chic-picture-01.webp` | `6ac8d4aab889ba30000559c8f01478d3b2395b36fe35a394fc47b3472f8eadec` |
| Blue Isle Cross Body Bag Small | photos 1 | `/uploads/1783991943053-319234647.webp` | `/uploads/blue-isle-cross-body-bag-small-picture-01.webp` | `f60e1fd0bf4cb46773e4fb40875752ecc2c51db6689204335bb04229f449a5c1` |
| Blue Isle Cross Body Bag Small | photos 2 | `/uploads/1783998578622-36361855.webp` | `/uploads/blue-isle-cross-body-bag-small-picture-02.webp` | `47f3aca2961aa6b28f796be19e4bcc31500dbec1d1b6454e34244886e1f69263` |
| Blue Isle Cross Body Bag Small | photos 3 | `/uploads/1784045789562-226366899.webp` | `/uploads/blue-isle-cross-body-bag-small-picture-03.webp` | `95d84ef2ba813e5d50e4b14c37884aa9877175df8a5507c654b2cd6593a19ecb` |
| Blue Isle Cross Body Bag Small | photos 4 | `/uploads/1784045789568-341514717.webp` | `/uploads/blue-isle-cross-body-bag-small-picture-04.webp` | `f30ded6a46f2887fe88a2d51973f01f4f0afb289dd458659ca014c0635a3c762` |
| Juniper Hairon Canvas Weekender Bag | photos 1 | `/uploads/1784063952592-719836236.webp` | `/uploads/juniper-hairon-canvas-weekender-bag-picture-01.webp` | `1e76754a1dfaa8b7cf3c36721f9ad828df9dae170850df088bac65a28d134bc4` |
| Juniper Hairon Canvas Weekender Bag | photos 2 | `/uploads/1784063952593-266536681.webp` | `/uploads/juniper-hairon-canvas-weekender-bag-picture-02.webp` | `c44b7a1af9017f8b3b1b9e56b2d69e3160953a641d0888e20771a3225178a8ec` |
| Juniper Hairon Canvas Weekender Bag | photos 3 | `/uploads/1784065340652-707136497.webp` | `/uploads/juniper-hairon-canvas-weekender-bag-picture-03.webp` | `3443853d103f796211a264478ba3d21e95a174d834a4883d74e44981c7bd65f5` |
| Juniper Hairon Canvas Weekender Bag | photos 4 | `/uploads/1784137587664-829198967.webp` | `/uploads/juniper-hairon-canvas-weekender-bag-picture-04.webp` | `31e9364f66059b9a357e52430c519d87a6cebbe657672b12bc0de2bc3dcfe299` |
| Peridot Hairon and Canvas Bag | photos 1 | `/uploads/1784069113156-160039583.webp` | `/uploads/peridot-hairon-and-canvas-bag-picture-01.webp` | `fc95632ea9a01f8a9431f232e86ebbaa8e35e2a4a50a850c779361c8e4b3ff31` |
| Peridot Hairon and Canvas Bag | photos 2 | `/uploads/1784069818266-625432947.webp` | `/uploads/peridot-hairon-and-canvas-bag-picture-02.webp` | `44c294c64e833ab455a643fed5a3caa588aabdca5790c54046ce00180f145f01` |
| Peridot Hairon and Canvas Bag | photos 3 | `/uploads/1784137385703-310900338.webp` | `/uploads/peridot-hairon-and-canvas-bag-picture-03.webp` | `45b4832e30daaf719e6d122158b60c2d2fda687e589cab7a5442ffa4ce85538b` |
| Peridot Hairon and Canvas Bag | photos 4 | `/uploads/1784137385805-32981382.webp` | `/uploads/peridot-hairon-and-canvas-bag-picture-04.webp` | `d0a0b4bbac244e84e945fb27b8dc2311ea0ab4696e889c5f250f5a3b8af4860f` |
| Peridot Hairon and Canvas Bag | photos 5 | `/uploads/1784137385807-342546709.webp` | `/uploads/peridot-hairon-and-canvas-bag-picture-05.webp` | `53c3e401ee8a9388473702ebfd5c3aea45eade92b24281814c6dd57955634085` |
| Delphine Canvas & Hairon Bag | photos 1 | `/uploads/1784139274731-996967941.webp` | `/uploads/delphine-canvas-hairon-bag-picture-01.webp` | `1f9b07c15888bbab6c3ffea53e5bb9c7d1de1ab695d14128fac54c146bfbf9ce` |
| Delphine Canvas & Hairon Bag | photos 2 | `/uploads/1784139274735-513118032.webp` | `/uploads/delphine-canvas-hairon-bag-picture-02.webp` | `b20866a7617ef2514332a4b4432836b6ae4a8f2e2cc3d0799a457cdf080a13c3` |
| Delphine Canvas & Hairon Bag | photos 3 | `/uploads/1784139274736-23585267.webp` | `/uploads/delphine-canvas-hairon-bag-picture-03.webp` | `cf920fea6729bf6098d70a31e155190c53d171af104c1cc30b3089894fc3670b` |
| Delphine Canvas & Hairon Bag | photos 4 | `/uploads/1784139274740-487683339.webp` | `/uploads/delphine-canvas-hairon-bag-picture-04.webp` | `405e300312ab957b16591aa45073a902f181b885c07f131ccbf1908c74e040db` |
| Delphine Canvas & Hairon Bag | photos 5 | `/uploads/1784139274745-179245036.webp` | `/uploads/delphine-canvas-hairon-bag-picture-05.webp` | `570cf5566e85778eb1ec155624953caaa9d24bf88e73b4b182e1e1808e1dc8c2` |
| Delphine Canvas & Hairon Bag | photos 6 | `/uploads/1784224391324-892861758.webp` | `/uploads/delphine-canvas-hairon-bag-picture-06.webp` | `3372e5bc2a60bc6127a00f5384757dec9c17b3d17aa7136d657d427f625bca08` |
| Lanthe Hairon and Canvas Bag | photos 1 | `/uploads/1784140108446-170016502.webp` | `/uploads/lanthe-hairon-and-canvas-bag-picture-01.webp` | `03c24958bb1b60b47d29dfc5b57df9567d1340738634fc07b916571d660e043a` |
| Lanthe Hairon and Canvas Bag | photos 2 | `/uploads/1784140108447-705424667.webp` | `/uploads/lanthe-hairon-and-canvas-bag-picture-02.webp` | `0a3a1bdd769fc6859ddc3eed860a8d51a435ed480b3a02c6572d97c746b8e400` |
| Lanthe Hairon and Canvas Bag | photos 3 | `/uploads/1784140108453-71159071.webp` | `/uploads/lanthe-hairon-and-canvas-bag-picture-03.webp` | `5b0d5274efac27442486c1ab89b658f3b5a9a3cf9f7dfc198c840b8ac5a67ee9` |
| Lanthe Hairon and Canvas Bag | photos 4 | `/uploads/1784140108458-32206855.webp` | `/uploads/lanthe-hairon-and-canvas-bag-picture-04.webp` | `173dec0de1cd8d832feb9eb2f10b1e572287d3b162bbf28d7d1ed436c407f724` |
| Lanthe Hairon and Canvas Bag | photos 5 | `/uploads/1784224564731-274139057.webp` | `/uploads/lanthe-hairon-and-canvas-bag-picture-05.webp` | `f600c15a9b19c117bfdd2ed6725e413faa13e3ab7df218b28039217d0951321a` |
| Maia Concealed Bag | photos 1 | `/uploads/1784141062386-13376486.webp` | `/uploads/maia-concealed-bag-picture-01.webp` | `ee9dbfe870bc2acb73d95888b3168dbc9b2c7f1037864370df6f2a06e548147c` |
| Maia Concealed Bag | photos 2 | `/uploads/1784141062387-905025949.webp` | `/uploads/maia-concealed-bag-picture-02.webp` | `0df77ac278154de77f29754e1b0a828b207ce13256b0600f141b808909c7f73c` |
| Maia Concealed Bag | photos 3 | `/uploads/1784141062389-715251127.webp` | `/uploads/maia-concealed-bag-picture-03.webp` | `2d0498db0fbf8de815c6a2016d9059643cfc01d7db9a0f56c4c3b2f1474d18b6` |
| Maia Concealed Bag | photos 4 | `/uploads/1784141062390-880746567.webp` | `/uploads/maia-concealed-bag-picture-04.webp` | `92552be0565bfb8bacc024cdb8ab8ce1f78ae67a2234f77af8f21fb383dbf875` |
| Amethyst Hairon & Canvas Bag | photos 1 | `/uploads/1784141799612-261580366.webp` | `/uploads/amethyst-hairon-canvas-bag-picture-01.webp` | `f3eadd61509ba3f2fb493ddd50f919e9638509d9c77bbaa5b46d7bbdb15808bf` |
| Amethyst Hairon & Canvas Bag | photos 2 | `/uploads/1784141799614-945457380.webp` | `/uploads/amethyst-hairon-canvas-bag-picture-02.webp` | `bd40d685474217383f50439724ec4169f39752741b52758d1058bf7b04c6a336` |
| Amethyst Hairon & Canvas Bag | photos 3 | `/uploads/1784141799616-55630534.webp` | `/uploads/amethyst-hairon-canvas-bag-picture-03.webp` | `02c7a997bdbf5bb164e31022ddb52554e1b6415075d0cf07a7c836260ab128e6` |
| Amethyst Hairon & Canvas Bag | photos 4 | `/uploads/1784141799616-97553241.webp` | `/uploads/amethyst-hairon-canvas-bag-picture-04.webp` | `60dd3e8417d50309d29da785fb176fccf83579844e38da95e6ebf91ec0aab975` |
| Amethyst Hairon & Canvas Bag | photos 5 | `/uploads/1784141799618-901243083.webp` | `/uploads/amethyst-hairon-canvas-bag-picture-05.webp` | `fb8a604f6f973d55ce7218a58bd3f9bab998631b1b2c84f906112c74ada34091` |
| In a While Crocodile | photos 1 | `/uploads/1784473998935-499706426.webp` | `/uploads/in-a-while-crocodile-picture-01.webp` | `bdf23223aabfae8f59cd326a83c17a6fe283ad4da73a5f2c1bf7cbe23df39e6b` |
| In a While Crocodile | videos 1 | `/uploads/1788367213556-151018210.webm` | `/uploads/in-a-while-crocodile-video-01.webm` | `17d0672ab46bc3b035013a1574102a894d1607073ee8ec3e037277a0beabde7e` |
| Myra Mojave Leather Bag in Old Rose | photos 1 | `/uploads/1785875956329-798591988.webp` | `/uploads/myra-mojave-leather-bag-in-old-rose-picture-01.webp` | `9b18fbc64d478cf8e9e4064ada981810184e9934269a571e69098d3bdd038b77` |
| Myra Mojave Leather Bag in Old Rose | photos 2 | `/uploads/1785875956390-754376166.webp` | `/uploads/myra-mojave-leather-bag-in-old-rose-picture-02.webp` | `71731ef9e3de843e0c2788fb331242af6701273a70d2fbb97e428c11020a0f96` |
| Myra Mojave Leather Bag in Old Rose | photos 3 | `/uploads/1785875956390-757348513.webp` | `/uploads/myra-mojave-leather-bag-in-old-rose-picture-03.webp` | `4383079442fbc728c2ed903bca64b2ceb32db5e0fb72774080610dad8b8fd38d` |
| Myra Mojave Leather Bag in Old Rose | photos 4 | `/uploads/1785875956395-433422140.webp` | `/uploads/myra-mojave-leather-bag-in-old-rose-picture-04.webp` | `c82f77eeb8868b44a93966826c477e309e86b3cb1f5a3d963ee8e187a1843129` |
| Myra Mojave Leather Bag in Old Rose | photos 5 | `/uploads/1785875956396-400668000.webp` | `/uploads/myra-mojave-leather-bag-in-old-rose-picture-05.webp` | `edf7bc2e0da3b24da6108629bb64c0509fab183ad5164afc58fe0a42f5fbce50` |
| Country GaGa | photos 1 | `/uploads/1785970237867-200640105.webp` | `/uploads/country-gaga-picture-01.webp` | `25dcb5213c2031f8ea9e236de83b6110090fbe61c4dbb21e4061d67a30fa1f53` |
| Country GaGa | photos 2 | `/uploads/1785970238841-929814564.webp` | `/uploads/country-gaga-picture-02.webp` | `09d7266b249b746f71360f06a2b0d82f2c90be6fe00be5ec4463175b4a8ba50b` |
| Country GaGa | photos 3 | `/uploads/1785970239931-614621459.webp` | `/uploads/country-gaga-picture-03.webp` | `237acfc421d0b52ec3f14a331e2b59e393573449a5b33d311aa29383697981c9` |
| Autumn Cowgirl | photos 1 | `/uploads/1787763423018-785382150.webp` | `/uploads/autumn-cowgirl-picture-01.webp` | `4402e0eb704e0efbf7c57bf092514cb07a22908397152eea2a6e82e05edf8097` |
| Autumn Cowgirl | videos 1 | `/uploads/autumn-cowgirl-customer-a5e7309365.webm` | `/uploads/autumn-cowgirl-video-01.webm` | `f1e0679da27198f1985c9c5324b806c18765f8fb05d49107e886e82f0126f080` |
| Bridal Lace Ribbon Snippet Roll: Navy & Ivory, Hand Stamped Tag | photos 1 | `/uploads/etsy-bridal-lace-ribbon-snippet-roll-navy-ivory-hand-stamped-tag-a40bb2-photo-01.webp` | `/uploads/bridal-lace-ribbon-snippet-roll-navy-ivory-hand-stamped-tag-picture-01.webp` | `c345ab62feef3c8dbb4d99110fa856d5b25109fd961f7a32d8bda07b63277c74` |
| Bridal Lace Ribbon Snippet Roll: Navy & Ivory, Hand Stamped Tag | photos 2 | `/uploads/etsy-bridal-lace-ribbon-snippet-roll-navy-ivory-hand-stamped-tag-a40bb2-photo-02.webp` | `/uploads/bridal-lace-ribbon-snippet-roll-navy-ivory-hand-stamped-tag-picture-02.webp` | `f85884a2c11a6848ff10cbaf32b6cd258cb0bb42d06924b96b9bd2bdc47d49bf` |
| Bridal Lace Ribbon Snippet Roll: Navy & Ivory, Hand Stamped Tag | photos 3 | `/uploads/etsy-bridal-lace-ribbon-snippet-roll-navy-ivory-hand-stamped-tag-a40bb2-photo-03.webp` | `/uploads/bridal-lace-ribbon-snippet-roll-navy-ivory-hand-stamped-tag-picture-03.webp` | `1dcce5c3c38ccd6f7d038ddd0d98b17718f49e825338440e4d9cbaff5ea581dc` |
| Bridal Lace Ribbon Snippet Roll: Navy & Ivory, Hand Stamped Tag | photos 4 | `/uploads/etsy-bridal-lace-ribbon-snippet-roll-navy-ivory-hand-stamped-tag-a40bb2-photo-04.webp` | `/uploads/bridal-lace-ribbon-snippet-roll-navy-ivory-hand-stamped-tag-picture-04.webp` | `1e177407b2d98214d3cd803d817571e0d299e4829832ef580697d65957a0ff63` |
| Bridal Lace Ribbon Snippet Roll: Navy & Ivory, Hand Stamped Tag | photos 5 | `/uploads/etsy-bridal-lace-ribbon-snippet-roll-navy-ivory-hand-stamped-tag-a40bb2-photo-05.webp` | `/uploads/bridal-lace-ribbon-snippet-roll-navy-ivory-hand-stamped-tag-picture-05.webp` | `33b09cabf80527b601cd12b4dc0d579c4cef92d0f28e10e86943cae15c33ec06` |
| Bougie Lips T-Shirt | photos 1 | `/uploads/etsy-bougie-lips-t-shirt-d8e9ee-photo-01.webp` | `/uploads/bougie-lips-t-shirt-picture-01.webp` | `d61206b2ab7393f95a9e290453f6352e4ce6083793d0c6e5473dc771881c1b06` |
| Bougie Lips T-Shirt | videos 1 | `/uploads/etsy-bougie-lips-t-shirt-d8e9ee-video-01.webm` | `/uploads/bougie-lips-t-shirt-video-01.webm` | `3ab3efebd127d3f702769ab8bc726235178a4e394ded5404107663a098abe7e7` |
| Highland Cow in Her Crown. Rhinestone Shirt | photos 1 | `/uploads/etsy-highland-cow-in-her-crown-rhinestone-shirt-dc0ddf-photo-01.webp` | `/uploads/highland-cow-in-her-crown-rhinestone-shirt-picture-01.webp` | `017d30594a503c5afe07eb92eeb3596048e4a5966c75ca3f907544e858e2cbc1` |
| Highland Cow in Her Crown. Rhinestone Shirt | photos 2 | `/uploads/etsy-highland-cow-in-her-crown-rhinestone-shirt-dc0ddf-photo-02.webp` | `/uploads/highland-cow-in-her-crown-rhinestone-shirt-picture-02.webp` | `c2c2832d3fbabe677421afcdf331ea5b132785898e3782b4dff68fbcaef4c535` |
| Highland Cow in Her Crown. Rhinestone Shirt | videos 1 | `/uploads/etsy-highland-cow-in-her-crown-rhinestone-shirt-dc0ddf-video-01.webm` | `/uploads/highland-cow-in-her-crown-rhinestone-shirt-video-01.webm` | `7d34dce14ca04c9dbf2ff745e0b8b5ef9b0fbca0a1eed1a30ca0b483a9369fdc` |
| Don’t Burst My Bubble! Sweatshirt | photos 1 | `/uploads/etsy-don-t-burst-my-bubble-sweatshirt-f958d7-photo-01.webp` | `/uploads/dont-burst-my-bubble-sweatshirt-picture-01.webp` | `5efca3f551f5b8023a93932b1e51f491f21afdb7b4f5f7b1aaf6c415d4341b7b` |
| Don’t Burst My Bubble! Sweatshirt | photos 2 | `/uploads/etsy-don-t-burst-my-bubble-sweatshirt-f958d7-photo-02.webp` | `/uploads/dont-burst-my-bubble-sweatshirt-picture-02.webp` | `5efca3f551f5b8023a93932b1e51f491f21afdb7b4f5f7b1aaf6c415d4341b7b` |
| Turquoise Girl Blinged Out Sweatshirt | photos 1 | `/uploads/etsy-turquoise-girl-blinged-out-sweatshirt-541d9d-photo-01.webp` | `/uploads/turquoise-girl-blinged-out-sweatshirt-picture-01.webp` | `10c0ed78b7eb53544c39946c7417222304c6cfa5b4bb6218fd7d20e2ced59a76` |
| Turquoise Girl Blinged Out Sweatshirt | videos 1 | `/uploads/etsy-turquoise-girl-blinged-out-sweatshirt-541d9d-video-01.webm` | `/uploads/turquoise-girl-blinged-out-sweatshirt-video-01.webm` | `24f0800ce6d37b7befe5a20309246a07fa8c276d7285c1c63a4626b1233e5f1f` |
| I May Look Calm Chicken T-Shirt | photos 1 | `/uploads/etsy-i-may-look-calm-chicken-t-shirt-54583c-photo-01.webp` | `/uploads/i-may-look-calm-chicken-t-shirt-picture-01.webp` | `ce2bd4d1bbf76dfb15b3b25dfaaa9bdc36662fb189a5a3fcb85562494b237365` |
| I May Look Calm Chicken T-Shirt | photos 2 | `/uploads/etsy-i-may-look-calm-chicken-t-shirt-54583c-photo-02.webp` | `/uploads/i-may-look-calm-chicken-t-shirt-picture-02.webp` | `c0f5888a49248c18143d7dc2707ed585c1bb83f691df2e3222ff7767a1d27bce` |
| I May Look Calm Chicken T-Shirt | photos 3 | `/uploads/etsy-i-may-look-calm-chicken-t-shirt-54583c-photo-03.webp` | `/uploads/i-may-look-calm-chicken-t-shirt-picture-03.webp` | `f31a056c960090f6f1bc6941066b051cd03a2d59c82f3e913867bd7bf9b834ea` |
| I Woke Up Like This T-shirt Blinged Out | photos 1 | `/uploads/etsy-i-woke-up-like-this-t-shirt-blinged-out-fa0ca1-photo-01.webp` | `/uploads/i-woke-up-like-this-t-shirt-blinged-out-picture-01.webp` | `180d24e31c146eeb14e7e5d32e31d632250038a700c2b0a2f26337f9e33c1eb8` |
| I Woke Up Like This T-shirt Blinged Out | photos 2 | `/uploads/etsy-i-woke-up-like-this-t-shirt-blinged-out-fa0ca1-photo-02.webp` | `/uploads/i-woke-up-like-this-t-shirt-blinged-out-picture-02.webp` | `c68dd222e13159425f4f8bb65d3460c8b113e034334dda4ead0c4dcc470a5cb6` |
| I Woke Up Like This T-shirt Blinged Out | photos 3 | `/uploads/etsy-i-woke-up-like-this-t-shirt-blinged-out-fa0ca1-photo-03.webp` | `/uploads/i-woke-up-like-this-t-shirt-blinged-out-picture-03.webp` | `81fe07ceed8c0f6039d7c1ed9c4ef0d6dbb0e6b72a59bf6e75eb28a3b3a79f09` |
| I Woke Up Like This T-shirt Blinged Out | videos 1 | `/uploads/etsy-i-woke-up-like-this-t-shirt-blinged-out-fa0ca1-video-01.webm` | `/uploads/i-woke-up-like-this-t-shirt-blinged-out-video-01.webm` | `0c8a806c311d713e5d307c265acb91276117095251203ccdd0743af22c1ba825` |
| Turquoise Junky Blinged out T-Shirt | photos 1 | `/uploads/etsy-turquoise-junky-blinged-out-t-shirt-86e114-photo-01.webp` | `/uploads/turquoise-junky-blinged-out-t-shirt-picture-01.webp` | `3403e38ac00f13c62a2e490ab86f0456b693f02caa265dfb34bd98d5d58bad0d` |
| Mischief Witch and Her Cat- Blinged Out | photos 1 | `/uploads/etsy-mischief-witch-and-her-cat-blinged-out-b73246-photo-01.webp` | `/uploads/mischief-witch-and-her-cat-blinged-out-picture-01.webp` | `ea031265cbfcc0bc02e1782c0f65f58b1498e28e922709444de238a0d964f37b` |
| FRANKLY my DEAR, I don’t give a damn either! With BLING | photos 1 | `/uploads/etsy-frankly-my-dear-i-don-t-give-a-damn-either-with-bling-7c35b9-photo-01.webp` | `/uploads/frankly-my-dear-i-dont-give-a-damn-either-with-bling-picture-01.webp` | `59c90bbca11e5a948d139a30a28251966c26230d3a297d0d9e595d0754ef3f7b` |
| FRANKLY my DEAR, I don’t give a damn either! With BLING | videos 1 | `/uploads/etsy-frankly-my-dear-i-don-t-give-a-damn-either-with-bling-7c35b9-video-01.webm` | `/uploads/frankly-my-dear-i-dont-give-a-damn-either-with-bling-video-01.webm` | `30996f691cebf28d314274efbb709eda12f7542592060a0d92361a9c07d09eae` |
| Adirondack Bridal Collection | cardImage | `/uploads/legacy-4aea2d7d6b86a527a564.webp` | `/uploads/adirondack-bridal-collection-collection-cover.webp` | `b9cbcbce989aa193bb4153a2e73852ffcdc19d708ff46c86dc511c7924bb62b1` |
| Adirondack Chic | cardImage | `/uploads/legacy-344acea72c677055a5ec.webp` | `/uploads/adirondack-chic-collection-cover.webp` | `74c9cabb17495f172b1ddae50e5395db27e72449545ba17d08c19798f4ca2924` |
| Boot Bands | cardImage | `/uploads/legacy-952d4cc1ef5bdb0fd41a.webp` | `/uploads/boot-bands-collection-cover.webp` | `f5385c448f17362014dc351464eb35c70169e97db9a4e4930bd815648a5f0a58` |
| Bracelets | cardImage | `/uploads/legacy-2e6420b592085f3b9beb.webp` | `/uploads/bracelets-collection-cover.webp` | `e152cdfd09bab1ecfaf8382e954b93eea356ac98669b44d13b6c9d93e00ff724` |
| Chic Jewelry | cardImage | `/uploads/legacy-c5a084596decb749188d.webp` | `/uploads/chic-jewelry-collection-cover.webp` | `c1600122da4e190f1f0484a1589958539d0335eee6555d4a8b9223129ad0e617` |
| Cuffs | cardImage | `/uploads/legacy-6b1b766b7a3228c9a9a2.webp` | `/uploads/cuffs-collection-cover.webp` | `f7d0cfd28bcb4e2ff9b89548971c7aaf8e11f91d1cfe1591ded48d2c46f5598b` |
| Earrings | cardImage | `/uploads/legacy-29cb5c7fa72eb213eaf5.webp` | `/uploads/earrings-collection-cover.webp` | `9d4314bf74dbe91a29d8476f07f73ab9ba1cd200592faacddc0234c985f0a914` |
| Hat Bands | cardImage | `/uploads/legacy-be8e3e4f013a0d825994.webp` | `/uploads/hat-bands-collection-cover.webp` | `a6b3faa89302a8958fd15759720e8fe0b35778dede8c7b87218b6adb382af43b` |
| Jackets | cardImage | `/uploads/legacy-e272b3723243ddaabc41.webp` | `/uploads/jackets-collection-cover.webp` | `d9681240fad40b6cff44c750ea21896e6a54f3606731695517459af510224b9d` |
| Jeans | cardImage | `/uploads/legacy-17d8006aa03800ebbf8a.webp` | `/uploads/jeans-collection-cover.webp` | `7a035142b3ece177e820cc5b52f8b783a2c36f5a947e78f9de44cbd2b04b9ff0` |
| Necklaces | cardImage | `/uploads/legacy-55031764f4e61678f2cb.webp` | `/uploads/necklaces-collection-cover.webp` | `5272f4b0265ccfa7719390dadd69d76596609446bef377d57fdbc14b1299151c` |
| The Pooch Smooches Collection | cardImage | `/uploads/legacy-b96027fac21b3c9af80c.webp` | `/uploads/the-pooch-smooches-collection-collection-cover.webp` | `20a6ee88a1728f792cdadff7546811494744e9df2377b38f224bb442009cd641` |
| Purses | cardImage | `/uploads/legacy-6ba797ef2746762fe2cc.webp` | `/uploads/purses-collection-cover.webp` | `7592f6af540ba7c3ad6ba53f6ede37c8bd48473426770930abc26ff96cb9bc81` |
| Shoes | cardImage | `/uploads/legacy-396c64640278750b0871.webp` | `/uploads/shoes-collection-cover.webp` | `9980dd17e29f564e73d76fb431186884d1d363e21c32c6c87c8502e0d7bf6aba` |
| Shorts | cardImage | `/uploads/legacy-af03703a71f2696a85a1.webp` | `/uploads/shorts-collection-cover.webp` | `2796a9aef7e1d840eca90df5d459ba3237dad8b8036caeb4be23015cc2323d76` |
| Denim & Lace | cardImage | `/uploads/legacy-989ee94218ac7c0edc29.webp` | `/uploads/denim-lace-collection-cover.webp` | `7a73f6c36340e2563aff836e3084ed5cf7c4094e66e4a5fe0366a3281467acf2` |
| Upcycled Collaboration | cardImage | `/uploads/legacy-9b5bf6bfda789a2d28c3.webp` | `/uploads/upcycled-collaboration-collection-cover.webp` | `88aa803b9251dcd993dd36a5acfd4ffea567f4239dc708b2d2c8bb5a39d7a51f` |
| Upcycled Logo | cardImage | `/uploads/legacy-93c6a8011c29b2f5e479.webp` | `/uploads/upcycled-logo-collection-cover.webp` | `b6fd61374553ed250a545bae374ea7ee661d88c2565e94ebc0e4d04b8f0367f2` |
| Upcycled Denim | cardImage | `/uploads/legacy-243180abf639e16a3c07.webp` | `/uploads/upcycled-denim-collection-cover.webp` | `47e7c1e239043e86e8d8fa68531e8a20e564a0de07696581ad95814079f67d6c` |
| Vests | cardImage | `/uploads/legacy-3497a7fca9532aa09594.webp` | `/uploads/vests-collection-cover.webp` | `0ea0106c4746fdcf5a2da10c8249049c0442bca722fe7ee676a0d40bf1ceec97` |

## Owner-supplied Jennifer, Old Rose and Wild Card media — November 7, 2026

**Confirmation: Confirmed — owner-supplied camera files from Downloads.**

Restored Jennifer’s Garden with seven photos and two videos. Replaced the Myra Mojave Leather Bag in Old Rose’s five temporary manufacturer photos with six owner photos and restored its video gallery with two videos. Restored Baby I’m a Wild Card’s video. Its separately missing photo was not supplied and remains missing. Farmer Mrs. Synakowski’s media was not supplied.

All 18 Downloads originals remain unchanged. Photos were converted to WebP at quality 85, with upright orientation; full-resolution, metadata-stripped PNG source copies retain the decoded photo pixels. MOV videos were converted to VP9/Opus WebM; metadata-stripped MOV source copies retain the original video/audio streams without recompression. These uploaded sources are not byte-identical camera originals. Location metadata was removed before upload. All 36 gallery/source files are retained in GitHub.

Old Rose’s new photos use picture numbers 06–11, in that gallery order, preserving the five prior manufacturer URLs and their contents. All other product fields and all 60 other products were preserved. The upload checked current media arrays before updating records and verified all product fields afterward.

### Original-to-website mapping

| Product | Camera file | Website URL | Retained source URL |
| --- | --- | --- | --- |
| Jennifer’s Garden | `IMG_4068` | `/uploads/jennifers-garden-picture-01.webp` | `/uploads/originals/jennifers-garden/jennifers-garden-source-picture-01.png` |
| Jennifer’s Garden | `IMG_4069` | `/uploads/jennifers-garden-picture-02.webp` | `/uploads/originals/jennifers-garden/jennifers-garden-source-picture-02.png` |
| Jennifer’s Garden | `IMG_4072` | `/uploads/jennifers-garden-picture-03.webp` | `/uploads/originals/jennifers-garden/jennifers-garden-source-picture-03.png` |
| Jennifer’s Garden | `IMG_4076` | `/uploads/jennifers-garden-picture-04.webp` | `/uploads/originals/jennifers-garden/jennifers-garden-source-picture-04.png` |
| Jennifer’s Garden | `IMG_4077` | `/uploads/jennifers-garden-picture-05.webp` | `/uploads/originals/jennifers-garden/jennifers-garden-source-picture-05.png` |
| Jennifer’s Garden | `IMG_4079` | `/uploads/jennifers-garden-picture-06.webp` | `/uploads/originals/jennifers-garden/jennifers-garden-source-picture-06.png` |
| Jennifer’s Garden | `IMG_4080` | `/uploads/jennifers-garden-picture-07.webp` | `/uploads/originals/jennifers-garden/jennifers-garden-source-picture-07.png` |
| Jennifer’s Garden | `IMG_4074.mov` | `/uploads/jennifers-garden-video-01.webm` | `/uploads/originals/jennifers-garden/jennifers-garden-source-video-01.mov` |
| Jennifer’s Garden | `IMG_4075.mov` | `/uploads/jennifers-garden-video-02.webm` | `/uploads/originals/jennifers-garden/jennifers-garden-source-video-02.mov` |
| Myra Mojave Leather Bag in Old Rose | `IMG_4110` | `/uploads/myra-mojave-leather-bag-in-old-rose-picture-06.webp` | `/uploads/originals/myra-mojave-leather-bag-in-old-rose/myra-mojave-leather-bag-in-old-rose-source-picture-06.png` |
| Myra Mojave Leather Bag in Old Rose | `IMG_4112` | `/uploads/myra-mojave-leather-bag-in-old-rose-picture-07.webp` | `/uploads/originals/myra-mojave-leather-bag-in-old-rose/myra-mojave-leather-bag-in-old-rose-source-picture-07.png` |
| Myra Mojave Leather Bag in Old Rose | `IMG_4115` | `/uploads/myra-mojave-leather-bag-in-old-rose-picture-08.webp` | `/uploads/originals/myra-mojave-leather-bag-in-old-rose/myra-mojave-leather-bag-in-old-rose-source-picture-08.png` |
| Myra Mojave Leather Bag in Old Rose | `IMG_4118` | `/uploads/myra-mojave-leather-bag-in-old-rose-picture-09.webp` | `/uploads/originals/myra-mojave-leather-bag-in-old-rose/myra-mojave-leather-bag-in-old-rose-source-picture-09.png` |
| Myra Mojave Leather Bag in Old Rose | `IMG_4122` | `/uploads/myra-mojave-leather-bag-in-old-rose-picture-10.webp` | `/uploads/originals/myra-mojave-leather-bag-in-old-rose/myra-mojave-leather-bag-in-old-rose-source-picture-10.png` |
| Myra Mojave Leather Bag in Old Rose | `IMG_4123` | `/uploads/myra-mojave-leather-bag-in-old-rose-picture-11.webp` | `/uploads/originals/myra-mojave-leather-bag-in-old-rose/myra-mojave-leather-bag-in-old-rose-source-picture-11.png` |
| Myra Mojave Leather Bag in Old Rose | `IMG_4113.MOV` | `/uploads/myra-mojave-leather-bag-in-old-rose-video-01.webm` | `/uploads/originals/myra-mojave-leather-bag-in-old-rose/myra-mojave-leather-bag-in-old-rose-source-video-01.mov` |
| Myra Mojave Leather Bag in Old Rose | `IMG_4114.MOV` | `/uploads/myra-mojave-leather-bag-in-old-rose-video-02.webm` | `/uploads/originals/myra-mojave-leather-bag-in-old-rose/myra-mojave-leather-bag-in-old-rose-source-video-02.mov` |
| Baby I'm a Wild Card | `IMG_4132.MOV` | `/uploads/baby-im-a-wild-card-video-01.webm` | `/uploads/originals/baby-im-a-wild-card/baby-im-a-wild-card-source-video-01.mov` |

The [recovery manifest](owner-supplied/2026-11-07/manifest.json) records all uploaded file sizes and SHA-256 checksums, original media arrays, and new media arrays. Source/gallery files are saved under `site/uploads/` on `main`; the post-upload catalog and cumulative organized media backup are on `daily-backups`.

### Completed verification

The [one-time recovery upload](https://github.com/chrismuha/pineneedledesigns.website/actions/runs/42380782958) verified all 36 server files and preserved all other product data. Its subsequent public URL check was blocked by Cloudflare with HTTP 403 from the GitHub runner. Independent checks from the owner’s Mac then verified all 18 public gallery URLs return HTTP 200 with matching SHA-256 hashes, and the live storefront contains the intended photo/video arrays. The temporary recovery workflow was removed after use.

The [successful post-recovery backup](https://github.com/chrismuha/pineneedledesigns.website/actions/runs/42380857408) saved the current catalog, readable per-product media copies, all 36 new gallery/source files, and retained prior media. All 36 backup file hashes and all 63 saved product records were verified. Backup totals: **462 retained files; 229 available and 10 missing active catalog references**. All 30 application tests, 12 backup tests, change-safety checks, initial Code Quality and production deployment passed. All 18 original camera files in Downloads retain their original checksums.

## Screenshot crops and separate Lipstick sweatshirt media — November 7, 2026

Reviewed all 174 available product photo entries. Six photos across five products contained phone status bars, gallery/editor controls, black padding, or thumbnail strips. Cropped each to the product photograph. Crops were encoded as lossless WebP and checked against the decoded source crop pixel-for-pixel; product artwork, wording, colors, and model details were not regenerated. Original screenshot URLs and their contents remain retained on the server and in prior backups. New URLs prevent stale cached screenshots from appearing in the current galleries.

### Cropped photo mapping

| Product | Previous URL retained | New gallery URL | Source crop (left, top, width, height) |
| --- | --- | --- | --- |
| Autumn Cowgirl | `/uploads/autumn-cowgirl-picture-01.webp` | `/uploads/autumn-cowgirl-picture-01-cropped.webp` | `0, 645, 1284, 1467` |
| Bougie Lips T-Shirt | `/uploads/bougie-lips-t-shirt-picture-01.webp` | `/uploads/bougie-lips-t-shirt-picture-01-cropped.webp` | `0, 410, 1284, 1937` |
| Highland Cow in Her Crown. Rhinestone Shirt | `/uploads/highland-cow-in-her-crown-rhinestone-shirt-picture-01.webp` | `/uploads/highland-cow-in-her-crown-rhinestone-shirt-picture-01-cropped.webp` | `0, 552, 1284, 1713` |
| Don’t Burst My Bubble! Sweatshirt | `/uploads/dont-burst-my-bubble-sweatshirt-picture-01.webp` | `/uploads/dont-burst-my-bubble-sweatshirt-picture-01-cropped.webp` | `0, 304, 1284, 1940` |
| Don’t Burst My Bubble! Sweatshirt | `/uploads/dont-burst-my-bubble-sweatshirt-picture-02.webp` | `/uploads/dont-burst-my-bubble-sweatshirt-picture-02-cropped.webp` | `0, 304, 1284, 1940` |
| Turquoise Girl Blinged Out Sweatshirt | `/uploads/turquoise-girl-blinged-out-sweatshirt-picture-01.webp` | `/uploads/turquoise-girl-blinged-out-sweatshirt-picture-01-cropped.webp` | `0, 483, 1284, 1737` |

### Lipstick sweatshirt media copies

The sweatshirt had two absent legacy `/images/` photos and an absent `/videos/` video. These are separate from the ten missing `/uploads/` references in the backup report. Per the owner’s request, copied the working T-shirt’s photo, video, and poster into three independent sweatshirt-specific files and changed only the sweatshirt’s media arrays and modification timestamp. The T-shirt’s media files and product record were preserved. Existing sweatshirt description, price ($58), colors, sweatshirt sizes, inventory, and other non-media fields were preserved. These are copies of the T-shirt’s supplied imagery, not newly photographed sweatshirt garments.

| Media | T-shirt source | Separate sweatshirt file |
| --- | --- | --- |
| photos | `/uploads/on-a-bad-day-theres-always-lipstick-blinged-out-t-shirt-picture-01.webp` | `/uploads/on-a-bad-day-theres-always-lipstick-blinged-out-sweatshirt-picture-01.webp` |
| videos | `/uploads/on-a-bad-day-theres-always-lipstick-blinged-out-t-shirt-video-01.webm` | `/uploads/on-a-bad-day-theres-always-lipstick-blinged-out-sweatshirt-video-01.webm` |
| videoPosters | `/uploads/on-a-bad-day-theres-always-lipstick-blinged-out-t-shirt-video-poster-01.webp` | `/uploads/on-a-bad-day-theres-always-lipstick-blinged-out-sweatshirt-video-poster-02.webp` |

### Completed verification

The [production media update](https://github.com/chrismuha/pineneedledesigns.website/actions/runs/42395208305) completed successfully. All nine new files match their SHA-256 checksums and return HTTP 200 both from the application and from public URLs checked on the owner’s Mac. The live storefront shows all six intended gallery changes. Sweatshirt and T-shirt photo/video/poster URLs are distinct. Only the six intended product media arrays and their modification timestamps changed; all 57 other product records were preserved. Collection records and store-setting values were preserved. Code Quality and production deployment passed. The temporary upload workflow was removed after use.

The [post-update GitHub backup](https://github.com/chrismuha/pineneedledesigns.website/actions/runs/42395292834) completed successfully. Verified all nine new files in both the server-upload mirror and organized per-product copies, including their readable filename mappings. Compared all 63 saved product records with the previous catalog. The backup retains **471 files** and reports **10 missing upload references**; active catalog totals are **231 available / 10 missing / 241 referenced paths**. The three broken legacy static-media links are no longer referenced by the sweatshirt. The ten unresolved upload references remain unchanged.

The [cleanup manifest](media-cleanup/2026-11-07/manifest.json) records source checksums, crop rectangles, destination checksums, and before/after media arrays. Current media/catalog backups are on `daily-backups`; the new files, manifest, and this recovery log are also retained on `main`.
