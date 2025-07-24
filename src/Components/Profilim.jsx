import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../Context/AuthContext";
import {
  UserIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  IdentificationIcon,
  CalendarDaysIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

export default function Profilim() {
  const { token, logout } = useContext(AuthContext);

  const [user, setUser] = useState({
    isim: "Buse",
    soyisim: "Özmen",
    tc: "12345678901",
    email: "buse@example.com",
    telefon: "05xx xxx xx xx",
    cinsiyet: "Kadın",
    dogumTarihi: "2000-05-15",
  });

  useEffect(() => {
    // API'den kullanıcı bilgisi çekmek için:
    // axios.get("/api/user/me", { headers: { Authorization: `Bearer ${token}` } })
    //   .then(res => setUser(res.data));
  }, [token]);

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
          {/* Ad */}
          <div className="flex flex-col items-center bg-white shadow-md p-6 rounded-2xl hover:shadow-xl transition">
            <UserIcon className="h-10 w-10 text-orange-500 mb-3" />
            <h3 className="text-lg font-semibold text-gray-700">Ad</h3>
            <p className="text-gray-600">{user.isim}</p>
          </div>

          {/* Soyad */}
          <div className="flex flex-col items-center bg-white shadow-md p-6 rounded-2xl hover:shadow-xl transition">
            <UserCircleIcon className="h-10 w-10 text-orange-500 mb-3" />
            <h3 className="text-lg font-semibold text-gray-700">Soyad</h3>
            <p className="text-gray-600">{user.soyisim}</p>
          </div>

          {/* TC Kimlik */}
          <div className="flex flex-col items-center bg-white shadow-md p-6 rounded-2xl hover:shadow-xl transition">
            <IdentificationIcon className="h-10 w-10 text-orange-500 mb-3" />
            <h3 className="text-lg font-semibold text-gray-700">TC Kimlik</h3>
            <p className="text-gray-600">{user.tc}</p>
          </div>

          {/* Email */}
          <div className="flex flex-col items-center bg-white shadow-md p-6 rounded-2xl hover:shadow-xl transition">
            <EnvelopeIcon className="h-10 w-10 text-orange-500 mb-3" />
            <h3 className="text-lg font-semibold text-gray-700">E-posta</h3>
            <p className="text-gray-600">{user.email}</p>
          </div>

          {/* Telefon */}
          <div className="flex flex-col items-center bg-white shadow-md p-6 rounded-2xl hover:shadow-xl transition">
            <DevicePhoneMobileIcon className="h-10 w-10 text-orange-500 mb-3" />
            <h3 className="text-lg font-semibold text-gray-700">Telefon</h3>
            <p className="text-gray-600">{user.telefon}</p>
          </div>

          {/* Cinsiyet */}
          <div className="flex flex-col items-center bg-white shadow-md p-6 rounded-2xl hover:shadow-xl transition">
            <UserCircleIcon className="h-10 w-10 text-orange-500 mb-3" />
            <h3 className="text-lg font-semibold text-gray-700">Cinsiyet</h3>
            <p className="text-gray-600">{user.cinsiyet}</p>
          </div>

          {/* Doğum Tarihi */}
          <div className="flex flex-col items-center bg-white shadow-md p-6 rounded-2xl hover:shadow-xl transition sm:col-span-2 lg:col-span-3">
            <CalendarDaysIcon className="h-10 w-10 text-orange-500 mb-3" />
            <h3 className="text-lg font-semibold text-gray-700">Doğum Tarihi</h3>
            <p className="text-gray-600">{user.dogumTarihi}</p>
          </div>
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
