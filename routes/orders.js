
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/product');
const User = require('../models/user');

function imageFor(product) {
  const name = (product.name || '').toLowerCase();

  if (product.imageUrl) return product.imageUrl;
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

async function userIdForOrder(req) {
  if (req.session.user?.id && req.session.user.id !== 'admin') {
    return req.session.user.id;
  }

  if (req.session.user?._id) {
    req.session.user.id = String(req.session.user._id);
    return req.session.user.id;
  }

  if (req.session.user?.email) {
    const user = await User.findOne({ email: req.session.user.email });
    if (user && user.perms !== 'admin') {
      req.session.user.id = String(user._id);
      req.session.user.perms = user.perms;
      return req.session.user.id;
    }
  }

  return null;
}

async function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  if (req.session.user.perms === 'admin' && req.session.user.email === process.env.ADMIN_EMAIL) {
    return res.redirect('/admin');
  }

  const userId = await userIdForOrder(req);
  if (!userId) {
    req.session.destroy(() => {
      res.redirect('/login');
    });
    return;
  }

  req.orderUserId = userId;
  next();
}

function setFlash(req, type, message) {
  req.session.flash = { type, message };
}

function productGroup(product) {
  const name = (product.name || '').toLowerCase();

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

  return product.category || 'Main';
}

function canHaveAddons(product) {
  return ['Main', 'Combo & Meals', 'Food'].includes(productGroup(product));
}

function cleanCartItems(cartData) {
  try {
    const items = JSON.parse(cartData || '[]');
    return Array.isArray(items) ? items : [];
  } catch (err) {
    return [];
  }
}

function orderItems(order) {
  if (order.items && order.items.length > 0) {
    return order.items;
  }

  return [{
    product: order.product,
    name: order.product?.name || 'Deleted Product',
    price: order.product?.price || 0,
    quantity: order.quantity,
    imageUrl: order.product?.imageUrl || '',
    addOns: order.addOns || [],
    lineTotal: order.totalPrice
  }];
}

function htmlSafe(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}

function receiptDate(order) {
  return order.createdAt
    ? order.createdAt.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
    : '';
}

