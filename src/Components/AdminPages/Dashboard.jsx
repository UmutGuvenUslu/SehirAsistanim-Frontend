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

import ComplaintPieChart from "./ComplaintPieChart";
import ComplaintSolvedRateChart from "./ComplaintSolvedRateChart";

export default function Dashboard() {
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
    Promise.all([
      axios.get("https://sehirasistanim-backend-production.up.railway.app/Kullanici/TotalKullaniciSayisi", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get("https://sehirasistanim-backend-production.up.railway.app/Sikayet/TotalSikayetSayisi", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get("https://sehirasistanim-backend-production.up.railway.app/Sikayet/CozulenSikayetSayisi", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get("https://sehirasistanim-backend-production.up.railway.app/Sikayet/BekleyenSikayetSayisi", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get("https://sehirasistanim-backend-production.up.railway.app/Sikayet/GetAll", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ])
      .then(([totalUsersRes, totalComplaintsRes, resolvedComplaintsRes, pendingComplaintsRes, complaintsRes]) => {
        setTotalUsers(totalUsersRes.data ?? 0);
        setTotalComplaints(totalComplaintsRes.data ?? 0);
        setResolvedComplaints(resolvedComplaintsRes.data ?? 0);
        setPendingComplaints(pendingComplaintsRes.data ?? 0);
        setComplaints(Array.isArray(complaintsRes.data) ? complaintsRes.data : []);
      })
      .catch((err) => console.error("Veriler çekilemedi:", err));
  }, []);

  // Harita ayarları
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
      if (!feature) {
        setSelectedComplaint(null);
        return;
      }
      const data = feature.get("data");
      setSelectedComplaint(data);
    });

    return () => map.setTarget(undefined);
  }, []);

  // Harita boyut güncelleme (mobilde kaybolmayı engellemek için)
  useEffect(() => {
    if (mapObjRef.current) {
      setTimeout(() => {
        mapObjRef.current.updateSize();
      }, 150);
    }
  }, [complaints, window.innerWidth]);

  // Marker'lar
  useEffect(() => {
    if (!mapObjRef.current || !vectorSourceRef.current) return;
    const vectorSource = vectorSourceRef.current;
    vectorSource.clear();

    complaints.forEach((c) => {
      if (!c.longitude || !c.latitude) return;
      const feature = new Feature({
        geometry: new Point(fromLonLat([c.longitude, c.latitude])),
        data: c,
      });
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

  const typeDistribution = (() => {
    try {
      const map = complaints.reduce((acc, cur) => {
        const key = cur.sikayetTuruAdi ?? cur.sikayetTuru?.adi ?? cur.sikayetTuruId ?? "Diğer";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      return Object.entries(map).map(([name, amount]) => ({ name, amount }));
    } catch {
      return [];
    }
  })();

  return (
    <>
      {/* İstatistik Kartları */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Toplam Kullanıcı" value={totalUsers} color="blue" />
        <StatCard title="Toplam Şikayet" value={totalComplaints} color="green" />
        <StatCard title="Çözülen Şikayetler" value={resolvedComplaints} color="purple" />
        <StatCard title="Bekleyen Şikayetler" value={pendingComplaints} color="orange" />
      </section>

      {/* Harita + Chartlar (tek responsive layout) */}
      <section className="mt-6 flex flex-col md:flex-row gap-6">
        {/* Harita */}
        <div className="bg-white rounded-lg shadow-lg w-full md:w-[70%] relative" style={{ height: "50vh" }}>
          <div ref={mapRef} className="w-full h-full rounded-lg" />

          {/* Popup (Sol Üstte Sabit) */}
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
                opacity: 1,
                transform: "translateY(0)",
                transition: "opacity 0.3s ease, transform 0.3s ease",
              }}
            >
              <button
                onClick={() => setSelectedComplaint(null)}
                className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow hover:bg-red-600"
                style={{ lineHeight: 1 }}
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
              {/* Doğrulanma Sayısı */}
              <p
                className="text-sm font-medium text-green-600 text-center bg-green-50 py-1 px-3 rounded-full border border-green-200 shadow-inner"
                style={{ display: "inline-block", marginTop: "6px" }}
              >
                Doğrulanma: {selectedComplaint.dogrulanmaSayisi || 0}
              </p>
            </div>
          )}
        </div>

        {/* Chartlar */}
        <div className="flex flex-col gap-4 md:w-[30%]">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-start justify-center flex-1">
            <h3 className="text-lg font-semibold mb-4">Şikayet Türlerine Göre Dağılım</h3>
            <ComplaintPieChart data={typeDistribution} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-start justify-center flex-1">
            <h3 className="text-lg font-semibold mb-4">Çözülme Oranı</h3>
            <ComplaintSolvedRateChart data={complaints} />
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
