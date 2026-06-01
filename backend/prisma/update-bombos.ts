import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cambios de fuerza acordados
const STRENGTH_UPDATES: Record<string, number> = {
  'Bélgica':        80,
  'Senegal':        81,
  'Colombia':       84,
  'Estados Unidos': 70,
  'Uruguay':        86,
  'Ecuador':        73,
};

// Distribución final de bombos (ordenados por fuerza)
const BOMBO_ASSIGNMENTS: Record<string, number> = {
  // Bombo 1
  'España':         1,
  'Argentina':      1,
  'Francia':        1,
  'Inglaterra':     1,
  'Brasil':         1,
  'Portugal':       1,
  // Bombo 2
  'Países Bajos':   2,
  'Marruecos':      2,
  'Alemania':       2,
  'Uruguay':        2,
  'Croacia':        2,
  'Colombia':       2,
  // Bombo 3
  'Senegal':        3,
  'Bélgica':        3,
  'México':         3,
  'Suiza':          3,
  'Ecuador':        3,
  'Japón':          3,
  // Bombo 4
  'Noruega':        4,
  'Estados Unidos': 4,
  'Turquía':        4,
  'Australia':      4,
  'Irán':           4,
  'Corea del Sur':  4,
  // Bombo 5 — sin cambios
  'Escocia':        5,
  'Suecia':         5,
  'Austria':        5,
  'Costa de Marfil':5,
  'Egipto':         5,
  'Paraguay':       5,
  // Bombo 6 — sin cambios
  'Rep. Checa':     6,
  'Bosnia y Herzegovina': 6,
  'Canadá':         6,
  'RD Congo':       6,
  'Túnez':          6,
  'Ghana':          6,
  // Bombo 7 — sin cambios
  'Uzbekistán':     7,
  'Arabia Saudita': 7,
  'Argelia':        7,
  'Sudáfrica':      7,
  'Nueva Zelanda':  7,
  'Irak':           7,
  // Bombo 8 — sin cambios
  'Cabo Verde':     8,
  'Panamá':         8,
  'Catar':          8,
  'Jordania':       8,
  'Haití':          8,
  'Curaçao':        8,
};

const BOMBO_NOMBRES = [
  'Bombo 1 Favoritos',
  'Bombo 2 Candidatos',
  'Bombo 3 Competitivos',
  'Bombo 4 Aspirantes',
  'Bombo 5 Peleadores',
  'Bombo 6 Sorpresas',
  'Bombo 7 Debiles',
  'Bombo 8 Cenicientas',
];

async function main() {
  console.log('🎲 Actualizando fuerzas y bombos del Mundial 2026...\n');

  // Buscar el torneo Mundial 2026
  const mundial = await prisma.tournament.findFirst({
    where: { name: { contains: 'Mundial' } },
    include: { teams: true, pots: true },
  });

  if (!mundial) {
    console.error('❌ No se encontró el torneo Mundial 2026');
    process.exit(1);
  }

  console.log(`✅ Torneo encontrado: ${mundial.name} (${mundial.id})`);
  console.log(`   ${mundial.teams.length} equipos, ${mundial.pots.length} bombos\n`);

  // Paso 1 — Actualizar fuerzas de equipos
  console.log('📊 Actualizando fuerzas...');
  for (const [name, strength] of Object.entries(STRENGTH_UPDATES)) {
    const team = mundial.teams.find(t => t.name === name);
    if (!team) {
      console.warn(`  ⚠️  No encontrado: ${name}`);
      continue;
    }
    await prisma.team.update({
      where: { id: team.id },
      data: { strength },
    });
    console.log(`  ✅ ${name}: ${team.strength} → ${strength}`);
  }

  // Paso 2 — Actualizar bombos (pots)
  console.log('\n🎯 Actualizando bombos...');

  // Obtener bombos actuales
  const pots = await prisma.pot.findMany({
    where: { tournamentId: mundial.id },
    orderBy: { level: 'asc' },
  });

  // Actualizar nombres y rangos de fuerza por bombo
  const bomboStrengths: Record<number, number[]> = {};
  for (const [name, bomboNum] of Object.entries(BOMBO_ASSIGNMENTS)) {
    const strength = STRENGTH_UPDATES[name] ||
      mundial.teams.find(t => t.name === name)?.strength || 0;
    if (!bomboStrengths[bomboNum]) bomboStrengths[bomboNum] = [];
    bomboStrengths[bomboNum].push(strength);
  }

  for (let i = 1; i <= 8; i++) {
    const pot = pots.find(p => p.level === i);
    if (!pot) {
      console.warn(`  ⚠️  Bombo ${i} no encontrado`);
      continue;
    }
    const strengths = bomboStrengths[i] || [];
    await prisma.pot.update({
      where: { id: pot.id },
      data: {
        name: BOMBO_NOMBRES[i - 1],
        strengthMin: Math.min(...strengths),
        strengthMax: Math.max(...strengths),
      },
    });
    console.log(`  ✅ Bombo ${i}: ${Math.min(...strengths)}-${Math.max(...strengths)}`);
  }

  // Paso 3 — Reasignar equipos a sus nuevos bombos
  console.log('\n🔄 Reasignando equipos a bombos correctos...');

  const updatedTeams = await prisma.team.findMany({
    where: { tournamentId: mundial.id },
  });

  const updatedPots = await prisma.pot.findMany({
    where: { tournamentId: mundial.id },
    orderBy: { level: 'asc' },
  });

  let reasignados = 0;
  let noEncontrados = 0;

  for (const team of updatedTeams) {
    const nuevoBomboNum = BOMBO_ASSIGNMENTS[team.name];
    if (!nuevoBomboNum) {
      console.warn(`  ⚠️  Sin asignación de bombo para: ${team.name}`);
      noEncontrados++;
      continue;
    }

    const nuevoPot = updatedPots.find(p => p.level === nuevoBomboNum);
    if (!nuevoPot) continue;

    if (team.potId !== nuevoPot.id) {
      await prisma.team.update({
        where: { id: team.id },
        data: { potId: nuevoPot.id },
      });
      console.log(`  ✅ ${team.name} → Bombo ${nuevoBomboNum}`);
      reasignados++;
    }
  }

  console.log(`\n  ${reasignados} equipos reasignados`);
  if (noEncontrados > 0) console.warn(`  ⚠️  ${noEncontrados} equipos sin asignación`);

  // Resumen final
  console.log('\n' + '═'.repeat(60));
  console.log('✅ Actualización completada!\n');
  console.log('📦 Bombos finales:');
  for (let b = 1; b <= 8; b++) {
    const equipos = Object.entries(BOMBO_ASSIGNMENTS)
      .filter(([, num]) => num === b)
      .map(([name]) => name)
      .join(', ');
    console.log(`   Bombo ${b}: ${equipos}`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => prisma.$disconnect());