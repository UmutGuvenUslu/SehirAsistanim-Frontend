import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../Context/AuthContext"; 
import { useNavigate } from "react-router-dom";  // Yönlendirme için
import axios from "axios";
import {
  UserIcon,
  EnvelopeIcon,
  IdentificationIcon,
  CalendarDaysIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

// JWT çözümleme
function parseJwt(token) {
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
  } catch (err) {
    console.error("JWT çözümleme hatası:", err);
    return null;
  }
}

export default function BirimAdminProfile() {
  const { token, logout } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const navigate = useNavigate(); // yönlendirme için hook

  useEffect(() => {
    if (!token) return;

    const decoded = parseJwt(token);
    const userId = decoded?.nameid || decoded?.sub || decoded?.id;

    if (!userId) {
      console.warn("Kullanıcı ID'si çözülemedi.");
      return;
    }

    axios
      .get(
        `https://sehirasistanim-backend-production.up.railway.app/Kullanici/GetById/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((res) => setUser(res.data))
      .catch((err) => console.error("Kullanıcı verisi alınamadı:", err));
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.clear();
    navigate("/girisyap");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col items-center py-16 px-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-10">Birim Admin Profilim</h1>

      {/* Kullanıcı Bilgileri */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl w-full">
        {/* İlk Satır */}
        <InfoCard icon={UserIcon} title="Ad" value={user.isim} />
        <InfoCard icon={UserIcon} title="Soyad" value={user.soyisim} />
        <InfoCard icon={IdentificationIcon} title="TC Kimlik" value={user.tc} />

        {/* İkinci Satır */}
        <InfoCard icon={EnvelopeIcon} title="E-posta" value={user.email} />
        <InfoCard icon={ShieldCheckIcon} title="Rol" value="Admin" />
        <InfoCard
          icon={CalendarDaysIcon}
          title="Doğum Tarihi"
          value={user.dogumTarihi?.split("T")[0]}
        />
      </section>

      {/* Çıkış Butonu */}
      <button
        onClick={handleLogout}
        className="mt-12 bg-red-500 text-white px-8 py-3 rounded-xl hover:bg-red-600 transition cursor-pointer"
      >
        Çıkış Yap
      </button>
    </div>
  );
}

// Bilgi Kartı
function InfoCard({ icon: Icon, title, value }) {
  return (
    <div className="flex flex-col items-center bg-white shadow-md p-6 rounded-2xl hover:shadow-xl transition">
      <Icon className="h-10 w-10 text-orange-500 mb-3" />
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <p className="text-gray-600">{value || "—"}</p>
    </div>
  );
}
