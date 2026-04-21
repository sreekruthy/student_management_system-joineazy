const express = require('express');
const cors = require('cors');
const courseRoutes = require('./routes/courses');

const app = express();

app.use(cors({
  origin: 'https://student-management-system-joineazy.vercel.app/',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.options(/.*/, cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/submissions', require('./routes/submissionRoutes'));
app.use('/api/courses', courseRoutes);

module.exports = app;