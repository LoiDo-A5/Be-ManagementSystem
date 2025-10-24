# BeToDoList API

Express + MySQL To-Do List API with JWT authentication.

## Features

- User registration and login
- JWT auth with protected routes
- CRUD for To-Do items per user
- Security middlewares: helmet, cors
- Logging via morgan

## Requirements

- Node.js 18+
- MySQL 8+

## Setup

1. Install dependencies

```bash
npm install
```

2. Create database and tables

```bash
mysql -u root -p < schema.sql
```

3. Create `.env` from example

```bash
cp .env.example .env
# edit .env values
```

4. Run in development

```bash
npm run dev
```

Server runs at `http://localhost:3000`

## API

### Auth

- POST `/api/auth/register`
  - body: `{ name, email, password }`
  - response: `{ user, token }`

- POST `/api/auth/login`
  - body: `{ email, password }`
  - response: `{ user, token }`

- GET `/api/auth/me` (Authorization: Bearer <token>)
  - response: `{ id, name, email }`

### Todos (protected)

Use header: `Authorization: Bearer <token>`

- GET `/api/todos`
- POST `/api/todos`
  - body: `{ title, description?, due_date?, completed? }`
- PUT `/api/todos/:id`
  - body: any of `{ title, description, due_date, completed }`
- DELETE `/api/todos/:id`

## Notes

- `due_date` expects an ISO datetime string or `YYYY-MM-DD HH:MM:SS`.
- Passwords are hashed with bcrypt.
- Tokens signed with `JWT_SECRET` and default expiry `7d`.
