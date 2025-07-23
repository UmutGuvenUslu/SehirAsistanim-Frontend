import React, { createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

const parseJwt = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const extractUserNameFromToken = (token) => {
  const decoded = parseJwt(token);
  return (
    decoded?.name ||
    decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
    "Kullanıcı"
  );
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [userName, setUserName] = useState(localStorage.getItem("userName"));
  const navigate = useNavigate();

  useEffect(() => {
    setUserName(token ? extractUserNameFromToken(token) : null);

    if (!token) return;

    const decoded = parseJwt(token);
    if (!decoded?.exp) return;

    const interval = setInterval(() => {
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp < currentTime) {
        logout();
        clearInterval(interval);
      }
    }, 5000); // Her 5 saniyede bir kontrol et

    return () => clearInterval(interval);
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    const decoded = parseJwt(newToken);
    localStorage.setItem("userName", extractUserNameFromToken(newToken));
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    setToken(null);
    setUserName(null);
    toast.info("Oturum süreniz doldu, tekrar giriş yapınız.");
    navigate("/girisyap");
  };

  return (
    <AuthContext.Provider value={{ token, userName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
