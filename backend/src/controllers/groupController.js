//groupController.js 
 

const pool = require('../db');

exports.createGroup = async (req, res) => {
  const { group_name } = req.body;
  const userId = req.user.id;

  if (!group_name || group_name.trim() === '') {

    return res.status(400).json({ msg: 'Group name is required' });
  }

  try{

    // Check user doesn't already have a group

    const existing = await pool.query(

      `SELECT g.id, g.group_name FROM groups g

       JOIN group_members gm ON gm.group_id = g.id

       WHERE gm.user_id = $1 LIMIT 1`,

      [userId]

    );

    if (existing.rows.length > 0) {

      return res.status(409).json({

        msg: `You are already in a group: "${existing.rows[0].group_name}"`

      });

    }

    // Create group with leader set immediately

    const group = await pool.query(

      `INSERT INTO groups (group_name, created_by, leader_id)

       VALUES ($1, $2, $2) RETURNING *`,

      [group_name.trim(), userId]

    );


    // Add creator as member
  await pool.query(
    `INSERT INTO group_members (group_id, user_id)
     VALUES ($1,$2)`,
    [group.rows[0].id, userId]
  );

  res.status(201).json(group.rows[0]);

  } catch (err) {

    console.error('Create group error:', err.message);

    res.status(500).json({ msg: 'Failed to create group.' });

  }
};

// addMember
exports.addMember = async (req, res) => {
  try {
    const { email, group_id } = req.body;
    if (!email || !group_id) {

      return res.status(400).json({ msg: 'email and group_id are required' });

    }

    // Verify requester is the group leader

    const groupRes = await pool.query(

      `SELECT leader_id FROM groups WHERE id = $1`,

      [group_id]

    );

    if (!groupRes.rows[0]) {

      return res.status(404).json({ msg: 'Group not found' });

    }

    if (groupRes.rows[0].leader_id !== req.user.id) {

      return res.status(403).json({ msg: 'Only the group leader can add members' });

    }

    // Find user by email
    const user = await pool.query(
      "SELECT * FROM users WHERE email = $1 and role = 'STUDENT'",
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ msg: "No student found with that email" });
    }

    const targetId = user.rows[0].id;

    // Prevent adding someone already in a group

    const alreadyInGroup = await pool.query(

      `SELECT 1 FROM group_members WHERE user_id = $1`,

      [targetId]

    );

    if (alreadyInGroup.rows.length > 0) {

      return res.status(409).json({ msg: 'That student is already in a group' });

    }


    // Insert into group_members
    await pool.query(
      `INSERT INTO group_members (group_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [group_id, targetId]
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
      WHERE gm.user_id = $1 ORDER BY gm.id DESC LIMIT 1
    `, [req.user.id]);

    if(groupRes.rows.length === 0){
      return res.json(null);
    }

    const group = groupRes.rows[0];

    const membersRes = await pool.query(
      `SELECT u.id, u.name, u.email,

              (u.id = g.leader_id) AS is_leader

       FROM users u

       JOIN group_members gm ON u.id = gm.user_id

       JOIN groups g ON g.id = gm.group_id

       WHERE gm.group_id = $1`, [group.id]);

    res.json({ ...group, members: membersRes.rows, is_leader: group.leader_id === req.user.id });

  } catch (err) {
    console.error('Get my group error:', err.message);
  }
};

// ADMIN - GET ALL GROUPS
exports.getAllGroups = async (req, res) => {
  if(req.user.role !== 'ADMIN') {

    return res.status(403).json({ msg: 'Access denied' });

  }
  try{
  const result = await pool.query("SELECT g.*,u.name as leader_name, COUNT(gm.user_id) as member_count FROM groups g LEFT JOIN users u ON g.leader_id = u.id LEFT JOIN group_members gm ON g.id = gm.group_id GROUP BY g.id, u.name ORDER BY g.id DESC");
  res.json(result.rows);
  }
  catch (err) {

    console.error('Get all groups error:', err.message);

    res.status(500).json({ msg: 'Failed to get groups.' });

  }
};