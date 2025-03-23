import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Grid,
  CircularProgress,
  IconButton,
  Chip,
  Divider,
  Alert,
  Snackbar,
  Tab,
  Tabs,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { getTemplates, getTemplatesByType, getAiSuggestions, generateDocument, createContract, generateContractWithAI } from '../services/api';

const ContractForm = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [language, setLanguage] = useState('English');
  const [userClauses, setUserClauses] = useState([{ title: '', content: '' }]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [error, setError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [aiGeneratedContract, setAiGeneratedContract] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [finalContent, setFinalContent] = useState('');

  // Fetch templates on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await getTemplates();
        setTemplates(data);
      } catch (error) {
        setError('Error fetching templates');
        setSnackbarOpen(true);
      }
    };

    fetchTemplates();
  }, []);

  // Fetch templates when document type changes
  useEffect(() => {
    if (documentType) {
      const fetchTemplatesByType = async () => {
        try {
          const data = await getTemplatesByType(documentType);
          setTemplates(data);
          if (data.length > 0) {
            setSelectedTemplate(data[0]._id);
          }
        } catch (error) {
          setError('Error fetching templates for the selected document type');
          setSnackbarOpen(true);
        }
      };

      fetchTemplatesByType();
    }
  }, [documentType]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle user clause changes
  const handleClauseChange = (index, field, value) => {
    const updatedClauses = [...userClauses];
    updatedClauses[index] = { ...updatedClauses[index], [field]: value };
    setUserClauses(updatedClauses);
  };

  // Add a new clause
  const addClause = () => {
    setUserClauses([...userClauses, { title: '', content: '' }]);
  };

  // Remove a clause
  const removeClause = (index) => {
    const updatedClauses = userClauses.filter((_, i) => i !== index);
    setUserClauses(updatedClauses);
  };

  // Toggle AI suggestion selection
  const toggleSuggestion = (index) => {
    const updatedSuggestions = [...aiSuggestions];
    updatedSuggestions[index] = {
      ...updatedSuggestions[index],
      used: !updatedSuggestions[index].used
    };
    setAiSuggestions(updatedSuggestions);
  };

  // Get AI suggestions
  const getAISuggestions = async () => {
    if (!documentType || userClauses.some(clause => !clause.title || !clause.content)) {
      setError('Please fill in all clause fields and select a document type');
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);
    try {
      const response = await getAiSuggestions({
        documentType,
        userClauses,
        language
      });

      setAiSuggestions(
        response.suggestions.map(suggestion => ({
          ...suggestion,
          used: false
        }))
      );
    } catch (error) {
      setError('Error getting AI suggestions');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Generate contract directly with AI
  const handleGenerateAIContract = async () => {
    if (!title || !documentType || userClauses.some(clause => !clause.title || !clause.content)) {
      setError('Please fill in all required fields');
      setSnackbarOpen(true);
      return;
    }

    setGeneratingAI(true);
    try {
      // Format clauses for AI
      const formattedClauses = userClauses.map(clause => 
        `${clause.title}: ${clause.content}`
      );

      // Generate contract using AI
      const response = await generateContractWithAI(formattedClauses);
      setAiGeneratedContract(response.contract);
      setFinalContent(response.contract);
      setPreviewOpen(true);
    } catch (error) {
      setError('Error generating contract with AI');
      setSnackbarOpen(true);
    } finally {
      setGeneratingAI(false);
    }
  };

  // Save AI generated contract
  const saveAIGeneratedContract = async () => {
    try {
      setGenerating(true);
      // Save the contract
      const contractData = {
        title,
        documentType,
        userClauses,
        aiSuggestions: aiSuggestions.filter(s => s.used),
        finalContent,
        language
      };

      const savedContract = await createContract(contractData);
      setPreviewOpen(false);
      navigate(`/preview/${savedContract._id}`);
    } catch (error) {
      setError('Error saving contract');
      setSnackbarOpen(true);
    } finally {
      setGenerating(false);
    }
  };

  // Generate and save contract using template
  const handleGenerateContract = async () => {
    if (!title || !documentType || !selectedTemplate || userClauses.some(clause => !clause.title || !clause.content)) {
      setError('Please fill in all required fields');
      setSnackbarOpen(true);
      return;
    }

    setGenerating(true);
    try {
      // Generate document content
      const generatedDoc = await generateDocument({
        templateId: selectedTemplate,
        userClauses,
        aiSuggestions,
        language
      });

      // Save the contract
      const contractData = {
        title,
        documentType,
        userClauses,
        aiSuggestions,
        finalContent: generatedDoc.documentContent,
        language
      };

      const savedContract = await createContract(contractData);
      navigate(`/preview/${savedContract._id}`);
    } catch (error) {
      setError('Error generating contract');
      setSnackbarOpen(true);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create Legal Document
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" paragraph>
          Fill in the details below to create your legal document. Our AI will provide suggestions based on your input.
        </Typography>

        <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Document Information
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Document Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Document Type</InputLabel>
                <Select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  required
                >
                  <MenuItem value="NDA">Non-Disclosure Agreement</MenuItem>
                  <MenuItem value="Lease Agreement">Lease Agreement</MenuItem>
                  <MenuItem value="Employment Contract">Employment Contract</MenuItem>
                  <MenuItem value="Service Agreement">Service Agreement</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Language</InputLabel>
                <Select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <MenuItem value="English">English</MenuItem>
                  <MenuItem value="Spanish">Spanish</MenuItem>
                  <MenuItem value="French">French</MenuItem>
                  <MenuItem value="German">German</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {activeTab === 0 && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Template</InputLabel>
                  <Select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    disabled={!documentType || templates.length === 0}
                    required
                  >
                    {templates.map((template) => (
                      <MenuItem key={template._id} value={template._id}>
                        {template.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </Paper>

        <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="contract generation method">
              <Tab label="Template-Based" />
              <Tab label="AI-Powered (No Template)" />
            </Tabs>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Your Clauses</Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={addClause}
              color="primary"
              variant="outlined"
            >
              Add Clause
            </Button>
          </Box>
          
          {userClauses.map((clause, index) => (
            <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={11}>
                  <TextField
                    fullWidth
                    label="Clause Title"
                    value={clause.title}
                    onChange={(e) => handleClauseChange(index, 'title', e.target.value)}
                    required
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={1}>
                  <IconButton
                    color="error"
                    onClick={() => removeClause(index)}
                    disabled={userClauses.length <= 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Clause Content"
                    value={clause.content}
                    onChange={(e) => handleClauseChange(index, 'content', e.target.value)}
                    required
                    multiline
                    rows={4}
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </Box>
          ))}

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            {activeTab === 0 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={getAISuggestions}
                disabled={loading || !documentType || userClauses.some(clause => !clause.title || !clause.content)}
                startIcon={loading && <CircularProgress size={20} color="inherit" />}
                sx={{ mr: 2 }}
              >
                {loading ? 'Getting Suggestions...' : 'Get AI Suggestions'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleGenerateAIContract}
                disabled={generatingAI || !title || !documentType || userClauses.some(clause => !clause.title || !clause.content)}
                startIcon={generatingAI && <CircularProgress size={20} color="inherit" />}
                sx={{ mr: 2 }}
              >
                {generatingAI ? 'Generating...' : 'Generate with AI'}
              </Button>
            )}
          </Box>
        </Paper>

        {activeTab === 0 && aiSuggestions.length > 0 && (
          <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              AI Suggestions
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Select the suggestions you want to include in your document:
            </Typography>
            
            {aiSuggestions.map((suggestion, index) => (
              <Box 
                key={index} 
                sx={{ 
                  mb: 3, 
                  p: 2, 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 2,
                  backgroundColor: suggestion.used ? 'rgba(63, 81, 181, 0.08)' : 'transparent',
                  transition: 'background-color 0.3s'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {suggestion.title}
                  </Typography>
                  <Chip
                    label={suggestion.used ? "Selected" : "Select"}
                    color={suggestion.used ? "primary" : "default"}
                    onClick={() => toggleSuggestion(index)}
                    clickable
                  />
                </Box>
                <Typography variant="body1">
                  {suggestion.content}
                </Typography>
              </Box>
            ))}
          </Paper>
        )}

        {activeTab === 0 && (
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleGenerateContract}
              disabled={generating || !title || !documentType || !selectedTemplate || userClauses.some(clause => !clause.title || !clause.content)}
              startIcon={generating && <CircularProgress size={24} color="inherit" />}
              sx={{ minWidth: 200 }}
            >
              {generating ? 'Generating...' : 'Generate & Save Contract'}
            </Button>
          </Box>
        )}
      </Box>

      {/* AI-Generated Contract Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        aria-labelledby="ai-contract-preview"
      >
        <DialogTitle id="ai-contract-preview">
          AI-Generated Contract Preview
        </DialogTitle>
        <DialogContent dividers>
          <div dangerouslySetInnerHTML={{ __html: aiGeneratedContract }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Cancel</Button>
          <Button 
            onClick={saveAIGeneratedContract} 
            color="primary" 
            variant="contained"
            disabled={generating}
            startIcon={generating && <CircularProgress size={20} color="inherit" />}
          >
            {generating ? 'Saving...' : 'Save Contract'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ContractForm; 