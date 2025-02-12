const { google } = require('googleapis');
const { authenticate } = require('@google-cloud/local-auth');
const path = require('path');

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
];

async function initializeGmailAuth() {
  try {
    const auth = await authenticate({
      keyfilePath: path.join(__dirname, '../../../credentials.json'),
      scopes: SCOPES,
    });

    const gmail = google.gmail({ version: 'v1', auth });
    return { auth, gmail };
  } catch (error) {
    console.error('Error initializing Gmail auth:', error);
    throw error;
  }
}

module.exports = {
  initializeGmailAuth,
}; 