const pool = require('../db');

exports.createAssignment = async (req, res) => {
  const { title, description, due_date, onedrive_link } = req.body;

  const result = await pool.query(
    `INSERT INTO assignments 
     (title, description, due_date, onedrive_link, created_by)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [title, description, due_date, onedrive_link, req.user.id]
  );

  res.json(result.rows[0]);
};

exports.getAssignments = async (req, res) => {
  const result = await pool.query(`SELECT * FROM assignments`);
  res.json(result.rows);
};