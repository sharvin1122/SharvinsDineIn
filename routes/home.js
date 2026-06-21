const express = require('express');
const router = express.Router();
const Product = require('../models/product');

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  next();
}

// GET /
router.get('/', requireLogin, async (req, res) => {
  try {
    const { search = '', category = 'All' } = req.query;
    const filter = {};

    if (search.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    if (category !== 'All') {
      filter.category = category;
    }

    const products = await Product.find(filter).sort({ createdAt: -1 }); // fetch products from DB
    console.log(" Home page loaded with products:", products.length);
    res.render('home', {
      restaurantName: "Sharvin's Dine In",
      products: products || [], //  always send products
      search,
      category
    });
  } catch (err) {
    console.error("Error loading home page:", err);

    // empty array if error happens, so EJS won’t crash
    res.render('home', {
      restaurantName: "Sharvin's Dine In",
      products: [],
      search: '',
      category: 'All'
    });
  }
});

module.exports = router;