function receiptHtml(order, lines) {
  const receiptId = String(order._id).slice(-8).toUpperCase();
  const rows = lines.map(item => {
    const addOns = item.addOns && item.addOns.length
      ? `<div class="addons">${item.addOns.map(addOn => htmlSafe(addOn.name)).join(', ')}</div>`
      : '';

    return `
      <div class="item">
        <div>
          <strong>${htmlSafe(item.name)}</strong>
          <span>Qty ${item.quantity}</span>
          ${addOns}
        </div>
        <strong>Rs ${item.lineTotal}</strong>
      </div>
    `;
  }).join('');
  const commentBlock = order.comment
    ? `<div class="comment"><span class="label">Additional Comment</span><strong>${htmlSafe(order.comment)}</strong></div>`
    : '';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt ${receiptId}</title>
  <style>
    body { background:#f3f4f6; color:#111827; font-family:Arial,sans-serif; margin:0; padding:32px; }
    .receipt { background:#fff; border:1px solid #e5e7eb; border-radius:14px; box-shadow:0 20px 50px rgba(17,24,39,.12); margin:0 auto; max-width:430px; overflow:hidden; }
    .top { background:#111827; color:#fff; padding:24px; text-align:center; }
    .top h1 { font-size:24px; margin:0 0 6px; }
    .top p { color:#fed7aa; margin:0; }
    .meta { display:grid; gap:8px; padding:20px 24px; }
    .meta div, .total { display:flex; justify-content:space-between; gap:18px; }
    .label { color:#6b7280; }
    .items { border-bottom:1px dashed #d1d5db; border-top:1px dashed #d1d5db; display:grid; gap:12px; margin:0 24px; padding:18px 0; }
    .item { align-items:flex-start; display:flex; gap:16px; justify-content:space-between; }
    .item span, .addons { color:#6b7280; display:block; font-size:13px; margin-top:4px; }
    .total { align-items:center; font-size:20px; padding:22px 24px; }
    .comment { background:#fef3c7; display:grid; gap:6px; margin:0 24px 20px; padding:14px; border-radius:10px; }
    .comment strong { color:#92400e; }
    .thanks { background:#fef3c7; color:#92400e; font-weight:700; padding:14px 24px; text-align:center; }
    @media print { body { background:#fff; padding:0; } .receipt { box-shadow:none; max-width:none; } }
  </style>
</head>
<body>
  <section class="receipt">
    <div class="top">
      <h1>Sharvin's Dine In</h1>
      <p>Payment Receipt</p>
    </div>
    <div class="meta">
      <div><span class="label">Receipt No.</span><strong>${receiptId}</strong></div>
      <div><span class="label">Ordered Time</span><strong>${htmlSafe(receiptDate(order))}</strong></div>
      <div><span class="label">Status</span><strong>${htmlSafe(order.status)}</strong></div>
    </div>
    <div class="items">${rows}</div>
    <div class="total"><span>Total Paid</span><strong>Rs ${order.totalPrice}</strong></div>
    ${commentBlock}
    <div class="thanks">Thank you for your order</div>
  </section>
</body>
</html>`;
}

function cleanId(value) {
  return value && value._id ? value._id : value;
}

function cleanOrderLine(line) {
  return {
    product: cleanId(line.product),
    name: String(line.name || 'Deleted Product'),
    price: Number(line.price || 0),
    quantity: Math.max(1, Number(line.quantity || 1)),
    imageUrl: line.imageUrl || '',
    addOns: (line.addOns || []).map(addOn => ({
      product: cleanId(addOn.product),
      name: String(addOn.name || '').trim(),
      price: Number(addOn.price || 0),
      imageUrl: addOn.imageUrl || ''
    })).filter(addOn => addOn.name),
    lineTotal: Number(line.lineTotal || 0)
  };
}

async function fixOrdersWithoutUser(userId) {
  await Order.updateMany(
    { user: { $exists: false }, status: 'Pending' },
    { user: userId }
  );
  await Order.updateMany(
    { user: null, status: 'Pending' },
    { user: userId }
  );
}

async function createGroupedOrder(userId, orderLines, orderTotal, comment = '') {
  const cleanLines = orderLines.map(cleanOrderLine);

  return Order.create({
    user: userId,
    product: cleanLines[0].product,
    quantity: cleanLines.reduce((sum, item) => sum + item.quantity, 0),
    items: cleanLines,
    addOns: [],
    comment: String(comment || '').trim().slice(0, 500),
    totalPrice: orderTotal,
    status: 'Pending'
  });
}

router.get('/', requireLogin, async (req, res) => {
  try {
    await fixOrdersWithoutUser(req.orderUserId);

    const orders = await Order.find({ user: req.orderUserId })
      .populate('product')
      .populate('items.product')
      .sort({ createdAt: -1 });
    res.render('orders', { orders });
  } catch (err) {
    console.error(" Error fetching orders:", err);
    setFlash(req, 'danger', 'Orders could not be loaded.');
    res.redirect('/');
  }
});

router.post('/cart', requireLogin, async (req, res) => {
  try {
    const cartItems = cleanCartItems(req.body.cartData);
    const orderComment = req.body.orderComment || '';

    if (!cartItems.length) {
      setFlash(req, 'danger', 'Your cart is empty.');
      return res.redirect('/');
    }

    const productIds = cartItems.map(item => item.productId).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map(product => [String(product._id), product]));
    const neededStock = {};

    cartItems.forEach(item => {
      const qty = Math.max(1, parseInt(item.quantity) || 1);
      neededStock[item.productId] = (neededStock[item.productId] || 0) + qty;
    });

    for (const item of cartItems) {
      const product = productMap.get(item.productId);

      if (!product) {
        setFlash(req, 'danger', 'One item in your cart was not found.');
        return res.redirect('/');
      }

      if ((product.stock || 0) < neededStock[item.productId]) {
        setFlash(req, 'danger', `${product.name} does not have enough stock.`);
        return res.redirect('/');
      }
    }

    const orderLines = [];
    const stockChanges = [];
    let orderTotal = 0;

    for (const item of cartItems) {
      const product = productMap.get(item.productId);
      const qty = Math.max(1, parseInt(item.quantity) || 1);
      const addOns = canHaveAddons(product) && Array.isArray(item.addOns) ? item.addOns : [];
      const addOnIds = addOns.map(addOn => addOn.id).filter(Boolean);
      const addOnProducts = addOnIds.length
        ? await Product.find({ _id: { $in: addOnIds } })
        : [];
      const addOnMap = new Map(addOnProducts.map(addOn => [String(addOn._id), addOn]));

      const selectedAddOns = addOns.map(addOn => {
        if (addOn.id && addOnMap.has(addOn.id)) {
          const savedAddOn = addOnMap.get(addOn.id);
          return {
            product: savedAddOn._id,
            name: savedAddOn.name,
            price: savedAddOn.price,
            imageUrl: imageFor(savedAddOn)
          };
        }

        return {
          name: String(addOn.name || '').trim(),
          price: Number(addOn.price || 0),
          imageUrl: ''
        };
      }).filter(addOn => addOn.name);

      const addOnsTotal = selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0);
      const totalPrice = (product.price + addOnsTotal) * qty;

      orderLines.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: qty,
        imageUrl: imageFor(product),
        addOns: selectedAddOns,
        lineTotal: totalPrice
      });

      orderTotal += totalPrice;
      stockChanges.push({ product, qty });
    }

    await createGroupedOrder(req.orderUserId, orderLines, orderTotal, orderComment);

    for (const item of stockChanges) {
      item.product.stock -= item.qty;
      await item.product.save();
    }

    setFlash(req, 'success', 'Your cart order was placed successfully.');
    res.redirect('/orders');
  } catch (err) {
    console.error(" Error placing cart order:", err);
    setFlash(req, 'danger', 'Cart order could not be placed.');
    res.redirect('/');
  }
});

router.post('/', requireLogin, async (req, res) => {
  try {
    const { productId, quantity, addOns = [] } = req.body;
    const qty = parseInt(quantity) || 1;
    const selectedIds = Array.isArray(addOns) ? addOns : [addOns];

    const product = await Product.findById(productId);
    if (!product) {
      setFlash(req, 'danger', 'Product was not found.');
      return res.redirect('/');
    }

    if (product.stock < qty) {
      setFlash(req, 'danger', 'Not enough stock available.');
      return res.redirect('/');
    }

    const selectedProducts = canHaveAddons(product) && selectedIds.length
      ? await Product.find({
          _id: { $in: selectedIds }
        })
      : [];

    const selectedAddOns = selectedProducts.map(item => ({
      product: item._id,
      name: item.name,
      price: item.price,
      imageUrl: imageFor(item)
    }));

    const addOnsTotal = selectedAddOns.reduce((sum, item) => sum + item.price, 0);
    const totalPrice = (product.price + addOnsTotal) * qty;

    const orderLine = {
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: qty,
      imageUrl: imageFor(product),
      addOns: selectedAddOns,
      lineTotal: totalPrice
    };

    await createGroupedOrder(req.orderUserId, [orderLine], totalPrice);
    product.stock -= qty;
    await product.save();

    setFlash(req, 'success', 'Order placed successfully.');
    res.redirect('/orders');
  } catch (err) {
    console.error(" Error placing order:", err);
    setFlash(req, 'danger', 'Order could not be placed.');
    res.redirect('/');
  }
});

router.post('/:id/delete', requireLogin, async (req, res) => {
  try {
    await Order.findOneAndDelete({
      _id: req.params.id,
      user: req.orderUserId
    });
    setFlash(req, 'success', 'Order deleted successfully.');
    res.redirect('/orders');
  } catch (err) {
    console.error(" Error deleting order:", err);
    setFlash(req, 'danger', 'Order could not be deleted.');
    res.redirect('/orders');
  }
});

router.post('/:id/pay', requireLogin, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.orderUserId
    }).populate('product').populate('items.product');
    if (!order) {
      setFlash(req, 'danger', 'Order was not found.');
      return res.redirect('/orders');
    }

    res.render('payment', { order, orderItems: orderItems(order) });
  } catch (err) {
    console.error(" Error showing payment page:", err);
    setFlash(req, 'danger', 'Payment page could not be loaded.');
    res.redirect('/orders');
  }
});

router.post('/:id/confirm', requireLogin, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.orderUserId
    });
    if (!order) {
      setFlash(req, 'danger', 'Order was not found.');
      return res.redirect('/orders');
    }

    order.status = "Paid";
    await order.save();

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
      user: req.orderUserId
    }).populate('product').populate('items.product');

    if (!order) {
      setFlash(req, 'danger', 'Receipt was not found.');
      return res.redirect('/orders');
    }

    res.render('receipt', { order, orderItems: orderItems(order) });
  } catch (err) {
    console.error(" Error loading receipt:", err);
    setFlash(req, 'danger', 'Receipt could not be loaded.');
    res.redirect('/orders');
  }
});

router.get('/:id/receipt/download', requireLogin, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.orderUserId
    }).populate('product').populate('items.product');

    if (!order || order.status !== 'Paid') {
      setFlash(req, 'danger', 'Receipt download is only available after payment.');
      return res.redirect('/orders');
    }

    const lines = orderItems(order);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.attachment(`sharvins-receipt-${String(order._id).slice(-8)}.html`);
    res.send(receiptHtml(order, lines));
  } catch (err) {
    console.error(" Error downloading receipt:", err);
    setFlash(req, 'danger', 'Receipt could not be downloaded.');
    res.redirect('/orders');
  }
});

module.exports = router;
