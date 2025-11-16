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
