// src/pages/UsersPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, tournamentsApi } from '../lib/api';
import toast from 'react-hot-toast';
import { Users, Edit3, KeyRound, Plus, Trash2, X, Check } from 'lucide-react';
import clsx from 'clsx';

export function UsersPage() {
  const qc = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', username: '' });
  const [resetPassword, setResetPassword] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [showAddTournament, setShowAddTournament] = useState(false);
  const [addTournamentForm, setAddTournamentForm] = useState({ tournamentId: '', name: '' });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll().then(r => r.data),
  });

  const { data: tournaments = [] } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => tournamentsApi.getAll().then(r => r.data),
  });

  const { data: userTournaments = [] } = useQuery({
    queryKey: ['user-tournaments', selectedUser?.id],
    queryFn: () => usersApi.getTournaments(selectedUser!.id).then(r => r.data),
    enabled: !!selectedUser,
  });

  const updateMut = useMutation({
    mutationFn: () => usersApi.adminUpdate(selectedUser.id, editForm),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setSelectedUser(r.data);
      toast.success('Usuario actualizado');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al actualizar'),
  });

  const resetPasswordMut = useMutation({
    mutationFn: () => usersApi.adminResetPassword(selectedUser.id, resetPassword),
    onSuccess: () => {
      setResetPassword('');
      setShowResetForm(false);
      toast.success('Contraseña actualizada');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const addTournamentMut = useMutation({
    mutationFn: () => usersApi.addToTournament(selectedUser.id, addTournamentForm.tournamentId, addTournamentForm.name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-tournaments', selectedUser.id] });
      setShowAddTournament(false);
      setAddTournamentForm({ tournamentId: '', name: '' });
      toast.success('Agregado al torneo');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const removeTournamentMut = useMutation({
    mutationFn: (participantId: string) => usersApi.removeFromTournament(participantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-tournaments', selectedUser.id] });
      toast.success('Eliminado del torneo');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const openUser = (user: any) => {
    setSelectedUser(user);
    setEditForm({ name: user.name || '', email: user.email || '', username: user.username || '' });
    setShowResetForm(false);
    setShowAddTournament(false);
    setResetPassword('');
  };

  const availableTournaments = tournaments.filter(
    (t: any) => !userTournaments.some((ut: any) => ut.tournament?.id === t.id)
  );

  const statusColor: Record<string, string> = {
    SETUP: 'bg-gray-100 text-gray-600',
    DRAW_PENDING: 'bg-blue-100 text-blue-600',
    IN_PROGRESS: 'bg-green-100 text-green-700',
    FINISHED: 'bg-gray-100 text-gray-500',
  };

  const statusLabel: Record<string, string> = {
    SETUP: 'Configuración',
    DRAW_PENDING: 'Sorteo pendiente',
    IN_PROGRESS: 'En progreso',
    FINISHED: 'Finalizado',
  };

  return (
    <div className="p-3 md:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Users className="text-blue-500 shrink-0" size={22} />
        <h1 className="text-lg md:text-2xl font-bold text-gray-800">Administración de usuarios</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Lista de usuarios */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="font-semibold text-gray-700 text-sm">{users.length} usuarios registrados</p>
          </div>
          {isLoading ? (
            <p className="text-center text-gray-400 py-8 text-sm">Cargando...</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {users.map((user: any) => (
                <button key={user.id} onClick={() => openUser(user)}
                  className={clsx('w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left',
                    selectedUser?.id === user.id && 'bg-blue-50 border-l-2 border-blue-500')}>
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                    {(user.name || user.username || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">@{user.username || 'sin username'} · {user.email}</p>
                  </div>
                  <span className={clsx('text-xs px-2 py-0.5 rounded-full shrink-0',
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500')}>
                    {user.role === 'ADMIN' ? 'Admin' : 'Usuario'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Panel de edición */}
        {selectedUser ? (
          <div className="space-y-4">
            {/* Datos del usuario */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Edit3 size={15} className="text-gray-400" />
                <p className="font-semibold text-gray-700 text-sm">Datos del usuario</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Username</label>
                <input value={editForm.username} onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>

              <button onClick={() => updateMut.mutate()} disabled={updateMut.isPending}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-xl text-sm font-medium disabled:opacity-60">
                {updateMut.isPending ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>

            {/* Resetear contraseña */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound size={15} className="text-gray-400" />
                  <p className="font-semibold text-gray-700 text-sm">Contraseña</p>
                </div>
                <button onClick={() => setShowResetForm(v => !v)}
                  className="text-xs text-blue-500 hover:underline">
                  {showResetForm ? 'Cancelar' : 'Cambiar'}
                </button>
              </div>

              {showResetForm && (
                <div className="space-y-2">
                  <input type="password" placeholder="Nueva contraseña"
                    value={resetPassword} onChange={e => setResetPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  <button onClick={() => resetPasswordMut.mutate()}
                    disabled={!resetPassword || resetPasswordMut.isPending}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-xl text-sm font-medium disabled:opacity-60">
                    {resetPasswordMut.isPending ? 'Actualizando...' : 'Actualizar contraseña'}
                  </button>
                </div>
              )}
            </div>

            {/* Torneos */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-700 text-sm">Torneos inscritos</p>
                {availableTournaments.length > 0 && (
                  <button onClick={() => setShowAddTournament(v => !v)}
                    className="flex items-center gap-1 text-xs text-blue-500 hover:underline">
                    <Plus size={12} /> Agregar
                  </button>
                )}
              </div>

              {showAddTournament && (
                <div className="bg-blue-50 rounded-xl p-3 space-y-2 border border-blue-100">
                  <select value={addTournamentForm.tournamentId}
                    onChange={e => {
                      const t = tournaments.find((t: any) => t.id === e.target.value);
                      setAddTournamentForm({ tournamentId: e.target.value, name: selectedUser.name || '' });
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <option value="">Seleccionar torneo...</option>
                    {availableTournaments.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <input placeholder="Nombre del participante"
                    value={addTournamentForm.name}
                    onChange={e => setAddTournamentForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  <div className="flex gap-2">
                    <button onClick={() => { setShowAddTournament(false); setAddTournamentForm({ tournamentId: '', name: '' }); }}
                      className="flex-1 border border-gray-200 text-gray-600 py-1.5 rounded-lg text-xs">
                      Cancelar
                    </button>
                    <button onClick={() => addTournamentMut.mutate()}
                      disabled={!addTournamentForm.tournamentId || !addTournamentForm.name || addTournamentMut.isPending}
                      className="flex-1 bg-blue-500 text-white py-1.5 rounded-lg text-xs font-medium disabled:opacity-60">
                      {addTournamentMut.isPending ? '...' : 'Agregar'}
                    </button>
                  </div>
                </div>
              )}

              {userTournaments.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">No está inscrito en ningún torneo</p>
              ) : (
                <div className="space-y-2">
                  {userTournaments.map((ut: any) => {
                    const canRemove = !['IN_PROGRESS', 'FINISHED'].includes(ut.tournament?.status);
                    return (
                      <div key={ut.id} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{ut.tournament?.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={clsx('text-xs px-1.5 py-0.5 rounded-full', statusColor[ut.tournament?.status] || 'bg-gray-100 text-gray-500')}>
                              {statusLabel[ut.tournament?.status] || ut.tournament?.status}
                            </span>
                            <span className="text-xs text-gray-400">como "{ut.alias || ut.name}"</span>
                          </div>
                        </div>
                        {canRemove ? (
                          <button onClick={() => { if (confirm(`¿Quitar a ${selectedUser.name} del torneo ${ut.tournament?.name}?`)) removeTournamentMut.mutate(ut.id); }}
                            className="shrink-0 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={13} />
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300 shrink-0 px-2">🔒</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 flex items-center justify-center py-20">
            <div className="text-center text-gray-300">
              <Users size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Selecciona un usuario para editar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}