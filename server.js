import * as dotenv from 'dotenv'
dotenv.config();

import express from 'express';
import session from 'express-session';
import nodemailer from 'nodemailer'
import path from 'path'
import { fileURLToPath } from 'url';
import * as paypal from '@paypal/paypal-server-sdk'


const app = express();
const PORT = process.env.PORT || 3001;
const orderMap = new Map();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base URL for application links (can be overridden via .env)
const APP_BASE_URL = process.env.APP_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://pineneedledesigns.store' : 'http://localhost:5173');

const _isLocalApp = APP_BASE_URL.includes('localhost') || APP_BASE_URL.includes('127.0.0.1') || APP_BASE_URL.startsWith('http://');

const _paypalEnvironment = _isLocalApp ? paypal.Environment.Sandbox : paypal.Environment.Production;
const _paypalClientId = _isLocalApp ? process.env.SANDBOX_PAYPAL_CLIENT_ID : process.env.PAYPAL_CLIENT_ID;
const _paypalClientSecret = _isLocalApp ? process.env.SANDBOX_PAYPAL_CLIENT_SECRET : process.env.PAYPAL_CLIENT_SECRET;

// Email defaults and overrides
const DEFAULT_PROD_EMAIL = 'onpinesandneedles@gmail.com';
const DEFAULT_SANDBOX_EMAIL = 'alnabidrm@gmail.com';

const EMAIL_SENDER = process.env.EMAIL || (_isLocalApp ? DEFAULT_SANDBOX_EMAIL : DEFAULT_PROD_EMAIL);
const EMAIL_RECIPIENTS = process.env.ORDER_EMAILS || (_isLocalApp ? DEFAULT_SANDBOX_EMAIL : DEFAULT_PROD_EMAIL);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_SENDER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// Verify transporter configuration at startup so failures surface early
transporter.verify()
  .then(() => console.log('✅ Mailer verified (ready to send emails)'))
  .catch(err => console.error('❌ Mailer verification failed:', err));

const client = new paypal.Client({
  environment: _paypalEnvironment,
  clientCredentialsAuthCredentials: {
    oAuthClientId: _paypalClientId,
    oAuthClientSecret: _paypalClientSecret
  }
})

const orders = new paypal.OrdersController(client)
// Middleware - CORS configuration

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3001',
  'http://127.0.0.1:5173',
  'https://pineneedledesigns.store',
  'https://www.pineneedledesigns.store'
];

