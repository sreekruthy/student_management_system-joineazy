# Student Management System

A full-stack web application for group-based assignment management. Students can form groups, submit assignments, and track progress. Professors can create assignments, manage courses, and monitor submissions.

---

## Tech Stack

- **Frontend**: React (Vite) + Tailwind CSS + Axios — deployed on **Vercel**
- **Backend**: Node.js + Express.js + JWT — deployed on **Render** (Web Service)
- **Database**: PostgreSQL — deployed on **Render** (Managed Database)

---

## Features

### Student
- Register and login
- Create or join a group
- View assignments per course
- Access OneDrive submission links
- Confirm individual submissions
- Track group and individual progress via progress bars

### Professor (Admin)
- Create courses and enroll students by email
- Create assignments (group or individual) linked to courses
- View all submissions and group breakdowns
- Acknowledge member submissions
- Track analytics per assignment

---

## Project Structure

```
STUDENT_MANAGEMENT_SYSTEM/
├── backend/
│   ├── db/
│   │   └── schema.sql
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── assignmentController.js
│   │   │   ├── authController.js
│   │   │   ├── groupController.js
│   │   │   └── submissionController.js
│   │   ├── middleware/
│   │   │   └── authMiddleware.js
│   │   ├── routes/
│   │   │   ├── assignmentRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── courses.js
│   │   │   ├── groupRoutes.js
│   │   │   └── submissionRoutes.js
│   │   ├── app.js
│   │   └── db.js
│   ├── .env
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ui/
    │   │   │   ├── LoadingSpinner.jsx
    │   │   │   ├── ProgressBar.jsx
    │   │   │   └── StatusBadge.jsx
    │   │   ├── navbar.jsx
    │   │   └── submitbutton.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── admindashboard.jsx
    │   │   ├── group.jsx
    │   │   ├── login.jsx
    │   │   ├── register.jsx
    │   │   └── studentdashboard.jsx
    │   ├── routes/
    │   │   └── ProtectedRoute.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env.production
    └── package.json
```

---

## Component Architecture

### Frontend

The frontend is a React SPA built with Vite, organized into four layers.

**Pages** (`src/pages/`) are the top-level route components. `login.jsx` and `register.jsx` handle authentication forms and delegate to `AuthContext`. `studentdashboard.jsx` fetches the student's enrolled courses, assignments, and group progress, and renders the submission interface. `admindashboard.jsx` gives professors controls to create courses and assignments and view all submission data. `group.jsx` handles group creation and member management.

**Components** (`src/components/`) are reusable UI pieces. `navbar.jsx` reads the current user's role from `AuthContext` and conditionally shows the Admin or Student dashboard link. `submitbutton.jsx` is a self-contained button that manages its own loading/confirmed state and calls a parent-supplied `onConfirm` handler — it guards against double-submission. Under `components/ui/`, three stateless display components are used across both dashboards: `ProgressBar.jsx` (accepts `value`, `max`, `color`, and renders a percentage bar), `StatusBadge.jsx` (maps submission status strings to colored pill badges), and `LoadingSpinner.jsx` (a simple animated spinner with configurable size).

**Context** (`src/context/AuthContext.jsx`) is the single source of truth for authentication state. It persists the user object and token in `localStorage`, and exposes `login`, `register`, and `logout` functions. All components access auth state via the `useAuth()` hook rather than prop drilling.

**Services** (`src/services/api.js`) is a single Axios instance with the backend base URL configured from `VITE_API_URL`. It has two interceptors: one that attaches the JWT `Authorization` header to every outgoing request, and one that catches any `401` response, clears localStorage, and redirects to the login page.

**Routes** (`src/routes/ProtectedRoute.jsx`) wraps pages that require authentication. It checks for a valid user in context and optionally enforces a specific role (`STUDENT` or `ADMIN`), redirecting to `/` if either check fails.

---

### Backend

The backend is a Node.js/Express API organized into controllers, routes, and middleware.

**Entry point** — `server.js` loads environment variables and starts the HTTP server. `src/app.js` sets up CORS (restricted to `FRONTEND_URL`), JSON body parsing, and mounts all route groups under `/api`.

