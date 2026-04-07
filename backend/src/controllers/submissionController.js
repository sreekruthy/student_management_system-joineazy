const pool = require('../db');

// CONFIRM SUBMISSION
exports.confirmSubmission = async (req, res) => {
  try {
    const { assignment_id, group_id } = req.body;

    await pool.query(
      `INSERT INTO submissions (assignment_id, group_id, confirmed_by)
       VALUES ($1,$2,$3)
       ON CONFLICT (assignment_id, group_id, confirmed_by) DO NOTHING`,
      [assignment_id, group_id, req.user.id]
    );

    res.json({ message: "Submission confirmed" });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error confirming");
  }
};

// GET ALL (ADMIN DASHBOARD)
exports.getSubmissions = async (req, res) => {
  const result = await pool.query(`
    SELECT 
      s.id,
      g.group_name,
      a.title
    FROM submissions s
    JOIN groups g ON s.group_id = g.id
    JOIN assignments a ON s.assignment_id = a.id
    ORDER BY s.id DESC
  `);

  res.json(result.rows);
};

// PROGRESS
exports.getGroupProgress = async (req, res) => {
  try{
    const { group_id } = req.query;

    

    if (!group_id || group_id === "undefined") {
      return res.status(400).json({ message: "Group ID is required" });
    }

    // total members
    const members = await pool.query(
      "SELECT COUNT(*) FROM group_members WHERE group_id = $1",
      [group_id]
    );

    // total assignments
    const assignments = await pool.query(
      "SELECT COUNT(*) FROM assignments"
    );

    // count DISTINCT members who submitted
    const submissions = await pool.query(`SELECT COUNT(DISTINCT confirmed_by) FROM submissions WHERE group_id = $1`,
      [group_id]
    );

    const totalMembers = Number(members.rows[0].count);
    const totalSubmitted = Number(submissions.rows[0].count);

    const progress =
    totalMembers === 0 ? 0 : (totalSubmitted / totalMembers) * 100;

    res.json({ progress });
  }
  catch(err){
    console.log(err);
    return res.status(500).json({ message: "Error fetching progress" });
  }
  
};