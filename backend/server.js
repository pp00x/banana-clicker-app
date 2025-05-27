require('dotenv').config(); // Loads environment variables from .env file

const connectDB = require('./src/config/database');

const express = require('express');
const app = express();

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Banana Clicker Backend is Alive!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});