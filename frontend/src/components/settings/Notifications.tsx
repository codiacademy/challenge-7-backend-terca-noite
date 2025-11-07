import { useState } from "react";
import { SettingSection } from "./SettingSection";
import { Bell } from "lucide-react";
import { ToggleSwitch } from "./ToggleSwitch";
import { ProfileConfigsType } from "../../types/types";

export const Notifications = ({ user, isLoading }: { user: ProfileConfigsType; isLoading: boolean }) => {
  const [notifications, setNotifications] = useState({
    email: user.notification_email_enabled || false,
    sms: user.notification_sms_enabled || false,
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
