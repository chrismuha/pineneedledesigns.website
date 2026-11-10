# Pine Needle Designs

A Vue.js e-commerce website for Pine Needle Designs featuring a shopping cart with session persistence.

## Features

- **Product Collections**: Browse various jewelry and fashion collections
- **Shopping Cart**: Add items, update quantities, remove items
- **Auto-Open Cart**: Cart sidebar opens automatically when adding items
- **Session Persistence**: Cart data persists across browser sessions using backend API
- **Responsive Design**: Mobile-friendly interface with Bootstrap styling

## Tech Stack

- **Frontend**: Vue 3 + Vite + Pinia + Vue Router
- **Backend**: Node.js + Express + express-session
- **Styling**: Bootstrap + Custom CSS

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

#### Development Mode (Full Stack)

Run both frontend and backend simultaneously:

```bash
npm run dev:full
```

This will start:
- Backend API server on `http://localhost:3001`
- Frontend dev server on `http://localhost:5203`

#### Individual Services

**Backend Only:**
```bash
npm run server
```
Server runs on `http://localhost:3001`

**Frontend Only:**
```bash
npm run dev
```
When started from the repository root, the dev server runs on `http://localhost:5203`.
When started directly from the `frontend` workspace, it also defaults to `http://localhost:5203`.

#### Production Build

```bash
npm run build
npm run preview
```

`npm run build` writes disposable verification output outside Dropbox in the system temporary directory.
Production deployment builds from source on the DigitalOcean server with `npm run build:release`,
which overlays the completed build into the server’s `docs/` directory. Generated `docs/`
files are ignored by Git; edit Vue source and `frontend/public/` assets instead.
You can run `npm run build:release` locally when you need a local production copy,
but its generated files are not committed. Deployment preserves the currently served
files while preparing the next build. This does not change uploads or the independent
local/GitHub catalog and media backups.

### Production Catalog

MongoDB is the source of truth for collections, products, and their managed media URLs. Manage
catalog records and product media through the dashboard. New uploads use the product
name and unused numbered filenames; adding media keeps an existing canonical slug.
Click the grayed-out Sold control or its information icon for an explanation; the
dialog supports keyboard access, Escape, and a Got it button. Sold status is automatic and read-only: quantity zero means sold; a positive quantity
means available. Sales, inventory returns, restocking, and order-edit rollback update
quantity and stock status together. A payment-only refund does not return inventory;
use Cancel Order & Refund when the items should be returned to stock. Uploaded media files live in the ignored
`backend/uploads` directory on the application server and are served from `/uploads`; catalog media
is not committed to the repository.

### Daily GitHub catalog and media backup

The `Daily Catalog and Media Backup` GitHub Actions workflow runs once every
24 hours at 06:00 UTC (2:00 a.m. Eastern daylight time / 1:00 a.m. Eastern
standard time). It runs independently of both Macs and can also be started
manually from the Actions tab. GitHub can delay scheduled runs.

It reads products and collections, including hidden and sold items, subcollections,
and store settings directly from production MongoDB over SSH, and downloads the
server's uploaded media. It commits the result to `backups/pineneedledesigns.website/`
on the `daily-backups` branch, retaining deleted media, older catalog snapshots, and replaced files.
It uses the existing `DO_HOST`, `DO_USER`, and `DO_SSH_KEY` repository secrets and
the monitor's pinned SSH host key. Database credentials stay on the server.
Backup commits use `GITHUB_TOKEN` and do not trigger production deployment.
Each run also copies the current media recovery, Etsy, and provenance logs plus
their supporting manifests from `main` into `daily-backups`. The provenance ledger
records replacement reasons, owner-confirmed Etsy sources, Farmer's custom sold
notice, current filenames, and which historical files were superseded or retired.
A failed download or upload fails the workflow; check Actions for results and
GitHub failure notifications. The run summary reports missing referenced files;
a successful backup cannot recover originals already missing from the server.
Files of 100 MiB or more cause the Git upload step to fail rather than silently skip them.

This backs up catalog records and uploaded media, not orders, payments, or the
entire database. The repository is public: do not add credentials or private
customer data to this backup.

