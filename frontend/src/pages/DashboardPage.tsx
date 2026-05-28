// src/pages/DashboardPage.tsx
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Trophy, TrendingUp, TrendingDown, Minus, Users, Swords, Zap } from 'lucide-react';
import { io } from 'socket.io-client';
import { useTournamentStore } from '../store/auth.store';
import { rankingApi, tournamentsApi } from '../lib/api';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

export function DashboardPage() {
  const { activeTournamentId } = useTournamentStore();
  const [liveAlert, setLiveAlert] = useState<string | null>(null);

  const { data: tournaments } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => tournamentsApi.getAll().then(r => r.data),
  });

  const tournamentId = activeTournamentId || tournaments?.[0]?.id;

  const { data: ranking, refetch } = useQuery({
    queryKey: ['ranking', tournamentId],
    queryFn: () => rankingApi.get(tournamentId!).then(r => r.data),
    enabled: !!tournamentId,
    refetchInterval: 30_000,
  });

  const { data: history } = useQuery({
    queryKey: ['ranking-history', tournamentId],
    queryFn: () => rankingApi.getHistory(tournamentId!).then(r => r.data),
    enabled: !!tournamentId,
  });

  // WebSocket para actualizaciones en tiempo real
  useEffect(() => {
    if (!tournamentId) return;
    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3000');
    socket.emit('join_tournament', { tournamentId });
    socket.on('ranking_updated', (data) => {
      setLiveAlert(data.summary);
      refetch();
      setTimeout(() => setLiveAlert(null), 8000);
    });
    return () => { socket.disconnect(); };
  }, [tournamentId, refetch]);

  // Transformar historial para gráfica
  const chartData = buildChartData(history || []);

  if (!ranking) return <div className="p-8 text-center text-gray-400">Selecciona un torneo para ver el dashboard.</div>;

  const leader = ranking[0];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Alerta en vivo */}
      {liveAlert && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex items-center gap-3 animate-pulse">
          <Zap className="text-amber-500 shrink-0" size={18} />
          <p className="text-amber-800 text-sm font-medium">{liveAlert}</p>
        </div>
      )}

      {/* Líder destacado */}
      {leader && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
              {leader.alias?.[0] || leader.participantName[0]}
            </div>
            <div>
              <p className="text-amber-100 text-sm uppercase tracking-wider font-medium">Líder actual</p>
              <h2 className="text-2xl font-bold">{leader.alias || leader.participantName}</h2>
              <p className="text-amber-100">{leader.totalPoints} puntos · {leader.aliveTeams} equipos vivos</p>
            </div>
            <Trophy className="ml-auto opacity-30" size={64} />
          </div>
        </div>
      )}

      {/* Ranking de participantes */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Posiciones</h3>
        <div className="grid gap-3">
          {ranking.map((p: any, idx: number) => (
            <ParticipantCard key={p.participantId} participant={p} rank={idx + 1} color={COLORS[idx]} />
          ))}
        </div>
      </div>

      {/* Gráfica de evolución */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Evolución de puntos</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <XAxis dataKey="snapshot" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {ranking.map((p: any, idx: number) => (
                <Line
                  key={p.participantId}
                  type="monotone"
                  dataKey={p.alias || p.participantName}
                  stroke={COLORS[idx]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function ParticipantCard({ participant: p, rank, color }: { participant: any; rank: number; color: string }) {
  const trend = p.trend;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
      {/* Posición */}
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
        style={{ backgroundColor: rank <= 3 ? color : '#9ca3af' }}>
        {rank}
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
        style={{ backgroundColor: color }}>
        {(p.alias || p.participantName)[0].toUpperCase()}
      </div>

      {/* Nombre y equipos */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">
          {p.alias || p.participantName}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-green-600 dark:text-green-400">{p.aliveTeams} vivos</span>
          <span className="text-xs text-red-500">{p.eliminatedTeams} eliminados</span>
        </div>
      </div>

      {/* Tendencia */}
      <div className="shrink-0">
        {trend === 'up' && <TrendingUp size={16} className="text-green-500" />}
        {trend === 'down' && <TrendingDown size={16} className="text-red-500" />}
        {trend === 'same' && <Minus size={16} className="text-gray-400" />}
      </div>

      {/* Puntos */}
      <div className="text-right shrink-0">
        <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{p.totalPoints}</p>
        <p className="text-xs text-gray-400">puntos</p>
      </div>
    </div>
  );
}

function buildChartData(history: any[]) {
  if (!history.length) return [];
  const snapshots = [...new Set(history.map(h => h.snapshotAt))].sort();
  return snapshots.map((snap, idx) => {
    const entry: Record<string, any> = { snapshot: `R${idx + 1}` };
    const snapItems = history.filter(h => h.snapshotAt === snap);
    for (const item of snapItems) {
      entry[item.participant?.alias || item.participant?.name || '?'] = item.totalPoints;
    }
    return entry;
  });
}
