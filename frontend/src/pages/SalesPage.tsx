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
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [isOpen, setIsOpen] = useState(false);
  const [sales, setSales] = useState<Sales[]>([]); // Estado para gerenciar vendas
  const [selectedSale, setSelectedSale] = useState<Sales | null>(null); // Venda selecionada para edição
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);

  async function loadAllSales() {
    try {
      setLoadingProfile(true);
      const token = localStorage.getItem("accessToken") || null;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await api.get("http://localhost:3000/sales/read_all_sales", {
        headers,
        withCredentials: true,
      });

      if (!response.data) throw new Error(`HTTP ${response.status}`);

      setSales(response.data.salesData);
      console.log("Vendas Carregadas com Sucesso!");
    } catch (error: any) {
      if (error.name !== "AbortError") console.error("Erro ao carregar perfil:", error);
    } finally {
      setLoadingProfile(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    loadAllSales();
    return () => controller.abort();
  }, []);
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
      await loadAllSales();
    } catch (error: any) {}
  };

  // Filtrando os dados pelo time range
  const filteredSales = filterSalesByTime(sales, timeRange);

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
          onEdit={(sale) => {
            setSelectedSale(sale); // Define a venda selecionada para edição
            setIsOpen(true); // Abre o modal
          }}
          onDelete={handleDeleteSale} // Passa a função de exclusão
        />

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <SalesCoursePie timeRange={timeRange} />
          <SalesTypesBar timeRange={timeRange} />
        </div>
        <SalesGrowth timeRange={timeRange} />
      </main>

      <Modal
        title={selectedSale ? "Editar Venda" : "Cadastro de Vendas"}
        open={isOpen}
        onClose={() => {
          setIsOpen(false);
          setSelectedSale(null); // Limpa a venda selecionada ao fechar
        }}
        onSave={async () => {
          loadAllSales();
        }} // Passa a função de salvamento
        sale={selectedSale} // Passa a venda selecionada para edição
      />
    </div>
  );
}
