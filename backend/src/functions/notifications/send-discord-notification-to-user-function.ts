import axios from "axios";
import { prisma } from "../../lib/prisma";
import { readOverviewData } from "./read-overview-data-function";
import { generateOverviewDiscordNotificationEmbed } from "./generate-overview-discord-notification-embed";

/**
 * Envia uma notificação de resumo financeiro por DM do Discord para um utilizador específico.
 * * @param userId O ID interno do utilizador no seu banco de dados.
 */
export const sendDiscordNotificationToUserFunction = async (userId: string) => {
  // O Bot Token é obrigatório para enviar DMs.
  const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

  if (!BOT_TOKEN) {
    console.error("❌ ERRO: O DISCORD_BOT_TOKEN não está configurado. Abortando envio de DM.");
    return;
  }

  const discordApiUrl = "https://discord.com/api/v10";
  const headers = {
    Authorization: `Bot ${BOT_TOKEN}`,
    "Content-Type": "application/json",
  }; // 1. 🔍 BUSCAR O UTILIZADOR

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      discordId: true,
      discordName: true, // Incluir a flag de notificação do Discord para garantir que está ativo
      notification_discord_enabled: true,
    },
  }); // 2. 🛑 VERIFICAÇÕES DE PRÉ-REQUISITOS

  if (!user) {
    console.error(`❌ Erro: Utilizador com ID ${userId} não encontrado no banco de dados.`);
    return;
  }

  // Assumindo que você tem um campo 'notification_discord_enabled' no seu modelo User
  if (!user.notification_discord_enabled) {
    console.warn(
      `⚠️ Aviso: Notificação Discord desabilitada para o utilizador ${user.discordName || user.id}.`,
    );
    return;
  }

  if (!user.discordId) {
    console.error(
      `❌ Erro: Utilizador ${user.discordName || user.id} não possui um 'discordId' associado. Abortando DM.`,
    );
    return;
  }

  console.log(`\n✉️ Iniciando o envio de DM para o utilizador: ${user.discordName || user.id}...`); // 3. 📨 LÓGICA DE ENVIO (sem loop)

  try {
    // 3.1. CRIAR O CANAL DM
    // Endpoint: POST /users/@me/channels
    const dmChannelResponse = await axios.post(
      `${discordApiUrl}/users/@me/channels`,
      { recipient_id: user.discordId },
      { headers },
    );

    const dmChannelId = dmChannelResponse.data.id; // 3.2. COLETAR DADOS E GERAR EMBED
    const stats = await readOverviewData(user.id);
    const embed = await generateOverviewDiscordNotificationEmbed(user.discordName, stats); // 3.3. ENVIAR A MENSAGEM
    const payload = {
      content: `Olá **${user.discordName || "amigo(a)"}**, seu resumo financeiro está pronto!`,
      embeds: [embed],
    };

    await axios.post(`${discordApiUrl}/channels/${dmChannelId}/messages`, payload, { headers });

    console.log(`✅ DM enviada com sucesso para: ${user.discordName} (ID: ${user.discordId})`);

    return true; // Indica sucesso
  } catch (error: any) {
    const status = error.response?.status;
    const message = error.response?.data?.message; // Tratamento de erro 403 (Bloqueio de DM)

    if (status === 403) {
      console.warn(
        `⚠️ Aviso: O utilizador ${user.discordName} bloqueou DMs do Bot (Status 403). Notificação não enviada.`,
      );
    } else {
      console.error(
        `❌ Falha ao enviar para ${user.discordName}. Status: ${status} - Mensagem: ${message || error.message}`,
      );
    }
    return false; // Indica falha
  }
};
