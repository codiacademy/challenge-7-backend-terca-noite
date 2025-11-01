import { motion } from "framer-motion";
import { LucideProps } from "lucide-react";
import { ForwardRefExoticComponent } from "react";

interface StatCardProps {
  name: string;
  icon: ForwardRefExoticComponent<Omit<LucideProps, "ref">>;
  value: string;
  color: string;
}

export const StatCard = ({ name, icon: Icon, value, color }: StatCardProps) => {
  return (
    <motion.div
      className="bg-gray-800 bg-opacity-50 backdrop-blur-md overflow-hidden shadow-lg rounded-xl border border-gray-700 cursor-pointer"
      whileHover={{ y: 5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
    >
      <div className="px-4 py-5 sm:p-6">
        <span className="flex items-center text-sm font-medium text-gray-400 truncate">
          <Icon size={20} className="mr-2 " style={{ color }} />
          {name}
        </span>

        <p className="mt-1 text-3xl font-semibold text-gray-100">{value}</p>
      </div>
    </motion.div>
  );
};
