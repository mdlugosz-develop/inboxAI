const express = require('express');
const router = express.Router();
const { initializeGmailAuth } = require('../services/gmail/auth');

router.get('/gmail', async (req, res) => {
  try {
    await initializeGmailAuth();
    res.json({ message: 'Gmail authentication successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 