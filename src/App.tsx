import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider.tsx'
import { ToastProvider } from './context/ToastProvider.tsx'
import { ProtectedRoute } from './routes/ProtectedRoute.tsx'
import { GuestRoute } from './routes/GuestRoute.tsx'
import { AuthPage } from './components/AuthPage.tsx'
import { AppLayout } from './components/layout/AppLayout.tsx'
import { DashboardPage } from './pages/DashboardPage.tsx'
import { ProjetosPage } from './pages/ProjetosPage.tsx'
import { ProjetoDetalhesPage } from './pages/ProjetoDetalhesPage.tsx'
import { VersaoDetalhesPage } from './pages/VersaoDetalhesPage.tsx'
import { ClientesPage } from './pages/ClientesPage.tsx'
import { ComentariosPage } from './pages/ComentariosPage.tsx'
import { ClientPortalPage } from './pages/ClientPortalPage.tsx'
import { FoundationsPage } from './pages/FoundationsPage.tsx'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Rotas Públicas para Não Autenticados (Guest) */}
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<AuthPage />} />
            </Route>

            {/* Portal do Cliente com Link Mágico (Acesso Público) */}
            <Route path="/portal/projetos/:id" element={<ClientPortalPage />} />
            <Route path="/portal/:id" element={<ClientPortalPage />} />

            {/* Rotas Protegidas (Requer Login do Profissional) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/projetos" element={<ProjetosPage />} />
                <Route path="/projetos/:id" element={<ProjetoDetalhesPage />} />
                <Route path="/projetos/:projetoId/versoes/:versaoId" element={<VersaoDetalhesPage />} />
                <Route path="/clientes" element={<ClientesPage />} />
                <Route path="/comentarios" element={<ComentariosPage />} />
              </Route>
            </Route>

            {/* Rota de consulta dos Foundations de Design */}
            <Route path="/foundations" element={<FoundationsPage />} />

            {/* Redirecionamento padrão */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
