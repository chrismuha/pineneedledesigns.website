# Media recovery log

## November 6, 2026 — Etsy recovery

Source: [ZebraDivaDesigns on Etsy](https://www.etsy.com/shop/ZebraDivaDesigns). Counts verified against the live catalog and server uploads after restoration. These are current server counts; historical backup-status.json describes its own earlier backup.

| Status | Available files | Missing files | Total referenced files |
| --- | ---: | ---: | ---: |
| Before this recovery | 116 | 86 | 202 |
| After this recovery | 134 | 68 | 202 |

Restored 18 missing files: 14 photos and 4 videos across 9 products. The original 116 files were already available, not recovered in this operation. Existing media, database records, media links, and application code were unchanged. Files were restored to the missing paths already referenced by the catalog.

All 18 restored files passed checksum verification and the application served each with HTTP 200. Public URL checks returned HTTP 403, so public delivery could not be verified through automated requests.

### Remaining missing media

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

| Product | Restored path | Source |
| --- | --- | --- |
| Miss Cheetah | `/uploads/1783672358990-600883762.jpeg` | [Etsy media](https://i.etsystatic.com/13093702/r/il/ddbf29/8281651925/il_fullxfull.8281651925_blb7.jpg) |
| Miss Cheetah | `/uploads/1788368382629-301758658.webm` | [Etsy media](https://v.etsystatic.com/c/video/upload/ac_none,du_15,q_auto:good/znlf1c0oiziz3yz8trzj.mp4) |
| Boo-Jee Boa | `/uploads/1783690731684-51129312.webp` | [Etsy media](https://i.etsystatic.com/13093702/r/il/2f5dc5/8281692941/il_fullxfull.8281692941_jvjq.jpg) |
| Cheetah Boa | `/uploads/1783691108529-577199489.webp` | [Etsy media](https://i.etsystatic.com/13093702/r/il/65f80f/8233515976/il_fullxfull.8233515976_e87k.jpg) |
| Feral Raccoon | `/uploads/1783691640941-818083453.webp` | [Etsy media](https://i.etsystatic.com/13093702/r/il/07c772/8281364301/il_fullxfull.8281364301_qgyk.jpg) |
| Feral Raccoon | `/uploads/1788366958742-388818864.webm` | [Etsy media](https://v.etsystatic.com/c/video/upload/ac_none,du_15,q_auto:good/c0rid0qfid0ensnobcu8.mp4) |
| Masie Mallard Wildly Chic | `/uploads/1789949606594-515446718.webp` | [Etsy media](https://i.etsystatic.com/13093702/r/il/3b0bda/8244381784/il_fullxfull.8244381784_f0u0.jpg) |
| Autumn Cowgirl | `/uploads/1787763423018-785382150.webp` | [Etsy media](https://i.etsystatic.com/13093702/r/il/4260a4/8483221463/il_fullxfull.8483221463_1zcj.jpg) |
| Autumn Cowgirl | `/uploads/1787763423043-843837897.webm` | [Etsy media](https://v.etsystatic.com/c/video/upload/ac_none,du_15,q_auto:good/zmvqdm1u0q8xqsqvlmgc.mp4) |
| Smart Ass and Pretty Donkey Blinged Out | `/uploads/1786143404284-489770260.webp` | [Etsy media](https://i.etsystatic.com/13093702/r/il/03c78f/8399730373/il_fullxfull.8399730373_6tp8.jpg) |
| Smart Ass and Pretty Donkey Blinged Out | `/uploads/1786143404300-318314249.webp` | [Etsy media](https://i.etsystatic.com/13093702/r/il/c731d5/8399730399/il_fullxfull.8399730399_rwb1.jpg) |
| Smart Ass and Pretty Donkey Blinged Out | `/uploads/1786143404303-792340982.webp` | [Etsy media](https://i.etsystatic.com/13093702/r/il/cdb735/8399730457/il_fullxfull.8399730457_aqad.jpg) |
| Smart Ass and Pretty Donkey Blinged Out | `/uploads/1786143404304-862559829.webp` | [Etsy media](https://i.etsystatic.com/13093702/r/il/dc7b7a/8399730481/il_fullxfull.8399730481_olab.jpg) |
| In a While Crocodile | `/uploads/1784473998935-499706426.webp` | [Etsy media](https://i.etsystatic.com/13093702/r/il/665c74/8319100539/il_fullxfull.8319100539_245u.jpg) |
| In a While Crocodile | `/uploads/1788367213556-151018210.webm` | [Etsy media](https://v.etsystatic.com/c/video/upload/ac_none,du_15,q_auto:good/ti4pgpzkhjvndyhkuiy0.mp4) |
| Country GaGa | `/uploads/1785970237867-200640105.webp` | [Etsy media](https://i.etsystatic.com/13093702/r/il/343212/8344448704/il_fullxfull.8344448704_ks8j.jpg) |
| Country GaGa | `/uploads/1785970238841-929814564.webp` | [Etsy media](https://i.etsystatic.com/13093702/r/il/83a7a2/8392335739/il_fullxfull.8392335739_8p9b.jpg) |
| Country GaGa | `/uploads/1785970239931-614621459.webp` | [Etsy media](https://i.etsystatic.com/13093702/r/il/a8d2f7/8392335747/il_fullxfull.8392335747_1m3j.jpg) |

## November 6, 2026 — Approved manufacturer replacement photos

The owner approved using matching manufacturer photos even though they could not be confirmed as the original uploads. These are replacement photos of the same models; natural cowhide patterns may differ from the individual bags.

Uploaded 38 replacement photos across 8 previously media-free products. Existing 134 media files, all catalog records and media links, and application code were unchanged. No videos were replaced. All 38 files passed checksum verification and application HTTP 200 image checks.

Current totals: **172 available / 30 missing / 202 referenced files**. Missing: **23 photos and 7 videos**, comprising 29 product files and one collection image. This section supersedes the earlier remaining-media totals.

| Product still missing media | Missing files |
| --- | ---: |
| Baby I'm a Wild Card | 2 |
| Shirley Boho Bag | 9 |
| Jennifer’s Garden | 9 |
| Farmer Mrs. Synakowski | 8 |
| Myra Mojave Leather Bag in Old Rose | 1 |

The Mojave Old Rose bag now has photos; its original video remains missing. The collection image remains `/uploads/legacy-6a42cc687962f91d73d7.webp`.

### Replacement photo sources

| Product | Manufacturer SKU | Photos uploaded | Source |
| --- | --- | ---: | --- |
| Blue Isle Cross Body Bag Small | S-5216 | 4 | [Manufacturer gallery](https://myrabag.com/products/blue-isle-small-crossbody-bag) |
| Juniper Hairon Canvas Weekender Bag | S-5214 | 4 | [Manufacturer gallery](https://myrabag.com/products/juniper-canvas-and-hairon-bag) |
| Peridot Hairon and Canvas Bag | S-5219 | 5 | [Manufacturer gallery](https://myrabag.com/products/peridot-canvas-hairon-bag) |
| Delphine Canvas & Hairon Bag | S-5218 | 6 | [Manufacturer gallery](https://myrabag.com/products/delphine-canvas-hairon-bag) |
| Lanthe Hairon and Canvas Bag | S-5215 | 5 | [Manufacturer gallery](https://myrabag.com/products/lanthe-canvas-and-hairon-bag) |
| Maia Concealed Bag | S-5217 | 4 | [Manufacturer gallery](https://myrabag.com/products/maia-concealed-bag) |
| Amethyst Hairon & Canvas Bag | S-5213 | 5 | [Manufacturer gallery](https://myrabag.com/products/amethyst-canvas-and-hairon-bag) |
| Myra Mojave Leather Bag in Old Rose | S-12997 | 5 | [Manufacturer gallery](https://myrabag.ca/products/mojave-meadow-leather-bag-in-old-rose) |

### Replacement file mapping

| Product | Existing catalog path restored | Manufacturer image |
| --- | --- | --- |
| Blue Isle Cross Body Bag Small | `/uploads/1783991943053-319234647.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5216-1.jpg?v=1777532732) |
| Blue Isle Cross Body Bag Small | `/uploads/1783998578622-36361855.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5216-2.jpg?v=1777532732) |
| Blue Isle Cross Body Bag Small | `/uploads/1784045789562-226366899.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5216-3.jpg?v=1777532732) |
| Blue Isle Cross Body Bag Small | `/uploads/1784045789568-341514717.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5216-4.jpg?v=1777532732) |
| Juniper Hairon Canvas Weekender Bag | `/uploads/1784063952592-719836236.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5214-1.jpg?v=1790593461) |
| Juniper Hairon Canvas Weekender Bag | `/uploads/1784063952593-266536681.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5214-2.jpg?v=1790593461) |
| Juniper Hairon Canvas Weekender Bag | `/uploads/1784065340652-707136497.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5214-3.jpg?v=1790593461) |
| Juniper Hairon Canvas Weekender Bag | `/uploads/1784137587664-829198967.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5214-4.jpg?v=1790593461) |
| Peridot Hairon and Canvas Bag | `/uploads/1784069113156-160039583.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5219-1_59b0de2a-5e6f-40d6-af02-50eed800f59e.jpg?v=1791367398) |
| Peridot Hairon and Canvas Bag | `/uploads/1784069818266-625432947.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5219-2_a5c7e81a-c06d-487a-bc7a-58cdf763e57c.jpg?v=1791367397) |
| Peridot Hairon and Canvas Bag | `/uploads/1784137385703-310900338.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5219-3_773da930-56c7-4125-888f-3b93e3e085f8.jpg?v=1791367397) |
| Peridot Hairon and Canvas Bag | `/uploads/1784137385805-32981382.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5219-4_e2768ba9-a322-4c91-baee-a5bd47e0ed36.jpg?v=1791367397) |
| Peridot Hairon and Canvas Bag | `/uploads/1784137385807-342546709.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5219-5_b1f7e695-ed89-424c-8f80-98b3d5519027.jpg?v=1791367397) |
| Delphine Canvas & Hairon Bag | `/uploads/1784139274731-996967941.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5218-1.jpg?v=1790593581) |
| Delphine Canvas & Hairon Bag | `/uploads/1784139274735-513118032.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5218-2.jpg?v=1790593581) |
| Delphine Canvas & Hairon Bag | `/uploads/1784139274736-23585267.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5218-3.jpg?v=1790593581) |
| Delphine Canvas & Hairon Bag | `/uploads/1784139274740-487683339.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5218-4.jpg?v=1790593581) |
| Delphine Canvas & Hairon Bag | `/uploads/1784139274745-179245036.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5218-5.jpg?v=1790593581) |
| Delphine Canvas & Hairon Bag | `/uploads/1784224391324-892861758.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5218_d751ede6-c661-4e4c-ba31-4ddbaedab7ba.jpg?v=1758797611) |
| Lanthe Hairon and Canvas Bag | `/uploads/1784140108446-170016502.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5215-1.jpg?v=1791367084) |
| Lanthe Hairon and Canvas Bag | `/uploads/1784140108447-705424667.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5215-2.jpg?v=1791367084) |
| Lanthe Hairon and Canvas Bag | `/uploads/1784140108453-71159071.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5215-3.jpg?v=1791367084) |
| Lanthe Hairon and Canvas Bag | `/uploads/1784140108458-32206855.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5215-4.jpg?v=1791367084) |
| Lanthe Hairon and Canvas Bag | `/uploads/1784224564731-274139057.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5215-5.jpg?v=1791367084) |
| Maia Concealed Bag | `/uploads/1784141062386-13376486.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5217-1.jpg?v=1778302012) |
| Maia Concealed Bag | `/uploads/1784141062387-905025949.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5217-2.jpg?v=1778302012) |
| Maia Concealed Bag | `/uploads/1784141062389-715251127.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5217-3.jpg?v=1778302012) |
| Maia Concealed Bag | `/uploads/1784141062390-880746567.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5217-4.jpg?v=1778302012) |
| Amethyst Hairon & Canvas Bag | `/uploads/1784141799612-261580366.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5213_1_191fcbed-c794-456d-a8a8-a4e15ebac372.jpg?v=1758797407) |
| Amethyst Hairon & Canvas Bag | `/uploads/1784141799614-945457380.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5213_2_edba5f64-45e6-4e03-9a01-84d96522167d.jpg?v=1758797407) |
| Amethyst Hairon & Canvas Bag | `/uploads/1784141799616-55630534.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5213_3_a38af16d-ea0d-4312-b0b1-01376e5c3b05.jpg?v=1758797407) |
| Amethyst Hairon & Canvas Bag | `/uploads/1784141799616-97553241.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5213_4_4f6e0ef6-e41e-44f2-83d2-ca2c91a50169.jpg?v=1758797407) |
| Amethyst Hairon & Canvas Bag | `/uploads/1784141799618-901243083.webp` | [Source image](https://cdn.shopify.com/s/files/1/0672/5766/3685/files/S-5213_5_0be280c7-d07e-410c-b48d-66b93228a28a.jpg?v=1758797407) |
| Myra Mojave Leather Bag in Old Rose | `/uploads/1785875956329-798591988.webp` | [Source image](https://cdn.shopify.com/s/files/1/0631/7631/0870/files/S-12997_2_239ee196-957c-4c53-ba2a-2d1a9d5bee14.jpg?v=1767187883) |
| Myra Mojave Leather Bag in Old Rose | `/uploads/1785875956390-754376166.webp` | [Source image](https://cdn.shopify.com/s/files/1/0631/7631/0870/files/S-12997_3_12180960-30f5-4478-8826-199097bdf48b.jpg?v=1767187883) |
| Myra Mojave Leather Bag in Old Rose | `/uploads/1785875956390-757348513.webp` | [Source image](https://cdn.shopify.com/s/files/1/0631/7631/0870/files/S-12997_4_ab6d864c-c78c-4c20-83b6-9fdff794d08e.jpg?v=1767187883) |
| Myra Mojave Leather Bag in Old Rose | `/uploads/1785875956395-433422140.webp` | [Source image](https://cdn.shopify.com/s/files/1/0631/7631/0870/files/S-12997_1_87ef2c59-9670-4fb2-9839-38a9d08afabb.jpg?v=1767187883) |
| Myra Mojave Leather Bag in Old Rose | `/uploads/1785875956396-400668000.webp` | [Source image](https://cdn.shopify.com/s/files/1/0631/7631/0870/files/S-12997_5_52e34d69-1742-40db-8c3b-f80115762ee4.jpg?v=1767187883) |
