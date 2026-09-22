import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import PortalAluno from './pages/PortalAluno';
import AdminDashboard from './pages/AdminDashboard';
import Checkout from './pages/Checkout';
import AgendarAula from './pages/AgendarAula';

// Componente auxiliar para interceptar cliques nos links do index.html estático
function GlobalLinkInterceptor() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (target && target.href) {
        const url = new URL(target.href);
        // Se for um link interno (mesmo domínio) e não for âncora (#)
        if (url.origin === window.location.origin && !target.getAttribute('href')?.startsWith('#')) {
          e.preventDefault();
          navigate(url.pathname + url.search); // Mantém a query string
        }
      }
    };

    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, [navigate]);

  return null;
}

function App() {
  return (
    <Router>
      <GlobalLinkInterceptor />
      <Routes>
        <Route path="/" element={null} />
        <Route path="/portal" element={<PortalAluno />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/agendar" element={<AgendarAula />} />
      </Routes>
    </Router>
  );
}

export default App;
