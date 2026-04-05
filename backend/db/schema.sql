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
    UNIQUE(assignment_id, group_id)
);