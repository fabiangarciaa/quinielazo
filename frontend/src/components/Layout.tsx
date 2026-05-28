import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore, useTournamentStore } from '../store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { tournamentsApi } from '../lib/api';
import {
  Trophy, LayoutDashboard, Users, Shield, Shuffle, Calendar,
  BarChart2, Zap, Settings, LogOut, Menu, X, Table2
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tournaments', icon: Trophy, label: 'Torneos', adminOnly: false },
];

// Rutas visibles para TODOS (admin y participantes)
const VIEWER_NAV = (id: string) => [
  { to: `/tournaments/${id}`, icon: LayoutDashboard, label: 'Resumen', end: true },
  { to: `/tournaments/${id}/groups`, icon: Table2, label: 'Grupos' },
  { to: `/tournaments/${id}/matches`, icon: Calendar, label: 'Partidos' },
  { to: `/tournaments/${id}/ranking`, icon: BarChart2, label: 'Ranking' },
  { to: `/tournaments/${id}/simulator`, icon: Zap, label: 'Simulador' },
];

// Rutas SOLO para admin
const ADMIN_NAV = (id: string) => [
  { to: `/tournaments/${id}/participants`, icon: Users, label: 'Participantes' },
  { to: `/tournaments/${id}/teams`, icon: Shield, label: 'Equipos' },
  { to: `/tournaments/${id}/draw`, icon: Shuffle, label: 'Sorteo' },
  { to: `/tournaments/${id}/admin`, icon: Settings, label: 'Administración' },
];

export function Layout() {
  const { user, logout } = useAuthStore();
  const { activeTournamentId, setActiveTournament } = useTournamentStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isAdmin = user?.role === 'ADMIN';



  const { data: tournaments } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => tournamentsApi.getAll().then(r => r.data),
  });

  // Torneos donde el usuario está inscrito como participante
  const myTournaments = tournaments?.filter((t: any) =>
  isAdmin || t.status !== 'FINISHED'
) || [];

  const activeTournament = tournaments?.find((t: any) => t.id === activeTournamentId);

  const handleLogout = () => { logout(); navigate('/login'); };

  // Para usuarios normales, auto-seleccionar el primer torneo activo
  if (!isAdmin && tournaments?.length > 0 && !activeTournamentId) {
    const firstInProgress = tournaments.find((t: any) => t.status === 'IN_PROGRESS') || tournaments[0];
    if (firstInProgress) setActiveTournament(firstInProgress.id);
  }

  const tournamentNavItems = activeTournamentId ? [
    ...VIEWER_NAV(activeTournamentId),
    ...(isAdmin ? ADMIN_NAV(activeTournamentId) : []),
  ] : [];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={clsx(
        'flex flex-col bg-gray-900 text-white transition-all duration-300 shrink-0',
        sidebarOpen ? 'w-60' : 'w-16'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shrink-0">
            <Trophy size={16} className="text-white" />
          </div>
          {sidebarOpen && <span className="font-bold text-lg tracking-tight">Quinielazo</span>}
          <button onClick={() => setSidebarOpen(o => !o)}
            className="ml-auto text-gray-400 hover:text-white">
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3">
          <div className="px-2 space-y-0.5">
            {/* Dashboard siempre visible */}
            <NavLink to="/dashboard" className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              isActive ? 'bg-amber-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            )}>
              <LayoutDashboard size={18} className="shrink-0" />
              {sidebarOpen && <span>Dashboard</span>}
            </NavLink>

            {/* Torneos solo para admin */}
            {isAdmin && (
              <NavLink to="/tournaments" className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive ? 'bg-amber-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}>
                <Trophy size={18} className="shrink-0" />
                {sidebarOpen && <span>Torneos</span>}
              </NavLink>
            )}
          </div>

          {/* Selector torneo — solo admin */}
          {isAdmin && sidebarOpen && tournaments?.length > 0 && (
            <div className="mt-4 px-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Torneo activo
              </p>
              <select
                value={activeTournamentId || ''}
                onChange={e => {
                  setActiveTournament(e.target.value || null);
                  if (e.target.value) navigate(`/tournaments/${e.target.value}`);
                }}
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-2 py-1.5 border border-gray-700"
              >
                <option value="">Seleccionar...</option>
                {tournaments.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

                      {/* Selector de torneos para usuarios normales */}
            {!isAdmin && sidebarOpen && (
              <div className="mt-4 px-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Mis torneos
                </p>
                {myTournaments.length > 1 ? (
                  <select
                    value={activeTournamentId || ''}
                    onChange={e => {
                      setActiveTournament(e.target.value || null);
                      if (e.target.value) navigate(`/tournaments/${e.target.value}`);
                    }}
                    className="w-full bg-gray-800 text-white text-sm rounded-lg px-2 py-1.5 border border-gray-700"
                  >
                    {myTournaments.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-white font-medium truncate">
                    {activeTournament?.name || 'Sin torneo activo'}
                  </p>
                )}
              </div>
            )}

          {/* Nav del torneo */}
          {activeTournamentId && (
            <div className="mt-4 px-2 space-y-0.5">
              {sidebarOpen && (
                <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {activeTournament?.name || 'Torneo'}
                </p>
              )}
              {tournamentNavItems.map(({ to, icon: Icon, label, end }: any) => (
                <NavLink key={to} to={to} end={end}
                  className={({ isActive }) => clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  )}>
                  <Icon size={18} className="shrink-0" />
                  {sidebarOpen && <span>{label}</span>}
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        {/* Footer usuario */}
        <div className="border-t border-gray-700 p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.role === 'ADMIN' ? '👑 Admin' : '👤 Participante'}
                </p>
              </div>
            )}
            <button onClick={handleLogout}
              className="text-gray-400 hover:text-red-400 transition-colors" title="Cerrar sesión">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}