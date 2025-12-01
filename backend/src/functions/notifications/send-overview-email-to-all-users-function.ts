import { prisma } from "../../lib/prisma";
import { readOverviewData } from "./read-overview-data-function";
import { generateOverviewEmailHtml } from "./generate-overview-email-html";
import { sendOverviewEmail } from "../../utils/mail-service";

export async function sendOverviewEmailtoAllUsers() {
  console.log(`Iniciando  envio de emails de overview. Tempo: ${new Date().toISOString()}`);

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
      console.log("Nenhum usuário com notificação por email ativada.");
      return;
    }

    console.log(` Encontrados ${eligibleUsers.length} usuários elegíveis.`);

    for (const user of eligibleUsers) {
      try {
        const stats = await readOverviewData(user.id);

        const htmlContent = generateOverviewEmailHtml(user.name, stats);

        await sendOverviewEmail(
          user.email,
          "Resumo Rápido: Desempenho Financeiro da Codi Academy (Últimos 30 Dias)",
          htmlContent,
        );
        console.log(` Email de overview enviado com sucesso para: ${user.email}`);
      } catch (error) {
        console.error(` Erro ao processar/enviar email para o usuário ${user.email}:`, error);
      }
    }

    console.log("Job de envio de emails de overview concluído.");
  } catch (globalError) {
    console.error("Erro fatal na busca de usuários elegíveis:", globalError);
  }
}
