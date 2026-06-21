// import libraries
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const connectDB = require('./db');
connectDB();
const server = express();  //create server instance

// ===== Import Routers =====
const homeRouter = require('./routes/home');
const adminRouter = require('./routes/admin');
const aboutRouter = require('./routes/about');
const ordersRouter = require('./routes/orders');
const authRouter = require('./routes/auth');
const apiRouter = require('./routes/api');



// ===== Body Parsing =====
server.use(express.urlencoded({ extended: true })); 
server.use(express.json());

// ===== Session Middleware =====
server.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    httpOnly: true,
    secure: false, // set to true if using HTTPS
    maxAge: 1000 * 60 * 60 // 1 hour
  }
}));

// Make session user available in all views
server.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});



// ===== Logger Middleware =====
function logger(req, res, next) {
  console.log(`${req.method} ${req.url}`);
  next();
}
server.use(logger);

// ===== Static Files & Views =====
server.use(express.static(path.join(__dirname, 'public')));
server.set('view engine', 'ejs');
server.set('views', path.join(__dirname, 'views'));



// Protect other routes
server.use('',homeRouter);
server.use('', authRouter);
server.use('/api', apiRouter);
server.use('/admin', adminRouter);
server.use('/orders', ordersRouter);
server.use('/about', aboutRouter);

// ===== Not Found Handler =====
server.use((req, res) => {
  res.status(404).send('404 Not Found!');
});

// ===== Error Handler =====
// server.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).send('Something went wrong!');
// });

// ===== Start the Server =====
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

const listener = server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

listener.on('error', (err) => {
  console.error('Server startup error:', err.message);
});
