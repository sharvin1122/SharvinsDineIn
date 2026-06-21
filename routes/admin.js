// routes/admin.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const Product = require('../models/product'); // Make sure path is correct
const Order = require('../models/Order');

// Configure multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.perms !== 'admin') {
    return res.redirect('/login');
  }

  next();
}

function setFlash(req, type, message) {
    req.session.flash = { type, message };
}

// Render admin dashboard
router.get('/', requireAdmin, async (req, res) => {
    try {
        const [items, orders] = await Promise.all([
            Product.find().sort({ createdAt: -1 }),
            Order.find().populate('product').populate('user').sort({ createdAt: -1 })
        ]);

        const stats = {
            totalProducts: items.length,
            totalOrders: orders.length,
            pendingOrders: orders.filter(order => order.status === 'Pending').length,
            paidOrders: orders.filter(order => order.status === 'Paid').length,
            totalSales: orders
                .filter(order => ['Paid', 'Preparing', 'Ready', 'Completed'].includes(order.status))
                .reduce((sum, order) => sum + order.totalPrice, 0)
        };

        res.render('dashboard', { items, orders, stats, message: null });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Handle add product
router.post('/add', requireAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, category, price, stock } = req.body;

        // Create new product
        const newProduct = new Product({
            name,
            category,
            price,
            stock,
            imageString: req.file ? req.file.buffer.toString('base64') : null
        });

        await newProduct.save();
        setFlash(req, 'success', 'Product added successfully.');
        res.redirect('/admin'); // go back to dashboard
    } catch (err) {
        console.error('Error saving product:', err);
        setFlash(req, 'danger', 'Product could not be added.');
        res.redirect('/admin');
    }
});

router.post('/delete/:id', requireAdmin, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        setFlash(req, 'success', 'Product deleted successfully.');
        res.redirect('/admin');
    } catch (err) {
        console.error('Error deleting product:', err);
        setFlash(req, 'danger', 'Product could not be deleted.');
        res.redirect('/admin');
    }
});

router.post('/edit/:id', requireAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, category, price, stock } = req.body;
        const updateData = {
            name,
            category,
            price,
            stock
        };

        if (req.file) {
            updateData.imageString = req.file.buffer.toString('base64');
        }

        await Product.findByIdAndUpdate(req.params.id, updateData, { runValidators: true });
        setFlash(req, 'success', 'Product updated successfully.');
        res.redirect('/admin');
    } catch (err) {
        console.error('Error updating product:', err);
        setFlash(req, 'danger', 'Product could not be updated.');
        res.redirect('/admin');
    }
});

router.post('/orders/:id/status', requireAdmin, async (req, res) => {
    try {
        const allowedStatuses = ['Pending', 'Paid', 'Preparing', 'Ready', 'Completed', 'Canceled'];
        const { status } = req.body;

        if (!allowedStatuses.includes(status)) {
            setFlash(req, 'danger', 'Invalid order status.');
            return res.redirect('/admin');
        }

        await Order.findByIdAndUpdate(req.params.id, { status });
        setFlash(req, 'success', 'Order status updated successfully.');
        res.redirect('/admin');
    } catch (err) {
        console.error('Error updating order status:', err);
        setFlash(req, 'danger', 'Order status could not be updated.');
        res.redirect('/admin');
    }
});

module.exports = router;
