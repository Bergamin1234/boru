import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';

const PortalAluno = lazy(() => import('./pages/PortalAluno'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Checkout = lazy(() => import('./pages/Checkout'));
const AgendarAula = lazy(() => import('./pages/AgendarAula'));

function RouteLoadingFallback() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0B0C] text-zinc-200">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-red-600/30 border-t-red-600 animate-spin" />
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
          Carregando BORÜ...
        </span>
      </div>
    </div>
  );
}

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

function BodyClassManager() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/' || location.pathname === '';

  useEffect(() => {
    if (!isLandingPage) {
      document.body.classList.add('react-active');
    } else {
      document.body.classList.remove('react-active');
    }
  }, [isLandingPage]);

  return null;
}

function SpeedInsightsTracker() {
  const location = useLocation();
  return <SpeedInsights route={location.pathname} />;
}

function App() {
  return (
    <Router>
      <GlobalLinkInterceptor />
      <BodyClassManager />
      <SpeedInsightsTracker />
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route path="/" element={null} />
          <Route path="/portal" element={<PortalAluno />} />
          <Route path="/ranking" element={<PortalAluno />} />
          <Route path="/dashboard-lutador" element={<PortalAluno />} />
          <Route path="/torneios" element={<PortalAluno />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/agendar" element={<AgendarAula />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
