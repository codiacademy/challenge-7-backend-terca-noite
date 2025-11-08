import { prisma } from "../src/lib/prisma.ts";

async function clearAllTokens() {
  const deleted = await prisma.refreshtokens.deleteMany({});
  console.log(`${deleted.count} refresh tokens foram deletados com sucesso.`);
}

clearAllTokens()
  .catch((e) => {
    console.error("Erro ao deletar tokens:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
