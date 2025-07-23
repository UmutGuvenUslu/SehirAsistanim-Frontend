import React, { useEffect, useContext } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import UserMap from "./Components/UserMap";
import Login from "./Components/Login";
import Register from "./Components/Register";
import AdminPanel from "./Components/AdminPages/AdminPanel";
import NotFoundPage from "./Components/NotFoundPage";

import Dashboard from "./Components/AdminPages/Dashboard";
import UserManagement from "./Components/AdminPages/UserManagement";
import AdminProfile from "./Components/AdminPages/AdminProfile";
import DepartmentManagement from "./Components/AdminPages/DepartmentManagement";
import ComplaintSolutions from "./Components/AdminPages/ComplaintSolutions";
import ComplaintTypes from "./Components/AdminPages/ComplaintTypes";

import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import AuthLayout from "./Layouts/AuthLayout";
import MainLayout from "./Layouts/MainLayout";
import { AuthContext } from "./Context/AuthContext"; // 🔁 Yol sana göre değişebilir

function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/404" />;

  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const decoded = JSON.parse(jsonPayload);

    const userRole =
      decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
      decoded["role"] ||
      "";

    if (userRole !== requiredRole) return <Navigate to="/404" />;

    return children;
  } catch (err) {
    return <Navigate to="/404" />;
  }
}

function App() {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const expiry = localStorage.getItem("tokenExpiry");

    if (token && expiry) {
      const expiryTime = parseInt(expiry, 10);
      const now = Date.now();

      if (now >= expiryTime) {
        logout();
      } else {
        const remaining = expiryTime - now;
        const timeoutId = setTimeout(() => {
          logout();
        }, remaining);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [logout]);

  return (
    <>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/girisyap" element={<Login />} />
          <Route path="/kayitol" element={<Register />} />
        </Route>

        <Route element={<MainLayout />}>
          <Route path="/" element={<UserMap />} />
        </Route>

        <Route
          path="/adminpanel"
          element={
            <ProtectedRoute requiredRole="Admin">
              <AdminPanel />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="profil" element={<AdminProfile />} />
          <Route path="kullanicilar" element={<UserManagement />} />
          <Route path="birimyonetimi" element={<DepartmentManagement />} />
          <Route path="sikayetcozumleri" element={<ComplaintSolutions />} />
          <Route path="sikayetturuyonetimi" element={<ComplaintTypes />} />
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" />} />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
      />
    </>
  );
}

export default App;
