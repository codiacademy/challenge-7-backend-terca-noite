import axios from "axios";
import { prisma } from "../../lib/prisma.ts";
import { readOverviewData } from "./read-overview-data-function.ts";
import { generateOverviewDiscordNotificationEmbed } from "./generate-overview-discord-notification-embed.ts";
// Tipo de dados (interface) para o utilizador recuperado do DB
export const sendDiscordNotificationToAllUsersFunction = async () => {
  // O Bot Token é obrigatório para enviar DMs.
  const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

  if (!BOT_TOKEN) {
    console.error("ERRO: O DISCORD_BOT_TOKEN não está configurado. O envio de DMs falhou.");
    return;
  }

  const discordApiUrl = "https://discord.com/api/v10";
  const headers = {
    Authorization: `Bot ${BOT_TOKEN}`,
    "Content-Type": "application/json",
  };

  const usersToNotify = await prisma.user.findMany({
    where: {
      notification_email_enabled: true,
    },
    select: {
      id: true,
      discordId: true,
      discordName: true,
    },
  });
  if (usersToNotify.length == 0) {
    console.log("Nenhum usuário para enviar notificação do discord!");
    return;
  }

  console.log(`Iniciando o envio de DMs para ${usersToNotify.length} utilizadores...`);

  for (const user of usersToNotify) {
    // Pula se a notificação estiver desabilitada ou se não houver ID do Discord
    try {
      // 1. 📬 CRIAR O CANAL DM (Abrir a conversa privada)
      // Endpoint: POST /users/@me/channels
      const dmChannelResponse = await axios.post(
        `${discordApiUrl}/users/@me/channels`,
        { recipient_id: user.discordId },
        { headers },
      );

      const dmChannelId = dmChannelResponse.data.id;
      const stats = await readOverviewData(user.id);
      const embed = await generateOverviewDiscordNotificationEmbed(user.discordName, stats);
      // 2. 💬 ENVIAR A MENSAGEM para o Canal DM
      // Endpoint: POST /channels/{channel.id}/messages
      const payload = {
        content: `Olá **${user.discordName || "amigo(a)"}**, seu resumo financeiro está pronto!`,
        embeds: [embed],
      };

      await axios.post(`${discordApiUrl}/channels/${dmChannelId}/messages`, payload, { headers });

      console.log(`✅ DM enviada para: ${user.discordName} (ID: ${user.discordId})`);
    } catch (error: any) {
      const status = error.response?.status;
      const message = error.response?.data?.message;

      // O status 50007 (Cannot send messages to this user) é comum
      // se o utilizador não aceitar DMs de quem não é amigo (o Bot).
      if (status === 403 && message === "Cannot send messages to this user") {
        console.warn(
          `⚠️ Aviso: O utilizador ${user.discordName} bloqueou DMs do Bot (Status 403). Notificação não enviada.`,
        );
      } else {
        console.error(
          `❌ Falha ao enviar para ${user.discordName}. Status: ${status} - Mensagem: ${message || error.message}`,
        );
      }
    }

    // 🛑 RATE LIMITING: Pausa para evitar ser bloqueado pelo Discord.
    // É essencial ter esta pausa se enviar para muitos utilizadores.
    await new Promise((resolve) => setTimeout(resolve, 500)); // Espera 500ms
  }

  console.log("Envio de DM por Discord concluído.");
};

async function generateOverviewDiscordNotificationHtml(discordName: string | null, stats: any) {}
