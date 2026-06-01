import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchesApi, phasesApi, teamsApi, participantsApi } from '../lib/api';
import { useAuthStore } from '../store/auth.store';
import toast from 'react-hot-toast';
import { Plus, Calendar, CheckCircle2, Clock, Edit3, RefreshCw, Wand2, Trash2, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import clsx from 'clsx';

export function MatchesPage() {
  const { id: tournamentId } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const qc = useQueryClient();

  const [showMatchForm, setShowMatchForm] = useState(false);
  const [showResultForm, setShowResultForm] = useState<any>(null);
  const [showGenModal, setShowGenModal] = useState(false);
  const [filterPhase, setFilterPhase] = useState('');
  const [teamsPerGroup, setTeamsPerGroup] = useState(4);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  // Filtro por participante: 'all', 'mine', o un participantId específico
  const [participantFilter, setParticipantFilter] = useState<string>(isAdmin ? 'all' : 'mine');
  const [showParticipantPicker, setShowParticipantPicker] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());

  const [matchForm, setMatchForm] = useState({ phaseId: '', homeTeamId: '', awayTeamId: '', matchDate: '' });
  const [resultForm, setResultForm] = useState({ homeGoals: 0, awayGoals: 0, hadPenalties: false, advancingTeamId: '' });

  const { data: phases = [] } = useQuery({
    queryKey: ['phases', tournamentId],
    queryFn: () => phasesApi.getByTournament(tournamentId!).then(r => r.data),
    enabled: !!tournamentId,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams', tournamentId],
    queryFn: () => teamsApi.getByTournament(tournamentId!).then(r => r.data),
    enabled: !!tournamentId,
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['participants', tournamentId],
    queryFn: () => participantsApi.getByTournament(tournamentId!).then(r => r.data),
    enabled: !!tournamentId,
  });

  const { data: allMatches = [], isLoading } = useQuery({
    queryKey: ['matches', tournamentId, filterPhase],
    queryFn: () => matchesApi.getByTournament(tournamentId!, filterPhase || undefined).then(r => r.data),
    enabled: !!tournamentId,
  });

  // Detectar si el usuario logueado es participante de este torneo
  const myUserId = (user as any)?.id || (user as any)?.sub;
  const myParticipant = participants.find((p: any) =>
  p.user?.id && myUserId && p.user.id === myUserId
  );

  // Equipos del usuario actual
  const myTeamIds = new Set(
  !isAdmin && myParticipant ? myParticipant.teams?.map((t: any) => t.id) || [] : []
  );

  // Equipos de participantes seleccionados (para admin)
  const getFilteredTeamIds = () => {
    if (participantFilter === 'all') return null; // null = sin filtro
    if (participantFilter === 'mine') return myTeamIds;
    // Participantes específicos seleccionados por admin
    if (selectedParticipants.size > 0) {
      const ids = new Set<string>();
      participants
        .filter((p: any) => selectedParticipants.has(p.id))
        .forEach((p: any) => p.teams?.forEach((t: any) => ids.add(t.id)));
      return ids;
    }
    return null;
  };

  const filteredTeamIds = getFilteredTeamIds();

  // Filtrar partidos según los equipos seleccionados
  const matches = filteredTeamIds
    ? allMatches.filter((m: any) =>
        filteredTeamIds.has(m.homeTeamId) || filteredTeamIds.has(m.awayTeamId)
      )
    : allMatches;

    // Fases donde NO hay penales ni "equipo que avanza" (todos contra todos)
  const ROUND_ROBIN_PHASES = ['GROUP_STAGE', 'REGULAR_SEASON'];

  // Determinar si el partido actual es de fase eliminatoria (no grupos)
  const isEliminationPhase = (match: any) => {
  const phaseType = match.phase?.type;
  // Si no tiene tipo definido, asumir eliminatoria por seguridad
  if (!phaseType) return true;
  // Es eliminatoria si NO es una fase de todos contra todos
  return !ROUND_ROBIN_PHASES.includes(phaseType);
};

  const createMatchMut = useMutation({
    mutationFn: (d: any) => matchesApi.create({ ...d, tournamentId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matches', tournamentId] });
      setShowMatchForm(false);
      setMatchForm({ phaseId: '', homeTeamId: '', awayTeamId: '', matchDate: '' });
      toast.success('Partido creado');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const generateMut = useMutation({
    mutationFn: () => matchesApi.generateGroups(tournamentId!, teamsPerGroup),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['matches', tournamentId] });
      setShowGenModal(false);
      toast.success(`✅ ${d.data.totalMatches} partidos generados en ${d.data.groups.length} grupos`);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al generar'),
  });

  const deleteByPhaseMut = useMutation({
    mutationFn: (phaseId: string) => matchesApi.deleteByPhase(phaseId),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['matches', tournamentId] });
      toast.success(d.data.message);
    },
  });

  const deleteMatchMut = useMutation({
    mutationFn: (matchId: string) => matchesApi.delete(matchId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matches', tournamentId] });
      toast.success('Partido eliminado');
    },
    onError: () => toast.error('Error al eliminar partido'),
  });

  const recordResultMut = useMutation({
    mutationFn: ({ matchId, data }: any) => matchesApi.recordResult(matchId, data),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['matches', tournamentId] });
      qc.invalidateQueries({ queryKey: ['ranking', tournamentId] });
      setShowResultForm(null);
      toast.success(d.data.summary || 'Resultado registrado');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al registrar'),
  });

  const correctResultMut = useMutation({
    mutationFn: ({ matchId, data }: any) => matchesApi.correctResult(matchId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matches', tournamentId] });
      qc.invalidateQueries({ queryKey: ['ranking', tournamentId] });
      setShowResultForm(null);
      toast.success('Resultado corregido');
    },
  });

  const openResult = (match: any) => {
    setShowResultForm(match);
    setResultForm({
      homeGoals: match.result?.homeGoals ?? 0,
      awayGoals: match.result?.awayGoals ?? 0,
      hadPenalties: match.result?.hadPenalties ?? false,
      advancingTeamId: match.result?.advancingTeamId ?? '',
    });
  };

  const submitResult = (e: React.FormEvent) => {
  e.preventDefault();
  const homeGoals = +resultForm.homeGoals;
  const awayGoals = +resultForm.awayGoals;

  // Auto-detectar ganador si no son penales
  let advancingTeamId = resultForm.advancingTeamId;
  if (isEliminationPhase(showResultForm) && !resultForm.hadPenalties) {
    if (homeGoals > awayGoals) advancingTeamId = showResultForm.homeTeamId;
    else if (awayGoals > homeGoals) advancingTeamId = showResultForm.awayTeamId;
  }

  // Validar que en penales se seleccione el equipo que avanza
  if (isEliminationPhase(showResultForm) && resultForm.hadPenalties && !advancingTeamId) {
    toast.error('Selecciona el equipo que avanza en penales');
    return;
  }

  const payload = { ...resultForm, homeGoals, awayGoals, advancingTeamId };
  if (showResultForm.result) {
    correctResultMut.mutate({ matchId: showResultForm.id, data: payload });
  } else {
    recordResultMut.mutate({ matchId: showResultForm.id, data: payload });
  }
  };

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleParticipant = (id: string) => {
    setSelectedParticipants(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setParticipantFilter('custom');
  };

  // Agrupar partidos
  const grouped = matches.reduce((acc: any, m: any) => {
    const phase = m.phase?.name || 'Sin fase';
    const group = m.notes?.split('—')[0]?.trim() || 'Sin grupo';
    const key = `${phase}|||${group}`;
    if (!acc[key]) acc[key] = { phase, group, matches: [] };
    acc[key].matches.push(m);
    return acc;
  }, {});

  const finished = matches.filter((m: any) => m.status === 'FINISHED').length;
  const pending = matches.length - finished;
  const activePhase = phases.find((p: any) => p.isActive);

  // Highlight equipos propios
  const isMyTeam = (teamId: string) => myTeamIds.has(teamId);

  return (
    <div className="p-3 md:p-6 max-w-5xl mx-auto space-y-3 md:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Partidos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {matches.length} partidos · <span className="text-green-600">{finished} finalizados</span> · <span className="text-amber-500">{pending} pendientes</span>
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowGenModal(true)}
              className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-medium px-4 py-2 rounded-lg text-sm">
              <Wand2 size={15} /> Generar calendario
            </button>
            <button onClick={() => setShowMatchForm(true)}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2 rounded-lg text-sm">
              <Plus size={16} /> Nuevo partido
            </button>
          </div>
        )}
      </div>

      {/* Filtros de participante */}
      <div className="bg-white rounded-xl border border-gray-100 p-2 md:p-3 flex items-center gap-2 flex-wrap">
        <Filter size={15} className="text-gray-400 shrink-0" />
        <span className="text-sm text-gray-500 shrink-0">Ver partidos de:</span>
        <div className="flex gap-2 flex-wrap flex-1">
      {/* Botón "Todos" — visible para todos */}
        <button onClick={() => { setParticipantFilter('all'); setSelectedParticipants(new Set()); }}
          className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
          participantFilter === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
          Todos
        </button>
          {/* Botón "Mis equipos" */}
          {myParticipant && (
            <button onClick={() => { setParticipantFilter('mine'); setSelectedParticipants(new Set()); }}
              className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                participantFilter === 'mine' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
              Mis equipos
            </button>
          )}
          {/* Botones por participante — solo admin */}
          {isAdmin && participants.map((p: any) => (
            <button key={p.id}
              onClick={() => toggleParticipant(p.id)}
              className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                selectedParticipants.has(p.id) ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
              {p.alias || p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filtro por fase */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterPhase('')}
          className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
            !filterPhase ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
          Todas ({allMatches.length})
        </button>
        {phases.map((ph: any) => {
          const count = allMatches.filter((m: any) => m.phase?.id === ph.id).length;
          return (
            <button key={ph.id} onClick={() => setFilterPhase(ph.id)}
              className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                filterPhase === ph.id ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
              {ph.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Limpiar partidos pendientes */}
      {isAdmin && activePhase && allMatches.filter((m: any) => m.phase?.id === activePhase.id && m.status === 'SCHEDULED').length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-orange-700">
            <strong>{allMatches.filter((m: any) => m.phase?.id === activePhase.id && m.status === 'SCHEDULED').length}</strong> partidos pendientes en <strong>{activePhase.name}</strong>
          </p>
          <button onClick={() => { if (confirm(`¿Eliminar partidos pendientes de ${activePhase.name}?`)) deleteByPhaseMut.mutate(activePhase.id); }}
            className="flex items-center gap-1.5 text-xs text-orange-600 border border-orange-300 hover:bg-orange-100 px-3 py-1.5 rounded-lg">
            <Trash2 size={12} /> Limpiar pendientes
          </button>
        </div>
      )}

      {/* Cerrar fase — cuando todos los partidos están finalizados */}
      {isAdmin && activePhase && allMatches.filter((m: any) => m.phase?.id === activePhase.id && m.status === 'SCHEDULED').length === 0 && allMatches.filter((m: any) => m.phase?.id === activePhase.id).length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-green-700">
            ✅ Todos los partidos de <strong>{activePhase.name}</strong> están finalizados.
          </p>
          <button
            onClick={() => {
              const nextPhase = (phases as any[]).find((ph: any) => ph.roundNumber === activePhase.roundNumber + 1);
              if (!nextPhase) { toast.error('No hay siguiente fase configurada'); return; }
              if (confirm(`¿Cerrar ${activePhase.name} y activar ${nextPhase.name}?`)) {
                phasesApi.setActive(nextPhase.id).then(() => {
                  qc.invalidateQueries({ queryKey: ['phases', tournamentId] });
                  qc.invalidateQueries({ queryKey: ['teams', tournamentId] });
                  toast.success(`${nextPhase.name} activada`);
                });
              }
            }}
            className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600">
            Cerrar fase → siguiente
          </button>
        </div>
      )}

      {/* Lista de partidos */}
      {isLoading ? <p className="text-center text-gray-400 py-8">Cargando...</p> : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([key, groupData]: any) => {
            const isCollapsed = collapsedGroups.has(key);
            const groupFinished = groupData.matches.filter((m: any) => m.status === 'FINISHED').length;
            const groupTotal = groupData.matches.length;
            const allDone = groupFinished === groupTotal;
            return (
              <div key={key} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button onClick={() => toggleGroup(key)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-800 text-sm">{groupData.group}</span>
                    <span className="text-xs text-gray-400">{groupData.phase}</span>
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium',
                      allDone ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-700')}>
                      {groupFinished}/{groupTotal} jugados
                    </span>
                  </div>
                  {isCollapsed ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronUp size={16} className="text-gray-400" />}
                </button>
                {!isCollapsed && (
                  <div className="divide-y divide-gray-50 border-t border-gray-100">
                    {groupData.matches.map((match: any) => (
                      <MatchRow key={match.id} match={match}
                        onRecord={isAdmin ? () => openResult(match) : undefined}
                        onDelete={isAdmin ? () => { if (confirm(`¿Eliminar partido ${match.homeTeam?.name} vs ${match.awayTeam?.name}?`)) deleteMatchMut.mutate(match.id); } : undefined}
                        highlightHome={isMyTeam(match.homeTeamId)}
                        highlightAway={isMyTeam(match.awayTeamId)} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {matches.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Calendar size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">Sin partidos</p>
            </div>
          )}
        </div>
      )}

      {/* Modal generar calendario */}
      {showGenModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowGenModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Wand2 className="text-purple-600" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Generar calendario automático</h2>
                <p className="text-xs text-gray-400">Fase de grupos — todos contra todos</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Equipos por grupo</label>
              <div className="flex gap-2">
                {[3,4,5,6].map(n => (
                  <button key={n} onClick={() => setTeamsPerGroup(n)}
                    className={clsx('flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all',
                      teamsPerGroup === n ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500')}>
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Con {teams.length} equipos y {teamsPerGroup} por grupo → <strong>{Math.ceil(teams.length / teamsPerGroup)} grupos</strong> · <strong>{Math.ceil(teams.length / teamsPerGroup) * ((teamsPerGroup * (teamsPerGroup - 1)) / 2)} partidos</strong>
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowGenModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm">Cancelar</button>
              <button onClick={() => generateMut.mutate()} disabled={generateMut.isPending}
                className="flex-1 bg-purple-500 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">
                {generateMut.isPending ? 'Generando...' : '✨ Generar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear partido manual */}
      {showMatchForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowMatchForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Nuevo partido</h2>
            <form onSubmit={e => { e.preventDefault(); createMatchMut.mutate(matchForm); }} className="space-y-3">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fase *</label>
                  <select value={matchForm.phaseId} onChange={e => setMatchForm(f => ({ ...f, phaseId: e.target.value }))} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option value="">Seleccionar fase...</option>
                    {phases
                      .filter((ph: any) => ph.isActive)
                      .map((ph: any) => <option key={ph.id} value={ph.id}>{ph.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Local *</label>
                    <select value={matchForm.homeTeamId} onChange={e => setMatchForm(f => ({ ...f, homeTeamId: e.target.value }))} required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                      <option value="">Seleccionar...</option>
                      {teams
                        .filter((t: any) => {
                          const selectedPhase = phases.find((ph: any) => ph.id === matchForm.phaseId);
                          if (selectedPhase?.type === 'THIRD_PLACE') return true;
                          return t.status === 'ACTIVE';
                        })
                        .map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visitante *</label>
                    <select value={matchForm.awayTeamId} onChange={e => setMatchForm(f => ({ ...f, awayTeamId: e.target.value }))} required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                      <option value="">Seleccionar...</option>
                      {teams
                        .filter((t: any) => {
                          if (t.id === matchForm.homeTeamId) return false;
                          const selectedPhase = phases.find((ph: any) => ph.id === matchForm.phaseId);
                          if (selectedPhase?.type === 'THIRD_PLACE') return true;
                          return t.status === 'ACTIVE';
                        })
                        .map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora</label>
                <input type="datetime-local" value={matchForm.matchDate} onChange={e => setMatchForm(f => ({ ...f, matchDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowMatchForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={createMatchMut.isPending} className="flex-1 bg-amber-500 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-60">
                  {createMatchMut.isPending ? '...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal registrar resultado */}
      {showResultForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowResultForm(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-1">
              {showResultForm.result ? <RefreshCw size={18} className="text-orange-500" /> : <CheckCircle2 size={18} className="text-green-500" />}
              <h2 className="text-lg font-bold">{showResultForm.result ? 'Corregir resultado' : 'Registrar resultado'}</h2>
            </div>
            {showResultForm.notes && (
              <p className="text-xs text-gray-400 mb-3">{showResultForm.notes}</p>
            )}
            <p className="text-center text-gray-700 font-semibold mb-4">
              {showResultForm.homeTeam?.name} <span className="text-gray-300 font-normal mx-2">vs</span> {showResultForm.awayTeam?.name}
            </p>
            <form onSubmit={submitResult} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-500 mb-1 truncate">{showResultForm.homeTeam?.name}</p>
                  <input type="number" min={0} max={30} value={resultForm.homeGoals}
                    onChange={e => setResultForm(f => ({ ...f, homeGoals: +e.target.value }))}
                    className="w-full text-center text-3xl font-bold border-2 border-gray-200 rounded-xl py-3 focus:outline-none focus:border-amber-400" />
                </div>
                <div className="text-2xl font-bold text-gray-200">–</div>
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-500 mb-1 truncate">{showResultForm.awayTeam?.name}</p>
                  <input type="number" min={0} max={30} value={resultForm.awayGoals}
                    onChange={e => setResultForm(f => ({ ...f, awayGoals: +e.target.value }))}
                    className="w-full text-center text-3xl font-bold border-2 border-gray-200 rounded-xl py-3 focus:outline-none focus:border-amber-400" />
                </div>
              </div>

              {/* Penales — SOLO en fases eliminatorias */}
              {isEliminationPhase(showResultForm) && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={resultForm.hadPenalties}
                    onChange={e => setResultForm(f => ({ ...f, hadPenalties: e.target.checked }))}
                    className="w-4 h-4 rounded" />
                  <span className="text-sm text-gray-700">El partido se definió en penales</span>
                </label>
              )}

              {/* Equipo que avanza — solo en penales */}
            {isEliminationPhase(showResultForm) && resultForm.hadPenalties && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipo que avanza (penales)</label>
                <select value={resultForm.advancingTeamId}
                  onChange={e => setResultForm(f => ({ ...f, advancingTeamId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">Seleccionar...</option>
                  <option value={showResultForm.homeTeamId}>{showResultForm.homeTeam?.name}</option>
                  <option value={showResultForm.awayTeamId}>{showResultForm.awayTeam?.name}</option>
                </select>
              </div>
            )}

              {/* Preview de bonificaciones */}
              {(+resultForm.homeGoals > 0 || +resultForm.awayGoals > 0) && (
                <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 space-y-1">
                  {Math.abs(+resultForm.homeGoals - +resultForm.awayGoals) >= 3 && (
                    <p className="text-green-600 font-medium">✓ Goleada por 3+ goles → +2 pts extra</p>
                  )}
                  {+resultForm.awayGoals === 0 && <p className="text-blue-600">✓ Portería en cero ({showResultForm.homeTeam?.name}) → +1 pt</p>}
                  {+resultForm.homeGoals === 0 && <p className="text-blue-600">✓ Portería en cero ({showResultForm.awayTeam?.name}) → +1 pt</p>}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowResultForm(null)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={recordResultMut.isPending || correctResultMut.isPending}
                  className={clsx('flex-1 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-60',
                    showResultForm.result ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600')}>
                  {recordResultMut.isPending || correctResultMut.isPending ? 'Guardando...' : showResultForm.result ? 'Corregir' : 'Guardar resultado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MatchRow({ match, onRecord, onDelete, highlightHome, highlightAway }: {
  match: any;
  onRecord?: () => void;
  onDelete?: () => void;
  highlightHome?: boolean;
  highlightAway?: boolean;
}) {
  const finished = match.status === 'FINISHED';
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
      <div className="shrink-0">
        {finished ? <CheckCircle2 size={16} className="text-green-400" /> : <Clock size={16} className="text-amber-400" />}
      </div>
      <div className="flex-1 grid grid-cols-3 items-center gap-1 md:gap-2 min-w-0">
        <div className="text-right min-w-0">
          <p className={clsx('font-medium text-sm truncate', highlightHome ? 'text-amber-600 font-bold' : 'text-gray-800')}>
            {match.homeTeam?.name}
            {highlightHome && ' ⭐'}
          </p>
          {match.homeTeam?.participant && (
            <p className="text-xs text-gray-400 truncate">{match.homeTeam.participant.alias || match.homeTeam.participant.name}</p>
          )}
        </div>
        <div className="text-center shrink-0">
          {finished
            ? <span className="text-base font-bold text-gray-800">{match.result?.homeGoals} – {match.result?.awayGoals}</span>
            : <span className="text-sm text-gray-300">vs</span>}
          {match.result?.hadPenalties && <p className="text-xs text-gray-400">(pen)</p>}
        </div>
        <div className="text-left min-w-0">
          <p className={clsx('font-medium text-sm truncate', highlightAway ? 'text-amber-600 font-bold' : 'text-gray-800')}>
            {highlightAway && '⭐ '}
            {match.awayTeam?.name}
          </p>
          {match.awayTeam?.participant && (
            <p className="text-xs text-gray-400 truncate">{match.awayTeam.participant.alias || match.awayTeam.participant.name}</p>
          )}
        </div>
      </div>
      {match.matchDate && (
        <p className="text-xs text-gray-400 shrink-0 hidden md:block">
          {new Date(match.matchDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
      {onRecord && (
        <button onClick={onRecord}
          className={clsx('shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors',
            finished ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100')}>
          {finished ? <><Edit3 size={12} /> Corregir</> : <><Plus size={12} /> Resultado</>}
        </button>
      )}
      {onDelete && !finished && (
        <button onClick={onDelete}
          className="shrink-0 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}