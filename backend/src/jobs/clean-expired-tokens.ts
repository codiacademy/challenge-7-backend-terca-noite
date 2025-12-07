import cron from "node-cron";
import { prisma } from "../lib/prisma";

export async function cleanExpiredTokens() {
  console.log("[CRON] Limpando refresh tokens expirados...");
  const now = new Date();

  try {
    const tokens = await prisma.refreshtokens.findMany({
      where: { is_revoked: true },
      select: { id: true, expiresAt: true },
    });
    const idsToDelete: string[] = [];
    for (const t of tokens) {
      const expiresRaw = t.expiresAt as unknown;
      const expires = expiresRaw instanceof Date ? expiresRaw : new Date(String(expiresRaw));

      // ignora strings inválidas
      if (isNaN(expires.getTime())) continue;

      if (expires < now) idsToDelete.push(t.id);
    }

    if (idsToDelete.length === 0) {
      console.log("[CRON] Nenhum token expirado encontrado.");
      return;
    }

    const result = await prisma.refreshtokens.deleteMany({
      where: { id: { in: idsToDelete } },
    });

    console.log(`[CRON] ${result.count} tokens expirados foram removidos.`);
  } catch (error) {
    console.error("[CRON] Erro ao limpar tokens expirados:", error);
  }
}
