// src/pages/AdminPage.tsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tournamentsApi, phasesApi } from '../lib/api';
import toast from 'react-hot-toast';
import { Settings, Plus, Save, Shield, Calendar, BarChart2, List } from 'lucide-react';
import clsx from 'clsx';

const PHASE_TYPES = [
  'GROUP_STAGE','ROUND_OF_32','ROUND_OF_16','QUARTER_FINAL',
  'SEMI_FINAL','THIRD_PLACE','FINAL','REGULAR_SEASON','PLAY_IN','LIGUILLA',
];
const PHASE_LABELS: Record<string, string> = {
  GROUP_STAGE:'Fase de grupos', ROUND_OF_32:'16avos de final', ROUND_OF_16:'Octavos de final',
  QUARTER_FINAL:'Cuartos de final', SEMI_FINAL:'Semifinal', THIRD_PLACE:'Tercer lugar',
  FINAL:'Final', REGULAR_SEASON:'Fase regular', PLAY_IN:'Play-In', LIGUILLA:'Liguilla',
};

const EVENT_LABELS: Record<string, string> = {
  WIN_GROUP:'Victoria en grupos', DRAW_GROUP:'Empate en grupos',
  ADVANCE_ROUND_OF_32:'Clasificar a 16avos', ADVANCE_ROUND_OF_16:'Clasificar a octavos',
  ADVANCE_QUARTER:'Clasificar a cuartos', ADVANCE_SEMI:'Clasificar a semifinal',
  REACH_FINAL:'Llegar a la final', CHAMPION:'Campeón', RUNNER_UP:'Subcampeón',
  CLEAN_SHEET:'Portería en cero', THRASHING_WIN:'Goleada 3+ goles',
  SUPER_LEADERSHIP:'Superliderato', LAST_IN_GROUP:'Último de grupo', EARLY_ELIMINATION:'Eliminación temprana',
};

type Tab = 'phases' | 'scoring' | 'status';

