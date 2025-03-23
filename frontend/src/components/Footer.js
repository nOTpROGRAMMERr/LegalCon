import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[900],
        color: 'white',
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" align="center">
          © {new Date().getFullYear()} LegalDrafts AI - AI-generated legal drafts and contracts
        </Typography>
        <Typography variant="body2" align="center" sx={{ mt: 1 }}>
          <Link color="inherit" href="#" sx={{ mx: 1 }}>
            Terms of Service
          </Link>
          {' | '}
          <Link color="inherit" href="#" sx={{ mx: 1 }}>
            Privacy Policy
          </Link>
          {' | '}
          <Link color="inherit" href="#" sx={{ mx: 1 }}>
            Contact Us
          </Link>
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer; 