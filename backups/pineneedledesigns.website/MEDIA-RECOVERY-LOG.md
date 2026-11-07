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
