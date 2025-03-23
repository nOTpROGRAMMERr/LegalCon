const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');

// GET all templates
router.get('/', templateController.getTemplates);

// GET templates by document type
router.get('/type/:type', templateController.getTemplatesByType);

// GET a single template by ID
router.get('/:id', templateController.getTemplateById);

// POST create a new template
router.post('/', templateController.createTemplate);

// PUT update a template
router.put('/:id', templateController.updateTemplate);

// DELETE a template
router.delete('/:id', templateController.deleteTemplate);

module.exports = router; 