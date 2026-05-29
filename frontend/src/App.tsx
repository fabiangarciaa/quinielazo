import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/auth.store';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TournamentsPage } from './pages/TournamentsPage';
import { TournamentDetailPage } from './pages/TournamentDetailPage';
import { ParticipantsPage } from './pages/ParticipantsPage';
import { TeamsPage } from './pages/TeamsPage';
import { DrawPage } from './pages/DrawPage';
import { MatchesPage } from './pages/MatchesPage';
import { RankingPage } from './pages/RankingPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { AdminPage } from './pages/AdminPage';
import { GroupsPage } from './pages/GroupsPage';
import { ProfilePage } from './pages/ProfilePage';
import { RulesPage } from './pages/RulesPage';
import { PointsPage } from './pages/PointsPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 5000, style: { borderRadius:'12px', fontSize:'14px' } }} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="tournaments" element={<TournamentsPage />} />
            <Route path="tournaments/:id" element={<TournamentDetailPage />} />
            <Route path="tournaments/:id/participants" element={<ParticipantsPage />} />
            <Route path="tournaments/:id/teams" element={<TeamsPage />} />
            <Route path="tournaments/:id/draw" element={<DrawPage />} />
            <Route path="tournaments/:id/matches" element={<MatchesPage />} />
            <Route path="tournaments/:id/ranking" element={<RankingPage />} />
            <Route path="tournaments/:id/simulator" element={<SimulatorPage />} />
            <Route path="tournaments/:id/admin" element={<AdminPage />} />
            <Route path="tournaments/:id/groups" element={<GroupsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="tournaments/:id/rules" element={<RulesPage />} />
            <Route path="tournaments/:id/points" element={<PointsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
