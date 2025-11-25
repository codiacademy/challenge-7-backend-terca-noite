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

export function generateOverviewEmailHtml(userName: string, stats: BalanceStats): string {
  const { totalExpenses, totalSales, balance, avarageSales } = stats;

  const balanceColor = balance >= 0 ? "#10b981" : "#ef4444"; // Verde para positivo, vermelho para negativo
  const balanceSign = balance >= 0 ? "+" : "";

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resumo de Desempenho Financeiro</title>
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background-color: #1f2937; padding: 20px; text-align: center; color: #ffffff; border-top-left-radius: 8px; border-top-right-radius: 8px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 30px; }
        .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
        .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
        .stat-card { background-color: #f9fafb; padding: 15px; border-radius: 6px; border-left: 4px solid; }
        .stat-card-title { font-size: 14px; color: #6b7280; margin-bottom: 5px; }
        .stat-card-value { font-size: 20px; font-weight: 700; color: #1f2937; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
        
        /* Cores específicas */
        .sales-color { border-color: #3b82f6; } /* Azul */
        .expenses-color { border-color: #ef4444; } /* Vermelho */
        .balance-color { border-color: ${balanceColor}; }
        .average-color { border-color: #f59e0b; } /* Amarelo/Laranja */

        /* Media Query para responsividade em clientes de e-mail */
        @media only screen and (max-width: 480px) {
            .stat-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Relatório de Desempenho Rápido</h1>
        </div>
        <div class="content">
            <p class="greeting">Olá, ${userName},</p>
            <p style="color: #4b5563; line-height: 1.5;">Aqui está um resumo do seu desempenho financeiro nos últimos 30 dias (atualizado a cada 3 minutos):</p>
            
            <div class="stat-grid">
                <div class="stat-card sales-color">
                    <div class="stat-card-title">Vendas Totais</div>
                    <div class="stat-card-value">${formatCurrency(totalSales)}</div>
                </div>
                
                <div class="stat-card expenses-color">
                    <div class="stat-card-title">Despesas Totais</div>
                    <div class="stat-card-value">${formatCurrency(totalExpenses)}</div>
                </div>
                
                <div class="stat-card balance-color">
                    <div class="stat-card-title">Saldo Líquido</div>
                    <div class="stat-card-value" style="color: ${balanceColor};">${balanceSign}${formatCurrency(balance)}</div>
                </div>

                <div class="stat-card average-color">
                    <div class="stat-card-title">Média de Vendas</div>
                    <div class="stat-card-value">${formatCurrency(avarageSales)}</div>
                </div>
            </div>

            <p style="color: #4b5563; margin-top: 20px;">
                Continue acompanhando o painel para uma análise mais detalhada.
            </p>
        </div>
        <div class="footer">
            Este e-mail foi enviado automaticamente. Para desativar, acesse as configurações de notificação na sua conta.
        </div>
    </div>
</body>
</html>
`;
}
