// src/pages/TeamsPage.tsx
import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi, participantsApi } from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Upload, Trash2, Shield } from 'lucide-react';
import clsx from 'clsx';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  ELIMINATED: 'bg-red-100 text-red-500',
  CHAMPION: 'bg-amber-100 text-amber-700',
};

export function TeamsPage() {
  const { id: tournamentId } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [form, setForm] = useState({ name: '', country: '', strength: 50 });

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams', tournamentId],
    queryFn: () => teamsApi.getByTournament(tournamentId!).then(r => r.data),
    enabled: !!tournamentId,
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['participants', tournamentId],
    queryFn: () => participantsApi.getByTournament(tournamentId!).then(r => r.data),
    enabled: !!tournamentId,
  });

  const createMut = useMutation({
    mutationFn: (d: any) => teamsApi.create({ ...d, tournamentId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teams', tournamentId] }); setShowForm(false); setForm({ name: '', country: '', strength: 50 }); toast.success('Equipo creado'); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => teamsApi.update(id, { status: 'ELIMINATED' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teams', tournamentId] }); toast.success('Estado actualizado'); },
  });

  const assignMut = useMutation({
    mutationFn: ({ teamId, participantId }: any) => teamsApi.update(teamId, { participantId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams', tournamentId] }),
  });

  const importMut = useMutation({
    mutationFn: (file: File) => teamsApi.importCsv(tournamentId!, file),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: ['teams', tournamentId] }); toast.success(`${d.data.imported} equipos importados`); },
    onError: () => toast.error('Error al importar'),
  });

  const filtered = teams.filter((t: any) => filter === 'ALL' || t.status === filter);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Equipos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{teams.length} equipos en el torneo</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv" className="hidden"
            onChange={e => { if (e.target.files?.[0]) importMut.mutate(e.target.files[0]); }} />
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">
            <Upload size={14} /> Importar CSV
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600">
            <Plus size={16} /> Agregar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {['ALL', 'ACTIVE', 'ELIMINATED', 'CHAMPION'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', filter === s ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}>
            {s === 'ALL' ? 'Todos' : s === 'ACTIVE' ? 'Activos' : s === 'ELIMINATED' ? 'Eliminados' : 'Campeones'} ({s === 'ALL' ? teams.length : teams.filter((t: any) => t.status === s).length})
          </button>
        ))}
      </div>

      {/* Modal crear */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Agregar equipo</h2>
            <form onSubmit={e => { e.preventDefault(); createMut.mutate(form); }} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="Argentina" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">País / Liga</label>
                <input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="Argentina" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fuerza (1-100): {form.strength}</label>
                <input type="range" min={1} max={100} value={form.strength} onChange={e => setForm(f => ({ ...f, strength: +e.target.value }))}
                  className="w-full" />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>Cenicienta</span><span>Favorito máximo</span>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={createMut.isPending} className="flex-1 bg-amber-500 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-60">
                  {createMut.isPending ? '...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hint CSV */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-xs text-blue-700 mb-4">
        Formato CSV: <code>Nombre,País,Fuerza</code> (primera fila es encabezado)
      </div>

      {isLoading ? <p className="text-center text-gray-400 py-8">Cargando...</p> : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Equipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">País</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Fuerza</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Dueño</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Estado</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">PJ/V/E/D</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((team: any) => (
                <tr key={team.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                        <Shield size={13} className="text-gray-400" />
                      </div>
                      <span className="font-medium text-gray-800">{team.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{team.country}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${team.strength}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{team.strength}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select value={team.participantId || ''} onChange={e => assignMut.mutate({ teamId: team.id, participantId: e.target.value || null })}
                      className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-700 focus:outline-none">
                      <option value="">Sin asignar</option>
                      {participants.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.alias || p.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[team.status])}>
                      {team.status === 'ACTIVE' ? 'Activo' : team.status === 'ELIMINATED' ? 'Eliminado' : 'Campeón'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500">
                    {team.matchesPlayed}/{team.wins}/{team.draws}/{team.losses}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => { if (confirm(`¿Eliminar ${team.name}?`)) deleteMut.mutate(team.id); }}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <Shield size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay equipos en este filtro</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
