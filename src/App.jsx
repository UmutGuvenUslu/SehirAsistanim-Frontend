import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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

// 🔒 ProtectedRoute (JWT decode ile rol kontrolü)
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
  return (
    <>
      <Routes>
        {/* 🔐 Giriş ve Kayıt Sayfaları (AuthLayout içinde) */}
        <Route element={<AuthLayout />}>
          <Route path="/girisyap" element={<Login />} />
          <Route path="/kayitol" element={<Register />} />
        </Route>

        {/* 🧭 Ana kullanıcı sayfaları (MainLayout içinde) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<UserMap />} />
        </Route>

        {/* 🛡️ Admin Panel (sadece Admin rolü erişebilir) */}
        <Route
          path="/adminpanel"
          element={
            <ProtectedRoute requiredRole="Admin">
              <AdminPanel />
            </ProtectedRoute>
          }
        >
          {/* Admin Panel alt sayfaları */}
          <Route index element={<Dashboard />} /> {/* Varsayılan Dashboard */}
          <Route path="profil" element={<AdminProfile />} />
          <Route path="kullanicilar" element={<UserManagement />} />
          <Route path="birimyonetimi" element={<DepartmentManagement />} />
          <Route path="sikayetcozumleri" element={<ComplaintSolutions />} />
          <Route path="sikayetturuyonetimi" element={<ComplaintTypes />} />
        </Route>

        {/* 🚫 404 Sayfası */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" />} />
      </Routes>

      {/* 🔔 Toast Bildirimleri */}
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
