import { prisma } from "../lib/prisma.ts";

async function clearTwoFactorRequests() {
  const deleted = await prisma.twoFactorRequest.deleteMany({});
  console.log(`${deleted.count} requests de 2FA foram deletados com sucesso.`);
}

clearTwoFactorRequests()
  .catch((e) => {
    console.error("Erro ao deletar tokens:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