**Routes** (`src/routes/`) define HTTP endpoints and apply middleware. Each route file imports `verifyToken` from `authMiddleware` and applies it to protected endpoints before delegating to the appropriate controller function.

**Controllers** (`src/controllers/`) contain the business logic and all direct database interaction via the shared `pool` from `db.js`. `authController.js` handles registration (with input validation, bcrypt hashing, and duplicate email detection) and login (with timing-safe password checks). `groupController.js` manages group creation, member addition (leader-only), and group lookups. `assignmentController.js` handles assignment creation and retrieval, with optional course filtering. `submissionController.js` handles submission confirmation and progress calculation (not used directly by routes — submission logic lives in `submissionRoutes.js`).

**Middleware** (`src/middleware/authMiddleware.js`) exports a single `verifyToken` function that reads the `Authorization` header, verifies the JWT against `JWT_SECRET`, and attaches the decoded payload as `req.user`. It returns a `401` for missing, invalid, or expired tokens.

**Database** (`src/db.js`) exports a single `pg.Pool` instance. It connects using `DATABASE_URL` when set (production on Render), falling back to individual `DB_HOST`/`DB_USER`/`DB_PASSWORD` variables for local development. SSL is enabled when `DB_SSL=true`.

---

This project is deployed with three separate services: a PostgreSQL database on Render, a Node.js backend on Render, and a React frontend on Vercel.

### Step 1 — Deploy the Database on Render

