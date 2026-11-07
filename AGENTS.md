# Pine Needle Designs project instructions

## Media naming standard

Apply this standard to new product and collection media, including manual additions,
imports, recovery work, scripts, and new or modified upload flows.

- Derive a readable slug from the product or collection title. Use lowercase ASCII
  letters, digits, and single hyphens; remove apostrophes, normalize other punctuation
  and spaces to separators, and remove leading/trailing hyphens. Keep existing
  canonical slugs stable when adding more media to an existing item.
- Use the following canonical filenames, with numbers padded to at least two digits:
  - Product photo: `<product-slug>-picture-01.webp`
  - Product video: `<product-slug>-video-01.webm`
  - Video poster: `<product-slug>-video-poster-01.webp`
  - Collection cover: `<collection-slug>-collection-cover.webp`
- Use WebP for new website photos/posters and WebM for new website videos. Preserve
  the format and extension when only renaming existing working media; do not
  recompress or convert it merely to rename it.
- Never use camera names, timestamps, opaque hashes, import IDs, or `legacy-` names
  as new canonical website filenames. For similarly named items, include a meaningful
  product variant in the slug and check for collisions before uploading.
- Continue with unused numbers instead of overwriting a different file or reusing a
  retained URL. For example, Old Rose's new photos use `picture-06` through
  `picture-11`; the gallery array determines display order.
- When a crop replaces a screenshot-style image, a descriptive derivative such as
  `<product-slug>-picture-01-cropped.webp` is allowed. Preserve the original file and
  URL, and point the current gallery to the cropped file. Remove phone controls,
  editor bars, thumbnails, and screenshot padding without changing the product
  artwork or wording.
- Give each product its own filenames when copying media between products. A custom
  SOLD notice is a product photo and follows the normal numbered picture pattern.
  Describe its message and replacement reason accurately in the media records.

## Source copies, catalog links, and backups

- Retained source copies belong under `/uploads/originals/<product-slug>/`, using
  `<product-slug>-source-picture-01.png` or
  `<product-slug>-source-video-01.mov` where those formats are appropriate. Preserve
  full-resolution photo pixels and video/audio streams where possible, remove
  location/private metadata from uploaded copies, and leave supplied originals
  unchanged. Document any conversion or orientation correction.
- Save website media in `backend/uploads/` and use the exact filename in the
  corresponding `/uploads/` catalog URL. Update only the intended media fields and
  preserve other product details.
- Preserve existing working URLs as compatibility aliases when renaming. Do not
  delete retained media or historical snapshots as part of routine naming work.
- The backup upload mirror under `backups/pineneedledesigns.website/site/uploads/`
  must retain the website filenames. Organized product copies may have the backup
  tool's ordering prefix; their `media.json` entries must map to the exact website
  URLs and readable local filenames.
- Verify uploaded bytes with SHA-256, check public delivery and catalog links, run
  the existing catalog/media backup, and verify its organized media mappings.

## Media records

- Update [the recovery log](backups/pineneedledesigns.website/MEDIA-RECOVERY-LOG.md)
  and [the current media lists](backups/pineneedledesigns.website/MEDIA-PROVENANCE.md)
  whenever media changes. Record old/new filenames, source, replacement reason,
  conversion or crop details, retained originals, checksums, and backup verification.
- Keep exactly two current lists, independently alphabetized by full item name:
  originals labeled **Never lost** and Etsy media labeled **Confirmed** in the first;
  all other recovery/replacement/derived media labeled **Unconfirmed** in the second.
  Classify individual files so mixed galleries can appear in both lists.
- Keep custom placeholder descriptions focused on the business purpose, displayed
  message, retired references, current filenames, and checksums.
