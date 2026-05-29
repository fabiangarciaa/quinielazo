import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { participantsApi } from '../lib/api';
import { useAuthStore, useTournamentStore } from '../store/auth.store';
import { Coins, Trophy, Shield, TrendingUp } from 'lucide-react';

const EVENT_LABELS: Record<string, { label: string; icon: string }> = {
  WIN_GROUP:            { label: 'Victoria en grupos',              icon: '⚽' },
  DRAW_GROUP:           { label: 'Empate en grupos',                icon: '🤝' },
  ADVANCE_ROUND_OF_32:  { label: 'Clasificó a 16avos',             icon: '🏃' },
  ADVANCE_ROUND_OF_16:  { label: 'Clasificó a octavos',            icon: '🏃' },
  ADVANCE_QUARTER:      { label: 'Clasificó a cuartos',            icon: '⚡' },
  ADVANCE_SEMI:         { label: 'Clasificó a semifinal',          icon: '🔥' },
  REACH_FINAL:          { label: 'Llegó a la final',               icon: '🌟' },
  CHAMPION:             { label: '¡Campeón!',                      icon: '🏆' },
  RUNNER_UP:            { label: 'Subcampeón',                     icon: '🥈' },
  CLEAN_SHEET:          { label: 'Portería en cero',               icon: '🧤' },
  THRASHING_WIN:        { label: 'Goleada',                        icon: '💥' },
  SUPER_LEADERSHIP:     { label: 'Superliderato',                  icon: '👑' },
  LAST_IN_GROUP:        { label: 'Último en grupo',                icon: '😬' },
  EARLY_ELIMINATION:    { label: 'Eliminación temprana',           icon: '❌' },
};

export function PointsPage() {
  const { user } = useAuthStore();
  const { activeTournamentId } = useTournamentStore();

  // Traer participaciones para encontrar el participantId del torneo activo
  const { data: participations } = useQuery({
    queryKey: ['my-participations', user?.id],
    queryFn: () => participantsApi.getByUser(user!.id).then(r => r.data),
    enabled: !!user?.id,
  });

  const currentParticipant = participations?.find(
    (p: any) => p.tournament.id === activeTournamentId
  ) || participations?.[0];

  const { data: scores = [], isLoading } = useQuery({
    queryKey: ['my-scores', currentParticipant?.id],
    queryFn: () => participantsApi.getScores(currentParticipant!.id).then(r => r.data),
    enabled: !!currentParticipant?.id,
  });

  const totalPoints = scores.reduce((sum: number, s: any) => sum + s.pointsEarned, 0);

  // Agrupar por equipo
  const byTeam: Record<string, { teamName: string; points: number; events: any[] }> = {};
  scores.forEach((s: any) => {
    const teamName = s.result?.match?.homeTeam?.name && s.result?.match?.awayTeam?.name
      ? null : s.reason;
    const key = s.result?.match?.homeTeamId === s.teamId || s.result?.match?.awayTeamId === s.teamId
      ? (s.teamId || 'general')
      : 'general';
    const label = s.result?.match?.homeTeam?.name && s.result?.match?.awayTeam?.name
      ? `${s.result.match.homeTeam.name} vs ${s.result.match.awayTeam.name}`
      : s.reason;

    if (!byTeam[key]) byTeam[key] = { teamName: s.reason, points: 0, events: [] };
    byTeam[key].points += s.pointsEarned;
    byTeam[key].events.push(s);
  });

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
          <Coins size={18} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Puntos</h1>
          {currentParticipant && (
            <p className="text-sm text-gray-400">{currentParticipant.tournament.name}</p>
          )}
        </div>
      </div>

      {/* Resumen total */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 mb-6 text-white">
        <p className="text-sm opacity-80 mb-1">Total acumulado</p>
        <p className="text-5xl font-bold">{totalPoints}</p>
        <p className="text-sm opacity-80 mt-1">puntos</p>
        <div className="flex items-center gap-4 mt-4 text-sm">
          <span>📋 {scores.length} eventos</span>
          <span>🏅 #{currentParticipant?.currentRank || '—'} en ranking</span>
        </div>
      </div>

      {isLoading && <p className="text-center text-gray-400 py-8">Cargando puntos...</p>}

      {!isLoading && scores.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Coins size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aún no tienes puntos</p>
          <p className="text-sm mt-1">Los puntos se acumulan conforme avanza el torneo</p>
        </div>
      )}

      {/* Desglose evento por evento */}
      <div className="space-y-3">
        {scores.map((score: any) => {
          const meta = EVENT_LABELS[score.scoringRule?.eventType] || { label: score.reason, icon: '📌' };
          const match = score.result?.match;
          const date = score.earnedAt ? new Date(score.earnedAt).toLocaleDateString('es-MX', {
            day: 'numeric', month: 'short', year: 'numeric'
          }) : null;

          return (
            <div key={score.id}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-xl shrink-0 mt-0.5">{meta.icon}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm">{meta.label}</p>
                    {match && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {match.homeTeam?.name} vs {match.awayTeam?.name}
                        {score.result && ` — ${score.result.homeGoals}:${score.result.awayGoals}`}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">{score.reason}</p>
                    {date && <p className="text-xs text-gray-300 mt-0.5">{date}</p>}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-lg font-bold text-green-600">+{score.pointsEarned}</span>
                  <p className="text-xs text-gray-400">pts</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}