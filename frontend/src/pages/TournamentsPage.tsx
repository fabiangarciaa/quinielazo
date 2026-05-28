// src/pages/TournamentsPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { tournamentsApi } from '../lib/api';
import { useTournamentStore } from '../store/auth.store';
import toast from 'react-hot-toast';
import { Plus, Trophy, Users, Shield, Calendar, ChevronRight, Trash2 } from 'lucide-react';
import clsx from 'clsx';

const STATUS_COLORS: Record<string, string> = {
  SETUP: 'bg-gray-100 text-gray-700',
  DRAW_PENDING: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-green-100 text-green-700',
  FINISHED: 'bg-purple-100 text-purple-700',
};
const STATUS_LABELS: Record<string, string> = {
  SETUP: 'Configuración',
  DRAW_PENDING: 'Sorteo pendiente',
  IN_PROGRESS: 'En curso',
  FINISHED: 'Finalizado',
};

const INIT = { name: '', type: 'WORLD_CUP', season: '2026', teamCount: 48, participantCount: 6, competitionSystem: '' };

export function TournamentsPage() {
  const qc = useQueryClient();
  const { setActiveTournament } = useTournamentStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INIT);

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => tournamentsApi.getAll().then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: (data: any) => tournamentsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tournaments'] }); setShowForm(false); setForm(INIT); toast.success('Torneo creado'); },
    onError: () => toast.error('Error al crear torneo'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => tournamentsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tournaments'] }); toast.success('Torneo eliminado'); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({ ...form, teamCount: Number(form.teamCount), participantCount: Number(form.participantCount) });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Torneos</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gestiona tus quinielas deportivas</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Nuevo torneo
        </button>
      </div>

      {/* Modal crear torneo */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Crear torneo</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Field label="Nombre" required>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className={inp} placeholder="Mundial 2026" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tipo">
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inp}>
                    <option value="WORLD_CUP">Mundial</option>
                    <option value="LIGA_MX">Liga MX</option>
                    <option value="CUSTOM">Personalizado</option>
                  </select>
                </Field>
                <Field label="Temporada">
                  <input value={form.season} onChange={e => setForm(f => ({ ...f, season: e.target.value }))} className={inp} placeholder="2026" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Equipos">
                  <input type="number" value={form.teamCount} onChange={e => setForm(f => ({ ...f, teamCount: +e.target.value }))} className={inp} min={2} />
                </Field>
                <Field label="Participantes">
                  <input type="number" value={form.participantCount} onChange={e => setForm(f => ({ ...f, participantCount: +e.target.value }))} className={inp} min={2} />
                </Field>
              </div>
              <Field label="Sistema de competencia">
                <input value={form.competitionSystem} onChange={e => setForm(f => ({ ...f, competitionSystem: e.target.value }))} className={inp} placeholder="Fase de grupos + Eliminación directa" />
              </Field>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={createMut.isPending} className="flex-1 bg-amber-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-60">
                  {createMut.isPending ? 'Creando...' : 'Crear torneo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista */}
      {isLoading ? <div className="text-center py-12 text-gray-400">Cargando torneos...</div> : (
        <div className="grid gap-4">
          {tournaments.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Trophy size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No hay torneos aún</p>
              <p className="text-sm mt-1">Crea el primero con el botón de arriba</p>
            </div>
          )}
          {tournaments.map((t: any) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                  <Trophy className="text-amber-500" size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-800">{t.name}</h3>
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[t.status])}>
                      {STATUS_LABELS[t.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{t.season} · {t.competitionSystem}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Shield size={12} />{t._count?.teams} equipos</span>
                    <span className="flex items-center gap-1"><Users size={12} />{t._count?.participants} participantes</span>
                    <span className="flex items-center gap-1"><Calendar size={12} />{t._count?.matches} partidos</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => { if (confirm('¿Eliminar torneo?')) deleteMut.mutate(t.id); }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={15} />
                  </button>
                  <Link to={`/tournaments/${t.id}`} onClick={() => setActiveTournament(t.id)}
                    className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
                    Abrir <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400';
function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
      {children}
    </div>
  );
}
