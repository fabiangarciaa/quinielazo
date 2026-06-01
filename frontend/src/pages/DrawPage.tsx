// src/pages/DrawPage.tsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { drawsApi, potsApi, teamsApi, participantsApi } from '../lib/api';
import toast from 'react-hot-toast';
import { Shuffle, Plus, Zap, CheckCircle, AlertTriangle, BarChart2, Trash2 } from 'lucide-react';
import clsx from 'clsx';

const METHOD_INFO = {
  pots:     { label: 'Por bombos',         desc: 'Cada participante recibe 1 equipo de cada bombo según su nivel de fuerza.' },
  snake:    { label: 'Draft serpiente',    desc: 'Turnos alternados: 1→N en rondas pares, N→1 en impares.' },
  balanced: { label: 'Balanceado auto',   desc: 'El sistema asigna equipos minimizando la diferencia de fuerza total.' },
};

export function DrawPage() {
  const { id: tournamentId } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [method, setMethod] = useState<'pots' | 'snake' | 'balanced'>('pots');
  const [teamsPerP, setTeamsPerP] = useState(8);
  const [result, setResult] = useState<any>(null);
  const [showPotForm, setShowPotForm] = useState(false);
  const [potForm, setPotForm] = useState({ name: '', level: 1, strengthMin: 0, strengthMax: 100, teamsPerParticipant: 1 });

  const { data: pots = [] } = useQuery({
    queryKey: ['pots', tournamentId],
    queryFn: () => potsApi.getByTournament(tournamentId!).then(r => r.data),
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

  const proposalMut = useMutation({
    mutationFn: () => drawsApi.calculateProposal(tournamentId!),
    onSuccess: (d) => toast.success(`Propuesta calculada: ${d.data.pots?.length} bombos`),
  });

  const autoAssignMut = useMutation({
    mutationFn: () => potsApi.autoAssign(tournamentId!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pots', tournamentId] }); toast.success('Equipos distribuidos en bombos'); },
  });

  const createPotMut = useMutation({
    mutationFn: (d: any) => potsApi.create({ ...d, tournamentId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pots', tournamentId] }); setShowPotForm(false); toast.success('Bombo creado'); },
  });

  const deletePotMut = useMutation({
    mutationFn: (id: string) => potsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pots', tournamentId] }),
  });

  const moveTeamMut = useMutation({
  mutationFn: ({ teamId, potId }: any) => teamsApi.update(teamId, { potId }),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['pots', tournamentId] });
    qc.invalidateQueries({ queryKey: ['teams', tournamentId] });
    toast.success('Equipo movido');
  },
  onError: () => toast.error('Error al mover equipo'),
  });

  const drawMut = useMutation({
    mutationFn: async () => {
      if (method === 'pots')     return drawsApi.executePots(tournamentId!);
      if (method === 'snake')    return drawsApi.executeSnake(tournamentId!);
      return drawsApi.executeBalanced(tournamentId!, teamsPerP);
    },
    onSuccess: (d) => {
      setResult(d.data);
      qc.invalidateQueries({ queryKey: ['teams', tournamentId] });
      qc.invalidateQueries({ queryKey: ['participants', tournamentId] });
      toast.success('¡Sorteo ejecutado exitosamente!');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error en el sorteo'),
  });

  const unassigned = teams.filter((t: any) => !t.participantId);
  const balanceColor = result
    ? result.balanceLabel === 'Muy equilibrado' ? 'text-green-600'
    : result.balanceLabel === 'Medianamente equilibrado' ? 'text-amber-600'
    : 'text-red-500'
    : '';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Shuffle className="text-purple-500" size={24} />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sorteo de equipos</h1>
          <p className="text-sm text-gray-500">{participants.length} participantes · {teams.length} equipos · {unassigned.length} sin asignar</p>
        </div>
      </div>

      {/* Bombos */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Bombos configurados</h2>
          <div className="flex gap-2">
            <button onClick={() => autoAssignMut.mutate()}
              className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-600">
              Auto-distribuir equipos
            </button>
            <button onClick={() => setShowPotForm(true)}
              className="flex items-center gap-1.5 text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600">
              <Plus size={13} /> Nuevo bombo
            </button>
          </div>
        </div>

        {pots.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            <Shuffle size={36} className="mx-auto mb-2 opacity-20" />
            No hay bombos. Créalos manualmente o usa "Auto-distribuir".
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {pots.map((pot: any) => (
              <div key={pot.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium text-gray-800 text-sm">{pot.name}</span>
                    <span className="ml-2 text-xs text-gray-400">Nivel {pot.level} · Fuerza {pot.strengthMin}–{pot.strengthMax}</span>
                  </div>
                  <button onClick={() => deletePotMut.mutate(pot.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {pot.teams?.map((t: any) => (
                <div key={t.id} className="flex items-center gap-1">
                  <span className={clsx('text-xs px-2 py-0.5 rounded-full border',
                    t.participant ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200')}>
                    {t.name} <span className="opacity-60">({t.strength})</span>
                  </span>
                  <select
                    value={pot.id}
                    onChange={e => {
                      if (e.target.value !== pot.id) {
                        moveTeamMut.mutate({ teamId: t.id, potId: e.target.value });
                      }
                    }}
                    className="text-xs border border-gray-200 rounded px-1 py-0.5 text-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-400"
                  >
                    {pots.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              ))}
                  {pot.teams?.length === 0 && <span className="text-xs text-gray-300 italic">Sin equipos</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Método de sorteo */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Método de sorteo</h2>
        <div className="grid gap-3 sm:grid-cols-3 mb-4">
          {(Object.entries(METHOD_INFO) as any[]).map(([key, info]) => (
            <button key={key} onClick={() => setMethod(key)}
              className={clsx('text-left p-3 rounded-xl border-2 transition-colors', method === key ? 'border-purple-500 bg-purple-50' : 'border-gray-100 hover:border-gray-200')}>
              <p className={clsx('font-medium text-sm', method === key ? 'text-purple-700' : 'text-gray-700')}>{info.label}</p>
              <p className="text-xs text-gray-400 mt-1">{info.desc}</p>
            </button>
          ))}
        </div>

        {method === 'balanced' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Equipos por participante: {teamsPerP}</label>
            <input type="range" min={1} max={20} value={teamsPerP} onChange={e => setTeamsPerP(+e.target.value)} className="w-full max-w-xs" />
          </div>
        )}

        <button onClick={() => drawMut.mutate()} disabled={drawMut.isPending || participants.length === 0}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50">
          <Shuffle size={18} />
          {drawMut.isPending ? 'Ejecutando sorteo...' : 'Ejecutar sorteo'}
        </button>
        {participants.length === 0 && <p className="text-xs text-red-400 mt-2">Agrega participantes antes de ejecutar el sorteo.</p>}
      </div>

      {/* Resultado */}
      {result && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="text-green-500" size={20} />
            <h2 className="font-semibold text-gray-800">Resultado del sorteo</h2>
            <div className="ml-auto flex items-center gap-2">
              <BarChart2 size={14} className={balanceColor} />
              <span className={clsx('text-sm font-medium', balanceColor)}>{result.balanceLabel}</span>
              <span className="text-xs text-gray-400">(score: {result.balanceScore?.toFixed(1)})</span>
            </div>
          </div>

          {/* Stats de fuerza */}
          {result.strengthStats && (
            <div className="flex gap-4 mb-4 text-sm text-gray-500">
              <span>Mín: <strong className="text-gray-800">{result.strengthStats.min}</strong></span>
              <span>Máx: <strong className="text-gray-800">{result.strengthStats.max}</strong></span>
              <span>Promedio: <strong className="text-gray-800">{result.strengthStats.avg?.toFixed(1)}</strong></span>
              <span>Desviación: <strong className="text-gray-800">{result.strengthStats.stdDev?.toFixed(1)}</strong></span>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            {result.assignments?.map((a: any) => (
              <div key={a.participantId} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-800">{a.participantName}</span>
                  <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                    Fuerza total: {a.totalStrength}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {a.teams?.map((t: any) => (
                    <span key={t.id} className="text-xs bg-gray-50 border border-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                      {t.name} <span className="text-gray-400">({t.strength})</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal crear bombo */}
      {showPotForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPotForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Crear bombo</h2>
            <form onSubmit={e => { e.preventDefault(); createPotMut.mutate(potForm); }} className="space-y-3">
              {[
                { key: 'name', label: 'Nombre', type: 'text', placeholder: 'Bombo 1' },
                { key: 'level', label: 'Nivel', type: 'number', placeholder: '1' },
                { key: 'strengthMin', label: 'Fuerza mínima', type: 'number', placeholder: '0' },
                { key: 'strengthMax', label: 'Fuerza máxima', type: 'number', placeholder: '100' },
                { key: 'teamsPerParticipant', label: 'Equipos por participante', type: 'number', placeholder: '1' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} required
                    value={(potForm as any)[f.key]}
                    onChange={e => setPotForm(p => ({ ...p, [f.key]: f.type === 'number' ? +e.target.value : e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
              ))}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowPotForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={createPotMut.isPending} className="flex-1 bg-purple-500 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-60">
                  {createPotMut.isPending ? '...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
