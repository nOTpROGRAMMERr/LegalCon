const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  documentType: {
    type: String,
    required: true,
    enum: ['NDA', 'Lease Agreement', 'Employment Contract', 'Service Agreement', 'Other']
  },
  content: {
    type: String,
    required: true
  },
  placeholders: [{
    key: String,
    description: String
  }],
  language: {
    type: String,
    default: 'English'
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

module.exports = mongoose.model('Template', TemplateSchema); 