import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CalculadoraShopee from './pages/CalculadoraMarketplaces';
import CalculadoraReversa from './pages/CalculadoraReversa';
import VendaDireta from './pages/VendaDireta';

// Componente para Proteger Rotas (Auth + Assinatura)
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('custos_token');
    const status = localStorage.getItem('custos_user_status');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (status !== 'active') {
        return <Navigate to="/signup?checkout=required" replace />;
    }

    return children;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                
                {/* Rotas Protegidas */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/shopee" element={<ProtectedRoute><CalculadoraShopee /></ProtectedRoute>} />
                <Route path="/reversa" element={<ProtectedRoute><CalculadoraReversa /></ProtectedRoute>} />
                <Route path="/direta" element={<ProtectedRoute><VendaDireta /></ProtectedRoute>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;