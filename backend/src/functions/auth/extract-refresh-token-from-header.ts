import supertest from "supertest";

export function extractRefreshTokenFromHeader(response: supertest.Response): string {
  const setCookieHeader = response.headers["set-cookie"];

  if (!setCookieHeader) {
    throw new Error("O cabeçalho 'Set-Cookie' não foi encontrado.");
  }

  let cookieArray: string[] = [];

  if (Array.isArray(setCookieHeader)) {
    cookieArray = setCookieHeader;
  } else if (typeof setCookieHeader === "string") {
    cookieArray = setCookieHeader.split(/,\s*/);
  } else {
    throw new Error(
      "O cabeçalho 'Set-Cookie' está em formato inesperado (não é string nem array).",
    );
  }

  const refreshTokenCookie = cookieArray.find((cookie: string) =>
    cookie.startsWith("refreshToken="),
  );

  if (!refreshTokenCookie) {
    throw new Error("Falha ao extrair refreshToken. Cookie 'refreshToken' não encontrado.");
  }

  // Retorna a string completa do cookie
  return refreshTokenCookie;
}
