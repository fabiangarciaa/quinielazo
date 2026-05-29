import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tournaments = await prisma.tournament.findMany({
    where: { type: 'LIGA_MX' },
  });

  for (const tournament of tournaments) {
    const deleted = await prisma.scoringRule.deleteMany({
      where: {
        tournamentId: tournament.id,
        eventType: 'THIRD_PLACE',
      },
    });
    if (deleted.count > 0) {
      console.log(`✅ Regla Tercer lugar eliminada de: ${tournament.name}`);
    } else {
      console.log(`⏭ No existía en: ${tournament.name}`);
    }
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => prisma.$disconnect());