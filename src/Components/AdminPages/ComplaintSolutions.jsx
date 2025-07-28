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
const FormIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 2H8a2 2 0 00-2 2v16a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2zM10 2v16h4V2H10z" />
  </svg>
);

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

// Star Rating 
const StarRating = ({ rating }) => {
  const maxStars = 5;
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <svg key={`full-${i}`} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {hasHalfStar && (
        <svg key="half" className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half-star" x1="0" x2="100%" y1="0" y2="0">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#D1D5DB" />
            </linearGradient>
          </defs>
          <path fill="url(#half-star)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <svg key={`empty-${i}`} className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-sm text-gray-500">({rating.toFixed(1)})</span>
    </div>
  );
};

export default function AdminComplaintSolutions() {
  const mapRef = useRef(null);
  const [popupContent, setPopupContent] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [selectedType, setSelectedType] = useState("Tümü");
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [map, setMap] = useState(null);
  const [complaintTypes, setComplaintTypes] = useState([]);
  const [ShowFormModal, setShowFormModal] = useState(false);
  







  

  const getComplaintTypes = async () => {
    try {
      const res = await axios.get("https://sehirasistanim-backend-production.up.railway.app/SikayetTuru/GetAll");
      setComplaintTypes(res.data);
    } catch (err) {
      console.error("Şikayet türleri çekilemedi:", err);
    }
  };

  const calculateCombinedScore = (complaint) => {
    const sentimentScore = complaint.duyguPuani || 0;
    const normalizedSentiment = (1 - (sentimentScore + 4) / 8) * 5 * 0.6;

    const verificationCount = complaint.dogrulanmaSayisi || 0;
    const normalizedVerification = (Math.min(verificationCount, 10) / 10) * 5 * 0.4;

    const combinedScore = Math.min(Math.max(normalizedSentiment + normalizedVerification, 0), 5);
    return combinedScore;
  };

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
        duyguPuani: item.duyguPuani || 0,
        sikayetCozumlar:item.sikayetCozumlar,
        dogrulanmaSayisi: item.dogrulanmaSayisi || 0,
        combinedScore: calculateCombinedScore({
          duyguPuani: item.duyguPuani || 0,
          dogrulanmaSayisi: item.dogrulanmaSayisi || 0
        })
      }));
      setComplaints(mapped);
      updateMapMarkers(mapped.filter(c => selectedType === "Tümü" || c.sikayetTuruAdi === selectedType));
    } catch (err) {
      console.error("Şikayetler çekilemedi:", err);
      Swal.fire("Hata", "Şikayetler yüklenirken bir hata oluştu.", "error");
    }
  };

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

  const updateMapMarkers = (complaintsToShow) => {
    if (!map) return;

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
    getComplaintTypes();
    const interval = setInterval(getComplaints, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (complaints.length > 0) {
      const filtered = selectedType === "Tümü"
        ? complaints
        : complaints.filter(c => c.sikayetTuruAdi === selectedType);
      updateMapMarkers(filtered);
    }
  }, [selectedType, complaints]);

  const filteredComplaints = selectedType === "Tümü"
    ? complaints
    : complaints.filter((c) => c.sikayetTuruAdi === selectedType);

  const setStatus = async (id, newStatus) => {
    const complaint = complaints.find(c => c.id === id);
    const hasSolutions = complaint?.sikayetCozumlar?.length > 0;

    // "Çözüldü" durumu sadece çözümler varsa yapılabilir
    if (newStatus === "Cozuldu" && !hasSolutions) {
      Swal.fire("Hata", "Çözüm önerisi bulunmadığı için 'Çözüldü' durumu seçilemez.", "error");
      return;
    }

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

  const openFormModal = (complaintId) => {
    const complaint = complaints.find(c => c.id === complaintId);
    setPopupContent(complaint);  // Modal için içeriği set ediyoruz
    setShowFormModal(true);  // Şikayet çözüm formu modalını açıyoruz
  };

  const closeFormModal = () => {
    setPopupContent(null);
    setShowFormModal(false);  // Şikayet çözüm formu modalını kapatıyoruz
  };

const handleEdit = (complaint) => {
   setEditingComplaint({
     ...complaint,
     type: complaintTypes.find(t => t.ad === complaint.sikayetTuruAdi)?.id || ""
   });
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

      await getComplaints();
      Swal.fire("Güncellendi", "Şikayet başarıyla güncellendi.", "success");
      setShowEditModal(false);
    } catch (err) {
      console.error("Güncelleme hatası:", err);
      Swal.fire("Hata", "Güncelleme yapılamadı.", "error");
    }
  };

 const columns = [
  {
    name: "Başlık",
    selector: (row) => row.title,
    sortable: true,
    width: "150px"
  },
  {
    name: "Açıklama",
    selector: (row) => row.desc,
    sortable: false,
    cell: row => (
      <div className="whitespace-nowrap overflow-hidden text-ellipsis" title={row.desc}>
        {row.desc}
      </div>
    ),
    width: "200px",
    style: {
      paddingRight: '8px'
    }
  },
  {
    name: "Tür",
    selector: (row) => row.sikayetTuruAdi,
    sortable: true,
    width: "250px"
  },
  {
    name: "Önem Puanı",
    cell: (row) => (
      <div className="flex flex-col">
        <StarRating rating={row.combinedScore} />
        <div className="text-xs text-gray-500 mt-1">
          {row.duyguPuani > 0 ? (
            <span className="text-green-600">Olumlu ({row.duyguPuani})</span>
          ) : row.duyguPuani < 0 ? (
            <span className="text-red-500">Olumsuz ({row.duyguPuani})</span>
          ) : (
            <span className="text-gray-500">Nötr</span>
          )}
          <span className="ml-2">• {row.dogrulanmaSayisi} doğrulama</span>
        </div>
      </div>
    ),
    sortable: false,
  },
  {
    name: "Durum",
    cell: (row) => (
      <div className="flex gap-1.5">
        <button
          onClick={() => setStatus(row.id, "Inceleniyor")}
          className={`p-1 rounded-full border cursor-pointer ${row.status === "Inceleniyor" ? "bg-blue-100 border-blue-400" : "border-gray-200"}`}
          title="İnceleniyor"
        >
          <ClockIcon className={`h-5 w-5 ${row.status === "Inceleniyor" ? "text-blue-600" : "text-gray-400"}`} />
        </button>
        <button
          onClick={() => setStatus(row.id, "Cozuldu")}
          disabled={row.sikayetCozumlar?.length === 0} // Eğer çözümler yoksa "Çözüldü" durumu seçilemez
          className={`p-1 rounded-full border cursor-pointer ${row.status === "Cozuldu" ? "bg-green-100 border-green-400" : "border-gray-200"}`}
          title="Çözüldü"
        >
          <CheckIcon className={`h-5 w-5 ${row.status === "Cozuldu" ? "text-green-600" : "text-gray-400"}`} />
        </button>
        <button
          onClick={() => setStatus(row.id, "Reddedildi")}
          className={`p-1 rounded-full border cursor-pointer ${row.status === "Reddedildi" ? "bg-red-100 border-red-400" : "border-gray-200"}`}
          title="Reddedildi"
        >
          <XMarkIcon className={`h-5 w-5 ${row.status === "Reddedildi" ? "text-red-500" : "text-gray-400"}`} />
        </button>
      </div>
    ),
  },
  {
    name: "Durum Text",
    cell: (row) => {
      const colorClass = row.status === "Cozuldu" ? "text-green-600" : row.status === "Reddedildi" ? "text-red-600" : "text-blue-600";
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
            <option value="Tümü">Tümü</option>
            {complaintTypes.map((type) => (
              <option key={type.id} value={type.ad}>{type.ad}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Harita */}
      <div className="bg-white rounded-lg shadow-lg h-[400px] relative">
        <div ref={mapRef} className="w-full h-full rounded-lg"></div>
      </div>

      {/* Form Modal */}
      {ShowFormModal && popupContent && popupContent.sikayetCozumlar?.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Şikayet Çözüm Formu</h3>
            {/* Form İçeriği */}
            {popupContent?.sikayetCozumlar?.length > 0 ? (
              popupContent.sikayetCozumlar.map((cozum, index) => (
                <div key={index}>
                  <p><strong>Çözüm Açıklaması:</strong> {cozum.cozumAciklamasi}</p>
                  <p><strong>Fotoğraf:</strong> <a href={cozum.cozumFotoUrl} target="_blank" rel="noopener noreferrer">Çözüm Fotoğrafı</a></p>
                  <p><strong>Çözüm Tarihi:</strong> {new Date(cozum.cozumeTarihi).toLocaleString()}</p>
                  <p><strong>Çözümü Gönderen Kullanıcı:</strong> {cozum.cozenKullanici?.isim} {cozum.cozenKullanici?.soyisim}</p>
                </div>
              ))
            ) : (
              <p>Henüz bir çözüm önerisi bulunmamaktadır.</p>
            )}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={closeFormModal}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DataTable */}
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <DataTable
          columns={columns}
          data={filteredComplaints.sort((a, b) => b.combinedScore - a.combinedScore)}
          pagination
          paginationPerPage={10}
          highlightOnHover
          striped
          noDataComponent={<div className="p-4 text-center text-gray-500">Kayıt bulunamadı</div>}
          paginationComponentOptions={{
            rowsPerPageText: 'Sayfa başına kayıt',
            rangeSeparatorText: ' / ',
          }}
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
              onChange={(e) => setEditingComplaint({ ...editingComplaint, title: e.target.value })}
              placeholder="Başlık"
              className="border p-2 rounded-lg w-full mb-3"
            />
            <textarea
              value={editingComplaint?.desc || ""}
              onChange={(e) => setEditingComplaint({ ...editingComplaint, desc: e.target.value })}
              placeholder="Açıklama"
              className="border p-2 rounded-lg w-full mb-3"
              rows={4}
            />
            {/* Complaint Type Selection */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Şikayet Türü</label>
              <select
                value={editingComplaint?.type || ""}
                onChange={(e) => setEditingComplaint({ ...editingComplaint, type: e.target.value })}
                className="border p-2 rounded-lg w-full"
              >
                <option value="">Tür Seçiniz</option>
                {complaintTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.ad}</option>
                ))}
              </select>
            </div>
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
      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Şikayet Düzenle</h3>
            <input
              type="text"
              value={editingComplaint?.title || ""}
              onChange={(e) => setEditingComplaint({ ...editingComplaint, title: e.target.value })}
              placeholder="Başlık"
              className="border p-2 rounded-lg w-full mb-3"
            />
            <textarea
              value={editingComplaint?.desc || ""}
              onChange={(e) => setEditingComplaint({ ...editingComplaint, desc: e.target.value })}
              placeholder="Açıklama"
              className="border p-2 rounded-lg w-full mb-3"
              rows={4}
            />
            {/* Complaint Type Selection */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Şikayet Türü</label>
              <select
                value={editingComplaint?.type || ""}
                onChange={(e) => setEditingComplaint({ ...editingComplaint, type: e.target.value })}
                className="border p-2 rounded-lg w-full"
              >
                <option value="">Tür Seçiniz</option>
                {complaintTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.ad}</option>
                ))}
              </select>
            </div>
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
       {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Şikayet Düzenle</h3>
            <input
              type="text"
              value={editingComplaint?.title || ""}
              onChange={(e) => setEditingComplaint({ ...editingComplaint, title: e.target.value })}
              placeholder="Başlık"
              className="border p-2 rounded-lg w-full mb-3"
            />
            <textarea
              value={editingComplaint?.desc || ""}
              onChange={(e) => setEditingComplaint({ ...editingComplaint, desc: e.target.value })}
              placeholder="Açıklama"
              className="border p-2 rounded-lg w-full mb-3"
              rows={4}
            />
            {/* Complaint Type Selection */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Şikayet Türü</label>
              <select
                value={editingComplaint?.type || ""}
                onChange={(e) => setEditingComplaint({ ...editingComplaint, type: e.target.value })}
                className="border p-2 rounded-lg w-full"
              >
                <option value="">Tür Seçiniz</option>
                {complaintTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.ad}</option>
                ))}
              </select>
            </div>
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
