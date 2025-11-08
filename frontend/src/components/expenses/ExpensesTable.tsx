import { useState } from "react";
import { motion } from "framer-motion";
import {
  Edit,
  Search,
  Trash2,
  CircleCheckBig,
  CircleAlert,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ConfirmDeleteModal } from "../common/ConfirmDeleteModal";
import { Expense } from "@/types/types";

interface ExpensesTableProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => void;
}

export const ExpensesTable = ({
  expenses,
  onEdit,
  onDelete,
}: ExpensesTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const applyFilters = () => {
    let filtered = expenses;

    if (filterCategory !== "todos") {
      filtered = filtered.filter(
        (expense) => expense.category.toLowerCase() === filterCategory
      );
    }

    if (filterStatus !== "todos") {
      filtered = filtered.filter(
        (expense) => expense.status.toLowerCase() === filterStatus
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((expense) =>
        expense.description.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const handleSearch = (e: { target: { value: string } }) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterCategory = (e: { target: { value: string } }) => {
    setFilterCategory(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterStatus = (e: { target: { value: string } }) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (e: { target: { value: string } }) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const filteredExpenses = applyFilters();

  const totalItems = filteredExpenses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentExpenses = filteredExpenses.slice(startIndex, endIndex);

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <motion.div
      className="bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex justify-between flex-col sm:flex-row items-center p-6 gap-7 mb-6">
        <h2 className="text-xl font-semibold text-gray-100">
          Lista de Despesas
        </h2>

        <div className="flex gap-3 flex-col sm:flex-row">
          <div className="flex flex-col">
            <label
              htmlFor="filterStatus"
              className="text-sm text-gray-300 mb-1"
            >
              Filtrar por Status
            </label>
            <select
              id="filterStatus"
              className={`w-full sm:w-48 bg-gray-700 text-white rounded-md pl-3 py-1.5 sm:py-1 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ${
                filterStatus !== "todos" ? "border-2 border-blue-500" : ""
              }`}
              value={filterStatus}
              onChange={handleFilterStatus}
              aria-label="Filtrar por status de pagamento"
            >
              <option value="todos">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="filterCategory"
              className="text-sm text-gray-300 mb-1"
            >
              Filtrar por Categoria
            </label>
            <select
              id="filterCategory"
              className={`w-full sm:w-48 bg-gray-700 text-white rounded-md pl-3 py-1.5 sm:py-1 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ${
                filterCategory !== "todos" ? "border-2 border-blue-500" : ""
              }`}
              value={filterCategory}
              onChange={handleFilterCategory}
              aria-label="Filtrar por categoria de despesa"
            >
              <option value="todos">Todas as categorias</option>
              <option value="fixa">Fixa</option>
              <option value="variavel">Variável</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label htmlFor="search" className="text-sm text-gray-300 mb-1">
              Pesquisar Descrição
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                placeholder="Procurar por descrição..."
                className="bg-gray-700 text-white placeholder-gray-400 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={handleSearch}
                value={searchTerm}
              />
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={18}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Vencimento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Descrição
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Categoria
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Editar
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Excluir
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {currentExpenses.length > 0 ? (
              currentExpenses.map((item) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Intl.DateTimeFormat("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    }).format(new Date(item.date))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-md font-medium text-gray-100">
                    <span className="items-center py-7">
                      {item.description}
                      <p className="text-xs text-gray-400">
                        Registrado em{" "}
                        {new Intl.DateTimeFormat("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }).format(new Date(item.createdAt))}
                      </p>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        item.category === "Fixa"
                          ? "text-cyan-400 bg-cyan-950"
                          : "text-violet-300 bg-violet-950"
                      }`}
                    >
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(item.value)}
                  </td>
                  {item.status === "Pago" ? (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">
                      <span className="flex items-center gap-2 py-7">
                        <CircleCheckBig size={18} />
                        <p>{item.status}</p>
                      </span>
                    </td>
                  ) : (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-400">
                      <span className="flex items-center gap-2 py-7">
                        <CircleAlert size={18} />
                        <p>{item.status}</p>
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 text-center">
                    <button
                      onClick={() => onEdit(item)}
                      className="text-indigo-400 hover:text-indigo-300 mr-2 cursor-pointer"
                    >
                      <Edit size={18} />
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 text-center">
                    <ConfirmDeleteModal
                      onConfirm={() => onDelete(item.id)}
                      title="Tem certeza que quer deletar?"
                      text="Essa operação não pode ser desfeita"
                    >
                      <span className="text-red-400 hover:text-red-300 mr-2 cursor-pointer">
                        <Trash2 size={18} />
                      </span>
                    </ConfirmDeleteModal>
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-400">
                  Nenhuma despesa encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="itemsPerPage" className="text-sm text-gray-300">
              Itens por página:
            </label>
            <select
              id="itemsPerPage"
              className="bg-gray-700 text-white rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm ${
                currentPage === 1
                  ? "sm:bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "sm:bg-gray-700 text-white hover:bg-gray-600"
              }`}
            >
              <ChevronLeft size={18} />
              Anterior
            </button>
            <span className="text-sm text-gray-300">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm ${
                currentPage === totalPages
                  ? "sm:bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "sm:bg-gray-700 text-white hover:bg-gray-600"
              }`}
            >
              Próximo
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};
