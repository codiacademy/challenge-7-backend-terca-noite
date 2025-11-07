import React, { useEffect, useState } from "react";
import { Header } from "../components/common/Header";
import { DangerZone } from "../components/settings/DangerZone";
import { Notifications } from "../components/settings/Notifications";
import { Profile } from "../components/settings/Profile";
import { Security } from "../components/settings/Security";
import { ProfileChangeType } from "../../../backend/src/types/users/user-types";

export function SettingsPage() {
  const [profileData, setProfileData] = useState<ProfileChangeType | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  useEffect(() => {
    const controller = new AbortController();
    async function loadProfile() {
      try {
        setLoadingProfile(true);

        // pegar token do localStorage (ou altere para onde seu login salva o token)
        const token = localStorage.getItem("accessToken") || null;

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        // Ajuste a URL abaixo conforme seu backend (ex: http://localhost:5000/users/read_profile)
        const res = await fetch("http://localhost:3000/users/read_profile", {
          method: "GET",
          headers,
          credentials: "include",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log("Dados do perfil:", data);
        setProfileData(data);
      } catch (err: any) {
        if (err.name !== "AbortError") console.error("Erro ao carregar perfil:", err);
      } finally {
        setLoadingProfile(false);
      }
    }

    loadProfile();
    return () => controller.abort();
  }, []);

  return (
    <div className="flex-1 overflow-auto relative z-10 bg-gray-900">
      <Header title="Configurações" showTimeRange={false} />

      <main className="max-w-4xl mx-auto py-6 px-4 lg:px-8">
        <Profile {...((profileData ?? {}) as any)} isLoading={loadingProfile} />
        <Notifications />
        <Security />
        <DangerZone />
      </main>
    </div>
  );
}
