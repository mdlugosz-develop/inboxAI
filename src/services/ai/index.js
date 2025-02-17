const { ChatOllama } = require("@langchain/ollama");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { PromptTemplate } = require("@langchain/core/prompts");
const { JsonOutputParser } = require("@langchain/core/output_parsers");

class AIService {
  constructor() {
    this.model = new ChatOllama({
      baseUrl: "http://localhost:11434",
      model: "llama3.2",
    });
  }

  async generateSummary(emailContent) {
    const template = `Summarize the following email content in a concise way, focusing on the main points and any action items:

Email content:
{email_content}

Summary:`;

    const prompt = PromptTemplate.fromTemplate(template);
    const chain = prompt.pipe(this.model).pipe(new StringOutputParser());
    
    try {
      const summary = await chain.invoke({
        email_content: emailContent,
      });
      return summary.trim();
    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    }
  }

  async generateQuickReply(emailContent) {
    // TODO: Implement quick reply generation
    throw new Error('Not implemented');
  }

  async extractEntities(emailContent) {
    // TODO: Implement Named Entity Recognition
    throw new Error('Not implemented');
  }

  async extractKeyInformation(emailContent) {
    const template = `Extract and organize key information from the following email content into JSON format. Include these fields if found (leave empty array or null if not found):
- dates: Array of important dates and deadlines mentioned
- actions: Array of action items or requests
- decisions: Array of key decisions mentioned
- contacts: Array of important contacts or people mentioned
- numbers: Array of critical numbers or figures

Email content:
{email_content}

Respond ONLY with a valid JSON object containing the above fields. Example format:
{
  "dates": ["2024-03-20", "next Friday"],
  "actions": ["review proposal", "schedule meeting"],
  "decisions": ["approved budget increase"],
  "contacts": ["John Smith", "Mary Johnson"],
  "numbers": ["$50,000", "15%"]
}`;

    const prompt = PromptTemplate.fromTemplate(template);
    const chain = prompt.pipe(this.model).pipe(new StringOutputParser());
    
    try {
      const keyInfo = await chain.invoke({
        email_content: emailContent,
      });
      
      // Ensure we have valid JSON by parsing and providing default structure if needed
      try {
        const parsedInfo = JSON.parse(keyInfo.trim());
        return {
          dates: parsedInfo.dates || [],
          actions: parsedInfo.actions || [],
          decisions: parsedInfo.decisions || [],
          contacts: parsedInfo.contacts || [],
          numbers: parsedInfo.numbers || []
        };
      } catch (parseError) {
        console.error('Error parsing AI response as JSON:', parseError);
        // Return a default structure if parsing fails
        return {
          dates: [],
          actions: [],
          decisions: [],
          contacts: [],
          numbers: []
        };
      }
    } catch (error) {
      console.error('Error extracting key information:', error);
      throw error;
    }
  }
}

module.exports = new AIService(); 