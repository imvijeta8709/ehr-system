# EHR System — MERN Stack

## Project Structure

```
ehr-system/
├── backend/
│   ├── controllers/     # Business logic
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes
│   ├── middleware/       # Auth, upload
│   ├── utils/           # Mailer
│   ├── uploads/         # File storage (auto-created)
│   ├── server.js
│   └── .env.example
└── frontend/
    └── src/
        ├── context/     # AuthContext
        ├── pages/       # All page components
        ├── components/  # Layout, Spinner, Pagination
        └── utils/       # Axios instance
```

## Setup & Run

### 1. Backend

```bash
cd ehr-system/backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

### 2. Frontend

```bash
cd ehr-system/frontend
npm install
npm start
```

Frontend runs on http://localhost:3000, backend on http://localhost:5000.

## Default Roles

| Role    | Access                                      |
|---------|---------------------------------------------|
| admin   | Full access — all patients, records, users  |
| doctor  | Manage patients, records, appointments      |
| patient | View own records, book/cancel appointments  |

## API Endpoints

| Method | Endpoint                    | Access         |
|--------|-----------------------------|----------------|
| POST   | /api/auth/register          | Public         |
| POST   | /api/auth/login             | Public         |
| GET    | /api/auth/me                | Authenticated  |
| GET    | /api/users/patients         | Admin, Doctor  |
| GET    | /api/users/doctors          | Authenticated  |
| GET    | /api/users/stats            | Admin, Doctor  |
| PUT    | /api/users/:id              | Self or Admin  |
| GET    | /api/records                | Authenticated  |
| POST   | /api/records                | Admin, Doctor  |
| GET    | /api/records/:id            | Authenticated  |
| PUT    | /api/records/:id            | Admin, Doctor  |
| GET    | /api/appointments           | Authenticated  |
| POST   | /api/appointments           | Authenticated  |
| PUT    | /api/appointments/:id       | Authenticated  |
| GET    | /api/appointments/stats     | Admin, Doctor  |

## Email Notifications (Optional)

Set `EMAIL_*` vars in `.env` to enable welcome emails via Nodemailer.
