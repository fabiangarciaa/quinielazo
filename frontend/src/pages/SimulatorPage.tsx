// src/pages/SimulatorPage.tsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { simulatorApi, teamsApi } from '../lib/api';
import { Zap, Trophy, TrendingUp, AlertCircle } from 'lucide-react';

export function SimulatorPage() {
  const { id: tournamentId } = useParams<{ id: string }>();
  const [teamWinResult, setTeamWinResult] = useState<any>(null);
  const [loadingTeam, setLoadingTeam] = useState<string | null>(null);

  const { data: scenarios, isLoading } = useQuery({
    queryKey: ['simulator', tournamentId],
    queryFn: () => simulatorApi.simulate(tournamentId!).then(r => r.data),
    enabled: !!tournamentId,
  });

  const { data: teams } = useQuery({
    queryKey: ['teams', tournamentId],
    queryFn: () => teamsApi.getByTournament(tournamentId!).then(r => r.data),
    enabled: !!tournamentId,
  });

  const handleTeamWin = async (teamId: string) => {
    setLoadingTeam(teamId);
    try {
      const { data } = await simulatorApi.simulateTeamWin(tournamentId!, teamId);
      setTeamWinResult(data);
    } finally {
      setLoadingTeam(null);
    }
  };

  const aliveTeams = teams?.filter((t: any) => t.status === 'ACTIVE') || [];

  return (
    <div className="p-3 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Zap className="text-amber-500" size={24} />
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">Simulador de escenarios</h1>
      </div>

      {/* Escenarios por participante */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
          ¿Quién puede ganar la quiniela?
        </h2>
        {isLoading && <p className="text-gray-400">Calculando escenarios...</p>}
        <div className="grid gap-4 md:grid-cols-2">
          {scenarios?.map((s: any) => (
            <ScenarioCard key={s.participantId} scenario={s} />
          ))}
        </div>
      </section>

      {/* Simulador "¿Qué pasa si X gana?" */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 md:p-5">
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
          ¿Qué pasa si un equipo se corona campeón?
        </h2>
        <p className="text-sm text-gray-400 mb-4">Selecciona un equipo para ver el impacto hipotético en el ranking.</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {aliveTeams.map((team: any) => (
            <button
              key={team.id}
              onClick={() => handleTeamWin(team.id)}
              disabled={loadingTeam === team.id}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-300 transition-colors disabled:opacity-50"
            >
              {loadingTeam === team.id ? '...' : team.name}
            </button>
          ))}
        </div>

        {teamWinResult && (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-700">
            <div className="flex items-start gap-3">
              <Trophy className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-200">{teamWinResult.message}</p>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  +{teamWinResult.pointsGained} puntos · Nueva posición: #{teamWinResult.newOwnerRank}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function ScenarioCard({ scenario: s }: { scenario: any }) {
  const pct = Math.round((s.currentPoints / Math.max(s.maxPossiblePoints, 1)) * 100);
  const feasible = s.canOvertake.filter((c: any) => c.feasible).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-sm">
          {s.participantName[0]}
        </div>
        <div>
          <p className="font-semibold text-gray-800 dark:text-gray-100">{s.participantName}</p>
          <p className="text-xs text-gray-400">{s.aliveTeams} equipos vivos</p>
        </div>
        {feasible > 0 && (
          <span className="ml-auto text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
            Puede remontar
          </span>
        )}
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Puntos actuales</span>
          <span className="font-semibold text-gray-800 dark:text-gray-100">{s.currentPoints}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Máximo posible</span>
          <span className="font-semibold text-green-600 dark:text-green-400">{s.maxPossiblePoints}</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mt-1">
          <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {s.canOvertake.length > 0 && (
        <div className="space-y-1">
          {s.canOvertake.map((c: any) => (
            <div key={c.targetName} className="flex items-center gap-2 text-xs">
              {c.feasible
                ? <TrendingUp size={12} className="text-green-500" />
                : <AlertCircle size={12} className="text-red-400" />}
              <span className={c.feasible ? 'text-green-700 dark:text-green-400' : 'text-gray-400'}>
                {c.feasible ? 'Puede alcanzar' : 'Imposible alcanzar'} a {c.targetName}
                {c.feasible ? ` (necesita +${c.pointsNeeded} pts)` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
