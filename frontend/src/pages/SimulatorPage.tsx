// src/pages/SimulatorPage.tsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { simulatorApi, teamsApi, matchesApi } from '../lib/api';
import { Zap, Trophy, ChevronUp, ChevronDown, Minus, Target, ArrowUp } from 'lucide-react';
import clsx from 'clsx';

const ROUND_ROBIN_PHASES = ['GROUP_STAGE', 'REGULAR_SEASON'];
type Tab = 'scenarios' | 'match' | 'champion';

export function SimulatorPage() {
  const { id: tournamentId } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>('scenarios');

  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [simHomeGoals, setSimHomeGoals] = useState(0);
  const [simAwayGoals, setSimAwayGoals] = useState(0);
  const [simAdvancing, setSimAdvancing] = useState('');
  const [matchSimResult, setMatchSimResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);

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

  const { data: allMatches } = useQuery({
    queryKey: ['matches', tournamentId],
    queryFn: () => matchesApi.getByTournament(tournamentId!).then(r => r.data),
    enabled: !!tournamentId,
  });

  const pendingMatches = allMatches?.filter((m: any) => m.status === 'SCHEDULED') || [];
  const aliveTeams = teams?.filter((t: any) => t.status === 'ACTIVE') || [];
  const isEliminationPhase = (match: any) => !ROUND_ROBIN_PHASES.includes(match.phase?.type);

  const handleSimulateMatch = async () => {
    if (!selectedMatch) return;
    setSimLoading(true);
    try {
      const advancing = isEliminationPhase(selectedMatch) && simHomeGoals === simAwayGoals
        ? simAdvancing || undefined
        : simHomeGoals > simAwayGoals ? selectedMatch.homeTeamId
        : simAwayGoals > simHomeGoals ? selectedMatch.awayTeamId
        : undefined;

      const { data } = await simulatorApi.simulateMatch(
        tournamentId!, selectedMatch.id, simHomeGoals, simAwayGoals, advancing
      );
      setMatchSimResult(data);
    } finally {
      setSimLoading(false);
    }
  };

  const handleTeamWin = async (teamId: string) => {
    setLoadingTeam(teamId);
    try {
      const { data } = await simulatorApi.simulateTeamWin(tournamentId!, teamId);
      setTeamWinResult(data);
    } finally {
      setLoadingTeam(null);
    }
  };

  const TABS = [
    { key: 'scenarios', label: '📊 Escenarios' },
    { key: 'match', label: '⚽ Partido' },
    { key: 'champion', label: '🏆 ¿Y si...?' },
  ];

  return (
    <div className="p-3 md:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Zap className="text-amber-500 shrink-0" size={22} />
        <h1 className="text-lg md:text-2xl font-bold text-gray-800">Simulador</h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as Tab)}
            className={clsx('flex-1 md:flex-none px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all text-center',
              tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Escenarios ── */}
      {tab === 'scenarios' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Estado actual de la quiniela y partido clave para cada participante.</p>
          {isLoading && <p className="text-gray-400 text-sm">Calculando escenarios...</p>}
          {scenarios?.map((s: any) => <ScenarioCard key={s.participantId} scenario={s} />)}
        </div>
      )}

      {/* ── Tab 2: Simular partido ── */}
      {tab === 'match' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Selecciona un partido pendiente y ve cómo quedaría el ranking — sin guardar nada.</p>

          {pendingMatches.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Zap size={36} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">No hay partidos pendientes</p>
            </div>
          )}

          {pendingMatches.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Partido a simular</label>
                <select
                  value={selectedMatch?.id || ''}
                  onChange={e => {
                    const m = pendingMatches.find((m: any) => m.id === e.target.value);
                    setSelectedMatch(m || null);
                    setSimHomeGoals(0);
                    setSimAwayGoals(0);
                    setSimAdvancing('');
                    setMatchSimResult(null);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">Seleccionar partido...</option>
                  {pendingMatches.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.homeTeam?.name} vs {m.awayTeam?.name} — {m.phase?.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedMatch && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Marcador hipotético</label>
                    <div className="flex items-center gap-2 md:gap-4">
                      <div className="flex-1 text-center">
                        <p className="text-xs text-gray-500 mb-0.5 truncate">{selectedMatch.homeTeam?.name}</p>
                        <p className="text-xs text-gray-400 mb-2 truncate">{selectedMatch.homeTeam?.participant?.alias || selectedMatch.homeTeam?.participant?.name || 'Sin dueño'}</p>
                        <div className="flex items-center justify-center gap-1 md:gap-2">
                          <button onClick={() => setSimHomeGoals(Math.max(0, simHomeGoals - 1))}
                            className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg transition-colors leading-none">−</button>
                          <span className="text-3xl md:text-4xl font-bold text-gray-800 w-10 md:w-12 text-center">{simHomeGoals}</span>
                          <button onClick={() => setSimHomeGoals(simHomeGoals + 1)}
                            className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg transition-colors leading-none">+</button>
                        </div>
                      </div>
                      <div className="text-xl md:text-2xl font-bold text-gray-300 shrink-0">—</div>
                      <div className="flex-1 text-center">
                        <p className="text-xs text-gray-500 mb-0.5 truncate">{selectedMatch.awayTeam?.name}</p>
                        <p className="text-xs text-gray-400 mb-2 truncate">{selectedMatch.awayTeam?.participant?.alias || selectedMatch.awayTeam?.participant?.name || 'Sin dueño'}</p>
                        <div className="flex items-center justify-center gap-1 md:gap-2">
                          <button onClick={() => setSimAwayGoals(Math.max(0, simAwayGoals - 1))}
                            className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg transition-colors leading-none">−</button>
                          <span className="text-3xl md:text-4xl font-bold text-gray-800 w-10 md:w-12 text-center">{simAwayGoals}</span>
                          <button onClick={() => setSimAwayGoals(simAwayGoals + 1)}
                            className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg transition-colors leading-none">+</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isEliminationPhase(selectedMatch) && simHomeGoals === simAwayGoals && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Empate — ¿quién avanza?</label>
                      <select value={simAdvancing} onChange={e => setSimAdvancing(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                        <option value="">Seleccionar...</option>
                        <option value={selectedMatch.homeTeamId}>{selectedMatch.homeTeam?.name}</option>
                        <option value={selectedMatch.awayTeamId}>{selectedMatch.awayTeam?.name}</option>
                      </select>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 space-y-1">
                    <p className="font-medium text-gray-600 mb-1">Bonificaciones que aplicarían:</p>
                    {Math.abs(simHomeGoals - simAwayGoals) >= 3 && <p className="text-green-600">✓ Goleada (+4 pts)</p>}
                    {simAwayGoals === 0 && <p className="text-blue-600">✓ Portería en cero — {selectedMatch.homeTeam?.name} (+3 pts)</p>}
                    {simHomeGoals === 0 && <p className="text-blue-600">✓ Portería en cero — {selectedMatch.awayTeam?.name} (+3 pts)</p>}
                    {isEliminationPhase(selectedMatch) && <p className="text-purple-600">✓ Ambos equipos reciben puntos por estar en {selectedMatch.phase?.name}</p>}
                  </div>

                  <button onClick={handleSimulateMatch}
                    disabled={simLoading || (isEliminationPhase(selectedMatch) && simHomeGoals === simAwayGoals && !simAdvancing)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 text-sm md:text-base">
                    {simLoading ? 'Calculando...' : '⚡ Simular este resultado'}
                  </button>
                </>
              )}
            </div>
          )}

          {matchSimResult && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 space-y-4">
              <h3 className="font-semibold text-gray-800">Ranking hipotético</h3>

              {matchSimResult.pointsGenerated.length > 0 && (
                <div className="bg-green-50 rounded-xl p-3 space-y-1.5">
                  <p className="text-xs font-medium text-green-700 mb-2">Puntos que se generarían:</p>
                  {matchSimResult.pointsGenerated.map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs gap-2">
                      <span className="text-gray-600 truncate">{p.participantName} · {p.teamName} · {p.reason}</span>
                      <span className="font-bold text-green-600 shrink-0">+{p.points}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                {matchSimResult.ranking.map((p: any, idx: number) => {
                  const moved = p.rank - p.simulatedRank;
                  return (
                    <div key={p.participantId}
                      className={clsx('flex items-center gap-2 md:gap-3 p-3 rounded-xl border',
                        p.delta > 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100')}>
                      <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                        idx === 0 ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-600')}>
                        {p.simulatedRank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.currentPoints} pts actuales</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-gray-800 text-sm">{p.simulatedPoints} pts</p>
                        {p.delta > 0 && <p className="text-xs text-green-600 font-medium">+{p.delta}</p>}
                      </div>
                      <div className="shrink-0 w-5">
                        {moved > 0 && <ChevronUp size={15} className="text-green-500" />}
                        {moved < 0 && <ChevronDown size={15} className="text-red-400" />}
                        {moved === 0 && <Minus size={15} className="text-gray-300" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: ¿Y si X es campeón? ── */}
      {tab === 'champion' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Selecciona un equipo para ver el ranking hipotético si ese equipo se corona campeón.</p>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
            <p className="text-sm font-medium text-gray-700 mb-3">Equipos vivos:</p>
            <div className="flex flex-wrap gap-2">
              {aliveTeams.map((team: any) => (
                <button key={team.id} onClick={() => handleTeamWin(team.id)}
                  disabled={loadingTeam === team.id}
                  className={clsx('px-2 md:px-3 py-1.5 text-xs md:text-sm rounded-lg border transition-colors disabled:opacity-50',
                    teamWinResult?.team?.id === team.id
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'border-gray-200 hover:bg-amber-50 hover:border-amber-300 text-gray-700')}>
                  {loadingTeam === team.id ? '...' : team.name}
                  {team.participant && <span className="text-xs opacity-60 ml-1 hidden md:inline">({team.participant.alias || team.participant.name})</span>}
                </button>
              ))}
            </div>
          </div>

          {teamWinResult && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 space-y-4">
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <Trophy className="text-amber-500 shrink-0 mt-0.5" size={18} />
                <p className="font-semibold text-amber-800 text-sm">{teamWinResult.message}</p>
              </div>

              <h3 className="font-semibold text-gray-800 text-sm md:text-base">
                Ranking si {teamWinResult.team?.name} es campeón:
              </h3>

              <div className="space-y-2">
                {(() => {
                  const owner = teamWinResult.team?.participant;
                  if (!owner) return <p className="text-gray-400 text-sm">Este equipo no tiene dueño.</p>;

                  return scenarios?.map((s: any) => {
                    const isOwner = s.participantId === owner.id;
                    return { ...s, simPoints: isOwner ? s.currentPoints + teamWinResult.pointsGained : s.currentPoints, isOwner };
                  })
                  .sort((a: any, b: any) => b.simPoints - a.simPoints)
                  .map((s: any, idx: number) => (
                    <div key={s.participantId}
                      className={clsx('flex items-center gap-2 md:gap-3 p-3 rounded-xl border',
                        s.isOwner ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100')}>
                      <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                        idx === 0 ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-600')}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{s.participantName}</p>
                        <p className="text-xs text-gray-400">{s.currentPoints} pts actuales</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-gray-800 text-sm">{s.simPoints} pts</p>
                        {s.isOwner && <p className="text-xs text-green-600 font-medium">+{teamWinResult.pointsGained}</p>}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScenarioCard({ scenario: s }: { scenario: any }) {
  const isLeader = s.rank === 1;

  return (
    <div className={clsx('bg-white rounded-xl border p-4 space-y-3',
      isLeader ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100')}>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0',
          isLeader ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600')}>
          {s.rank}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">{s.participantName}</p>
          <p className="text-xs text-gray-400">{s.aliveTeams} equipos vivos</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-gray-800">{s.currentPoints}</p>
          <p className="text-xs text-gray-400">pts</p>
        </div>
      </div>

      {/* Diferencias */}
      <div className="flex gap-2">
        {isLeader ? (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-medium">
            🥇 Líder actual
          </span>
        ) : (
          <>
            {s.diffWithNext > 0 && (
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">
                <span className="font-medium">-{s.diffWithNext} pts</span> del de arriba
              </span>
            )}
            {s.diffWithLeader > 0 && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">
                <span className="font-medium">-{s.diffWithLeader} pts</span> del líder
              </span>
            )}
          </>
        )}
      </div>

      {/* Partido clave */}
      {s.keyMatch ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-1">
          <div className="flex items-center gap-2">
            <Target size={13} className="text-green-600 shrink-0" />
            <p className="text-xs font-semibold text-green-700">Partido clave — {s.keyMatch.phaseName}</p>
          </div>
          <p className="text-xs text-gray-600">
            <span className="font-medium">{s.keyMatch.myTeamName}</span> vs {s.keyMatch.homeTeamName === s.keyMatch.myTeamName ? s.keyMatch.awayTeamName : s.keyMatch.homeTeamName}
            <span className="text-gray-400"> (de {s.keyMatch.rivalParticipantName})</span>
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-green-600 font-medium">+{s.keyMatch.pointsIfWin} pts si gana</span>
            {s.keyMatch.positionsGained > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-green-700 font-bold">
                <ArrowUp size={11} />
                {s.keyMatch.positionsGained} {s.keyMatch.positionsGained === 1 ? 'lugar' : 'lugares'}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-400 text-center">
            {isLeader ? 'Mantén el liderato — no hay partidos donde seas retado directamente' : 'No hay partidos clave pendientes'}
          </p>
        </div>
      )}
    </div>
  );
}