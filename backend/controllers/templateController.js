const Template = require('../models/Template');

// Get all templates
exports.getTemplates = async (req, res) => {
  try {
    const templates = await Template.find().sort({ name: 1 });
    res.status(200).json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching templates', error: error.message });
  }
};

// Get templates by document type
exports.getTemplatesByType = async (req, res) => {
  try {
    const templates = await Template.find({ documentType: req.params.type });
    res.status(200).json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching templates', error: error.message });
  }
};

// Get a single template by ID
exports.getTemplateById = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    res.status(200).json(template);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching template', error: error.message });
  }
};

// Create a new template
exports.createTemplate = async (req, res) => {
  try {
    const { name, documentType, content, placeholders, language } = req.body;
    
    const newTemplate = new Template({
      name,
      documentType,
      content,
      placeholders,
      language
    });
    
    const savedTemplate = await newTemplate.save();
    res.status(201).json(savedTemplate);
  } catch (error) {
    res.status(500).json({ message: 'Error creating template', error: error.message });
  }
};

// Update a template
exports.updateTemplate = async (req, res) => {
  try {
    const { name, documentType, content, placeholders, language } = req.body;
    
    const updatedTemplate = await Template.findByIdAndUpdate(
      req.params.id,
      {
        name,
        documentType,
        content,
        placeholders,
        language,
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    if (!updatedTemplate) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    res.status(200).json(updatedTemplate);
  } catch (error) {
    res.status(500).json({ message: 'Error updating template', error: error.message });
  }
};

// Delete a template
exports.deleteTemplate = async (req, res) => {
  try {
    const deletedTemplate = await Template.findByIdAndDelete(req.params.id);
    
    if (!deletedTemplate) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    res.status(200).json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting template', error: error.message });
  }
}; 