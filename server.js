import express from 'express';
import session from 'express-session';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS configuration
app.use((req, res, next) => {
  const origin = req.get('origin');
  if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

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

app.post('/api/cart', (req, res) => {
  const { product } = req.body;

  if (!req.session.cart) {
    req.session.cart = [];
  }

  // Check if product already exists
  const existingItem = req.session.cart.find(item => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    req.session.cart.push({ ...product, quantity: 1 });
  }

  res.json(req.session.cart);
});

app.put('/api/cart/:id', (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (!req.session.cart) {
    req.session.cart = [];
  }

  const item = req.session.cart.find(item => item.id === parseInt(id));

  if (item) {
    item.quantity = quantity;
    if (item.quantity <= 0) {
      req.session.cart = req.session.cart.filter(item => item.id !== parseInt(id));
    }
  }

  res.json(req.session.cart);
});

app.delete('/api/cart/:id', (req, res) => {
  const { id } = req.params;

  if (!req.session.cart) {
    req.session.cart = [];
  }

  req.session.cart = req.session.cart.filter(item => item.id !== parseInt(id));
  res.json(req.session.cart);
});

app.delete('/api/cart', (req, res) => {
  req.session.cart = [];
  res.json([]);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🛑 Press Ctrl+C to stop the server`);
});

// Keep the process alive
setInterval(() => {
  // Keep-alive interval
}, 30000);