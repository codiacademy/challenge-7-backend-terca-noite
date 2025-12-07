import axios from "axios";

export async function getDiscordUserFunction(accessToken: string) {
  const response = await axios.get("https://discord.com/api/v10/users/@me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data; // isso vai ter id, username, discriminator, avatar, etc
}
