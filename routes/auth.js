const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/user');

function setFlash(req, type, message) {
  req.session.flash = { type, message };
}

function loginPageData(error = null) {
  return {
    error,
    demoAdmin: {
      email: process.env.ADMIN_EMAIL || 'demo.admin@sharvinsdinein.com',
      password: process.env.ADMIN_PASSWORD || 'DemoAdmin123!'
    }
  };
}

router.get('/login', (req, res) => {
  res.render('login', loginPageData());
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      req.session.user = {
        id: 'admin',
        email,
        full_name: 'Admin',
        perms: 'admin'
      };

      return res.redirect('/admin');
    }

    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password || ''))) {
      return res.render('login', loginPageData('Invalid email or password'));
    }

    req.session.user = {
      id: String(user._id),
      email: user.email,
      full_name: user.full_name,
      perms: 'user'
    };

    setFlash(req, 'success', 'Welcome back.');
    res.redirect('/');
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', loginPageData('Unable to login right now'));
  }
});

router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.render('register', { error: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      full_name,
      email,
      password: hashedPassword,
      perms: 'user'
    });

    req.session.user = {
      id: String(user._id),
      email: user.email,
      full_name: user.full_name,
      perms: 'user'
    };

    setFlash(req, 'success', 'Account created successfully.');
    res.redirect('/');
  } catch (err) {
    console.error('Registration error:', err);
    res.render('register', { error: 'Unable to create account right now' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
