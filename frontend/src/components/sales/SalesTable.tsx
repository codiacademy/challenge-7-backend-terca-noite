import { useState } from "react";
import { motion } from "framer-motion";
import {
  Edit,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { ConfirmDeleteModal } from "../common/ConfirmDeleteModal";
import { Sales } from "@/types/types";
import { SaleDetailsModal } from "./SaleDatailsModal";
import { SalesTableProps } from "@/types/types";

export const SalesTable = ({ sales, onEdit, onDelete }: SalesTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selectedSale, setSelectedSale] = useState<Sales | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const applyFilters = () => {
    let filtered = sales;

    if (filterType !== "todos") {
      filtered = filtered.filter(
        (sale) => sale.course.type.toLowerCase() === filterType
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (sale) =>
          sale.customer.name.toLowerCase().includes(term) ||
          sale.customer.email.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const handleSearch = (e: { target: { value: string } }) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterType = (e: { target: { value: string } }) => {
    setFilterType(e.target.value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (e: { target: { value: string } }) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const filteredSales = applyFilters();

  const totalItems = filteredSales.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSales = filteredSales.slice(startIndex, endIndex);

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

  const openModal = (sale: Sales) => {
    setSelectedSale(sale);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedSale(null);
    setIsModalOpen(false);
  };

  return (
    <motion.div
      className="bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700 mb-8 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 scrollbar-rounded"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex justify-between flex-col sm:flex-row items-center p-6 gap-7 mb-6">
        <h2 className="text-xl font-semibold text-gray-100">Lista de Vendas</h2>

        <div className="flex gap-3 flex-col sm:flex-row">
          <div className="flex flex-col">
            <label htmlFor="filterType" className="text-sm text-gray-300 mb-1">
              Filtrar por Tipo
            </label>
            <select
              id="filterType"
              className={`w-full sm:w-48 bg-gray-700 text-white rounded-md pl-3 py-1.5 sm:py-1 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ${
                filterType !== "todos" ? "border-2 border-blue-500" : ""
              }`}
              value={filterType}
              onChange={handleFilterType}
              aria-label="Filtrar por tipo de curso"
            >
              <option value="todos">Todos</option>
              <option value="presencial">Presencial</option>
              <option value="online">Online</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label htmlFor="search" className="text-sm text-gray-300 mb-1">
              Pesquisar
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                placeholder="Procurar por nome ou email..."
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
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Tipo do Curso
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Valor Bruto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Desconto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Valor Final
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Ver Detalhes
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
            {currentSales.length > 0 ? (
              currentSales.map((item) => (
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
                  <td className="px-6 py-4 whitespace-nowrap flex-col text-sm font-medium text-gray-100 flex gap-2">
                    {item.customer.name}
                    <p className="text-xs text-gray-400">
                      {item.customer.email}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        item.course.type === "online"
                          ? "text-green-400 bg-green-950"
                          : "text-sky-400 bg-blue-950"
                      }`}
                    >
                      {item.course.type.charAt(0).toUpperCase() +
                        item.course.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(item.course.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(item.discount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(item.finalPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 text-center">
                    <button
                      onClick={() => openModal(item)}
                      className="text-indigo-400 hover:text-indigo-300 mr-2 cursor-pointer"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
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
                <td colSpan={9} className="px-6 py-4 text-center text-gray-400">
                  Nenhuma venda encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Controles de Paginação */}
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

      {/* Uso do componente modal */}
      <SaleDetailsModal
        sale={selectedSale}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </motion.div>
  );
};
