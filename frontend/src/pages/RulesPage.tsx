import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tournamentsApi } from '../lib/api';
import { BookOpen, Trophy, Shield, Zap, Star } from 'lucide-react';

const EVENT_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  WIN_GROUP:            { label: 'Victoria en fase de grupos',     icon: '⚽', color: 'bg-green-50 border-green-200 text-green-700' },
  DRAW_GROUP:           { label: 'Empate en fase de grupos',       icon: '🤝', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  ADVANCE_ROUND_OF_32:  { label: 'Clasificar a 16avos de final',   icon: '🏃', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  ADVANCE_ROUND_OF_16:  { label: 'Clasificar a octavos de final',  icon: '🏃', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  ADVANCE_QUARTER:      { label: 'Clasificar a cuartos de final',  icon: '⚡', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  ADVANCE_SEMI:         { label: 'Clasificar a semifinal',         icon: '🔥', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  REACH_FINAL:          { label: 'Llegar a la final',              icon: '🌟', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  CHAMPION:             { label: 'Campeón del torneo',             icon: '🏆', color: 'bg-amber-50 border-amber-300 text-amber-800' },
  RUNNER_UP:            { label: 'Subcampeón',                     icon: '🥈', color: 'bg-gray-50 border-gray-300 text-gray-700' },
  CLEAN_SHEET:          { label: 'Portería en cero',               icon: '🧤', color: 'bg-teal-50 border-teal-200 text-teal-700' },
  THRASHING_WIN:        { label: 'Goleada (3+ goles de diferencia)',icon: '💥', color: 'bg-red-50 border-red-200 text-red-700' },
  SUPER_LEADERSHIP:     { label: 'Superliderato',                  icon: '👑', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  LAST_IN_GROUP:        { label: 'Último en grupo',                icon: '😬', color: 'bg-gray-50 border-gray-200 text-gray-500' },
  EARLY_ELIMINATION:    { label: 'Eliminación temprana',           icon: '❌', color: 'bg-red-50 border-red-200 text-red-400' },
};

export function RulesPage() {
  const { id: tournamentId } = useParams<{ id: string }>();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['scoring-rules', tournamentId],
    queryFn: () => tournamentsApi.getScoringRules(tournamentId!).then(r => r.data),
    enabled: !!tournamentId,
  });

  const { data: tournament } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => tournamentsApi.getById(tournamentId!).then(r => r.data),
    enabled: !!tournamentId,
  });

  const activeRules = rules.filter((r: any) => r.isActive);

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
          <BookOpen size={18} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reglas de puntuación</h1>
          {tournament && <p className="text-sm text-gray-400">{tournament.name}</p>}
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-6 ml-12">
        Estos son los puntos que ganas según el rendimiento de tus equipos.
      </p>

      {isLoading && <p className="text-center text-gray-400 py-8">Cargando reglas...</p>}

      {!isLoading && activeRules.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
          <p>No hay reglas configuradas aún</p>
        </div>
      )}

      <div className="space-y-3">
        {activeRules.map((rule: any) => {
          const meta = EVENT_LABELS[rule.eventType] || {
            label: rule.description || rule.eventType,
            icon: '📌',
            color: 'bg-gray-50 border-gray-200 text-gray-700',
          };
          return (
            <div key={rule.id}
              className={`flex items-center justify-between p-4 rounded-xl border ${meta.color}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{meta.icon}</span>
                <div>
                  <p className="font-medium text-sm">{meta.label}</p>
                  {rule.description && rule.description !== meta.label && (
                    <p className="text-xs opacity-70 mt-0.5">{rule.description}</p>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-2xl font-bold">+{rule.points}</p>
                <p className="text-xs opacity-70">pts</p>
              </div>
            </div>
          );
        })}
      </div>

      {!isLoading && activeRules.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            💡 Los puntos se calculan automáticamente al registrar resultados. 
            Consulta el desglose de tus puntos en la sección <strong>Mis Puntos</strong>.
          </p>
        </div>
      )}
    </div>
  );
}