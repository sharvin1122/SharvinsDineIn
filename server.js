require('dotenv').config();
const express = require('express');
const session = require('express-session');
const connectMongo = require('connect-mongo');
const path = require('path');
const connectDB = require('./db');
connectDB();
const server = express();

const homeRouter = require('./routes/home');
const adminRouter = require('./routes/admin');
const aboutRouter = require('./routes/about');
const ordersRouter = require('./routes/orders');
const authRouter = require('./routes/auth');
const apiRouter = require('./routes/api');
const MongoStore = connectMongo.MongoStore || connectMongo.default || connectMongo;

server.use(express.urlencoded({ extended: true, limit: '1mb' })); 
server.use(express.json({ limit: '1mb' }));
server.set('trust proxy', 1);

server.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

const sessionSecret = process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? null : 'local-dev-session-secret');

if (!sessionSecret) {
  throw new Error('SESSION_SECRET is required in production.');
}

const sessionOptions = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 // 1 hour
  }
};

if (process.env.MONGO_URI) {
  sessionOptions.store = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions'
  });
}

server.use(session(sessionOptions));

server.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

function logger(req, res, next) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${req.method} ${req.url}`);
  }
  next();
}
server.use(logger);

const oldImagePaths = {
  'cappuccino.jpg': 'coffee/cappuccino.jpg',
  'chocoicecream.jpg': 'dessert/chocoicecream.jpg',
  'coca.jpg': 'drinks/coca.jpg',
  'fanta.jpg': 'drinks/fanta.jpg',
  'sprite.jpg': 'drinks/sprite.jpg',
  'salad.jpg': 'main/salad.jpg',
  'crispy-fried-chicken.jpg': 'sides/crispy-fried-chicken.jpg',
  'fries.jpg': 'sides/fries.jpg',
  'nuggets.jpg': 'sides/nuggets.jpg',
  '1784727055103-americano.jpg': 'coffee/1784727055103-americano.jpg',
  '1784727135614-latte.jpg': 'coffee/1784727135614-latte.jpg',
  '1784727207031-macchiatto.jpg': 'coffee/1784727207031-macchiatto.jpg',
  '1784727268419-icedcaramel.jpg': 'coffee/1784727268419-icedcaramel.jpg',
  '1784727321500-chocomilkshake.jpg': 'drinks/1784727321500-chocomilkshake.jpg',
  '1784727673143-vanillamilkshake.jpg': 'drinks/1784727673143-vanillamilkshake.jpg',
  '1784727727728-virginmojito.jpg': 'drinks/1784727727728-virginmojito.jpg',
  '1784727358713-chocomousse.jpg': 'dessert/1784727358713-chocomousse.jpg',
  '1784727507862-cremebrule.jpg': 'dessert/1784727507862-cremebrule.jpg',
  '1784727589070-tiramisu.jpg': 'dessert/1784727589070-tiramisu.jpg',
  '1784727634138-vanillaicecream.jpg': 'dessert/1784727634138-vanillaicecream.jpg'
};

// Keeps older menu image links working after moving files into folders.
server.get('/images/:fileName', (req, res, next) => {
  const newPath = oldImagePaths[req.params.fileName];

  if (!newPath) {
    return next();
  }

  res.sendFile(path.join(__dirname, 'public', 'images', newPath));
});

server.get('/images/uploads/:fileName', (req, res, next) => {
  const newPath = oldImagePaths[req.params.fileName];

  if (!newPath) {
    return next();
  }

  res.sendFile(path.join(__dirname, 'public', 'images', newPath));
});

server.use(express.static(path.join(__dirname, 'public')));
server.set('view engine', 'ejs');
server.set('views', path.join(__dirname, 'views'));

server.use('', homeRouter);
server.use('', authRouter);
server.use('/api', apiRouter);
server.use('/admin', adminRouter);
server.use('/orders', ordersRouter);
server.use('/about', aboutRouter);

server.use((err, req, res, next) => {
  console.error(err);

  const status = err.status || 500;
  const title = status === 403 ? 'Access not allowed' : 'Something went wrong';
  const message = status === 403
    ? 'You do not have permission to open this page.'
    : 'The page could not be loaded right now. Please try again in a moment.';

  if (req.originalUrl.startsWith('/api')) {
    return res.status(status).json({ error: message });
  }

  res.status(status).render('error', { status, title, message });
});

server.use((req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ error: 'Route not found' });
  }

  res.status(404).render('error', {
    status: 404,
    title: 'Page not found',
    message: 'The page you are looking for may have been moved or does not exist.'
  });
});

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

const listener = server.listen(PORT, HOST, () => {
  const localUrl = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
  console.log(`Server running on ${localUrl}`);
});

listener.on('error', (err) => {
  console.error('Server startup error:', err.message);
});
