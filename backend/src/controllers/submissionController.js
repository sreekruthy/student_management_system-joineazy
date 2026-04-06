const pool = require('../db');

exports.confirmSubmission = async (req, res) => {
  const { assignment_id, group_id } = req.body;

  await pool.query(
    `INSERT INTO submissions (assignment_id, group_id, confirmed_by)
     VALUES ($1,$2,$3)
     ON CONFLICT (assignment_id, group_id) DO NOTHING`,
    [assignment_id, group_id, req.user.id]
  );

  res.json({ msg: "Submission confirmed" });
};

exports.getSubmissions = async (req, res) => {
  const result = await pool.query(`
    SELECT s.*, a.title, g.group_name
    FROM submissions s
    JOIN assignments a ON s.assignment_id = a.id
    JOIN groups g ON s.group_id = g.id
  `);

  res.json(result.rows);
};

exports.getGroupProgress = async (req, res) => {
  const { group_id } = req.query;

  const total = await pool.query(
    `SELECT COUNT(*) FROM assignments`
  );

  const completed = await pool.query(
    `SELECT COUNT(*) FROM submissions WHERE group_id = $1`,
    [group_id]
  );

  const progress =
    (completed.rows[0].count / total.rows[0].count) * 100;

  res.json({ progress });
};