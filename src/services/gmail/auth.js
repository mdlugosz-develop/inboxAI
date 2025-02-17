const { google } = require('googleapis');
const path = require('path');
const tokenStore = require('../../utils/token-store');

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
];

class GmailAuthService {
  constructor() {
    this.auth = null;
    this.gmail = null;
    this.oAuth2Client = null;
    this.initializeOAuth2Client();
  }

  initializeOAuth2Client() {
    try {
      const credentials = require('../../../credentials.json');
      const { client_secret, client_id, redirect_uris } = credentials.installed;
      this.oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        'http://localhost:3000/api/auth/callback' // Override redirect URI
      );
    } catch (error) {
      console.error('Error initializing OAuth2 client:', error);
      throw error;
    }
  }

  async getAuthUrl() {
    if (!this.oAuth2Client) {
      this.initializeOAuth2Client();
    }

    return this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });
  }

  async handleCallback(code) {
    try {
      const { tokens } = await this.oAuth2Client.getToken(code);
      this.oAuth2Client.setCredentials(tokens);
      
      // Save the tokens
      await tokenStore.saveToken(tokens);
      
      this.auth = this.oAuth2Client;
      this.gmail = google.gmail({ version: 'v1', auth: this.auth });
      
      return { auth: this.auth, gmail: this.gmail };
    } catch (error) {
      console.error('Error handling callback:', error);
      throw error;
    }
  }

  async initialize() {
    if (this.auth) {
      return { auth: this.auth, gmail: this.gmail };
    }

    try {
      // Try to load existing token
      const token = await tokenStore.loadToken();
      
      if (token) {
        // Set credentials and create Gmail instance
        this.oAuth2Client.setCredentials(token);
        this.auth = this.oAuth2Client;
        this.gmail = google.gmail({ version: 'v1', auth: this.auth });
        
        return { auth: this.auth, gmail: this.gmail };
      }

      return null;
    } catch (error) {
      console.error('Error initializing Gmail auth:', error);
      throw error;
    }
  }

  async logout() {
    try {
      if (this.auth) {
        await this.auth.revokeCredentials();
      }
      await tokenStore.deleteToken();
      this.auth = null;
      this.gmail = null;
      return true;
    } catch (error) {
      console.error('Error logging out:', error);
      return false;
    }
  }

  isAuthenticated() {
    return !!this.auth;
  }
}

module.exports = new GmailAuthService(); 