import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
          <Toaster 
            position="top-center" 
            toastOptions={{ 
              style: { 
                background: '#0f172a', 
                color: '#fff', 
                fontSize: '16px', 
                fontWeight: '900',
                padding: '16px 24px', 
                borderRadius: '16px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                border: '1px solid #1e293b',
                marginTop: '10vh'
              },
              error: {
                  style: {
                      background: '#450a0a',
                      color: '#fecaca',
                      border: '2px solid #dc2626',
                      boxShadow: '0 20px 25px -5px rgba(220, 38, 38, 0.3)'
                  },
                  iconTheme: { primary: '#ef4444', secondary: '#450a0a' }
              },
              success: {
                  style: {
                      background: '#022c22',
                      color: '#a7f3d0',
                      border: '2px solid #10b981',
                      boxShadow: '0 20px 25px -5px rgba(16, 185, 129, 0.3)'
                  },
                  iconTheme: { primary: '#10b981', secondary: '#022c22' }
              }
            }} 
          />
          <UiEditorPanel />
          
          <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <ProtectedRoute moduleId="sidebar_dashboard">
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/inventario-gerencial" element={
              <ProtectedRoute roles={['gerente_stock', 'admin', 'operario_stock', 'administrativo_stock', 'atencion']} moduleId="sidebar_inventario">
                <Layout><InventarioGerencial /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/inventario-operativo" element={
              <ProtectedRoute roles={['gerente_stock', 'admin', 'operario', 'operario_stock', 'atencion']} moduleId="sidebar_sectores">
                <Layout><InventarioOperativo /></Layout>
              </ProtectedRoute>
            } />
            
            


            <Route path="/configuracion-maestros" element={
              <ProtectedRoute roles={['gerente_stock', 'admin', 'administrativo_stock']} moduleId="sidebar_sistema">
                <Layout><ConfiguracionMaestros /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/ingresos" element={
              <ProtectedRoute roles={['gerente_stock', 'admin', 'administrativo_stock']} moduleId="sidebar_compras">
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
