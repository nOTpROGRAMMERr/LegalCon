const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

/**
 * Generates a PDF document from contract content
 * 
 * @param {string} content - The document content in text format
 * @param {string} title - The title of the document
 * @param {string} documentType - The type of the document (e.g., 'NDA', 'Lease Agreement')
 * @returns {Promise<Buffer>} - A promise that resolves to a PDF buffer
 */
async function generatePDF(content, title, documentType) {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Add a new page
    const page = pdfDoc.addPage([600, 800]);
    
    // Get the standard font
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    
    // Set the font size
    const fontSize = 12;
    const titleSize = 18;
    const subtitleSize = 14;
    
    // Page dimensions
    const { width, height } = page.getSize();
    
    // Add title
    page.drawText(title, {
      x: 50,
      y: height - 50,
      size: titleSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Add document type
    page.drawText(`Document Type: ${documentType}`, {
      x: 50,
      y: height - 80,
      size: subtitleSize,
      font: boldFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    // Add date
    const today = new Date();
    page.drawText(`Date: ${today.toLocaleDateString()}`, {
      x: 50,
      y: height - 100,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Add a horizontal line
    page.drawLine({
      start: { x: 50, y: height - 120 },
      end: { x: width - 50, y: height - 120 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    
    // Split content into paragraphs and add to PDF
    const paragraphs = content.split('\n\n');
    let currentY = height - 150;
    
    for (const paragraph of paragraphs) {
      // Split paragraph into lines that fit the page width
      const words = paragraph.split(' ');
      let currentLine = '';
      
      for (const word of words) {
        const potentialLine = currentLine ? `${currentLine} ${word}` : word;
        const lineWidth = font.widthOfTextAtSize(potentialLine, fontSize);
        
        if (lineWidth < width - 100) {
          currentLine = potentialLine;
        } else {
          // Draw the current line and move to next line
          page.drawText(currentLine, {
            x: 50,
            y: currentY,
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0),
          });
          
          currentY -= fontSize + 5;
          currentLine = word;
          
          // Add a new page if needed
          if (currentY < 50) {
            const newPage = pdfDoc.addPage([600, 800]);
            currentY = height - 50;
          }
        }
      }
      
      // Draw the last line of the paragraph
      if (currentLine) {
        page.drawText(currentLine, {
          x: 50,
          y: currentY,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0),
        });
      }
      
      // Add space between paragraphs
      currentY -= fontSize * 2;
      
      // Add a new page if needed
      if (currentY < 50) {
        const newPage = pdfDoc.addPage([600, 800]);
        currentY = height - 50;
      }
    }
    
    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();
    
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

module.exports = { generatePDF }; 