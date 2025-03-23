const mongoose = require('mongoose');

const ContractSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  documentType: {
    type: String,
    required: true,
    enum: ['NDA', 'Lease Agreement', 'Employment Contract', 'Service Agreement', 'Other']
  },
  userClauses: [{
    title: String,
    content: String
  }],
  aiSuggestions: [{
    title: String,
    content: String,
    used: {
      type: Boolean,
      default: false
    }
  }],
  finalContent: {
    type: String
  },
  language: {
    type: String,
    default: 'English'
  },
  jurisdiction: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Contract', ContractSchema); 