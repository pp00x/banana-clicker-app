require('dotenv').config(); // Loads environment variables from .env file

const connectDB = require('./src/config/database');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');

const express = require('express');
const app = express();

// Connect to MongoDB
connectDB();

// Middleware to parse JSON bodies
app.use(express.json());

const PORT = process.env.PORT || 3000;

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Basic test route
app.get('/', (req, res) => {
  res.send('Banana Clicker Backend is Alive!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
