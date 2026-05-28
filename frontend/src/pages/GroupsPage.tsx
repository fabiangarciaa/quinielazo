import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi, matchesApi, phasesApi } from '../lib/api';
import { useAuthStore } from '../store/auth.store';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { Shield, Trophy, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface TeamStat {
  id: string;
  name: string;
  strength: number;
  status: string;
  participantName: string;
  participantAlias: string;
  isMyTeam: boolean;
  grupo: string;
  PJ: number; V: number; E: number; D: number;
  GF: number; GC: number; DG: number; PTS: number;
}

const ROUND_ROBIN_PHASES = ['GROUP_STAGE', 'REGULAR_SEASON'];

export function GroupsPage() {
  const { id: tournamentId } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const qc = useQueryClient();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showThirdPlace, setShowThirdPlace] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  // Set de IDs que clasifican (editable por admin)
  const [customClassified, setCustomClassified] = useState<Set<string> | null>(null);

  const { data: teams = [] } = useQuery({
    queryKey: ['teams', tournamentId],
    queryFn: () => teamsApi.getByTournament(tournamentId!).then(r => r.data),
    enabled: !!tournamentId,
  });

  const { data: phases = [] } = useQuery({
    queryKey: ['phases', tournamentId],
    queryFn: () => phasesApi.getByTournament(tournamentId!).then(r => r.data),
    enabled: !!tournamentId,
  });

  const { data: allMatches = [] } = useQuery({
    queryKey: ['matches', tournamentId],
    queryFn: () => matchesApi.getByTournament(tournamentId!).then(r => r.data),
    enabled: !!tournamentId,
  });

  const closePhaseMut = useMutation({
    mutationFn: ({ phaseId, advancingTeamIds }: any) =>
      phasesApi.closePhase(phaseId, advancingTeamIds),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['teams', tournamentId] });
      qc.invalidateQueries({ queryKey: ['phases', tournamentId] });
      setShowCloseModal(false);
      toast.success(d.data.message);
    },
    onError: () => toast.error('Error al cerrar la fase'),
  });

  // Solo partidos de fase de grupos finalizados
  const groupMatches = allMatches.filter((m: any) =>
    m.phase?.type === 'GROUP_STAGE' && m.status === 'FINISHED'
  );
  const totalGroupMatches = allMatches.filter((m: any) => m.phase?.type === 'GROUP_STAGE').length;
  const allGroupMatchesPlayed = totalGroupMatches > 0 && groupMatches.length === totalGroupMatches;

  // Detectar userId
  const myUserId = (user as any)?.id || (user as any)?.sub;
  const myTeamIds = new Set<string>();
  if (!isAdmin && myUserId) {
    teams.forEach((t: any) => {
      if (t.participant?.user?.id === myUserId) myTeamIds.add(t.id);
    });
  }

  // ── Calcular estadísticas por equipo ────────────────────────────────────
  const teamStats = useMemo((): Map<string, TeamStat> => {
    const map = new Map<string, TeamStat>();

    for (const team of teams) {
      const groupLabel = team.phaseReached || 'Sin grupo';
      if (!groupLabel.startsWith('Grupo')) continue;

      const teamMatches = groupMatches.filter((m: any) =>
        m.homeTeamId === team.id || m.awayTeamId === team.id
      );

      let PJ = 0, V = 0, E = 0, D = 0, GF = 0, GC = 0;
      for (const m of teamMatches) {
        const isHome = m.homeTeamId === team.id;
        const myGoals = isHome ? m.result.homeGoals : m.result.awayGoals;
        const theirGoals = isHome ? m.result.awayGoals : m.result.homeGoals;
        PJ++;
        GF += myGoals;
        GC += theirGoals;
        if (myGoals > theirGoals) V++;
        else if (myGoals === theirGoals) E++;
        else D++;
      }

      map.set(team.id, {
        id: team.id,
        name: team.name,
        strength: team.strength,
        status: team.status,
        participantName: team.participant?.name || 'Sin dueño',
        participantAlias: team.participant?.alias || team.participant?.name || 'Sin dueño',
        isMyTeam: myTeamIds.has(team.id),
        grupo: groupLabel,
        PJ, V, E, D, GF, GC,
        DG: GF - GC,
        PTS: V * 3 + E,
      });
    }
    return map;
  }, [teams, groupMatches]);

  // ── Agrupar equipos por grupo ────────────────────────────────────────────
  const groupsMap = useMemo(() => {
    const map = new Map<string, TeamStat[]>();
    for (const stat of teamStats.values()) {
      if (!map.has(stat.grupo)) map.set(stat.grupo, []);
      map.get(stat.grupo)!.push(stat);
    }
    return map;
  }, [teamStats]);

  const sortTeams = (teams: TeamStat[]) =>
    [...teams].sort((a, b) => b.PTS - a.PTS || b.DG - a.DG || b.GF - a.GF || b.strength - a.strength);

  const sortedGroups = [...groupsMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  // ── Tabla de mejores terceros ────────────────────────────────────────────
  const thirdPlaceTable = useMemo(() => {
    const thirds: (TeamStat & { grupo: string })[] = [];
    for (const [grupo, groupTeams] of groupsMap) {
      const sorted = sortTeams(groupTeams);
      if (sorted.length >= 3) {
        thirds.push({ ...sorted[2], grupo });
      }
    }
    // Ordenar por criterios FIFA: PTS → DG → GF → strength (proxy ranking FIFA)
    return thirds.sort((a, b) =>
      b.PTS - a.PTS || b.DG - a.DG || b.GF - a.GF || b.strength - a.strength
    );
  }, [groupsMap]);

  // IDs que clasifican por defecto (top 2 de cada grupo + 8 mejores terceros)
  const defaultClassifiedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const [, groupTeams] of groupsMap) {
      const sorted = sortTeams(groupTeams);
      sorted.slice(0, 2).forEach(t => ids.add(t.id));
    }
    thirdPlaceTable.slice(0, 8).forEach(t => ids.add(t.id));
    return ids;
  }, [groupsMap, thirdPlaceTable]);

  const classifiedIds = customClassified || defaultClassifiedIds;

  // Fase de grupos en BD
  const groupPhase = phases.find((p: any) => p.type === 'GROUP_STAGE');

  const handleCloseGroupStage = () => {
    if (!groupPhase) { toast.error('No se encontró la fase de grupos'); return; }
    closePhaseMut.mutate({
      phaseId: groupPhase.id,
      advancingTeamIds: [...classifiedIds],
    });
  };

  const toggleClassified = (teamId: string) => {
    const base = customClassified || new Set(defaultClassifiedIds);
    const next = new Set(base);
    next.has(teamId) ? next.delete(teamId) : next.add(teamId);
    setCustomClassified(next);
  };

  const allGroupKeys = sortedGroups.map(([key]) => key);
  const visibleGroups = selectedGroup
    ? sortedGroups.filter(([key]) => key === selectedGroup)
    : sortedGroups;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tabla de grupos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {groupMatches.length}/{totalGroupMatches} partidos jugados
            {allGroupMatchesPlayed && <span className="ml-2 text-green-600 font-medium">✓ Fase completa</span>}
          </p>
        </div>

        {/* Botones admin */}
        {isAdmin && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowThirdPlace(v => !v)}
              className="flex items-center gap-2 border border-blue-300 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Trophy size={15} />
              {showThirdPlace ? 'Ocultar' : 'Ver'} mejores 3ros
            </button>
            <button onClick={() => setShowCloseModal(true)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                allGroupMatchesPlayed
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              )}
              disabled={!allGroupMatchesPlayed && groupMatches.length === 0}
              title={!allGroupMatchesPlayed ? 'Aún hay partidos pendientes' : ''}>
              <XCircle size={15} />
              Cerrar fase de grupos
            </button>
          </div>
        )}
      </div>

      {/* Aviso partidos pendientes */}
      {isAdmin && !allGroupMatchesPlayed && totalGroupMatches > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700">
            Faltan <strong>{totalGroupMatches - groupMatches.length}</strong> partidos por registrar.
            Puedes cerrar la fase cuando terminen todos, o hacerlo manualmente seleccionando los clasificados.
          </p>
          <button onClick={() => setShowCloseModal(true)}
            className="ml-auto text-xs border border-amber-300 text-amber-600 hover:bg-amber-100 px-3 py-1.5 rounded-lg shrink-0">
            Cerrar manualmente
          </button>
        </div>
      )}

      {/* ── Tabla de mejores terceros ────────────────────────────────────── */}
      {showThirdPlace && (
        <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-5 py-3 flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold">Mejores terceros lugares</h2>
              <p className="text-blue-200 text-xs mt-0.5">
                Criterios FIFA: PTS → DG → GF → Ranking FIFA · Clasifican los 8 mejores
              </p>
            </div>
            <span className="text-blue-200 text-xs">{thirdPlaceTable.length} equipos</span>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-50 border-b border-blue-100">
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 w-8">#</th>
                <th className="text-left px-3 py-2.5 font-semibold text-gray-500">Selección</th>
                <th className="text-center px-2 py-2.5 font-semibold text-gray-500">Grupo</th>
                <th className="text-center px-2 py-2.5 font-semibold text-gray-500">PJ</th>
                <th className="text-center px-2 py-2.5 font-semibold text-gray-500">V</th>
                <th className="text-center px-2 py-2.5 font-semibold text-gray-500">E</th>
                <th className="text-center px-2 py-2.5 font-semibold text-gray-500">D</th>
                <th className="text-center px-2 py-2.5 font-semibold text-gray-500">GF</th>
                <th className="text-center px-2 py-2.5 font-semibold text-gray-500">GC</th>
                <th className="text-center px-2 py-2.5 font-semibold text-gray-500">DG</th>
                <th className="text-center px-2 py-2.5 font-semibold text-gray-500">PTS</th>
                {isAdmin && <th className="text-center px-2 py-2.5 font-semibold text-gray-500">Clasifica</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {thirdPlaceTable.map((team, idx) => {
                const classifies = classifiedIds.has(team.id);
                return (
                  <tr key={team.id} className={clsx(
                    'transition-colors',
                    classifies ? 'bg-green-50' : 'hover:bg-gray-50',
                    idx === 7 ? 'border-b-2 border-dashed border-gray-300' : ''
                  )}>
                    <td className="px-4 py-3">
                      <div className={clsx('w-6 h-6 rounded flex items-center justify-center text-xs font-bold',
                        classifies ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500')}>
                        {idx + 1}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-gray-800">{team.name}</p>
                      <p className="text-xs text-gray-400">{team.participantAlias}</p>
                    </td>
                    <td className="text-center px-2 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        {team.grupo.replace('Grupo ', '')}
                      </span>
                    </td>
                    <td className="text-center px-2 py-3 text-gray-600">{team.PJ}</td>
                    <td className="text-center px-2 py-3 text-green-600 font-medium">{team.V}</td>
                    <td className="text-center px-2 py-3 text-gray-500">{team.E}</td>
                    <td className="text-center px-2 py-3 text-red-400">{team.D}</td>
                    <td className="text-center px-2 py-3 text-gray-600">{team.GF}</td>
                    <td className="text-center px-2 py-3 text-gray-600">{team.GC}</td>
                    <td className={clsx('text-center px-2 py-3 font-medium',
                      team.DG > 0 ? 'text-green-600' : team.DG < 0 ? 'text-red-400' : 'text-gray-500')}>
                      {team.DG > 0 ? `+${team.DG}` : team.DG}
                    </td>
                    <td className="text-center px-2 py-3">
                      <span className={clsx('font-bold', classifies ? 'text-green-600' : 'text-gray-700')}>
                        {team.PTS}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="text-center px-2 py-3">
                        <button onClick={() => toggleClassified(team.id)}
                          className={clsx('w-7 h-7 rounded-full flex items-center justify-center mx-auto transition-colors',
                            classifies ? 'bg-green-500 hover:bg-red-400' : 'bg-gray-200 hover:bg-green-400')}>
                          {classifies
                            ? <CheckCircle2 size={14} className="text-white" />
                            : <XCircle size={14} className="text-gray-500" />}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              Clasifican (top 8)
            </span>
            <span className="text-gray-400">La línea punteada separa clasificados de eliminados</span>
            {isAdmin && customClassified && (
              <button onClick={() => setCustomClassified(null)}
                className="ml-auto text-blue-500 hover:underline">
                Restablecer automático
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Filtro de grupos ─────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setSelectedGroup(null)}
          className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
            !selectedGroup ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
          Todos
        </button>
        {allGroupKeys.map(key => (
          <button key={key} onClick={() => setSelectedGroup(key === selectedGroup ? null : key)}
            className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
              selectedGroup === key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
            {key.replace('Grupo ', '')}
          </button>
        ))}
      </div>

      {/* ── Grilla de grupos ─────────────────────────────────────────────── */}
      <div className={clsx('grid gap-5',
        selectedGroup ? 'grid-cols-1 max-w-2xl' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3')}>
        {visibleGroups.map(([groupKey, groupTeams]) => {
          const sorted = sortTeams(groupTeams);
          const gMatches = groupMatches.filter((m: any) => m.notes?.startsWith(groupKey));
          const totalPossible = (groupTeams.length * (groupTeams.length - 1)) / 2;

          return (
            <div key={groupKey} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-4 py-3 flex items-center justify-between">
                <h2 className="text-white font-bold">{groupKey}</h2>
                <span className="text-gray-400 text-xs">{gMatches.length}/{totalPossible} partidos</span>
              </div>

              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-3 py-2 font-semibold text-gray-500 w-6">#</th>
                    <th className="text-left px-2 py-2 font-semibold text-gray-500">Selección</th>
                    <th className="text-center px-1 py-2 font-semibold text-gray-500 w-7">PJ</th>
                    <th className="text-center px-1 py-2 font-semibold text-gray-500 w-7">V</th>
                    <th className="text-center px-1 py-2 font-semibold text-gray-500 w-7">E</th>
                    <th className="text-center px-1 py-2 font-semibold text-gray-500 w-7">D</th>
                    <th className="text-center px-1 py-2 font-semibold text-gray-500 w-7">GF</th>
                    <th className="text-center px-1 py-2 font-semibold text-gray-500 w-7">GC</th>
                    <th className="text-center px-1 py-2 font-semibold text-gray-500 w-8">DG</th>
                    <th className="text-center px-2 py-2 font-semibold text-gray-500 w-8">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sorted.map((team, idx) => {
                    const isEliminated = team.status === 'ELIMINATED';
                    const isChampionTeam = team.status === 'CHAMPION';
                    const willClassify = classifiedIds.has(team.id);
                    // Línea separadora entre 2do y 3er lugar
                    const isCutLine = idx === 1;

                    return (
                      <tr key={team.id}
                        className={clsx('transition-colors',
                          team.isMyTeam ? 'bg-amber-50' :
                          isEliminated ? 'opacity-40' : 'hover:bg-gray-50'
                        )}>
                        <td className={clsx('px-3 py-2.5', isCutLine ? 'border-b-2 border-dashed border-blue-200' : '')}>
                          <div className={clsx('w-5 h-5 rounded flex items-center justify-center text-xs font-bold',
                            idx < 2 ? 'bg-blue-500 text-white' :
                            willClassify ? 'bg-green-400 text-white' :
                            'bg-gray-100 text-gray-500')}>
                            {idx + 1}
                          </div>
                        </td>
                        <td className={clsx('px-2 py-2.5', isCutLine ? 'border-b-2 border-dashed border-blue-200' : '')}>
                          <span className={clsx('font-semibold truncate block',
                            team.isMyTeam ? 'text-amber-700' :
                            isEliminated ? 'text-gray-400 line-through' : 'text-gray-800')}>
                            {team.name}
                            {team.isMyTeam && ' ⭐'}
                            {isChampionTeam && ' 🏆'}
                          </span>
                          <span className="text-gray-400 block" style={{ fontSize: '10px' }}>
                            {team.participantAlias}
                          </span>
                        </td>
                        {(['PJ','V','E','D','GF','GC'] as const).map(stat => (
                          <td key={stat} className={clsx('text-center px-1 py-2.5',
                            isCutLine ? 'border-b-2 border-dashed border-blue-200' : '',
                            stat === 'V' ? 'text-green-600 font-medium' :
                            stat === 'D' ? 'text-red-400' : 'text-gray-600')}>
                            {team[stat]}
                          </td>
                        ))}
                        <td className={clsx('text-center px-1 py-2.5 font-medium',
                          isCutLine ? 'border-b-2 border-dashed border-blue-200' : '',
                          team.DG > 0 ? 'text-green-600' : team.DG < 0 ? 'text-red-400' : 'text-gray-500')}>
                          {team.DG > 0 ? `+${team.DG}` : team.DG}
                        </td>
                        <td className={clsx('text-center px-2 py-2.5',
                          isCutLine ? 'border-b-2 border-dashed border-blue-200' : '')}>
                          <span className={clsx('font-bold text-sm',
                            idx < 2 ? 'text-blue-600' :
                            willClassify ? 'text-green-600' : 'text-gray-700')}>
                            {team.PTS}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="px-3 py-2 border-t border-gray-100 flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-blue-500"></div> Top 2 clasifican
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-green-400"></div> 3ro clasificado
                </span>
                {!isAdmin && (
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-sm bg-amber-400"></div> Tu equipo ⭐
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {sortedGroups.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Shield size={48} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">No hay datos de grupos aún</p>
        </div>
      )}

      {/* ── Modal confirmar cierre de fase ───────────────────────────────── */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                <XCircle className="text-red-500" size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Cerrar fase de grupos</h2>
                <p className="text-xs text-gray-400 mt-0.5">Esta acción marcará equipos como eliminados</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">✅ Clasifican (top 2 por grupo + 8 mejores 3ros)</span>
                <span className="font-bold text-green-600">{classifiedIds.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">❌ Eliminados</span>
                <span className="font-bold text-red-500">{teamStats.size - classifiedIds.size}</span>
              </div>
              {customClassified && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Usando clasificación personalizada (modificaste los terceros)
                </p>
              )}
              {!allGroupMatchesPlayed && (
                <p className="text-xs text-red-500 mt-1">
                  ⚠️ Hay {totalGroupMatches - groupMatches.length} partidos sin registrar
                </p>
              )}
            </div>

            <p className="text-sm text-gray-500 mb-5">
              Los equipos eliminados quedarán marcados en rojo en el ranking. Esta acción se puede
              revertir cambiando el estado de los equipos manualmente desde la sección Equipos.
            </p>

            <div className="flex gap-3">
              <button onClick={() => setShowCloseModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm">
                Cancelar
              </button>
              <button onClick={handleCloseGroupStage} disabled={closePhaseMut.isPending}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">
                {closePhaseMut.isPending ? 'Procesando...' : `Confirmar — Eliminar ${teamStats.size - classifiedIds.size} equipos`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}