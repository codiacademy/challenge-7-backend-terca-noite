import { useState } from "react";
import { SettingSection } from "./SettingSection";
import { Bell } from "lucide-react";
import { ToggleSwitch } from "./ToggleSwitch";
import { ProfileConfigsType } from "../../types/types";
import axios from "axios";

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
    sms: user.notification_sms_enabled || false,
  });

  async function updateSmsNotificationSettings() {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("Access token não encontrado no localStorage");
        return;
      }

      const response = await axios.put(
        "http://localhost:3000/users/update_sms_notification",
        {
          notification_sms_enabled: notifications.sms,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        setNotifications({ ...notifications, sms: !notifications.sms });
        console.log("Configurações de notificação por SMS atualizadas com sucesso:", response.data);
      }
      console.log("Erro, olhe a resposta do servidor:", response.data);
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

      const response = await axios.put(
        "http://localhost:3000/users/update_email_notification",
        {
          notification_email_enabled: notifications.email,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

  return (
    <SettingSection icon={Bell} title="Notificações">
      <ToggleSwitch
        label="Notificações por email"
        isOn={notifications.email}
        onToggle={() => updateEmailNotificationSettings()}
      />

      <ToggleSwitch
        label="Notificações por SMS"
        isOn={notifications.sms}
        onToggle={() => updateSmsNotificationSettings()}
      />
    </SettingSection>
  );
};
