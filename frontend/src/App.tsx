import { Route, Routes, useLocation } from "react-router-dom";
import { OverviewPage } from "./pages/OverviewPage";
import { Sidebar } from "./components/common/Sidebar";
import { ExpensesPage } from "./pages/ExpensesPage";
import { SalesPage } from "./pages/SalesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { Login } from "./pages/LoginPage";

export function App() {
  const location = useLocation();
  const showSidebar = location.pathname === "/signin";


  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0 ">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 opacity-80" />
        <div className="absolute inset-0 backdrop-blur-sm" />
      </div>

      {!showSidebar && <Sidebar />}

      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/sales" element={<SalesPage />} /> 
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/signin" element={<Login />} />
      </Routes>
    </div>
  );
}
