const Contract = require('../models/Contract');
const { generatePDF } = require('../utils/pdfGenerator');

// Get all contracts
exports.getContracts = async (req, res) => {
  try {
    const contracts = await Contract.find().sort({ createdAt: -1 });
    res.status(200).json(contracts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contracts', error: error.message });
  }
};

// Get a single contract by ID
exports.getContractById = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    
    res.status(200).json(contract);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contract', error: error.message });
  }
};

// Create a new contract
exports.createContract = async (req, res) => {
  try {
    const { title, documentType, userClauses, aiSuggestions, finalContent, language, jurisdiction } = req.body;
    
    const newContract = new Contract({
      title,
      documentType,
      userClauses,
      aiSuggestions,
      finalContent,
      language,
      jurisdiction
    });
    
    const savedContract = await newContract.save();
    res.status(201).json(savedContract);
  } catch (error) {
    res.status(500).json({ message: 'Error creating contract', error: error.message });
  }
};

// Update a contract
exports.updateContract = async (req, res) => {
  try {
    const { title, documentType, userClauses, aiSuggestions, finalContent, language, jurisdiction } = req.body;
    
    const updatedContract = await Contract.findByIdAndUpdate(
      req.params.id,
      {
        title,
        documentType,
        userClauses,
        aiSuggestions,
        finalContent,
        language,
        jurisdiction,
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    if (!updatedContract) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    
    res.status(200).json(updatedContract);
  } catch (error) {
    res.status(500).json({ message: 'Error updating contract', error: error.message });
  }
};

// Delete a contract
exports.deleteContract = async (req, res) => {
  try {
    const deletedContract = await Contract.findByIdAndDelete(req.params.id);
    
    if (!deletedContract) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    
    res.status(200).json({ message: 'Contract deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting contract', error: error.message });
  }
};

// Download contract as PDF
exports.downloadContractPDF = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    
    const pdfBuffer = await generatePDF(
      contract.finalContent,
      contract.title,
      contract.documentType
    );
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${contract.title.replace(/\s+/g, '_')}.pdf`,
      'Content-Length': pdfBuffer.length
    });
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error downloading contract PDF:', error);
    res.status(500).json({ message: 'Error generating PDF', error: error.message });
  }
}; 