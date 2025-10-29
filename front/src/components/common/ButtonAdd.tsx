import { Plus } from "lucide-react";

interface ButtonAddProps {
  titleButton: string
  onClick: () => void;
}

export const ButtonAdd = ({ titleButton, onClick }: ButtonAddProps) => {
  return (
    <button className="cursor-pointer flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded transition duration-200" onClick={onClick}>
      <Plus size={20} />
      <p>{titleButton}</p>
    </button>
  );
};
