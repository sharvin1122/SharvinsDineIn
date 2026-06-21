# Sharvin's Dine In

A full-stack restaurant ordering and management web application built with Node.js, Express, MongoDB, EJS, and Bootstrap.

The platform allows customers to browse menu items, place orders, view receipts, and manage their accounts, while administrators can manage products, inventory, and customer orders through a secure dashboard.

---

## Live Features

### Customer Features

* User registration and login
* Browse restaurant menu
* Search products
* Filter by category
* Add items to order
* View order history
* Payment confirmation page
* Receipt generation
* Responsive user interface

### Admin Features

* Secure admin authentication
* Product management (Create, Read, Update, Delete)
* Product image upload
* Stock management
* View all customer orders
* Update order statuses
* Dashboard overview

---

## Screenshots

### Home Page

Add screenshot here

### Menu Page

Add screenshot here

### Admin Dashboard

Add screenshot here

### Order Management

Add screenshot here

---

## Why I Built This Project

This project was developed as part of my Full Stack Web Development learning journey.

The goal was to create a real-world restaurant management application that combines customer ordering functionality with administrative inventory and order management.

During development, I gained practical experience with:

* Authentication and authorization
* Session management
* MongoDB database design
* REST-style routing
* File uploads using Multer
* CRUD operations
* MVC-inspired project structure
* Deployment preparation

---

## Technology Stack

### Backend

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose

### Frontend

* EJS
* Bootstrap 5
* JavaScript

### Additional Packages

* bcryptjs
* express-session
* multer
* dotenv

---

## API Endpoints

| Method | Endpoint       | Description               |
| ------ | -------------- | ------------------------- |
| GET    | /api/health    | API health check          |
| GET    | /api/products  | Get all products          |
| GET    | /api/my-orders | Get current user's orders |
| GET    | /api/orders    | Get all orders (Admin)    |

---

## Project Structure

```text
models/        Database models
routes/        Application routes
middleware/    Authentication middleware
views/         EJS templates
public/        Static assets
server.js      Application entry point
```

---

## Installation

Clone the repository:

```bash
git clone <repository-url>
cd sharvins-dine-in
```

Install dependencies:

```bash
npm install
```

Create a .env file:

```env
MONGO_URI=your-mongodb-uri
SESSION_SECRET=your-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-password
HOST=0.0.0.0
PORT=3001
```

Start the application:

```bash
npm start
```

Open:

```text
http://localhost:3001
```

---

## Deployment

The application can be deployed using Render.

### Build Command

```text
npm install
```

### Start Command

```text
npm start
```

Required environment variables:

```text
MONGO_URI
SESSION_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD
HOST
PORT
```

---

## Future Improvements

* Table reservation system
* Email notifications
* Online payment integration
* Loyalty rewards system
* Analytics dashboard
* Real-time order tracking
* Docker support

---

## Security

Sensitive information is stored using environment variables.

Never commit:

```text
.env
node_modules/
```

to GitHub.

---

## Author

Sharvin Puskar Pritvising Chamoo

Full Stack Web Developer

This project was built to strengthen my skills in backend development, database management, authentication, and full-stack web application architecture.
