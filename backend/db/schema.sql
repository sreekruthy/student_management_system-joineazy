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

-- Add courses table
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enroll students in courses
CREATE TABLE enrolled_courses (
  id SERIAL PRIMARY KEY,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(course_id, user_id)
);

-- Link assignments to courses
ALTER TABLE assignments ADD COLUMN course_id INT REFERENCES courses(id);

-- Track group leader
ALTER TABLE groups ADD COLUMN leader_id INT REFERENCES users(id);
-- Set existing groups' leader to creator
UPDATE groups SET leader_id = created_by WHERE leader_id IS NULL;

-- Add acknowledgment tracking
ALTER TABLE submissions ADD COLUMN acknowledged BOOLEAN DEFAULT FALSE;
ALTER TABLE submissions ADD COLUMN acknowledged_at TIMESTAMP;