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
  // HTML Template moderno e amigável para o código de verificação (OTP)
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Seu Código de Verificação Codi Cash</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f7f7f7; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; padding: 20px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); border-top: 5px solid #10b981; }
            .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eeeeee; }
            .header img { max-width: 150px; }
            .content { padding: 30px 0; text-align: center; color: #333333; }
            .greeting { font-size: 18px; font-weight: 500; margin-bottom: 20px; }
            .message { font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
            .otp-box { background-color: #e6fffa; color: #065f46; font-size: 32px; font-weight: 700; padding: 15px 25px; display: inline-block; border-radius: 8px; letter-spacing: 5px; margin-bottom: 30px; border: 1px dashed #34d399; }
            .warning { font-size: 14px; color: #6b7280; margin-top: 20px; }
            .footer { padding-top: 20px; border-top: 1px solid #eeeeee; text-align: center; font-size: 12px; color: #9ca3af; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <!-- Logotipo Codi Cash (usando um placeholder genérico) -->
                <h1 style="color: #10b981; font-size: 28px; margin: 0;">Codi Cash</h1>
            </div>
            <div class="content">
                <p class="greeting">Olá!</p>
                <p class="message">
                    Você solicitou um código para verificar sua identidade. Utilize o código abaixo para prosseguir com a sua ação:
                </p>
                <div class="otp-box">${code}</div>
                <p class="message">
                    Este código é válido por um curto período de tempo. Por favor, não o compartilhe com ninguém.
                </p>
                <p class="warning">
                    Se você não solicitou este código, por favor, ignore este e-mail. Sua conta está segura.
                </p>
            </div>
            <div class="footer">
                &copy; ${new Date().getFullYear()} Codi Cash. Todos os direitos reservados.
            </div>
        </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Codi Cash" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🔐 Seu Código de Verificação Codi Cash",
    html: htmlContent, // Usando o template HTML
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
