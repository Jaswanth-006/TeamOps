# TeamOps Backend

Express API server for TeamOps.

## Getting started

```bash
npm install
npm run dev
```

The server runs at `http://localhost:5000`.

## Structure

```
backend/
├── configs/        # database, mail, and credential configuration
├── controllers/    # request handlers (business logic)
├── middlewares/    # auth and cross-cutting request handling
├── routes/         # route definitions mapped to controllers
├── prisma/         # database schema, migrations, and seed
└── server.js       # application entry point
```
