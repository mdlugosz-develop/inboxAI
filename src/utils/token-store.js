const fs = require('fs').promises;
const path = require('path');

class TokenStore {
  constructor() {
    this.tokenPath = path.join(__dirname, '../../.credentials/token.json');
  }

  async saveToken(token) {
    try {
      // Ensure .credentials directory exists
      await fs.mkdir(path.dirname(this.tokenPath), { recursive: true });
      await fs.writeFile(this.tokenPath, JSON.stringify(token));
      return true;
    } catch (error) {
      console.error('Error saving token:', error);
      return false;
    }
  }

  async loadToken() {
    try {
      const token = await fs.readFile(this.tokenPath);
      return JSON.parse(token);
    } catch (error) {
      return null;
    }
  }

  async deleteToken() {
    try {
      await fs.unlink(this.tokenPath);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new TokenStore(); 