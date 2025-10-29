import { useState } from "react";
import { SettingSection } from "./SettingSection";
import { Bell } from "lucide-react";
import { ToggleSwitch } from "./ToggleSwitch";

export const Notifications = () => {
  const [notifications, setNotifications] = useState({
    email: false,
    sms: false,
  });

  return (
    <SettingSection icon={Bell} title="Notificações">
      <ToggleSwitch
        label="Notificações por email"
        isOn={notifications.email}
        onToggle={() => setNotifications({ ...notifications, email: !notifications.email })}
      />

      <ToggleSwitch
        label="Notificações por SMS"
        isOn={notifications.sms}
        onToggle={() => setNotifications({ ...notifications, sms: !notifications.sms })}
      />
    </SettingSection>
  );
};
