const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const pool = require('../db');

// Confirm submission
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

// Acknowledge — leader only; marks all group members' submissions for that assignment
router.post('/acknowledge', verifyToken, async (req, res) => {
  const { assignment_id, group_id } = req.body;
  try {
    const group = await pool.query(`SELECT leader_id FROM groups WHERE id = $1`, [group_id]);
    if (!group.rows[0] || group.rows[0].leader_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the group leader can acknowledge submissions' });
    }
    const members = await pool.query(
      `SELECT user_id FROM group_members WHERE group_id = $1`, [group_id]
    );
    for (const member of members.rows) {
      await pool.query(
        `INSERT INTO submissions (assignment_id, group_id, confirmed_by, status, acknowledged, acknowledged_at)
         VALUES ($1, $2, $3, 'CONFIRMED', TRUE, NOW())
         ON CONFLICT (assignment_id, group_id, confirmed_by)
         DO UPDATE SET acknowledged = TRUE, acknowledged_at = NOW()`,
        [assignment_id, group_id, member.user_id]
      );
    }
    res.json({ success: true, membersUpdated: members.rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GROUP PROGRESS (top-level) ───────────────────────────────────────────────
// Returns: how many GROUP assignments this group has fully submitted (at least one
// member confirmed) out of all group assignments in the courses they are enrolled in,
// plus how many are fully acknowledged by the leader.
router.get('/progress/group', verifyToken, async (req, res) => {
  const { group_id } = req.query;
  if (!group_id || group_id === 'undefined') {
    return res.status(400).json({ message: 'group_id is required' });
  }
  try {
    // Total group assignments across all courses the group's members are enrolled in
    const totalRes = await pool.query(
      `SELECT COUNT(DISTINCT a.id) AS total
       FROM assignments a
       JOIN enrolled_courses ec ON ec.course_id = a.course_id
       JOIN group_members gm ON gm.user_id = ec.user_id
       WHERE gm.group_id = $1 AND a.type = 'group'`,
      [group_id]
    );

    // Group assignments where at least one member of this group submitted
    const submittedRes = await pool.query(
      `SELECT COUNT(DISTINCT s.assignment_id) AS submitted
       FROM submissions s
       JOIN assignments a ON a.id = s.assignment_id
       WHERE s.group_id = $1 AND a.type = 'group'`,
      [group_id]
    );

    // Group assignments where at least one submission is acknowledged
    const acknowledgedRes = await pool.query(
      `SELECT COUNT(DISTINCT s.assignment_id) AS acknowledged
       FROM submissions s
       JOIN assignments a ON a.id = s.assignment_id
       WHERE s.group_id = $1 AND a.type = 'group' AND s.acknowledged = TRUE`,
      [group_id]
    );

    const total        = parseInt(totalRes.rows[0].total);
    const submitted    = parseInt(submittedRes.rows[0].submitted);
    const acknowledged = parseInt(acknowledgedRes.rows[0].acknowledged);

    res.json({ total, submitted, acknowledged });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── INDIVIDUAL PROGRESS (top-level) ─────────────────────────────────────────
// Returns: how many INDIVIDUAL assignments this student submitted out of total
// individual assignments in their enrolled courses.
router.get('/progress/individual', verifyToken, async (req, res) => {
  const userId = req.user.id;
  try {
    // Total individual assignments in courses this student is enrolled in
    const totalRes = await pool.query(
      `SELECT COUNT(DISTINCT a.id) AS total
       FROM assignments a
       JOIN enrolled_courses ec ON ec.course_id = a.course_id
       WHERE ec.user_id = $1 AND a.type = 'individual'`,
      [userId]
    );

    // Individual assignments this student submitted
    const submittedRes = await pool.query(
      `SELECT COUNT(DISTINCT s.assignment_id) AS submitted
       FROM submissions s
       JOIN assignments a ON a.id = s.assignment_id
       WHERE s.confirmed_by = $1 AND a.type = 'individual'`,
      [userId]
    );

    const total     = parseInt(totalRes.rows[0].total);
    const submitted = parseInt(submittedRes.rows[0].submitted);

    res.json({ total, submitted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PER-ASSIGNMENT GROUP BREAKDOWN ──────────────────────────────────────────
// Returns member-by-member submission + acknowledgment status for one assignment
router.get('/breakdown/:assignment_id', verifyToken, async (req, res) => {
  const { assignment_id } = req.params;
  const { group_id } = req.query;
  if (!group_id) return res.status(400).json({ message: 'group_id is required' });
  try {
    // All members of the group
    const membersRes = await pool.query(
      `SELECT u.id, u.name, u.email
       FROM users u
       JOIN group_members gm ON gm.user_id = u.id
       WHERE gm.group_id = $1`,
      [group_id]
    );

    // Which members submitted this assignment
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

    const totalMembers    = members.length;
    const submittedCount  = members.filter(m => m.submitted).length;
    const acknowledgedCount = members.filter(m => m.acknowledged).length;

    res.json({ members, totalMembers, submittedCount, acknowledgedCount });
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