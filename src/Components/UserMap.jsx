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
import axios from "axios";

const UserMap = ({ selectedCoordinate, onCoordinateSelect }) => {
  const mapRef = useRef();
  const mapObjRef = useRef(null);
  const vectorSourceRef = useRef(null);           // Şikayet markerları
  const userMarkerSourceRef = useRef(null);       // Kullanıcı markerı
  const [locationError, setLocationError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Çevre Kirliliği");
  const [photos, setPhotos] = useState([]);
  const [coords, setCoords] = useState([null, null]);
  const [address, setAddress] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Popup refs & state
  const popupRef = useRef(null);
  const overlayRef = useRef(null);
  const translateInteractionRef = useRef(null);

  // Popup bilgilerini state’de tutuyoruz (React için)
  const [popupInfo, setPopupInfo] = useState(null);

  // Mobil kontrolü
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

  // Adres alma fonksiyonu (Nominatim ters-geocode)
  const fetchAddress = async (lon, lat) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
      );
      if (!response.ok) throw new Error("Adres alınamadı");
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress("Adres bulunamadı");
      }
    } catch {
      setAddress("Adres alınamadı");
    }
  };

  // Harita ve marker kurulum
  useEffect(() => {
    const turkeyCenter = fromLonLat([35.2433, 38.9637]);

    const complaintSource = new VectorSource(); // Şikayetler
    const userMarkerSource = new VectorSource(); // Kullanıcı markerı

    vectorSourceRef.current = complaintSource;
    userMarkerSourceRef.current = userMarkerSource;

    const complaintLayer = new VectorLayer({ source: complaintSource });
    const userMarkerLayer = new VectorLayer({ source: userMarkerSource });

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        complaintLayer,
        userMarkerLayer,
      ],
      view: new View({ center: turkeyCenter, zoom: 7 }),
      controls: defaultControls({ zoom: false, attribution: false }),
    });

    mapObjRef.current = map;

    // ** Popup Overlay oluşturma ve haritaya ekleme (bir kere) **
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
    popupRef.current = popupDiv;

    const overlay = new Overlay({
      element: popupDiv,
      autoPan: { animation: { duration: 250 } },
      positioning: "bottom-center",
      stopEvent: true,
    });

    overlayRef.current = overlay;
    map.addOverlay(overlay);

    // Harita üzerinde tek tıklama ile popup açma/kapatma
    map.on("singleclick", (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);

      if (feature && feature.get("complaintData")) {
        const coord = feature.getGeometry().getCoordinates();
        overlay.setPosition(coord);

        const data = feature.get("complaintData");
        // Popup içeriğini güncelle
        popupDiv.innerHTML = `
          <h3 style="margin:0 0 8px 0;">${data.baslik || "Başlık Yok"}</h3>
          <p style="margin:0 0 4px 0;">${data.aciklama || "Açıklama Yok"}</p>
          <p style="font-size:12px; color:gray; margin:0;">Kategori: ${data.kategori || "-"}</p>
          <button id="popup-close-btn" style="
            margin-top:8px; 
            padding:4px 8px; 
            background:#f97316; 
            color:white; 
            border:none; 
            border-radius:4px; 
            cursor:pointer;
          ">Kapat</button>
        `;

        // Popup animasyon açma
        setTimeout(() => {
          popupDiv.style.opacity = "1";
          popupDiv.style.transform = "translateY(0)";
        }, 10);

        // Kapatma butonu işlevi
        popupDiv.querySelector("#popup-close-btn").onclick = () => {
          popupDiv.style.opacity = "0";
          popupDiv.style.transform = "translateY(10px)";
          setTimeout(() => {
            overlay.setPosition(undefined);
          }, 300);
        };

        setPopupInfo(data);
      } else {
        // Popup kapat
        popupDiv.style.opacity = "0";
        popupDiv.style.transform = "translateY(10px)";
        setTimeout(() => {
          overlay.setPosition(undefined);
        }, 300);
        setPopupInfo(null);
      }
    });

    // Kullanıcının konumu
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lon = position.coords.longitude;
          const lat = position.coords.latitude;
          const userCoord = fromLonLat([lon, lat]);

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

    return () => map.setTarget(null);
  }, []);

  // Kullanıcı markerı ekleme ve taşıma etkileşimi
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

    // Önceki translate etkileşimini kaldır
    if (translateInteractionRef.current) {
      mapObjRef.current.removeInteraction(translateInteractionRef.current);
      translateInteractionRef.current = null;
    }

    // Yalnızca userMarkerSource'daki feature'ları taşınabilir yap
    const translate = new Translate({
      features: userMarkerSourceRef.current.getFeaturesCollection(),
      filter: function(feature, layer) {
        return userMarkerSourceRef.current.getFeatures().includes(feature);
      }
    });

    mapObjRef.current.addInteraction(translate);
    translateInteractionRef.current = translate;

    translate.on("translateend", (e) => {
      const geom = e.features.item(0).getGeometry();
      const newCoord = toLonLat(geom.getCoordinates());
      onCoordinateSelect?.(newCoord);
      setCoords(newCoord);
      fetchAddress(newCoord[0], newCoord[1]);
    });
  };

  // selectedCoordinate değişince marker ekle
  useEffect(() => {
    if (!selectedCoordinate || !mapObjRef.current) return;

    const coord = fromLonLat(selectedCoordinate);
    mapObjRef.current.getView().animate({ center: coord, zoom: 16 });
    addDraggableMarker(coord);
    setCoords(selectedCoordinate);
    fetchAddress(selectedCoordinate[0], selectedCoordinate[1]);
  }, [selectedCoordinate]);

  // Şikayetleri backend’den çekip marker olarak ekleme
  useEffect(() => {
    if (!vectorSourceRef.current) return;

    const token = localStorage.getItem("token");

    axios
      .get("https://sehirasistanim-backend-production.up.railway.app/Sikayet/GetAll", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data;
        vectorSourceRef.current.clear();

        data.forEach((item) => {
          if (!item.latitude || !item.longitude) return;

          const coord = fromLonLat([item.longitude, item.latitude]);

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
      })
      .catch((error) => {
        console.error("Şikayetler yüklenemedi:", error);
        if (error.response?.status === 401) {
          setLocationError("Yetkisiz erişim. Lütfen giriş yapınız.");
        }
      });
  }, []);

  const toggleForm = () => {
    setIsFormOpen(!isFormOpen);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsUploading(true);

    setTimeout(() => {
      setIsUploading(false);
      alert("Şikayet gönderildi! (Demo)");
      setTitle("");
      setDescription("");
      setCategory("Çevre Kirliliği");
      setPhotos([]);
      setIsFormOpen(false);
      setAddress("");
      setCoords([null, null]);
    }, 2000);
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
          isMobile
            ? "bottom-0 left-0 right-0 h-1/2"
            : "right-6 bottom-16 w-[380px] max-h-[70vh]"
        }`}
        style={{
          transform: isMobile
            ? isFormOpen
              ? "translateY(0)"
              : "translateY(100%)"
            : isFormOpen
            ? "translateY(0)"
            : "translateY(100%)",
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
              ✕
            </button>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Başlık</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Açıklama</label>
              <textarea
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                required
              >
                <option>Çevre Kirliliği</option>
                <option>Altyapı</option>
                <option>Ulaşım</option>
                <option>Diğer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Konum</label>
              <input
                type="text"
                value={address || "Konum seçiniz"}
                readOnly
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fotoğraf Yükle
              </label>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                multiple
                capture={isMobile ? undefined : "environment"}
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  setPhotos(files);
                }}
                className="hidden"
              />
              <div className="flex flex-row items-center justify-center">
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center cursor-pointer rounded-md bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 select-none"
                >
                  Fotoğraf Seç veya Kamera Aç
                </label>

                {photos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPhotos([])}
                    aria-label="Seçilen fotoğrafları temizle"
                    className="ml-2  inline-flex items-center justify-center rounded-md bg-red-500 hover:bg-red-600 text-white p-2"
                    style={{ height: "40px" }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7L5 7M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M10 11v6M14 11v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="mt-4 w-full rounded-md bg-orange-500 py-3 text-white font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {isUploading ? "Gönderiliyor..." : "Şikayeti Gönder"}
            </button>
          </form>
        </div>
      </div>

      <div
        ref={mapRef}
        id="map"
        style={{ width: "100%", height: mapHeight, transition: "height 0.3s ease" }}
      />
    </div>
  );
};

export default UserMap;
