require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Initialize Express
const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));
app.use(cors());

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, '../client')));

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/questions', require('./routes/question'));
app.use('/api/result', require('./routes/result'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/user', require('./routes/user'));
app.use('/api/exams', require('./routes/exam'));

// Catch-all route for frontend (SPA behavior not strictly needed since we have separate HTML pages, but good to have)
// For this application, direct HTML navigation works, so we don't strictly need a catch-all if we navigate to .html files directly.

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));