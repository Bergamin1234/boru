import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PortalAluno from './pages/PortalAluno';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={null} />
        <Route path="/portal" element={<PortalAluno />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
