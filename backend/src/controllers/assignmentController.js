const pool = require('../db');

// CREATE
exports.createAssignment = async (req, res) => {
  try {
    console.log("USER:", req.user);
    const { title, description, due_date, onedrive_link } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User not found in token" });
    }
    
    const result = await pool.query(
      `INSERT INTO assignments (title, description, due_date, onedrive_link, created_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [title, description, due_date, onedrive_link, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error creating assignment");
  }
};

// GET ALL
exports.getAssignments = async (req, res) => {
  const result = await pool.query("SELECT * FROM assignments ORDER BY id DESC");
  res.json(result.rows);
};