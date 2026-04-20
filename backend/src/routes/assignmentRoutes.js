const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const pool = require('../db');

const ctrl = require('../controllers/assignmentController');

router.post('/', verifyToken, ctrl.createAssignment);
router.get('/', verifyToken, ctrl.getAssignments);

// Get assignments for a course
router.get('/', verifyToken, async (req, res) => {
  const { course_id } = req.query;
  try {
    let query = `SELECT a.*, u.name as professor_name FROM assignments a JOIN users u ON u.id = a.created_by`;
    const params = [];
    if (course_id) {
      query += ` WHERE a.course_id = $1`;
      params.push(course_id);
    }
    query += ` ORDER BY a.due_date ASC`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create assignment
router.post('/', verifyToken, async (req, res) => {
  const { title, description, due_date, onedrive_link, course_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO assignments (title, description, due_date, onedrive_link, created_by, course_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description, due_date, onedrive_link, req.user.id, course_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get assignment submission analytics (professor)
router.get('/:id/analytics', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const assignment = await pool.query(`SELECT * FROM assignments WHERE id = $1`, [id]);
    const total = await pool.query(
      `SELECT COUNT(DISTINCT gm.user_id) as total
       FROM enrolled_courses ec
       JOIN assignments a ON a.course_id = ec.course_id
       WHERE a.id = $1`, [id]
    );
    const submitted = await pool.query(
      `SELECT COUNT(DISTINCT s.confirmed_by) as submitted FROM submissions s WHERE s.assignment_id = $1`, [id]
    );
    const acknowledged = await pool.query(
      `SELECT COUNT(*) as acknowledged FROM submissions WHERE assignment_id = $1 AND acknowledged = TRUE`, [id]
    );
    res.json({
      assignment: assignment.rows[0],
      total: parseInt(total.rows[0]?.total || 0),
      submitted: parseInt(submitted.rows[0]?.submitted || 0),
      acknowledged: parseInt(acknowledged.rows[0]?.acknowledged || 0),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;