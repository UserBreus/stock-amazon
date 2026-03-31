import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context & UI
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Layout, ProtectedRoute } from './components/layout/Layout';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { InventarioGerencial } from './pages/InventarioGerencial';
import { InventarioOperativo } from './pages/InventarioOperativo';
import { AnalisisProveedores } from './pages/AnalisisProveedores';
import { Importaciones } from './pages/Importaciones';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/inventario-gerencial" element={
              <ProtectedRoute roles={['admin', 'operario_stock']}>
                <Layout><InventarioGerencial /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/inventario-operativo" element={
              <ProtectedRoute roles={['admin', 'operario']}>
                <Layout><InventarioOperativo /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/analisis-proveedores" element={
              <ProtectedRoute roles={['admin']}>
                <Layout><AnalisisProveedores /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/importaciones" element={
              <ProtectedRoute roles={['admin']}>
                <Layout><Importaciones /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
