import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { participantsApi, usersApi } from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Users, Trophy, Key, Copy, Check, Mail } from 'lucide-react';
import clsx from 'clsx';

export function ParticipantsPage() {
  const { id: tournamentId } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showCredentials, setShowCredentials] = useState<any[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    alias: '',
    createUser: true,
    username: '',
    email: '',
    password: '',
  });

  const { data: participants = [], isLoading } = useQuery({
    queryKey: ['participants', tournamentId],
    queryFn: () => participantsApi.getByTournament(tournamentId!).then(r => r.data),
    enabled: !!tournamentId,
  });

  const createMut = useMutation({
    mutationFn: async (data: any) => {
      const res = await participantsApi.create({ ...data, tournamentId });
      // Si se creó usuario y tiene username, asignarlo
      if (data.createUser && data.username && res.data.userId) {
        await usersApi.assignUsername(res.data.userId, data.username);
      }
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['participants', tournamentId] });
      setShowForm(false);
      setForm({ name: '', alias: '', createUser: true, username: '', email: '', password: '' });
      toast.success('Participante agregado');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => participantsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['participants', tournamentId] });
      toast.success('Eliminado');
    },
  });

  const genCredsMut = useMutation({
    mutationFn: () => participantsApi.generateCredentials(tournamentId!),
    onSuccess: (d) => {
      setShowCredentials(d.data);
      toast.success('Credenciales generadas');
    },
    onError: () => toast.error('Error al generar credenciales'),
  });

  const copyAll = () => {
    const text = showCredentials
      .filter(c => !c.alreadyHadUser)
      .map(c => `${c.name}: ${c.email} / ${c.password}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Credenciales copiadas al portapapeles');
  };

  const copyOne = (idx: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const participantsWithoutUser = participants.filter((p: any) => !p.user);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Participantes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{participants.length} registrados</p>
        </div>
        <div className="flex gap-2">
          {/* Botón generar credenciales */}
          {participants.length > 0 && (
            <button
              onClick={() => genCredsMut.mutate()}
              disabled={genCredsMut.isPending}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
            >
              <Key size={15} />
              {genCredsMut.isPending ? 'Generando...' : 'Generar accesos'}
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} /> Agregar
          </button>
        </div>
      </div>

      {/* Modal credenciales generadas */}
      {showCredentials.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Key className="text-blue-600" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Accesos generados</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Comparte estas credenciales con cada participante. Solo se muestran una vez.
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {showCredentials.map((c, idx) => (
                <div key={c.participantId}
                  className={clsx('rounded-xl border p-3', c.alreadyHadUser ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200')}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-gray-800 text-sm">{c.name}</p>
                    {c.alreadyHadUser
                      ? <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Ya tenía acceso</span>
                      : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Nuevo ✓</span>}
                  </div>
                  {!c.alreadyHadUser && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail size={12} className="text-gray-400 shrink-0" />
                        <code className="text-xs text-blue-700 flex-1">{c.email}</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <Key size={12} className="text-gray-400 shrink-0" />
                        <code className="text-xs text-blue-700 flex-1 font-bold">{c.password}</code>
                        <button
                          onClick={() => copyOne(idx, `${c.email} / ${c.password}`)}
                          className="text-gray-400 hover:text-blue-600 transition-colors">
                          {copiedIdx === idx ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>
                  )}
                  {c.alreadyHadUser && (
                    <p className="text-xs text-gray-400">{c.email}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button onClick={copyAll}
                className="flex-1 flex items-center justify-center gap-2 border border-blue-300 text-blue-600 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-50">
                <Copy size={14} /> Copiar todos
              </button>
              <button onClick={() => setShowCredentials([])}
                className="flex-1 bg-gray-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aviso si hay participantes sin usuario */}
      {participantsWithoutUser.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between mb-4">
          <p className="text-sm text-amber-700">
            <strong>{participantsWithoutUser.length}</strong> participante(s) sin acceso a la app.
          </p>
          <button onClick={() => genCredsMut.mutate()} disabled={genCredsMut.isPending}
            className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 disabled:opacity-60">
            Generar accesos
          </button>
        </div>
      )}

      {/* Modal agregar */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Agregar participante</h2>
            <form onSubmit={e => { e.preventDefault(); createMut.mutate(form); }}
              className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Nombre completo" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alias (opcional)</label>
                <input value={form.alias}
                  onChange={e => setForm(f => ({ ...f, alias: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Apodo" />
              </div>

              {/* Opción crear usuario */}
              <div className="border border-gray-200 rounded-xl p-3 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.createUser}
                    onChange={e => setForm(f => ({ ...f, createUser: e.target.checked }))}
                    className="w-4 h-4 rounded" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Crear acceso a la app</p>
                    <p className="text-xs text-gray-400">El participante podrá ver el ranking y dashboard</p>
                  </div>
                </label>

                {form.createUser && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Usuario *</label>
                      <input type="text" value={form.username}
                        onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                        required={form.createUser}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="ej: fabian.garcia" />
                      <p className="text-xs text-gray-400 mt-1">El participante usará esto para iniciar sesión</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                      <input type="email" value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        required={form.createUser}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="participante@email.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña *</label>
                      <input type="text" value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        required={form.createUser}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="min. 6 caracteres" />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={createMut.isPending}
                  className="flex-1 bg-amber-500 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-60">
                  {createMut.isPending ? '...' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? <p className="text-center text-gray-400 py-8">Cargando...</p> : (
        <div className="grid gap-4">
          {participants.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Users size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Sin participantes</p>
            </div>
          )}
          {participants.map((p: any) => {
            const alive = p.teams?.filter((t: any) => t.status === 'ACTIVE').length || 0;
            const elim = p.teams?.filter((t: any) => t.status === 'ELIMINATED').length || 0;
            const champ = p.teams?.some((t: any) => t.status === 'CHAMPION');
            return (
              <div key={p.id}
                className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {(p.alias || p.name)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800">{p.alias || p.name}</p>
                      {p.alias && <span className="text-xs text-gray-400">({p.name})</span>}
                      {champ && <Trophy size={14} className="text-amber-500" />}
                      {/* Badge de acceso */}
                      {p.user
                        ? <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            <Key size={10} /> {p.user.email}
                          </span>
                        : <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                            Sin acceso
                          </span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="text-green-600">{alive} vivos</span>
                      <span className="text-red-400">{elim} eliminados</span>
                      <span>{p.teams?.length || 0} total</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.teams?.map((tm: any) => (
                        <span key={tm.id} className={clsx(
                          'text-xs px-2 py-0.5 rounded-full border font-medium',
                          tm.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' :
                          tm.status === 'CHAMPION' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                          'bg-red-50 text-red-400 border-red-200 line-through opacity-60'
                        )}>
                          {tm.name}
                        </span>
                      ))}
                      {(!p.teams || p.teams.length === 0) && (
                        <span className="text-xs text-gray-300 italic">Sin equipos asignados</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold text-gray-800">{p.totalPoints}</p>
                    <p className="text-xs text-gray-400">puntos</p>
                    <p className="text-xs text-gray-400 mt-0.5">#{p.currentRank}</p>
                  </div>
                  <button
                    onClick={() => { if (confirm(`¿Eliminar a ${p.name}?`)) deleteMut.mutate(p.id); }}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors self-start">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}