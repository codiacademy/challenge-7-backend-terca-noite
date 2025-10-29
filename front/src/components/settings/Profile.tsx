import { User } from "lucide-react";
import { SettingSection } from "./SettingSection";
import { userData } from "../../data/UserData";

export const Profile = () => {
  return (
    <SettingSection icon={User} title="Perfil">
      <div className="flex flex-col sm:flex-row items-center gap-5 mb-6">
        <div className="h-15 w-15 rounded-full bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center text-white font-semibold">
          <p className="text-2xl">{userData.name.charAt(0)}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-100">{userData.name}</h3>
          <p className="text-gray-400">{userData.email}</p>
        </div>
      </div>

      <button className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition duration-200 w-full sm:w-auto">
        Editar Perfil
      </button>
    </SettingSection>
  );
};
