const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const pool = require('../db');

// Get courses for logged-in student
router.get('/my', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.name as professor_name,
        (SELECT COUNT(*) FROM enrolled_courses WHERE course_id = c.id) as student_count,
        (SELECT COUNT(*) FROM assignments WHERE course_id = c.id) as assignment_count
       FROM courses c
       JOIN enrolled_courses ec ON ec.course_id = c.id
       JOIN users u ON u.id = c.created_by
       WHERE ec.user_id = $1`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get courses taught by professor
router.get('/teaching', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM enrolled_courses WHERE course_id = c.id) as student_count,
        (SELECT COUNT(*) FROM assignments WHERE course_id = c.id) as assignment_count,
        (SELECT COUNT(*) FROM submissions s
          JOIN assignments a ON a.id = s.assignment_id
          WHERE a.course_id = c.id) as submission_count
       FROM courses c
       WHERE c.created_by = $1`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create course (professor only)
router.post('/', verifyToken, async (req, res) => {
  const { title, description, studentEmails } = req.body;
  try {
    const course = await pool.query(
      `INSERT INTO courses (title, description, created_by) VALUES ($1, $2, $3) RETURNING *`,
      [title, description, req.user.id]
    );
    const courseId = course.rows[0].id;
    // Auto-enroll students
    if (studentEmails?.length) {
      for (const email of studentEmails) {
        const user = await pool.query(`SELECT id FROM users WHERE email = $1 AND role = 'STUDENT'`, [email]);
        if (user.rows[0]) {
          await pool.query(
            `INSERT INTO enrolled_courses (course_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [courseId, user.rows[0].id]
          );
        }
      }
    }
    res.json(course.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add students to existing course
router.patch('/:id/students', verifyToken, async (req, res) => {
  const { studentEmails } = req.body;
  const courseId = req.params.id;
  try {
    if (studentEmails?.length) {
      for (const email of studentEmails) {
        const user = await pool.query(
          `SELECT id FROM users WHERE email = $1 AND role = 'STUDENT'`, [email]
        );
        if (user.rows[0]) {
          await pool.query(
            `INSERT INTO enrolled_courses (course_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [courseId, user.rows[0].id]
          );
        }
      }
    }
    res.json({ message: 'Students updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit enrolled students
router.patch('/:id/students', verifyToken, async (req, res) => {
  const { studentEmails } = req.body;
  const courseId = req.params.id;
  try {
    if (studentEmails?.length) {
      for (const email of studentEmails) {
        const user = await pool.query(
          `SELECT id FROM users WHERE email = $1 AND role = 'STUDENT'`, [email]
        );
        if (user.rows[0]) {
          await pool.query(
            `INSERT INTO enrolled_courses (course_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [courseId, user.rows[0].id]
          );
        }
      }
    }
    res.json({ msg: 'Students updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;