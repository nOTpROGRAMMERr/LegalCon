import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, Button, Box, Grid, Paper } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TranslateIcon from '@mui/icons-material/Translate';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

const Home = () => {
  return (
    <Container maxWidth="lg">
      {/* Hero Section */}
      <Box 
        sx={{ 
          textAlign: 'center', 
          py: 8
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          AI-Powered Legal Documents
        </Typography>
        <Typography variant="h5" color="textSecondary" paragraph>
          Create professional legal documents with the help of artificial intelligence.
          Our platform helps you draft contracts, agreements and legal documents quickly and efficiently.
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large" 
            component={Link} 
            to="/create"
            sx={{ mr: 2 }}
          >
            Get Started
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            size="large" 
            component={Link} 
            to="/contracts"
          >
            View My Contracts
          </Button>
        </Box>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 8 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ mb: 6 }}>
          Key Features
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                transition: 'transform 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)'
                }
              }}
            >
              <DescriptionIcon color="primary" sx={{ fontSize: 50, mb: 2 }} />
              <Typography variant="h6" component="h3" gutterBottom align="center">
                Pre-Saved Templates
              </Typography>
              <Typography align="center">
                Choose from a variety of professional legal templates for different document types.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                transition: 'transform 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)'
                }
              }}
            >
              <SmartToyIcon color="primary" sx={{ fontSize: 50, mb: 2 }} />
              <Typography variant="h6" component="h3" gutterBottom align="center">
                AI Recommendations
              </Typography>
              <Typography align="center">
                Get intelligent clause suggestions based on your specific requirements.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                transition: 'transform 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)'
                }
              }}
            >
              <TranslateIcon color="primary" sx={{ fontSize: 50, mb: 2 }} />
              <Typography variant="h6" component="h3" gutterBottom align="center">
                Multilingual Support
              </Typography>
              <Typography align="center">
                Create legal documents in multiple languages to meet your needs.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                transition: 'transform 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)'
                }
              }}
            >
              <PictureAsPdfIcon color="primary" sx={{ fontSize: 50, mb: 2 }} />
              <Typography variant="h6" component="h3" gutterBottom align="center">
                PDF Export
              </Typography>
              <Typography align="center">
                Download your finalized documents as professional PDFs for easy sharing.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Call to Action */}
      <Box 
        sx={{ 
          bgcolor: 'primary.main', 
          color: 'white', 
          textAlign: 'center', 
          p: 6, 
          borderRadius: 2,
          mb: 8 
        }}
      >
        <Typography variant="h4" component="h2" gutterBottom>
          Ready to create your legal document?
        </Typography>
        <Typography paragraph sx={{ mb: 4, maxWidth: 700, mx: 'auto' }}>
          Start drafting your contract today with our AI-powered platform and save time on legal paperwork.
        </Typography>
        <Button 
          variant="contained" 
          color="secondary" 
          size="large" 
          component={Link} 
          to="/create"
          sx={{ 
            px: 4, 
            py: 1.5,
            backgroundColor: 'white',
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)'
            }
          }}
        >
          Create Now
        </Button>
      </Box>
    </Container>
  );
};

export default Home; 