import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context & UI
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Layout, ProtectedRoute } from './components/layout/Layout';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { InventarioGerencial } from './pages/InventarioGerencial';
import { InventarioOperativo } from './pages/InventarioOperativo';

import { ConfiguracionMaestros } from './pages/ConfiguracionMaestros';
import { Ingresos } from './pages/Ingresos';

import { UIProvider } from './context/UIContext';
import { UiEditorPanel } from './components/ui/UiEditorPanel';



export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <UIProvider>
          <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#fff', fontSize: '14px', borderRadius: '12px' } }} />
          <UiEditorPanel />
          
          <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/inventario-gerencial" element={
              <ProtectedRoute roles={['gerente_stock', 'admin', 'operario_stock', 'administrativo_stock', 'atencion']}>
                <Layout><InventarioGerencial /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/inventario-operativo" element={
              <ProtectedRoute roles={['gerente_stock', 'admin', 'operario', 'operario_stock', 'atencion']}>
                <Layout><InventarioOperativo /></Layout>
              </ProtectedRoute>
            } />
            
            


            <Route path="/configuracion-maestros" element={
              <ProtectedRoute roles={['gerente_stock', 'admin', 'administrativo_stock']}>
                <Layout><ConfiguracionMaestros /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/ingresos" element={
              <ProtectedRoute roles={['gerente_stock', 'admin', 'administrativo_stock']}>
                <Layout><Ingresos /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        </UIProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
