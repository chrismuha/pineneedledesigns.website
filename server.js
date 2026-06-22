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
const mailerConfigured = Boolean(EMAIL_SENDER && process.env.EMAIL_APP_PASSWORD);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_SENDER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// Verify transporter configuration at startup so failures surface early
if (mailerConfigured) {
  transporter.verify()
    .then(() => console.log('✅ Mailer verified (ready to send emails)'))
    .catch(err => console.error('❌ Mailer verification failed:', err));
} else {
  console.log('ℹ️ Mailer not configured; set EMAIL_APP_PASSWORD to enable order emails.');
}

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
      summary: req.body.summary,
      lineItems: req.body.lineItems,
      tax: req.body.tax,
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

    const request = await orders.captureOrder({ id: token });

    res.json({ success: true });

    const order = JSON.parse(request.body);
    const storedOrder = orderMap.get(order.id);

    if (!storedOrder) return;

    const { items, customer, billingAddress, shippingAddress, discountCode } = storedOrder;

    const money = (v) => `$${Number(v || 0).toFixed(2)}`;

    const summary = storedOrder.summary || {};
    const lineItems = storedOrder.lineItems || [];
    const tax = storedOrder.tax || {};

    const itemsHtml = items.map(i => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;">${i.name}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${money(i.unit_amount.value)}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${money(Number(i.quantity) * Number(i.unit_amount.value))}</td>
      </tr>
    `).join('');

    const lineItemsHtml = lineItems.map(l => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;">${l.title}</td>
        <td style="text-align:center;">${l.quantity}</td>
        <td style="text-align:right;">${money(l.subtotal)}</td>
        <td style="text-align:right;">${l.discountPercentDisplay} (${money(l.discountAmount)})</td>
        <td style="text-align:right;">${l.taxRateDisplay} (${money(l.taxAmount)})</td>
        <td style="text-align:right;">${money(l.lineTotal)}</td>
      </tr>
    `).join('');

    const html = `
      <div style="font-family:Arial,sans-serif;background:#f7f7f7;padding:20px;">
        <div style="max-width:900px;margin:auto;background:white;padding:20px;border-radius:10px;">

          <h2 style="margin:0;">🧾 New Order Received</h2>
          <p style="color:#666;">Order ID: <b>${order.id}</b></p>

          <hr>

          <h3>👤 Customer</h3>
          <p>
            Type: ${customer.type}<br>
            Email: ${customer.email}<br>
            Phone: ${customer.phone}
          </p>

          <h3>📦 Billing Address</h3>
          <p>
            ${billingAddress.name}<br>
            ${billingAddress.address1}<br>
            ${billingAddress.address2 || ''}<br>
            ${billingAddress.city}, ${billingAddress.state} ${billingAddress.zip}
          </p>

          <h3>🚚 Shipping Address</h3>
          <p>
            ${shippingAddress.name}<br>
            ${shippingAddress.address1}<br>
            ${shippingAddress.address2 || ''}<br>
            ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}
          </p>

          ${discountCode ? `<p><b>Discount Code:</b> ${discountCode}</p>` : ''}

          <hr>

          <h3>📦 Items (PayPal)</h3>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <hr>

          <h3>📊 Full Order Breakdown</h3>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tbody>
              ${lineItemsHtml}
            </tbody>
          </table>

          <hr>

          <h3>💰 Summary</h3>
          <p>
            Subtotal: <b>${money(summary.subtotal)}</b><br>
            Discount: <b>-${money(summary.discount)}</b><br>
            Tax: <b>${money(summary.tax)}</b><br>
            <b style="font-size:16px;">Final Total: ${money(summary.finalTotal)}</b>
          </p>

          <p style="color:#999;font-size:12px;margin-top:20px;">
            This order was automatically generated from the checkout system.
          </p>

        </div>
      </div>
      `;

    const text = `
      NEW ORDER RECEIVED
      Order ID: ${order.id}

      CUSTOMER
      Type: ${customer.type}
      Email: ${customer.email}
      Phone: ${customer.phone}

      BILLING ADDRESS
      ${billingAddress.name}
      ${billingAddress.address1}
      ${billingAddress.address2 || ''}
      ${billingAddress.city}, ${billingAddress.state} ${billingAddress.zip}

      SHIPPING ADDRESS
      ${shippingAddress.name}
      ${shippingAddress.address1}
      ${shippingAddress.address2 || ''}
      ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}

      ${discountCode ? `Discount Code: ${discountCode}\n` : ''}

      ITEMS
      ${lineItems.map(l =>
        `${l.title} | Qty: ${l.quantity} | Subtotal: $${l.subtotal.toFixed(2)} | Tax: $${l.taxAmount.toFixed(2)} | Total: $${l.lineTotal.toFixed(2)}`
      ).join('\n')}

      SUMMARY
      Subtotal: $${summary.subtotal}
      Discount: $${summary.discount}
      Tax: $${summary.tax}
      Final Total: $${summary.finalTotal}
      `;

    // ================= ADMIN EMAIL =================
    const adminOptions = {
      from: `"Pine Needle Designs" <${EMAIL_SENDER}>`,
      to: EMAIL_RECIPIENTS,
      subject: `Order #${order.id}`,
      html,
      text,
    };

    // ================= CUSTOMER RECEIPT EMAIL =================
    const customerReceiptHtml = `
    <div style="font-family:Arial,sans-serif;background:#f7f7f7;padding:20px;">
      <div style="max-width:700px;margin:auto;background:white;padding:30px;border-radius:10px;">

        <h2 style="margin-top:0;">Thank you for your order!</h2>

        <p>Hi ${shippingAddress.name},</p>

        <p>Your payment has been successfully received. Below is your receipt.</p>

        <hr>

        <p>
          <strong>Order ID:</strong> ${order.id}<br>
          <strong>Email:</strong> ${customer.email}
        </p>

        <h3>Items</h3>

        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
          <tbody>
            ${items.map(i => `
              <tr>
                <td>${i.name}</td>
                <td align="center">${i.quantity}</td>
                <td align="right">$${Number(i.unit_amount.value).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <hr>

        <h3>Summary</h3>

        <p>
          Subtotal: $${Number(summary.subtotal || 0).toFixed(2)}<br>
          Discount: -$${Number(summary.discount || 0).toFixed(2)}<br>
          Tax: $${Number(summary.tax || 0).toFixed(2)}<br>
          <strong>Total Paid: $${Number(summary.finalTotal || 0).toFixed(2)}</strong>
        </p>

        <hr>

        <h3>Shipping Address</h3>

        <p>
          ${shippingAddress.name}<br>
          ${shippingAddress.address1}<br>
          ${shippingAddress.address2 || ''}<br>
          ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}
        </p>

        <p style="margin-top:20px;">
          If you have any questions, call (315) 272-8928
        </p>

        <p>— Pine Needle Designs</p>

      </div>
    </div>
    `;

    // send both emails
    try {
      if (!mailerConfigured) {
        throw new Error('Mailer is not configured. Set EMAIL_APP_PASSWORD to enable order emails.');
      }

      const [adminInfo, customerInfo] = await Promise.all([
        transporter.sendMail(adminOptions),
        transporter.sendMail({
          from: `"Pine Needle Designs" <${EMAIL_SENDER}>`,
          to: customer.email,
          subject: `Receipt for Order ${order.id}`,
          html: customerReceiptHtml,
          text: `Receipt for Order ${order.id} - Total: $${summary.finalTotal}`
        })
      ]);

      console.log('✅ Admin email sent:', adminInfo.messageId);
      console.log('✅ Customer receipt sent:', customerInfo.messageId);

    } catch (mailErr) {
      console.error('❌ Email sending failed:', mailErr);
    }

    orderMap.delete(order.id);

  } catch (err) {
    console.error(err);
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
