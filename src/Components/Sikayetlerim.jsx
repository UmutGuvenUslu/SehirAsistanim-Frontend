import React, { useEffect, useRef, useState, useContext } from "react";
import { Map, View, Overlay } from "ol";
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
import { toast } from "react-toastify";
import { AuthContext } from "../Context/AuthContext";
import { Filter, X } from "lucide-react";

export default function Sikayetlerim() {
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const overlayRef = useRef(null);
  const [mapObj, setMapObj] = useState(null);
  const [vectorSource, setVectorSource] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [Kategori, setKategori] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showTable, setShowTable] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { token } = useContext(AuthContext);

  function parseJwt(token) {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  }
  const userId = token ? parseJwt(token).sub : null;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    axios
      .get("https://sehirasistanim-backend-production.up.railway.app/SikayetTuru/GetAll")
      .then((res) => setKategori(res.data))
      .catch(() => console.error("Kategori alınamadı"));
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const vs = new VectorSource();
    const vl = new VectorLayer({ source: vs });

    const map = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM({ attributions: [] }) }), vl],
      view: new View({ center: fromLonLat([35, 39]), zoom: 6 }),
      controls: [],
    });

    setMapObj(map);
    setVectorSource(vs);

    const popupDiv = document.createElement("div");
    popupDiv.className = "ol-popup";
    popupDiv.style.position = "absolute";
    popupDiv.style.backgroundColor = "white";
    popupDiv.style.padding = "10px";
    popupDiv.style.borderRadius = "8px";
    popupDiv.style.minWidth = "200px";
    popupDiv.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
    popupDiv.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    popupDiv.style.opacity = "0";
    popupDiv.style.transform = "translateY(10px)";
    popupDiv.style.textAlign = "center";
    popupRef.current = popupDiv;

    const overlay = new Overlay({
      element: popupDiv,
      autoPan: { animation: { duration: 250 } },
      positioning: "bottom-center",
      stopEvent: true,
    });
    map.addOverlay(overlay);
    overlayRef.current = overlay;

    return () => map.setTarget(undefined);
  }, []);

  useEffect(() => {
    if (!mapObj || !overlayRef.current || !popupRef.current) return;

    const popupDiv = popupRef.current;

    const clickHandler = (evt) => {
      const feature = mapObj.forEachFeatureAtPixel(evt.pixel, (f) => f, { hitTolerance: 10 });
      if (!feature) {
        popupDiv.style.opacity = "0";
        overlayRef.current.setPosition(undefined);
        return;
      }
      const data = feature.get("data");
      openPopupAtComplaint(data);
    };

    mapObj.on("singleclick", clickHandler);
    return () => mapObj.un("singleclick", clickHandler);
  }, [mapObj, complaints]);

  const loadComplaints = () => {
    const token = localStorage.getItem("token");
    if (!vectorSource || !Kategori.length) return;

    axios
      .get("https://sehirasistanim-backend-production.up.railway.app/Sikayet/GetAllByUser", {
        params: { userId },
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data || [];
        vectorSource.clear();
        const complaintsData = [];

        data.forEach((item) => {
          if (!item.latitude || !item.longitude) return;

          const coord = fromLonLat([item.longitude, item.latitude]);
          complaintsData.push(item);

          const category = Kategori.find((k) => k.id === item.sikayetTuruId);
          const iconUrl = category?.icon || "https://via.placeholder.com/40";

          const feature = new Feature({
            geometry: new Point(coord),
            data: item,
          });
          feature.setStyle(
            new Style({
              image: new Icon({
                anchor: [0.5, 1],
                src: iconUrl,
                scale: 0.05,
              }),
            })
          );
          vectorSource.addFeature(feature);
        });

        setComplaints(complaintsData);
        setFilteredComplaints(complaintsData);
      })
      .catch(() => toast.error("Şikayetler yüklenemedi"));
  };

  useEffect(() => {
    if (userId && vectorSource && Kategori.length) {
      loadComplaints();
    }
  }, [userId, vectorSource, Kategori]);

  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredComplaints(complaints);
      vectorSource?.getFeatures().forEach((f) => {
        const data = f.get("data");
        const category = Kategori.find((k) => k.id === data.sikayetTuruId);
        const iconUrl = category?.icon || "https://via.placeholder.com/40";
        f.setStyle(
          new Style({
            image: new Icon({
              anchor: [0.5, 1],
              src: iconUrl,
              scale: 0.05,
            }),
          })
        );
      });
    } else {
      const filtered = complaints.filter((c) => c.sikayetTuruId === parseInt(selectedCategory));
      setFilteredComplaints(filtered);
      vectorSource?.getFeatures().forEach((f) => {
        const data = f.get("data");
        if (data.sikayetTuruId === parseInt(selectedCategory)) {
          const category = Kategori.find((k) => k.id === data.sikayetTuruId);
          const iconUrl = category?.icon || "https://via.placeholder.com/40";
          f.setStyle(
            new Style({
              image: new Icon({
                anchor: [0.5, 1],
                src: iconUrl,
                scale: 0.05,
              }),
            })
          );
        } else {
          f.setStyle(new Style());
        }
      });
    }
  }, [selectedCategory, complaints]);

  const openPopupAtComplaint = (data) => {
    if (!mapObj || !popupRef.current || !overlayRef.current) return;
    const coord = fromLonLat([data.longitude, data.latitude]);
    overlayRef.current.setPosition(coord);

    const popupDiv = popupRef.current;
    popupDiv.innerHTML = `
      <div style="position: relative; font-family: 'Segoe UI', sans-serif; max-width: 240px;">
        <button id="popup-close-btn"
          style="position: absolute; top: 6px; right: 6px; background: #ef4444; border: none; width: 26px; height: 26px;
                 border-radius: 50%; font-size: 18px; font-weight: bold; color: #fff; cursor: pointer;
                 display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.2);">×</button>
        <img src="${data.fotoUrl || 'https://via.placeholder.com/240x130?text=Görsel+Yok'}"
             style="width:100%;height:130px;object-fit:cover;border-radius:8px;margin-bottom:10px;"/>
        <h3 style="margin:0 0 6px;font-weight:600;font-size:15px;color:#111;">${data.baslik}</h3>
        <p style="margin:0 0 6px;font-size:13px;color:#444;">${data.aciklama}</p>
        <p style="margin:0 0 4px;font-size:12px;color:#222;"><strong>Durum:</strong> ${data.durum}</p>
        <p style="margin:0 0 10px;font-size:12px;color:#222;"><strong>Şikayet Türü:</strong> ${data.sikayetTuruAdi}</p>
        <p style="font-size:13px;font-weight:500;color:#22c55e;text-align:center;
                  background:#f0fdf4;padding:6px 12px;border-radius:20px;
                  border:1px solid #bbf7d0;box-shadow:inset 0 0 2px #bbf7d0;">
          Doğrulanma: ${data.dogrulanmaSayisi || 0}
        </p>
      </div>`;
    setTimeout(() => {
      popupDiv.style.opacity = "1";
      popupDiv.style.transform = "translateY(0)";
    }, 10);
    popupDiv.querySelector("#popup-close-btn").onclick = () => {
      popupDiv.style.opacity = "0";
      popupDiv.style.transform = "translateY(10px)";
      setTimeout(() => overlayRef.current.setPosition(undefined), 300);
    };
    mapObj.getView().animate({ center: coord, zoom: 12, duration: 600 });
  };

  const columns = [
    {
      name: "",
      selector: (row) => row.fotoUrl,
      cell: (row) => (
        <img
          src={row.fotoUrl || "https://via.placeholder.com/60"}
          alt="Şikayet"
          className="w-14 h-14 object-cover rounded-lg border"
        />
      ),
      width: "90px",
    },
    { name: "Başlık", selector: (row) => row.baslik, grow: 3, sortable: true },
    {
      name: "Durum",
      selector: (row) => row.durum,
      cell: (row) => (
        <span
          className={`font-semibold ${
            row.durum === "Çözüldü"
              ? "text-green-600"
              : row.durum === "Çözülemedi"
              ? "text-red-500"
              : "text-blue-500"
          }`}
        >
          {row.durum}
        </span>
      ),
      width: "140px",
    },
  ];

  return (
    <div className="relative w-full h-screen">
      <div ref={mapRef} className="w-full h-full" />

      {/* Filtre Butonu */}
      <div className="fixed bottom-4 left-6 z-40">
        <div
          onClick={() => {
            setShowFilter((prev) => !prev);
            if (!showFilter) setShowTable(false);
          }}
          className="bg-white p-3 rounded-full shadow-md cursor-pointer flex items-center justify-center hover:bg-orange-100 transition"
        >
          <Filter size={22} className="text-orange-500" />
        </div>
      </div>

      {/* Filtre Küçük Panel (Mobil ve Masaüstü) */}
      {showFilter && (
        <div className="fixed bottom-20 left-6 z-50 bg-white p-4 rounded shadow-md w-[220px]">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-sm">Kategori Filtrele</span>
            <button
              onClick={() => setShowFilter(false)}
              className="text-gray-500 hover:text-red-500"
            >
              <X size={18} />
            </button>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 w-full border rounded shadow-md bg-white"
          >
            <option value="all">Tümü</option>
            {Kategori.map((k) => (
              <option key={k.id} value={k.id}>
                {k.ad}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Şikayetlerim Butonu */}
      <div
        onClick={() => {
          setShowTable((prev) => !prev);
          if (!showTable) setShowFilter(false);
        }}
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 
                   bg-orange-500 hover:bg-orange-600 text-white 
                   font-semibold py-3 px-6 rounded-full shadow-lg 
                   flex items-center justify-center z-30 
                   transition-colors duration-300 cursor-pointer"
        style={{ minWidth: "180px" }}
      >
        <span className="mr-2">Şikayetlerim</span>
        <span className="text-xl">{showTable ? "−" : "+"}</span>
      </div>

      {/* Şikayetlerim Paneli (Mobilde Alt Panel) */}
      {isMobile ? (
        <div
          className={`fixed bg-white rounded-t-xl shadow-2xl z-50 transition-all duration-300 ease-in-out
          bottom-0 left-0 right-0 h-1/2 flex flex-col ${
            showTable ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex justify-between items-center p-3 border-b">
            <h2 className="font-semibold text-lg">Şikayetlerim</h2>
            <button
              onClick={() => setShowTable(false)}
              className="text-gray-500 hover:text-red-500"
            >
              <X size={22} />
            </button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto">
            <DataTable
              columns={columns}
              data={filteredComplaints}
              pagination
              highlightOnHover
              striped
              dense
              onRowClicked={(row) => {
                openPopupAtComplaint(row);
                setShowTable(false);
              }}
            />
          </div>
        </div>
      ) : (
        <div
          className={`fixed bottom-20 left-1/2 -translate-x-1/2 
                      w-[700px] bg-white rounded-2xl shadow-lg p-4 
                      max-h-[400px] overflow-y-auto transition-all duration-300 ${
            showTable ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          }`}
          style={{ zIndex: 40 }}
        >
          <DataTable
            columns={columns}
            data={filteredComplaints}
            pagination
            highlightOnHover
            striped
            dense
            onRowClicked={(row) => {
              openPopupAtComplaint(row);
              setShowTable(false);
            }}
          />
        </div>
      )}

      <div ref={popupRef} />
    </div>
  );
}
