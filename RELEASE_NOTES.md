# Release notes

## TBD

### Catalog

- Dashboard photo and video uploads now use readable product-based filenames, preserve existing canonical names, and reserve unused numbers to avoid overwriting retained media.
- Dashboard sold status has a grayed-out checkbox, readable stock guidance, and an information dialog when clicked, explaining why items with positive quantity remain available.
- Inventory status now follows quantity automatically: sales mark items sold only at zero, and returns or restocking make positive quantities available again. Dashboard stock status is read-only, and inventory changes immediately refresh the storefront catalog.
- Local catalog and media backups can be refreshed by double-clicking Refresh Local Backup.command in the backup folder, with visible completion status and preserved historical files.
- Snow Diva’s stock status now matches its six available items, restoring it to the homepage slider; its photo uses a readable filename with the previous URL preserved.
- Website deployment builds production files on the server; generated website files are no longer tracked in Git, while catalog and media backups remain separate.

## November 7, 2026

- Item-gallery arrows now sit within 6px of the product-card edges, with responsive
  spacing and 44px minimum buttons on narrow phones. Navigation dots follow the photo.
- Improved narrow-screen collection headings, grid sizing, long product text, option
  selectors, and cart controls to reduce crowding and horizontal overflow.

- Available items keep Add to Cart active. Missing selections open a required-options
  dialog; fully selected items add directly with their selected pricing.
- Item-gallery arrows have independent styling and SVG icons, with dedicated space
  beside the photos on desktop and mobile. Other site arrows retain their styling.

- Standardized the portrait asset name and clarified sold-placeholder wording in media records.
- Current media classification now uses two independently alphabetized lists:
  Never lost originals plus Confirmed Etsy media, followed by Unconfirmed replacements.
- Recovery documentation now records each media replacement reason, explicitly
  confirms all 34 Etsy-sourced photos, and explains Farmer's custom sold notice.
  Daily backups refresh these logs and supporting manifests from `main`.
- Media-gallery and homepage product-slider arrows now use forest-green buttons,
  larger white chevrons, white borders, and larger touch targets on phones and desktops.
- Baby I’m a Wild Card now has a photo captured from its working video.
  Removed the Shirts collection’s obsolete missing fallback image reference.

## November 6, 2026

- Orders are text-only records. New order snapshots exclude product media, and
  responses filter media and product links from older snapshots. Order editing
  loads only item names, prices, stock, and internal inventory references.
- Product media, historical orders, payment actions, and inventory behavior are preserved.
