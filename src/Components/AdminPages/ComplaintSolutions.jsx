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

export default function AdminComplaintSolutions() {
  const mapRef = useRef(null);
  const [popupContent, setPopupContent] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [selectedType, setSelectedType] = useState("Tümü");
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [map, setMap] = useState(null);

  // Fetch complaints from API
  const getComplaints = async () => {
    try {
      const res = await axios.get("https://sehirasistanim-backend-production.up.railway.app/Sikayet/GetAll");
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
        dogrulanmaSayisi: item.dogrulanmaSayisi || 0
      }));
      setComplaints(mapped);
      updateMapMarkers(mapped.filter(c => selectedType === "Tümü" || c.sikayetTuruAdi === selectedType));
    } catch (err) {
      console.error("Şikayetler çekilemedi:", err);
      Swal.fire("Hata", "Şikayetler yüklenirken bir hata oluştu.", "error");
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const initialMap = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM()
        })
      ],
      view: new View({
        center: fromLonLat([35.2433, 38.9637]),
        zoom: 6
      }),
      controls: defaultControls({ zoom: false, attribution: false })
    });

    setMap(initialMap);

    return () => {
      initialMap.setTarget(undefined);
    };
  }, []);

  // Update map markers when complaints or filter changes
  const updateMapMarkers = (complaintsToShow) => {
    if (!map) return;

    // Remove existing vector layer
    map.getLayers().forEach(layer => {
      if (layer instanceof VectorLayer) {
        map.removeLayer(layer);
      }
    });

    const vectorSource = new VectorSource();
    
    complaintsToShow.forEach((c) => {
      if (c.lat && c.lon) {
        const feature = new Feature({
          geometry: new Point(fromLonLat([parseFloat(c.lon), parseFloat(c.lat)])),
          data: c
        });
        
        let iconColor;
        if (c.status === "Cozuldu") iconColor = "green";
        else if (c.status === "Reddedildi") iconColor = "red";
        else iconColor = "blue";
        
        feature.setStyle(
          new Style({
            image: new Icon({
              src: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${iconColor}.png`,
              scale: 0.5,
              anchor: [0.5, 1]
            })
          })
        );
        vectorSource.addFeature(feature);
      }
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource
    });

    map.addLayer(vectorLayer);

    // Add click handler
    map.on('click', (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (feature) => feature);
      if (feature) {
        setPopupContent(feature.get('data'));
      } else {
        setPopupContent(null);
      }
    });
  };

  useEffect(() => {
    getComplaints();
    const interval = setInterval(getComplaints, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update map when filtered complaints change
  useEffect(() => {
    if (complaints.length > 0) {
      const filtered = selectedType === "Tümü" 
        ? complaints 
        : complaints.filter(c => c.sikayetTuruAdi === selectedType);
      updateMapMarkers(filtered);
    }
  }, [selectedType, complaints]);

  // Filter complaints by type
  const complaintTypes = ["Tümü", ...Array.from(new Set(complaints.map((c) => c.sikayetTuruAdi)))];
  const filteredComplaints = selectedType === "Tümü"
    ? complaints
    : complaints.filter((c) => c.sikayetTuruAdi === selectedType);

  // Update complaint status
  const setStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `https://sehirasistanim-backend-production.up.railway.app/Sikayet/UpdateDurum/${id}/${newStatus}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await getComplaints();
      Swal.fire("Başarılı", "Durum güncellendi.", "success");
    } catch (err) {
      console.error("Durum güncellenemedi:", err);
      Swal.fire("Hata", "Durum güncellenemedi.", "error");
    }
  };

  // Delete complaint
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
        await getComplaints();
        Swal.fire("Silindi!", "Şikayet başarıyla silindi.", "success");
      } catch (err) {
        console.error("Silme hatası:", err);
        Swal.fire("Hata", "Şikayet silinemedi.", "error");
      }
    }
  };

  // Edit complaint
  const handleEdit = (complaint) => {
    setEditingComplaint({ ...complaint });
    setShowEditModal(true);
  };

  // Save edited complaint
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

      await getComplaints();
      Swal.fire("Güncellendi", "Şikayet başarıyla güncellendi.", "success");
      setShowEditModal(false);
    } catch (err) {
      console.error("Güncelleme hatası:", err);
      Swal.fire("Hata", "Güncelleme yapılamadı.", "error");
    }
  };

  // DataTable columns
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
            <ClockIcon className={`h-5 w-5 ${
              row.status === "Inceleniyor" ? "text-blue-600" : "text-gray-400"
            }`} />
          </button>
          <button
            onClick={() => setStatus(row.id, "Cozuldu")}
            className={`p-1 rounded-full border ${
              row.status === "Cozuldu" ? "bg-green-100 border-green-400" : "border-gray-200"
            }`}
            title="Çözüldü"
          >
            <CheckIcon className={`h-5 w-5 ${
              row.status === "Cozuldu" ? "text-green-600" : "text-gray-400"
            }`} />
          </button>
          <button
            onClick={() => setStatus(row.id, "Reddedildi")}
            className={`p-1 rounded-full border ${
              row.status === "Reddedildi" ? "bg-red-100 border-red-400" : "border-gray-200"
            }`}
            title="Reddedildi"
          >
            <XMarkIcon className={`h-5 w-5 ${
              row.status === "Reddedildi" ? "text-red-500" : "text-gray-400"
            }`} />
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
        
        return (
          <span className={`font-semibold ${colorClass}`}>
            {row.status}
          </span>
        );
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
      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row justify-between gap-4">
        <h2 className="text-lg font-bold">Tüm Şikayetler</h2>
        <div className="flex items-center gap-2">
          <label className="font-medium text-gray-700">Şikayet Türü:</label>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:border-orange-500 w-44"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            {complaintTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Map */}
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
    {/* Kapat Butonu */}
    <button
      onClick={() => setPopupContent(null)}
      className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow hover:bg-red-600"
      style={{ lineHeight: 1 }}
    >
      ×
    </button>

    {/* Fotoğraf */}
    <img
      src={popupContent.fotoUrl || "https://via.placeholder.com/240x130?text=Görsel+Yok"}
      alt={popupContent.title}
      className="w-full h-32 object-cover rounded mb-2"
    />

    {/* Başlık ve Açıklama */}
    <h3 className="font-semibold text-base mb-1">{popupContent.title}</h3>
    <p className="text-sm text-gray-600 mb-1">{popupContent.desc}</p>

    {/* Tür ve Durum */}
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

    {/* Doğrulanma Sayısı */}
    <p
      className="text-sm font-medium text-green-600 text-center bg-green-50 py-1 px-3 rounded-full border border-green-200 shadow-inner"
      style={{ display: "inline-block", marginTop: "6px" }}
    >
      Doğrulanma: {popupContent.dogrulanmaSayisi || 0}
    </p>
  </div>
)}

      </div>

      {/* DataTable */}
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <DataTable
          columns={columns}
          data={filteredComplaints}
          pagination
          paginationPerPage={10}
          highlightOnHover
          striped
          noDataComponent={<div className="p-4 text-center text-gray-500">Kayıt bulunamadı</div>}
        />
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Şikayet Düzenle</h3>
            <input
              type="text"
              value={editingComplaint?.title || ""}
              onChange={(e) => setEditingComplaint({...editingComplaint, title: e.target.value})}
              placeholder="Başlık"
              className="border p-2 rounded-lg w-full mb-3"
            />
            <textarea
              value={editingComplaint?.desc || ""}
              onChange={(e) => setEditingComplaint({...editingComplaint, desc: e.target.value})}
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