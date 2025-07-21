import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/404" />;
  }

  try {
    // Token'ı parçala
    const base64Url = token.split(".")[1]; // payload kısmı
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const decoded = JSON.parse(jsonPayload);

    // Role claim'ini bul
    const userRole =
      decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
      decoded["role"] ||
      "";

    // Admin değilse 404'e yönlendir
    if (userRole !== requiredRole) {
      return <Navigate to="/404" />;
    }

    return children;
  } catch (err) {
    // Token bozuksa 404
    return <Navigate to="/404" />;
  }
}
