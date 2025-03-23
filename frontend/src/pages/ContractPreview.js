import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Divider,
  Alert,
  Snackbar,
  Chip
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getContractById, getContractPdf } from '../services/api';

const ContractPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const data = await getContractById(id);
        setContract(data);
      } catch (error) {
        setError('Error fetching contract');
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [id]);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const pdfBlob = await getContractPdf(id);
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([pdfBlob]));
      
      // Create a temporary link element to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${contract.title.replace(/\s+/g, '_')}.pdf`);
      
      // Append to body, click, and clean up
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Release the object URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Error downloading PDF');
      setSnackbarOpen(true);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!contract) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Alert severity="error">Contract not found</Alert>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/contracts')}
            sx={{ mt: 2 }}
          >
            Back to Contracts
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1">
              {contract.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip label={contract.documentType} color="primary" size="small" />
              <Chip label={contract.language} size="small" />
            </Box>
          </Box>
          
          <Box>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/contracts')}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/edit/${id}`)}
              sx={{ mr: 1 }}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={downloading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
              onClick={handleDownloadPdf}
              disabled={downloading}
            >
              {downloading ? 'Downloading...' : 'Download PDF'}
            </Button>
          </Box>
        </Box>

        <Paper elevation={3} sx={{ p: 4, mt: 3, mb: 4 }}>
          {contract.finalContent && contract.finalContent.includes('<div class="contract-document">') ? (
            <div dangerouslySetInnerHTML={{ __html: contract.finalContent }} />
          ) : (
            <Box className="document-preview" sx={{ 
              fontFamily: 'Georgia, serif',
              fontSize: '16px',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap'
            }}>
              {contract.finalContent}
            </Box>
          )}
        </Paper>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Document Details
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              User Clauses
            </Typography>
            {contract.userClauses.map((clause, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {clause.title}
                </Typography>
                <Typography variant="body1">
                  {clause.content}
                </Typography>
              </Box>
            ))}
          </Paper>

          {contract.aiSuggestions && contract.aiSuggestions.length > 0 && (
            <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                AI Suggestions Used
              </Typography>
              {contract.aiSuggestions
                .filter(suggestion => suggestion.used)
                .map((suggestion, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {suggestion.title}
                    </Typography>
                    <Typography variant="body1">
                      {suggestion.content}
                    </Typography>
                  </Box>
                ))}
            </Paper>
          )}
        </Box>
      </Box>

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

export default ContractPreview; 