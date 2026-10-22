# Restoring Pine Needle Designs

Browse collections/ by collection, subcollection, and product name. Each product has item-details.md, its complete product.json record (including filters/tags, options, prices, and database IDs), media.json with original URLs, and available files in media/. IDs in folder names keep items with the same name separate.

collections/index.json lists the current catalog. Older item folders are retained. catalog-snapshots/ preserves earlier catalog states. site/uploads/ preserves original website paths. replaced-files/ preserves replaced media. Missing originals are listed in backup-status.json.

Preview a restore: /usr/bin/python3 restore-uploaded-media.py
Restore missing files and catalog records: /usr/bin/python3 restore-uploaded-media.py --apply
Use --snapshot catalog-snapshots/FILE.json to select an earlier catalog state. Existing website files and records are never overwritten. Restore does not remove website data. For older versions of existing records, use the saved JSON for a deliberate manual rollback.
