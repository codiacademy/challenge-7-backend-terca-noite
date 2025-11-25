import { useEffect, useState } from "react";
import { SettingSection } from "./SettingSection";
import { Bell } from "lucide-react";
import { ToggleSwitch } from "./ToggleSwitch";
import { ProfileConfigsType } from "../../types/types";
import axios from "axios";
import discordIcon from "../../assets/Discord-Symbol-Blurple.png";
export const Notifications = ({
  user,
  isLoading,
}: {
  user: ProfileConfigsType;
  isLoading: boolean;
}) => {
  if (isLoading || !user) {
    return <div>Carregando...</div>;
  }
  const [notifications, setNotifications] = useState({
    email: user.notification_email_enabled || false,
    discord: user.notification_discord_enabled || false,
  });
  const [isDiscordConnected, setIsDiscordConnected] = useState<Boolean>(false);

  async function linkDiscordAccount() {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("Access token não encontrado no localStorage");
        return;
      }

      const response = await axios.get("http://localhost:3000/auth/discord/link", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.authDiscordURL) {
        console.log("Olhe a resposta do servidor:", response.data);
        window.location.href = response.data.authDiscordURL;
      } else {
        console.error("URL de redirecionamento não recebida");
      }
    } catch (error) {
      console.error("Erro ao vincular conta do discord:", error);
    }
  }

  async function unlinkDiscordAccount() {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("Access token não encontrado no localStorage");
        return;
      }

      const response = await axios.post(
        "http://localhost:3000/auth/discord/unlink",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      console.log(response.data);
      updateDiscordLinkState();
    } catch (error) {
      console.error("Erro ao desvincular conta do discord:", error);
    }
  }

  async function updateDiscordNotificationSettings() {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("Access token não encontrado no localStorage");
        return;
      }

      const response = await axios.patch(
        "http://localhost:3000/users/update_discord_notification",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        setNotifications({ ...notifications, discord: !notifications.discord });
        console.log(
          "Configurações de notificação por discord atualizadas com sucesso:",
          response.data,
        );
      }
      console.log("Olhe a resposta do servidor:", response.data);
    } catch (error) {
      console.error("Erro ao atualizar configurações de notificação por SMS:", error);
    }
  }

  async function updateEmailNotificationSettings() {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("Access token não encontrado no localStorage");
        return;
      }

      const response = await axios.patch(
        "http://localhost:3000/users/update_email_notification",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        },
      );

      if (response.status === 200) {
        setNotifications({ ...notifications, email: !notifications.email });
        console.log(
          "Configurações de notificação por email atualizadas com sucesso:",
          response.data,
        );
      }
      console.log("Erro, olhe a resposta do servidor:", response.data);
    } catch (error) {
      console.error("Erro ao atualizar configurações de notificação por email:", error);
    }
  }

  async function updateDiscordLinkState() {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("Access token não encontrado no localStorage");
        return;
      }

      const response = await axios.get("http://localhost:3000/auth/get_discord_linked", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      const isLinked = response.data?.isDiscordLinked;

      if (typeof isLinked !== "boolean") {
        console.log("A resposta do servidor não contém 'isDiscordLinked' como booleano.");
        setIsDiscordConnected(false);
        return;
      }

      console.log("IsDiscordConnected (Valor Booleano):", isLinked);

      setIsDiscordConnected(isLinked);
    } catch (error) {
      console.error("Erro ao verificar status de link do Discord:", error);
      setIsDiscordConnected(false);
    }
  }

  useEffect(() => {
    updateDiscordLinkState();
  }, []);

  return (
    <SettingSection icon={Bell} title="Notificações">
      <ToggleSwitch
        label="Notificações por email"
        isOn={notifications.email}
        onToggle={() => updateEmailNotificationSettings()}
      />
      {isDiscordConnected ? (
        <>
          <ToggleSwitch
            label="Notificações por Discord"
            isOn={notifications.discord}
            onToggle={() => updateDiscordNotificationSettings()}
          />
          <button
            onClick={unlinkDiscordAccount}
            className="relative flex flex-row w-[350px] justify-start items-center bg-red-900 px-[20px] py-[15px] rounded-xl cursor-pointer hover:bg-gray-600 transition-colors duration-700"
          >
            <span>Desvincule sua conta do Discord</span>
            <img className="h-[36px] absolute right-[6%]" src={discordIcon}></img>
          </button>
        </>
      ) : (
        <>
          <h2 className="text-gray-300 mb-[20px]">Notificações por Discord</h2>
          <button
            onClick={linkDiscordAccount}
            className="relative flex flex-row w-[350px] justify-start items-center bg-gray-900 px-[20px] py-[15px] rounded-xl cursor-pointer hover:bg-gray-600 transition-colors duration-700"
          >
            <span>Vincule sua conta do Discord</span>
            <img className="h-[36px] absolute right-[6%]" src={discordIcon}></img>
          </button>
        </>
      )}
    </SettingSection>
  );
};
