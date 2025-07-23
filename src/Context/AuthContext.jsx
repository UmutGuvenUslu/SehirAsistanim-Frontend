import React, { createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";


export const AuthContext = createContext();

const parseJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
};

const extractUserNameFromToken = (token) => {
    const decoded = parseJwt(token);
    return decoded?.name || decoded?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || "Kullanıcı";
};

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem("token"));
    const [userName, setUserName] = useState(localStorage.getItem("userName"));

    useEffect(() => {
        setUserName(token ? extractUserNameFromToken(token) : null);
    }, [token]);

    const login = (newToken) => {
        localStorage.setItem("token", newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        setToken(null);
        setUserName(null);
        toast.info("Çıkış yapıldı. Yine bekleriz! ");
        navigate("/girisyap");
    };


    return (
        <AuthContext.Provider value={{ token, userName, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
