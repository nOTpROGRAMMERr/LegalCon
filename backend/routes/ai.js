const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// POST get AI suggestions for clauses
router.post('/suggest', aiController.getSuggestions);

// POST generate document from template and clauses
router.post('/generate', aiController.generateDocument);

// POST generate contract directly from clauses using AI
router.post('/generate-contract', aiController.generateContract);

module.exports = router; 