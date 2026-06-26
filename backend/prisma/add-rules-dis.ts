import { PrismaClient, ScoringEventType } from '@prisma/client';

const prisma = new PrismaClient();
const TOURNAMENT_ID = '452e41ce-d007-403b-b36b-ed8466597723';

const SCORING_RULES = [
  { eventType: 'WIN_GROUP' as ScoringEventType,           points: 4,  description: 'Victoria en fase de grupos' },
  { eventType: 'DRAW_GROUP' as ScoringEventType,          points: 2,  description: 'Empate en fase de grupos' },
  { eventType: 'ADVANCE_ROUND_OF_32' as ScoringEventType, points: 4,  description: 'Clasificar a 16avos de final' },
  { eventType: 'ADVANCE_ROUND_OF_16' as ScoringEventType, points: 6,  description: 'Clasificar a octavos de final' },
  { eventType: 'ADVANCE_QUARTER' as ScoringEventType,     points: 8,  description: 'Clasificar a cuartos de final' },
  { eventType: 'ADVANCE_SEMI' as ScoringEventType,        points: 12, description: 'Clasificar a semifinal' },
  { eventType: 'REACH_FINAL' as ScoringEventType,         points: 15, description: 'Llegar a la final' },
  { eventType: 'CHAMPION' as ScoringEventType,            points: 20, description: 'Campeón del torneo' },
  { eventType: 'RUNNER_UP' as ScoringEventType,           points: 10, description: 'Subcampeón' },
  { eventType: 'THIRD_PLACE' as ScoringEventType,         points: 7,  description: 'Tercer lugar' },
  { eventType: 'CLEAN_SHEET' as ScoringEventType,         points: 3,  description: 'Portería en cero' },
  { eventType: 'THRASHING_WIN' as ScoringEventType,       points: 4,  description: 'Goleada por 3+ goles' },
];

async function main() {
  console.log('Agregando reglas de puntuación al torneo DIS...\n');

  // Borrar reglas existentes por si acaso
  await prisma.scoringRule.deleteMany({ where: { tournamentId: TOURNAMENT_ID } });

  for (const rule of SCORING_RULES) {
    await prisma.scoringRule.create({ data: { ...rule, tournamentId: TOURNAMENT_ID } });
    console.log(`✅ ${rule.description} → ${rule.points} pts`);
  }

  console.log('\n✅ Reglas agregadas correctamente');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => prisma.$disconnect());