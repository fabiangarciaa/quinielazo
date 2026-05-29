import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';

interface User { id: string; name: string; email: string; username: string | null; role: string; }

interface AuthState {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setToken: (token: string, user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { identifier: email, password });
        set({ token: data.access_token, user: data.user });
        api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
      },
      logout: () => {
        set({ token: null, user: null });
        delete api.defaults.headers.common['Authorization'];
      },
      setToken: (token, user) => {
        set({ token, user });
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      },
    }),
    {
      name: 'quinielazo-auth',
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
      },
    },
  ),
);

interface TournamentState {
  activeTournamentId: string | null;
  setActiveTournament: (id: string | null) => void;
}

export const useTournamentStore = create<TournamentState>()(
  persist(
    (set) => ({
      activeTournamentId: null,
      setActiveTournament: (id) => set({ activeTournamentId: id }),
    }),
    { name: 'quinielazo-tournament' },
  ),
);
