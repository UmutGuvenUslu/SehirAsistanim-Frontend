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
} from "@heroicons/react/24/outline";

export default function AdminPanel() {
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setDesktopCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    // Tam ekran yüksekliği ve yatay flex düzen
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
            onClick={() => navigate("/adminpanel/")}
          >
            Şehir Asistanım
          </h2>
          {!isDesktopCollapsed && (
            <h2
              className="text-xl font-bold whitespace-nowrap cursor-pointer hidden lg:block"
              onClick={() => navigate("/adminpanel/")}
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

        <nav
          className="flex-1 px-4 overflow-y-auto"
          style={{ minHeight: 0 }}
        >
          <ul className="space-y-2 mt-6">
            <SidebarLink
              to="/adminpanel"
              icon={<HomeIcon className="h-5 w-5" />}
              text="Dashboard"
              collapsed={isDesktopCollapsed && !isMobileSidebarOpen}
              onClick={handleSidebarLinkClick}
              isDashboard={true}
            />
            <SidebarLink
              to="/adminpanel/sikayetcozumleri"
              icon={<ChartBarIcon className="h-5 w-5" />}
              text="Şikayet Çözümleri"
              collapsed={isDesktopCollapsed && !isMobileSidebarOpen}
              onClick={handleSidebarLinkClick}
            />
            <SidebarLink
              to="/adminpanel/kullanicilar"
              icon={<UserGroupIcon className="h-5 w-5" />}
              text="Kullanıcı İşlemleri"
              collapsed={isDesktopCollapsed && !isMobileSidebarOpen}
              onClick={handleSidebarLinkClick}
            />
            <SidebarLink
              to="/adminpanel/birimyonetimi"
              icon={<ShoppingBagIcon className="h-5 w-5" />}
              text="Birim Yönetimi"
              collapsed={isDesktopCollapsed && !isMobileSidebarOpen}
              onClick={handleSidebarLinkClick}
            />
            <SidebarLink
              to="/adminpanel/sikayetturuyonetimi"
              icon={<Cog6ToothIcon className="h-5 w-5" />}
              text="Şikayet Türü Yönetimi"
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
            <span>Admin</span>
            <img
              src={user}
              alt="Profile"
              className="w-8 h-8 rounded-full cursor-pointer"
              onClick={() => setMenuOpen(!menuOpen)}
            />
            {menuOpen && (
              <div className="absolute top-12 right-0 bg-white rounded-md shadow-lg w-48 p-2 z-50">
                <div className="px-3 py-2 border-b border-gray-200">
                  <p className="font-semibold">Ahmet Yılmaz</p>
                  <p className="text-sm text-gray-500">ahmet@example.com</p>
                </div>
                <ul className="py-2">
                  <li
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => navigate("/adminpanel/profil")}
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

        {/* Alt Rotalar için Outlet */}
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
