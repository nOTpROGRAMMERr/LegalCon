const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');

// GET all contracts
router.get('/', contractController.getContracts);

// GET a single contract by ID
router.get('/:id', contractController.getContractById);

// GET download contract as PDF
router.get('/:id/pdf', contractController.downloadContractPDF);

// POST create a new contract
router.post('/', contractController.createContract);

// PUT update a contract
router.put('/:id', contractController.updateContract);

// DELETE a contract
router.delete('/:id', contractController.deleteContract);

module.exports = router; 