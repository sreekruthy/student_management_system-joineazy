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
  try {
    const { email, group_id } = req.body;

    // 1. Find user by email
    const user = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ msg: "User not found" });
    }

    const userId = user.rows[0].id;

    // 2. Insert into group_members
    await pool.query(
      `INSERT INTO group_members (group_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [group_id, userId]
    );

    res.json({ msg: "Member added" });

  } catch (err) {
    console.log(err);
    res.status(500).send("Error adding member");
  }
};

exports.getMyGroup = async (req, res) => {
  try {
    const groupRes = await pool.query(`
      SELECT g.*
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = $1
    `, [req.user.id]);

    if(groupRes.rows.length === 0){
      return res.json(null);
    }

    const group = groupRes.rows[0];

    const membersRes = await pool.query(`
      SELECT u.id, u.name, u.email
      FROM users u
      JOIN group_members gm ON u.id = gm.user_id
      WHERE gm.group_id = $1
    `, [group.id]);

    res.json({ ...group, members: membersRes.rows });

  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
};

// ADMIN - GET ALL GROUPS
exports.getAllGroups = async (req, res) => {
  const result = await pool.query("SELECT * FROM groups ORDER BY id DESC");
  res.json(result.rows);
};