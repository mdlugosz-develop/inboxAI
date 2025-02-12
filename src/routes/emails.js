const express = require('express');
const router = express.Router();
const emailService = require('../services/gmail/email');
const aiService = require('../services/ai');

// Get user's emails
router.get('/', async (req, res) => {
  try {
    const emails = await emailService.fetchEmails();
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get email analysis
router.get('/:messageId/analyze', async (req, res) => {
  try {
    const { messageId } = req.params;
    const email = await emailService.getEmailContent(messageId);
    
    // Parallel processing of different analyses
    const [summary, entities, keyInfo] = await Promise.all([
      aiService.generateSummary(email),
      aiService.extractEntities(email),
      aiService.extractKeyInformation(email),
    ]);

    res.json({
      summary,
      entities,
      keyInfo,
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