export interface Expense {
  id: number;
  date: string; // Formato YYYY-MM-DD para o parsing
  description: string;
  createdAt: string;
  category: "Fixa" | "Variavel";
  value: number;
  status: "Pago" | "Pendente";
}

export type ProfileConfigsType = {
  userId: string;
  name: string;
  email: string;
  telephone: string;
  two_factor_enabled: boolean;
  notification_email_enabled: boolean;
  notification_discord_enabled: boolean;
};

export type CourseName =
  | "curso fullstack"
  | "curso frontend"
  | "curso backend"
  | "inglês para programadores"
  | "autocad"
  | "data science"
  | "código limpo"
  | "areas de TI"
  | "linkedin para devs"
  | "bootcamp magic com contratação"
  | "github"
  | "rotina de resultados"
  | "intensivão html, css e js"
  | "curso de javascript avançado"
  | "fundamentos do desenvolvimento web";

export type SaleFormValues = {
  customer: {
    name: string;
    email: string;
    phone: string;
    cpf: string;
  };
  course: {
    type: "" | "presencial" | "online"; // <-- aceitando string vazia
    name: string;
    price: number;
  };
  discount: number;
  taxes: number;
  commissions: number;
  cardFees: number;
  finalPrice: number;
};
export type CourseType = "" | "presencial" | "online";

export interface Sales {
  id: string;

  client_name: string;

  cpf: string;

  client_phone: string;

  client_email: string;

  course: string;

  course_type: CourseType;

  course_value: number;

  discount_value: number;

  taxes_value: number;

  commission_value: number;

  card_fee_value: number;

  total_value: number;

  created_at: Date | string;

  updated_at: Date | string;

  created_by: string;
}

export interface SalesTableProps {
  sales: Sales[];
  search: string;
  courseType: string | undefined;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onDelete: (id: string) => void;
  onEdit: (sale: Sales) => void;

  onSearchChange?: (term: string) => void;
  onFilterTypeChange?: (type: string) => void;
  onItemsPerPageChange?: (items: number) => void;
  onPageChange?: (page: number) => void;
}

export type TimeRange =
  | "lastWeek"
  | "thisMonth"
  | "lastThreeMonths"
  | "thisYear"
  | "all"
  | { type: "custom"; startDate: Date; endDate: Date };
