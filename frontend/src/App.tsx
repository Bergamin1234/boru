import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PortalAluno from './pages/PortalAluno';

function App() {
  return (
    <Router>
      <Routes>
        {/* A rota principal "/" retorna null para exibir o HTML estático do site */}
        <Route path="/" element={null} />
        {/* A rota "/portal" renderiza a Área do Aluno */}
        <Route path="/portal" element={<PortalAluno />} />
      </Routes>
    </Router>
  );
}

export default App;
