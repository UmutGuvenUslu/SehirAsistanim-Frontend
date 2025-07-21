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
import { defaults as defaultControls } from "ol/control";

const UserMap = ({ selectedCoordinate, onCoordinateSelect }) => {
  const mapRef = useRef();
  const mapObjRef = useRef(null);
  const vectorSourceRef = useRef(null);
  const [locationError, setLocationError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Çevre Kirliliği");
  const [photos, setPhotos] = useState([]);
  const [coords, setCoords] = useState([null, null]);
  const [address, setAddress] = useState(""); // <-- Yeni state
  const [isUploading, setIsUploading] = useState(false);

  // Harita boyut kontrolü (mobil vs)
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

  // Konum adresini ters-geocode ile alma fonksiyonu
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

  // Harita ve işaretçi kurulum
  useEffect(() => {
    const turkeyCenter = fromLonLat([35.2433, 38.9637]);
    const vectorSource = new VectorSource();
    vectorSourceRef.current = vectorSource;
    const vectorLayer = new VectorLayer({ source: vectorSource });
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vectorLayer,
      ],
      view: new View({
        center: turkeyCenter,
        zoom: 7,
      }),
      controls: defaultControls({ zoom: false }),
    });
    mapObjRef.current = map;

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
            fetchAddress(lon, lat); // Burada adresi çekiyoruz
          }

          setLocationError("");
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setLocationError(
              "Konum izni verilmedi. Lütfen tarayıcı ayarlarından konum izinlerini açınız."
            );
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

  // Marker ekleme ve taşıma
  const addDraggableMarker = (coord) => {
    if (!vectorSourceRef.current || !mapObjRef.current) return;

    vectorSourceRef.current.clear();

    const markerStyle = new Style({
      image: new Icon({
        anchor: [0.5, 1],
        src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        scale: 0.05,
      }),
    });

    const marker = new Feature({
      geometry: new Point(coord),
    });
    marker.setStyle(markerStyle);
    vectorSourceRef.current.addFeature(marker);

    mapObjRef.current.getInteractions().forEach((interaction) => {
      if (interaction instanceof Translate) {
        mapObjRef.current.removeInteraction(interaction);
      }
    });

    const translate = new Translate({
      features: vectorSourceRef.current.getFeaturesCollection(),
    });
    mapObjRef.current.addInteraction(translate);

    translate.on("translateend", (e) => {
      const geom = e.features.item(0).getGeometry();
      const newCoord = toLonLat(geom.getCoordinates());
      onCoordinateSelect?.(newCoord);
      setCoords(newCoord);
      fetchAddress(newCoord[0], newCoord[1]); // İşaretçi hareketinde adres güncelle
    });
  };

  useEffect(() => {
    if (!selectedCoordinate || !mapObjRef.current) return;

    const coord = fromLonLat(selectedCoordinate);
    mapObjRef.current.getView().animate({ center: coord, zoom: 16 });
    addDraggableMarker(coord);
    setCoords(selectedCoordinate);
    fetchAddress(selectedCoordinate[0], selectedCoordinate[1]); // selectedCoordinate değiştiğinde de al
  }, [selectedCoordinate]);

  // Form toggle, fotoğraf değişimi, submit zaten aynı kalabilir...

  const toggleForm = () => {
    setIsFormOpen(!isFormOpen);
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    setPhotos(files);
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
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-full shadow-lg flex items-center justify-center z-30"
        aria-label="Şikayet formunu aç/kapa"
        style={{ display: isFormOpen && isMobile ? "none" : "flex" }}
      >
        <span className="mr-2">Şikayet Oluştur</span>
        <span className="text-xl">{isFormOpen ? "−" : "+"}</span>
      </button>

      <div
        className={`fixed bg-white rounded-xl shadow-2xl z-20 transition-transform duration-300 ease-in-out ${
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
        <div
          className="p-6 overflow-y-auto"
          style={{ flexGrow: 1, minHeight: 0 }}
        >
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
            {/* Başlık, Açıklama, Kategori alanları aynen */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Başlık
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Açıklama
              </label>
              <textarea
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Kategori
              </label>
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

            {/* Burada readonly lon lat inputları kaldırıp adresi gösteriyoruz */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Konum
              </label>
              <input
                type="text"
                value={address || "Konum seçiniz"}
                readOnly
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* Fotoğraf yükleme, yükleme durumu, gönder butonu aynı */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fotoğraf Yükle
              </label>

              <input
                id="file-upload"
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="inline-block cursor-pointer rounded-md bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 select-none"
              >
                Fotoğraf Seç veya Kamera Aç
              </label>

              {photos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPhotos([])}
                  className="ml-2 rounded-md mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm font-semibold"
                  aria-label="Seçilen fotoğrafları temizle"
                >
                  Temizle
                </button>
              )}

              {photos.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {photos.map((file, i) => {
                    const url = URL.createObjectURL(file);
                    return (
                      <img
                        key={i}
                        src={url}
                        alt={`Seçilen fotoğraf ${i + 1}`}
                        className="w-16 h-16 object-cover rounded-md border border-gray-300"
                        onLoad={() => URL.revokeObjectURL(url)}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {isUploading && (
              <div className="flex items-center justify-center space-x-2 text-orange-600 font-semibold mt-2">
                <svg
                  className="animate-spin h-5 w-5 text-orange-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                <span>Yükleniyor...</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isUploading}
              className={`w-full mt-4 py-2 px-4 rounded font-bold text-white ${
                isUploading
                  ? "bg-orange-300 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600"
              }`}
            >
              Gönder
            </button>
          </form>
        </div>
      </div>

      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      />
    </div>
  );
};

export default UserMap;
