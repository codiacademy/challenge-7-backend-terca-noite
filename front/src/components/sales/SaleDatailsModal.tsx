import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sales } from "@/types/types";

interface SaleDetailsModalProps {
  sale: Sales | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SaleDetailsModal = ({ sale, isOpen, onClose }: SaleDetailsModalProps) => {
  if (!sale) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-gray-100 max-h-[500px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Venda</DialogTitle>
          <DialogDescription className="text-gray-400">
            Informações completas da venda selecionada.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p>
            <strong>Data:</strong>{" "}
            {new Intl.DateTimeFormat("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }).format(new Date(sale.date))}
          </p>
          <p>
            <strong>Cliente:</strong> {sale.customer.name}
          </p>
          <p>
            <strong>E-mail:</strong> {sale.customer.email}
          </p>
          <p>
            <strong>Telefone:</strong> {sale.customer.phone}
          </p>
          <p>
            <strong>CPF:</strong> {sale.customer.cpf}
          </p>
          <p>
            <strong>Curso:</strong> {sale.course.name}
          </p>
          <p>
            <strong>Tipo do Curso:</strong>{" "}
            {sale.course.type.charAt(0).toUpperCase() + sale.course.type.slice(1)}
          </p>
          <p>
            <strong>Valor Bruto:</strong>{" "}
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(sale.course.price)}
          </p>
          <p>
            <strong>Desconto:</strong>{" "}
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(sale.discount)}
          </p>
          <p>
            <strong>Taxas:</strong>{" "}
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(sale.taxes)}
          </p>
          <p>
            <strong>Comissões:</strong>{" "}
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(sale.commissions)}
          </p>
          <p>
            <strong>Taxas de Cartão:</strong>{" "}
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(sale.cardFees)}
          </p>
          <p>
            <strong>Valor Final:</strong>{" "}
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(sale.finalPrice)}
          </p>
          <button
            onClick={onClose}
            className="cursor-pointer mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Fechar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};