import React from "react";

export default function Navbar() {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <nav className="bg-white/30 backdrop-blur-md text-black px-10 py-3 rounded-full shadow-lg border border-white/20 min-w-[700px]">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <span className="font-bold text-lg">Şehir Asistanım</span>
          </div>

          {/* Linkler */}
          <div className="flex items-center space-x-6 text-sm font-medium">
            <a href="#" className="hover:text-gray-700 transition">Anasayfa</a>
            <a href="#" className="hover:text-gray-700 transition">Hakkında</a>
            <a href="#" className="hover:text-gray-700 transition">Giriş</a>
            <a
              href="#"
              className="bg-black text-white px-4 py-1 rounded-full hover:bg-gray-800 transition"
            >
              Kayıt Ol
            </a>
          </div>
        </div>
      </nav>
    </div>
  );
}
