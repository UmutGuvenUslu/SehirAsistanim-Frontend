import React, { useEffect, useRef, useState, useContext, useMemo } from "react";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Style, Icon } from "ol/style";
import "ol/ol.css";
import DataTable from "react-data-table-component";
import axios from "axios";
import { AuthContext } from "../Context/AuthContext";
import { FunnelIcon } from "@heroicons/react/24/outline";

const palette = [
  "#EF4444", "#3B82F6", "#10B981",
  "#F59E0B", "#8B5CF6", "#EC4899", "#6B7280",
];

const assignColors = (types) => {
  const colorMap = {};
  types.forEach((type, idx) => {
    colorMap[type] = palette[idx % palette.length];
  });
  return colorMap;
};

export default function Sikayetlerim() {
  const mapRef = useRef(null);
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedType, setSelectedType] = useState("Tümü"); // Admin kodundakiyle uyumlu
  const { token } = useContext(AuthContext);
function parseJwt(token) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}
const userId = token ? parseJwt(token).sub : null;  const [filterOpen, setFilterOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);


    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
     }, []);

  // API'den veri çek
  useEffect(() => {
    if (!userId) return;

    axios
      .get("https://sehirasistanim-backend-production.up.railway.app/Sikayet/GetAllByUser", {
        params: { userId },
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const mapped = (res.data || []).map((i) => ({
          id: i.id,
          title: i.baslik || "Başlık Yok",
          desc: i.aciklama || "Açıklama Yok",
          photo: i.fotoUrl || null,
          type: i.sikayetTuruAdi || "Belirtilmedi",
          lat: i.latitude || 39.9,
          lon: i.longitude || 32.8,
          status: i.durum || "İnceleniyor",
        }));
        setComplaints(mapped);
        setFilteredComplaints(mapped);
      })
      .catch((err) => console.error("Şikayetler alınırken hata:", err));
  }, [userId, token]);

  // Tür listesi çıkar 
  const uniqueTypes = useMemo(
    () => ["Tümü", ...new Set(complaints.map((c) => c.type))],
    [complaints]
  );
  const typeColors = useMemo(() => assignColors(uniqueTypes), [uniqueTypes]);

  // Filtreleme (Admin kodundakiyle aynı mantık)
  useEffect(() => {
    if (selectedType === "Tümü") {
      setFilteredComplaints(complaints);
    } else {
      setFilteredComplaints(complaints.filter((c) => c.type === selectedType));
    }
  }, [selectedType, complaints]);

  // Harita (filtrelenmiş şikayetleri gösterir)
  useEffect(() => {
    if (!mapRef.current) return;

    const vectorSource = new VectorSource();
    filteredComplaints.forEach((c) => {
      const color = typeColors[c.type] || "#6B7280";
      const feature = new Feature({
        geometry: new Point(fromLonLat([c.lon, c.lat])),
        data: c,
      });
      feature.setStyle(
        new Style({
          image: new Icon({
            src: `https://via.placeholder.com/40/${color.replace("#", "")}/FFFFFF?text=●`,
            scale: 0.8,
          }),
        })
      );
      vectorSource.addFeature(feature);
    });

    const vectorLayer = new VectorLayer({ source: vectorSource });
    const mapObj = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM({ attributions: [] }) }), vectorLayer],
      view: new View({ center: fromLonLat([35, 39]), zoom: 6 }),
      controls: [],
    });

    mapObj.on("singleclick", (e) => {
      mapObj.forEachFeatureAtPixel(e.pixel, (f) => setSelectedComplaint(f.get("data")));
    });

    return () => mapObj.setTarget(undefined);
  }, [filteredComplaints, typeColors]);

  // Tablo kolonları
  const columns = [
    {
      name: "",
      selector: (row) => row.photo,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="w-2 h-10 rounded-full" style={{ backgroundColor: typeColors[row.type] || "#6B7280" }}></span>
          <img src={row.photo || "https://via.placeholder.com/60"} alt="Şikayet" className="w-14 h-14 object-cover rounded-lg border" />
        </div>
      ),
      width: "120px",
    },
    { name: "Başlık", selector: (row) => row.title, sortable: true, grow: 2 },
    { name: "Açıklama", selector: (row) => row.desc, grow: 3 },
    { name: "Tür", selector: (row) => row.type, sortable: true, width: "140px" },
    {
      name: "Durum",
      selector: (row) => row.status,
      cell: (row) => {
        const color = row.status === "Çözüldü" ? "text-green-600" : row.status === "Çözülemedi" ? "text-red-500" : "text-blue-500";
        return <span className={`font-semibold ${color}`}>{row.status}</span>;
      },
      sortable: true,
      width: "140px",
    },
  ];

  return (
    <div className="flex flex-col space-y-6 p-4">
      {/* Harita ve hover filtre ikonu */}
      <div className="relative w-full h-[500px] rounded-xl overflow-hidden shadow">
        <div
            className={`
    absolute flex items-center transition-all duration-300 z-50
 ${isMobile ? "bottom-4 right-4 flex-row-reverse" : "bottom-4 left-4 group"}
  `}
            >
  {/* İkon */}
  <button
    onClick={() => isMobile && setFilterOpen((prev) => !prev)} 
    className="bg-white/30 backdrop-blur-md shadow-lg rounded-full p-3"
  >
    <FunnelIcon className="h-6 w-6 text-gray-700" />
  </button>

  {/* Dropdown */}
  <div
     className={`
    ${isMobile ? "mr-3" : "ml-3"}  // Mobilde sağa açılacak, masaüstünde sola
    bg-white/50 backdrop-blur-lg rounded-lg shadow-lg p-3 transition
    ${isMobile 
      ? (filterOpen ? "opacity-100" : "opacity-0 pointer-events-none") 
      : "opacity-0 group-hover:opacity-100"}
  `}
  >
    <select
      value={selectedType}
      onChange={(e) => setSelectedType(e.target.value)}
      className="px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 shadow-sm"
    >
      {uniqueTypes.map((type, idx) => (
        <option key={idx} value={type}>{type}</option>
      ))}
    </select>
  </div>
</div>

        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-xl shadow p-4">
        <DataTable columns={columns} data={filteredComplaints} pagination highlightOnHover striped dense />
      </div>

      {/* Marker tıklanınca modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-lg">
            <img src={selectedComplaint.photo || "https://via.placeholder.com/200"} alt="Şikayet" className="w-full h-48 object-cover rounded-lg mb-4" />
            <h3 className="text-lg font-semibold text-gray-800">{selectedComplaint.title}</h3>
            <p className="text-gray-600 mt-2">{selectedComplaint.desc}</p>
            <p className="text-sm text-gray-500 mt-3">
              Durum: <span className="font-semibold text-blue-600">{selectedComplaint.status}</span>
            </p>
            <button onClick={() => setSelectedComplaint(null)} className="mt-5 w-full py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition">
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
