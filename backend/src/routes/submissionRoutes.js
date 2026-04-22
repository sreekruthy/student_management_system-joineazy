const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const pool = require('../db');

// Confirm submission — only records for the individual who confirmed
router.post('/confirm', verifyToken, async (req, res) => {
  const { assignment_id, group_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO submissions (assignment_id, group_id, confirmed_by, status)
       VALUES ($1, $2, $3, 'CONFIRMED')
       ON CONFLICT (assignment_id, group_id, confirmed_by) DO UPDATE SET status = 'CONFIRMED'
       RETURNING *`,
      [assignment_id, group_id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Acknowledge — leader only; acknowledges ONE specific member's submission
router.post('/acknowledge', verifyToken, async (req, res) => {
  const { assignment_id, group_id, member_id } = req.body;
  try {
    const group = await pool.query(`SELECT leader_id FROM groups WHERE id = $1`, [group_id]);
    if (!group.rows[0] || group.rows[0].leader_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the group leader can acknowledge submissions' });
    }
    await pool.query(
      `UPDATE submissions
       SET acknowledged = TRUE, acknowledged_at = NOW()
       WHERE assignment_id = $1 AND group_id = $2 AND confirmed_by = $3`,
      [assignment_id, group_id, member_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GROUP PROGRESS (top-level)
// submitted = assignments where ALL members of the group submitted
// total = total group assignments in enrolled courses
router.get('/progress/group', verifyToken, async (req, res) => {
  const { group_id } = req.query;
  if (!group_id || group_id === 'undefined') {
    return res.status(400).json({ message: 'group_id is required' });
  }
  try {
    const memberCountRes = await pool.query(
      `SELECT COUNT(*) AS total FROM group_members WHERE group_id = $1`,
      [group_id]
    );
    const totalMembers = parseInt(memberCountRes.rows[0].total);

    const totalRes = await pool.query(
      `SELECT COUNT(DISTINCT a.id) AS total
       FROM assignments a
       JOIN enrolled_courses ec ON ec.course_id = a.course_id
       JOIN group_members gm ON gm.user_id = ec.user_id
       WHERE gm.group_id = $1 AND a.type = 'group'`,
      [group_id]
    );
    const total = parseInt(totalRes.rows[0].total);

    // Only count assignments where every member submitted
    const submittedRes = await pool.query(
      `SELECT COUNT(*) AS submitted FROM (
         SELECT s.assignment_id
         FROM submissions s
         JOIN assignments a ON a.id = s.assignment_id
         WHERE s.group_id = $1 AND a.type = 'group'
         GROUP BY s.assignment_id
         HAVING COUNT(DISTINCT s.confirmed_by) >= $2
       ) AS fully_submitted`,
      [group_id, totalMembers]
    );
    const submitted = parseInt(submittedRes.rows[0].submitted);

    res.json({ total, submitted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// INDIVIDUAL PROGRESS (top-level)
router.get('/progress/individual', verifyToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const totalRes = await pool.query(
      `SELECT COUNT(DISTINCT a.id) AS total
       FROM assignments a
       JOIN enrolled_courses ec ON ec.course_id = a.course_id
       WHERE ec.user_id = $1 AND a.type = 'individual'`,
      [userId]
    );

    const submittedRes = await pool.query(
      `SELECT COUNT(DISTINCT s.assignment_id) AS submitted
       FROM submissions s
       JOIN assignments a ON a.id = s.assignment_id
       WHERE s.confirmed_by = $1 AND a.type = 'individual'`,
      [userId]
    );

    res.json({
      total:     parseInt(totalRes.rows[0].total),
      submitted: parseInt(submittedRes.rows[0].submitted),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PER-ASSIGNMENT GROUP BREAKDOWN
router.get('/breakdown/:assignment_id', verifyToken, async (req, res) => {
  const { assignment_id } = req.params;
  const { group_id } = req.query;
  if (!group_id) return res.status(400).json({ message: 'group_id is required' });
  try {
    const membersRes = await pool.query(
      `SELECT u.id, u.name, u.email
       FROM users u
       JOIN group_members gm ON gm.user_id = u.id
       WHERE gm.group_id = $1`,
      [group_id]
    );

    const submissionsRes = await pool.query(
      `SELECT confirmed_by, acknowledged
       FROM submissions
       WHERE assignment_id = $1 AND group_id = $2`,
      [assignment_id, group_id]
    );

    const submittedMap = {};
    submissionsRes.rows.forEach(s => {
      submittedMap[s.confirmed_by] = { submitted: true, acknowledged: s.acknowledged };
    });

    const members = membersRes.rows.map(m => ({
      ...m,
      submitted:    !!submittedMap[m.id],
      acknowledged: submittedMap[m.id]?.acknowledged || false,
    }));

    res.json({
      members,
      totalMembers:      members.length,
      submittedCount:    members.filter(m => m.submitted).length,
      acknowledgedCount: members.filter(m => m.acknowledged).length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all submissions
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.name as student_name, u.email, a.title as assignment_title,
              g.group_name, grp_leader.name as leader_name
       FROM submissions s
       JOIN users u ON u.id = s.confirmed_by
       JOIN assignments a ON a.id = s.assignment_id
       LEFT JOIN groups g ON g.id = s.group_id
       LEFT JOIN users grp_leader ON grp_leader.id = g.leader_id
       ORDER BY s.confirmed_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;