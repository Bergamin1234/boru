import { PrismaClient } from '@prisma/client';
import { ensureGamificationSeeded } from '../src/gamificationService';

const prisma = new PrismaClient();

async function main() {
  await ensureGamificationSeeded(prisma, false);
  const ranks = await prisma.gamificationRank.count();
  const achievements = await prisma.gamificationAchievement.count();
  console.log(`✅ Trilha do Nak Muay inicializada: ${ranks} Ranks e ${achievements} Conquistas ativas no banco.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