1. Go to [https://render.com](https://render.com) and sign in.
2. Click **New → PostgreSQL**.
3. Fill in the details:
   - **Name**: `student-db`
   - **Database**: `student_prof_db`
   - **User**: leave as default or set your own
   - **Region**: choose the closest to you
4. Click **Create Database**.
5. Once created, go to the database's dashboard and copy the **External Database URL** — you'll need this for the backend.

#### Set Up the Schema

After the database is created, connect to it and run the schema. You can use any PostgreSQL client (e.g., psql, TablePlus, DBeaver).

```bash
psql <your-external-database-url> -f backend/db/schema.sql
```

---

### Step 2 — Deploy the Backend on Render

1. Push your project to a GitHub repository if you haven't already.
2. Go to [https://render.com](https://render.com) and click **New → Web Service**.
3. Connect your GitHub repository.
4. Configure the service:
   - **Name**: `student-backend`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Under **Environment Variables**, add the following:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | The External Database URL copied from Step 1 |
| `JWT_SECRET` | A long random secret string |
| `NODE_ENV` | `production` |
| `DB_SSL` | `true` |
| `FRONTEND_URL` | Your Vercel app URL (fill in after Step 3, then redeploy) |

6. Click **Create Web Service**. Render will build and deploy the backend.
7. Once deployed, copy the backend URL (e.g., `https://student-backend-xxxx.onrender.com`).

---

### Step 3 — Deploy the Frontend on Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign in.
2. Click **Add New → Project** and import your GitHub repository.
3. Set the **Root Directory** to `frontend`.
4. Under **Environment Variables**, add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://your-render-backend-url.onrender.com/api` |

5. Click **Deploy**. Vercel will build and host the frontend.
6. Once deployed, copy the Vercel URL (e.g., `https://your-app.vercel.app`).

---

### Step 4 — Connect Frontend URL to Backend (CORS)

1. Go back to your backend service on Render.
2. Update the `FRONTEND_URL` environment variable with your Vercel URL:
   ```
   FRONTEND_URL = https://your-app.vercel.app
   ```
3. Render will automatically redeploy the backend with the updated CORS origin.

> The backend's `app.js` uses `FRONTEND_URL` for CORS. Make sure the value matches exactly (no trailing slash).

---

### Step 5 — Update Frontend API Base URL

In `frontend/src/services/api.js`, the `baseURL` should point to your Render backend:

```js
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://your-render-backend-url.onrender.com/api',
});
```

If you set `VITE_API_URL` as a Vercel environment variable (Step 3), this is handled automatically. Verify the variable is set correctly in your Vercel project settings.

---

## Local Development Setup

### Prerequisites

- Node.js v18+
- PostgreSQL running locally (or use the Render DB with the external URL)

### Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5001
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5433/student_prof_db
JWT_SECRET=your_local_secret_key
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
DB_SSL=false
```

Run the backend:

```bash
npm run dev
```

### Database (Local)

If running PostgreSQL locally, create the database and apply the schema:

```bash
psql -U postgres -c "CREATE DATABASE student_prof_db;"
psql -U postgres -d student_prof_db -f backend/db/schema.sql
```

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
```

Create a `.env` file in the `frontend/` directory (for local dev):

```env
VITE_API_URL=http://localhost:5001/api
```

Run the frontend:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Database Schema

```sql
users           → id, name, email, password, role (STUDENT | ADMIN)
groups          → id, group_name, created_by, leader_id
group_members   → group_id, user_id
courses         → id, title, description, created_by
enrolled_courses→ course_id, user_id
assignments     → id, title, description, due_date, onedrive_link, course_id, type (group | individual)
submissions     → id, assignment_id, group_id, confirmed_by, status, acknowledged
```

Full schema is in `backend/db/schema.sql`.

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |

### Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/groups` | Create a group |
| POST | `/api/groups/add` | Add member by email (leader only) |
| GET | `/api/groups/my` | Get the current user's group |
| GET | `/api/groups` | Get all groups (admin only) |

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses/my` | Get courses the student is enrolled in |
| GET | `/api/courses/teaching` | Get courses taught by the professor |
| POST | `/api/courses` | Create a course with student enrollment |
| PATCH | `/api/courses/:id/students` | Add students to an existing course |

### Assignments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assignments` | Get all assignments (optionally filter by `?course_id=`) |
| POST | `/api/assignments` | Create an assignment |
| GET | `/api/assignments/:id/analytics` | Get submission analytics for an assignment |

### Submissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/submissions/confirm` | Confirm a submission |
| POST | `/api/submissions/acknowledge` | Acknowledge a member's submission (leader only) |
| GET | `/api/submissions/progress/group` | Group progress (`?group_id=`) |
| GET | `/api/submissions/progress/individual` | Individual progress |
| GET | `/api/submissions/breakdown/:assignment_id` | Per-member breakdown (`?group_id=`) |
| GET | `/api/submissions` | Get all submissions |

---

## Authentication

JWT tokens are issued on login/register and stored in `localStorage`. Every protected API request sends the token via the `Authorization: Bearer <token>` header. Tokens expire after 7 days. On a 401 response, the frontend clears local storage and redirects to the login page.

---

## Key Design Decisions

**JWT Authentication** — stateless, secure, and works seamlessly across Vercel (frontend) and Render (backend) deployments.

**Group-Based Submission Model** — each group member individually confirms their submission, giving professors visibility into per-member participation within a group.

**Course-Linked Assignments** — assignments are scoped to courses, and progress is calculated only for assignments in courses the student is enrolled in.

**Role-Based Access** — STUDENT and ADMIN roles control which dashboard is shown and which API routes are accessible. The `ProtectedRoute` component handles frontend route guarding.

---

## Environment Variables Reference

### Backend (Render)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string from Render |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `NODE_ENV` | Set to `production` |
| `DB_SSL` | Set to `true` for Render hosted DB |
| `FRONTEND_URL` | Your Vercel deployment URL (for CORS) |
| `PORT` | Optional, defaults to 5001 |

### Frontend (Vercel)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Full URL of your Render backend API (e.g., `https://xxx.onrender.com/api`) |



**My External Database URL:**
postgresql://student_prof_db_user:nZ6pCPZPQNljJvki2PjvK6Na4owcVa5q@dpg-d7jmkev7f7vs738un6i0-a.oregon-postgres.render.com/student_prof_db


**Student-backend URL:**
https://student-backend-0rky.onrender.com


**Frontend deployment URL:**
https://student-management-system-joineazy.vercel.app/



## Screenshots

### Login
![Login Page](images/login.png)

### Student Dashboard
![Student Dashboard](images/studentdashboard.png)

### Student — Course Assignments & Group Breakdown
![Student Assignments](images/student_assignment.png)

### Professor Dashboard
![Professor Dashboard](images/profdashboard.png)

### Professor — Course Assignments & Groups
![Professor Assignments](images/prof_assignment.png)