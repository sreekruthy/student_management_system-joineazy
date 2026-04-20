const express = require('express');
const cors = require('cors');
const courseRoutes = require('./routes/courses');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/submissions', require('./routes/submissionRoutes'));
app.use('/api/courses', courseRoutes);

module.exports = app;