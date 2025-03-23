import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import pages
import Home from './pages/Home';
import ContractForm from './pages/ContractForm';
import ContractPreview from './pages/ContractPreview';
import ContractsList from './pages/ContractsList';

// Import components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<ContractForm />} />
            <Route path="/edit/:id" element={<ContractForm />} />
            <Route path="/preview/:id" element={<ContractPreview />} />
            <Route path="/contracts" element={<ContractsList />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
