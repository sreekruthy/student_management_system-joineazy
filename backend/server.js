require('dotenv').config();
const app = require('./src/app');

app.get('/api', (req, res) => {
  res.json({status: 'ok', message: 'API is running' });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
