export type CreateExpenseData = {
  userId: string;
  date: string;
  description: string;
  category: string;
  value: number;
  status: string;
};

export enum ExpenseCategory {
  fixa,
  variavel,
}

export enum ExpenseStatus {
  pago,
  pendente,
}

export type ChangeExpenseData = {
  id: string;
  date: string;
  description: string;
  category: string;
  value: number;
  status: string;
};

export type Expense = {
  id: string;
  due_date: Date;
  description: string;
  category: string;
  value: number;
  status: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;
};
