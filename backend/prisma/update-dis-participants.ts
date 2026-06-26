import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TOURNAMENT_ID = '452e41ce-d007-403b-b36b-ed8466597723';

async function main() {
  const updated = await prisma.tournament.update({
    where: { id: TOURNAMENT_ID },
    data: { participantCount: 8 },
  });
  console.log(`✅ ${updated.name} — participantCount actualizado a ${updated.participantCount}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => prisma.$disconnect());