import { ExpenseCategory, ExpenseStatus } from "@prisma/client";

const EXPENSE_DESCRIPTIONS = [
  "Pagamento de ferramentas",
  "Anúncios no Instagram",
  "Compra de equipamentos",
  "Assinatura de software",
  "Pagamento de internet",
  "Treinamento da equipe",
  "Material de escritório",
  "Serviço de manutenção",
  "Consultoria externa",
  "Conta de energia",
];
const EXPENSE_CATEGORIES = [ExpenseCategory.fixa, ExpenseCategory.variavel];

const EXPENSE_STATUS = [ExpenseStatus.pago, ExpenseStatus.pendente];

const COURSETYPES = ["online", "presencial"];
export async function createTestExpenseFunction(userId: string, date: Date) {
  const randomExpenseDescription = randomFromArray(EXPENSE_DESCRIPTIONS);
  const randomExpenseCategory = randomFromArray(EXPENSE_CATEGORIES);
  const randomExpenseStatus = randomFromArray(EXPENSE_STATUS);
  const randomExpenseValue = randomBetween(100, 3000);

  const newExpense = {
    description: randomExpenseDescription,
    category: randomExpenseCategory, // coloque uma categoria real
    value: randomExpenseValue,
    status: randomExpenseStatus, // status válido
    due_date: date,
    created_by: userId,
    created_at: new Date(),
  };

  return newExpense;
}

function randomFromArray<T>(arr: T[]): T {
  if (arr.length === 0) {
    throw new Error("Array cannot be empty");
  }
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
