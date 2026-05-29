import { useState, useEffect } from 'react';
import { useAuthStore, useTournamentStore } from '../store/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, participantsApi } from '../lib/api';
import { User, KeyRound, AtSign, Save, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const { user, setToken } = useAuthStore();
  const { activeTournamentId } = useTournamentStore();
  const queryClient = useQueryClient();

  const [name, setName] = useState(user?.name || '');
  const [alias, setAlias] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { data: participations } = useQuery({
    queryKey: ['my-participations', user?.id],
    queryFn: () => participantsApi.getByUser(user!.id).then(r => r.data),
    enabled: !!user?.id,
  });

  const currentParticipant = participations?.find(
    (p: any) => p.tournament.id === activeTournamentId
  ) || participations?.[0];

  useEffect(() => {
    if (currentParticipant) setAlias(currentParticipant.alias || '');
  }, [currentParticipant]);

  const updateProfile = useMutation({
    mutationFn: () => usersApi.updateProfile(user!.id, {
      name: name !== user?.name ? name : undefined,
      password: password || undefined,
    }),
    onSuccess: (res: any) => {
      const token = useAuthStore.getState().token!;
      setToken(token, res.data);
      queryClient.invalidateQueries({ queryKey: ['my-participations'] });
      toast.success('Perfil actualizado');
      setPassword('');
      setConfirmPassword('');
    },
    onError: () => toast.error('Error al actualizar perfil'),
  });

  const updateAlias = useMutation({
    mutationFn: () => usersApi.updateAlias(user!.id, currentParticipant.id, alias),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-participations'] });
      queryClient.invalidateQueries({ queryKey: ['ranking'] });
      toast.success('Apodo actualizado');
    },
    onError: () => toast.error('Error al actualizar apodo'),
  });

  const handleSaveProfile = () => {
    if (password && password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (password && password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    updateProfile.mutate();
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi Perfil</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
            <User size={18} className="text-amber-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-800">Información de cuenta</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Usuario</label>
            <div className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed">
              {user?.username || '—'}
            </div>
            <p className="text-xs text-gray-400 mt-1">El usuario lo asigna el administrador</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Tu nombre"
            />
          </div>
        </div>
      </div>

      {currentParticipant && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <AtSign size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-800">Apodo en el torneo</h2>
              <p className="text-xs text-gray-400">{currentParticipant.tournament.name}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={alias}
              onChange={e => setAlias(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Tu apodo"
            />
            <button
              onClick={() => updateAlias.mutate()}
              disabled={updateAlias.isPending}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              <Save size={15} />
              Guardar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
            <KeyRound size={18} className="text-green-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-800">Cambiar contraseña</h2>
        </div>
        <div className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 pr-10"
              placeholder="Mínimo 6 caracteres"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Repite la contraseña"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSaveProfile}
        disabled={updateProfile.isPending}
        className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
      >
        <Save size={18} />
        {updateProfile.isPending ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  );
}