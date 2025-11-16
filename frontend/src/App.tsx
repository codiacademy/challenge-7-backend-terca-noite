import { Route, Routes, useLocation } from "react-router-dom";
import { OverviewPage } from "./pages/OverviewPage";
import { Sidebar } from "./components/common/Sidebar";
import { ExpensesPage } from "./pages/ExpensesPage";
import { SalesPage } from "./pages/SalesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TwoFactorPage } from "./pages/TwoFactorPage.tsx";
import { Login } from "./pages/LoginPage";
import { SignUp } from "./pages/SignUpPage";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { PublicRoute } from "./components/common/PublicRoute";
import { TwoFactorProtectedRoute } from "./components/common/TwoFactorProtectedRoute.tsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import CSS
import { ForgotPassword } from "./pages/ForgotPasswordPage";
import { ResetPassword } from "./pages/ResetPasswordPage.tsx";

export function App() {
  const location = useLocation();
  const showSidebar =
    location.pathname === "/signin" ||
    location.pathname === "/signup" ||
    location.pathname === "/twofactor" ||
    location.pathname === "/forgotpassword" ||
    location.pathname === "/resetpassword";

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
      {/* Background */}
      <div className="inset-0 z-0 ">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 opacity-80" />
        <div className="absolute inset-0 backdrop-blur-sm" />
      </div>

      {!showSidebar && <Sidebar />}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        style={{ zIndex: 9999, position: "fixed" }}
      />
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <OverviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales"
          element={
            <ProtectedRoute>
              <SalesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses"
          element={
            <ProtectedRoute>
              <ExpensesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/signin"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/twofactor"
          element={
            <TwoFactorProtectedRoute>
              <TwoFactorPage />
            </TwoFactorProtectedRoute>
          }
        />
        <Route
          path="/forgotpassword"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/resetpassword"
          element={
            <TwoFactorProtectedRoute>
              <ResetPassword />
            </TwoFactorProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
