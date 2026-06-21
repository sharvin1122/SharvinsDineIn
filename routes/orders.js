
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/product');

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  if (req.session.user.perms === 'admin') {
    return res.redirect('/admin');
  }

  next();
}

function setFlash(req, type, message) {
  req.session.flash = { type, message };
}

// GET /orders - show all orders
router.get('/', requireLogin, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.session.user.id })
      .populate('product')
      .sort({ createdAt: -1 });
    res.render('orders', { orders });
  } catch (err) {
    console.error(" Error fetching orders:", err);
    res.status(500).send("Error loading orders");
  }
});

// POST /orders - place an order
router.post('/', requireLogin, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const qty = parseInt(quantity) || 1;

    const product = await Product.findById(productId);
    if (!product) {
      setFlash(req, 'danger', 'Product was not found.');
      return res.redirect('/');
    }

    if (product.stock < qty) {
      setFlash(req, 'danger', 'Not enough stock available.');
      return res.redirect('/');
    }

    const totalPrice = product.price * qty;

    const order = new Order({
      user: req.session.user.id,
      product: product._id,
      quantity: qty,
      totalPrice,
      status: "Pending"
    });

    await order.save();
    product.stock -= qty;
    await product.save();
    console.log(" Order saved:", order);

    setFlash(req, 'success', 'Order placed successfully.');
    res.redirect('/orders');
  } catch (err) {
    console.error(" Error placing order:", err);
    setFlash(req, 'danger', 'Order could not be placed.');
    res.redirect('/');
  }
});

// POST /orders/:id/delete - delete an order
router.post('/:id/delete', requireLogin, async (req, res) => {
  try {
    await Order.findOneAndDelete({
      _id: req.params.id,
      user: req.session.user.id
    });
    console.log(" Order deleted:", req.params.id);
    setFlash(req, 'success', 'Order deleted successfully.');
    res.redirect('/orders');
  } catch (err) {
    console.error(" Error deleting order:", err);
    setFlash(req, 'danger', 'Order could not be deleted.');
    res.redirect('/orders');
  }
});

// POST /orders/:id/pay - show dummy payment page
router.post('/:id/pay', requireLogin, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.session.user.id
    }).populate('product');
    if (!order) {
      setFlash(req, 'danger', 'Order was not found.');
      return res.redirect('/orders');
    }

    res.render('payment', { order }); // render dummy payment.ejs
  } catch (err) {
    console.error(" Error showing payment page:", err);
    setFlash(req, 'danger', 'Payment page could not be loaded.');
    res.redirect('/orders');
  }
});

// POST /orders/:id/confirm - confirm payment
router.post('/:id/confirm', requireLogin, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.session.user.id
    });
    if (!order) {
      setFlash(req, 'danger', 'Order was not found.');
      return res.redirect('/orders');
    }

    order.status = "Paid"; //  update status
    await order.save();

    console.log(" Order paid:", order);
    setFlash(req, 'success', 'Payment confirmed.');
    res.redirect(`/orders/${order._id}/receipt`);
  } catch (err) {
    console.error(" Error confirming payment:", err);
    setFlash(req, 'danger', 'Payment could not be confirmed.');
    res.redirect('/orders');
  }
});

router.get('/:id/receipt', requireLogin, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.session.user.id
    }).populate('product');

    if (!order) {
      setFlash(req, 'danger', 'Receipt was not found.');
      return res.redirect('/orders');
    }

    res.render('receipt', { order });
  } catch (err) {
    console.error(" Error loading receipt:", err);
    setFlash(req, 'danger', 'Receipt could not be loaded.');
    res.redirect('/orders');
  }
});

module.exports = router;
