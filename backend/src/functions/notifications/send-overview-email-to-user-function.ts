import { prisma } from "../../lib/prisma";
import { readOverviewData } from "./read-overview-data-function";
import { generateOverviewEmailHtml } from "./generate-overview-email-html";
import { sendOverviewEmail } from "../../utils/mail-service";
import { AppError } from "../../utils/app-error";

export async function sendOverviewEmailtoUser(userId: string) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        notification_email_enabled: true,
        email: true,
        name: true,
      },
    });
    if (!existingUser) throw new AppError("Usuário não encontrado", 400);

    if (!existingUser.notification_email_enabled) return;
    const stats = await readOverviewData(userId);

    const htmlContent = generateOverviewEmailHtml(existingUser.name, stats);

    await sendOverviewEmail(
      existingUser.email,
      "Resumo Rápido: Desempenho Financeiro da Codi Academy (Últimos 30 Dias)",
      htmlContent,
    );

    try {
      console.log(` Email de overview enviado com sucesso para: ${existingUser.email}`);
    } catch (error) {
      console.error(` Erro ao processar/enviar email para o usuário ${existingUser.email}:`, error);
    }
  } catch (globalError) {
    console.error("Erro fatal na busca de usuário:", globalError);
  }
}
