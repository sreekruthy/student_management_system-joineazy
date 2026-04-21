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

// Acknowledge submission — only group leader; propagates to all members
router.post('/acknowledge', verifyToken, async (req, res) => {
  const { assignment_id, group_id } = req.body;
  try {
    // Check if user is group leader
    const group = await pool.query(`SELECT leader_id FROM groups WHERE id = $1`, [group_id]);
    if (!group.rows[0] || group.rows[0].leader_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the group leader can acknowledge submissions' });
    }
    // Get all group members
    const members = await pool.query(
      `SELECT user_id FROM group_members WHERE group_id = $1`, [group_id]
    );
    // Upsert acknowledged submission for each member
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

// Get progress for a group
router.get('/progress', verifyToken, async (req, res) => {
  const { group_id } = req.query;
  if (!group_id || group_id === 'undefined') {

    return res.status(400).json({ message: 'group_id is required' });

  }
  try {
    const total = await pool.query(`SELECT COUNT(*) as total FROM assignments`);
    const submitted = await pool.query(
      `SELECT COUNT(DISTINCT assignment_id) as submitted FROM submissions WHERE group_id = $1`,
      [group_id]
    );
    const acknowledged = await pool.query(
      `SELECT COUNT(DISTINCT assignment_id) as acknowledged FROM submissions
       WHERE group_id = $1 AND acknowledged = TRUE`,
      [group_id]
    );
    const memberTotal = await pool.query(

      `SELECT COUNT(*) AS total FROM group_members WHERE group_id = $1`,

      [group_id]

    );

    const latestAssignment = await pool.query(

      `SELECT id FROM assignments ORDER BY created_at DESC LIMIT 1`

    );

    const memberConfirmed = latestAssignment.rows[0]

      ? await pool.query(

          `SELECT COUNT(DISTINCT confirmed_by) AS confirmed

           FROM submissions

           WHERE group_id = $1 AND assignment_id = $2`,

          [group_id, latestAssignment.rows[0].id]

        )

      : { rows: [{ confirmed: 0 }] };

    const totalAssignments    = parseInt(total.rows[0].total);
    const totalAcknowledged  = parseInt(acknowledged.rows[0].acknowledged);
    const totalSubmitted    = parseInt(submitted.rows[0].submitted);
    const totalMembers      = parseInt(memberTotal.rows[0].total);
    const membersConfirmed  = parseInt(memberConfirmed.rows[0].confirmed);

    res.json({
      totalAssignments,
      submitted:    totalSubmitted,
      acknowledged: totalAcknowledged,

      submittedPct:    totalAssignments === 0 ? 0
        : Math.round((totalSubmitted / totalAssignments) * 100),

      acknowledgedPct: totalAssignments === 0 ? 0

        : Math.round((totalAcknowledged / totalAssignments) * 100),

      // Secondary metric — member participation on latest assignment

      totalMembers,

      membersConfirmed,

      memberPct: totalMembers === 0 ? 0

        : Math.round((membersConfirmed / totalMembers) * 100),

  });
 } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get all submissions (professor)
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