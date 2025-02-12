require('dotenv').config();
const express = require('express');
const { initializeGmailAuth } = require('./services/gmail/auth');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/emails', require('./routes/emails'));

// Initialize server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 