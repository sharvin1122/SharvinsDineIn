const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Order = require('../models/Order');

function requireApiUser(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Login required' });
  }

  next();
}

function requireApiAdmin(req, res, next) {
  if (!req.session.user || req.session.user.perms !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  if (req.session.user.id === 'admin' && req.session.user.email === process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL === 'demo.admin@sharvinsdinein.com') {
    return res.status(403).json({ error: 'Demo admin API access is restricted' });
  }

  next();
}

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: "Sharvin's Dine In"
  });
});

router.get('/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    res.json(products);
  } catch (err) {
    console.error('API products error:', err);
    res.status(500).json({ error: 'Unable to load products' });
  }
});

router.get('/orders', requireApiAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('product')
      .populate('items.product')
      .populate('user')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error('API orders error:', err);
    res.status(500).json({ error: 'Unable to load orders' });
  }
});

router.get('/my-orders', requireApiUser, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.session.user.id })
      .populate('product')
      .populate('items.product')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error('API my-orders error:', err);
    res.status(500).json({ error: 'Unable to load your orders' });
  }
});

module.exports = router;
