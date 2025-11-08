// src/routes/PublicRoute.tsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

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
        const res = await fetch("http://localhost:3000/users/read_profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        setIsLogged(res.ok); // true se token válido, false se 401
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
