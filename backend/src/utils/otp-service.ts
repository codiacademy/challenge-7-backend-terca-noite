import bcrypt from "bcrypt";

export async function generateOtpCode() {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // Ex: "482913"
  return code;
}

export async function hashOtp(code: string) {
  const saltRounds = 10;
  return bcrypt.hash(code, saltRounds);
}

export async function compareOtp(code: string, hash: string) {
  return bcrypt.compare(code, hash);
}