app.use((req, res, next) => {
  const origin = req.get('origin');

  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header(
      'Access-Control-Allow-Methods',
      'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'
    );
    res.header('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'docs')));

// Session configuration
app.use(session({
  secret: 'pine-needle-designs-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
// Cart API Routes
app.get('/api/cart', (req, res) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  res.json(req.session.cart);
});

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/videos', express.static(path.join(__dirname, 'videos')));

app.post('/api/cart', (req, res) => {
  const { product } = req.body;

  if (!req.session.cart) {
    req.session.cart = [];
  }

  const productCartItemId = product.cartItemId || String(product.id);
  const existingItem = req.session.cart.find(item => (item.cartItemId || String(item.id)) === productCartItemId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    req.session.cart.push({ ...product, cartItemId: productCartItemId, quantity: 1 });
  }

  res.json(req.session.cart);
});

app.put('/api/cart/:id', (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (!req.session.cart) {
    req.session.cart = [];
  }

  const item = req.session.cart.find(item => (item.cartItemId || String(item.id)) === id);

  if (item) {
    item.quantity = quantity;
    if (item.quantity <= 0) {
      req.session.cart = req.session.cart.filter(item => (item.cartItemId || String(item.id)) !== id);
    }
  }

  res.json(req.session.cart);
});

app.delete('/api/cart/:id', (req, res) => {
  const { id } = req.params;

  if (!req.session.cart) {
    req.session.cart = [];
  }

  req.session.cart = req.session.cart.filter(item => (item.cartItemId || String(item.id)) !== id);
  res.json(req.session.cart);
});

app.delete('/api/cart', (req, res) => {
  req.session.cart = [];
  res.json([]);
});

const DISCOUNT_RULES = {
  'B$': { type: 'fixed', value: 20 },
  'W$': { type: 'fixed', value: 25 },
  'FAM': { type: 'percent', value: 40 },
  'SURPRISE': { type: 'percent', value: 20 },
  'SEW': { type: 'percent', value: 10 },
}

const getDiscountAmount = (total, code) => {
  if (!code || typeof code !== 'string') return 0

  const rule = DISCOUNT_RULES[code.trim().toUpperCase()]
  if (!rule) return 0

  if (rule.type === 'fixed') {
    return Math.min(rule.value, total)
  }

  return Number(((total * rule.value) / 100).toFixed(2))
}

// Checkout

app.post('/api/checkout', async (req, res) => {
  try {
    const { code, customer, billingAddress, shippingAddress } = req.body || {}
    const cart = req.session.cart || []

    if (!customer || !customer.email || !customer.phone || !customer.type) {
      return res.status(400).json({ error: 'Customer email, phone, and type are required for checkout.' })
    }

    if (!billingAddress || !billingAddress.name || !billingAddress.address1 || !billingAddress.city || !billingAddress.state || !billingAddress.zip) {
      return res.status(400).json({ error: 'Complete billing address is required.' })
    }

    if (!shippingAddress || !shippingAddress.name || !shippingAddress.address1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zip) {
      return res.status(400).json({ error: 'Complete shipping address is required.' })
    }

    const itemDescription = (item) => {
      const selectedOptions = item.selectedOptions
        ? Object.entries(item.selectedOptions).map(([name, value]) => `${name}: ${value}`).join(', ')
        : '';
      return [item.description, selectedOptions].filter(Boolean).join(' | ');
    };

    const total = cart.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);
    const discount = getDiscountAmount(total, code)
    const totalAfterDiscount = Math.max(0, total - discount)

    const orderItems = cart.map((item) => {
      return {
        name: item.title,
        quantity: item.quantity.toString(),
        unitAmount: {
          currencyCode: 'USD',
          value: item.price.toFixed(2)
        },
        description: itemDescription(item),
      }
    })

    if (discount > 0) {
      orderItems.push({
        name: `Discount${code ? ` (${code.trim().toUpperCase()})` : ''}`,
        quantity: '1',
        unitAmount: {
          currencyCode: 'USD',
          value: (-discount).toFixed(2)
        },
        description: 'Applied discount code',
      })
    }

    const order = await orders.createOrder({
      prefer: 'return=representation',
      body: {
        intent: paypal.CheckoutPaymentIntent.Capture,
        purchaseUnits: [
          {
            amount: {
              currencyCode: "USD",
              value: totalAfterDiscount.toFixed(2),
              breakdown: {
                itemTotal: {
                  currencyCode: "USD",
                  value: totalAfterDiscount.toFixed(2),
                }
              }
            },
            items: orderItems
          }
        ],
          applicationContext: {
          returnUrl: `${APP_BASE_URL}/order-success`,
          cancelUrl: `${APP_BASE_URL}/cancel`
        },
      },
    })

    const orderBody = JSON.parse(order.body);
    const link = orderBody.links.find(link => link.rel === 'approve').href;

    orderMap.set(orderBody.id, {
      items: orderBody.purchase_units[0].items,
      customer: {
        type: customer.type,
        email: customer.email,
        phone: customer.phone,
      },
      billingAddress,
      shippingAddress,
      discountCode: code ? code.trim().toUpperCase() : '',
    })

    res.json({ url: link });

  } catch (err) {
    console.error('Error in /api/checkout:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Error creating PayPal order', message: err && err.message ? err.message : String(err) });
  }
});


app.get('/api/checkout/capture-order/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const request = await orders.captureOrder({ id: token })

    res.json({ success: true });

    const order = JSON.parse(request.body);
    const storedOrder = orderMap.get(order.id);

    if (!storedOrder) return;

    const { items, customer, billingAddress, shippingAddress, discountCode } = storedOrder;

    let itemsList = ``;
    let total = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      itemsList += `${item.quantity} x ${item.name}: ${item.quantity} x ${item.unit_amount.value} = ${Number(item.quantity) * Number(item.unit_amount.value)}<br>`;
      total += Number(item.quantity) * Number(item.unit_amount.value);
    }

    const discountLine = discountCode ? `<br>Discount Code: ${discountCode}` : '';
    const customerInfo = `Customer type: ${customer.type}<br>Email: ${customer.email}<br>Phone: ${customer.phone}<br>`;
    const billingInfo = `Billing address:<br>${billingAddress.name}<br>${billingAddress.address1}<br>${billingAddress.address2 ? billingAddress.address2 + '<br>' : ''}${billingAddress.city}, ${billingAddress.state} ${billingAddress.zip}<br>`;
    const shippingInfo = `Shipping address:<br>${shippingAddress.name}<br>${shippingAddress.address1}<br>${shippingAddress.address2 ? shippingAddress.address2 + '<br>' : ''}${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}<br>`;

    const options = {
      from: `"Pine Needle Designs" <${EMAIL_SENDER}>`,
      to: EMAIL_RECIPIENTS,
      subject: `Order #${order.id}`,
      html: `Customer information<br><br>${customerInfo}${billingInfo}${shippingInfo}${discountLine}<br><br>Items Ordered<br><br>${itemsList}<br><br>Total: ${total}`,
      text: `Customer information\n\nCustomer type: ${customer.type}\nEmail: ${customer.email}\nPhone: ${customer.phone}\n\nBilling address:\n${billingAddress.name}\n${billingAddress.address1}\n${billingAddress.address2 ? billingAddress.address2 + '\n' : ''}${billingAddress.city}, ${billingAddress.state} ${billingAddress.zip}\n\nShipping address:\n${shippingAddress.name}\n${shippingAddress.address1}\n${shippingAddress.address2 ? shippingAddress.address2 + '\n' : ''}${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}${discountLine ? `\n\nDiscount Code: ${discountCode}` : ''}\n\nItems Ordered\n\n${itemsList.replace(/<br>/g, '\n')}\n\nTotal: ${total}`,
    }

    try {
      const info = await transporter.sendMail(options);
      console.log('✅ Order email sent:', info);
    } catch (mailErr) {
      console.error('❌ Failed to send order email:', mailErr);
    }

    orderMap.delete(order.id);

  } catch (err) {
    console.error(err);
    orderMap.delete(order.id);
    res.status(500).json({ success: false });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🛑 Press Ctrl+C to stop the server`);
});

// Keep the process alive
setInterval(() => {
  // Keep-alive interval
}, 30000);
