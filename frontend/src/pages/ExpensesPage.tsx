import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Header } from "../components/common/Header";
import { StatCard } from "../components/common/StatCard";
import { AlertTriangle, BanknoteArrowDown, Repeat, ShoppingCart } from "lucide-react";
import { ExpensesTable } from "../components/expenses/ExpensesTable";
import { ExpensesGrowth } from "../components/expenses/ExpensesGrowth";
import { ExpensesTypesBar } from "../components/expenses/ExpensesTypesBar";
import { ButtonAdd } from "../components/common/ButtonAdd";
import { TimeRange, Expense } from "../types/types";
import { ExpensesTypesPie } from "@/components/expenses/ExpensesTypesPie";
import ExpensesModal from "@/components/common/ExpensesModal";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { convertTimeRangeToParams } from "../utils/timeRangeTransformations.ts";
import api from "../api/axios-client.ts";
export type ExpenseStats = {
  totalExpenses: number;
  fixedExpenses: number;
  variableExpenses: number;
  pendingExpenses: number;
};

export function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [isModalOpen, setModalIsOpen] = useState(false);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [pieChartData, setPieChartData] = useState<any>([]);
  const [barChartData, setBarChartData] = useState<any>([]);
  const [growthChartData, setGrowthChartData] = useState<any>([]);
  const [expensesStats, setExpensesStats] = useState<ExpenseStats>({
    totalExpenses: 0,
    fixedExpenses: 0,
    variableExpenses: 0,
    pendingExpenses: 0,
  });

  const handleSaveExpense = async () => {
    await loadFilteredExpenses({
      timeRange,
      category,
      status,
      search,
      page: currentPage,
      limit: itemsPerPage,
    });
    loadExpensesCharts({ timeRange });
    loadKPIs({
      timeRange,
    });
    toast.success("Despesa salva com sucesso!", { theme: "dark" });
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      const token = localStorage.getItem("accessToken") || null;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await api.delete(`http://localhost:3000/expenses/${id}`, {
        headers,
        withCredentials: true,
      });
      if (!response.data) return toast.error("Resposta não recebida");
      console.log("Dados de Deleção:" + response.data);
      await loadFilteredExpenses({
        timeRange,
        category,
        status,
        search,
        page: currentPage,
        limit: itemsPerPage,
      });
      loadExpensesCharts({ timeRange });
      loadKPIs({
        timeRange,
      });
    } catch (error: any) {
      console.error("Erro ao deletar despesa", error);
    }
  };

  // Filtrando os dados pelo time range usando o estado expenses

  async function loadFilteredExpenses(params?: {
    timeRange?: TimeRange;
    category?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const token = localStorage.getItem("accessToken") || null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let from: string | undefined;
      let to: string | undefined;

      const tr = params?.timeRange;
      ({ from, to } = convertTimeRangeToParams(tr));

      const response = await api.get("http://localhost:3000/expenses/read_filtered_expenses", {
        headers,
        withCredentials: true,
        params: {
          category: params?.category,
          status: params?.status,
          search: params?.search,
          from,
          to,
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
        },
      });

      if (!response.data) throw new Error(`HTTP ${response.status}`);
      const mappedExpenses: Expense[] = response.data.expenses.map((expense: any) => ({
        id: expense.id,
        date: expense.due_date,
        description: expense.description,
        createdAt: expense.created_at,
        category: capitalizeFirst(expense.category),
        status: capitalizeFirst(expense.status),
        value: expense.value,
      }));

      setFilteredExpenses(mappedExpenses);
      setCurrentPage(response.data.page);
      setItemsPerPage(response.data.limit);
      setTotalPages(response.data.totalPages);
      setTotalItems(response.data.total);
      console.log("Despesas no período carregadas!");
    } catch (error: any) {
      console.error("Erro ao carregar despesas por período:", error);
    }
  }

  function capitalizeFirst(v: string) {
    return typeof v === "string" && v.length > 0 ? v.charAt(0).toUpperCase() + v.slice(1) : v;
  }

  async function loadExpensesCharts(params: { timeRange: TimeRange }) {
    try {
      const token = localStorage.getItem("accessToken") || null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let from: string | undefined;
      let to: string | undefined;

      const tr = params?.timeRange;
      ({ from, to } = convertTimeRangeToParams(tr));

      const response = await api.get("http://localhost:3000/expenses/get_charts", {
        headers,
        withCredentials: true,
        params: {
          from,
          to,
        },
      });

      if (!response.data) throw new Error(`HTTP ${response.status}`);

      setPieChartData(response.data.pieChartData);
      setBarChartData(response.data.barChartData);
      setGrowthChartData(response.data.growthChartData);

      console.log("Gráficos no período carregados!");
    } catch (error: any) {
      console.error("Erro ao carregar gráficos:", error);
    }
  }
  async function loadKPIs(params?: { timeRange?: TimeRange }) {
    try {
      const token = localStorage.getItem("accessToken") || null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Converte timeRange para from/to
      let from: string | undefined;
      let to: string | undefined;

      const tr = params?.timeRange;

      ({ from, to } = convertTimeRangeToParams(tr));

      const response = await api.get("http://localhost:3000/expenses/get_kpis", {
        headers,
        withCredentials: true,
        params: {
          from,
          to,
        },
      });

      if (!response.data) throw new Error(`HTTP ${response.status}`);
      console.log(response.data.expensesStats);
      setExpensesStats(response.data.expensesStats);
      console.log("Kpis carregados!");
    } catch (error: any) {
      console.error("Erro ao carregar Kpis:", error);
    }
  }
  useEffect(() => {
    loadFilteredExpenses({
      timeRange,
      category,
      status,
      search,
      page: currentPage,
      limit: itemsPerPage,
    });
    loadExpensesCharts({ timeRange });
    loadKPIs({
      timeRange,
    });
  }, [timeRange, category, status, search, currentPage, itemsPerPage]);

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title="Despesas" showTimeRange={true} onTimeRangeChange={setTimeRange}>
        <ButtonAdd
          onClick={() => {
            setModalIsOpen(true);
            setSelectedExpense(null);
          }}
          titleButton="Adicionar Despesa"
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
            name="Total de Despesas"
            icon={BanknoteArrowDown}
            value={new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(expensesStats.totalExpenses)}
            color="#eb1a1a"
          />
          <StatCard
            name="Despesas Fixas"
            icon={Repeat}
            value={new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(expensesStats.fixedExpenses)}
            color="#10b981"
          />
          <StatCard
            name="Despesas Variáveis"
            icon={ShoppingCart}
            value={new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(expensesStats.variableExpenses)}
            color="#f59e0b"
          />
          <StatCard
            name="Contas Pendentes"
            icon={AlertTriangle}
            value={new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(expensesStats.pendingExpenses)}
            color="#ef4444"
          />
        </motion.div>

        <ExpensesTable
          expenses={filteredExpenses}
          search={search}
          category={category}
          status={status}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          totalPages={totalPages}
          onSearchChange={setSearch}
          onCategoryChange={setCategory}
          onStatusChange={setStatus}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          onEdit={(expense) => {
            setSelectedExpense(expense);
            setModalIsOpen(true);
          }}
          onDelete={handleDeleteExpense}
        />

        {/* GRAFICOS DE DESPESAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 mb-8">
          <ExpensesTypesPie expensePieData={pieChartData} />
          <ExpensesTypesBar expenseBarData={barChartData} />
        </div>

        <ExpensesGrowth growthData={growthChartData} />
      </main>

      <ExpensesModal
        title={selectedExpense ? "Editar Despesa" : "Cadastrar Despesa"}
        open={isModalOpen}
        onClose={() => {
          setModalIsOpen(false);
          setSelectedExpense(null);
          loadFilteredExpenses({
            timeRange,
            category,
            status,
            search,
            page: currentPage,
            limit: itemsPerPage,
          });
          loadExpensesCharts({ timeRange });
          loadKPIs({
            timeRange,
          });
        }}
        onSave={handleSaveExpense}
        expense={selectedExpense}
      />
      <ToastContainer />
    </div>
  );
}
