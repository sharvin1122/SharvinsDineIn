# Deploy Sharvin's Dine In

## Recommended Host

Use Render for the easiest deployment.

## Build Settings

- Build command: `npm install`
- Start command: `npm start`

## Environment Variables

Set these on the hosting platform:

```text
MONGO_URI=your MongoDB Atlas connection string
SESSION_SECRET=a long random secret
ADMIN_EMAIL=your admin email
ADMIN_PASSWORD=your admin password
HOST=0.0.0.0
```

Do not upload your local `.env` file.

## API Endpoints

- `GET /api/health`
- `GET /api/products`
- `GET /api/my-orders` requires login
- `GET /api/orders` requires admin login

## Before Going Live

Change the MongoDB password that was previously written directly in the code.
