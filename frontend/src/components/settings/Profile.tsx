import { User } from "lucide-react";
import { SettingSection } from "./SettingSection";
import { ProfileChangeType } from "../../../../backend/src/types/users/user-types.ts";
import { ProfileConfigsType } from "../../types/types";



export const Profile = ({ user, isLoading }: { user: ProfileConfigsType; isLoading: boolean }) => {
  if (isLoading || !user) {
    return (
      <SettingSection icon={User} title="Perfil">
        <p>Carregando...</p>
      </SettingSection>
    );
  }
  console.log("Renderizando perfil com dados:", user);
  return (
    <SettingSection icon={User} title="Perfil">
      <div className="flex flex-col sm:flex-row items-center gap-5 mb-6">
        <div className="h-15 w-15 rounded-full bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center text-white font-semibold"></div>

        <div>
          <h3 className="text-lg font-semibold text-gray-100">{user.name}</h3>
          <p className="text-gray-400">{user.email}</p>
          <p className="text-gray-400">{user.telephone}</p>
        </div>
      </div>

      <button className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition duration-200 w-full sm:w-auto">
        Editar Perfil
      </button>
    </SettingSection>
  );
};