export function AdminPage() {
  const { id: tournamentId } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('scoring');
  const [showPhaseForm, setShowPhaseForm] = useState(false);
  const [phaseForm, setPhaseForm] = useState({ name: '', type: 'GROUP_STAGE', roundNumber: 1 });
  const [localRules, setLocalRules] = useState<Record<string, number>>({});

  const { data: tournament } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => tournamentsApi.getById(tournamentId!).then(r => r.data),
    enabled: !!tournamentId,
  });

  const { data: rules = [] } = useQuery({
    queryKey: ['scoring-rules', tournamentId],
    queryFn: () => tournamentsApi.getScoringRules(tournamentId!).then(r => r.data),
    enabled: !!tournamentId,
    onSuccess: (data: any[]) => {
      const map: Record<string, number> = {};
      data.forEach(r => { map[r.id] = r.points; });
      setLocalRules(map);
    },
  });

  const { data: phases = [] } = useQuery({
    queryKey: ['phases', tournamentId],
    queryFn: () => phasesApi.getByTournament(tournamentId!).then(r => r.data),
    enabled: !!tournamentId,
  });

  const saveRuleMut = useMutation({
    mutationFn: ({ id, points, isActive }: any) => tournamentsApi.updateScoringRule(tournamentId!, id, points, isActive),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['scoring-rules', tournamentId] }); toast.success('Regla actualizada'); },
  });

  const createPhaseMut = useMutation({
    mutationFn: (d: any) => phasesApi.create({ ...d, tournamentId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['phases', tournamentId] }); setShowPhaseForm(false); toast.success('Fase creada'); },
  });

  const activatePhaseMut = useMutation({
    mutationFn: (id: string) => phasesApi.setActive(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['phases', tournamentId] }); toast.success('Fase activada'); },
  });

  const statusMut = useMutation({
    mutationFn: (status: string) => tournamentsApi.updateStatus(tournamentId!, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tournament', tournamentId] }); toast.success('Estado actualizado'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'No se puede cambiar el estado'),
  });

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: 'scoring', label: 'Puntuación', icon: BarChart2 },
    { key: 'phases', label: 'Fases', icon: Calendar },
    { key: 'status', label: 'Estado torneo', icon: Settings },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Settings className="text-gray-500" size={22} />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Administración</h1>
          <p className="text-sm text-gray-500">{tournament?.name}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={clsx('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === key ? 'bg-white text-gray-800 shadow' : 'text-gray-500 hover:text-gray-700')}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ── Scoring rules ── */}
      {tab === 'scoring' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-1">Reglas de puntuación</h2>
          <p className="text-xs text-gray-400 mb-4">Edita los puntos de cada evento. Los cambios aplican a los resultados registrados desde ahora.</p>
          <div className="space-y-2">
            {rules.map((rule: any) => (
              <div key={rule.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{EVENT_LABELS[rule.eventType] || rule.eventType}</p>
                  {rule.description && <p className="text-xs text-gray-400">{rule.description}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input type="number" min={-10} max={50}
                    value={localRules[rule.id] ?? rule.points}
                    onChange={e => setLocalRules(r => ({ ...r, [rule.id]: +e.target.value }))}
                    className="w-16 text-center border border-gray-300 rounded-lg py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  <span className="text-xs text-gray-400">pts</span>
                  <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                    <input type="checkbox" defaultChecked={rule.isActive}
                      onChange={e => saveRuleMut.mutate({ id: rule.id, points: localRules[rule.id] ?? rule.points, isActive: e.target.checked })}
                      className="rounded" />
                    Activa
                  </label>
                  <button onClick={() => saveRuleMut.mutate({ id: rule.id, points: localRules[rule.id] ?? rule.points, isActive: rule.isActive })}
                    className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded-lg transition-colors">
                    <Save size={11} /> Guardar
                  </button>
                </div>
              </div>
            ))}
            {rules.length === 0 && <p className="text-center text-gray-400 py-6 text-sm">Sin reglas configuradas. Usa el seed inicial o crea manualmente.</p>}
          </div>
        </div>
      )}

      {/* ── Fases ── */}
      {tab === 'phases' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Fases del torneo</h2>
            <button onClick={() => setShowPhaseForm(true)}
              className="flex items-center gap-1.5 text-sm bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600">
              <Plus size={14} /> Nueva fase
            </button>
          </div>
          <div className="space-y-2">
            {phases.map((ph: any) => (
              <div key={ph.id} className={clsx('flex items-center gap-3 p-3 rounded-xl border transition-colors',
                ph.isActive ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50')}>
                <Calendar size={16} className={ph.isActive ? 'text-green-500' : 'text-gray-400'} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{ph.name}</p>
                  <p className="text-xs text-gray-400">{PHASE_LABELS[ph.type] || ph.type} · Ronda {ph.roundNumber} · {ph._count?.matches || 0} partidos</p>
                </div>
                {ph.isActive && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Activa</span>}
                {!ph.isActive && (
                  <button onClick={() => activatePhaseMut.mutate(ph.id)}
                    className="text-xs text-blue-500 hover:text-blue-700 border border-blue-200 hover:border-blue-400 px-2.5 py-1 rounded-lg transition-colors">
                    Activar
                  </button>
                )}
              </div>
            ))}
            {phases.length === 0 && <p className="text-center text-gray-400 py-6 text-sm">Sin fases. El seed crea las fases automáticamente.</p>}
          </div>

          {/* Modal fase */}
          {showPhaseForm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPhaseForm(false)}>
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold mb-4">Nueva fase</h2>
                <form onSubmit={e => { e.preventDefault(); createPhaseMut.mutate(phaseForm); }} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                    <input value={phaseForm.name} onChange={e => setPhaseForm(f => ({ ...f, name: e.target.value }))} required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Fase de grupos" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select value={phaseForm.type} onChange={e => setPhaseForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                      {PHASE_TYPES.map(t => <option key={t} value={t}>{PHASE_LABELS[t] || t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número de ronda</label>
                    <input type="number" min={1} value={phaseForm.roundNumber} onChange={e => setPhaseForm(f => ({ ...f, roundNumber: +e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setShowPhaseForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancelar</button>
                    <button type="submit" disabled={createPhaseMut.isPending} className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-60">
                      {createPhaseMut.isPending ? '...' : 'Crear'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Estado del torneo ── */}
      {tab === 'status' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Estado del torneo</h2>
          <div className="space-y-3">
            {[
              { status: 'SETUP', label: 'Configuración', desc: 'Período inicial de configuración', color: 'bg-gray-100 text-gray-700' },
              { status: 'DRAW_PENDING', label: 'Sorteo pendiente', desc: 'Listo para ejecutar el sorteo', color: 'bg-blue-100 text-blue-700' },
              { status: 'IN_PROGRESS', label: 'En curso', desc: 'Torneo activo, registrando resultados', color: 'bg-green-100 text-green-700' },
              { status: 'FINISHED', label: 'Finalizado', desc: 'El torneo ha concluido', color: 'bg-purple-100 text-purple-700' },
            ].map(({ status, label, desc, color }) => (
              <div key={status} className={clsx('flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
                tournament?.status === status ? 'border-amber-300 bg-amber-50' : 'border-gray-100')}>
                <span className={clsx('text-xs font-semibold px-2.5 py-1 rounded-full w-36 text-center shrink-0', color)}>{label}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
                {tournament?.status === status
                  ? <span className="text-xs text-amber-600 font-semibold shrink-0">← Estado actual</span>
                  : (
                    <button onClick={() => statusMut.mutate(status)} disabled={statusMut.isPending}
                      className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 shrink-0 disabled:opacity-50">
                      Cambiar a este
                    </button>
                  )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Nota: Solo se permiten transiciones válidas (Setup → Sorteo pendiente → En curso → Finalizado).
          </p>
        </div>
      )}
    </div>
  );
}
