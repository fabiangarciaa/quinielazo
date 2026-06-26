import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FLAGS: Record<string, string> = {
  'España':               '🇪🇸 España',
  'Argentina':            '🇦🇷 Argentina',
  'Francia':              '🇫🇷 Francia',
  'Inglaterra':           '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra',
  'Brasil':               '🇧🇷 Brasil',
  'Portugal':             '🇵🇹 Portugal',
  'Países Bajos':         '🇳🇱 Países Bajos',
  'Marruecos':            '🇲🇦 Marruecos',
  'Bélgica':              '🇧🇪 Bélgica',
  'Alemania':             '🇩🇪 Alemania',
  'Croacia':              '🇭🇷 Croacia',
  'Senegal':              '🇸🇳 Senegal',
  'Colombia':             '🇨🇴 Colombia',
  'Estados Unidos':       '🇺🇸 Estados Unidos',
  'México':               '🇲🇽 México',
  'Uruguay':              '🇺🇾 Uruguay',
  'Suiza':                '🇨🇭 Suiza',
  'Japón':                '🇯🇵 Japón',
  'Noruega':              '🇳🇴 Noruega',
  'Turquía':              '🇹🇷 Turquía',
  'Australia':            '🇦🇺 Australia',
  'Irán':                 '🇮🇷 Irán',
  'Corea del Sur':        '🇰🇷 Corea del Sur',
  'Ecuador':              '🇪🇨 Ecuador',
  'Escocia':              '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia',
  'Suecia':               '🇸🇪 Suecia',
  'Austria':              '🇦🇹 Austria',
  'Costa de Marfil':      '🇨🇮 Costa de Marfil',
  'Egipto':               '🇪🇬 Egipto',
  'Paraguay':             '🇵🇾 Paraguay',
  'Rep. Checa':           '🇨🇿 Rep. Checa',
  'Bosnia y Herzegovina': '🇧🇦 Bosnia y Herzegovina',
  'Canadá':               '🇨🇦 Canadá',
  'RD Congo':             '🇨🇩 RD Congo',
  'Túnez':                '🇹🇳 Túnez',
  'Ghana':                '🇬🇭 Ghana',
  'Uzbekistán':           '🇺🇿 Uzbekistán',
  'Arabia Saudita':       '🇸🇦 Arabia Saudita',
  'Argelia':              '🇩🇿 Argelia',
  'Sudáfrica':            '🇿🇦 Sudáfrica',
  'Nueva Zelanda':        '🇳🇿 Nueva Zelanda',
  'Irak':                 '🇮🇶 Irak',
  'Cabo Verde':           '🇨🇻 Cabo Verde',
  'Panamá':               '🇵🇦 Panamá',
  'Catar':                '🇶🇦 Catar',
  'Jordania':             '🇯🇴 Jordania',
  'Haití':                '🇭🇹 Haití',
  'Curaçao':              '🇨🇼 Curaçao',
};

async function main() {
  console.log('Agregando banderas a equipos...\n');
  let updated = 0;

  for (const [oldName, newName] of Object.entries(FLAGS)) {
    const result = await prisma.team.updateMany({
      where: { name: oldName },
      data: { name: newName },
    });
    if (result.count > 0) {
      console.log(`✅ ${oldName} → ${newName}`);
      updated += result.count;
    }
  }

  console.log(`\n${updated} equipos actualizados`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => prisma.$disconnect());