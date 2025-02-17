const gmailAuth = require('./auth');

function decodeBase64(encoded) {
  return atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
}

function stripHtml(html) {
  // Remove common email formatting and quote markers
  let text = html
    .replace(/<style[^>]*>.*?<\/style>/gs, '') // Remove style tags and their content
    .replace(/<script[^>]*>.*?<\/script>/gs, '') // Remove script tags and their content
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&') // Replace &amp; with &
    .replace(/&lt;/g, '<') // Replace &lt; with <
    .replace(/&gt;/g, '>') // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#x27;/g, "'") // Replace &#x27; with '
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/^\s+|\s+$/g, ''); // Trim leading/trailing spaces

  // Remove quoted text markers and clean up
  text = text
    .replace(/^>+/gm, '') // Remove quote markers at start of lines
    .replace(/[\r\n]{3,}/g, '\n\n') // Replace multiple newlines with double newline
    .trim();

  return text;
}

class EmailService {
  constructor() {
    this.gmail = null;
  }

  async initialize() {
    if (!this.gmail) {
      const { gmail } = await gmailAuth.initialize();
      this.gmail = gmail;
    }
    return this.gmail;
  }

  async fetchEmails(userId = 'me', maxResults = 10) {
    try {
      await this.initialize();
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
      await this.initialize();
      const response = await this.gmail.users.messages.get({
        userId,
        id: messageId,
      });
      
      const message = response.data;
      const payload = message.payload;
      let body = '';

      // First try to find plain text content
      if (payload.parts) {
        // Try to find plain text part first
        const plainTextPart = payload.parts.find(part => part.mimeType === 'text/plain');
        if (plainTextPart && plainTextPart.body.data) {
          body = decodeBase64(plainTextPart.body.data);
        } else {
          // If no plain text, try to find HTML part
          const htmlPart = payload.parts.find(part => part.mimeType === 'text/html');
          if (htmlPart && htmlPart.body.data) {
            body = stripHtml(decodeBase64(htmlPart.body.data));
          }
        }

        // Handle nested multipart messages
        if (!body) {
          for (const part of payload.parts) {
            if (part.parts) {
              const nestedPlainPart = part.parts.find(p => p.mimeType === 'text/plain');
              if (nestedPlainPart && nestedPlainPart.body.data) {
                body = decodeBase64(nestedPlainPart.body.data);
                break;
              }
              const nestedHtmlPart = part.parts.find(p => p.mimeType === 'text/html');
              if (nestedHtmlPart && nestedHtmlPart.body.data) {
                body = stripHtml(decodeBase64(nestedHtmlPart.body.data));
                break;
              }
            }
          }
        }
      } else if (payload.body.data) {
        // Handle single part messages
        body = payload.mimeType === 'text/html' 
          ? stripHtml(decodeBase64(payload.body.data))
          : decodeBase64(payload.body.data);
      }

      // Extract headers
      const headers = payload.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
      const to = headers.find(h => h.name === 'To')?.value || '';
      const date = headers.find(h => h.name === 'Date')?.value || '';

      const data_returned = {
        subject,
        body: body.trim(),
        date,
        from,
        to,
        messageId: message.id,
      };
      console.log(data_returned);
      return data_returned;
    } catch (error) {
      console.error('Error fetching email content:', error);
      throw error;
    }
  }

  isInitialized() {
    return !!this.gmail;
  }
}

module.exports = new EmailService(); 