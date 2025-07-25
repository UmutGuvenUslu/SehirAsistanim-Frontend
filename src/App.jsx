import React, { useEffect, useContext, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getDistance } from "geolib";

// Component imports
import UserMap from "./Components/UserMap";
import Login from "./Components/Login";
import Register from "./Components/Register";
import AdminPanel from "./Components/AdminPages/AdminPanel";
import NotFoundPage from "./Components/NotFoundPage";
import Sikayetlerim from "./Components/Sikayetlerim";
import Dashboard from "./Components/AdminPages/Dashboard";
import UserManagement from "./Components/AdminPages/UserManagement";
import AdminProfile from "./Components/AdminPages/AdminProfile";
import DepartmentManagement from "./Components/AdminPages/DepartmentManagement";
import ComplaintSolutions from "./Components/AdminPages/ComplaintSolutions";
import ComplaintTypes from "./Components/AdminPages/ComplaintTypes";
import Hakkimizda from "./Components/Hakkimizda";
import Profilim from "./Components/Profilim";
import Navbar from "./Components/Navbar";

// Layout imports
import AuthLayout from "./Layouts/AuthLayout";
import MainLayout from "./Layouts/MainLayout";
import { AuthContext } from "./Context/AuthContext";

// Admin yetkilendirme kontrolü
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
  const location = useLocation();
  const { logout } = useContext(AuthContext);
  const [appUserLocation, setAppUserLocation] = useState(null);
  const [selectedCoord, setSelectedCoord] = useState(null);
  const LIMIT_RADIUS = 25000; // 25 km in meters

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
    // Seçilen konumun kullanıcı konumuna uzaklığını kontrol et
    if (appUserLocation) {
      const distance = getDistance(
        { latitude: appUserLocation[1], longitude: appUserLocation[0] },
        { latitude: coords[1], longitude: coords[0] }
      );
      
      if (distance <= LIMIT_RADIUS) {
        setSelectedCoord(coords);
        if (location.pathname !== "/") {
          navigate("/"); // Anasayfaya yönlendir
        }
      } else {
        toast.warning("Seçtiğiniz konum 25 km sınırının dışında kaldı.");
      }
    } else {
      setSelectedCoord(coords);
      if (location.pathname !== "/") {
        navigate("/"); // Anasayfaya yönlendir
      }
    }
  };

  return (
    <>
      <Routes>
        {/* Login ve Register sayfalarında Navbar yok */}
        <Route element={<AuthLayout />}>
          <Route path="/girisyap" element={<Login />} />
          <Route path="/kayitol" element={<Register />} />
        </Route>

        {/* Kullanıcı tarafı sayfaları (Navbar var) */}
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
                userLocation={appUserLocation} />
            </>
          }
        >
          <Route 
            path="/" 
         
          />
          <Route path="/sikayetlerim" element={<Sikayetlerim />} />
          <Route path="/hakkimizda" element={<Hakkimizda />} />
          <Route path="/profil" element={<Profilim />} />
        </Route>

        {/* Admin panel (Navbar yok) */}
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