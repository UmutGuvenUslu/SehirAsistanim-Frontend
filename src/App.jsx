import React, { useState, useEffect, useContext } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProtectedRoute from "./Components/ProtectedRoute"; // ProtectedRoute'ı import et
import AuthLayout from "./Layouts/AuthLayout"; // AuthLayout importu
import MainLayout from "./Layouts/MainLayout"; // MainLayout importu

// Component imports
import AdminPanel from "./Components/AdminPages/AdminPanel";
import NotFoundPage from "./Components/NotFoundPage";
import Dashboard from "./Components/AdminPages/Dashboard";
import AdminProfile from "./Components/AdminPages/AdminProfile";
import Navbar from "./Components/Navbar";
import Sikayetlerim from "./Components/Sikayetlerim";
import Hakkimizda from "./Components/Hakkimizda";
import Profilim from "./Components/Profilim";
import Login from "./Components/Login";
import Register from "./Components/Register";
import BirimAdminPanel from "./Components/BirimAdminPages/BirimAdminPanel";
import BirimAdminDashboard from "./Components/BirimAdminPages/BirimAdminDashboard";
import BirimAdminProfil from "./Components/BirimAdminPages/BirimAdminProfil";
import BirimAdminComplaintSolution from "./Components/BirimAdminPages/BirimAdminComplaintSolution";
import UserManagement from "./Components/AdminPages/UserManagement";
import DepartmentManagement from "./Components/AdminPages/DepartmentManagement";
import ComplaintSolutions from "./Components/AdminPages/ComplaintSolutions";
import ComplaintTypes from "./Components/AdminPages/ComplaintTypes";
import RolYonetimi from "./Components/AdminPages/RolYonetimi";

// Auth context
import { AuthContext } from "./Context/AuthContext";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useContext(AuthContext);
  const [appUserLocation, setAppUserLocation] = useState(null);
  const [selectedCoord, setSelectedCoord] = useState(null);
  const LIMIT_RADIUS = 25000; // 25 km

  // Kullanıcı konumunu al
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lon = position.coords.longitude;
          const lat = position.coords.latitude;
          setAppUserLocation([lon, lat]);
        },
        (error) => {
          console.error("Konum alınamadı:", error);
          toast.warning("Konum servisleri kapalı. Harita özellikleri sınırlı olabilir.");
        }
      );
    }
  }, []);

  // Token süresi kontrolü
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

  const handleSearchResult = (coords) => {
    if (appUserLocation) {
      const distance = getDistance(
        { latitude: appUserLocation[1], longitude: appUserLocation[0] },
        { latitude: coords[1], longitude: coords[0] }
      );

      if (distance <= LIMIT_RADIUS) {
        setSelectedCoord(coords);
        if (location.pathname !== "/") {
          navigate("/");
        }
      } else {
        toast.warning("Seçtiğiniz konum 25 km sınırının dışında kaldı.");
      }
    } else {
      setSelectedCoord(coords);
      if (location.pathname !== "/") {
        navigate("/");
      }
    }
  };

  return (
    <>
      <Routes>
        {/* Login ve Register */}
        <Route element={<AuthLayout />}>
          <Route path="/girisyap" element={<Login />} />
          <Route path="/kayitol" element={<Register />} />
        </Route>

        {/* Kullanıcı tarafı */}
        <Route
          element={
            <>
              <Navbar
                onSearchResult={handleSearchResult}
                userLocation={appUserLocation}
              />
              <MainLayout
                selectedCoordinate={selectedCoord}
                onCoordinateSelect={setSelectedCoord}
                userLocation={appUserLocation}
              />
            </>
          }
        >
          <Route path="/" />
          <Route path="/sikayetlerim" element={<Sikayetlerim />} />
          <Route path="/hakkimizda" element={<Hakkimizda />} />
          <Route path="/profil" element={<Profilim />} />
        </Route>

        {/* Admin Panel */}
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
          <Route path="rollistesi" element={<RolYonetimi />} />
        </Route>

        {/* Birim Admin Panel */}
        <Route
          path="/birimadminpanel"
          element={
            <ProtectedRoute requiredRole="BirimAdmin">
              <BirimAdminPanel />
            </ProtectedRoute>
          }
        >
          <Route index element={<BirimAdminDashboard />} />
          <Route path="birimadminprofil" element={<BirimAdminProfil />} />
          <Route path="birimadminsikayetcozumleri" element={<BirimAdminComplaintSolution />} />
          
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
