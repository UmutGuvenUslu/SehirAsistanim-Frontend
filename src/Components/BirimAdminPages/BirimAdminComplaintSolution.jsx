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
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import Swal from "sweetalert2";
import axios from "axios";
import { defaults as defaultControls } from "ol/control";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createClient } from '@supabase/supabase-js';

// Supabase konfigürasyonu
const supabaseUrl = "https://czpofsdqzrqrhfhalfbw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6cG9mc2RxenJxcmhmaGFsZmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4Mzc2MjEsImV4cCI6MjA2ODQxMzYyMX0.PQNmMJZKhYF2NR1Zk1ILhxbHHw7B85jtC65ekFcjxEc";
const supabase = createClient(supabaseUrl, supabaseKey);

// JWT token çözümleyici
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
      data.sub 
    );
  } catch (error) {
    console.error("Token çözümleme hatası:", error);
    return null;
  }
};

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

const getShortDepartmentRole = (roles) => {
  if (!roles || roles.length === 0) return "";
  
  const firstRole = roles[0];
  return firstRole.substring(0, 3).toLowerCase();
};

export default function BirimAdminComplaintSolutions() {
  const mapRef = useRef(null);
  const [popupContent, setPopupContent] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSolutionModal, setShowSolutionModal] = useState(false);
  const [currentComplaintId, setCurrentComplaintId] = useState(null);
  const [solutionData, setSolutionData] = useState({
    cozumAciklamasi: "",
    cozumFotoUrl: "",
    cozumFotoFile: null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rolAdi, setRolAdi] = useState("");
  const [map, setMap] = useState(null);
  const [complaintTypes, setComplaintTypes] = useState([]);
  const fileInputRef = useRef(null);

  // Fetch complaint types from API
  const getComplaintTypes = async () => {
    try {
      const res = await axios.get("https://sehirasistanim-backend-production.up.railway.app/SikayetTuru/GetAll");
      setComplaintTypes(res.data);
    } catch (err) {
      console.error("Şikayet türleri çekilemedi:", err);
    }
  };

  // Fetch complaints from API
  const getComplaints = async (rolAdiParam) => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !rolAdiParam) return;

      const res = await axios.get(
        `https://sehirasistanim-backend-production.up.railway.app/SikayetCozum/GetSikayetlerForBirim?roladi=${rolAdiParam}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const mapped = res.data.map((item) => ({
        id: item.id,
        title: item.baslik || "Başlık Yok",
        desc: item.aciklama || "Açıklama Yok",
        lat: item.latitude,
        lon: item.longitude,
        status: item.durum === 1 ? "Çözüldü" : item.durum === 2 ? "Reddedildi" : "İnceleniyor",
        type: item.sikayetTuruId || "Bulunamadı",
        sikayetTuruAdi: item.sikayetTuruAdi,
        fotoUrl: item.fotoUrl || "",
        dogrulanmaSayisi: item.dogrulanmaSayisi || 0,
        hasSolution: item.sikayetCozumlar !== null
      }));

      setComplaints(mapped);
      updateMapMarkers(mapped);
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

  // Update map markers
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
        if (c.status === "Çözüldü") iconColor = "green";
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
    const token = localStorage.getItem("token");
    const roles = getRolesFromToken(token);
    const shortRole = getShortDepartmentRole(roles);
    setRolAdi(shortRole);

    if (shortRole) {
      getComplaintTypes();
      getComplaints(shortRole);
      const interval = setInterval(() => getComplaints(shortRole), 30000);
      return () => clearInterval(interval);
    }
  }, []);

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
        await getComplaints(rolAdi);
        Swal.fire("Silindi!", "Şikayet başarıyla silindi.", "success");
      } catch (err) {
        console.error("Silme hatası:", err);
        Swal.fire("Hata", "Şikayet silinemedi.", "error");
      }
    }
  };

  // Edit complaint
  const handleEdit = (complaint) => {
    setEditingComplaint({
      ...complaint,
      type: complaintTypes.find(t => t.ad === complaint.sikayetTuruAdi)?.id || ""
    });
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

      await getComplaints(rolAdi);
      Swal.fire("Güncellendi", "Şikayet başarıyla güncellendi.", "success");
      setShowEditModal(false);
    } catch (err) {
      console.error("Güncelleme hatası:", err);
      Swal.fire("Hata", "Güncelleme yapılamadı.", "error");
    }
  };

  // Handle file upload
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `solutions/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('sehirasistanimdata')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('sehirasistanimdata')
        .getPublicUrl(fileName);

      setSolutionData({
        ...solutionData,
        cozumFotoUrl: publicUrl,
        cozumFotoFile: file
      });

      toast.success("Fotoğraf başarıyla yüklendi!", {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (err) {
      console.error("Fotoğraf yükleme hatası:", err);
      toast.error("Fotoğraf yüklenemedi", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Submit solution
  const submitSolution = async () => {
  if (!solutionData.cozumAciklamasi.trim()) {
    toast.warn("Çözüm açıklaması boş olamaz!", {
      position: "top-right",
      autoClose: 3000,
    });
    return;
  }

  setIsSubmitting(true);

  try {
    const token = localStorage.getItem("token");
    const userId = getUserIdFromToken(token);
    
    // Backend'in beklediği küçük harfli JSON yapısı
    const payload = {
      sikayetid: currentComplaintId,
      cozenkullaniciid: userId,
      cozumaciklamasi: solutionData.cozumAciklamasi,
      cozumfotourl: solutionData.cozumFotoUrl
    };

    console.log("Gönderilen veri:", payload); // Debug için

    const response = await axios.post(
      "https://sehirasistanim-backend-production.up.railway.app/SikayetCozum/AddCozumForm",
      payload,
      
    );

    console.log("API Yanıtı:", response); // Debug için

    if (response.status === 200) {
      toast.success("Çözüm başarıyla eklendi!", {
        position: "top-right",
        autoClose: 3000,
      });
      
      // Verileri yeniden yükle
      await getComplaints(rolAdi);
      
      // Modal'ı kapat ve formu temizle
      setShowSolutionModal(false);
      setSolutionData({
        cozumAciklamasi: "",
        cozumFotoUrl: "",
        cozumFotoFile: null
      });
    }
  }  finally {
    setIsSubmitting(false);
  }
};

const handleAddSolution = (complaintId) => {
  const complaint = complaints.find(c => c.id === complaintId);

  if (!complaint) {
    toast.error("Şikayet bulunamadı.");
    return;
  }

  // Güvenli ve kesin çözüm kontrolü
  const cozumVarMi = Array.isArray(complaint.sikayetCozumlar) && complaint.sikayetCozumlar.length > 0;

  if (cozumVarMi) {
    toast.info("Bu şikayet için zaten bir çözüm oluşturulmuş.", {
      position: "top-right",
      autoClose: 3000,
    });
    return;
  }

  setCurrentComplaintId(complaintId);
  setShowSolutionModal(true);
};



  // DataTable columns
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
      width: "200px"
    },
    {
      name: "Tür",
      selector: (row) => row.sikayetTuruAdi,
      sortable: true,
      width: "150px"
    },
    {
      name: "Durum",
      cell: (row) => {
        let colorClass = "";
        if (row.status === "Çözüldü") colorClass = "text-green-600";
        else if (row.status === "Reddedildi") colorClass = "text-red-500";
        else colorClass = "text-blue-600";
        return <span className={`font-semibold ${colorClass}`}>{row.status}</span>;
      },
      width: "120px"
    },
    {
      name: "Çözüm",
      cell: (row) => (
        <button 
          onClick={() => handleAddSolution(row.id)}
          className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Çözüm Ekle</span>
        </button>
      ),
      width: "150px"
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
      width: "120px"
    },
  ];

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={5000} />
      
      {/* Map Section */}
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
                  popupContent.status === "Çözüldü"
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

      {/* DataTable Section */}
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

      {/* Solution Modal */}
      {showSolutionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div 
            className={`bg-white p-6 rounded-lg shadow-lg w-full max-w-md transform transition-all duration-300 ${
              showSolutionModal ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
          >
            <h3 className="text-lg font-bold mb-4">Çözüm Ekle</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Çözüm Açıklaması <span className="text-red-500">*</span>
              </label>
              <textarea
                value={solutionData.cozumAciklamasi}
                onChange={(e) => setSolutionData({
                  ...solutionData,
                  cozumAciklamasi: e.target.value
                })}
                placeholder="Çözüm açıklamasını detaylı şekilde yazın..."
                className="border p-2 rounded-lg w-full min-h-[120px]"
                rows={4}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Çözüm Fotoğrafı <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                id="solution-photo"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label 
                htmlFor="solution-photo"
                className={`block w-full px-4 py-2 rounded-lg border cursor-pointer text-center ${
                  isUploading 
                    ? "bg-gray-100 text-gray-500 border-gray-300" 
                    : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                } transition-colors`}
              >
                {isUploading ? "Yükleniyor..." : "Fotoğraf Seç"}
              </label>
              
              {solutionData.cozumFotoUrl && (
                <div className="mt-3">
                  <div className="relative">
                    <img 
                      src={solutionData.cozumFotoUrl} 
                      alt="Çözüm önizleme" 
                      className="w-full h-40 object-contain rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSolutionData({
                          ...solutionData,
                          cozumFotoUrl: "",
                          cozumFotoFile: null
                        });
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {solutionData.cozumFotoFile?.name || "Dosya adı bilinmiyor"}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowSolutionModal(false);
                  setSolutionData({
                    cozumAciklamasi: "",
                    cozumFotoUrl: "",
                    cozumFotoFile: null
                  });
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
                disabled={isSubmitting || isUploading}
              >
                İptal
              </button>
              <button
                onClick={submitSolution}
                className={`px-4 py-2 text-white rounded transition-colors flex items-center gap-2 ${
                  isSubmitting || isUploading || !solutionData.cozumFotoUrl
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600"
                }`}
                disabled={isSubmitting || isUploading || !solutionData.cozumFotoUrl}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Gönderiliyor...
                  </>
                ) : (
                  "Çözümü Gönder"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}