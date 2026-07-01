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
- Frontend dev server on `http://localhost:5177`

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
Dev server runs on `http://localhost:5177` (or next available port)

#### Production Build

```bash
npm run build
npm run preview
```

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
├── src/
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
│   │   └── siteData.js        # Product and site data
│   └── router/
│       └── index.js           # Vue Router configuration
├── server.js                  # Express backend server
├── package.json
└── README.md
```

## Development Notes

- Cart data is stored in Express sessions (in-memory by default)
- CORS is configured for local development
- Session cookies expire after 24 hours
- All API calls include credentials for session management
