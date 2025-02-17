const express = require('express');
const router = express.Router();
const emailService = require('../services/gmail/email');
const aiService = require('../services/ai');
const gmailAuth = require('../services/gmail/auth');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!gmailAuth.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// Get recent emails
router.get('/', requireAuth, async (req, res) => {
  try {
    const emails = await emailService.fetchEmails('me', 5);
    res.json(emails);
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

// Get single email content
router.get('/:messageId', requireAuth, async (req, res) => {
  try {
    const email = await emailService.getEmailContent(req.params.messageId);
    res.json(email);
  } catch (error) {
    console.error('Error fetching email content:', error);
    res.status(500).json({ error: 'Failed to fetch email content' });
  }
});

// Get email analysis
router.get('/:messageId/analyze', async (req, res) => {
  try {
    const { messageId } = req.params;
    const email = await emailService.getEmailContent(messageId);

    console.log(email);
    
    // Parallel processing of different analyses
    const [summary ] = await Promise.all([
      aiService.generateSummary(email),
     
    ]);

    res.json({
      summary

    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate quick reply
router.post('/:messageId/quick-reply', async (req, res) => {
  try {
    const { messageId } = req.params;
    const email = await emailService.getEmailContent(messageId);
    const reply = await aiService.generateQuickReply(email);
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 