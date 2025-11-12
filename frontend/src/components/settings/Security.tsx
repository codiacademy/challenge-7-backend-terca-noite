import { Lock } from "lucide-react";
import { SettingSection } from "./SettingSection";
import { ToggleSwitch } from "./ToggleSwitch";
import { useState } from "react";
import axios from "axios";
import { ProfileConfigsType } from "../../types/types";

export const Security = ({ user, isLoading }: { user: ProfileConfigsType; isLoading: boolean }) => {
  if (isLoading || !user) {
    return <div>Carregando...</div>;
  }
  const [twoFactor, setTwoFactor] = useState(user.two_factor_enabled);
  async function updateTwoFactorAuthSettings() {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("Access token não encontrado no localStorage");
        return;
      }
      console.log("Token:", token);
      const response = await axios.patch(
        "http://localhost:3000/2fa/update_two_factor_auth",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        setTwoFactor(!twoFactor);
        if (twoFactor) {
          console.log("Configurações de 2FA desativadas com sucesso:", response.data);
        } else {
          console.log("Configurações de 2FA ativadas com sucesso:", response.data);
        }
      }
      console.log("Olhe a resposta do servidor:", response.data);
    } catch (error) {
      console.error("Erro ao atualizar configurações de notificação por SMS:", error);
    }
  }
  return (
    <SettingSection icon={Lock} title="Segurança">
      <ToggleSwitch
        label="Autenticação de dois fatores"
        isOn={twoFactor}
        onToggle={() => updateTwoFactorAuthSettings()}
      />

      <div className="mt-4">
        <button className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition duration-200">
          Alterar Senha
        </button>
      </div>
    </SettingSection>
  );
};
