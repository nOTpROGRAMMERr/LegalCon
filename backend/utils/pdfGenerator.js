const pdf = require('html-pdf');
const path = require('path');
const fs = require('fs');

/**
 * Generates a PDF document from contract content
 * 
 * @param {string} content - The document content in HTML format
 * @param {string} title - The title of the document
 * @param {string} documentType - The type of the document (e.g., 'NDA', 'Lease Agreement')
 * @returns {Promise<Buffer>} - A promise that resolves to a PDF buffer
 */
async function generatePDF(content, title, documentType) {
  return new Promise((resolve, reject) => {
    try {
      // Create header with title and document type
      const headerHtml = `
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="margin-bottom: 10px; font-size: 24px;">${title}</h1>
          <p style="color: #666; font-size: 16px;">Document Type: ${documentType}</p>
          <p style="font-size: 14px;">Date: ${new Date().toLocaleDateString()}</p>
          <hr style="margin-top: 20px; margin-bottom: 30px;">
        </div>
      `;

      // Combine header and content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            body {
              font-family: 'Times New Roman', Times, serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 20px;
            }
            h1, h2, h3, h4, h5, h6 {
              color: #000;
              margin-top: 20px;
              margin-bottom: 10px;
            }
            p {
              margin-bottom: 15px;
            }
            .page-break {
              page-break-after: always;
            }
            ul, ol {
              margin-bottom: 15px;
            }
          </style>
        </head>
        <body>
          ${headerHtml}
          ${content}
        </body>
        </html>
      `;

      // PDF generation options
      const options = {
        format: 'Letter',
        border: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        },
        footer: {
          height: '28mm',
          contents: {
            default: '<div style="text-align: center; font-size: 10px; color: #666;">Page {{page}} of {{pages}}</div>'
          }
        }
      };

      // Generate PDF from HTML
      pdf.create(htmlContent, options).toBuffer((err, buffer) => {
        if (err) {
          console.error('Error creating PDF:', err);
          reject(err);
          return;
        }
        
        resolve(buffer);
      });
    } catch (error) {
      console.error('Error in PDF generation:', error);
      reject(error);
    }
  });
}

module.exports = { generatePDF }; 