"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new client_1.PrismaClient();
const EQUIPOS_MUNDIAL = [
    { name: 'España', country: 'España', strength: 100, bombo: 1, grupo: 'H' },
    { name: 'Argentina', country: 'Argentina', strength: 99, bombo: 1, grupo: 'J' },
    { name: 'Francia', country: 'Francia', strength: 98, bombo: 1, grupo: 'I' },
    { name: 'Inglaterra', country: 'Inglaterra', strength: 96, bombo: 1, grupo: 'L' },
    { name: 'Brasil', country: 'Brasil', strength: 95, bombo: 1, grupo: 'C' },
    { name: 'Portugal', country: 'Portugal', strength: 93, bombo: 1, grupo: 'K' },
    { name: 'Países Bajos', country: 'Países Bajos', strength: 91, bombo: 2, grupo: 'F' },
    { name: 'Marruecos', country: 'Marruecos', strength: 89, bombo: 2, grupo: 'C' },
    { name: 'Bélgica', country: 'Bélgica', strength: 88, bombo: 2, grupo: 'G' },
    { name: 'Alemania', country: 'Alemania', strength: 87, bombo: 2, grupo: 'E' },
    { name: 'Croacia', country: 'Croacia', strength: 85, bombo: 2, grupo: 'L' },
    { name: 'Senegal', country: 'Senegal', strength: 83, bombo: 2, grupo: 'I' },
    { name: 'Colombia', country: 'Colombia', strength: 81, bombo: 3, grupo: 'K' },
    { name: 'Estados Unidos', country: 'Estados Unidos', strength: 79, bombo: 3, grupo: 'D' },
    { name: 'México', country: 'México', strength: 78, bombo: 3, grupo: 'A' },
    { name: 'Uruguay', country: 'Uruguay', strength: 76, bombo: 3, grupo: 'H' },
    { name: 'Suiza', country: 'Suiza', strength: 74, bombo: 3, grupo: 'B' },
    { name: 'Japón', country: 'Japón', strength: 72, bombo: 3, grupo: 'F' },
    { name: 'Noruega', country: 'Noruega', strength: 70, bombo: 4, grupo: 'I' },
    { name: 'Turquía', country: 'Turquía', strength: 68, bombo: 4, grupo: 'D' },
    { name: 'Australia', country: 'Australia', strength: 66, bombo: 4, grupo: 'D' },
    { name: 'Irán', country: 'Irán', strength: 65, bombo: 4, grupo: 'G' },
    { name: 'Corea del Sur', country: 'Corea del Sur', strength: 63, bombo: 4, grupo: 'A' },
    { name: 'Ecuador', country: 'Ecuador', strength: 62, bombo: 4, grupo: 'E' },
    { name: 'Escocia', country: 'Escocia', strength: 60, bombo: 5, grupo: 'C' },
    { name: 'Suecia', country: 'Suecia', strength: 59, bombo: 5, grupo: 'F' },
    { name: 'Austria', country: 'Austria', strength: 57, bombo: 5, grupo: 'J' },
    { name: 'Costa de Marfil', country: 'Costa de Marfil', strength: 56, bombo: 5, grupo: 'E' },
    { name: 'Egipto', country: 'Egipto', strength: 54, bombo: 5, grupo: 'G' },
    { name: 'Paraguay', country: 'Paraguay', strength: 52, bombo: 5, grupo: 'D' },
    { name: 'Rep. Checa', country: 'Rep. Checa', strength: 50, bombo: 6, grupo: 'A' },
    { name: 'Bosnia y Herzegovina', country: 'Bosnia y Herzegovina', strength: 49, bombo: 6, grupo: 'B' },
    { name: 'Canadá', country: 'Canadá', strength: 48, bombo: 6, grupo: 'B' },
    { name: 'RD Congo', country: 'RD Congo', strength: 46, bombo: 6, grupo: 'K' },
    { name: 'Túnez', country: 'Túnez', strength: 45, bombo: 6, grupo: 'F' },
    { name: 'Ghana', country: 'Ghana', strength: 43, bombo: 6, grupo: 'L' },
    { name: 'Uzbekistán', country: 'Uzbekistán', strength: 41, bombo: 7, grupo: 'K' },
    { name: 'Arabia Saudita', country: 'Arabia Saudita', strength: 40, bombo: 7, grupo: 'H' },
    { name: 'Argelia', country: 'Argelia', strength: 38, bombo: 7, grupo: 'J' },
    { name: 'Sudáfrica', country: 'Sudáfrica', strength: 37, bombo: 7, grupo: 'A' },
    { name: 'Nueva Zelanda', country: 'Nueva Zelanda', strength: 35, bombo: 7, grupo: 'G' },
    { name: 'Irak', country: 'Irak', strength: 34, bombo: 7, grupo: 'I' },
    { name: 'Cabo Verde', country: 'Cabo Verde', strength: 32, bombo: 8, grupo: 'H' },
    { name: 'Panamá', country: 'Panamá', strength: 30, bombo: 8, grupo: 'L' },
    { name: 'Catar', country: 'Catar', strength: 29, bombo: 8, grupo: 'B' },
    { name: 'Jordania', country: 'Jordania', strength: 27, bombo: 8, grupo: 'J' },
    { name: 'Haití', country: 'Haití', strength: 25, bombo: 8, grupo: 'C' },
    { name: 'Curaçao', country: 'Curaçao', strength: 23, bombo: 8, grupo: 'E' },
];
const SCORING_RULES_MUNDIAL = [
    { eventType: 'WIN_GROUP', points: 3, description: 'Victoria en fase de grupos' },
    { eventType: 'DRAW_GROUP', points: 1, description: 'Empate en fase de grupos' },
    { eventType: 'ADVANCE_ROUND_OF_32', points: 5, description: 'Clasificar a 16avos de final' },
    { eventType: 'ADVANCE_ROUND_OF_16', points: 8, description: 'Clasificar a octavos de final' },
    { eventType: 'ADVANCE_QUARTER', points: 12, description: 'Clasificar a cuartos de final' },
    { eventType: 'ADVANCE_SEMI', points: 17, description: 'Clasificar a semifinal' },
    { eventType: 'REACH_FINAL', points: 23, description: 'Llegar a la final' },
    { eventType: 'CHAMPION', points: 30, description: 'Campeón del torneo' },
    { eventType: 'RUNNER_UP', points: 20, description: 'Subcampeón' },
    { eventType: 'CLEAN_SHEET', points: 1, description: 'Portería en cero' },
    { eventType: 'THRASHING_WIN', points: 2, description: 'Goleada por 3+ goles' },
];
const SCORING_RULES_LIGAMX = [
    { eventType: 'WIN_GROUP', points: 3, description: 'Victoria en fase regular' },
    { eventType: 'DRAW_GROUP', points: 1, description: 'Empate en fase regular' },
    { eventType: 'ADVANCE_ROUND_OF_32', points: 2, description: 'Clasificar a Play-In' },
    { eventType: 'ADVANCE_ROUND_OF_16', points: 5, description: 'Clasificar a Liguilla' },
    { eventType: 'ADVANCE_SEMI', points: 6, description: 'Avanzar a semifinal' },
    { eventType: 'REACH_FINAL', points: 8, description: 'Avanzar a final' },
    { eventType: 'CHAMPION', points: 15, description: 'Campeón del torneo' },
    { eventType: 'CLEAN_SHEET', points: 1, description: 'Portería en cero' },
    { eventType: 'THRASHING_WIN', points: 2, description: 'Goleada por 3+ goles' },
    { eventType: 'SUPER_LEADERSHIP', points: 5, description: 'Superliderato' },
];
const LIGA_MX_TEAMS = [
    { name: 'Club América', country: 'México', strength: 95 },
    { name: 'Chivas Guadalajara', country: 'México', strength: 88 },
    { name: 'Tigres UANL', country: 'México', strength: 90 },
    { name: 'Monterrey', country: 'México', strength: 87 },
    { name: 'Cruz Azul', country: 'México', strength: 85 },
    { name: 'Pumas UNAM', country: 'México', strength: 78 },
    { name: 'Santos Laguna', country: 'México', strength: 75 },
    { name: 'Toluca', country: 'México', strength: 73 },
    { name: 'León', country: 'México', strength: 72 },
    { name: 'Atlas', country: 'México', strength: 70 },
    { name: 'Pachuca', country: 'México', strength: 68 },
    { name: 'Querétaro', country: 'México', strength: 55 },
    { name: 'Necaxa', country: 'México', strength: 52 },
    { name: 'Puebla', country: 'México', strength: 58 },
    { name: 'Mazatlán', country: 'México', strength: 45 },
    { name: 'FC Juárez', country: 'México', strength: 42 },
    { name: 'Tijuana', country: 'México', strength: 48 },
    { name: 'San Luis', country: 'México', strength: 40 },
];
function et(iso) { return new Date(iso + '-04:00'); }
async function main() {
    console.log('Seed Mundial 2026\n');
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
    console.log('Limpio');
    await prisma.user.create({ data: { name: 'Administrador', email: 'admin@quinielazo.mx', passwordHash: await bcrypt.hash('admin123', 10), role: 'ADMIN' } });
    const mundial = await prisma.tournament.create({
        data: { name: 'Mundial 2026', type: client_1.TournamentType.WORLD_CUP, season: '2026', teamCount: 48, participantCount: 6, competitionSystem: 'Fase de grupos + Eliminacion directa', status: client_1.TournamentStatus.SETUP, scoringConfig: {} },
    });
    for (const r of SCORING_RULES_MUNDIAL)
        await prisma.scoringRule.create({ data: { ...r, tournamentId: mundial.id } });
    const faseGrupos = await prisma.tournamentPhase.create({ data: { tournamentId: mundial.id, name: 'Fase de grupos', type: 'GROUP_STAGE', roundNumber: 1, isActive: true } });
    for (const [name, type, round] of [['16avos de final', 'ROUND_OF_32', 2], ['Octavos de final', 'ROUND_OF_16', 3], ['Cuartos de final', 'QUARTER_FINAL', 4], ['Semifinal', 'SEMI_FINAL', 5], ['Tercer lugar', 'THIRD_PLACE', 6], ['Final', 'FINAL', 7]]) {
        await prisma.tournamentPhase.create({ data: { tournamentId: mundial.id, name, type: type, roundNumber: round, isActive: false } });
    }
    const BOMBO_NOMBRES = ['Bombo 1 Favoritos', 'Bombo 2 Candidatos', 'Bombo 3 Competitivos', 'Bombo 4 Aspirantes', 'Bombo 5 Peleadores', 'Bombo 6 Sorpresas', 'Bombo 7 Debiles', 'Bombo 8 Cenicientas'];
    const bombos = [];
    for (let i = 0; i < 8; i++) {
        const eqs = EQUIPOS_MUNDIAL.filter(e => e.bombo === i + 1);
        const s = eqs.map(e => e.strength);
        bombos.push(await prisma.pot.create({ data: { tournamentId: mundial.id, name: BOMBO_NOMBRES[i], level: i + 1, strengthMin: Math.min(...s), strengthMax: Math.max(...s), teamsPerParticipant: 1 } }));
    }
    const teamMap = {};
    for (const eq of EQUIPOS_MUNDIAL) {
        const t = await prisma.team.create({ data: { tournamentId: mundial.id, name: eq.name, country: eq.country, strength: eq.strength, potId: bombos[eq.bombo - 1].id, phaseReached: `Grupo ${eq.grupo}`, status: 'ACTIVE' } });
        teamMap[eq.name] = t.id;
    }
    console.log('48 equipos y 8 bombos creados');
    const PARTIDOS = [
        ['México', 'Sudáfrica', '2026-06-11T15:00:00', 'Estadio Ciudad de Mexico', 'Grupo A'],
        ['Corea del Sur', 'Rep. Checa', '2026-06-11T22:00:00', 'Estadio Guadalajara', 'Grupo A'],
        ['Canadá', 'Bosnia y Herzegovina', '2026-06-12T15:00:00', 'Toronto Stadium', 'Grupo B'],
        ['Estados Unidos', 'Paraguay', '2026-06-12T21:00:00', 'Los Angeles Stadium', 'Grupo D'],
        ['Catar', 'Suiza', '2026-06-13T15:00:00', 'San Francisco Stadium', 'Grupo B'],
        ['Brasil', 'Marruecos', '2026-06-13T18:00:00', 'New York NJ Stadium', 'Grupo C'],
        ['Haití', 'Escocia', '2026-06-13T21:00:00', 'Boston Stadium', 'Grupo C'],
        ['Australia', 'Turquía', '2026-06-13T21:00:00', 'BC Place Vancouver', 'Grupo D'],
        ['Alemania', 'Curaçao', '2026-06-14T13:00:00', 'Houston Stadium', 'Grupo E'],
        ['Países Bajos', 'Japón', '2026-06-14T16:00:00', 'Dallas Stadium', 'Grupo F'],
        ['Costa de Marfil', 'Ecuador', '2026-06-14T19:00:00', 'Philadelphia Stadium', 'Grupo E'],
        ['Suecia', 'Túnez', '2026-06-14T22:00:00', 'Estadio Monterrey', 'Grupo F'],
        ['España', 'Cabo Verde', '2026-06-15T12:00:00', 'Atlanta Stadium', 'Grupo H'],
        ['Bélgica', 'Egipto', '2026-06-15T15:00:00', 'BC Place Vancouver', 'Grupo G'],
        ['Arabia Saudita', 'Uruguay', '2026-06-15T18:00:00', 'Miami Stadium', 'Grupo H'],
        ['Irán', 'Nueva Zelanda', '2026-06-15T21:00:00', 'Los Angeles Stadium', 'Grupo G'],
        ['Francia', 'Senegal', '2026-06-16T15:00:00', 'New York NJ Stadium', 'Grupo I'],
        ['Irak', 'Noruega', '2026-06-16T18:00:00', 'Boston Stadium', 'Grupo I'],
        ['Argentina', 'Argelia', '2026-06-16T21:00:00', 'Kansas City Stadium', 'Grupo J'],
        ['Austria', 'Jordania', '2026-06-17T00:00:00', 'San Francisco Stadium', 'Grupo J'],
        ['Portugal', 'RD Congo', '2026-06-17T13:00:00', 'Houston Stadium', 'Grupo K'],
        ['Inglaterra', 'Croacia', '2026-06-17T16:00:00', 'Dallas Stadium', 'Grupo L'],
        ['Ghana', 'Panamá', '2026-06-17T19:00:00', 'Toronto Stadium', 'Grupo L'],
        ['Uzbekistán', 'Colombia', '2026-06-17T22:00:00', 'Estadio Ciudad de Mexico', 'Grupo K'],
        ['Rep. Checa', 'Sudáfrica', '2026-06-18T12:00:00', 'Atlanta Stadium', 'Grupo A'],
        ['Suiza', 'Bosnia y Herzegovina', '2026-06-18T15:00:00', 'Los Angeles Stadium', 'Grupo B'],
        ['Canadá', 'Catar', '2026-06-18T18:00:00', 'BC Place Vancouver', 'Grupo B'],
        ['México', 'Corea del Sur', '2026-06-18T21:00:00', 'Estadio Guadalajara', 'Grupo A'],
        ['Estados Unidos', 'Australia', '2026-06-19T15:00:00', 'Seattle Stadium', 'Grupo D'],
        ['Escocia', 'Marruecos', '2026-06-19T18:00:00', 'Boston Stadium', 'Grupo C'],
        ['Brasil', 'Haití', '2026-06-19T21:00:00', 'Philadelphia Stadium', 'Grupo C'],
        ['Turquía', 'Paraguay', '2026-06-20T00:00:00', 'San Francisco Stadium', 'Grupo D'],
        ['Países Bajos', 'Suecia', '2026-06-20T13:00:00', 'Houston Stadium', 'Grupo F'],
        ['Alemania', 'Costa de Marfil', '2026-06-20T16:00:00', 'Toronto Stadium', 'Grupo E'],
        ['Ecuador', 'Curaçao', '2026-06-20T20:00:00', 'Kansas City Stadium', 'Grupo E'],
        ['Túnez', 'Japón', '2026-06-21T00:00:00', 'Estadio Monterrey', 'Grupo F'],
        ['España', 'Arabia Saudita', '2026-06-21T12:00:00', 'Atlanta Stadium', 'Grupo H'],
        ['Bélgica', 'Irán', '2026-06-21T15:00:00', 'Los Angeles Stadium', 'Grupo G'],
        ['Uruguay', 'Cabo Verde', '2026-06-21T18:00:00', 'Miami Stadium', 'Grupo H'],
        ['Nueva Zelanda', 'Egipto', '2026-06-21T21:00:00', 'BC Place Vancouver', 'Grupo G'],
        ['Argentina', 'Austria', '2026-06-22T13:00:00', 'Dallas Stadium', 'Grupo J'],
        ['Francia', 'Irak', '2026-06-22T17:00:00', 'Philadelphia Stadium', 'Grupo I'],
        ['Noruega', 'Senegal', '2026-06-22T20:00:00', 'New York NJ Stadium', 'Grupo I'],
        ['Jordania', 'Argelia', '2026-06-22T23:00:00', 'San Francisco Stadium', 'Grupo J'],
        ['Portugal', 'Uzbekistán', '2026-06-23T13:00:00', 'Houston Stadium', 'Grupo K'],
        ['Inglaterra', 'Ghana', '2026-06-23T16:00:00', 'Boston Stadium', 'Grupo L'],
        ['Panamá', 'Croacia', '2026-06-23T19:00:00', 'Toronto Stadium', 'Grupo L'],
        ['Colombia', 'RD Congo', '2026-06-23T22:00:00', 'Estadio Guadalajara', 'Grupo K'],
        ['Rep. Checa', 'México', '2026-06-24T21:00:00', 'Estadio Ciudad de Mexico', 'Grupo A'],
        ['Sudáfrica', 'Corea del Sur', '2026-06-24T21:00:00', 'Estadio Monterrey', 'Grupo A'],
        ['Suiza', 'Canadá', '2026-06-24T15:00:00', 'BC Place Vancouver', 'Grupo B'],
        ['Bosnia y Herzegovina', 'Catar', '2026-06-24T15:00:00', 'Seattle Stadium', 'Grupo B'],
        ['Brasil', 'Escocia', '2026-06-24T18:00:00', 'Miami Stadium', 'Grupo C'],
        ['Marruecos', 'Haití', '2026-06-24T18:00:00', 'Atlanta Stadium', 'Grupo C'],
        ['Turquía', 'Estados Unidos', '2026-06-25T22:00:00', 'Los Angeles Stadium', 'Grupo D'],
        ['Paraguay', 'Australia', '2026-06-25T22:00:00', 'San Francisco Stadium', 'Grupo D'],
        ['Ecuador', 'Alemania', '2026-06-25T16:00:00', 'New York NJ Stadium', 'Grupo E'],
        ['Curaçao', 'Costa de Marfil', '2026-06-25T16:00:00', 'Philadelphia Stadium', 'Grupo E'],
        ['Japón', 'Suecia', '2026-06-25T19:00:00', 'Dallas Stadium', 'Grupo F'],
        ['Túnez', 'Países Bajos', '2026-06-25T19:00:00', 'Kansas City Stadium', 'Grupo F'],
        ['Nueva Zelanda', 'Bélgica', '2026-06-26T23:00:00', 'BC Place Vancouver', 'Grupo G'],
        ['Egipto', 'Irán', '2026-06-26T23:00:00', 'Seattle Stadium', 'Grupo G'],
        ['Uruguay', 'España', '2026-06-26T20:00:00', 'Estadio Guadalajara', 'Grupo H'],
        ['Cabo Verde', 'Arabia Saudita', '2026-06-26T20:00:00', 'Houston Stadium', 'Grupo H'],
        ['Noruega', 'Francia', '2026-06-26T15:00:00', 'Boston Stadium', 'Grupo I'],
        ['Senegal', 'Irak', '2026-06-26T15:00:00', 'Toronto Stadium', 'Grupo I'],
        ['Argelia', 'Austria', '2026-06-27T22:00:00', 'Kansas City Stadium', 'Grupo J'],
        ['Jordania', 'Argentina', '2026-06-27T22:00:00', 'Dallas Stadium', 'Grupo J'],
        ['Colombia', 'Portugal', '2026-06-27T19:30:00', 'Miami Stadium', 'Grupo K'],
        ['RD Congo', 'Uzbekistán', '2026-06-27T19:30:00', 'Atlanta Stadium', 'Grupo K'],
        ['Panamá', 'Inglaterra', '2026-06-27T17:00:00', 'New York NJ Stadium', 'Grupo L'],
        ['Croacia', 'Ghana', '2026-06-27T17:00:00', 'Philadelphia Stadium', 'Grupo L'],
    ];
    let creados = 0;
    for (const [local, visitante, fechaET, sede, grupo] of PARTIDOS) {
        const homeId = teamMap[local], awayId = teamMap[visitante];
        if (!homeId || !awayId) {
            console.warn(`No encontrado: ${local} vs ${visitante}`);
            continue;
        }
        await prisma.match.create({ data: { tournamentId: mundial.id, phaseId: faseGrupos.id, homeTeamId: homeId, awayTeamId: awayId, matchDate: et(fechaET), notes: `${grupo} — ${sede}`, status: 'SCHEDULED' } });
        creados++;
    }
    console.log(`${creados}/72 partidos creados`);
    const ligaMx = await prisma.tournament.create({ data: { name: 'Liga MX — Apertura 2026', type: client_1.TournamentType.LIGA_MX, season: 'Apertura 2026', teamCount: 18, participantCount: 6, competitionSystem: 'Fase regular + Play-In + Liguilla', status: client_1.TournamentStatus.SETUP, scoringConfig: {} } });
    for (const t of LIGA_MX_TEAMS)
        await prisma.team.create({ data: { ...t, tournamentId: ligaMx.id } });
    for (const r of SCORING_RULES_LIGAMX)
        await prisma.scoringRule.create({ data: { ...r, tournamentId: ligaMx.id } });
    for (const [name, type, round, active] of [['Fase regular', 'REGULAR_SEASON', 1, true], ['Play-In', 'PLAY_IN', 2, false], ['Liguilla', 'LIGUILLA', 3, false], ['Cuartos', 'QUARTER_FINAL', 4, false], ['Semifinal', 'SEMI_FINAL', 5, false], ['Final', 'FINAL', 6, false]]) {
        await prisma.tournamentPhase.create({ data: { tournamentId: ligaMx.id, name, type: type, roundNumber: round, isActive: active } });
    }
    console.log('\nSeed completado!');
    console.log('Login: admin@quinielazo.mx / admin123');
    console.log('Mundial ID: ' + mundial.id);
    console.log('Liga MX ID: ' + ligaMx.id);
}
main().catch(e => { console.error(e); process.exit(1); }).finally(async () => prisma.$disconnect());
//# sourceMappingURL=seed.js.map