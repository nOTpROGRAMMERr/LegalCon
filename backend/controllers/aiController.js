const axios = require('axios');
const Contract = require('../models/Contract');
const Template = require('../models/Template');
const { Groq } = require('groq-sdk');
// Get AI suggestions for clauses

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Analyze clauses for potential risks
exports.analyzeRisks = async (req, res) => {
  try {
    const { clauses } = req.body;
    
    if (!clauses || clauses.length === 0) {
      return res.status(400).json({ 
        message: 'Missing required fields: clauses are required'
      });
    }

    // For development, use mock data if no API key
    if (!process.env.GROQ_API_KEY) {
      const mockRiskAnalysis = generateMockRiskAnalysis(clauses);
      return res.status(200).json({ riskAnalysis: mockRiskAnalysis });
    }

    // Format the prompt for the AI
    const prompt = `Analyze the following contract clauses for potential legal, business, and compliance risks. For each clause, provide:
1. Risk Level (High, Medium, Low)
2. Risk Description
3. Suggested Improvements

Here are the clauses:

${clauses.map((clause, index) => `CLAUSE ${index + 1}: ${clause.title}
${clause.content || '[Empty content - This clause has no content specified]'}
`).join('\n')}

Format your response as a JSON array where each item contains:
- clauseIndex: The index of the clause (starting from 0)
- riskLevel: "high", "medium", or "low"
- risks: Array of specific risks identified
- suggestions: Array of suggested improvements to mitigate risks

For clauses with empty content, analyze based on the title and suggest appropriate content.

Your analysis should be detailed but concise, focusing on practical improvements.`;

    // Call Groq API for analysis
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a legal expert specializing in contract risk analysis. Provide thorough, accurate risk assessments and practical improvement suggestions for contract clauses."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama3-70b-8192",
      response_format: { type: "json_object" }
    });

    // Parse the response to get risk analysis
    const responseContent = completion.choices[0].message.content;
    let parsedResponse;
    
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      return res.status(500).json({ message: 'Error processing risk analysis results' });
    }

    // Return the risk analysis
    res.status(200).json({ riskAnalysis: parsedResponse });
  } catch (error) {
    console.error('Error analyzing risks:', error);
    res.status(500).json({ message: 'Failed to analyze risks', error: error.message });
  }
};

