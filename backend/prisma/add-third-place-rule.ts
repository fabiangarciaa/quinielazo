import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tournaments = await prisma.tournament.findMany({
  where: { type: 'WORLD_CUP' },
});

  for (const tournament of tournaments) {
    const exists = await prisma.scoringRule.findFirst({
      where: { tournamentId: tournament.id, eventType: 'THIRD_PLACE' },
    });

    if (!exists) {
      await prisma.scoringRule.create({
        data: {
          tournamentId: tournament.id,
          eventType: 'THIRD_PLACE',
          points: 15,
          description: 'Tercer lugar',
          isActive: true,
        },
      });
      console.log(`✅ Regla Tercer lugar agregada a: ${tournament.name}`);
    } else {
      console.log(`⏭ Ya existe en: ${tournament.name}`);
    }
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => prisma.$disconnect());