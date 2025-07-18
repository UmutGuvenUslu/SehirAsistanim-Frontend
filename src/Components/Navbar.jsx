import React, { useState } from "react";
import "../Css/Navbar.css";
import profilePic from "../assets/profile.jpg";
import { Link } from "react-router-dom";

const Navbar = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <div className="navbar">
            <div className="logo">
                <Link to="/">LOGO</Link>
            </div>

            <div
                className={`nav-links ${isMobileMenuOpen ? "open" : ""}`}
                onClick={() => setIsMobileMenuOpen(false)} // Menü açıkken linke tıklanınca kapansın
            >
                <Link to="/">Ana Sayfa</Link>
                <Link to="/hakkimizda">Hakkımızda</Link>
                <Link to="/iletisim">İletişim</Link>
                <Link to="/sikayetlerim">Şikayetlerim</Link>
            </div>

            <div className="right-section">
                {!isLoggedIn ? (
                    <div className="auth-links">
                        <Link to="/girisyap" className="auth-btn">
                            Giriş Yap
                        </Link>
                        <Link to="/kayitol" className="auth-btn">
                            Üye Ol
                        </Link>
                    </div>
                ) : (
                    <div className="profile" onClick={toggleDropdown}>
                        <img src={profilePic} alt="Profil" className="profile-pic" />
                        {dropdownOpen && (
                            <div className="dropdown-content">
                                <Link to="/profil-ayarlari">Profil</Link>
                                <Link to="/profil-ayarlari">Ayarlar</Link>
                                <Link to="/cikis">Çıkış</Link>
                            </div>
                        )}
                    </div>
                )}

                <div className="hamburger" onClick={toggleMobileMenu}>
                    ☰
                </div>
            </div>
        </div>
    );
};

export default Navbar;
