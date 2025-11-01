export interface Expense {
  id: number;
  date: string; // Formato YYYY-MM-DD para o parsing
  description: string;
  createdAt: string;
  category: "Fixa" | "Variavel";
  value: number;
  status: "Pago" | "Pendente";
}

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

export interface Sales {
  id: number;
  date: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    cpf: string;
  };
  course: {
    type: "presencial" | "online";
    name: CourseName;
    price: number;
  };
  discount: number;
  taxes: number;
  commissions: number;
  cardFees: number;
  finalPrice: number;
}

export interface SalesTableProps {
  sales: Sales[];
  onDelete: (id: number) => void;
  onEdit: (sale: Sales) => void;
}

export type TimeRange =
  | "lastWeek"
  | "thisMonth"
  | "lastThreeMonths"
  | "thisYear"
  | "all"
  | { type: "custom"; startDate: Date; endDate: Date }

