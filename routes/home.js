const express = require('express');
const router = express.Router();
const Product = require('../models/product');

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  next();
}

function cleanText(value) {
  return (value || '').toLowerCase();
}

function menuCategory(product) {
  const name = cleanText(product.name);
  const category = product.category;

  if (name.includes('milkshake') || name.includes('milk shake') || name.includes('smoothie') || name.includes('juice') || name.includes('coca') || name.includes('sprite') || name.includes('fanta')) {
    return 'Drinks';
  }

  if (name.includes('coffee') || name.includes('cappuccino') || name.includes('latte')) {
    return 'Coffee';
  }

  if (name.includes('dessert') || name.includes('ice') || name.includes('cake')) {
    return 'Dessert';
  }

  if (name.includes('combo') || name.includes('meal') || name.includes('deal') || name.includes('set')) {
    return 'Combo & Meals';
  }

  if (name.includes('fries') || name.includes('nugget') || name.includes('crispy')) {
    return 'Sides';
  }

  if (name.includes('wrap') || name.includes('burger') || name.includes('salad')) {
    return 'Main';
  }

  if (category === 'Food') {
    return 'Main';
  }

  if (category === 'Desserts') {
    return 'Dessert';
  }

  return category || 'Main';
}

function imageFor(product) {
  if (product.imageUrl) {
    return product.imageUrl;
  }

  const name = cleanText(product.name);

  if (name.includes('fries')) return '/images/sides/fries.jpg';
  if (name.includes('nugget')) return '/images/sides/nuggets.jpg';
  if (name.includes('crispy')) return '/images/sides/crispy-fried-chicken.jpg';
  if (name.includes('salad')) return '/images/main/salad.jpg';
  if (name.includes('coca')) return '/images/drinks/coca.jpg';
  if (name.includes('sprite')) return '/images/drinks/sprite.jpg';
  if (name.includes('fanta')) return '/images/drinks/fanta.jpg';
  if (name.includes('cappuccino') || name.includes('coffee')) return '/images/coffee/cappuccino.jpg';
  if (name.includes('ice') || name.includes('dessert')) return '/images/dessert/chocoicecream.jpg';

  return '';
}

function menuOrder(category, product) {
  const name = cleanText(product.name);
  const mainOrder = ['chicken wrap', 'chicken burger', 'salad'];
  const sideOrder = ['fries', 'nuggets', 'crispy'];
  const list = category === 'Sides' ? sideOrder : mainOrder;
  const index = list.findIndex(item => name.includes(item));
  return index === -1 ? 99 : index;
}

async function showMenu(req, res) {
  try {
    const { search = '', category = 'Main' } = req.query;
    const productsFromDb = await Product.find().sort({ createdAt: -1 }).lean();
    const productsWithMenu = productsFromDb.map(product => ({
      ...product,
      menuCategory: menuCategory(product),
      displayImage: imageFor(product)
    }));

    const searchText = search.trim().toLowerCase();
    let products = productsWithMenu.filter(product => product.menuCategory === category);

    if (searchText) {
      products = products.filter(product => cleanText(product.name).includes(searchText));
    }

    products.sort((first, second) => menuOrder(category, first) - menuOrder(category, second));

    const addOnProducts = productsWithMenu
      .filter(product => ['Sides', 'Drinks', 'Coffee', 'Dessert'].includes(product.menuCategory))
      .filter(product => (product.stock || 0) > 0);

    const heroProducts = productsWithMenu
      .filter(product => {
        const name = cleanText(product.name);
        return name.includes('chicken wrap') || name.includes('chicken burger') || name.includes('crispy');
      })
      .slice(0, 3);

    res.render('home', {
      restaurantName: "Sharvin's Dine In",
      products: products || [],
      addOnProducts: addOnProducts || [],
      heroProducts,
      search,
      category
    });
  } catch (err) {
    console.error("Error loading home page:", err);
    res.render('home', {
      restaurantName: "Sharvin's Dine In",
      products: [],
      addOnProducts: [],
      heroProducts: [],
      search: '',
      category: 'Main'
    });
  }
}

router.get('/', requireLogin, showMenu);
router.get('/menu', requireLogin, showMenu);

module.exports = router;
