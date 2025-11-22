import { app } from "./app.ts";
import { env } from "./config/env.ts";
import { cleanExpiredTokens } from "./jobs/clean-expired-tokens.ts";
import { sendOverviewEmailtoAllUsers } from "./functions/notifications/send-overview-email-to-all-users-function.ts";
import { sendDiscordNotificationToAllUsersFunction } from "./functions/notifications/send-discord-notification-to-all-users-function.ts";
import cron from "node-cron";

await import("./config/auto-seed.ts");

const InitServer = async () => {
  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    console.log(`Server inicializado e rodando com sucesso na porta ${env.PORT}`);
  } catch (err) {
    app.log.error(err);
  }
};

InitServer();
cron.schedule("* * * * *", async () => {
  console.log("🧹 Limpando tokens expirados...");
  await cleanExpiredTokens();
});

cron.schedule("*0 8 1 * *", async () => {
  console.log("✉ Enviando Emails de Overview...");
  await sendOverviewEmailtoAllUsers();
});

cron.schedule("*0 8 1 * *", async () => {
  console.log("🤖 Enviando Mensagens do Discord de Overview...");
  await sendDiscordNotificationToAllUsersFunction();
});
