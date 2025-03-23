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
    const { clauses, language = 'English' } = req.body;
    
    if (!clauses || clauses.length === 0) {
      return res.status(400).json({ 
        message: 'Missing required fields: clauses are required'
      });
    }

    // For development, use mock data if no API key
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'mock-key-for-development') {
      const mockRiskAnalysis = generateMockRiskAnalysis(clauses);
      return res.status(200).json({ riskAnalysis: mockRiskAnalysis });
    }

    // Language-specific instructions
    const languageInstruction = language === 'Hindi' 
      ? 'Analyze the contract clauses and provide risk analysis in Hindi language. Use proper Hindi legal terminology.' 
      : '';

    // Format the prompt for the AI
    const prompt = `${languageInstruction}
Analyze the following contract clauses for potential legal, business, and compliance risks. For each clause, provide:
1. Risk Level (High, Medium, Low)
2. Risk Description
3. Suggested Improvements

${language === 'Hindi' ? 'Provide all risk descriptions and suggestions in Hindi.' : ''}

Here are the clauses:

${clauses.map((clause, index) => `CLAUSE ${index + 1}: ${clause.title}
${clause.content || '[Empty content - This clause has no content specified]'}
`).join('\n')}

Your response must be formatted as a JSON array (not an object containing an array) with the following exact structure:
[
  {
    "clauseIndex": 0,
    "riskLevel": "medium",
    "risks": [
      "Risk description 1",
      "Risk description 2"
    ],
    "suggestions": [
      "Suggestion 1",
      "Suggestion 2"
    ]
  },
  {
    "clauseIndex": 1,
    "riskLevel": "low",
    "risks": [
      "Risk description 1"
    ],
    "suggestions": [
      "Suggestion 1"
    ]
  }
]

Important: Your response must be a direct JSON array, NOT an object containing an array.
- clauseIndex must be the numeric index of the clause (starting from 0)
- riskLevel must be exactly "high", "medium", or "low" (lowercase)
- risks must be an array of strings
- suggestions must be an array of strings

For clauses with empty content, analyze based on the title and suggest appropriate content.

Your analysis should be detailed but concise, focusing on practical improvements.`;

    // Call Groq API for analysis
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a legal expert specializing in contract risk analysis. Provide thorough, accurate risk assessments and practical improvement suggestions for contract clauses. Always format your response exactly as requested in JSON format. Your output should be a direct JSON array of risk analysis objects, not an object containing an array."
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
      
      // Validate that the response is an array
      if (!Array.isArray(parsedResponse)) {
        // If the response has a riskAnalysis key
        if (parsedResponse?.riskAnalysis && Array.isArray(parsedResponse.riskAnalysis)) {
          return res.status(200).json({ riskAnalysis: parsedResponse.riskAnalysis });
        }
        
        console.error('Invalid response format, using mock data instead:', parsedResponse);
        const mockRiskAnalysis = generateMockRiskAnalysis(clauses);
        return res.status(200).json({ riskAnalysis: mockRiskAnalysis });
      }
      
      // Return the risk analysis
      res.status(200).json({ riskAnalysis: parsedResponse });
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      console.error('Raw response content:', responseContent);
      
      // Use mock data if parsing fails
      const mockRiskAnalysis = generateMockRiskAnalysis(clauses);
      return res.status(200).json({ riskAnalysis: mockRiskAnalysis });
    }
  } catch (error) {
    console.error('Error analyzing risks:', error);
    
    // Use mock data on error for a better user experience
    const mockRiskAnalysis = generateMockRiskAnalysis(clauses);
    return res.status(200).json({ riskAnalysis: mockRiskAnalysis });
  }
};

