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
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { getDistance } from "geolib";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const supabaseUrl = "https://czpofsdqzrqrhfhalfbw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6cG9mc2RxenJxcmhmaGFsZmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4Mzc2MjEsImV4cCI6MjA2ODQxMzYyMX0.PQNmMJZKhYF2NR1Zk1ILhxbHHw7B85jtC65ekFcjxEc";
const supabase = createClient(supabaseUrl, supabaseKey);

// Zod validation schema
const complaintSchema = z.object({
  title: z.string()
    .min(5, "Başlık en az 5 karakter olmalı")
    .max(75, "Başlık en fazla 75 karakter olabilir"),
  description: z.string()
    .min(10, "Açıklama en az 10 karakter olmalı")
    .max(350, "Açıklama en fazla 350 karakter olabilir"),
  category: z.union([z.string(), z.number()])
    .refine(val => val !== "", "Kategori seçmelisiniz"),
  photos: z.array(z.any())
    .length(1, "Tam olarak 1 fotoğraf eklemelisiniz"),
  address: z.string().min(1, "Konum seçmelisiniz"),
  coords: z.tuple([z.number(), z.number()])
    .refine(val => val[0] !== null && val[1] !== null, "Geçerli bir konum seçin")
});

const UserMap = ({ selectedCoordinate, onCoordinateSelect }) => {
  const mapRef = useRef();
  const fileInputRef = useRef(null);
  const mapObjRef = useRef(null);
  const vectorSourceRef = useRef(null);
  const userMarkerSourceRef = useRef(null);
  const [locationError, setLocationError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [currentComplaints, setCurrentComplaints] = useState([]);
  const [Kategori, setKategori] = useState([]);
  const popupRef = useRef(null);
  const overlayRef = useRef(null);
  const translateInteractionRef = useRef(null);
  const [popupInfo, setPopupInfo] = useState(null);

  const LIMIT_RADIUS = 25000;
  const PROXIMITY_RADIUS = 20;

  // React Hook Form + Zod integration
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      photos: [],
      address: "",
      coords: [null, null]
    }
  });

  // Watch form values
  const { title, description, category, photos, address, coords } = watch();

  useEffect(() => {
    axios
      .get("https://sehirasistanim-backend-production.up.railway.app/SikayetTuru/GetAll")
      .then((res) => {
        setKategori(res.data);
        setValue("category", res.data[0]?.id || "");
      })
      .catch((err) => console.error("Kategori verisi alınamadı:", err));
  }, [setValue]);

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

  useEffect(() => {
    if (Kategori.length > 0) {
      loadComplaints();
    }
  }, [Kategori]);

  const fetchAddress = async (lon, lat) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
      );
      if (!response.ok) throw new Error("Adres alınamadı");
      const data = await response.json();
      setValue("address", data?.display_name || "Adres bulunamadı");
    } catch {
      setValue("address", "Adres alınamadı");
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

          complaintsData.push({
            id: item.id,
            type: item.sikayetTuruAdi,
            lat: item.latitude,
            lon: item.longitude,
            turid: item.sikayetTuruId,
            dogrulanmaSayisi: item.dogrulanmaSayisi
          });

          const feature = new Feature({
            geometry: new Point(coord),
            complaintData: item,
          });

          const category = Kategori.find(k => k.id === item.sikayetTuruId);
          const iconUrl = category?.icon;

          feature.setStyle(
            new Style({
              image: new Icon({
                anchor: [0.5, 1],
                src: iconUrl,
                scale: 0.058,
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

  const handleIncrementDogrulama = async (data) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Lütfen giriş yapınız!");
      return;
    }

    const currentUserId = getUserIdFromToken(token);

    if (data.kullaniciId && currentUserId && data.kullaniciId.toString() === currentUserId.toString()) {
      toast.warning("Kendi şikayetinize oy veremezsiniz!");
      return;
    }

    try {
      const response = await axios.put(
        `https://sehirasistanim-backend-production.up.railway.app/SikayetDogrulama/IncrementDogrulama?sikayetId=${data.id}&kullanciId=${getUserIdFromToken(token)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data) {
        toast.success(`"${data.baslik}" için oy verildi!`);

        setCurrentComplaints(prevComplaints =>
          prevComplaints.map(complaint =>
            complaint.id === data.id
              ? { ...complaint, dogrulanmaSayisi: data.dogrulanmaSayisi + 1 }
              : complaint
          )
        );

        const features = vectorSourceRef.current.getFeatures();
        const featureToUpdate = features.find(f => f.get('complaintData').id === data.id);

        if (featureToUpdate) {
          const updatedData = {
            ...featureToUpdate.get('complaintData'),
            dogrulanmaSayisi: data.dogrulanmaSayisi + 1
          };
          featureToUpdate.set('complaintData', updatedData);

          if (popupRef.current && overlayRef.current) {
            popupRef.current.style.opacity = "0";
            popupRef.current.style.transform = "translateY(10px)";
            setTimeout(() => {
              overlayRef.current.setPosition(undefined);
              setPopupInfo(null);
            }, 300);
          }
        }
      } else {
        toast.warning(`"${data.baslik}" için zaten oy vermişsiniz!`);
      }
    } catch (error) {
      console.error("Doğrulama hatası:", error);
      toast.error(error.response?.data?.message || "Doğrulama işlemi başarısız!");
    }
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
          <div style="position: relative; font-family: 'Segoe UI', sans-serif; max-width: 240px;">
            <button 
              id="popup-close-btn"
              style="
                position: absolute;
                top: 6px;
                right: 6px;
                background: #ef4444;
                border: none;
                width: 26px;
                height: 26px;
                border-radius: 50%;
                font-size: 18px;
                font-weight: bold;
                color: #fff;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                transition: background 0.2s ease;
              "
              onmouseover="this.style.background='#dc2626'"
              onmouseout="this.style.background='#ef4444'"
            >×</button>

            <img 
              src="${data.fotoUrl || 'https://via.placeholder.com/240x130?text=Görsel+Yok'}" 
              alt="Şikayet Görseli"
              style="width: 100%; height: 130px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;"
            />

            <h3 style="margin: 0 0 6px; font-weight: 600; font-size: 15px; color: #111;">
              ${data.baslik || "Başlık Yok"}
            </h3>

            <p style="margin: 0 0 6px; font-size: 13px; color: #444; line-height: 1.4;">
              ${data.aciklama || "Açıklama Yok"}
            </p>

            <p style="margin: 0 0 4px; font-size: 12px; color: #222;">
              <strong>Durum:</strong> ${data.durum || "-"}
            </p>

            <p style="margin: 0 0 10px; font-size: 12px; color: #222;">
              <strong>Şikayet Türü:</strong> ${data.sikayetTuruAdi || "-"}
            </p>

            <div style="display: flex; justify-content: center; align-items: center; gap: 8px;">
              <button 
                id="btn-like"
                title="Sorun Hala Var!"
                style="
                  width: 40px; height: 40px;
                  background-color: #f0fdf4;
                  border: 1.5px solid #22c55e;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer;
                  transition: background 0.3s, box-shadow 0.3s;
                "
                onmouseover="this.style.backgroundColor='#dcfce7'; this.style.boxShadow='0 0 8px #22c55e44'"
                onmouseout="this.style.backgroundColor='#f0fdf4'; this.style.boxShadow='none'"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="#22c55e" viewBox="0 0 24 24" width="20" height="20">
                  <path d="M14 9V5a3 3 0 0 0-6 0v4H5a1 1 0 0 0-.99 1.14l1.38 9A2 2 0 0 0 7.37 21h9.26a2 2 0 0 0 1.98-1.86l1.38-9A1 1 0 0 0 19 9h-5z"/>
                </svg>
              </button>

              <span style="
                font-size: 13px;
                font-weight: 500;
                color: #22c55e;
                background-color: #f0fdf4;
                padding: 4px 10px;
                border-radius: 20px;
                border: 1px solid #bbf7d0;
                box-shadow: inset 0 0 2px #bbf7d0;
              ">
                ${data.dogrulanmaSayisi}
              </span>
            </div>
          </div>
        `;

        popupDiv.querySelector("#btn-like").addEventListener("click", () => {
          handleIncrementDogrulama(data);
        });

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

          setUserLocation([lon, lat]);

          if (!selectedCoordinate) {
            addDraggableMarker(userCoord);
            map.getView().animate({ center: userCoord, zoom: 14 });
            onCoordinateSelect?.([lon, lat]);
            setValue("coords", [lon, lat]);
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

      if (userLocation) {
        const distance = getDistance(
          { latitude: userLocation[1], longitude: userLocation[0] },
          { latitude: newCoord[1], longitude: newCoord[0] }
        );

        if (distance > LIMIT_RADIUS) {
          toast.warning(`Konumunuzdan ${LIMIT_RADIUS} metre dışına çıkamazsınız.`);
          geom.setCoordinates(fromLonLat(userLocation));
          onCoordinateSelect?.(userLocation);
          setValue("coords", userLocation);
          fetchAddress(userLocation[0], userLocation[1]);
          return;
        }
      }

      onCoordinateSelect?.(newCoord);
      setValue("coords", newCoord);
      fetchAddress(newCoord[0], newCoord[1]);
    });
  };

  useEffect(() => {
    if (!selectedCoordinate || !mapObjRef.current) return;

    const coord = fromLonLat(selectedCoordinate);
    mapObjRef.current.getView().animate({ center: coord, zoom: 16 });
    addDraggableMarker(coord);
    setValue("coords", selectedCoordinate);
    fetchAddress(selectedCoordinate[0], selectedCoordinate[1]);
  }, [selectedCoordinate]);

  const toggleForm = () => {
    setIsFormOpen(!isFormOpen);
  };

  const handleSubmitForm = async (data) => {
    const selectedCategory = Kategori.find(k => k.id === parseInt(data.category));

    if (selectedCategory && currentComplaints.length > 0) {
      const isNearExisting = currentComplaints.some((c) => {
        const d = getDistance(
          { latitude: c.lat, longitude: c.lon },
          { latitude: data.coords[1], longitude: data.coords[0] }
        );
        return d <= PROXIMITY_RADIUS && c.type === selectedCategory.ad;
      });

      if (isNearExisting) {
        toast.error(`Bu bölgede aynı türde bir şikayet zaten mevcut (${PROXIMITY_RADIUS} metre içinde).`);
        return;
      }
    }

    try {
      const file = data.photos[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `complaints/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
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
        Baslik: data.title,
        Aciklama: data.description,
        SikayetTuruId: parseInt(data.category),
        Latitude: data.coords[1],
        Longitude: data.coords[0],
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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Şikayetiniz başarıyla gönderildi! 🎉");

      // Formu sıfırlarken konum bilgilerini koru
      reset({
        title: "",
        description: "",
        category: Kategori[0]?.id || "",
        photos: [],
        address: watch("address"),
        coords: watch("coords")
      });

      loadComplaints();
    } catch (error) {
      if (error.response) {
        console.error("Kullanım şartlarımıza göre küfür, argo veya nefret söylemi içeren içerikler kabul edilmemektedir");
        toast.error(`Şikayet metninde uygunsuz ifadeler tespit edildi. Lütfen düzeltin.`);
      } else if (error.request) {
        console.error("İstek yapıldı, yanıt alınamadı:", error.request);
        toast.error("Sunucudan yanıt alınamadı.");
      } else {
        console.error("İstek ayarlarında hata:", error.message);
        toast.error("Lütfen giriş yapınız!");
      }
    }
  };

  const mapHeight = isMobile ? (isFormOpen ? "50vh" : "100vh") : "100vh";

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <ToastContainer position="top-right" autoClose={5000} />

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
        className={`fixed bg-white rounded-xl shadow-2xl z-20 transition-all duration-300 ease-in-out ${isMobile ? "bottom-0 left-0 right-0 h-1/2" : "right-6 bottom-16 w-[380px] max-h-[70vh]"
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

          <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-4">
            <label className="block">
              <span className="font-semibold">
                Başlık <span className="text-red-500">*</span>
              </span>
              <input
                {...register("title")}
                className={`w-full mt-1 p-2 border rounded ${errors.title ? "border-red-500" : ""}`}
                placeholder="Başlık giriniz (max 75 karakter)"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
              <div className="text-right text-sm text-gray-500">
                {title?.length || 0} / 75 karakter
              </div>
            </label>

            <label className="block">
              <span className="font-semibold">
                Açıklama <span className="text-red-500">*</span>
              </span>
              <textarea
                {...register("description")}
                className={`w-full mt-1 p-2 border rounded resize-none ${errors.description ? "border-red-500" : ""}`}
                placeholder="Açıklama giriniz (max 350 karakter)"
                rows={3}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
              <div className="text-right text-sm text-gray-500">
                {description?.length || 0} / 350 karakter
              </div>
            </label>

            <label className="block">
              <span className="font-semibold">
                Kategori <span className="text-red-500">*</span>
              </span>
              <select
                {...register("category")}
                className={`w-full mt-1 p-2 border rounded ${errors.category ? "border-red-500" : ""}`}
              >
                {Kategori.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.ad}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
              )}
            </label>

            <label className="block">
              <span className="font-semibold mb-1 block">
                Fotoğraf <span className="text-red-500">*</span>
              </span>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files[0];
                  setValue("photos", file ? [file] : [], { shouldValidate: true });
                }}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                {photos?.length ? "Fotoğraf Değiştir" : "Fotoğraf Seç veya Kamera Aç"}
              </button>
              {errors.photos && (
                <p className="text-red-500 text-sm mt-1">{errors.photos.message}</p>
              )}
              {photos?.length > 0 && (
                <div className="mt-3">
                  <div className="relative w-full h-40 rounded-md overflow-hidden border border-gray-300">
                    <img
                      src={URL.createObjectURL(photos[0])}
                      alt="Seçilen fotoğraf"
                      className="object-cover w-full h-full"
                      onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700"
                      onClick={() => {
                        setValue("photos", [], { shouldValidate: true });
                        fileInputRef.current.value = "";
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </label>

            <label className="block">
              <span className="font-semibold">
                Konum <span className="text-red-500">*</span>
              </span>
              <input
                {...register("address")}
                className={`w-full mt-1 p-2 border rounded bg-gray-100 ${errors.address ? "border-red-500" : ""}`}
                readOnly
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
              )}
            </label>

            <div className="text-sm text-gray-500">
              <span className="text-red-500">*</span> ile işaretli alanlar zorunludur
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded text-white font-semibold ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600"
                }`}
            >
              {isSubmitting ? "Gönderiliyor..." : "Şikayet Gönder"}
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