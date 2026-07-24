# Sharvin's Dine In

Sharvin's Dine In is a full-stack restaurant ordering web app built with Node.js, Express, MongoDB, EJS, Bootstrap, and JavaScript.

The project has a customer side for browsing the menu, building an order, paying, and downloading a receipt. It also has an admin dashboard for managing products, orders, sales, and customer reviews.

## Live Demo

https://sharvinsdinein.onrender.com/

## Main Features

### Customers

* Register and log in
* Browse the menu by category
* Add mains, combo meals, sides, drinks, coffee, and desserts to the cart
* Choose add-ons for main items and combo meals
* Add an order comment before placing the final order
* Complete a simulated payment
* Download a receipt
* Leave a review with a rating
* Use the app on desktop and mobile

### Admin

* Demo admin login for project review
* Create, edit, and delete products
* Upload product images from the admin dashboard
* Manage product categories and stock
* View active orders
* View paid and completed orders
* Update order status
* Track daily, monthly, yearly, and total sales
* View and delete customer reviews

## Demo Access

The login page includes demo access for recruiters.

```text
Email: demo.admin@sharvinsdinein.com
Password: DemoAdmin123!
```

This account is only for test data. Do not enter real personal information or real payment details when reviewing the project.

Guest users can also register from the app to test the customer ordering flow.

## Tech Stack

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose
* EJS
* Bootstrap 5
* JavaScript
* bcryptjs
* express-session
* connect-mongo
* multer
* dotenv

## Project Structure

```text
models/              MongoDB models
routes/              Express routes
views/               EJS pages and partials
public/css/          Stylesheets
public/images/       Logo and menu images
server.js            App entry point
db.js                MongoDB connection
```

Menu images are organised by category:

```text
public/images/main/
public/images/combo-meals/
public/images/sides/
public/images/drinks/
public/images/coffee/
public/images/dessert/
```

## Local Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root:

```env
MONGO_URI=your-mongodb-connection-string
SESSION_SECRET=your-long-session-secret
ADMIN_EMAIL=demo.admin@sharvinsdinein.com
ADMIN_PASSWORD=DemoAdmin123!
HOST=127.0.0.1
PORT=3001
```

Start the app:

```bash
npm start
```

Open the app:

```text
http://localhost:3001
```

## Deployment

This project is ready to deploy on Render or another Node.js hosting platform.

Build command:

```text
npm install
```

Start command:

```text
npm start
```

Environment variables needed on the hosting platform:

```text
MONGO_URI
SESSION_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD
```

Do not upload `.env` to GitHub. Add the environment variables inside the hosting platform dashboard instead.

## API Routes

| Method | Route          | Purpose |
| ------ | -------------- | ------- |
| GET    | `/api/health`  | Check if the API is running |
| GET    | `/api/products` | Get menu products |
| GET    | `/api/my-orders` | Get orders for the logged-in user |
| GET    | `/api/orders` | Get all orders as admin |

## Security Notes

* Real database credentials must stay inside `.env` or the hosting platform environment settings.
* `.env` is ignored by Git.
* Sessions are stored in MongoDB when `MONGO_URI` is set.
* The demo admin credentials are for project review only.
* The project does not collect real payment details.

## Author

Puskar Pritvising Chamoo
