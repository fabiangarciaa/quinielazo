// src/pages/TournamentDetailPage.tsx
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tournamentsApi } from '../lib/api';
import { useAuthStore } from '../store/auth.store';
import toast from 'react-hot-toast';
import { Users, Shield, Shuffle, Calendar, BarChart2, Zap, ChevronRight, Settings } from 'lucide-react';
import clsx from 'clsx';

const STATUS_FLOW: Record<string, { next: string; label: string }> = {
  SETUP: { next: 'DRAW_PENDING', label: 'Marcar sorteo pendiente' },
  DRAW_PENDING: { next: 'IN_PROGRESS', label: 'Iniciar torneo' },
  IN_PROGRESS: { next: 'FINISHED', label: 'Finalizar torneo' },
};

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const { data: t, isLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentsApi.getById(id!).then(r => r.data),
    enabled: !!id,
  });

  const statusMut = useMutation({
    mutationFn: (status: string) => tournamentsApi.update(id!, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tournament', id] }); qc.invalidateQueries({ queryKey: ['tournaments'] }); toast.success('Estado actualizado'); },
  });

  if (isLoading) return <div className="p-8 text-center text-gray-400">Cargando...</div>;
  if (!t) return <div className="p-8 text-center text-red-400">Torneo no encontrado</div>;

  const next = STATUS_FLOW[t.status];

  const quickLinks = [
    { to: 'participants', icon: Users, label: 'Participantes', count: t.participants?.length, color: 'blue' },
    { to: 'teams', icon: Shield, label: 'Equipos', count: t._count?.teams, color: 'green' },
    { to: 'draw', icon: Shuffle, label: 'Sorteo', color: 'purple' },
    { to: 'matches', icon: Calendar, label: 'Partidos', count: t._count?.matches, color: 'orange' },
    { to: 'ranking', icon: BarChart2, label: 'Ranking', color: 'amber' },
    { to: 'simulator', icon: Zap, label: 'Simulador', color: 'pink' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600', orange: 'bg-orange-50 text-orange-600',
    amber: 'bg-amber-50 text-amber-600', pink: 'bg-pink-50 text-pink-600',
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-400 uppercase tracking-wider">{t.type.replace('_', ' ')} · {t.season}</p>
            <h1 className="text-2xl font-bold text-gray-800 mt-0.5">{t.name}</h1>
            <p className="text-gray-500 text-sm mt-1">{t.competitionSystem}</p>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <Stat label="Equipos" value={t.teamCount} />
              <Stat label="Participantes" value={t.participantCount} />
              <Stat label="Partidos" value={t._count?.matches || 0} />
            </div>
          </div>
          <div className="shrink-0 text-right">
            <StatusBadge status={t.status} />
            {next && isAdmin && (
              <button onClick={() => statusMut.mutate(next.next)}
                className="mt-2 block text-xs text-blue-600 hover:text-blue-800 underline">
                   → {next.label}
                </button>
)}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {quickLinks.map(({ to, icon: Icon, label, count, color }) => (
          <Link key={to} to={to}
            className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all hover:border-gray-200 flex items-center gap-3 group">
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', colorMap[color])}>
              <Icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 text-sm">{label}</p>
              {count !== undefined && <p className="text-xs text-gray-400">{count} registros</p>}
            </div>
            <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
          </Link>
        ))}
      </div>

      {/* Participantes con sus equipos */}
      {t.participants?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Participantes y equipos</h2>
          <div className="space-y-3">
            {t.participants.sort((a: any, b: any) => a.currentRank - b.currentRank).map((p: any, idx: number) => (
              <div key={p.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm">{p.alias || p.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.teams?.map((tm: any) => (
                      <span key={tm.id} className={clsx(
                        'text-xs px-2 py-0.5 rounded-full border',
                        tm.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' :
                        tm.status === 'CHAMPION' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                        'bg-red-50 text-red-500 border-red-200 line-through'
                      )}>
                        {tm.name}
                      </span>
                    ))}
                    {(!p.teams || p.teams.length === 0) && <span className="text-xs text-gray-400 italic">Sin equipos asignados</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-gray-800">{p.totalPoints}</p>
                  <p className="text-xs text-gray-400">pts</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 px-3 py-1.5 rounded-lg">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-base font-bold text-gray-800">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    SETUP: 'bg-gray-100 text-gray-700',
    DRAW_PENDING: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-green-100 text-green-700',
    FINISHED: 'bg-purple-100 text-purple-700',
  };
  const labels: Record<string, string> = {
    SETUP: 'Configuración', DRAW_PENDING: 'Sorteo pendiente',
    IN_PROGRESS: 'En curso', FINISHED: 'Finalizado',
  };
  return <span className={clsx('text-xs font-semibold px-3 py-1 rounded-full', map[status])}>{labels[status]}</span>;
}
