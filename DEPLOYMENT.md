# Deployment Guide

This project can be deployed on Render.

## Render Settings

Build command:

```text
npm install
```

Start command:

```text
npm start
```

## Environment Variables

Add these in the Render dashboard:

```text
MONGO_URI=your MongoDB Atlas connection string
SESSION_SECRET=a long random session secret
ADMIN_EMAIL=demo.admin@sharvinsdinein.com
ADMIN_PASSWORD=DemoAdmin123!
HOST=0.0.0.0
```

Render provides `PORT` automatically, so it does not need to be added manually.

## Before Deploying

* Make sure `.env` is not pushed to GitHub.
* Use a MongoDB Atlas connection string from your own database.
* Keep only test data in the demo admin account.
* Do not use real personal or payment information in the live demo.

## Quick Test After Deployment

* Open the live site.
* Fill the demo admin login from the login page.
* Open the admin dashboard.
* Check products, orders, sales, and reviews.
* Register a customer account and place one test order.
