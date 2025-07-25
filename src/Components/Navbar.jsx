import React, { useState, useContext, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import SearchBox from "./SearchBox";
import { FaSearch, FaBars, FaTimes } from "react-icons/fa";
import { AuthContext } from "../Context/AuthContext";
import profilePic from "./user.png";

export default function Navbar({ onSearchResult, userLocation }) {
  const { token, userName = "Kullanıcı", logout } = useContext(AuthContext);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const safeOnSearchResult = onSearchResult || (() => {});

  const profileRef = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-[1200px] px-4">
      <nav className="bg-white/30 backdrop-blur-md text-black px-6 py-3 rounded-full shadow-lg border border-white/20 flex items-center justify-between min-w-[300px]">
        {/* Logo */}
        <span className="font-bold text-lg select-none">Şehir Asistanım</span>

        {/* Desktop SearchBox */}
        <div className="hidden md:block ml-4 w-[300px]">
          <SearchBox 
            onSearchResult={onSearchResult} 
            userLocation={userLocation} 
          />
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {/* Ortak linkler */}
          <Link to="/" className="hover:text-gray-700 transition">Anasayfa</Link>
          <Link to="/hakkimizda" className="hover:text-gray-700 transition">Hakkımızda</Link>

          {/* Giriş yapılmamışsa */}
          {!token && (
            <>
              <Link to="/girisyap" className="hover:text-gray-700 transition">Giriş</Link>
              <Link
                to="/kayitol"
                className="bg-orange-500 text-white px-4 py-1 rounded-full hover:bg-gray-800 transition"
              >
                Kayıt Ol
              </Link>
            </>
          )}

          {/* Giriş yapılmışsa */}
          {token && (
            <>
              <Link to="/sikayetlerim" className="hover:text-gray-700 transition">Şikayetlerim</Link>

              {/* Profil resmi ve dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-300 focus:outline-none cursor-pointer"
                  aria-label="Profil"
                >
                  <img
                    src={profilePic}
                    alt="Profil"
                    className="w-full h-full object-cover"
                  />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-300 text-sm z-50 overflow-hidden font-sans">
                    {/* Hoşgeldin yazısı */}
                    <div className="px-6 py-3 border-b border-gray-300 font-semibold text-gray-900 whitespace-normal select-none">
                      Hoşgeldin, {userName}
                    </div>

                    {/* Menü seçenekleri */}
                    <Link
                      to="/profil"
                      className="flex items-center gap-3 px-6 py-3 hover:bg-gray-100 transition-colors border-b border-gray-200 text-gray-700"
                      onClick={() => setProfileOpen(false)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-500 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9.003 9.003 0 0112 15a9 9 0 016.879 2.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Profil
                    </Link>

                    <Link
                      to="/ayarlar"
                      className="flex items-center gap-3 px-6 py-3 hover:bg-gray-100 transition-colors border-b border-gray-200 text-gray-700"
                      onClick={() => setProfileOpen(false)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-500 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2zm0-3a9 9 0 11-9 9 9 9 0 019-9z" />
                      </svg>
                      Ayarlar
                    </Link>

                    {/* Çıkış Butonu */}
                    <button
                      onClick={() => {
                        logout();
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors cursor-pointer"
                      type="button"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16v-1a4 4 0 014-4h6" />
                      </svg>
                      Çıkış Yap
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="md:hidden flex items-center space-x-4">
          {/* Search Icon */}
          <button
            onClick={() => {
              setSearchOpen(!searchOpen);
              setMenuOpen(false);
            }}
            className="p-2 rounded hover:bg-black/10"
            aria-label="Ara"
            type="button"
          >
            <FaSearch className="text-lg" />
          </button>

          {/* Hamburger Menu Icon */}
          <button
            onClick={() => {
              setMenuOpen(!menuOpen);
              setSearchOpen(false);
              setProfileOpen(false);
            }}
            className="p-2 rounded hover:bg-black/10"
            aria-label="Menüyü aç"
            type="button"
          >
            {menuOpen ? <FaTimes className="text-lg" /> : <FaBars className="text-lg" />}
          </button>
        </div>
      </nav>

      {/* Mobile açılır SearchBox */}
      {searchOpen && (
        <div className="absolute top-full mt-2 left-0 right-0 px-4 z-50">
          <div className="bg-white/80 backdrop-blur-md rounded shadow p-2">
            <SearchBox
              onSearchResult={(coords) => {
                safeOnSearchResult(coords);
                setSearchOpen(false);
              }}
              userLocation={userLocation}
            />
          </div>
        </div>
      )}

      {/* Mobile açılır Menü */}
      {menuOpen && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white/80 backdrop-blur-md rounded shadow p-4 z-50 flex flex-col space-y-3 text-center text-sm font-medium">
          {/* Hoşgeldin mesajı mobil menüde en üstte */}
          {token && (
            <div className=" text-center px-2 py-2 font-semibold border-b border-gray-300 ">
              Hoşgeldin, {userName}
            </div>
          )}

          <Link to="/" className="hover:text-gray-700 transition" onClick={() => setMenuOpen(false)}>Anasayfa</Link>
          <Link to="/hakkimizda" className="hover:text-gray-700 transition" onClick={() => setMenuOpen(false)}>Hakkında</Link>

          {!token && (
            <>
              <Link to="/girisyap" className="hover:text-gray-700 transition" onClick={() => setMenuOpen(false)}>Giriş</Link>
              <Link
                to="/kayitol"
                className="bg-orange-500 text-white px-4 py-1 rounded-full hover:bg-gray-800 transition"
                onClick={() => setMenuOpen(false)}
              >
                Kayıt Ol
              </Link>
            </>
          )}

          {token && (
            <>
              <Link to="/sikayetlerim" className="hover:text-gray-700 transition" onClick={() => setMenuOpen(false)}>Şikayetlerim</Link>
              <Link to="/profil" className="hover:text-gray-700 transition" onClick={() => setMenuOpen(false)}>Profil</Link>
              <Link to="/ayarlar" className="hover:text-gray-700 transition" onClick={() => setMenuOpen(false)}>Ayarlar</Link>

              <button
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
                className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-gray-900 transition w-full text-center"
                type="button"
              >
                Çıkış Yap
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}