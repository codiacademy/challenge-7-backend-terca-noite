import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import api from "../../api/axios-client.ts";

interface ProtectedRouteProps {
  children: ReactNode;
}
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setIsValid(false);
        return;
      }

      try {
        const response = await api.get("http://localhost:3000/users/read_profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        });

        if (response.data) {
          setIsValid(true);
        } else if (response.status === 401) {
          // tenta refresh automático
          const refreshResponse = await api.post(
            "http://localhost:3000/refresh",
            {},
            {
              withCredentials: true, // refresh token está no cookie
            },
          );

          if (refreshResponse.data) {
            const data = await refreshResponse.data;
            localStorage.setItem("accessToken", data.accessToken);
            setIsValid(true);
          } else {
            setIsValid(false);
          }
        } else {
          setIsValid(false);
        }
      } catch (error) {
        console.error("Erro ao verificar token:", error);
        setIsValid(false);
      }
    };

    checkToken();
  }, []);

  if (isValid === null) {
    return <div>Carregando...</div>; // evita piscar a tela
  }

  if (!isValid) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}
