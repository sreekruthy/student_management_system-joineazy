# Student Management System

## Overview

This is a full-stack web application that enables:
* Students to form groups, join members and submit assignments
* Professors to create assignments and track submissions
* Group-based progress tracking for collaborative work

The system ensures structured assignment workflows with real-time tracking of group performance and submissions.


## Features

### Student

* Register and login
* Create groups
* Add members via email
* View assignments
* Access OneDrive submission links
* Confirm submissions (with two-step verification)
* Track group progress via progress bars

### Professor

* Create assignments
* View submissions
* Track group performance
* View total submissions


## Tech Stack

### Frontend

* React (Vite)
* Tailwind CSS
* Axios

### Backend

* Node.js
* Express.js
* JWT Authentication

### Database

* PostgreSQL


## Setup & Run Instructions

1. Clone Repository

git clone <repo-link>
cd student_management_system

2. Backend Setup

cd backend
npm install


Create .env file:
PORT=5001
DATABASE_URL=postgresql://postgres:password@localhost:5433/student_prof_db
JWT_SECRET=secret_key

Run backend:
npm run dev

3. Frontend Setup

cd frontend
npm install --legacy-peer-deps
npm run dev

4. PostgreSQL Setup

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(10) CHECK (role IN ('STUDENT', 'ADMIN')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    group_name VARCHAR(100),
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE group_members (
    id SERIAL PRIMARY KEY,
    group_id INT REFERENCES groups(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(group_id, user_id)
);

CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    description TEXT,
    due_date DATE,
    onedrive_link TEXT,
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INT REFERENCES assignments(id),
    group_id INT REFERENCES groups(id),
    confirmed_by INT REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'CONFIRMED',
    confirmed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assignment_id, group_id, confirmed_by)
);



## API Endpoints

### Auth
 Method  Endpoint              Description   
 POST    /api/auth/register  Register user 
 POST    /api/auth/login     Login user    

### Groups
 Method  Endpoint           Description         
 POST    /api/groups      Create group        
 POST    /api/groups/add  Add member by email 
 GET     /api/groups/my   Get user's group    

### Assignments
 Method  Endpoint            Description         
 POST    /api/assignments  Create assignment   
 GET     /api/assignments  Get all assignments 

### Submissions
 Method  Endpoint                               Description         
 POST    /api/submissions/confirm             Confirm submission  
 GET     /api/submissions                     Get all submissions 
 GET     /api/submissions/progress?group_id=  Group progress      

---

## Database Schema & Relationships

### Relationships

![ER Diagram](images/er.png)


## Architecture Overview

### Flow
1. User logs in - JWT generated
2. Frontend stores token - sends with API requests
3. Backend verifies token - attaches req.user
4. API interacts with PostgreSQL
5. Response sent back - UI updates


## Key Design Decisions

1. JWT Authentication
* Stateless authentication
* Secure API communication

2. Group-Based Submission Model
* Supports collaborative assignments
* Tracks per-member submission

3. Relational Database (PostgreSQL)
* Strong data integrity
* Supports relationships & constraints

4. Modular Backend
* Controllers, routes, middleware separation

5. Tailwind CSS
* Fast UI development
* Responsive design


## Deployment Notes

* The application is containerized using Docker to ensure consistent environments.
* Docker Compose is used to manage multiple services: frontend, backend, and PostgreSQL database.
* Services communicate using container names (e.g., backend, postgres) instead of localhost.
* Environment variables (.env) are used for database credentials and configuration.
* PostgreSQL is deployed in a container with a volume for persistent data storage.
* The frontend is built using npm run build and served as static files.
* Ports are mapped for access: frontend (3001), backend (5001), database (5433).


## ⭐ Conclusion

This project demonstrates:

* Full-stack development
* Database design
* API architecture
* Real-world system implementation

---
