import { useState, useEffect, useRef } from "react";
import user from "./user.png";
import {
  Bars3Icon,
  HomeIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  Cog6ToothIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

// OpenLayers importları
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import "ol/ol.css";

export default function AdminPanel() {
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setDesktopCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  /* Profil dropdown'ı dış tıklamayla kapat */
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
    <div className="flex min-h-screen bg-gray-100 relative">
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
          fixed lg:static top-0 left-0 h-screen bg-gray-900 text-white flex flex-col z-50
          transition-all duration-300

          /* Mobil: kayarak aç/kapat */
          ${isMobileSidebarOpen ? "translate-x-0 w-64" : "-translate-x-64 w-64"}

          /* Masaüstü: sadece genişlik değişir */
          lg:translate-x-0 ${isDesktopCollapsed ? "lg:w-20" : "lg:w-64"}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {!isDesktopCollapsed && (
            <h2 className="text-xl font-bold whitespace-nowrap">Şehir Asistanım</h2>
          )}
          <button
            onClick={() =>
              window.innerWidth < 1024
                ? setMobileSidebarOpen(!isMobileSidebarOpen)
                : setDesktopCollapsed(!isDesktopCollapsed)
            }
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>

        {/* Menü - Mobil scroll yok, masaüstü gerekirse scroll */}
        <nav
          className={`flex-1 w-full px-4 ${
            isMobileSidebarOpen ? "overflow-hidden" : "overflow-y-auto"
          } lg:overflow-y-auto`}
        >
          <ul className={`space-y-2 ${isMobileSidebarOpen ? "mt-0" : "mt-6"}`}>
            <SidebarItem
              icon={<HomeIcon className="h-5 w-5" />}
              text="Dashboard"
              collapsed={isDesktopCollapsed && !isMobileSidebarOpen}
            />
            <SidebarItem
              icon={<UserGroupIcon className="h-5 w-5" />}
              text="Kullanıcı İşlemleri"
              collapsed={isDesktopCollapsed && !isMobileSidebarOpen}
            />
            <SidebarItem
              icon={<ShoppingBagIcon className="h-5 w-5" />}
              text="Birim Yönetimi"
              collapsed={isDesktopCollapsed && !isMobileSidebarOpen}
            />
            <SidebarItem
              icon={<ChartBarIcon className="h-5 w-5" />}
              text="Şikayet Çözümleri"
              collapsed={isDesktopCollapsed && !isMobileSidebarOpen}
            />
            <SidebarItem
              icon={<Cog6ToothIcon className="h-5 w-5" />}
              text="Şikayet Türü Yönetimi"
              collapsed={isDesktopCollapsed && !isMobileSidebarOpen}
            />
          </ul>
        </nav>
      </aside>

      {/* Ana İçerik */}
      <div className="flex-1 flex flex-col">
        {/* Üstbar */}
        <header className="h-16 bg-white shadow flex items-center justify-between px-6 relative">
          <button
            className="lg:hidden"
            onClick={() => setMobileSidebarOpen(true)}
          >
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
                  <li className="px-3 py-2 hover:bg-gray-100 cursor-pointer">
                    Profilim
                  </li>
                  <li className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-red-500">
                    Çıkış Yap
                  </li>
                </ul>
              </div>
            )}
          </div>
        </header>

        {/* Dashboard İçeriği */}
        <main className="p-6 flex-1 space-y-6">
          {/* İstatistik Kartları */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard title="Toplam Kullanıcı" value="1.250" color="blue" />
            <StatCard title="Toplam Şikayet" value="320" color="green" />
            <StatCard title="Çözülen Şikayetler" value="450" color="purple" />
            <StatCard title="Bekleyen Şikayetler" value="240" color="orange" />
          </section>

          {/* Harita + Tablo */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Harita */}
            <div className="bg-white p-0 rounded-lg shadow-lg lg:col-span-2 h-[400px]">
              <MapComponent />
            </div>

            {/* Tablo */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Şikayet Türüne Göre Dağılım</h3>
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-600 border-collapse">
                  <thead className="text-xs uppercase bg-gray-100 hidden md:table-header-group">
                    <tr>
                      <th className="px-4 py-2">Şikayet Türü</th>
                      <th className="px-4 py-2">Sayısı</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "Çöp Toplama", amount: 100 },
                      { name: "Elektrikler Kesik", amount: 98 },
                      { name: "Kanalizasyon Taşmış", amount: 47 },
                      // Buraya daha fazla kayıt eklersen scroll çıkar
                    ].map((item, idx) => (
                      <tr
                        key={idx}
                        className="border-b block md:table-row md:border-0 mb-4 md:mb-0"
                      >
                        <td className="px-4 py-2 font-medium block md:table-cell">
                          {item.name}
                        </td>
                        <td className="px-4 py-2 text-gray-700 block md:table-cell">
                          {item.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

/* Sidebar item */
function SidebarItem({ icon, text, collapsed }) {
  return (
    <li className="hover:bg-gray-700 p-2 rounded cursor-pointer flex items-center gap-3">
      {icon}
      {!collapsed && <span>{text}</span>}
    </li>
  );
}

/* Kart ve Tablo Satır Bileşenleri */
function StatCard({ title, value, color }) {
  const colorMap = {
    blue: "text-blue-500",
    green: "text-green-500",
    purple: "text-purple-500",
    orange: "text-orange-500",
  };
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
      <h3 className="text-gray-500 text-sm">{title}</h3>
      <p className={`text-2xl font-bold ${colorMap[color]}`}>{value}</p>
    </div>
  );
}

function OrderRow({ name, amount, status, statusColor }) {
  const colorMap = {
    green: "text-green-600",
    yellow: "text-yellow-500",
    red: "text-red-500",
  };
  return (
    <tr className="border-b">
      <td className="px-4 py-2">{name}</td>
      <td className="px-4 py-2">{amount}</td>
      <td className={`px-4 py-2 ${colorMap[statusColor]}`}>{status}</td>
    </tr>
  );
}

/* OpenLayers Harita Bileşeni */
function MapComponent() {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([35.2433, 38.9637]), // Türkiye merkezi
        zoom: 6,
      }),
    });

    return () => map.setTarget(undefined);
  }, []);

  return <div ref={mapRef} className="w-full h-full rounded-lg shadow-lg"></div>;
}
