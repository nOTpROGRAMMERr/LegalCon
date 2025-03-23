import axios from 'axios';

// Dynamically determine the API URL
// Use environment variable if available
// Otherwise, try to use the current device's hostname but fallback to localhost if needed
const API_URL = process.env.REACT_APP_API_URL || `https://legalcon-dvlb.onrender.com/api`;
//const API_URL = process.env.REACT_APP_API_URL || `http://localhost:5000/api`;
console.log('API URL:', API_URL); // Log the API URL for debugging

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Contract API calls
export const getContracts = async () => {
  try {
    const response = await api.get('/contracts');
    return response.data;
  } catch (error) {
    console.error('Error fetching contracts:', error);
    throw error;
  }
};

export const getContractById = async (id) => {
  try {
    const response = await api.get(`/contracts/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching contract with ID ${id}:`, error);
    throw error;
  }
};

export const createContract = async (contractData) => {
  try {
    const response = await api.post('/contracts', contractData);
    return response.data;
  } catch (error) {
    console.error('Error creating contract:', error);
    throw error;
  }
};

export const updateContract = async (id, contractData) => {
  try {
    const response = await api.put(`/contracts/${id}`, contractData);
    return response.data;
  } catch (error) {
    console.error(`Error updating contract with ID ${id}:`, error);
    throw error;
  }
};

export const deleteContract = async (id) => {
  try {
    const response = await api.delete(`/contracts/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting contract with ID ${id}:`, error);
    throw error;
  }
};

// Template API calls
export const getTemplates = async () => {
  try {
    const response = await api.get('/templates');
    return response.data;
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
};

export const getTemplatesByType = async (type) => {
  try {
    const response = await api.get(`/templates/type/${type}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching templates of type ${type}:`, error);
    throw error;
  }
};

export const getTemplateById = async (id) => {
  try {
    const response = await api.get(`/templates/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching template with ID ${id}:`, error);
    throw error;
  }
};

// AI API calls
export const getAiSuggestions = async (data) => {
  try {
    const response = await api.post('/ai/suggest', data);
    return response.data;
  } catch (error) {
    console.error('Error getting AI suggestions:', error);
    throw error;
  }
};

export const generateDocument = async (data) => {
  try {
    const response = await api.post('/ai/generate', data);
    return response.data;
  } catch (error) {
    console.error('Error generating document:', error);
    throw error;
  }
};

// Generate contract directly using AI
export const generateContractWithAI = async (clauses, language = 'English', jurisdiction = '') => {
  try {
    const response = await api.post('/ai/generate-contract', { clauses, language, jurisdiction });
    return response.data;
  } catch (error) {
    console.error('Error generating contract with AI:', error);
    throw error;
  }
};

// Analyze contract clauses for risks
export const analyzeContractRisks = async (clauses, language = 'English') => {
  try {
    const response = await api.post('/ai/analyze-risks', { clauses, language });
    return response.data;
  } catch (error) {
    console.error('Error analyzing contract risks:', error);
    throw error;
  }
};

// PDF download
export const getContractPdf = async (id) => {
  try {
    const response = await api.get(`/contracts/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error(`Error downloading PDF for contract with ID ${id}:`, error);
    throw error;
  }
};
