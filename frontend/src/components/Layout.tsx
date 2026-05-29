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

const VIEWER_NAV = (id: string) => [
  { to: `/tournaments/${id}`, icon: LayoutDashboard, label: 'Resumen', end: true },
  { to: `/tournaments/${id}/groups`, icon: Table2, label: 'Grupos' },
  { to: `/tournaments/${id}/matches`, icon: Calendar, label: 'Partidos' },
  { to: `/tournaments/${id}/ranking`, icon: BarChart2, label: 'Ranking' },
  { to: `/tournaments/${id}/simulator`, icon: Zap, label: 'Simulador' },
];

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdmin = user?.role === 'ADMIN';

  const { data: tournaments } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => tournamentsApi.getAll().then(r => r.data),
  });

  const activeTournament = tournaments?.find((t: any) => t.id === activeTournamentId);

  const handleLogout = () => { logout(); navigate('/login'); };

  if (!isAdmin && tournaments?.length > 0 && !activeTournamentId) {
    const first = tournaments.find((t: any) => t.status === 'IN_PROGRESS') || tournaments[0];
    if (first) setActiveTournament(first.id);
  }

  const tournamentNavItems = activeTournamentId ? [
    ...VIEWER_NAV(activeTournamentId),
    ...(isAdmin ? ADMIN_NAV(activeTournamentId) : []),
  ] : [];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shrink-0">
          <Trophy size={16} className="text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight">Quinielazo</span>
        <button onClick={() => setSidebarOpen(false)}
          className="ml-auto text-gray-400 hover:text-white md:hidden">
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        <NavLink to="/dashboard" onClick={() => setSidebarOpen(false)}
          className={({ isActive }) => clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
            isActive ? 'bg-amber-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          )}>
          <LayoutDashboard size={18} className="shrink-0" />
          <span>Dashboard</span>
        </NavLink>

        {isAdmin && (
          <NavLink to="/tournaments" onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
              isActive ? 'bg-amber-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            )}>
            <Trophy size={18} className="shrink-0" />
            <span>Torneos</span>
          </NavLink>
        )}

        {/* Selector torneo admin */}
        {isAdmin && tournaments?.length > 0 && (
          <div className="mt-4 px-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Torneo activo</p>
            <select value={activeTournamentId || ''}
              onChange={e => { setActiveTournament(e.target.value || null); if (e.target.value) navigate(`/tournaments/${e.target.value}`); setSidebarOpen(false); }}
              className="w-full bg-gray-800 text-white text-sm rounded-lg px-2 py-1.5 border border-gray-700">
              <option value="">Seleccionar...</option>
              {tournaments.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}

        {/* Nombre torneo usuario */}
        {!isAdmin && activeTournament && (
          <div className="mt-4 px-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Torneo</p>
            <p className="text-sm text-white font-medium truncate">{activeTournament.name}</p>
          </div>
        )}

        {/* Nav torneo */}
        {activeTournamentId && (
          <div className="mt-4 space-y-0.5">
            {tournamentNavItems.map(({ to, icon: Icon, label, end }: any) => (
              <NavLink key={to} to={to} end={end} onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )}>
                <Icon size={18} className="shrink-0" />
                <span>{label}</span>
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
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-gray-400">{user?.role === 'ADMIN' ? '👑 Admin' : '👤 Participante'}</p>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-60 shrink-0">
        <SidebarContent />
      </aside>

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header móvil */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center">
              <Trophy size={14} className="text-white" />
            </div>
            <span className="font-bold text-gray-800">Quinielazo</span>
          </div>
          {activeTournament && (
            <span className="ml-auto text-xs text-gray-400 truncate max-w-32">{activeTournament.name}</span>
          )}
        </div>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}