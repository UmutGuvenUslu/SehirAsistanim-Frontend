import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import { fromLonLat, toLonLat } from "ol/proj";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { Feature } from "ol";
import Point from "ol/geom/Point";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { Icon, Style } from "ol/style";
import Translate from "ol/interaction/Translate";
import Overlay from "ol/Overlay";
import { defaults as defaultControls } from "ol/control";
import { toast } from "react-toastify";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { getDistance } from "geolib";

const supabaseUrl = "https://czpofsdqzrqrhfhalfbw.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6cG9mc2RxenJxcmhmaGFsZmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4Mzc2MjEsImV4cCI6MjA2ODQxMzYyMX0.PQNmMJZKhYF2NR1Zk1ILhxbHHw7B85jtC65ekFcjxEc";
const supabase = createClient(supabaseUrl, supabaseKey);

const UserMap = ({ selectedCoordinate, onCoordinateSelect }) => {
  const mapRef = useRef();
  const fileInputRef = useRef(null);
  const mapObjRef = useRef(null);
  const vectorSourceRef = useRef(null);
  const userMarkerSourceRef = useRef(null);
  const [locationError, setLocationError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userLocation, setUserLocation] = useState(null); // Kullanıcının orijinal konumu
  const [currentComplaints, setCurrentComplaints] = useState([]); // Mevcut şikayetler

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [photos, setPhotos] = useState([]);
  const [coords, setCoords] = useState([null, null]);
  const [address, setAddress] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [Kategori, setKategori] = useState([]);
  const popupRef = useRef(null);
  const overlayRef = useRef(null);
  const translateInteractionRef = useRef(null);
  const [popupInfo, setPopupInfo] = useState(null);

  // Mesafe limitleri
    const LIMIT_RADIUS = 25000 ; // metre
  const PROXIMITY_RADIUS = 20; // metre

  useEffect(() => {
    axios
      .get("https://sehirasistanim-backend-production.up.railway.app/SikayetTuru/GetAll")
      .then((res) => {setKategori(res.data); setCategory(res.data[0].id) })
      .catch((err) => console.error("Kategori verisi alınamadı:", err));
  }, []);

  const getUserIdFromToken = (token) => {
    try {
      if (!token) return null;
      const parts = token.split(".");
      if (parts.length !== 3) return null;
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
        data.sub ||
        data.userId ||
        data.id ||
        data.nameidentifier ||
        data["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
        null
      );
    } catch (error) {
      console.error("Token çözümleme hatası:", error);
      return null;
    }
  };

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  const fetchAddress = async (lon, lat) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
      );
      if (!response.ok) throw new Error("Adres alınamadı");
      const data = await response.json();
      setAddress(data?.display_name || "Adres bulunamadı");
    } catch {
      setAddress("Adres alınamadı");
    }
  };

  const loadComplaints = () => {
    const token = localStorage.getItem("token");

    if (!vectorSourceRef.current) return;

    axios
      .get("https://sehirasistanim-backend-production.up.railway.app/Sikayet/GetAll", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data;
        vectorSourceRef.current.clear();
        const complaintsData = [];

        data.forEach((item) => {
          if (!item.latitude || !item.longitude) return;

          const coord = fromLonLat([item.longitude, item.latitude]);

          // Şikayet verilerini sakla
          complaintsData.push({
            id: item.id,
            type: item.sikayetTuruAdi,
            lat: item.latitude,
            lon: item.longitude,
          });

          const feature = new Feature({
            geometry: new Point(coord),
            complaintData: item,
          });

          feature.setStyle(
            new Style({
              image: new Icon({
                anchor: [0.5, 1],
                src: "https://cdn-icons-png.flaticon.com/512/502/502007.png",
                scale: 0.05,
              }),
            })
          );

          vectorSourceRef.current.addFeature(feature);
        });

        setCurrentComplaints(complaintsData);
      })
      .catch((error) => {
        console.error("Şikayetler yüklenemedi:", error);
        if (error.response?.status === 401) {
          setLocationError("Yetkisiz erişim. Lütfen giriş yapınız.");
        }
      });
  };

  useEffect(() => {
    const turkeyCenter = fromLonLat([35.2433, 38.9637]);

    const complaintSource = new VectorSource();
    const userMarkerSource = new VectorSource();

    vectorSourceRef.current = complaintSource;
    userMarkerSourceRef.current = userMarkerSource;

    const complaintLayer = new VectorLayer({ source: complaintSource });
    const userMarkerLayer = new VectorLayer({ source: userMarkerSource });

    const map = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() }), complaintLayer, userMarkerLayer],
      view: new View({ center: turkeyCenter, zoom: 7 }),
      controls: defaultControls({ zoom: false, attribution: false }),
    });

    mapObjRef.current = map;

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

    overlayRef.current = overlay;
    map.addOverlay(overlay);

    map.on("singleclick", (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);

      if (feature && feature.get("complaintData")) {
        const coord = feature.getGeometry().getCoordinates();
        overlay.setPosition(coord);

        const data = feature.get("complaintData");
        popupDiv.innerHTML = `
          <button 
            id="popup-close-btn" 
            style="
              position: absolute;
              right: 4px;
              background: #ef4444;
              border: none;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              font-size: 16px;
              font-weight: bold;
              color: #fff;
              cursor: pointer;
              display: flex;
              padding-bottom: 5px;
              align-items: center;
              justify-content: center;
              box-shadow: 0 1px 4px rgba(0,0,0,0.2);
              transition: background 0.2s ease;
            "
            onmouseover="this.style.background='#dc2626'"
            onmouseout="this.style.background='#ef4444'"
          >×</button>

          <img 
            src="${data.fotoUrl || 'https://via.placeholder.com/220x120?text=Görsel+Yok'}" 
            alt="Şikayet Görseli" 
            style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;"
          />

          <h3 style="margin: 0 0 6px 0; font-weight: bold; font-size: 14px; color: #111;">
            ${data.baslik || "Başlık Yok"}
          </h3>

          <p style="margin: 0 0 6px 0; font-size: 12px; color: #444;">
            ${data.aciklama || "Açıklama Yok"}
          </p>

          <p style="margin: 0 0 4px 0; font-size: 12px; color: #000;">
            <strong>Durum:</strong> ${data.durum || "-"}
          </p>

          <p style="margin: 0 0 8px 0; font-size: 12px; color: #000;">
            <strong>Şikayet Türü:</strong> ${data.sikayetTuruAdi || "-"}
          </p>

          <div style="display: flex; justify-content: center; gap: 12px;">
            <button 
              id="btn-like" 
              title="Sorun Çözüldü"
              style="
                width: 36px; height: 36px;
                border-radius: 50%;
                border: 1.5px solid #16a34a;
                background-color: #ecfdf5;
                color: #16a34a;
                font-size: 18px;
                cursor: pointer;
                transition: all 0.2s ease;
              "
              onmouseover="this.style.backgroundColor='#d1fae5'; this.style.boxShadow='0 0 6px #16a34a33'"
              onmouseout="this.style.backgroundColor='#ecfdf5'; this.style.boxShadow='none'"
            >👍</button>

            <button 
              id="btn-dislike" 
              title="Sorun Devam Ediyor"
              style="
                width: 36px; height: 36px;
                border-radius: 50%;
                border: 1.5px solid #dc2626;
                background-color: #fef2f2;
                color: #dc2626;
                font-size: 18px;
                cursor: pointer;
                transition: all 0.2s ease;
              "
              onmouseover="this.style.backgroundColor='#fee2e2'; this.style.boxShadow='0 0 6px #dc262633'"
              onmouseout="this.style.backgroundColor='#fef2f2'; this.style.boxShadow='none'"
            >👎</button>
          </div>
        `;

        setTimeout(() => {
          popupDiv.style.opacity = "1";
          popupDiv.style.transform = "translateY(0)";
        }, 10);

        popupDiv.querySelector("#popup-close-btn").onclick = () => {
          popupDiv.style.opacity = "0";
          popupDiv.style.transform = "translateY(10px)";
          setTimeout(() => {
            overlay.setPosition(undefined);
          }, 300);
        };

        setPopupInfo(data);
      } else {
        popupDiv.style.opacity = "0";
        popupDiv.style.transform = "translateY(10px)";
        setTimeout(() => {
          overlay.setPosition(undefined);
        }, 300);
        setPopupInfo(null);
      }
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lon = position.coords.longitude;
          const lat = position.coords.latitude;
          const userCoord = fromLonLat([lon, lat]);

          // Kullanıcının orijinal konumunu sakla
          setUserLocation([lon, lat]);

          if (!selectedCoordinate) {
            addDraggableMarker(userCoord);
            map.getView().animate({ center: userCoord, zoom: 14 });
            onCoordinateSelect?.([lon, lat]);
            setCoords([lon, lat]);
            fetchAddress(lon, lat);
          }

          setLocationError("");
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setLocationError("Konum izni verilmedi. Tarayıcı ayarlarını kontrol edin.");
          } else {
            setLocationError("Konum alınamadı, lütfen tekrar deneyiniz.");
          }
        }
      );
    } else {
      setLocationError("Tarayıcınız konum servislerini desteklemiyor.");
    }

    loadComplaints();

    return () => map.setTarget(null);
  }, []);

  const addDraggableMarker = (coord) => {
    if (!userMarkerSourceRef.current || !mapObjRef.current) return;

    userMarkerSourceRef.current.clear();

    const marker = new Feature({ geometry: new Point(coord) });

    marker.setStyle(
      new Style({
        image: new Icon({
          anchor: [0.5, 1],
          src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
          scale: 0.05,
        }),
      })
    );

    userMarkerSourceRef.current.addFeature(marker);

    if (translateInteractionRef.current) {
      mapObjRef.current.removeInteraction(translateInteractionRef.current);
      translateInteractionRef.current = null;
    }

    const translate = new Translate({
      features: userMarkerSourceRef.current.getFeaturesCollection(),
      filter: (feature) => userMarkerSourceRef.current.getFeatures().includes(feature),
    });

    mapObjRef.current.addInteraction(translate);
    translateInteractionRef.current = translate;

    translate.on("translateend", (e) => {
      const geom = e.features.item(0).getGeometry();
      const newCoord = toLonLat(geom.getCoordinates());
      
      // Mesafe kontrolü
      if (userLocation) {
        const distance = getDistance(
          { latitude: userLocation[1], longitude: userLocation[0] },
          { latitude: newCoord[1], longitude: newCoord[0] }
        );

        if (distance > LIMIT_RADIUS) {
          toast.warning(`Konumunuzdan ${LIMIT_RADIUS} metre dışına çıkamazsınız.`);
          // Marker'ı orijinal konumuna geri al
          geom.setCoordinates(fromLonLat(userLocation));
          onCoordinateSelect?.(userLocation);
          setCoords(userLocation);
          fetchAddress(userLocation[0], userLocation[1]);
          return;
        }
      }

      onCoordinateSelect?.(newCoord);
      setCoords(newCoord);
      fetchAddress(newCoord[0], newCoord[1]);
    });
  };

  useEffect(() => {
    if (!selectedCoordinate || !mapObjRef.current) return;

    const coord = fromLonLat(selectedCoordinate);
    mapObjRef.current.getView().animate({ center: coord, zoom: 16 });
    addDraggableMarker(coord);
    setCoords(selectedCoordinate);
    fetchAddress(selectedCoordinate[0], selectedCoordinate[1]);
  }, [selectedCoordinate]);

  const toggleForm = () => {
    setIsFormOpen(!isFormOpen);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (photos.length === 0) {
      toast.error("Lütfen en az bir fotoğraf seçin.");
      return;
    }
    if (!title || !description || !category || !coords[0] || !coords[1]) {
      toast.error("Lütfen tüm alanları doldurun.");
      return;
    }

    // Yakınlık kontrolü
    const selectedCategory = Kategori.find(k => k.id === parseInt(category));
    if (selectedCategory && currentComplaints.length > 0) {
      const isNearExisting = currentComplaints.some((c) => {
        const d = getDistance(
          { latitude: c.lat, longitude: c.lon },
          { latitude: coords[1], longitude: coords[0] }
        );
        return d <= PROXIMITY_RADIUS && c.type === selectedCategory.ad;
      });

      if (isNearExisting) {
        toast.error(`Bu bölgede aynı türde bir şikayet zaten mevcut (${PROXIMITY_RADIUS} metre içinde).`);
        return;
      }
    }

    setIsUploading(true);

    try {
      const file = photos[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `complaints/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("sehirasistanimdata")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("sehirasistanimdata")
        .getPublicUrl(fileName);

      const token = localStorage.getItem("token");
      const kullaniciid = getUserIdFromToken(token);

      if (!kullaniciid) {
        throw new Error("Kullanıcı ID çözülemedi.");
      }

      const body = {
        KullaniciId: kullaniciid,
        Baslik: title,
        Aciklama: description,
        SikayetTuruId: parseInt(category),
        Latitude: coords[1],
        Longitude: coords[0],
        FotoUrl: publicUrl,
        GonderilmeTarihi: new Date().toISOString(),
        CozulmeTarihi: null,
        Durum: 0,
        DogrulanmaSayisi: 0,
        Silindimi: false,
        CozenBirimId: null,
      };

      await axios.post(
        "https://sehirasistanim-backend-production.up.railway.app/Sikayet/Add",
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Şikayetiniz başarıyla gönderildi! 🎉");

      setTitle("");
      setDescription("");
      setCategory("1");
      setPhotos([]);
      setIsFormOpen(false);
      setAddress("");
      setCoords([null, null]);

      loadComplaints();
    } catch (error) {
      if (error.response) {
        console.error("Backend hatası:", error.response.status, error.response.data);
        toast.error(`Şikayet gönderilirken backend hatası: ${error.response.status}`);
      } else if (error.request) {
        console.error("İstek yapıldı, yanıt alınamadı:", error.request);
        toast.error("Sunucudan yanıt alınamadı.");
      } else {
        console.error("İstek ayarlarında hata:", error.message);
        toast.error(`Lütfen giriş yapınız!`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const mapHeight = isMobile ? (isFormOpen ? "50vh" : "100vh") : "100vh";

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      {locationError && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(255, 69, 58, 0.9)",
            color: "white",
            padding: "10px 20px",
            borderRadius: 5,
            zIndex: 1000,
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          {locationError}
        </div>
      )}

      <button
        onClick={toggleForm}
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg flex items-center justify-center z-30 transition-colors duration-300"
        aria-label="Şikayet formunu aç/kapa"
        style={{ display: isFormOpen && isMobile ? "none" : "flex" }}
      >
        <span className="mr-2">Şikayet Oluştur</span>
        <span className="text-xl">{isFormOpen ? "−" : "+"}</span>
      </button>

      <div
        className={`fixed bg-white rounded-xl shadow-2xl z-20 transition-all duration-300 ease-in-out ${
          isMobile ? "bottom-0 left-0 right-0 h-1/2" : "right-6 bottom-16 w-[380px] max-h-[70vh]"
        }`}
        style={{
          transform: isFormOpen ? "translateY(0)" : "translateY(100%)",
          opacity: isFormOpen ? 1 : 0,
          pointerEvents: isFormOpen ? "auto" : "none",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="p-6 overflow-y-auto" style={{ flexGrow: 1, minHeight: 0 }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Şikayet Formu</h2>
            <button
              onClick={toggleForm}
              className="text-gray-500 hover:text-gray-700 text-lg"
              aria-label="Formu kapat"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="font-semibold">Başlık</span>
              <input
                type="text"
                className="w-full mt-1 p-2 border rounded"
                placeholder="Başlık giriniz"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="font-semibold">Açıklama</span>
              <textarea
                className="w-full mt-1 p-2 border rounded resize-none"
                placeholder="Açıklama giriniz"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
              />
            </label>

            <label className="block">
              <span className="font-semibold">Kategori</span>
              <select
                value={category}
                onChange={(e) => {setCategory(e.target.value); }}
                className="w-full mt-1 p-2 border rounded"
                required
              >
                {Kategori.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.ad}  
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="font-semibold mb-1 block">Fotoğraf</span>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setPhotos(Array.from(e.target.files))}
                accept="image/*"
                multiple
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                Fotoğraf Seç veya Kamera Aç
              </button>
              {photos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 max-h-32 overflow-auto">
                  {photos.map((file, idx) => {
                    const url = URL.createObjectURL(file);
                    return (
                      <div
                        key={idx}
                        className="relative w-20 h-20 rounded-md overflow-hidden border border-gray-300"
                      >
                        <img
                          src={url}
                          alt={`Seçilen fotoğraf ${idx + 1}`}
                          className="object-cover w-full h-full"
                          onLoad={() => URL.revokeObjectURL(url)}
                        />
                        <button
                          type="button"
                          aria-label="Fotoğrafı sil"
                          className="absolute top-0 right-0 bg-red-600 text-white rounded-bl px-1 hover:bg-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setPhotos((prev) => prev.filter((_, i) => i !== idx));
                          }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </label>

            <label className="block">
              <span className="font-semibold">Seçilen Adres</span>
              <input
                type="text"
                className="w-full mt-1 p-2 border rounded bg-gray-100"
                value={address}
                readOnly
                placeholder="Adres yok"
              />
            </label>

            <button
              type="submit"
              disabled={isUploading}
              className={`w-full py-3 rounded text-white font-semibold ${
                isUploading ? "bg-gray-400 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600"
              }`}
            >
              {isUploading ? "Gönderiliyor..." : "Şikayet Gönder"}
            </button>
          </form>
        </div>
      </div>

      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: mapHeight,
          transition: "height 0.3s ease",
          userSelect: "none",
        }}
        aria-label="Şikayet haritası"
        role="application"
      />
    </div>
  );
};

export default UserMap;