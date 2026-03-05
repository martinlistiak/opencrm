import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PositionsListPage } from './pages/PositionsListPage';
import { PositionDetailPage } from './pages/PositionDetailPage';
import { PositionFormPage } from './pages/PositionFormPage';
import { CandidatesListPage } from './pages/CandidatesListPage';
import { CandidateDetailPage } from './pages/CandidateDetailPage';
import { CandidateFormPage } from './pages/CandidateFormPage';
import { PipelinePage } from './pages/PipelinePage';
import { SettingsPage } from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function ProtectedRoute() {
  const { token, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!token) return <Navigate to="/login" replace />;
  return <AppLayout />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route index element={<DashboardPage />} />
              <Route path="positions" element={<PositionsListPage />} />
              <Route path="positions/new" element={<PositionFormPage />} />
              <Route path="positions/:id" element={<PositionDetailPage />} />
              <Route path="positions/:id/edit" element={<PositionFormPage />} />
              <Route path="positions/:id/pipeline" element={<PipelinePage />} />
              <Route path="candidates" element={<CandidatesListPage />} />
              <Route path="candidates/new" element={<CandidateFormPage />} />
              <Route path="candidates/:id" element={<CandidateDetailPage />} />
              <Route path="candidates/:id/edit" element={<CandidateFormPage />} />
              <Route path="pipeline" element={<PipelinePage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
