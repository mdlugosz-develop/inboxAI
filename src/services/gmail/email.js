const { initializeGmailAuth } = require('./auth');

class EmailService {
  constructor() {
    this.gmail = null;
  }

  async initialize() {
    const { gmail } = await initializeGmailAuth();
    this.gmail = gmail;
  }

  async fetchEmails(userId = 'me', maxResults = 10) {
    try {
      const response = await this.gmail.users.messages.list({
        userId,
        maxResults,
      });
      return response.data.messages || [];
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  }

  async getEmailContent(messageId, userId = 'me') {
    try {
      const response = await this.gmail.users.messages.get({
        userId,
        id: messageId,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching email content:', error);
      throw error;
    }
  }
}

module.exports = new EmailService(); 