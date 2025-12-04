export function extractTokenValue(cookieString: string): string | undefined {
  const match = cookieString.match(/refreshToken=([^;]+)/);
  return match ? match[1] : undefined;
}
