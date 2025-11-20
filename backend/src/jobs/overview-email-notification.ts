import { prisma } from "../lib/prisma.ts";
import { readOverviewDataForEmail } from "../functions/notifications/read-overview-data-for-email.ts";
import { generateOverviewEmailHtml } from "../functions/notifications/generate-overview-email-html.ts";
import { sendOverviewEmail } from "../utils/mail-service.ts";

export async function sendOverviewEmailCron() {
  console.log(
    `[CRON] Iniciando job de envio de emails de overview. Tempo: ${new Date().toISOString()}`,
  );

  try {
    const eligibleUsers = await prisma.user.findMany({
      where: {
        notification_email_enabled: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (eligibleUsers.length === 0) {
      console.log("[CRON] Nenhum usuário com notificação por email ativada.");
      return;
    }

    console.log(`[CRON] Encontrados ${eligibleUsers.length} usuários elegíveis.`);

    for (const user of eligibleUsers) {
      try {
        const stats = await readOverviewDataForEmail(user.id);

        const htmlContent = generateOverviewEmailHtml(user.name, stats);

        await sendOverviewEmail(
          user.email,
          "Resumo Rápido: Desempenho Financeiro da Codi Academy (Últimos 30 Dias)",
          htmlContent,
        );
        console.log(`[CRON] Email de overview enviado com sucesso para: ${user.email}`);
      } catch (error) {
        console.error(`[CRON] Erro ao processar/enviar email para o usuário ${user.email}:`, error);
      }
    }

    console.log("[CRON] Job de envio de emails de overview concluído.");
  } catch (globalError) {
    console.error("[CRON] Erro fatal na busca de usuários elegíveis:", globalError);
  }
}
