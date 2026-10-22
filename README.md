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

`npm run build` writes disposable verification output outside Dropbox in the system temporary directory. Use
`npm run build:release` when the committed production files in `docs` need to be updated.

### Production Catalog

MongoDB is the source of truth for collections, products, and their managed media URLs. Manage
catalog records and product media through the dashboard. Uploaded media files live in the ignored
`backend/uploads` directory on the application server and are served from `/uploads`; catalog media
is not committed to the repository.

### Automatic local media backup

On Chris's Mac, `scripts/install-media-backup.py` installs a LaunchAgent that runs
`scripts/backup-uploaded-media.py` at login and every six hours while the Mac is
awake and online. Install or update it with `/usr/bin/python3 scripts/install-media-backup.py`.
The job connects over SSH using `~/.ssh/pineneedles_deploy`; database credentials
stay on the production server. It reads all products and collections, including
hidden and sold items, plus subcollections and store settings, directly from MongoDB.
This backs up catalog records and uploaded media, not orders, payments, or the entire database.

Backups live at `~/Website Backups/pineneedledesigns.website/`. The scheduled script
is installed into `~/Library/Application Support/Muha Computer Repair/Media Backup/`
because macOS blocks LaunchAgent access to this Dropbox checkout. These backups
are also copied to `backups/pineneedledesigns.website/` inside this repository, where
the media and catalog files can be committed to Git. Runtime locks and logs remain
ignored. The backup sits outside the served `docs/` directory. Dropbox can sync this
additional copy. macOS must grant Full Disk Access to
`/Library/Developer/CommandLineTools/usr/bin/python3` for the scheduled job to access
the Dropbox checkout. Until then the regular local backup continues, and
`repository-copy-status.json` reports whether the additional copy succeeded.

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
- `backup-status.json` records the latest completed backup, SHA-256 checksums, and missing media links.
- `backup.log` and `backup-error.log` show scheduled job results and failures.
- `activity.jsonl` records detected media deletions/restorations and removed/restored
  product, collection, and subcollection records. The scheduled job emails new
  events to `muhachris297@gmail.com` through the server's existing mail service;
  no mail credentials are copied to this Mac. The first run establishes a baseline so existing
  missing files do not generate alerts; later recovery of those files does.
  New uploads do not trigger restoration alerts. Unchanged damage does not repeat.
  `monitor-state.json` remembers previously missing items and `pending-alerts.json`
  retains notifications until the email service accepts them, retrying failures
  on the next successful check. Checks require this Mac to be awake and online.
  Manual runs can use `--alerts mac` for Mac notifications instead.

Website deletions do not delete local backup files. Interrupted transfers do not
replace completed files. An offline Mac cannot pull new files until it reconnects;
uploads deleted before the next successful pull cannot be recovered by this job.
Existing missing media is reported rather than replaced with blank files. There is
no automatic pruning of old snapshots or replacement files.

Run a manual backup from the repository root with
`/usr/bin/python3 scripts/backup-uploaded-media.py`.
Verify backup retention with `python3 tests/media-backup.test.py`.

The backup folder includes `RESTORE.md` and `restore-uploaded-media.py`. Preview a
restore with `/usr/bin/python3 restore-uploaded-media.py` from that folder. Add
`--apply` to restore missing media and catalog records; existing website files and
records are preserved. `--snapshot catalog-snapshots/FILE.json` selects earlier
catalog data. Restore verifies backup checksums and casts saved IDs/dates back to
MongoDB types. It does not restore orders/payments or roll back existing records.

## External uptime monitoring

The `External Uptime Monitor` GitHub Actions workflow checks the public homepage
and `/api/health` every six hours, at minute 17 in UTC, independently of DigitalOcean
and both Macs. It retries failed probes three times and emails
`muhachris297@gmail.com` through Resend when a confirmed outage starts and when the
site recovers. It uses the verified notification sender and the repository's
existing `RESEND_API_KEY` secret; no SSH connection to the website is required.
Run it manually from Actions with `send_test_email` enabled to test delivery.

Notification state is retained in GitHub's Actions cache, including when the site
or mail service fails. Missing or evicted state may cause a repeated outage email.
GitHub can delay or drop scheduled runs; in public repositories it disables
schedules after 60 days without repository activity. This is a periodic external
check, not a guaranteed real-time paging service. Outages between checks can be
missed. View the workflow history to confirm the monitor itself is running.

## API Endpoints

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
├── docs/                      # Published storefront build
├── package.json
└── README.md
```

## Development Notes

- Cart data is stored in Express sessions (in-memory by default)
- CORS is configured for local development
- Session cookies expire after 24 hours
- All API calls include credentials for session management
