const axios = require('axios');
const Contract = require('../models/Contract');
const Template = require('../models/Template');
const { Groq } = require('groq-sdk');
// Get AI suggestions for clauses

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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

    // Call the AI model
    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: 'You are a professional contract drafter with legal expertise. Create detailed, professional contracts based on the provided clauses. Always format signature blocks in a clean, professional way without repetition. Avoid generating duplicate signature sections.'
        },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3, // Lower temperature for more consistent outputs
      max_tokens: 4000, // Ensure we have enough tokens for a complete contract
    });

    const contractText = completion.choices[0]?.message?.content || 'Error generating contract';
    
    // Function to clean up duplicate signature sections
    const cleanupDuplicateSignatures = (text) => {
      // Find the first occurrence of a signature section
      const signatureSectionPatterns = [
        /## Signatures?/i,
        /IN WITNESS WHEREOF/i,
        /The parties have executed this Agreement/i,
        /AGREED AND ACCEPTED:/i
      ];
      
      let firstSignatureIndex = -1;
      
      // Find the first occurrence of any signature pattern
      for (const pattern of signatureSectionPatterns) {
        const match = text.match(pattern);
        if (match && match.index) {
          if (firstSignatureIndex === -1 || match.index < firstSignatureIndex) {
            firstSignatureIndex = match.index;
          }
        }
      }
      
      // If we found a signature section, keep only the content up to that point 
      // plus that signature section
      if (firstSignatureIndex !== -1) {
        // Get everything before the signature section
        const beforeSignature = text.substring(0, firstSignatureIndex);
        
        // Find the signature section and include only one complete signature block
        const remainingText = text.substring(firstSignatureIndex);
        const lines = remainingText.split('\n');
        
        let signatureSection = [];
        let hasClientSignature = false;
        let hasFreelancerSignature = false;
        
        // Collect lines until we have both signature blocks
        for (const line of lines) {
          signatureSection.push(line);
          
          if (line.match(/client|customer/i) && line.match(/name|signature|sign/i)) {
            hasClientSignature = true;
          }
          if (line.match(/freelancer|contractor|provider/i) && line.match(/name|signature|sign/i)) {
            hasFreelancerSignature = true;
          }
          
          // If we have both signature blocks, stop collecting lines
          if (hasClientSignature && hasFreelancerSignature && signatureSection.length > 10) {
            break;
          }
        }
        
        // Add extra signature lines if needed
        if (!hasClientSignature || !hasFreelancerSignature) {
          signatureSection.push('\n**Client:**\n\n________________________\nName: \nTitle: \nDate: ________________\n');
          signatureSection.push('\n**Freelancer/Contractor:**\n\n________________________\nName: \nTitle: \nDate: ________________');
        }
        
        // Join the cleaned signature section
        return beforeSignature + signatureSection.join('\n');
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

    // Mock AI API call (in a real implementation, this would be a call to an actual AI service)
    // In a production environment, replace this with an actual API call to your AI model
    // const aiResponse = await axios.post(process.env.AI_API_URL, {
    //   documentType,
    //   userClauses,
    //   language
    // });
    
    // Mock AI suggestions for development
    const suggestions = generateMockSuggestions(documentType, userClauses, language);

    res.status(200).json({ suggestions });
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