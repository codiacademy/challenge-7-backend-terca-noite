import { createApp } from "./app";
import { ENV } from "./config/env";
import { cleanExpiredTokens } from "./jobs/clean-expired-tokens";
import { sendOverviewEmailtoAllUsers } from "./functions/notifications/send-overview-email-to-all-users-function";
import { sendDiscordNotificationToAllUsersFunction } from "./functions/notifications/send-discord-notification-to-all-users-function";
import cron from "node-cron";

import("./config/auto-seed");

const InitServer = async () => {
  const app = await createApp();
  try {
    await app.listen({ port: ENV.PORT, host: "0.0.0.0" });
    console.log(`Server inicializado e rodando com sucesso na porta ${ENV.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

InitServer();
cron.schedule("* * * * *", async () => {
  console.log("🧹 Limpando tokens expirados...");
  await cleanExpiredTokens();
});

cron.schedule("0 8 1 * *", async () => {
  console.log("✉ Enviando Emails de Overview...");
  await sendOverviewEmailtoAllUsers();
});

cron.schedule("0 8 1 * *", async () => {
  console.log("🤖 Enviando Mensagens do Discord de Overview...");
  await sendDiscordNotificationToAllUsersFunction();
});
