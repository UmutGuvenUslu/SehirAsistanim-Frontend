import React, { useState } from "react";
import { Link } from "react-router-dom";
import SearchBox from "./SearchBox";
import { FaSearch, FaBars, FaTimes } from "react-icons/fa";

export default function Navbar({ onSearchResult }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const safeOnSearchResult = onSearchResult || (() => { });

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-[1200px] px-4">

      <nav className="bg-white/30 backdrop-blur-md text-black px-6 py-3 rounded-full shadow-lg border border-white/20 flex items-center justify-between min-w-[300px]">

        {/* Logo */}
        <span className="font-bold text-lg select-none">Şehir Asistanım</span>

        {/* Desktop SearchBox */}
        <div className="hidden md:block ml-4 w-[300px]">
          <SearchBox onSearchResult={onSearchResult} />
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <a href="#" className="hover:text-gray-700 transition">Anasayfa</a>
          <a href="/hakkinda" className="hover:text-gray-700 transition">Hakkında</a>
          <Link to="/girisyap" className="hover:text-gray-700 transition">Giriş</Link>
          <Link
            to="/kayitol"
            className="bg-black text-white px-4 py-1 rounded-full hover:bg-gray-800 transition"
          >
            Kayıt Ol
          </Link>
        </div>

        {/* Mobile Controls */}
        <div className="md:hidden flex items-center space-x-4">

          {/* Search Icon */}
          <button
            onClick={() => {
              setSearchOpen(!searchOpen);
              setMenuOpen(false); // Menü kapansın
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
              setSearchOpen(false); // Arama kapansın
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
            />
          </div>
        </div>
      )}

      {/* Mobile açılır Menü */}
      {menuOpen && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white/80 backdrop-blur-md rounded shadow p-4 z-50 flex flex-col space-y-3 text-center text-sm font-medium">
          <a href="#" className="hover:text-gray-700 transition" onClick={() => setMenuOpen(false)}>Anasayfa</a>
          <a href="/hakkinda" className="hover:text-gray-700 transition" onClick={() => setMenuOpen(false)}>Hakkında</a>
          <Link to="/girisyap" className="hover:text-gray-700 transition" onClick={() => setMenuOpen(false)}>Giriş</Link>
          <Link
            to="/kayitol"
            className="bg-black text-white px-4 py-1 rounded-full hover:bg-gray-800 transition"
            onClick={() => setMenuOpen(false)}
          >
            Kayıt Ol
          </Link>
        </div>
      )}

    </div>
  );
}