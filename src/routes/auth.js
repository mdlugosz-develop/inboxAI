const express = require('express');
const router = express.Router();
const gmailAuth = require('../services/gmail/auth');

// Check authentication status
router.get('/status', (req, res) => {
  res.json({ authenticated: gmailAuth.isAuthenticated() });
});

// Start Gmail OAuth flow
router.get('/gmail', async (req, res) => {
  try {
    const authUrl = await gmailAuth.getAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Handle OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      throw new Error('No authorization code received');
    }

    await gmailAuth.handleCallback(code);
    
    // Redirect to the frontend with a success parameter
    res.redirect('/?auth=success');
  } catch (error) {
    console.error('Callback error:', error);
    res.redirect('/?auth=error');
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const success = await gmailAuth.logout();
    res.json({ success });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router; 