The former Mac LaunchAgent was removed. Its last local files remain at
`~/Website Backups/pineneedledesigns.website/`. The optional local installer and
manual backup script remain available, but are not required for the daily workflow.
The backup folder is outside the served `docs/` directory. Runtime locks and logs
are ignored by Git. Browse the current backup on GitHub’s `daily-backups` branch. The older backup
on `main` remains unchanged. To download the daily copy, clone or check out
`daily-backups` separately; pulling `main` does not download that branch’s files.

- `site/uploads/` mirrors website `/uploads/` URLs, including files no longer referenced by the catalog.
- `collections/Collection Name [ID]/` groups collection metadata and cover media. Its
  `products/` folders contain each item's `product.json`, readable `item-details.md`,
  `media.json` mapping files to original website URLs, and available photos/videos
  in `media/`. Products assigned to a subcollection appear under
  `subcollections/Subcollection Name [ID]/products/`. Complete records retain tags/filters,
  descriptions, sizes, prices, options, ordering, and original database relationships.
  Media files are hard links to the original path backups, so they open normally
  without duplicating video storage. IDs distinguish items with identical names.
- `collections/index.json` lists current folders; folders for removed or renamed items remain.
- `catalog-snapshots/` retains timestamped catalog records for restoring media associations.
- `replaced-files/` retains previous files when an existing upload is replaced.
- `removed-items.md` and `removed-items.json` separate removed items with retained backups,
  removed items with no backup, and files already missing when first observed. They include
  original media paths or catalog IDs, last-seen and first-detected-missing times, and
  retained recovery paths. Existing recovery files stay in their original folders.
- `removal-history.jsonl` appends observed removals and reappearances without repeating
  the same absence every day. `removal-state.json` preserves last-seen observations.
- `website-deletion-audit.json` contains catalog/media deletion audit records from the
  website. New dashboard product, collection (including cascades), subcollection, and
  product-media deletions record UTC start/completion times in MongoDB. Automatic video
  conversion cleanup and rejected-photo cleanup also record specific reasons. Every removal
  report and new removal history entry includes a reason and its evidence source;
  unmatched removals are explicitly marked cause unknown. Audit intent
  must be saved before deletion; failed or interrupted actions are never reported as
  confirmed completed deletions. An operation may partly complete before failure.
  Audit records exclude customer information and request bodies.
- Exact action times are available only after this feature is deployed. Direct database
  edits and manual disk changes are detected between checks;
  they do not have dashboard deletion timestamps. Historical missing files have unknown
  deletion dates. Items created and deleted between checks can be logged by the website
  audit but cannot be recovered unless a backup captured their contents.
- `backup-history.jsonl` appends a timestamp and file/missing counts for every completed
  backup, including runs with no catalog or media changes. Each successful daily run
  uploads this log to GitHub. Failed runs remain visible in GitHub Actions.
- `missing-files.txt` lists every currently missing referenced media path, with the
  last check timestamp; it is refreshed even when the list is unchanged.
- `backup-status.json` records the latest completed backup, SHA-256 checksums, and missing media links.
- GitHub Actions shows daily job results and failures. The retained local
  `backup.log` and `backup-error.log` describe the former Mac job.
- Historical local `activity.jsonl`, `monitor-state.json`, and `pending-alerts.json`
  are retained. The local scheduled backup no longer monitors changes or sends alerts.

Website deletions do not delete retained backup files. Interrupted transfers do not
replace completed files. The daily workflow works while both Macs are offline;
uploads deleted before a successful backup cannot be recovered by this job.
Existing missing media is reported rather than replaced with blank files. There is
no automatic pruning of old snapshots or replacement files.

For an easy local refresh, double-click **Refresh Local Backup.command** inside
`~/Website Backups/pineneedledesigns.website/`. It opens Terminal, downloads current
catalog records and uploads, reports the result, and opens the backup folder.
Keep Terminal open until it finishes. The command keeps older media and snapshots;
it does not delete local backup files when items are removed from the website.
Review `backup-status.json` and `missing-files.txt` for completion and missing media.
This remains an on-demand local refresh; the independent daily GitHub backup continues.

