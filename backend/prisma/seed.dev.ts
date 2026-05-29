import { PrismaClient, TournamentType, TournamentStatus, ScoringEventType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed DEV — Quinielazo\n');

  // Limpiar todo
  await prisma.rankingHistory.deleteMany({});
  await prisma.participantScore.deleteMany({});
  await prisma.teamScore.deleteMany({});
  await prisma.result.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.pot.deleteMany({});
  await prisma.draw.deleteMany({});
  await prisma.scoringRule.deleteMany({});
  await prisma.tournamentPhase.deleteMany({});
  await prisma.participant.deleteMany({});
  await prisma.tournament.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('✅ Base de datos limpia');

  // Admin
  await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'admin@quinielazo.mx',
      username: 'quinielazo.admin',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    },
  });

  // Usuarios participantes
  const usersData = [
    { name: 'Fabian Garcia',  username: 'fabian.garcia',  email: 'fabian@quinielazo.mx',  password: 'test123' },
    { name: 'Norf',           username: 'norf',            email: 'norf@quinielazo.mx',    password: 'test123' },
    { name: 'Carlos Lopez',   username: 'carlos.lopez',   email: 'carlos@quinielazo.mx',  password: 'test123' },
    { name: 'Maria Torres',   username: 'maria.torres',   email: 'maria@quinielazo.mx',   password: 'test123' },
    { name: 'Juan Perez',     username: 'juan.perez',     email: 'juan@quinielazo.mx',    password: 'test123' },
    { name: 'Ana Gomez',      username: 'ana.gomez',      email: 'ana@quinielazo.mx',     password: 'test123' },
  ];

  const users = [];
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        username: u.username,
        passwordHash: await bcrypt.hash(u.password, 10),
        role: 'USER',
      },
    });
    users.push({ ...user, password: u.password });
  }
  console.log('✅ 6 usuarios participantes creados');

  // Torneo Mundial 2026
  const mundial = await prisma.tournament.create({
    data: {
      name: 'Mundial 2026',
      type: TournamentType.WORLD_CUP,
      season: '2026',
      teamCount: 6,
      participantCount: 6,
      competitionSystem: 'Fase de grupos + Eliminación directa',
      status: TournamentStatus.IN_PROGRESS,
      scoringConfig: {},
    },
  });

  // Reglas de puntuación
  const rules = [
    { eventType: 'WIN_GROUP' as ScoringEventType,           points: 3,  description: 'Victoria en fase de grupos' },
    { eventType: 'DRAW_GROUP' as ScoringEventType,          points: 1,  description: 'Empate en fase de grupos' },
    { eventType: 'ADVANCE_ROUND_OF_16' as ScoringEventType, points: 8,  description: 'Clasificar a octavos de final' },
    { eventType: 'ADVANCE_QUARTER' as ScoringEventType,     points: 12, description: 'Clasificar a cuartos de final' },
    { eventType: 'ADVANCE_SEMI' as ScoringEventType,        points: 17, description: 'Clasificar a semifinal' },
    { eventType: 'REACH_FINAL' as ScoringEventType,         points: 23, description: 'Llegar a la final' },
    { eventType: 'CHAMPION' as ScoringEventType,            points: 30, description: 'Campeón del torneo' },
    { eventType: 'RUNNER_UP' as ScoringEventType,           points: 20, description: 'Subcampeón' },
    { eventType: 'THIRD_PLACE' as ScoringEventType,         points: 15, description: 'Tercer lugar' },
    { eventType: 'CLEAN_SHEET' as ScoringEventType,         points: 1,  description: 'Portería en cero' },
    { eventType: 'THRASHING_WIN' as ScoringEventType,       points: 2,  description: 'Goleada por 3+ goles' },
  ];

  const scoringRules: any[] = [];
  for (const r of rules) {
    const rule = await prisma.scoringRule.create({ data: { ...r, tournamentId: mundial.id } });
    scoringRules.push(rule);
  }

  // Fase de grupos
  const fase = await prisma.tournamentPhase.create({
    data: { tournamentId: mundial.id, name: 'Fase de grupos', type: 'GROUP_STAGE', roundNumber: 1, isActive: true },
  });

  // 6 equipos (1 por participante)
  const equipos = [
    { name: 'España',    country: 'España',    strength: 100 },
    { name: 'Argentina', country: 'Argentina', strength: 99  },
    { name: 'Francia',   country: 'Francia',   strength: 98  },
    { name: 'Brasil',    country: 'Brasil',    strength: 95  },
    { name: 'México',    country: 'México',    strength: 78  },
    { name: 'Alemania',  country: 'Alemania',  strength: 87  },
  ];

  // Crear participantes y asignar equipos
  const participants = [];
  for (let i = 0; i < users.length; i++) {
    const participant = await prisma.participant.create({
      data: {
        tournamentId: mundial.id,
        userId: users[i].id,
        name: users[i].name,
        alias: users[i].username,
      },
    });

    const team = await prisma.team.create({
      data: {
        tournamentId: mundial.id,
        participantId: participant.id,
        name: equipos[i].name,
        country: equipos[i].country,
        strength: equipos[i].strength,
        status: 'ACTIVE',
      },
    });

    participants.push({ ...participant, team });
  }
  console.log('✅ 6 participantes y equipos creados');

  // Crear 3 partidos con resultados
  const partidos = [
    { home: 0, away: 1, homeGoals: 2, awayGoals: 1 }, // España 2-1 Argentina
    { home: 2, away: 3, homeGoals: 0, awayGoals: 0 }, // Francia 0-0 Brasil
    { home: 4, away: 5, homeGoals: 1, awayGoals: 3 }, // México 1-3 Alemania
  ];

  for (const p of partidos) {
    const homeTeam = participants[p.home].team;
    const awayTeam = participants[p.away].team;
    const isThrashing = Math.abs(p.homeGoals - p.awayGoals) >= 3;
    const homeWin = p.homeGoals > p.awayGoals;
    const awayWin = p.awayGoals > p.homeGoals;
    const draw = p.homeGoals === p.awayGoals;

    const match = await prisma.match.create({
      data: {
        tournamentId: mundial.id,
        phaseId: fase.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        status: 'FINISHED',
        matchDate: new Date(),
      },
    });

    const result = await prisma.result.create({
      data: {
        matchId: match.id,
        homeGoals: p.homeGoals,
        awayGoals: p.awayGoals,
        homeCleanSheet: p.awayGoals === 0,
        awayCleanSheet: p.homeGoals === 0,
        isThrashing,
        winnerTeamId: homeWin ? homeTeam.id : awayWin ? awayTeam.id : null,
      },
    });

    // Calcular puntos manualmente
    const winRule = scoringRules.find(r => r.eventType === 'WIN_GROUP');
    const drawRule = scoringRules.find(r => r.eventType === 'DRAW_GROUP');
    const cleanRule = scoringRules.find(r => r.eventType === 'CLEAN_SHEET');
    const thrashRule = scoringRules.find(r => r.eventType === 'THRASHING_WIN');

    const homeParticipant = participants[p.home];
    const awayParticipant = participants[p.away];

    // Puntos local
    if (homeWin && winRule) {
      await prisma.participantScore.create({
        data: { participantId: homeParticipant.id, tournamentId: mundial.id, resultId: result.id, scoringRuleId: winRule.id, teamId: homeTeam.id, pointsEarned: winRule.points, reason: `Victoria de ${homeTeam.name}` },
      });
    }
    if (draw && drawRule) {
      await prisma.participantScore.create({
        data: { participantId: homeParticipant.id, tournamentId: mundial.id, resultId: result.id, scoringRuleId: drawRule.id, teamId: homeTeam.id, pointsEarned: drawRule.points, reason: `Empate de ${homeTeam.name}` },
      });
    }
    if (p.awayGoals === 0 && cleanRule) {
      await prisma.participantScore.create({
        data: { participantId: homeParticipant.id, tournamentId: mundial.id, resultId: result.id, scoringRuleId: cleanRule.id, teamId: homeTeam.id, pointsEarned: cleanRule.points, reason: `Portería en cero de ${homeTeam.name}` },
      });
    }

    // Puntos visitante
    if (awayWin && winRule) {
      await prisma.participantScore.create({
        data: { participantId: awayParticipant.id, tournamentId: mundial.id, resultId: result.id, scoringRuleId: winRule.id, teamId: awayTeam.id, pointsEarned: winRule.points, reason: `Victoria de ${awayTeam.name}` },
      });
    }
    if (draw && drawRule) {
      await prisma.participantScore.create({
        data: { participantId: awayParticipant.id, tournamentId: mundial.id, resultId: result.id, scoringRuleId: drawRule.id, teamId: awayTeam.id, pointsEarned: drawRule.points, reason: `Empate de ${awayTeam.name}` },
      });
    }
    if (p.homeGoals === 0 && cleanRule) {
      await prisma.participantScore.create({
        data: { participantId: awayParticipant.id, tournamentId: mundial.id, resultId: result.id, scoringRuleId: cleanRule.id, teamId: awayTeam.id, pointsEarned: cleanRule.points, reason: `Portería en cero de ${awayTeam.name}` },
      });
    }
    if (isThrashing && thrashRule) {
      const winnerParticipant = homeWin ? homeParticipant : awayParticipant;
      const winnerTeam = homeWin ? homeTeam : awayTeam;
      await prisma.participantScore.create({
        data: { participantId: winnerParticipant.id, tournamentId: mundial.id, resultId: result.id, scoringRuleId: thrashRule.id, teamId: winnerTeam.id, pointsEarned: thrashRule.points, reason: `Goleada de ${winnerTeam.name}` },
      });
    }
  }
  console.log('✅ 3 partidos con resultados y puntos creados');

  // Actualizar puntos totales
  for (const p of participants) {
    const scores = await prisma.participantScore.findMany({ where: { participantId: p.id } });
    const total = scores.reduce((sum, s) => sum + s.pointsEarned, 0);
    await prisma.participant.update({ where: { id: p.id }, data: { totalPoints: total } });
  }
  console.log('✅ Puntos totales actualizados');

  console.log('\n🎉 Seed DEV completado!');
  console.log('─────────────────────────────');
  console.log('Admin:    quinielazo.admin / admin123');
  console.log('─────────────────────────────');
  users.forEach(u => console.log(`${u.username.padEnd(20)} / test123`));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => prisma.$disconnect());