import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Alert,
  Snackbar,
  Tab,
  Tabs,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import WarningIcon from '@mui/icons-material/Warning';
import { getAiSuggestions, createContract, generateContractWithAI, getContractById, updateContract, analyzeContractRisks } from '../services/api';

const ContractForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [language, setLanguage] = useState('English');
  const [jurisdiction, setJurisdiction] = useState('');
  const [userClauses, setUserClauses] = useState([{ title: '', content: '' }]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [error, setError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [aiGeneratedContract, setAiGeneratedContract] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [finalContent, setFinalContent] = useState('');
  const [riskAnalysis, setRiskAnalysis] = useState([]);
  const [analyzingRisks, setAnalyzingRisks] = useState(false);
  const [previewTab, setPreviewTab] = useState(0);

  // List of Indian states for the jurisdiction dropdown
  const indianStates = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    'Andaman and Nicobar Islands',
    'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Jammu and Kashmir',
    'Ladakh',
    'Lakshadweep',
    'Puducherry'
  ];

  // Fetch contract data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchContract = async () => {
        setLoading(true);
        try {
          const contractData = await getContractById(id);
          setTitle(contractData.title);
          setDocumentType(contractData.documentType);
          setLanguage(contractData.language || 'English');
          setJurisdiction(contractData.jurisdiction || '');
          setUserClauses(contractData.userClauses || [{ title: '', content: '' }]);
          setAiSuggestions(contractData.aiSuggestions || []);
          setFinalContent(contractData.finalContent || '');
        } catch (error) {
          setError('Error fetching contract data');
          setSnackbarOpen(true);
        } finally {
          setLoading(false);
        }
      };

      fetchContract();
    }
  }, [id, isEditMode]);

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

  // Analyze clauses for risks
  const analyzeClauseRisks = async () => {
    if (userClauses.some(clause => !clause.title)) {
      setError('Please fill in all clause titles before analyzing risks');
      setSnackbarOpen(true);
      return;
    }

    setAnalyzingRisks(true);
    try {
      const response = await analyzeContractRisks(userClauses, language);
      setRiskAnalysis(response.riskAnalysis);
    } catch (error) {
      setError('Error analyzing clause risks');
      setSnackbarOpen(true);
    } finally {
      setAnalyzingRisks(false);
    }
  };

  // Get AI suggestions
  const getAISuggestions = async () => {
    if (!documentType) {
      setError('Please select a document type');
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
    if (!title || !documentType || userClauses.some(clause => !clause.title)) {
      setError('Please provide a title, document type, and clause titles');
      setSnackbarOpen(true);
      return;
    }

    setGeneratingAI(true);
    try {
      // Format clauses for AI
      const formattedClauses = userClauses.map(clause => 
        `${clause.title}: ${clause.content || '[Please generate content for this clause]'}`
      );
      
      // Add selected AI suggestions if any
      const selectedSuggestions = aiSuggestions.filter(s => s.used);
      if (selectedSuggestions.length > 0) {
        selectedSuggestions.forEach(suggestion => {
          formattedClauses.push(`${suggestion.title}: ${suggestion.content}`);
        });
      }

      // Generate contract using AI
      const response = await generateContractWithAI(formattedClauses, language, jurisdiction);
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
      setGeneratingAI(true);
      // Save the contract
      const contractData = {
        title,
        documentType,
        userClauses,
        aiSuggestions: aiSuggestions.filter(s => s.used),
        finalContent,
        language,
        jurisdiction
      };

      let savedContract;
      if (isEditMode) {
        savedContract = await updateContract(id, contractData);
      } else {
        savedContract = await createContract(contractData);
      }
      
      setPreviewOpen(false);
      
      // Analyze the generated contract for risks if not already done
      if (riskAnalysis.length === 0) {
        analyzeClauseRisks();
      }
      
      navigate(`/preview/${savedContract._id}`);
    } catch (error) {
      setError('Error saving contract');
      setSnackbarOpen(true);
    } finally {
      setGeneratingAI(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditMode ? 'Edit Legal Document' : 'Create Legal Document'}
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" paragraph>
          {isEditMode 
            ? 'Modify the details below to update your legal document.' 
            : 'Fill in the details below to create your legal document. Our AI will provide suggestions based on your input.'}
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
                  <MenuItem value="Hindi">Hindi</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Jurisdiction</InputLabel>
                <Select
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                >
                  <MenuItem value="">Select a jurisdiction</MenuItem>
                  {indianStates.map((state) => (
                    <MenuItem key={state} value={state}>
                      India - {state}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>The legal jurisdiction under which this document will be governed</FormHelperText>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {isEditMode ? (
          <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Edit Contract Content
            </Typography>
            <Box 
              sx={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 1, 
                p: 2, 
                minHeight: '400px',
                backgroundColor: '#fff',
                overflowY: 'auto'
              }}
            >
              <div 
                dangerouslySetInnerHTML={{ __html: finalContent }} 
                contentEditable={true}
                style={{ minHeight: '400px' }}
                onBlur={(e) => setFinalContent(e.target.innerHTML)}
              />
            </Box>
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => {
                  const contractData = {
                    title,
                    documentType,
                    userClauses,
                    aiSuggestions,
                    finalContent,
                    language
                  };
                  
                  setGeneratingAI(true);
                  updateContract(id, contractData)
                    .then(savedContract => {
                      navigate(`/preview/${savedContract._id}`);
                    })
                    .catch(err => {
                      setError('Error updating contract');
                      setSnackbarOpen(true);
                    })
                    .finally(() => {
                      setGeneratingAI(false);
                    });
                }}
                disabled={generatingAI || !title || !documentType}
                startIcon={generatingAI && <CircularProgress size={24} color="inherit" />}
                sx={{ minWidth: 200 }}
              >
                {generatingAI ? 'Updating...' : 'Update Contract'}
              </Button>
            </Box>
          </Paper>
        ) : (
          <>
            <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={0} aria-label="contract generation method">
                  <Tab label="AI-Powered Generation" />
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
                        multiline
                        rows={4}
                        margin="normal"
                      />
                    </Grid>
                  </Grid>
                </Box>
              ))}

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={getAISuggestions}
                  disabled={loading || !documentType || userClauses.some(clause => !clause.title)}
                  startIcon={loading && <CircularProgress size={20} color="inherit" />}
                  sx={{ mr: 2 }}
                >
                  {loading ? 'Getting Suggestions...' : 'Get AI Suggestions'}
                </Button>
                <Button
                  variant="contained"
                  color="warning"
                  onClick={analyzeClauseRisks}
                  disabled={analyzingRisks || userClauses.some(clause => !clause.title)}
                  startIcon={analyzingRisks ? <CircularProgress size={20} color="inherit" /> : <WarningIcon />}
                >
                  {analyzingRisks ? 'Analyzing...' : 'Analyze Risks'}
                </Button>
              </Box>
            </Paper>

            {/* Risk Analysis Section */}
            {!isEditMode && riskAnalysis.length > 0 && (
              <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Risk Analysis
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  The following risks were identified in your clauses:
                </Typography>
                
                {riskAnalysis.map((analysis) => {
                  const clause = userClauses[analysis.clauseIndex];
                  let chipColor = 'success';
                  
                  if (analysis.riskLevel === 'medium') {
                    chipColor = 'warning';
                  } else if (analysis.riskLevel === 'high') {
                    chipColor = 'error';
                  }
                  
                  return (
                    <Box 
                      key={analysis.clauseIndex} 
                      sx={{ 
                        mb: 3, 
                        p: 2, 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 2,
                        backgroundColor: 'rgba(0, 0, 0, 0.02)' 
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {clause.title}
                        </Typography>
                        <Chip 
                          label={analysis.riskLevel.toUpperCase()} 
                          color={chipColor}
                          size="small"
                        />
                      </Box>
                          
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Original clause:
                        </Typography>
                        <Typography variant="body2" sx={{ backgroundColor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                          {clause.content}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Identified risks:
                      </Typography>
                      <ul style={{ marginTop: 8, marginBottom: 16 }}>
                        {analysis.risks.map((risk, index) => (
                          <li key={index}>
                            <Typography variant="body2">{risk}</Typography>
                          </li>
                        ))}
                      </ul>
                      
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Suggestions for improvement:
                      </Typography>
                      <ul style={{ marginTop: 8 }}>
                        {analysis.suggestions.map((suggestion, index) => (
                          <li key={index}>
                            <Typography variant="body2">{suggestion}</Typography>
                          </li>
                        ))}
                      </ul>
                    </Box>
                  );
                })}
              </Paper>
            )}

            {/* AI Suggestions Section */}
            {aiSuggestions.length > 0 && (
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

              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleGenerateAIContract}
                  disabled={generatingAI || !title || !documentType || userClauses.some(clause => !clause.title)}
                  startIcon={generatingAI && <CircularProgress size={24} color="inherit" />}
                  sx={{ minWidth: 200 }}
                >
                  {generatingAI ? 'Generating...' : 'Generate with AI'}
                </Button>
              </Box>
            </>
          )}

        {/* Preview Dialog */}
        <Dialog 
          open={previewOpen} 
          onClose={() => setPreviewOpen(false)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>Preview Generated Contract</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={previewTab} onChange={(e, newValue) => setPreviewTab(newValue)}>
                <Tab label="AI Suggestions" />
                <Tab label="Final Document" />
              </Tabs>
            </Box>

            {previewTab === 0 ? (
              <Box role="tabpanel" hidden={previewTab !== 0} sx={{ mt: 2, overflow: 'auto', maxHeight: '500px' }}>
                {aiSuggestions.length > 0 ? (
                  aiSuggestions.map((suggestion, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        mb: 2, 
                        p: 1, 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 1,
                        backgroundColor: suggestion.used ? 'rgba(63, 81, 181, 0.08)' : 'transparent',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {suggestion.title}
                        </Typography>
                        <Chip
                          label={suggestion.used ? "Selected" : "Select"}
                          color={suggestion.used ? "primary" : "default"}
                          onClick={() => toggleSuggestion(index)}
                          size="small"
                          clickable
                        />
                      </Box>
                      <Typography variant="body2">
                        {suggestion.content}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No suggestions available. Click "Get AI Suggestions" before generating to see suggestions.
                  </Typography>
                )}
              </Box>
            ) : (
              <Box role="tabpanel" hidden={previewTab !== 1} sx={{ mt: 2, overflow: 'auto', maxHeight: '500px' }}>
                <div dangerouslySetInnerHTML={{ __html: aiGeneratedContract }} />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={saveAIGeneratedContract}
              disabled={generatingAI}
              startIcon={generatingAI && <CircularProgress size={20} color="inherit" />}
            >
              {generatingAI ? 'Saving...' : 'Save Contract'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for errors and notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
        >
          <Alert 
            onClose={() => setSnackbarOpen(false)} 
            severity="error" 
            sx={{ width: '100%' }}
          >
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default ContractForm; 