Install or refresh this shortcut on another Mac from the repository root with
`/usr/bin/python3 scripts/install-local-backup-shortcut.py`. The Mac needs the existing
server SSH key at `~/.ssh/pineneedles_deploy`, SSH access, Python 3, and rsync.
The installer copies the current backup script locally and does not enable a schedule.
Run the installer again after backup-script updates to refresh that installed copy.

You can also run a manual backup from the repository root with
`/usr/bin/python3 scripts/backup-uploaded-media.py`.
Verify backup retention with `python3 tests/media-backup.test.py`.

The backup folder includes `RESTORE.md` and `restore-uploaded-media.py`. Preview a
restore with `/usr/bin/python3 restore-uploaded-media.py` from that folder. Add
`--apply` to restore missing media and catalog records; existing website files and
records are preserved. `--snapshot catalog-snapshots/FILE.json` selects earlier
catalog data. Restore verifies backup checksums and casts saved IDs/dates back to
MongoDB types. It does not restore orders/payments or roll back existing records.

## External uptime monitoring

The separate `Catalog and File Monitor` workflow runs every six hours at minute 29
UTC. It reads all catalog records (including hidden/sold products) and the actual
uploads directory through SSH, using existing repository secrets and a pinned host
key. It emails `muhachris297@gmail.com` for new uploads, deleted/restored media, and
added/deleted/restored product, collection, and subcollection records. Initial
state comes from the existing monitor baseline; previously missing originals do
not generate repeated deletion alerts. State and pending messages persist in a
separate Actions cache. Failed inventory reads never count as mass deletions and
send a monitoring-failure email. This does not copy backup files into GitHub;
the daily backup workflow is a separate task. Like uptime monitoring, changes between
checks can be missed and GitHub schedules/cache retention have limitations.

The `External Uptime Monitor` GitHub Actions workflow checks the public homepage
and `/api/health` every six hours, at minute 17 in UTC, independently of DigitalOcean
and both Macs. It retries failed probes three times and emails
`muhachris297@gmail.com` through Resend when a confirmed outage starts and when the
site recovers. After detecting an outage, that run rechecks every 15 minutes for
up to five hours, stopping as soon as the site recovers. If it remains down, the
next scheduled six-hour run continues monitoring. Healthy runs finish immediately.
It uses the verified notification sender and the repository's
existing `RESEND_API_KEY` secret; no SSH connection to the website is required.
Run it manually from Actions with `send_test_email` enabled to test delivery.

Notification state is retained in GitHub's Actions cache, including when the site
or mail service fails. Missing or evicted state may cause a repeated outage email.
GitHub can delay or drop scheduled runs; in public repositories it disables
schedules after 60 days without repository activity. This is a periodic external
check, not a guaranteed real-time paging service. Outages between checks can be
missed. View the workflow history to confirm the monitor itself is running.

### Storefront browsing

Use the large forest-green buttons with white arrows to browse product photos and
videos or move between items in a homepage collection slider. Gallery and product
controls have larger touch targets on phones. Swipe gestures and keyboard left/right
navigation remain available when the gallery or product slider has focus.

## API Endpoints

### New Arrivals user guide

Open **Dashboard → Settings → New Arrivals** to control the homepage slider.
The default is **Latest only**, showing the ten newest available products with photos.
Choose one of three modes:

- **Latest only:** show 1–10 newest products automatically.
- **Latest + custom:** set the number of latest products and custom picks separately,
  with 1–10 items in total. For example, five latest plus four custom shows up to nine.
  Either count may be zero when you want just one item.
- **Custom only:** choose 1–10 products yourself.

Search by product or collection to choose custom picks. Use the arrow buttons to
set their order. Latest products appear first in mixed mode, followed by custom
picks; a product appears only once. Sold products, products without photos, and
hidden collections are excluded. Picks remain saved when sold or unavailable,
so remove or replace them if needed. Unfilled custom spaces stay empty rather
than being filled automatically. The preview shows exactly which available items
will appear. Use **Save New Arrivals** to apply changes, or turn off the section
with **Show New Arrivals on the homepage** and save. These controls have their own
save button and do not change checkout preferences or product collection assignments.

### Orders user guide

