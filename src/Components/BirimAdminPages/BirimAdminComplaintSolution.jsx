import { useEffect, useRef, useState } from "react";
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
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import Swal from "sweetalert2";
import axios from "axios";
import { defaults as defaultControls } from "ol/control";

// SVG Icons
const CheckIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);
const XMarkIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const ClockIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2} />
  </svg>
);

// JWT token çözümleyici
const getRolesFromToken = (token) => {
  try {
    if (!token) return [];
    const parts = token.split(".");
    if (parts.length !== 3) return [];
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const data = JSON.parse(jsonPayload);

    let roles =
      data.role ||
      data["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
      [];
    if (!Array.isArray(roles)) roles = [roles];
    return roles;
  } catch (error) {
    console.error("Token çözümleme hatası:", error);
    return [];
  }
};

// BirimAdmin dışındaki ilk rolün 4 harfini al
const getShortDepartmentRole = (roles) => {
  const departmentRole = roles.find((r) => r !== "BirimAdmin");
  if (!departmentRole) return "";
  return departmentRole.substring(0, 4);
};

export default function BirimAdminComplaintSolutions() {
  const mapRef = useRef(null);
  const [popupContent, setPopupContent] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [rolAdi, setRolAdi] = useState("");
  const [map, setMap] = useState(null);

  // Şikayetleri API'den çek
  const getComplaints = async (rolAdiParam) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token bulunamadı");
        return;
      }
      if (!rolAdiParam) {
        console.error("Rol adı yok");
        return;
      }

      const res = await axios.get(
        `https://sehirasistanim-backend-production.up.railway.app/SikayetCozum/GetSikayetlerForBirim?roladi=${encodeURIComponent(
          rolAdiParam
        )}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const mapped = res.data.map((item) => ({
        id: item.id,
        title: item.baslik || "Başlık Yok",
        desc: item.aciklama || "Açıklama Yok",
        lat: item.latitude,
        lon: item.longitude,
        status: item.durum || "Inceleniyor",
        type: item.sikayetTuruId || "Bulunamadı",
        sikayetTuruAdi: item.sikayetTuruAdi,
        fotoUrl: item.fotoUrl || "",
        dogrulanmaSayisi: item.dogrulanmaSayisi || 0,
      }));

      setComplaints(mapped);
      updateMapMarkers(mapped);
    } catch (err) {
      console.error("Şikayetler çekilemedi:", err);
      Swal.fire("Hata", "Şikayetler yüklenirken bir hata oluştu.", "error");
    }
  };

  // Haritayı başlat
  useEffect(() => {
    if (!mapRef.current) return;

    const initialMap = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() })],
      view: new View({
        center: fromLonLat([35.2433, 38.9637]),
        zoom: 6,
      }),
      controls: defaultControls({ zoom: false, attribution: false }),
    });

    setMap(initialMap);
    return () => {
      initialMap.setTarget(undefined);
    };
  }, []);

  // Harita markerlarını güncelle
  const updateMapMarkers = (complaintsToShow) => {
    if (!map) return;
    map.getLayers().forEach((layer) => {
      if (layer instanceof VectorLayer) {
        map.removeLayer(layer);
      }
    });

    const vectorSource = new VectorSource();
    complaintsToShow.forEach((c) => {
      if (c.lat && c.lon) {
        const feature = new Feature({
          geometry: new Point(fromLonLat([parseFloat(c.lon), parseFloat(c.lat)])),
          data: c,
        });

        let iconColor = "blue";
        if (c.status === "Cozuldu") iconColor = "green";
        else if (c.status === "Reddedildi") iconColor = "red";

        feature.setStyle(
          new Style({
            image: new Icon({
              src: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${iconColor}.png`,
              scale: 0.5,
              anchor: [0.5, 1],
            }),
          })
        );
        vectorSource.addFeature(feature);
      }
    });

    const vectorLayer = new VectorLayer({ source: vectorSource });
    map.addLayer(vectorLayer);

    map.on("click", (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (feature) => feature);
      if (feature) {
        setPopupContent(feature.get("data"));
      } else {
        setPopupContent(null);
      }
    });
  };

  // İlk yüklemede token'dan rolü bul ve şikayetleri çek
  useEffect(() => {
    const token = localStorage.getItem("token");
    const roles = getRolesFromToken(token);
    const shortRole = getShortDepartmentRole(roles); // BirimAdmin dışı rolün 4 harfi
    setRolAdi(shortRole);

    if (shortRole) {
      getComplaints(shortRole);
      const interval = setInterval(() => getComplaints(shortRole), 30000);
      return () => clearInterval(interval);
    }
  }, []);

  // Şikayetler değiştiğinde haritayı güncelle
  useEffect(() => {
    if (complaints.length > 0) {
      updateMapMarkers(complaints);
    }
  }, [complaints]);

  // Durum güncelleme
  const setStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `https://sehirasistanim-backend-production.up.railway.app/Sikayet/UpdateDurum/${id}/${newStatus}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await getComplaints(rolAdi);
      Swal.fire("Başarılı", "Durum güncellendi.", "success");
    } catch (err) {
      console.error("Durum güncellenemedi:", err);
      Swal.fire("Hata", "Durum güncellenemedi.", "error");
    }
  };

  // Silme
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Silinsin mi?",
      text: "Bu işlem geri alınamaz!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Evet, sil",
      cancelButtonText: "İptal",
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(
          `https://sehirasistanim-backend-production.up.railway.app/Sikayet/Delete/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await getComplaints(rolAdi);
        Swal.fire("Silindi!", "Şikayet başarıyla silindi.", "success");
      } catch (err) {
        console.error("Silme hatası:", err);
        Swal.fire("Hata", "Şikayet silinemedi.", "error");
      }
    }
  };

  // Düzenleme ve kaydetme
  const handleEdit = (complaint) => {
    setEditingComplaint({ ...complaint });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!editingComplaint?.title || !editingComplaint?.desc) {
      Swal.fire("Eksik bilgi", "Başlık ve açıklama zorunludur.", "warning");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const payload = {
        id: editingComplaint.id,
        baslik: editingComplaint.title,
        aciklama: editingComplaint.desc,
        sikayetTuruId: editingComplaint.type || 0,
        latitude: editingComplaint.lat || 0,
        longitude: editingComplaint.lon || 0,
        fotoUrl: editingComplaint.fotoUrl || "",
      };
      await axios.put(
        "https://sehirasistanim-backend-production.up.railway.app/Sikayet/Update",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await getComplaints(rolAdi);
      Swal.fire("Güncellendi", "Şikayet başarıyla güncellendi.", "success");
      setShowEditModal(false);
    } catch (err) {
      console.error("Güncelleme hatası:", err);
      Swal.fire("Hata", "Güncelleme yapılamadı.", "error");
    }
  };

  // DataTable kolonları
  const columns = [
    { name: "Başlık", selector: (row) => row.title, sortable: true },
    { name: "Açıklama", selector: (row) => row.desc, sortable: false, grow: 2 },
    { name: "Tür", selector: (row) => row.sikayetTuruAdi, sortable: true },
    {
      name: "Durum",
      cell: (row) => (
        <div className="flex gap-1.5">
          <button
            onClick={() => setStatus(row.id, "Inceleniyor")}
            className={`p-1 rounded-full border ${
              row.status === "Inceleniyor" ? "bg-blue-100 border-blue-400" : "border-gray-200"
            }`}
            title="İnceleniyor"
          >
            <ClockIcon
              className={`h-5 w-5 ${
                row.status === "Inceleniyor" ? "text-blue-600" : "text-gray-400"
              }`}
            />
          </button>
          <button
            onClick={() => setStatus(row.id, "Cozuldu")}
            className={`p-1 rounded-full border ${
              row.status === "Cozuldu" ? "bg-green-100 border-green-400" : "border-gray-200"
            }`}
            title="Çözüldü"
          >
            <CheckIcon
              className={`h-5 w-5 ${
                row.status === "Cozuldu" ? "text-green-600" : "text-gray-400"
              }`}
            />
          </button>
          <button
            onClick={() => setStatus(row.id, "Reddedildi")}
            className={`p-1 rounded-full border ${
              row.status === "Reddedildi" ? "bg-red-100 border-red-400" : "border-gray-200"
            }`}
            title="Reddedildi"
          >
            <XMarkIcon
              className={`h-5 w-5 ${
                row.status === "Reddedildi" ? "text-red-500" : "text-gray-400"
              }`}
            />
          </button>
        </div>
      ),
    },
    {
      name: "Durum Metni",
      cell: (row) => {
        let colorClass = "";
        if (row.status === "Cozuldu") colorClass = "text-green-600";
        else if (row.status === "Reddedildi") colorClass = "text-red-500";
        else if (row.status === "Inceleniyor") colorClass = "text-blue-600";
        return <span className={`font-semibold ${colorClass}`}>{row.status}</span>;
      },
    },
    {
      name: "İşlemler",
      cell: (row) => (
        <div className="flex gap-3">
          <button onClick={() => handleEdit(row)} title="Düzenle">
            <PencilIcon className="h-5 w-5 text-blue-500 hover:scale-110" />
          </button>
          <button onClick={() => handleDelete(row.id)} title="Sil">
            <TrashIcon className="h-5 w-5 text-red-500 hover:scale-110" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg h-[400px] relative">
        <div ref={mapRef} className="w-full h-full rounded-lg"></div>
        {popupContent && (
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
              onClick={() => setPopupContent(null)}
              className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow hover:bg-red-600"
              style={{ lineHeight: 1 }}
            >
              ×
            </button>
            <img
              src={popupContent.fotoUrl || "https://via.placeholder.com/240x130?text=Görsel+Yok"}
              alt={popupContent.title}
              className="w-full h-32 object-cover rounded mb-2"
            />
            <h3 className="font-semibold text-base mb-1">{popupContent.title}</h3>
            <p className="text-sm text-gray-600 mb-1">{popupContent.desc}</p>
            <p className="text-xs text-gray-500 mb-1">
              Tür: {popupContent.sikayetTuruAdi || "Bilinmiyor"}
            </p>
            <p className="text-sm font-semibold mb-2">
              Durum:{" "}
              <span
                className={
                  popupContent.status === "Cozuldu"
                    ? "text-green-600"
                    : popupContent.status === "Reddedildi"
                    ? "text-red-500"
                    : "text-blue-600"
                }
              >
                {popupContent.status}
              </span>
            </p>
            <p
              className="text-sm font-medium text-green-600 text-center bg-green-50 py-1 px-3 rounded-full border border-green-200 shadow-inner"
              style={{ display: "inline-block", marginTop: "6px" }}
            >
              Doğrulanma: {popupContent.dogrulanmaSayisi || 0}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg shadow-lg">
        <DataTable
          columns={columns}
          data={complaints}
          pagination
          paginationPerPage={10}
          highlightOnHover
          striped
          noDataComponent={<div className="p-4 text-center text-gray-500">Kayıt bulunamadı</div>}
        />
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Şikayet Düzenle</h3>
            <input
              type="text"
              value={editingComplaint?.title || ""}
              onChange={(e) =>
                setEditingComplaint({ ...editingComplaint, title: e.target.value })
              }
              placeholder="Başlık"
              className="border p-2 rounded-lg w-full mb-3"
            />
            <textarea
              value={editingComplaint?.desc || ""}
              onChange={(e) =>
                setEditingComplaint({ ...editingComplaint, desc: e.target.value })
              }
              placeholder="Açıklama"
              className="border p-2 rounded-lg w-full mb-3"
              rows={4}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
