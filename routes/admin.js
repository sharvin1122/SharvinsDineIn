const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Product = require('../models/product');
const Order = require('../models/Order');
const Review = require('../models/Review');

const productCategories = ['Main', 'Combo & Meals', 'Sides', 'Drinks', 'Coffee', 'Dessert'];
const imageFolders = {
    Main: 'main',
    'Combo & Meals': 'combo-meals',
    Sides: 'sides',
    Drinks: 'drinks',
    Coffee: 'coffee',
    Dessert: 'dessert'
};

Object.values(imageFolders).forEach(folder => {
    const folderPath = path.join(__dirname, '..', 'public', 'images', folder);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
});

function imageFileName(file) {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const baseName = path.basename(file.originalname, ext)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    return `${Date.now()}-${baseName || 'product'}${ext}`;
}

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const category = cleanCategory(req.body.category, req.body.name || '');
            const folder = imageFolders[category] || 'main';
            cb(null, path.join(__dirname, '..', 'public', 'images', folder));
        },
        filename: (req, file, cb) => {
            const fileName = imageFileName(file);
            req.savedImagePath = fileName;
            cb(null, fileName);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Please upload an image file.'));
        }

        cb(null, true);
    }
});

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  if (req.session.user.perms !== 'admin') {
    return res.status(403).render('error', {
        status: 403,
        title: 'Access not allowed',
        message: 'This page is only available to the administrator.'
    });
  }

  next();
}

function setFlash(req, type, message) {
    req.session.flash = { type, message };
}

function isDemoAdmin(req) {
    return req.session.user?.id === 'admin'
        && req.session.user.email === process.env.ADMIN_EMAIL
        && process.env.ADMIN_EMAIL === 'demo.admin@sharvinsdinein.com';
}

function protectDemoAdmin(req, res, next) {
    if (isDemoAdmin(req)) {
        setFlash(req, 'warning', 'Demo access is read-only, so this action was not saved.');
        return res.redirect(req.get('Referrer') || '/admin');
    }

    next();
}

function cleanCategory(category, productName = '') {
    const name = productName.toLowerCase();

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

    if (category === 'Beverage') {
        return 'Drinks';
    }

    if (category === 'Food') {
        return 'Main';
    }

    if (category === 'Desserts') {
        return 'Dessert';
    }

    return productCategories.includes(category) ? category : 'Main';
}

function validProductInput(req) {
    const name = String(req.body.name || '').trim();
    const price = Number(req.body.price);
    const stock = Number(req.body.stock);

    if (name.length < 2) return 'Product name is required.';
    if (!Number.isFinite(price) || price < 0) return 'Product price must be a valid number.';
    if (!Number.isFinite(stock) || stock < 0) return 'Product stock must be a valid number.';

    return null;
}

router.get('/', requireAdmin, async (req, res) => {
    try {
        const [items, orders] = await Promise.all([
            Product.find().sort({ createdAt: -1 }),
            Order.find().populate('product').populate('items.product').populate('user').sort({ createdAt: -1 })
        ]);
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const salesStatuses = ['Paid', 'Preparing', 'Ready', 'Completed'];
        const salesOrders = orders.filter(order => salesStatuses.includes(order.status));
        const salesFrom = startDate => salesOrders
            .filter(order => order.createdAt && order.createdAt >= startDate)
            .reduce((sum, order) => sum + order.totalPrice, 0);
        const closedOrders = orders.filter(order => ['Paid', 'Preparing', 'Ready', 'Completed'].includes(order.status));
        const activeOrders = orders.filter(order => ['Pending', 'Canceled'].includes(order.status));

        const stats = {
            totalProducts: items.length,
            totalOrders: orders.length,
            pendingOrders: orders.filter(order => order.status === 'Pending').length,
            paidOrders: orders.filter(order => order.status === 'Paid').length,
            totalSales: salesOrders.reduce((sum, order) => sum + order.totalPrice, 0),
            dailySales: salesFrom(startOfDay),
            monthlySales: salesFrom(startOfMonth),
            yearlySales: salesFrom(startOfYear)
        };

        res.render('dashboard', { items, orders, activeOrders, closedOrders, stats, demoMode: isDemoAdmin(req) });
    } catch (err) {
        console.error(err);
        setFlash(req, 'danger', 'Dashboard could not be loaded.');
        res.redirect('/login');
    }
});

router.get('/reviews', requireAdmin, async (req, res) => {
    try {
        const reviews = await Review.find().populate('user').sort({ createdAt: -1 });
        res.render('admin-reviews', { reviews });
    } catch (err) {
        console.error('Error loading reviews:', err);
        setFlash(req, 'danger', 'Reviews could not be loaded.');
        res.redirect('/admin');
    }
});

router.post('/reviews/:id/delete', requireAdmin, protectDemoAdmin, async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id);
        setFlash(req, 'success', 'Review deleted successfully.');
        res.redirect('/admin/reviews');
    } catch (err) {
        console.error('Error deleting review:', err);
        setFlash(req, 'danger', 'Review could not be deleted.');
        res.redirect('/admin/reviews');
    }
});

router.post('/add', requireAdmin, protectDemoAdmin, upload.single('image'), async (req, res) => {
    try {
        const inputError = validProductInput(req);
        if (inputError) {
            setFlash(req, 'danger', inputError);
            return res.redirect('/admin');
        }

        const { name, category, price, stock } = req.body;
        const savedCategory = cleanCategory(category, name);
        const imageFolder = imageFolders[savedCategory] || 'main';

        const newProduct = new Product({
            name: name.trim(),
            category: savedCategory,
            price: Number(price),
            stock: Number(stock),
            imageUrl: req.file ? `/images/${imageFolder}/${req.file.filename}` : ''
        });

        await newProduct.save();
        setFlash(req, 'success', 'Product added successfully.');
        res.redirect('/admin');
    } catch (err) {
        console.error('Error saving product:', err);
        setFlash(req, 'danger', err.message || 'Product could not be added.');
        res.redirect('/admin');
    }
});

router.post('/delete/:id', requireAdmin, protectDemoAdmin, async (req, res) => {
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

router.post('/edit/:id', requireAdmin, protectDemoAdmin, upload.single('image'), async (req, res) => {
    try {
        const inputError = validProductInput(req);
        if (inputError) {
            setFlash(req, 'danger', inputError);
            return res.redirect('/admin');
        }

        const { name, category, price, stock } = req.body;
        const savedCategory = cleanCategory(category, name);
        const imageFolder = imageFolders[savedCategory] || 'main';
        const updateData = {
            name: name.trim(),
            category: savedCategory,
            price: Number(price),
            stock: Number(stock)
        };

        if (req.file) {
            updateData.imageUrl = `/images/${imageFolder}/${req.file.filename}`;
        }

        await Product.findByIdAndUpdate(req.params.id, updateData, { runValidators: true });
        setFlash(req, 'success', 'Product updated successfully.');
        res.redirect('/admin');
    } catch (err) {
        console.error('Error updating product:', err);
        setFlash(req, 'danger', err.message || 'Product could not be updated.');
        res.redirect('/admin');
    }
});

router.post('/orders/:id/status', requireAdmin, protectDemoAdmin, async (req, res) => {
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
