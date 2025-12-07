import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

interface TwoFactorProtectedRouteProps {
  children: ReactNode;
}

export function TwoFactorProtectedRoute({ children }: TwoFactorProtectedRouteProps) {
  const [hasTempToken, setHasTempToken] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("tempToken");
    setHasTempToken(!!token);
  }, []);

  if (hasTempToken === null) {
    return <div>Carregando...</div>;
  }

  // ❌ Sem token? Redireciona pro login
  if (!hasTempToken) {
    return <Navigate to="/signin" replace />;
  }

  // ✅ Tem token temporário, deixa acessar a página
  return children;
}
