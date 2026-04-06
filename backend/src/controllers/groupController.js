const pool = require('../db');

exports.createGroup = async (req, res) => {
  const { group_name } = req.body;
  const userId = req.user.id;

  const group = await pool.query(
    `INSERT INTO groups (group_name, created_by)
     VALUES ($1,$2) RETURNING *`,
    [group_name, userId]
  );

  await pool.query(
    `INSERT INTO group_members (group_id, user_id)
     VALUES ($1,$2)`,
    [group.rows[0].id, userId]
  );

  res.json(group.rows[0]);
};

exports.addMember = async (req, res) => {
  const { group_id, user_id } = req.body;

  await pool.query(
    `INSERT INTO group_members (group_id, user_id)
     VALUES ($1,$2)`,
    [group_id, user_id]
  );

  res.json({ msg: "Member added" });
};

exports.getMyGroup = async (req, res) => {
  const userId = req.user.id;

  const result = await pool.query(
    `SELECT g.*
     FROM groups g
     JOIN group_members gm ON g.id = gm.group_id
     WHERE gm.user_id = $1`,
    [userId]
  );

  res.json(result.rows[0]);
};