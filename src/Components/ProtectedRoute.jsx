import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

// Token çözümleme
const decodeToken = (token) => {
  try {
    if (!token) return {};
    const parts = token.split(".");
    if (parts.length !== 3) return {};
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const data = JSON.parse(jsonPayload);

    let roles = data.role ||
      data["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
      [];
    // Tek string gelirse array'e çevir
    if (!Array.isArray(roles)) roles = [roles];

    return {
      userId:
        data.sub ||
        data.userId ||
        data.id ||
        data.nameidentifier ||
        data["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
        null,
      roles
    };
  } catch (error) {
    console.error("Token çözümleme hatası:", error);
    return {};
  }
};

export default function ProtectedRoute({ children, requiredRole }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    const { roles } = decodeToken(token);
   

    // Eğer roller array'i içinde requiredRole varsa yetki ver
    if (roles && Array.isArray(roles) && roles.includes(requiredRole)) {
      setAuthorized(true);
    } else {
      setAuthorized(false);
    }

    setLoading(false);
  }, [requiredRole]);

  if (loading) return <div>Yükleniyor...</div>;
  if (!authorized) return <Navigate to="/404" />;

  return children;
}
