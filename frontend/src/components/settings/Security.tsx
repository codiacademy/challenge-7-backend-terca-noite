import { Lock } from "lucide-react";
import { SettingSection } from "./SettingSection";
import { ToggleSwitch } from "./ToggleSwitch";
import { useState } from "react";

export const Security = () => {
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <SettingSection icon={Lock} title="Segurança">
      <ToggleSwitch
        label="Autenticação de dois fatores"
        isOn={twoFactor}
        onToggle={() => setTwoFactor(!twoFactor)}
      />

      <div className="mt-4">
        <button className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition duration-200">
          Alterar Senha
        </button>
      </div>
    </SettingSection>
  );
};
