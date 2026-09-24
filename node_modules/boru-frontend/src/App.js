import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import PortalAluno from './pages/PortalAluno';
import AdminDashboard from './pages/AdminDashboard';
import Checkout from './pages/Checkout';
import AgendarAula from './pages/AgendarAula';
// Componente auxiliar para interceptar cliques nos links do index.html estático
function GlobalLinkInterceptor() {
    const navigate = useNavigate();
    useEffect(() => {
        const handleLinkClick = (e) => {
            const target = e.target.closest('a');
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
        }
        else {
            document.body.classList.remove('react-active');
        }
    }, [isLandingPage]);
    return null;
}
function App() {
    return (_jsxs(Router, { children: [_jsx(GlobalLinkInterceptor, {}), _jsx(BodyClassManager, {}), _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: null }), _jsx(Route, { path: "/portal", element: _jsx(PortalAluno, {}) }), _jsx(Route, { path: "/admin", element: _jsx(AdminDashboard, {}) }), _jsx(Route, { path: "/checkout", element: _jsx(Checkout, {}) }), _jsx(Route, { path: "/agendar", element: _jsx(AgendarAula, {}) })] })] }));
}
export default App;
//# sourceMappingURL=App.js.map