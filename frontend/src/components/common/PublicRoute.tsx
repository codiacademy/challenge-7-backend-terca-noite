// src/routes/PublicRoute.tsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import api from "../../api/axios-client.ts";

interface PublicRouteProps {
  children: ReactNode;
}
export function PublicRoute({ children }: PublicRouteProps) {
  const [isLogged, setIsLogged] = useState<boolean | null>(null);

  useEffect(() => {
    const verifyLogin = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setIsLogged(false);
        return;
      }

      try {
        const res = await api.get("http://localhost:3000/users/read_profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        });

        setIsLogged(res.data);
      } catch (error) {
        console.error("Erro ao verificar login:", error);
        setIsLogged(false);
      }
    };

    verifyLogin();
  }, []);

  console.log("Está logado:" + isLogged);
  if (isLogged === null) return <div>Carregando...</div>;

  // Se já está logado, vai pra "/"
  if (isLogged) {
    return <Navigate to="/" replace />;
  }
  // Se não está logado, mostra o login normalmente
  return children;
}
