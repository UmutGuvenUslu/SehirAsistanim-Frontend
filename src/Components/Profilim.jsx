import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../Context/AuthContext";
import axios from "axios";
import {
  UserIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  IdentificationIcon,
  CalendarDaysIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

// JWT token'dan kullanıcı ID’sini decode eden yardımcı fonksiyon
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

export default function Profilim() {
  const { token, logout } = useContext(AuthContext);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!token) return;

    const decoded = parseJwt(token);
    const userId = decoded?.nameid || decoded?.sub || decoded?.id;

    if (!userId) {
      console.warn("Kullanıcı ID'si çözülemedi.");
      return;
    }

    axios
      .get(`https://sehirasistanim-backend-production.up.railway.app/Kullanici/GetById/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setUser(res.data);
      })
      .catch((err) => {
        console.error("Kullanıcı verisi alınamadı:", err);
      });
  }, [token]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Üstteki Büyük Görsel */}
      <div className="w-full h-[300px] md:h-[400px] lg:h-[450px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1529101091764-c3526daf38fe?auto=format&fit=crop&w=1470&q=80"
          alt="Profil Üst Görsel"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Hero Başlık */}
      <div className="relative w-full h-[220px] overflow-hidden bg-gray-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-white text-4xl md:text-5xl font-extrabold drop-shadow-lg">
            Profilim
          </h1>
        </div>
      </div>

      {/* Kullanıcı Bilgileri Kartları */}
      <main className="max-w-5xl mx-auto px-6 py-16 space-y-12">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <InfoCard icon={UserIcon} title="Ad" value={user.isim} />
          <InfoCard icon={UserCircleIcon} title="Soyad" value={user.soyisim} />
          <InfoCard icon={IdentificationIcon} title="TC Kimlik" value={user.tc} />
          <InfoCard icon={EnvelopeIcon} title="E-posta" value={user.email} />
          <InfoCard icon={DevicePhoneMobileIcon} title="Telefon" value={user.telefonNo} />
          <InfoCard icon={UserCircleIcon} title="Cinsiyet" value={user.cinsiyet} />
          <InfoCard
            icon={CalendarDaysIcon}
            title="Doğum Tarihi"
            value={user.dogumTarihi?.split("T")[0]}
            fullRow
          />
        </section>

        {/* Çıkış Butonu */}
        <div className="text-center">
          <button
            onClick={logout}
            className="bg-red-500 text-white px-8 py-3 rounded-xl hover:bg-red-600 transition"
          >
            Çıkış Yap
          </button>
        </div>
      </main>
    </div>
  );
}

// Kullanıcı bilgi kartı bileşeni
function InfoCard({ icon: Icon, title, value, fullRow = false }) {
  return (
    <div
      className={`flex flex-col items-center bg-white shadow-md p-6 rounded-2xl hover:shadow-xl transition ${
        fullRow ? "sm:col-span-2 lg:col-span-3" : ""
      }`}
    >
      <Icon className="h-10 w-10 text-orange-500 mb-3" />
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <p className="text-gray-600">{value || "—"}</p>
    </div>
  );
}
