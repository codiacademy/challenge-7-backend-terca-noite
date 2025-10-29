import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Expense } from "@/types/types";
import { NumericFormat } from "react-number-format";
import { InputMask } from "@react-input/mask";
import { parse, isValid, format, parseISO } from "date-fns";

const ExpenseSchema = Yup.object().shape({
  date: Yup.string()
    .required("A data de vencimento é obrigatória")
    .test(
      "is-valid-date",
      "Data inválida. Por favor, insira uma data válida no formato dd/mm/aaaa.",
      (value) => {
        const parsedDate = parse(value, "dd/MM/yyyy", new Date());
        return isValid(parsedDate);
      }
    ),
  description: Yup.string()
    .required("A descrição é obrigatória")
    .max(50, "Limite máximo de 50 caracteres"),
  category: Yup.string()
    .oneOf(["Fixa", "Variavel"], "Categoria inválida")
    .required("Categoria obrigatória"),
  value: Yup.number()
    .min(1, "O valor da despesa deve ser maior que zero")
    .required("Valor obrigatório"),
  status: Yup.string()
    .oneOf(["Pendente", "Pago"], "Status inválido")
    .required("Status obrigatório"),
});

type ModalProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  expense?: Expense | null;
};

export default function ExpensesModal({
  title,
  open,
  onClose,
  onSave,
  expense,
}: ModalProps) {
  const formik = useFormik({
    initialValues: {
      date: expense ? format(parseISO(expense.date), "dd/MM/yyyy") : "",
      description: expense?.description || "",
      category: expense?.category || "",
      value: expense?.value || 0,
      status: expense?.status || "Pendente",
    },
    validationSchema: ExpenseSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      const parsedDate = parse(values.date, "dd/MM/yyyy", new Date());
      const dateString = format(parsedDate, "yyyy-MM-dd");
      const newExpense: Expense = {
        ...values,
        id: expense?.id || Date.now(),
        date: dateString,
        description: values.description,
        createdAt: new Date().toISOString().split("T")[0],
        category: values.category as "Fixa" | "Variavel",
        value: values.value,
        status: values.status as "Pago" | "Pendente",
      };
      onSave(newExpense);
      formik.resetForm();
      onClose();
    },
  });

  const handleCurrencyChange =
    (field: string) => (values: { floatValue?: number }) => {
      formik.setFieldValue(field, values.floatValue || 0);
    };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-30">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-700/75 transition-opacity data-closed:opacity-0 data-enter:duration-1000 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-scroll">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 data-closed:sm:translate-y-0 data-closed:sm:scale-95"
          >
            <div className="bg-black flex items-center justify-center px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-center">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h1 className="text-emerald-600">{title}</h1>
                  <form onSubmit={formik.handleSubmit} className="space-y-4">
                    <div className="items-start justify-evenly gap-2">
                      <label className="text-[12px] text-white">
                        Data de Vencimento
                      </label>
                      <InputMask
                        mask="dd/mm/yyyy"
                        replacement={{ d: /\d/, m: /\d/, y: /\d/ }}
                        placeholder="dd/mm/aaaa"
                        id="date"
                        name="date"
                        className="w-full rounded border border-white bg-black p-2 text-white"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.date}
                      />
                      {formik.touched.date && formik.errors.date ? (
                        <div className="text-red-500 text-xs">
                          {formik.errors.date}
                        </div>
                      ) : null}
                    </div>

                    <div className="items-start justify-evenly gap-2">
                      <label className="text-[12px] text-white">
                        Descrição
                      </label>
                      <input
                        id="description"
                        name="description"
                        type="text"
                        className="w-full rounded border border-white bg-black p-2 text-white"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.description}
                        placeholder="Digite a descrição..."
                      />
                      {formik.touched.description &&
                      formik.errors.description ? (
                        <div className="text-red-500 text-xs">
                          {formik.errors.description}
                        </div>
                      ) : null}
                    </div>

                    <div className="items-start justify-evenly gap-2">
                      <label className="text-[12px] text-white">
                        Categoria
                      </label>
                      <select
                        id="category"
                        name="category"
                        className="w-full rounded border border-white bg-black p-2 text-white"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.category}
                      >
                        <option value="" disabled>
                          Selecione
                        </option>
                        <option value="Fixa">Fixa</option>
                        <option value="Variavel">Variável</option>
                      </select>
                      {formik.touched.category && formik.errors.category ? (
                        <div className="text-red-500 text-xs">
                          {formik.errors.category}
                        </div>
                      ) : null}
                    </div>

                    <div className="items-start justify-evenly gap-2">
                      <label className="text-[12px] text-white">Valor</label>
                      <NumericFormat
                        id="value"
                        name="value"
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="R$ "
                        decimalScale={2}
                        fixedDecimalScale
                        allowNegative={false}
                        className="w-full rounded border border-white bg-black p-2 text-white"
                        onValueChange={handleCurrencyChange("value")}
                        onBlur={formik.handleBlur}
                        value={formik.values.value}
                        placeholder="R$ 0,00"
                      />
                      {formik.touched.value && formik.errors.value ? (
                        <div className="text-red-500 text-xs">
                          {formik.errors.value}
                        </div>
                      ) : null}
                    </div>

                    <div className="items-start justify-evenly gap-2">
                      <label className="text-[12px] text-white">Status</label>
                      <select
                        id="status"
                        name="status"
                        className="w-full rounded border border-white bg-black p-2 text-white"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.status}
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Pago">Pago</option>
                      </select>
                      {formik.touched.status && formik.errors.status ? (
                        <div className="text-red-500 text-xs">
                          {formik.errors.status}
                        </div>
                      ) : null}
                    </div>

                    <div className="bg-black px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                      <button
                        type="submit"
                        className="inline-flex w-full cursor-pointer justify-center rounded-md bg-green-800 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-green-600 sm:ml-3 sm:w-auto"
                      >
                        {expense ? "Atualizar" : "Adicionar"}
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="mt-3 inline-flex w-full cursor-pointer justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
