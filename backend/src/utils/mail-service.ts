import nodemailer from "nodemailer";
export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOtpEmail(to: string, code: string) {
  await transporter.sendMail({
    from: `"Codi Cash" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Seu código de verificação",
    text: `Seu código de verificação é: ${code}`,
  });
}

export async function sendOverviewEmail(
  to: string,
  subject: string,
  htmlContent: string,
): Promise<void> {
  try {
    await transporter.sendMail({
      from: `"Codi Cash" <${process.env.EMAIL_USER}>`,
      to,
      subject: subject,
      html: htmlContent, // Usa o corpo HTML gerado
    });
  } catch (error) {
    console.error(`Falha ao enviar email de overview para ${to}:`, error);
    throw new Error("Erro ao enviar email via Nodemailer.");
  }
}

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