// Generate contract directly using Groq AI
exports.generateContract = async (req, res) => {
  try {
    const { clauses, language = 'English', jurisdiction = '' } = req.body;
    
    if (!clauses || clauses.length === 0) {
      return res.status(400).json({ 
        message: 'Missing required fields: clauses are required'
      });
    }

    // Format the prompt for the AI
    const languageInstruction = language === 'Hindi' 
      ? 'Generate a professional contract in Hindi language. Use proper Hindi legal terminology.' 
      : '';

    const jurisdictionInstruction = jurisdiction
      ? `This contract is governed by the laws of ${jurisdiction}. Please ensure the contract complies with the legal requirements of this jurisdiction.`
      : '';

    const prompt = `${languageInstruction}
${jurisdictionInstruction}
Generate a professional contract based on the following clauses:
${clauses.join('\n')}

IMPORTANT: Check whether the clauses are legally compliant under the jurisdiction of ${jurisdiction}. If yes proceed else give warning.

Please format this as a complete, legally-formatted contract with appropriate sections, 
including but not limited to parties involved, terms, conditions, and signature blocks.

${jurisdiction ? `Include a governing law clause specifying ${jurisdiction} as the jurisdiction.` : ''}

IMPORTANT: Start directly with the contract title or header. DO NOT include any introduction, explanation, or context sentences like "Here is a comprehensive contract draft..." or "I have prepared a contract...".

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
          content: "You are a legal expert specializing in drafting professional contracts. Your output is meticulously formatted, legally sound, and comprehensive. Always start contracts directly with the title or header, without any introductory text or explanation. Never include phrases like 'Here is a contract...' or 'I have prepared...' in your output."
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
    const cleanedContract = cleanupDuplicateSignatures(contractText);
    
    const markdownToHTML = (markdown) => {
      // Clean up any model artifacts
      let cleaned = markdown.replace(/\.scalablytypedassistant<\|endheaderid\|>/g, '');
      cleaned = cleaned.replace(/\.scalablytypedassistant<\|endheader_id\|>/g, '');
      
      // Remove introductory sentences that the AI sometimes adds
      cleaned = cleaned.replace(/^Here is a .*?(?=\n\n|#)/s, '');
      cleaned = cleaned.replace(/^I have .*?(?=\n\n|#)/s, '');
      cleaned = cleaned.replace(/^Below is .*?(?=\n\n|#)/s, '');
      cleaned = cleaned.replace(/^The following .*?(?=\n\n|#)/s, '');
      cleaned = cleaned.replace(/^This is .*?(?=\n\n|#)/s, '');
      
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
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'mock-key-for-development') {
      // Mock AI suggestions for development
      const suggestions = generateMockSuggestions(documentType, userClauses, language);
      return res.status(200).json({ suggestions });
    }

    // Language-specific instructions
    const languageInstruction = language === 'Hindi' 
      ? `Generate suggestions in Hindi language. Use proper Hindi legal terminology for a ${documentType} contract.`
      : '';

    // Format the prompt for the AI to generate contextual suggestions
    const prompt = `${languageInstruction}
Generate relevant additional clause suggestions for a ${documentType} contract based on the following existing clauses.

Existing clauses:
${userClauses.map((clause, index) => `${index + 1}. ${clause.title}: ${clause.content}`).join('\n')}

Based on these clauses, suggest 3-4 additional clauses that would complement the contract. These should be clauses that are missing but would be important to include for this type of document.

For the ${documentType} document type, think about common industry-standard clauses that would make this document more comprehensive and legally sound.

${language === 'Hindi' ? 'Please provide all suggestions in Hindi language.' : ''}

Your response must be a JSON object with the following exact structure:
{
  "suggestions": [
    {
      "title": "First Suggested Clause Title",
      "content": "Detailed content for the first suggested clause"
    },
    {
      "title": "Second Suggested Clause Title",
      "content": "Detailed content for the second suggested clause"
    },
    ...
  ]
}

Each suggestion should be specific, legally appropriate, and contextually relevant to the existing clauses.`;

    // Call Groq API for suggestions
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a legal expert specializing in drafting professional contracts. Your output is meticulously formatted, legally sound, and comprehensive. Always follow the requested JSON format exactly as specified."
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
      
      // Ensure we have an array in the response
      if (!Array.isArray(parsedResponse?.suggestions)) {
        // If response has a suggestions key but it's not an array
        if (parsedResponse?.suggestions) {
          console.log('Unexpected response format:', parsedResponse);
          // Try to use the suggestions property
          return res.status(200).json({ suggestions: parsedResponse.suggestions });
        }
        
        // If response doesn't have a suggestions array but is itself an array
        if (Array.isArray(parsedResponse)) {
          console.log('Response is an array but not in suggestions key:', parsedResponse);
          return res.status(200).json({ suggestions: parsedResponse });
        }
        
        // If it's an object with properties that look like suggestions
        if (parsedResponse && typeof parsedResponse === 'object') {
          // Check if it looks like it contains suggestion objects
          const possibleSuggestions = Object.values(parsedResponse).filter(item => 
            typeof item === 'object' && item.title && item.content
          );
          
          if (possibleSuggestions.length > 0) {
            console.log('Extracted suggestion-like objects:', possibleSuggestions);
            return res.status(200).json({ suggestions: possibleSuggestions });
          }
        }
        
        // Fallback to mock data since response format is unexpected
        console.error('Invalid response format, using mock data instead:', parsedResponse);
        const mockSuggestions = generateMockSuggestions(documentType, userClauses, language);
        return res.status(200).json({ suggestions: mockSuggestions });
      }
      
      // Valid array found in suggestions key
      return res.status(200).json({ suggestions: parsedResponse.suggestions });
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      console.error('Raw response content:', responseContent);
      
      // Use mock data if parsing fails
      const mockSuggestions = generateMockSuggestions(documentType, userClauses, language);
      return res.status(200).json({ suggestions: mockSuggestions });
    }
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({ message: 'Failed to get suggestions', error: error.message });
  }
};

// Function to generate substantive mock risk analysis data for development
const generateMockRiskAnalysis = (clauses) => {
  // Define common clause risk patterns for more realistic mock data
  const clauseRiskPatterns = {
    // Termination related clauses
    'termination': {
      riskLevel: 'high',
      risks: [
        'Termination conditions are vague and could lead to disputes about when termination is justified',
        'No notice period specified for termination, creating uncertainty for both parties',
        'No distinction between termination for cause and termination for convenience',
        'No clear process for handling pending obligations upon termination'
      ],
      suggestions: [
        'Clearly define what constitutes grounds for termination (e.g., material breach, bankruptcy, etc.)',
        'Specify a notice period (e.g., 30 days written notice) for termination without cause',
        'Include provisions for pending work, payments, and transition assistance post-termination',
        'Consider adding a cure period for breaches that can be remedied'
      ]
    },
    
    // Confidentiality related clauses
    'confidential': {
      riskLevel: 'medium',
      risks: [
        'Definition of confidential information is too broad or too narrow',
        'No specified duration for confidentiality obligations after agreement ends',
        'Inadequate exceptions to confidentiality (e.g., publicly available information)',
        'No provisions for handling data breaches or unauthorized disclosures'
      ],
      suggestions: [
        'Clearly define what constitutes confidential information with specific examples',
        'Specify a reasonable time period for confidentiality obligations post-termination',
        'Include standard exceptions (public domain, independently developed, legally required disclosures)',
        'Add notification requirements for potential or actual breaches'
      ]
    },
    
    // Payment related clauses
    'payment': {
      riskLevel: 'medium',
      risks: [
        'Payment terms lack specific due dates or payment methods',
        'No consequences specified for late payments',
        'Currency and tax responsibilities are not clearly defined',
        'No provisions for disputing incorrect invoices'
      ],
      suggestions: [
        'Clearly state payment due dates, acceptable payment methods, and currency',
        'Include late payment penalties or interest provisions',
        'Specify which party bears responsibility for taxes and fees',
        'Add a process for disputing charges within a specific timeframe'
      ]
    },
    
    // Liability related clauses
    'liability': {
      riskLevel: 'high',
      risks: [
        'Limitation of liability may be too broad to be enforceable',
        'No distinction between direct and consequential damages',
        'No liability cap or the cap is unreasonably low/high',
        'Exclusions may be unenforceable in some jurisdictions'
      ],
      suggestions: [
        'Make liability limitations mutual and reasonable',
        'Clearly define what constitutes direct vs. indirect/consequential damages',
        'Consider a liability cap tied to contract value or insurance limits',
        'Review exclusions for enforceability in relevant jurisdictions'
      ]
    },
    
    // Intellectual property related clauses
    'intellectual property': {
      riskLevel: 'high',
      risks: [
        'Unclear ownership of newly created intellectual property',
        'No provisions for pre-existing IP used in deliverables',
        'Insufficient protection against third-party IP claims',
        'No provisions for open source software usage'
      ],
      suggestions: [
        'Clearly define ownership rights for all created materials',
        'Include license provisions for pre-existing IP incorporated into deliverables',
        'Add mutual indemnification for third-party IP claims',
        'Address open source software usage and compliance requirements'
      ]
    },
    
    // Indemnification related clauses
    'indemnification': {
      riskLevel: 'medium',
      risks: [
        'Indemnification obligations are one-sided',
        'Scope of indemnified claims is too broad or unclear',
        'No defined process for handling indemnified claims',
        'No cap on indemnification obligations'
      ],
      suggestions: [
        'Make indemnification provisions reciprocal where appropriate',
        'Clearly define types of claims subject to indemnification',
        'Include notification requirements and cooperation procedures',
        'Consider reasonable caps on indemnification obligations'
      ]
    },
    
    // Default catch-all for other clauses
    'default': {
      riskLevel: 'medium',
      risks: [
        'Clause language is vague and open to multiple interpretations',
        'Key terms are undefined or inconsistently used',
        'Clause may conflict with other provisions in the agreement',
        'Regulatory compliance issues may exist in certain jurisdictions'
      ],
      suggestions: [
        'Use clear, specific language with defined terms',
        'Ensure consistent terminology throughout the agreement',
        'Review the entire agreement for potential conflicts',
        'Consider jurisdiction-specific requirements'
      ]
    }
  };
  
  return clauses.map((clause, index) => {
    const title = clause.title?.toLowerCase() || '';
    const content = clause.content?.toLowerCase() || '';
    
    // Determine which pattern to use based on clause title and content
    let pattern = clauseRiskPatterns.default;
    
    // Check for matching patterns
    Object.entries(clauseRiskPatterns).forEach(([key, value]) => {
      if (key !== 'default' && (title.includes(key) || content.includes(key))) {
        pattern = value;
      }
    });
    
    // For empty content clauses, always return high risk
    if (!clause.content || clause.content.trim() === '') {
      return {
        clauseIndex: index,
        riskLevel: 'high',
        risks: [
          `The "${clause.title}" clause has no content`,
          'Empty clauses create significant contractual gaps',
          'May render related provisions unenforceable'
        ],
        suggestions: [
          `Add comprehensive content to the "${clause.title}" clause`,
          'Include all necessary terms and conditions',
          'Consider consulting standard templates for this type of clause'
        ]
      };
    }
    
    // For very short clauses (less than 15 words), return high risk
    if (clause.content && clause.content.split(' ').length < 15) {
      return {
        clauseIndex: index,
        riskLevel: 'high',
        risks: [
          `The "${clause.title}" clause is too brief and lacks detail`,
          'Insufficient detail increases risk of misinterpretation and disputes',
          'Critical elements may be missing from this clause'
        ],
        suggestions: [
          `Expand the "${clause.title}" clause to address all relevant aspects`,
          'Include specific terms, conditions, and exceptions',
          'Add details about implementation and enforcement'
        ]
      };
    }
    
    // Return analysis based on matched pattern
    return {
      clauseIndex: index,
      riskLevel: pattern.riskLevel,
      risks: pattern.risks.slice(0, 3), // Use up to 3 risks from the pattern
      suggestions: pattern.suggestions.slice(0, 3) // Use up to 3 suggestions from the pattern
    };
  });
};

// Function to generate mock suggestions for development
const generateMockSuggestions = (documentType, userClauses, language) => {
  // Create a set of possible clauses based on document type
  const possibleClauses = {
    'NDA': [
      {
        title: 'Definition of Confidential Information',
        content: 'For the purpose of this Agreement, "Confidential Information" shall mean any and all non-public information, including, without limitation, technical, developmental, marketing, sales, operating, performance, cost, know-how, business plans, business methods, and process information which is disclosed by one party to the other.'
      },
      {
        title: 'Term of Confidentiality',
        content: 'The obligations of confidentiality and non-use contained herein shall survive the termination of this Agreement for a period of five (5) years from the date of such termination.'
      },
      {
        title: 'Return of Materials',
        content: 'Upon termination of this Agreement or upon request from the Disclosing Party, the Receiving Party shall promptly return all original materials provided by the Disclosing Party and any copies, notes or other documents in the Receiving Party\'s possession pertaining to the Confidential Information.'
      }
    ],
    'Employment': [
      {
        title: 'Probationary Period',
        content: 'The first ninety (90) days of employment shall constitute a probationary period during which the Employee may be terminated at any time without notice or cause.'
      },
      {
        title: 'Intellectual Property Assignment',
        content: 'Employee agrees that all inventions, improvements, products, designs, specifications, trademarks, service marks, discoveries, formulae, processes, software or computer programs, modifications, ideas, concepts, any other intellectual property, or any matter whatsoever (collectively referred to as "Intellectual Property") that Employee conceives, creates or develops, whether alone or in conjunction with others, during working hours or his/her employment with the Company, shall be the sole and exclusive property of the Company.'
      },
      {
        title: 'Severance',
        content: 'In the event of termination of employment by the Company without cause, Employee shall receive severance pay equal to one (1) month\'s salary for each year of service completed, up to a maximum of six (6) months.'
      }
    ],
    'Service': [
      {
        title: 'Service Level Agreement',
        content: 'The Service Provider guarantees a monthly uptime of 99.9%. Any downtime exceeding this threshold will result in service credits as follows: 1% credit for each hour of downtime, up to a maximum of 100% of the monthly fee.'
      },
      {
        title: 'Limitation of Liability',
        content: 'In no event shall Service Provider be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service.'
      },
      {
        title: 'Support and Maintenance',
        content: 'Service Provider shall provide technical support via email and phone during normal business hours (9 AM - 5 PM Eastern Time, Monday through Friday, excluding holidays). Response time for critical issues shall not exceed four (4) hours.'
      }
    ],
    'default': [
      {
        title: 'Force Majeure',
        content: 'Neither party shall be liable for any failure to perform its obligations under this Agreement if such failure results from circumstances beyond that party\'s reasonable control, including but not limited to acts of God, natural disasters, war, civil disturbance, or government actions.'
      },
      {
        title: 'Dispute Resolution',
        content: 'Any dispute arising out of or in connection with this Agreement shall be settled by binding arbitration in accordance with the rules of [Arbitration Association]. The arbitration shall take place in [City, State/Country] and shall be conducted in the English language.'
      },
      {
        title: 'Entire Agreement',
        content: 'This Agreement constitutes the entire understanding between the parties concerning the subject matter hereof and supersedes all prior agreements, understandings, or negotiations.'
      },
      {
        title: 'Governing Law',
        content: 'This Agreement shall be governed by and construed in accordance with the laws of [State/Country], without regard to its conflict of law principles.'
      }
    ]
  };

  // Get clauses specific to the document type or use default
  const typeSpecificClauses = possibleClauses[documentType] || possibleClauses['default'];
  
  // Filter out clauses that are already included in userClauses by title comparison
  const userClauseTitles = userClauses.map(clause => clause.title?.toLowerCase());
  const filteredClauses = typeSpecificClauses.filter(
    clause => !userClauseTitles.includes(clause.title.toLowerCase())
  );
  
  // Return up to 3 suggestions (fewer if less available)
  return filteredClauses.slice(0, 3);
};

// Generate document from template and clauses
exports.generateDocument = async (req, res) => {
  try {
    const { templateId, clauses } = req.body;
    
    if (!templateId || !clauses || clauses.length === 0) {
      return res.status(400).json({ 
        message: 'Missing required fields: templateId and clauses are required'
      });
    }
    
    // Find the template
    const template = await Template.findById(templateId);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Create a new contract using the template and clauses
    const contract = new Contract({
      title: req.body.title || 'Untitled Contract',
      template: template._id,
      clauses: clauses
    });

    // Save the contract
    await contract.save();

    // Return the newly created contract
    res.status(201).json({ 
      message: 'Contract generated successfully',
      contract 
    });
  } catch (error) {
    console.error('Error generating document:', error);
    res.status(500).json({ message: 'Failed to generate document', error: error.message });
  }
}; 