The dashboard Orders page is a text-only record of item names, selected options,
quantities, prices, totals, customer details, and order activity. It does not show
product photos/videos or provide product/media links. Editing an order uses a
text-only item list. Existing payment, inventory, cancellation, and refund controls
continue to work. Order responses also omit media stored in older checkout snapshots;
new snapshots exclude media. This does not delete product media or historical orders.

The backend provides the following cart API endpoints:

- `GET /api/cart` - Get current cart items
- `POST /api/cart` - Add item to cart (body: `{ product: {...} }`)
- `PUT /api/cart/:id` - Update item quantity (body: `{ quantity: number }`)
- `DELETE /api/cart/:id` - Remove item from cart
- `DELETE /api/cart` - Clear entire cart
- `GET /api/health` - Health check

## PayPal Booking Deposits

PayPal deposits for First Fittings and Bridal appointments are disabled by default. To enable them, set this server environment variable and restart the server:

```bash
PAYPAL_BOOKING_DEPOSITS_ENABLED=true
PAYPAL_CLIENT_ID=your_live_paypal_client_id
PAYPAL_CLIENT_SECRET=your_live_paypal_client_secret
```

Store all three values as GitHub Actions secrets for production deployment. An omitted flag or missing PayPal credential keeps deposits disabled and sends customers directly to the corresponding Google Calendar booking page.

## Order Email

Local development sends through Gmail SMTP when `EMAIL` and `EMAIL_APP_PASSWORD` are set in `.env`.
Production sends through the Resend HTTPS API because DigitalOcean blocks outbound SMTP. Configure these deployment values:

```bash
RESEND_API_KEY=re_...
RESEND_FROM=orders@pineneedledesigns.store
```

The sending domain must be verified in Resend before production messages can be delivered. `RESEND_API_KEY` belongs in GitHub Actions Secrets; never commit it or the local `.env` file.

## Sessions

Sessions are stored in the ignored `.sessions` directory so carts survive server restarts. Production requires a strong `SESSION_SECRET` stored in GitHub Actions Secrets. Local development uses a development-only fallback.

## Cart Features

- **Session-Based**: Cart persists across page refreshes and browser sessions
- **Auto-Open**: Cart sidebar opens automatically when items are added
- **Real-time Updates**: All cart operations sync with the backend
- **Loading States**: Visual feedback during API calls
- **Error Handling**: Graceful handling of network errors

## Project Structure

```
├── frontend/src/
│   ├── components/
│   │   ├── CartSidebar.vue    # Cart sidebar component
│   │   ├── GlobalHeader.vue   # Site header with cart icon
│   │   └── ...
│   ├── stores/
│   │   └── cart.js            # Pinia store for cart state
│   ├── views/
│   │   ├── CollectionView.vue # Product collection pages
│   │   └── ...
│   ├── data/
│   │   ├── siteContent.js     # Static policy/about content and homepage slides
│   │   └── productTemplates.js # Reusable dashboard option templates
│   └── router/
│       └── index.js           # Vue Router configuration
├── backend/src/               # Express API and MongoDB catalog
├── docs/                      # Ignored production output, generated during deployment
├── package.json
└── README.md
```

## Development Notes

- Cart data is stored in Express sessions (in-memory by default)
- CORS is configured for local development
- Session cookies expire after 24 hours
- All API calls include credentials for session management

## Readable email notifications

Commit notifications use the organization’s shared commit-email workflow. Pine
Needle outage/recovery alerts, catalog and uploaded-file activity, backup notices,
booking deposits, order confirmations, receipts, payment changes, cancellations,
and refunds use large email text (22px body, 34px titles, 28px section headings),
clear headings, bold item names or field labels, spacing, and wrapping text.
Order item tables include column headers. Status labels state OK or FAILED in
words. Plain-text alternatives remain available. Text-only backend notices gain
an escaped HTML version in the shared mail sender, for both SMTP and Resend.

Check notification formatting without delivering email:

```sh
node --experimental-test-module-mocks --test tests/email-accessibility.test.mjs tests/uptime.test.mjs
python3 tests/email-accessibility.test.py
python3 tests/media-backup.test.py
```
