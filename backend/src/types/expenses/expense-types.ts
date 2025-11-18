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
