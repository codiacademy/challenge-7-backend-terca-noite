import { app } from "./app.ts";
import { env } from "./config/env.ts";
import { cleanExpiredTokens } from "./jobs/clean-expired-tokens.ts";
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