// Generate contract directly using Groq AI
exports.generateContract = async (req, res) => {
  try {
    const { clauses } = req.body;
    
    if (!clauses || clauses.length === 0) {
      return res.status(400).json({ 
        message: 'Missing required fields: clauses are required'
      });
    }

    // Format the prompt for the AI
    const prompt = `Generate a professional contract based on the following clauses:
${clauses.join('\n')}

Please format this as a complete, legally-formatted contract with appropriate sections, 
including but not limited to parties involved, terms, conditions, and signature blocks.

Format the output using markdown with the following guidelines:
- Use # for main headings
- Use ## for subheadings
- Use **text** for important terms or definitions
- Use proper paragraph spacing
- Format dates, amounts, and legal references consistently
- Use numbered lists for sequential terms and conditions

For the signature block, please format it like this example:

## Signatures

IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date first written above.

**Client:**

________________________
Name: [Client Name]
Title: [Client Title]
Date: ________________

**Freelancer/Contractor:**

________________________
Name: [Freelancer Name]
Title: [Freelancer Title]
Date: ________________

Do not use any repetitive signature blocks or multiple signature sections.`;

    // If no API key available, return a mock contract
    if (!process.env.GROQ_API_KEY) {
      return res.json({ contract: `<div class="contract-document">
        <h1 class="contract-section">Mock Contract</h1>
        <p class="contract-paragraph">This is a mock contract for testing purposes. In production, this would contain real AI-generated content based on your clauses.</p>
        <h2 class="contract-subsection">Clauses</h2>
        <p class="contract-paragraph">${clauses.join('<br><br>')}</p>
        <h2 class="contract-subsection">Signatures</h2>
        <p class="contract-paragraph">
          <div>Client: <div class="signature-line"></div></div>
          <div>Date: <div class="signature-line"></div></div>
          <br>
          <div>Contractor: <div class="signature-line"></div></div>
          <div>Date: <div class="signature-line"></div></div>
        </p>
      </div>` });
    }

    // Call Groq AI API to generate contract
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a legal expert specializing in drafting professional contracts. Your output is meticulously formatted, legally sound, and comprehensive."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama3-70b-8192"
    });

    // Get the generated contract
    const contractText = completion.choices[0].message.content;

    // Function to clean up duplicate signature blocks that AI sometimes generates
    const cleanupDuplicateSignatures = (text) => {
      const signatureSectionRegex = /## Signatures.*?(?=##|$)/gs;
      const matches = text.match(signatureSectionRegex);
      
      if (matches && matches.length > 1) {
        // Keep only the first signature section
        return text.replace(signatureSectionRegex, (match, index) => {
          return index === 0 ? match : '';
        });
      }
      
      return text;
    };
    
    // Convert markdown to HTML while preserving formatting
    const markdownToHTML = (markdown) => {
      // Clean up any model artifacts
      let cleaned = markdown.replace(/\.scalablytypedassistant<\|endheaderid\|>/g, '');
      cleaned = cleaned.replace(/\.scalablytypedassistant<\|endheader_id\|>/g, '');
      
      // Pre-process the markdown to improve spacing
      // Add consistent spacing before headings for better section separation
      cleaned = cleaned.replace(/([^\n])\n# /g, '$1\n\n# ');
      cleaned = cleaned.replace(/([^\n])\n## /g, '$1\n\n## ');
      cleaned = cleaned.replace(/([^\n])\n### /g, '$1\n\n### ');
      
      // Ensure there's a line after headings
      cleaned = cleaned.replace(/# (.*?)(\n[^#\n])/g, '# $1\n$2');
      cleaned = cleaned.replace(/## (.*?)(\n[^#\n])/g, '## $1\n$2');
      cleaned = cleaned.replace(/### (.*?)(\n[^#\n])/g, '### $1\n$2');
      
      // Handle bold text (both ** and __ syntax)
      let html = cleaned.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
      
      // Handle italic text (both * and _ syntax)
      html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
      
      // Handle headers - add the section class for better styling
      html = html.replace(/^# (.*?)$/gm, '<h1 class="contract-section">$1</h1>\n');
      html = html.replace(/^## (.*?)$/gm, '<h2 class="contract-subsection">$1</h2>\n');
      html = html.replace(/^### (.*?)$/gm, '<h3 class="contract-subsubsection">$1</h3>\n');
      
      // Handle numbered lists
      html = html.replace(/^(\d+)\. (.*?)$/gm, (match, number, content) => {
        // Start a new ordered list if previous line wasn't a list item
        const prevLine = html.split(match)[0].split('\n').pop();
        const isNewList = !prevLine || !prevLine.match(/^(\d+)\. /);
        
        return isNewList 
          ? `<ol><li>${content}</li>` 
          : `<li>${content}</li>`;
      });
      
      // Close ordered lists
      html = html.replace(/<\/li>\n(?!<li>)/g, '</li></ol>\n');
      
      // Handle bullet lists
      html = html.replace(/^- (.*?)$/gm, (match, content) => {
        // Start a new unordered list if previous line wasn't a list item
        const prevLine = html.split(match)[0].split('\n').pop();
        const isNewList = !prevLine || !prevLine.match(/^- /);
        
        return isNewList 
          ? `<ul><li>${content}</li>` 
          : `<li>${content}</li>`;
      });
      
      // Close unordered lists
      html = html.replace(/<\/li>\n(?!<li>)/g, '</li></ul>\n');
      
      // Handle signature lines with underscores
      html = html.replace(/^_{10,}$/gm, '<div class="signature-line"></div>');
      html = html.replace(/\_\_\_\_\_\_\_\_\_\_+/g, '<div class="signature-line"></div>');
      
      // Create proper signature lines for common patterns
      html = html.replace(/^(Name|Signature|Title|Date|Client|Freelancer|Contractor):\s*\_+$/gm, 
                         '<div>$1: <div class="signature-line"></div></div>');
      html = html.replace(/^(Name|Signature|Title|Date|Client|Freelancer|Contractor):\s*\_*\s*$/gm, 
                         '<div>$1: <div class="signature-line"></div></div>');
      html = html.replace(/^(Name|Signature|Title|Date|Client|Freelancer|Contractor):\s*$/gm, 
                         '<div>$1: <div class="signature-line"></div></div>');
      
      // Handle paragraphs - improve spacing
      // First convert double newlines to paragraph breaks
      html = html.replace(/\n\n+/g, '</p><p class="contract-paragraph">');
      
      // Handle line breaks, but ensure spacing after headings
      html = html.replace(/\n/g, '<br>');
      
      // Add additional spacing after headings
      html = html.replace(/<\/h1>\n<br>/g, '</h1>');
      html = html.replace(/<\/h2>\n<br>/g, '</h2>');
      html = html.replace(/<\/h3>\n<br>/g, '</h3>');
      
      // Wrap in a div with proper styling
      return `<div class="contract-document"><p class="contract-paragraph">${html}</p></div>`;
    };
    
    // Clean and convert markdown to HTML
    const cleanedContract = cleanupDuplicateSignatures(contractText);
    
    res.json({ contract: markdownToHTML(cleanedContract) });
  } catch (error) {
    console.error('Error generating contract:', error);
    res.status(500).json({ message: 'Failed to generate contract', error: error.message });
  }
};

// Get AI suggestions for clauses
exports.getSuggestions = async (req, res) => {
  try {
    const { documentType, userClauses, language = 'English' } = req.body;
    
    if (!documentType || !userClauses || !userClauses.length) {
      return res.status(400).json({ 
        message: 'Missing required fields: documentType and userClauses are required'
      });
    }

    // For development, use mock data if no API key
    if (!process.env.GROQ_API_KEY) {
      // Mock AI suggestions for development
      const suggestions = generateMockSuggestions(documentType, userClauses, language);
      return res.status(200).json({ suggestions });
    }

    // Format the prompt for the AI to generate contextual suggestions
    const prompt = `Generate relevant additional clause suggestions for a ${documentType} contract based on the following existing clauses.

Existing clauses:
${userClauses.map((clause, index) => `${index + 1}. ${clause.title}: ${clause.content}`).join('\n')}

Based on these clauses, suggest 3-4 additional clauses that would complement the contract. These should be clauses that are missing but would be important to include for this type of document.

For the ${documentType} document type, think about common industry-standard clauses that would make this document more comprehensive and legally sound.

Output should be formatted as a JSON array with each object containing:
- title: The title of the suggested clause
- content: The detailed clause content

Each suggestion should be specific, legally appropriate, and contextually relevant to the existing clauses.`;

    // Call Groq API for suggestions
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a legal expert specializing in contract drafting. You provide legally sound, contextually appropriate clause suggestions for various types of contracts. Your suggestions should be detailed and professionally written."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama3-70b-8192",
      response_format: { type: "json_object" }
    });

    // Parse the response to get suggestions
    const responseContent = completion.choices[0].message.content;
    let parsedResponse;
    
    try {
      parsedResponse = JSON.parse(responseContent);
      // Ensure the response has a suggestions array
      if (!parsedResponse.suggestions && Array.isArray(parsedResponse)) {
        parsedResponse = { suggestions: parsedResponse };
      } else if (!parsedResponse.suggestions) {
        // If no suggestions array and not an array itself, create one
        parsedResponse = { suggestions: [] };
      }
    } catch (error) {
      console.error('Error parsing JSON response for suggestions:', error);
      return res.status(500).json({ message: 'Error processing AI suggestions' });
    }

    res.status(200).json(parsedResponse);
  } catch (error) {
    console.error('Error getting AI suggestions:', error);
    res.status(500).json({ 
      message: 'Error generating AI suggestions', 
      error: error.message 
    });
  }
};

// Generate document from template and clauses
exports.generateDocument = async (req, res) => {
  try {
    const { templateId, userClauses, aiSuggestions, language = 'English' } = req.body;
    
    if (!templateId || !userClauses) {
      return res.status(400).json({ 
        message: 'Missing required fields: templateId and userClauses are required'
      });
    }
    
    // Find the template
    const template = await Template.findById(templateId);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Generate the document content by replacing placeholders in the template
    let documentContent = template.content;
    
    // Combine user clauses and selected AI suggestions
    const allClauses = [
      ...userClauses,
      ...(aiSuggestions?.filter(suggestion => suggestion.used) || [])
    ];
    
    // Replace placeholders with actual clauses
    template.placeholders.forEach(placeholder => {
      const clause = allClauses.find(c => c.title === placeholder.key);
      if (clause) {
        documentContent = documentContent.replace(
          new RegExp(`\\{\\{${placeholder.key}\\}\\}`, 'g'), 
          clause.content
        );
      }
    });
    
    res.status(200).json({ 
      documentContent,
      documentType: template.documentType,
      language
    });
  } catch (error) {
    console.error('Error generating document:', error);
    res.status(500).json({ 
      message: 'Error generating document', 
      error: error.message 
    });
  }
};

// Helper function to generate mock AI suggestions for development
function generateMockSuggestions(documentType, userClauses, language) {
  const suggestions = [];
  
  switch (documentType) {
    case 'NDA':
      suggestions.push({
        title: 'Confidentiality Clause',
        content: 'Both parties agree to maintain strict confidentiality of all information shared during the course of this agreement. Confidential Information includes but is not limited to business plans, financial data, customer lists, and technical specifications.'
      });
      suggestions.push({
        title: 'Term of Confidentiality',
        content: 'The confidentiality obligations under this agreement shall remain in effect for a period of five (5) years from the Effective Date, regardless of whether this Agreement is terminated earlier.'
      });
      break;
      
    case 'Lease Agreement':
      suggestions.push({
        title: 'Maintenance Responsibility',
        content: 'Tenant shall be responsible for routine maintenance and minor repairs. Landlord shall be responsible for major repairs and structural maintenance of the property.'
      });
      suggestions.push({
        title: 'Late Payment Clause',
        content: 'If rent is not received by the 5th day of the month, Tenant agrees to pay a late fee of $50, plus $10 for each additional day until full payment is received.'
      });
      break;
      
    case 'Employment Contract':
      suggestions.push({
        title: 'Non-Compete Clause',
        content: 'For a period of one (1) year after termination of employment, Employee shall not engage in any business activity that directly competes with Employer within a 50-mile radius of Employer\'s principal place of business.'
      });
      suggestions.push({
        title: 'Intellectual Property Rights',
        content: 'Any inventions, designs, improvements, or intellectual property created by Employee during the course of employment shall be the sole property of Employer.'
      });
      break;
      
    default:
      suggestions.push({
        title: 'General Indemnification',
        content: 'Each party agrees to indemnify and hold harmless the other party from any claims, damages, or liabilities arising from the indemnifying party\'s breach of this Agreement.'
      });
  }
  
  return suggestions;
}

// Helper function to generate mock risk analysis for development
function generateMockRiskAnalysis(clauses) {
  const riskLevels = ['low', 'medium', 'high'];
  return clauses.map((clause, index) => {
    const randomRiskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
    
    const risks = [];
    const suggestions = [];
    
    if (clause.title.toLowerCase().includes('confidential')) {
      risks.push('No definition of what constitutes confidential information');
      risks.push('No exceptions for publicly available information');
      suggestions.push('Clearly define what specific information is considered confidential');
      suggestions.push('Add exceptions for information that becomes publicly available through no fault of the receiving party');
    } else if (clause.title.toLowerCase().includes('payment')) {
      risks.push('No specific payment terms or methods defined');
      risks.push('No consequences for late payment beyond fees');
      suggestions.push('Specify acceptable payment methods and detailed terms');
      suggestions.push('Include right to suspend services if payment is significantly delayed');
    } else if (clause.title.toLowerCase().includes('termination')) {
      risks.push('No notice period for termination specified');
      risks.push('No provisions for handling ongoing obligations after termination');
      suggestions.push('Add clear notice period requirements for termination');
      suggestions.push('Specify which obligations survive termination of the agreement');
    } else {
      // Generic risks for any other clause type
      risks.push('Vague or ambiguous language could lead to different interpretations');
      risks.push('Missing specific details that could be important in a dispute');
      suggestions.push('Use more specific and precise language to avoid ambiguity');
      suggestions.push('Include more detailed provisions to cover potential edge cases');
    }
    
    return {
      clauseIndex: index,
      riskLevel: randomRiskLevel,
      risks: risks,
      suggestions: suggestions
    };
  });
}

module.exports = { 
  analyzeRisks: exports.analyzeRisks, 
  getSuggestions: exports.getSuggestions, 
  generateDocument: exports.generateDocument, 
  generateContract: exports.generateContract 
}; 