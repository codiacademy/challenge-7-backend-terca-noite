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
            }).format(new Date(sale.created_at))}
          </p>
          <p>
            <strong>Cliente:</strong> {sale.client_name}
          </p>
          <p>
            <strong>E-mail:</strong> {sale.client_email}
          </p>
          <p>
            <strong>Telefone:</strong> {sale.client_phone}
          </p>
          <p>
            <strong>CPF:</strong> {sale.cpf}
          </p>
          <p>
            <strong>Curso:</strong> {sale.course}
          </p>
          <p>
            <strong>Tipo do Curso:</strong>{" "}
            {sale.course_type.charAt(0).toUpperCase() + sale.course_type.slice(1)}
          </p>
          <p>
            <strong>Valor Bruto:</strong>{" "}
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(sale.course_value)}
          </p>
          <p>
            <strong>Desconto:</strong>{" "}
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(sale.discount_value)}
          </p>
          <p>
            <strong>Taxas:</strong>{" "}
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(sale.taxes_value)}
          </p>
          <p>
            <strong>Comissões:</strong>{" "}
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(sale.commission_value)}
          </p>
          <p>
            <strong>Taxas de Cartão:</strong>{" "}
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(sale.card_fee_value)}
          </p>
          <p>
            <strong>Valor Final:</strong>{" "}
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(sale.total_value)}
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
