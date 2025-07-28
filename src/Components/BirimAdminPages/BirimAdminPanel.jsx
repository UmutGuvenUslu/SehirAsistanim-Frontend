import { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import user from "../user.png";
import {
  Bars3Icon,
  HomeIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";

// Token'dan isim bilgisini alan fonksiyon
const getUserNameFromToken = (token) => {
  try {
    if (!token) return "Kullanıcı";
    const parts = token.split(".");
    if (parts.length !== 3) return "Kullanıcı";
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const data = JSON.parse(jsonPayload);

    return (
      data.Name ||
      data.name ||
      data["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
      "Kullanıcı"
    );
  } catch (error) {
    console.error("Token çözümleme hatası (isim):", error);
    return "Kullanıcı";
  }
};

// Token'dan email bilgisini alan fonksiyon
const getUserEmailFromToken = (token) => {
  try {
    if (!token) return "";
    const parts = token.split(".");
    if (parts.length !== 3) return "";
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const data = JSON.parse(jsonPayload);

    return (
      data.Email ||
      data.email ||
      data["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ||
      ""
    );
  } catch (error) {
    console.error("Token çözümleme hatası (email):", error);
    return "";
  }
};

export default function BirimAdminPanel() {
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setDesktopCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUserName, setCurrentUserName] = useState("Kullanıcı");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const handleSidebarLinkClick = () => {
    if (window.innerWidth < 1024) setMobileSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.clear();
    setMenuOpen(false);
    navigate("/girisyap");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const name = getUserNameFromToken(token);
      const email = getUserEmailFromToken(token);
      setCurrentUserName(name);
      setCurrentUserEmail(email);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen flex bg-gray-100 relative">
      {/* Mobil Blur Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-white/30 backdrop-blur-md z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static top-0 left-0 bg-gray-900 text-white flex flex-col z-50
          transition-all duration-300
          ${isMobileSidebarOpen ? "translate-x-0 w-64" : "-translate-x-64 w-64"}
          lg:translate-x-0 ${isDesktopCollapsed ? "lg:w-20" : "lg:w-64"}
          h-screen
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <h2
            className="text-xl font-bold whitespace-nowrap cursor-pointer lg:hidden"
            onClick={() => navigate("/birimadminpanel/")}
          >
            Şehir Asistanım
          </h2>
          {!isDesktopCollapsed && (
            <h2
              className="text-xl font-bold whitespace-nowrap cursor-pointer hidden lg:block"
              onClick={() => navigate("/birimadminpanel/")}
            >
              Şehir Asistanım
            </h2>
          )}
          <button
            onClick={() =>
              window.innerWidth < 1024
                ? setMobileSidebarOpen(!isMobileSidebarOpen)
                : setDesktopCollapsed(!isDesktopCollapsed)
            }
          >
            <Bars3Icon className="h-6 w-6 cursor-pointer" />
          </button>
        </div>

        <nav className="flex-1 px-4 overflow-y-auto" style={{ minHeight: 0 }}>
          <ul className="space-y-2 mt-6">
            <SidebarLink
              to="/birimadminpanel"
              icon={<HomeIcon className="h-5 w-5" />}
              text="Dashboard"
              collapsed={isDesktopCollapsed && !isMobileSidebarOpen}
              onClick={handleSidebarLinkClick}
              isDashboard={true}
            />
            <SidebarLink
              to="birimadminsikayetcozumleri"
              icon={<ChartBarIcon className="h-5 w-5" />}
              text="Şikayet Çözümleri"
              collapsed={isDesktopCollapsed && !isMobileSidebarOpen}
              onClick={handleSidebarLinkClick}
            />            
          </ul>
        </nav>
      </aside>

      {/* Ana İçerik */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Üstbar */}
        <header className="h-16 bg-white shadow flex items-center justify-between px-6 relative flex-shrink-0">
  <button className="lg:hidden" onClick={() => setMobileSidebarOpen(true)}>
    <Bars3Icon className="h-6 w-6" />
  </button>
  <h1 className="text-lg font-semibold">Yönetim Paneli</h1>
  <div className="flex items-center gap-4 relative" ref={menuRef}>
    <span>{currentUserName}</span>

    {/* Profil Resmi */}
    <img
      src={user}
      alt="Profile"
      className="w-8 h-8 rounded-full cursor-pointer"
      onClick={() => setMenuOpen(!menuOpen)}
    />

    {/* Açılır Menü */}
    {menuOpen && (
      <div className="absolute top-12 right-0 bg-white rounded-md shadow-lg w-48 p-2 z-50">
        <div className="px-3 py-2 border-b border-gray-200">
          <p className="font-semibold">{currentUserName}</p>
          <p className="text-xs text-gray-500 break-all max-w-[180px]">
            {currentUserEmail}
          </p>
        </div>
        <ul className="py-2">
          <li
            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => navigate("birimadminprofil")}
          >
            Profilim
          </li>
          <li
            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-red-500"
            onClick={handleLogout}
          >
            Çıkış Yap
          </li>
        </ul>
      </div>
    )}
  </div>
</header>


        {/* Alt Rotalar */}
        <main className="p-6 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarLink({ to, icon, text, collapsed, onClick, isDashboard }) {
  return (
    <li>
      <NavLink
        to={to}
        end={isDashboard}
        className={({ isActive }) =>
          `flex items-center gap-3 p-2 rounded hover:bg-gray-700 transition ${
            isActive ? "bg-gray-800" : ""
          }`
        }
        onClick={onClick}
      >
        {icon}
        {!collapsed && <span>{text}</span>}
      </NavLink>
    </li>
  );
}
