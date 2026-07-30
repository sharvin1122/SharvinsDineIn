const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/user');
const loginAttempts = new Map();

function setFlash(req, type, message) {
  req.session.flash = { type, message };
}

function cleanEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function validPassword(password) {
  return String(password || '').length >= 8
    && /[A-Z]/.test(password)
    && /[a-z]/.test(password)
    && /[0-9]/.test(password);
}

function attemptKey(req, email) {
  return `${req.ip || 'local'}:${email}`;
}

function isBlocked(req, email) {
  const attempt = loginAttempts.get(attemptKey(req, email));
  return attempt && attempt.lockUntil && attempt.lockUntil > Date.now();
}

function recordFailedLogin(req, email) {
  const key = attemptKey(req, email);
  const attempt = loginAttempts.get(key) || { count: 0, lockUntil: 0 };
  attempt.count += 1;
  attempt.lockUntil = attempt.count >= 5 ? Date.now() + 10 * 60 * 1000 : 0;
  loginAttempts.set(key, attempt);
}

function clearFailedLogin(req, email) {
  loginAttempts.delete(attemptKey(req, email));
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
    const email = cleanEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.render('login', loginPageData('Please enter your email and password.'));
    }

    if (isBlocked(req, email)) {
      return res.render('login', loginPageData('Too many invalid attempts. Please try again in 10 minutes.'));
    }

    if (email === cleanEmail(process.env.ADMIN_EMAIL) && password === process.env.ADMIN_PASSWORD) {
      clearFailedLogin(req, email);
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
      recordFailedLogin(req, email);
      return res.render('login', loginPageData('Invalid email or password'));
    }

    clearFailedLogin(req, email);
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

function requireUser(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  if (req.session.user.perms === 'admin') {
    return res.status(403).render('error', {
      status: 403,
      title: 'Access not allowed',
      message: 'The profile page is only available to customer accounts.'
    });
  }

  next();
}

router.post('/register', async (req, res) => {
  try {
    const full_name = String(req.body.full_name || '').trim();
    const email = cleanEmail(req.body.email);
    const password = String(req.body.password || '');

    if (full_name.length < 2) {
      return res.render('register', { error: 'Please enter your full name.' });
    }

    if (!email || !email.includes('@')) {
      return res.render('register', { error: 'Please enter a valid email address.' });
    }

    if (!validPassword(password)) {
      return res.render('register', { error: 'Password must be at least 8 characters and include uppercase, lowercase, and a number.' });
    }

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

router.get('/profile', requireUser, (req, res) => {
  res.render('profile', { error: null });
});

router.post('/profile', requireUser, async (req, res) => {
  try {
    const full_name = String(req.body.full_name || '').trim();
    const email = cleanEmail(req.body.email);

    if (full_name.length < 2) {
      return res.render('profile', { error: 'Please enter your full name.' });
    }

    if (!email || !email.includes('@')) {
      return res.render('profile', { error: 'Please enter a valid email address.' });
    }

    const existingUser = await User.findOne({
      email,
      _id: { $ne: req.session.user.id }
    });

    if (existingUser) {
      return res.render('profile', { error: 'That email is already used by another account.' });
    }

    await User.findByIdAndUpdate(req.session.user.id, { full_name, email }, { runValidators: true });

    req.session.user.full_name = full_name;
    req.session.user.email = email;
    setFlash(req, 'success', 'Profile updated successfully.');
    res.redirect('/profile');
  } catch (err) {
    console.error('Profile update error:', err);
    res.render('profile', { error: 'Profile could not be updated right now.' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
