import { Header } from "../components/common/Header";
import { motion } from "framer-motion";
import { StatCard } from "../components/common/StatCard";
import { DollarSign, Package, TrendingUp, HandCoins } from "lucide-react";
import { SalesTable } from "../components/sales/SalesTable";
import { SalesCoursePie } from "../components/sales/SalesCoursePie";
import { SalesGrowth } from "../components/sales/SalesGrowth";
import { ButtonAdd } from "../components/common/ButtonAdd";
import { SalesTypesBar } from "../components/sales/SalesTypesBar";
import { useState } from "react";
import { TimeRange, Sales } from "@/types/types";
import { filterSalesByTime } from "@/utils/salesAggregations";
//import { salesData } from "@/data/SalesData";
import Modal from "@/components/common/SalesModal";
import "react-toastify/dist/ReactToastify.css";
import { useEffect } from "react";
import api from "../api/axios-client.ts";
import { toast } from "react-toastify";

export function SalesPage() {
  const [search, setSearch] = useState("");
  const [courseType, setCourseType] = useState<"online" | "presencial" | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [isOpen, setIsOpen] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filteredSales, setFilteredSales] = useState<Sales[]>([]); // Estado para gerenciar vendas
  const [selectedSale, setSelectedSale] = useState<Sales | null>(null); // Venda selecionada para edição
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);

  async function loadFilteredSales(params?: {
    timeRange?: TimeRange;
    courseType?: "online" | "presencial" | undefined;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      setLoadingProfile(true);

      const token = localStorage.getItem("accessToken") || null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Converte timeRange para from/to
      let from: string | undefined;
      let to: string | undefined;
      const now = new Date();

      const tr = params?.timeRange;

      if (tr) {
        if (typeof tr === "string") {
          // trata os casos string do seu TimeRange
          switch (tr) {
            case "lastWeek": {
              const start = new Date();
              start.setDate(now.getDate() - 7);
              from = start.toISOString();
              to = now.toISOString();
              break;
            }
            case "thisMonth": {
              const start = new Date(now.getFullYear(), now.getMonth(), 1);
              from = start.toISOString();
              to = now.toISOString();
              break;
            }
            case "lastThreeMonths": {
              const start = new Date();
              start.setMonth(now.getMonth() - 3);
              from = start.toISOString();
              to = now.toISOString();
              break;
            }
            case "thisYear": {
              const start = new Date(now.getFullYear(), 0, 1);
              from = start.toISOString();
              to = now.toISOString();
              break;
            }
            case "all": {
              // deixa from/to indefinidos para trazer tudo (ou o back decide)
              break;
            }
            default: {
              // caso seu TimeRange tenha outros valores string
              break;
            }
          }
        } else if (typeof tr === "object" && tr.type === "custom") {
          // custom com datas já em Date
          from = tr.startDate.toISOString();
          to = tr.endDate.toISOString();
        }
      }

      const response = await api.get("http://localhost:3000/sales/read_filtered_sales", {
        headers,
        withCredentials: true,
        params: {
          courseType: params?.courseType,
          search: params?.search,
          from,
          to,
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
        },
      });

      if (!response.data) throw new Error(`HTTP ${response.status}`);
      const mappedSales: Sales[] = response.data.sales.map((sale: any) => ({
        id: sale.id,
        date: sale.created_at, // ou updated_at se preferir
        customer: {
          name: sale.client_name,
          email: sale.client_email,
          phone: sale.client_phone,
          cpf: sale.cpf,
        },
        course: {
          type: sale.course_type,
          name: sale.course,
          price: Number(sale.course_value),
        },
        discount: Number(sale.discount_value),
        taxes: Number(sale.taxes_value),
        commissions: Number(sale.commission_value),
        cardFees: Number(sale.card_fee_value),
        finalPrice: Number(sale.total_value),
      }));

      setFilteredSales(mappedSales);
      setCurrentPage(response.data.page);
      setItemsPerPage(response.data.limit);
      setTotalPages(response.data.totalPages);
      setTotalItems(response.data.total);
      console.log("Vendas filtradas carregadas!");
    } catch (error: any) {
      console.error("Erro ao carregar vendas filtradas:", error);
    } finally {
      setLoadingProfile(false);
    }
  }

  useEffect(() => {
    loadFilteredSales({
      timeRange,
      courseType,
      search,
      page: currentPage,
      limit: itemsPerPage,
    });
  }, [timeRange, courseType, search, currentPage, itemsPerPage]);
  // Função para salvar (criar ou atualizar) uma venda
  /*const handleSaveSale = (newSale: Sales) => {
    if (newSale.id === selectedSale?.id) {
      // Atualizar venda existente
      setSales(sales.map((sale) => (sale.id === newSale.id ? newSale : sale)));
    } else {
      // Adicionar nova venda
      setSales([...sales, newSale]);
    }
    toast.success("Venda salva com sucesso!", { theme: "dark" });
  };*/

  // Função para excluir uma venda
  const handleDeleteSale = async (id: string) => {
    try {
      const token = localStorage.getItem("accessToken") || null;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await api.delete(`http://localhost:3000/sales/${id}`, {
        headers,
        withCredentials: true,
      });
      if (!response.data) return toast.error("Resposta não recebida");
      console.log("Dados de Deleção:" + response.data);
      await loadFilteredSales();
    } catch (error: any) {}
  };

  // Filtrando os dados pelo time range

  const salesStats = {
    totalCourses: filteredSales.length,
    avarageSales:
      filteredSales.length > 0
        ? filteredSales.reduce((sum, sale) => sum + sale.finalPrice, 0) / filteredSales.length
        : 0,
    grossValue: filteredSales.reduce((sum, sale) => sum + sale.course.price, 0),
    netValue: filteredSales.reduce((sum, sale) => sum + sale.finalPrice, 0),
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title="Vendas" showTimeRange={true} onTimeRangeChange={setTimeRange}>
        <ButtonAdd
          titleButton="Adicionar Venda"
          onClick={() => {
            setIsOpen(true);
            setSelectedSale(null); // Limpa a venda selecionada para criar uma nova
          }}
        />
      </Header>

      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {/* STATS */}
        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <StatCard
            name="Total de cursos vendidos"
            icon={Package}
            value={salesStats.totalCourses.toString()}
            color="#6366f1"
          />
          <StatCard
            name="Média de vendas"
            icon={TrendingUp}
            value={new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(salesStats.avarageSales)}
            color="#ec4899"
          />
          <StatCard
            name="Valor Bruto"
            icon={DollarSign}
            value={new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(salesStats.grossValue)}
            color="#f59e0b"
          />
          <StatCard
            name="Valor Líquido"
            icon={HandCoins}
            value={new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(salesStats.netValue)}
            color="#8b5cf6"
          />
        </motion.div>

        <SalesTable
          sales={filteredSales}
          search={search}
          courseType={courseType}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          totalPages={totalPages}
          onSearchChange={setSearch}
          onFilterTypeChange={setCourseType}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          onEdit={(sale) => {
            setSelectedSale(sale);
            setIsOpen(true);
          }}
          onDelete={handleDeleteSale}
        />

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <SalesCoursePie timeRange={timeRange} salesData={filteredSales} />
          <SalesTypesBar timeRange={timeRange} salesData={filteredSales} />
        </div>
        <SalesGrowth timeRange={timeRange} salesData={filteredSales} />
      </main>

      <Modal
        title={selectedSale ? "Editar Venda" : "Cadastro de Vendas"}
        open={isOpen}
        onClose={() => {
          setIsOpen(false);
          setSelectedSale(null); // Limpa a venda selecionada ao fechar
        }}
        onSave={async () => {
          loadFilteredSales();
        }} // Passa a função de salvamento
        sale={selectedSale} // Passa a venda selecionada para edição
      />
    </div>
  );
}
