import { useEffect, useRef, useState } from "react";
import axios from "axios";
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

import ComplaintPieChart from "../AdminPages/ComplaintPieChart";
import ComplaintSolvedRateChart from "../AdminPages/ComplaintSolvedRateChart";

// Token çözümleyici (debug amaçlı sadece role görmek için)
const decodeToken = (token) => {
  try {
    if (!token) return {};
    const parts = token.split(".");
    if (parts.length !== 3) return {};
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const data = JSON.parse(jsonPayload);
    return {
      userId:
        data.sub ||
        data.userId ||
        data.id ||
        data.nameidentifier ||
        data["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
        null,
      role: data.role || data["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || null,
    };
  } catch (error) {
    console.error("Token çözümleme hatası:", error);
    return {};
  }
};

export default function BirimAdminDashboard() {
  const mapRef = useRef(null);
  const vectorSourceRef = useRef(null);
  const vectorLayerRef = useRef(null);
  const mapObjRef = useRef(null);

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalComplaints, setTotalComplaints] = useState(0);
  const [resolvedComplaints, setResolvedComplaints] = useState(0);
  const [pendingComplaints, setPendingComplaints] = useState(0);
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const { role } = decodeToken(token);


    const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

    Promise.all([
      axios.get("https://sehirasistanim-backend-production.up.railway.app/Kullanici/TotalKullaniciSayisi", axiosConfig),
      axios.get("https://sehirasistanim-backend-production.up.railway.app/Sikayet/TotalSikayetSayisi", axiosConfig),
      axios.get("https://sehirasistanim-backend-production.up.railway.app/Sikayet/CozulenSikayetSayisi", axiosConfig),
      axios.get("https://sehirasistanim-backend-production.up.railway.app/Sikayet/BekleyenSikayetSayisi", axiosConfig),
      axios.get("https://sehirasistanim-backend-production.up.railway.app/Sikayet/GetAll", axiosConfig),
    ])
      .then(([usersRes, totalRes, resolvedRes, pendingRes, allRes]) => {
        setTotalUsers(usersRes.data ?? 0);
        setTotalComplaints(totalRes.data ?? 0);
        setResolvedComplaints(resolvedRes.data ?? 0);
        setPendingComplaints(pendingRes.data ?? 0);
        setComplaints(Array.isArray(allRes.data) ? allRes.data : []);
      })
      .catch((err) => {
        console.error("Veriler çekilemedi:", err);
      });
  }, []);

  // Harita kurulumu
  useEffect(() => {
    if (!mapRef.current) return;
    vectorSourceRef.current = new VectorSource();
    vectorLayerRef.current = new VectorLayer({ source: vectorSourceRef.current });

    const map = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM({ attributions: [] }) }), vectorLayerRef.current],
      view: new View({
        center: fromLonLat([35.2433, 38.9637]),
        zoom: 6,
      }),
      controls: [],
    });
    mapObjRef.current = map;

    map.on("singleclick", (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f, { hitTolerance: 10 });
      setSelectedComplaint(feature ? feature.get("data") : null);
    });

    return () => map.setTarget(undefined);
  }, []);

  // Harita boyut güncelleme
  useEffect(() => {
    if (mapObjRef.current) {
      setTimeout(() => {
        mapObjRef.current.updateSize();
      }, 150);
    }
  }, [complaints, window.innerWidth]);

  // Marker ekleme
  useEffect(() => {
    if (!mapObjRef.current || !vectorSourceRef.current) return;
    const vectorSource = vectorSourceRef.current;
    vectorSource.clear();

    complaints.forEach((c) => {
      if (!c.longitude || !c.latitude) return;
      const feature = new Feature({ geometry: new Point(fromLonLat([c.longitude, c.latitude])), data: c });
      feature.setStyle(
        new Style({
          image: new Icon({
            src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
            scale: 0.05,
          }),
        })
      );
      vectorSource.addFeature(feature);
    });
  }, [complaints]);

  return (
    <>
      {/* İstatistik Kartları */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Toplam Kullanıcı" value={totalUsers} color="blue" />
        <StatCard title="Toplam Şikayet" value={totalComplaints} color="green" />
        <StatCard title="Çözülen Şikayetler" value={resolvedComplaints} color="purple" />
        <StatCard title="Bekleyen Şikayetler" value={pendingComplaints} color="orange" />
      </section>

      {/* Harita + Chartlar */}
      <section className="mt-6 flex flex-col md:flex-row gap-6">
        {/* Harita */}
        <div className="bg-white rounded-lg shadow-lg w-full md:w-[70%] relative" style={{ height: "50vh" }}>
          <div ref={mapRef} className="w-full h-full rounded-lg" />

          {selectedComplaint && (
            <div
              className="absolute z-50 bg-white rounded-lg shadow-lg p-4"
              style={{
                top: "12px",
                left: "12px",
                minWidth: "250px",
                maxWidth: "300px",
                maxHeight: "400px",
                overflowY: "auto",
              }}
            >
              <button
                onClick={() => setSelectedComplaint(null)}
                className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full"
              >
                ×
              </button>
              <img
                src={selectedComplaint.fotoUrl || "https://via.placeholder.com/240x130?text=Görsel+Yok"}
                alt={selectedComplaint.baslik}
                className="w-full h-32 object-cover rounded mb-2"
              />
              <h3 className="font-semibold text-base mb-1">{selectedComplaint.baslik}</h3>
              <p className="text-sm text-gray-600 mb-1">{selectedComplaint.aciklama}</p>
              <p className="text-xs text-gray-500 mb-1">
                Gönderilme: {new Date(selectedComplaint.gonderilmeTarihi).toLocaleString()}
              </p>
              <p className="text-sm font-semibold mb-2">Durum: {selectedComplaint.durum}</p>
              <p
                className="text-sm font-medium text-green-600 bg-green-50 py-1 px-3 rounded-full border border-green-200 shadow-inner inline-block mt-2"
              >
                Doğrulanma: {selectedComplaint.dogrulanmaSayisi || 0}
              </p>
            </div>
          )}
        </div>

        {/* Chartlar */}
        <div className="flex flex-col gap-4 md:w-[30%]">
          <div
            className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-start justify-start"
            style={{ height: "50vh" }}
          >
            <h3 className="text-lg font-semibold mb-4">Çözülme Oranı</h3>
            <div className="flex-1 w-full">
              <ComplaintSolvedRateChart data={complaints} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

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
