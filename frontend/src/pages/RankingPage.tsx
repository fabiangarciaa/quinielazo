// src/pages/RankingPage.tsx
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { rankingApi, exportApi } from '../lib/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Trophy, TrendingUp, TrendingDown, Minus, Download, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function RankingPage() {
  const { id: tournamentId } = useParams<{ id: string }>();

  const { data: ranking = [], isLoading } = useQuery({
    queryKey: ['ranking', tournamentId],
    queryFn: () => rankingApi.get(tournamentId!).then(r => r.data),
    enabled: !!tournamentId,
    refetchInterval: 30_000,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['ranking-history', tournamentId],
    queryFn: () => rankingApi.getHistory(tournamentId!).then(r => r.data),
    enabled: !!tournamentId,
  });

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const res = await exportApi.ranking(tournamentId!, format);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `ranking.${format === 'excel' ? 'xlsx' : 'csv'}`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Error al exportar'); }
  };

  // Construir datos para gráfica
  const chartData = buildChartData(history, ranking);
  const leader = ranking[0];

  return (
    <div className="p-3 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Ranking</h1>
          <p className="text-sm text-gray-500 mt-0.5">{ranking.length} participantes</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('csv')}
          className="flex items-center gap-1.5 text-xs md:text-sm border border-gray-200 text-gray-600 px-2 md:px-3 py-1.5 rounded-lg hover:bg-gray-50">
            <Download size={13} /> CSV
          </button>
          <button onClick={() => handleExport('excel')}
            className="flex items-center gap-1.5 text-xs md:text-sm border border-gray-200 text-gray-600 px-2 md:px-3 py-1.5 rounded-lg hover:bg-gray-50">
              <Download size={13} /> Excel
          </button>
</div>
      </div>

      {/* Podio top 3 */}
      {ranking.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {[ranking[1], ranking[0], ranking[2]].map((p: any, i) => {
            const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
            return (
              <div key={p?.participantId} className={clsx(
                'bg-white rounded-2xl border p-4 text-center',
                actualRank === 1 ? 'border-amber-200 bg-gradient-to-b from-amber-50 to-white' : 'border-gray-100'
              )}>
                <div className="text-3xl mb-1">{MEDAL[actualRank]}</div>
                <div className={clsx('w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-2', actualRank === 1 ? 'bg-amber-500' : 'bg-gray-400')}>
                  {(p?.alias || p?.participantName || '?')[0]?.toUpperCase()}
                </div>
                <p className="font-semibold text-gray-800 text-sm truncate">{p?.alias || p?.participantName}</p>
                <p className="text-xl md:text-2xl font-bold mt-1" style={{ color: COLORS[actualRank - 1] }}>{p?.totalPoints}</p>
                <p className="text-xs text-gray-400">puntos</p>
                <p className="text-xs text-green-500 mt-1">{p?.aliveTeams} equipos vivos</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabla completa */}
      {isLoading ? <p className="text-center text-gray-400 py-8">Cargando...</p> : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 w-12">#</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Participante</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Puntos</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Vivos</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Eliminados</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Equipos</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 w-10">Tendencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ranking.map((p: any, idx: number) => (
                <tr key={p.participantId} className={clsx('hover:bg-gray-50 transition-colors', idx === 0 && 'bg-amber-50/40')}>
                  <td className="px-4 py-3">
                    <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold',
                      idx === 0 ? 'bg-amber-500 text-white' : idx === 1 ? 'bg-gray-400 text-white' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-gray-100 text-gray-500')}>
                      {idx < 3 ? MEDAL[idx + 1] : idx + 1}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: COLORS[idx] || '#9ca3af' }}>
                        {(p.alias || p.participantName)[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{p.alias || p.participantName}</p>
                        {p.alias && <p className="text-xs text-gray-400">{p.participantName}</p>}
                      </div>
                      {p.hasChampion && <Trophy size={14} className="text-amber-500" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xl font-bold text-gray-800">{p.totalPoints}</span>
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className="text-green-600 font-medium">{p.aliveTeams}</span>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="text-red-400">{p.eliminatedTeams}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {p.pointsBreakdown?.slice(0, 5).map((s: any, i: number) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded" title={s.reason}>
                          +{s.points}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.trend === 'up' && <TrendingUp size={16} className="text-green-500 mx-auto" />}
                    {p.trend === 'down' && <TrendingDown size={16} className="text-red-400 mx-auto" />}
                    {p.trend === 'same' && <Minus size={16} className="text-gray-300 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Gráfica de evolución */}
      {chartData.length > 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Evolución de puntos</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {ranking.map((p: any, idx: number) => (
                <Line key={p.participantId} type="monotone"
                  dataKey={p.alias || p.participantName}
                  stroke={COLORS[idx] || '#9ca3af'}
                  strokeWidth={idx === 0 ? 3 : 1.5}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Últimas anotaciones */}
      {ranking.some((p: any) => p.pointsBreakdown?.length > 0) && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Últimas anotaciones</h2>
          <div className="space-y-2">
            {ranking.flatMap((p: any) =>
              (p.pointsBreakdown || []).map((s: any) => ({ ...s, participantName: p.alias || p.participantName, color: COLORS[p.rank - 1] }))
            ).sort((a: any, b: any) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
            .slice(0, 15).map((s: any, i: number) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="font-medium text-gray-700 w-28 truncate shrink-0">{s.participantName}</span>
                <span className="text-gray-500 flex-1 truncate">{s.reason}</span>
                <span className="font-bold text-green-600 shrink-0">+{s.points}</span>
                <span className="text-xs text-gray-300 shrink-0">
                  {new Date(s.earnedAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function buildChartData(history: any[], ranking: any[]) {
  if (!history.length) return [];
  const snaps = [...new Set(history.map((h: any) => h.snapshotAt))].sort();
  return snaps.map((snap, idx) => {
    const entry: Record<string, any> = { label: `R${idx + 1}` };
    const items = history.filter((h: any) => h.snapshotAt === snap);
    for (const item of items) {
      const name = item.participant?.alias || item.participant?.name || '?';
      entry[name] = item.totalPoints;
    }
    return entry;
  });
}
