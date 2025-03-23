import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Chip,
  TablePagination
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { getContracts, deleteContract, getContractPdf } from '../services/api';

const ContractsList = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [downloading, setDownloading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const data = await getContracts();
        setContracts(data);
      } catch (error) {
        setError('Error fetching contracts');
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteClick = (contract) => {
    setContractToDelete(contract);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteContract(contractToDelete._id);
      setContracts(contracts.filter(contract => contract._id !== contractToDelete._id));
      setDeleteDialogOpen(false);
      setContractToDelete(null);
    } catch (error) {
      setError('Error deleting contract');
      setSnackbarOpen(true);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setContractToDelete(null);
  };

  const handleDownloadPdf = async (id, title) => {
    setDownloading(true);
    setDownloadingId(id);
    try {
      const pdfBlob = await getContractPdf(id);
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([pdfBlob]));
      
      // Create a temporary link element to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title.replace(/\s+/g, '_')}.pdf`);
      
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
      setDownloadingId(null);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            My Contracts
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            component={Link}
            to="/create"
          >
            Create New Contract
          </Button>
        </Box>

        {contracts.length === 0 ? (
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No contracts found
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              You haven't created any contracts yet. Click the button above to create your first contract.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              component={Link}
              to="/create"
              sx={{ mt: 2 }}
            >
              Create First Contract
            </Button>
          </Paper>
        ) : (
          <Paper elevation={3}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><Typography variant="subtitle2">Title</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2">Type</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2">Language</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2">Created</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2">Actions</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contracts
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((contract) => (
                      <TableRow key={contract._id} hover>
                        <TableCell>
                          <Typography variant="body1" component={Link} to={`/preview/${contract._id}`} sx={{ 
                            color: 'primary.main', 
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' } 
                          }}>
                            {contract.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={contract.documentType} size="small" />
                        </TableCell>
                        <TableCell>{contract.language}</TableCell>
                        <TableCell>{formatDate(contract.createdAt)}</TableCell>
                        <TableCell>
                          <IconButton
                            color="primary"
                            onClick={() => navigate(`/preview/${contract._id}`)}
                            title="View"
                            size="small"
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton
                            color="primary"
                            onClick={() => handleDownloadPdf(contract._id, contract.title)}
                            disabled={downloading && downloadingId === contract._id}
                            title="Download PDF"
                            size="small"
                          >
                            {downloading && downloadingId === contract._id ? (
                              <CircularProgress size={20} />
                            ) : (
                              <DownloadIcon />
                            )}
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteClick(contract)}
                            title="Delete"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={contracts.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </Paper>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Contract</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the contract 
            <strong>{contractToDelete && ` "${contractToDelete.title}"`}</strong>? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
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

export default ContractsList; 