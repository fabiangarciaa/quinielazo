import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15_000,
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('quinielazo-auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export const tournamentsApi = {
  getAll: () => api.get('/tournaments'),
  getById: (id: string) => api.get(`/tournaments/${id}`),
  create: (data: any) => api.post('/tournaments', data),
  update: (id: string, data: any) => api.patch(`/tournaments/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/tournaments/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/tournaments/${id}`),
  getScoringRules: (id: string) => api.get(`/tournaments/${id}/scoring-rules`),
  updateScoringRule: (tournamentId: string, ruleId: string, points: number, isActive: boolean) =>
    api.patch(`/tournaments/${tournamentId}/scoring-rules/${ruleId}`, { points, isActive }),
  upsertScoringRule: (tournamentId: string, data: any) =>
    api.post(`/tournaments/${tournamentId}/scoring-rules`, data),
};

export const participantsApi = {
  getByTournament: (tournamentId: string) => api.get(`/participants?tournamentId=${tournamentId}`),
  getByUser: (userId: string) => api.get(`/participants?userId=${userId}`),
  getOne: (id: string) => api.get(`/participants/${id}`),
  getScores: (id: string) => api.get(`/participants/${id}/scores`),
  create: (data: any) => api.post('/participants', data),
  update: (id: string, data: any) => api.patch(`/participants/${id}`, data),
  delete: (id: string) => api.delete(`/participants/${id}`),
  generateCredentials: (tournamentId: string) =>
    api.post(`/participants/generate-credentials/${tournamentId}`),
};

export const teamsApi = {
  getByTournament: (tournamentId: string) => api.get(`/teams?tournamentId=${tournamentId}`),
  getOne: (id: string) => api.get(`/teams/${id}`),
  create: (data: any) => api.post('/teams', data),
  update: (id: string, data: any) => api.patch(`/teams/${id}`, data),
  assign: (teamId: string, participantId: string | null) => api.patch(`/teams/${teamId}/assign`, { participantId }),
  delete: (id: string) => api.delete(`/teams/${id}`),
  importCsv: (tournamentId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    form.append('tournamentId', tournamentId);
    return api.post('/teams/import', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const potsApi = {
  getByTournament: (tournamentId: string) => api.get(`/pots?tournamentId=${tournamentId}`),
  create: (data: any) => api.post('/pots', data),
  update: (id: string, data: any) => api.patch(`/pots/${id}`, data),
  delete: (id: string) => api.delete(`/pots/${id}`),
  autoAssign: (tournamentId: string) => api.post('/pots/auto-assign', { tournamentId }),
};

export const drawsApi = {
  getByTournament: (tournamentId: string) => api.get(`/draws?tournamentId=${tournamentId}`),
  calculateProposal: (tournamentId: string) => api.post(`/draws/${tournamentId}/proposal`),
  executePots: (tournamentId: string) => api.post(`/draws/${tournamentId}/pots`),
  executeSnake: (tournamentId: string) => api.post(`/draws/${tournamentId}/snake`),
  executeBalanced: (tournamentId: string, teamsPerParticipant: number) =>
    api.post(`/draws/${tournamentId}/balanced`, { teamsPerParticipant }),
  reset: (tournamentId: string) => api.delete(`/draws/${tournamentId}/reset`),
};

export const phasesApi = {
  getByTournament: (tournamentId: string) => api.get(`/phases?tournamentId=${tournamentId}`),
  create: (data: any) => api.post('/phases', data),
  update: (id: string, data: any) => api.patch(`/phases/${id}`, data),
  setActive: (id: string) => api.patch(`/phases/${id}/activate`),
  delete: (id: string) => api.delete(`/phases/${id}`),
  getTeams: (phaseId: string) => api.get(`/phases/${phaseId}/teams`),
  closePhase: (phaseId: string, advancingTeamIds: string[]) =>
    api.post(`/phases/${phaseId}/close`, { advancingTeamIds }),
};

export const matchesApi = {
  getByTournament: (tournamentId: string, phaseId?: string) =>
    api.get(`/matches?tournamentId=${tournamentId}${phaseId ? `&phaseId=${phaseId}` : ''}`),
  getOne: (id: string) => api.get(`/matches/${id}`),
  create: (data: any) => api.post('/matches', data),
  createBulk: (data: any) => api.post('/matches/bulk', data),
  generateGroups: (tournamentId: string, teamsPerGroup: number) =>
    api.post('/matches/generate-groups', { tournamentId, teamsPerGroup }),
  deleteByPhase: (phaseId: string) => api.delete(`/matches/by-phase/${phaseId}`),
  update: (id: string, data: any) => api.patch(`/matches/${id}`, data),
  delete: (id: string) => api.delete(`/matches/${id}`),
  recordResult: (matchId: string, data: any) => api.post(`/matches/${matchId}/result`, data),
  correctResult: (matchId: string, data: any) => api.post(`/matches/${matchId}/correct`, data),
  deleteResult: (matchId: string) => api.delete(`/matches/${matchId}/result`),
};

export const rankingApi = {
  get: (tournamentId: string) => api.get(`/ranking/${tournamentId}`),
  getHistory: (tournamentId: string) => api.get(`/ranking/${tournamentId}/history`),
};

export const simulatorApi = {
  simulate: (tournamentId: string) => api.get(`/simulator/${tournamentId}`),
  simulateTeamWin: (tournamentId: string, teamId: string) =>
    api.post(`/simulator/${tournamentId}/team-win`, { teamId }),
  simulateMatch: (tournamentId: string, matchId: string, homeGoals: number, awayGoals: number, advancingTeamId?: string) =>
    api.post(`/simulator/${tournamentId}/match`, { matchId, homeGoals, awayGoals, advancingTeamId }),
};

export const exportApi = {
  ranking: (tournamentId: string, format: 'csv' | 'excel') =>
    api.get(`/export/${tournamentId}/ranking?format=${format}`, { responseType: 'blob' }),
};

export const resultsApi = {
  getByTournament: (tournamentId: string) => api.get(`/results?tournamentId=${tournamentId}`),
  getImpact: (resultId: string) => api.get(`/results/${resultId}/impact`),
};

export const usersApi = {
  getAll: () => api.get('/users'),
  getOne: (id: string) => api.get(`/users/${id}`),
  getTournaments: (id: string) => api.get(`/users/${id}/tournaments`),
  adminUpdate: (id: string, data: { name?: string; email?: string; username?: string }) =>
    api.patch(`/users/${id}/admin`, data),
  adminResetPassword: (id: string, password: string) =>
    api.patch(`/users/${id}/reset-password`, { password }),
  addToTournament: (id: string, tournamentId: string, name: string) =>
    api.post(`/users/${id}/tournaments`, { tournamentId, name }),
  removeFromTournament: (participantId: string) =>
    api.delete(`/users/participants/${participantId}`),
  assignUsername: (id: string, username: string) =>
    api.patch(`/users/${id}/username`, { username }),
  updateProfile: (id: string, data: { name?: string; password?: string }) =>
    api.patch(`/users/${id}/profile`, data),
  updateAlias: (id: string, participantId: string, alias: string) =>
    api.patch(`/users/${id}/alias`, { participantId, alias }),
};