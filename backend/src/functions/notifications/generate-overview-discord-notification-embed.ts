// Discord Embed JSON Structure
// types.ts (ou onde suas interfaces estão definidas)
type BalanceStats = {
  totalExpenses: number;
  totalSales: number;
  balance: number;
  avarageSales: number;
};

// Formata o valor para a moeda brasileira (R$)
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

interface DiscordEmbed {
  title: string;
  description: string;
  color: number; // Cor em formato decimal (0xRRGGBB)
  fields: { name: string; value: string; inline?: boolean }[];
  timestamp: string;
  footer?: { text: string };
}

export function generateOverviewDiscordNotificationEmbed(
  userName: string | null,
  stats: BalanceStats,
): DiscordEmbed {
  const { totalExpenses, totalSales, balance, avarageSales } = stats; // Verde para positivo (0x10b981), Vermelho para negativo (0xef4444)

  const balanceColorHex = balance >= 0 ? 0x10b981 : 0xef4444;
  const balanceSign = balance >= 0 ? "+" : "";

  return {
    title: `📊 Resumo Financeiro Mensal da Escola Codi do ${userName || "Usuário"}`,
    description: "Aqui está o resumo do seu desempenho financeiro recente (dados atualizados):",
    color: balanceColorHex, // Cor principal do embed
    fields: [
      {
        name: "💰 Vendas Totais",
        value: `**${formatCurrency(totalSales)}**`,
        inline: true,
      },
      {
        name: "💸 Despesas Totais",
        value: `**${formatCurrency(totalExpenses)}**`,
        inline: true,
      },
      {
        name: "⚖️ Saldo Líquido",
        value: `**${balanceSign}${formatCurrency(balance)}**`,
        inline: false, // Ocupa uma linha inteira para destaque
      },
      {
        name: "📈 Média de Vendas",
        value: `**${formatCurrency(avarageSales)}**`,
        inline: true,
      },
      {
        name: "\u200b", // Campo vazio para quebrar a linha/layout
        value: "🔗 **[Acesse o Painel para Mais Detalhes]**(https://codicash.com/login)",
        inline: true,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "Codi Cash Notifications | Dados dos últimos 30 dias",
    },
  };
}
