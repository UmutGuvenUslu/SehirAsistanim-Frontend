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
  const [popupContent, setPopupContent] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      .then(
        ([
          totalUsersRes,
          totalComplaintsRes,
          resolvedComplaintsRes,
          pendingComplaintsRes,
          complaintsRes,
        ]) => {
          setTotalUsers(totalUsersRes.data ?? 0);
          setTotalComplaints(totalComplaintsRes.data ?? 0);
          setResolvedComplaints(resolvedComplaintsRes.data ?? 0);
          setPendingComplaints(pendingComplaintsRes.data ?? 0);

          const data = Array.isArray(complaintsRes.data) ? complaintsRes.data : [];
          setComplaints(data);
        }
      )
      .catch((err) => console.error("Veriler çekilemedi:", err));
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    vectorSourceRef.current = new VectorSource();
    vectorLayerRef.current = new VectorLayer({ source: vectorSourceRef.current });

    const map = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM(), attributions: [] }), vectorLayerRef.current],
      view: new View({
        center: fromLonLat([35.2433, 38.9637]),
        zoom: isMobile ? 5 : 6, // Mobilde biraz daha uzak zoom
      }),
      controls: [],
    });

    mapObjRef.current = map;

    // Haritaya tıklanınca popup içeriğini güncelle
    map.on("click", (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (feat) => feat);
      if (feature) {
        const data = feature.get("data");
        if (data) {
          setPopupContent(data);
        }
      } else {
        setPopupContent(null);
      }
    });

    return () => map.setTarget(undefined);
  }, [isMobile]);

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
            scale: isMobile ? 0.04 : 0.05, // Mobilde biraz daha küçük ikon
          }),
        })
      );

      vectorSource.addFeature(feature);
    });
  }, [complaints, isMobile]);

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

    {/* Harita ve Sağdaki chartlar */}
    <section className="mt-6">
      {isMobile ? (
        // Mobil görünüm - Harita ve chartlar üst üste
        <div className="flex flex-col gap-6">
          {/* Harita */}
          <div className="bg-white rounded-lg shadow-lg w-full h-[300px] relative">
            <div ref={mapRef} className="w-full h-full rounded-lg" />
            
            {/* Popup */}
            {popupContent && (
              <div className="bg-white rounded shadow-lg p-4 absolute z-50 top-12 left-12"
                style={{
                  minWidth: "250px",
                  maxWidth: "300px",
                  maxHeight: "400px",
                  overflowY: "auto",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                <button
                  onClick={() => setPopupContent(null)}
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold"
                  aria-label="Close popup"
                  style={{ lineHeight: 1 }}
                >
                  &times;
                </button>
                <h3 className="font-bold mb-2 text-center">{popupContent.baslik}</h3>
                <p className="text-sm mb-1 text-center">{popupContent.aciklama}</p>
                <p className="text-xs text-gray-500 mb-1 text-center">
                  Gönderilme Tarihi: {new Date(popupContent.gonderilmeTarihi).toLocaleString()}
                </p>
                <p className="text-xs font-semibold mb-2 text-center">Durum: {popupContent.durum}</p>
                {popupContent.fotoUrl && (
                  <div className="flex justify-center">
                    <img
                      src={popupContent.fotoUrl}
                      alt={popupContent.baslik}
                      className="w-full max-h-40 object-cover rounded"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chartlar */}
          <div className="flex flex-col gap-4">
            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
              <h3 className="text-lg font-semibold mb-4 text-center">
                Şikayet Türlerine Göre Dağılım
              </h3>
              <div className="w-full h-[250px] flex justify-center">
                <ComplaintPieChart data={typeDistribution} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
              <h3 className="text-lg font-semibold mb-4 text-center">
                Çözülme Oranı
              </h3>
              <div className="w-full h-[250px] flex justify-center">
                <ComplaintSolvedRateChart data={complaints} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Masaüstü görünüm - Orijinal layout
        <div className="flex flex-col md:flex-row gap-6 h-[500px]">
          {/* Harita - %70 genişlik */}
          <div className="bg-white rounded-lg shadow-lg md:w-[70%] h-full relative">
            <div ref={mapRef} className="w-full h-full rounded-lg" />

            {/* Popup sol üst köşeye sabit */}
            <div
              className="bg-white rounded shadow-lg p-4 absolute z-50"
              style={{
                display: popupContent ? "block" : "none",
                top: "12px",
                left: "12px",
                minWidth: "250px",
                maxWidth: "300px",
                maxHeight: "400px",
                overflowY: "auto",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              {/* Çarpı butonu */}
              <button
                onClick={() => setPopupContent(null)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold"
                aria-label="Close popup"
                style={{ lineHeight: 1 }}
              >
                &times;
              </button>

              {popupContent && (
                <>
                  <h3 className="font-bold mb-2">{popupContent.baslik}</h3>
                  <p className="text-sm mb-1">{popupContent.aciklama}</p>
                  <p className="text-xs text-gray-500 mb-1">
                    Gönderilme Tarihi: {new Date(popupContent.gonderilmeTarihi).toLocaleString()}
                  </p>
                  <p className="text-xs font-semibold mb-2">Durum: {popupContent.durum}</p>
                  {popupContent.fotoUrl && (
                    <img
                      src={popupContent.fotoUrl}
                      alt={popupContent.baslik}
                      className="w-full max-h-40 object-cover rounded"
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Sağdaki chartlar - %30 genişlik, üst üste */}
          <div className="flex flex-col gap-4 md:w-[30%] h-full">
            {/* Üstteki chart */}
            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-start justify-center flex-1">
              <h3 className="text-lg font-semibold mb-4 text-left">
                Şikayet Türlerine Göre Dağılım
              </h3>
              <div className="flex justify-center w-full h-full">
                <ComplaintPieChart data={typeDistribution} />
              </div>
            </div>

            {/* Alttaki chart */}
            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-start justify-center flex-1">
              <h3 className="text-lg font-semibold mb-4 text-left">
                Çözülme Oranı
              </h3>
              <div className="flex justify-center w-full h-full">
                <ComplaintSolvedRateChart data={complaints} />
              </div>
            </div>
          </div>
        </div>
      )}
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