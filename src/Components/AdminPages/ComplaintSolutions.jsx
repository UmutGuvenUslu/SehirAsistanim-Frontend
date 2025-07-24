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

// SVG ikonlar
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

    // Düzenleme modal state'leri
    const [editingComplaint, setEditingComplaint] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // API'den şikayetleri çekme fonksiyonu
    const getComplaints = async () => {
        try {
            const res = await axios.get("https://sehirasistanim-backend-production.up.railway.app/Sikayet/GetAll");
            const durumMap = { 0: "İnceleniyor", 1: "Çözüldü", 2: "Çözülemedi" };
            const mapped = res.data.map((item) => ({
                id: item.id,
                title: item.baslik || "Başlık Yok",
                desc: item.aciklama || "Açıklama Yok",
                lat: item.latitude,
                lon: item.longitude,
                status: durumMap[item.durum] ?? "İnceleniyor",
                type: item.sikayetTuruId || "Diğer",
            }));
            setComplaints(mapped);
        } catch (err) {
            console.error("Şikayetler çekilemedi:", err);
            Swal.fire("Hata", "Şikayetler yüklenirken bir hata oluştu.", "error");
        }
    };

    useEffect(() => {
        getComplaints();
    }, []);

    // Şikayet türlerine göre filtreleme
    const complaintTypes = ["Tümü", ...Array.from(new Set(complaints.map((c) => c.type)))];
    const filteredComplaints = selectedType === "Tümü" ? complaints : complaints.filter((c) => c.type === selectedType);

    // Durum güncelleme fonksiyonu (backend çağrısı ve local state güncelleme)
    const setStatus = async (id, newStatus) => {
        try {
            const durumToNumber = { İnceleniyor: 0, Çözüldü: 1, Çözülemedi: 2 };
            await axios.put(`https://sehirasistanim-backend-production.up.railway.app/Sikayet/UpdateStatus?id=${id}`, {
                durum: durumToNumber[newStatus],
            });
            setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)));
            if (popupContent?.id === id) {
                setPopupContent((prev) => ({ ...prev, status: newStatus }));
            }
        } catch (err) {
            console.error("Durum güncellenemedi:", err);
            Swal.fire("Hata", "Durum güncellenemedi.", "error");
        }
    };

const handleDelete = async (id) => {
    const item = complaints.find((c) => c.id === id);
    Swal.fire({
        title: `${item.title} silinsin mi?`,
        text: "Bu işlem geri alınamaz!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Evet, sil",
        cancelButtonText: "İptal",
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem("token");
                await axios.delete(
                    `https://sehirasistanim-backend-production.up.railway.app/Sikayet/Delete/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                setComplaints((prev) => prev.filter((c) => c.id !== id));
                if (popupContent?.id === id) setPopupContent(null);
                Swal.fire("Silindi!", "Şikayet başarıyla silindi.", "success");
            } catch (err) {
                console.error("Silme hatası:", err);
                Swal.fire("Hata", "Şikayet silinemedi.", "error");
            }
        }
    });
};


    // Düzenleme butonuna tıklayınca modal aç
    const handleEdit = (complaint) => {
        setEditingComplaint({ ...complaint });
        setShowEditModal(true);
    };

    // Güncelleme kaydetme fonksiyonu
    const handleSave = async () => {
        if (!editingComplaint.title || !editingComplaint.desc) {
            Swal.fire("Eksik bilgi", "Başlık ve açıklama zorunludur.", "warning");
            return;
        }
        try {
            const token = localStorage.getItem("token");
            const payload = {
                id: editingComplaint.id,
                baslik: editingComplaint.title,
                aciklama: editingComplaint.desc,
                fotoUrl: editingComplaint.fotoUrl,
                latitude: editingComplaint.lat,
                longitude: editingComplaint.lon,
                sikayetTuruId: editingComplaint.typeId
            };
            await axios.put(
                `https://sehirasistanim-backend-production.up.railway.app/Sikayet/Update`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setComplaints((prev) =>
                prev.map((c) =>
                    c.id === editingComplaint.id
                        ? { ...c, title: editingComplaint.title, desc: editingComplaint.desc }
                        : c
                )
            );

            Swal.fire("Güncellendi", "Şikayet başarıyla güncellendi.", "success");
            setShowEditModal(false);
        } catch (err) {
            console.error("Güncelleme hatası:", err);
            Swal.fire("Hata", "Güncelleme yapılamadı.", "error");
        }
    };

    // Haritayı çizme ve markerları koyma
    useEffect(() => {
        if (!mapRef.current) return;

        const vectorSource = new VectorSource();

        filteredComplaints.forEach((c) => {
            if (c.lat && c.lon) {
                const feature = new Feature({
                    geometry: new Point(fromLonLat([c.lon, c.lat])),
                    data: c,
                });
                feature.setStyle(
                    new Style({
                        image: new Icon({ src: "https://cdn-icons-png.flaticon.com/512/684/684908.png", scale: 0.05 }),
                    })
                );
                vectorSource.addFeature(feature);
            }
        });

        const vectorLayer = new VectorLayer({ source: vectorSource });

        const mapObj = new Map({
            target: mapRef.current,
            layers: [new TileLayer({ source: new OSM(), attributions: [] }), vectorLayer],
            view: new View({ center: fromLonLat([35.2433, 38.9637]), zoom: 6 }),
            controls: [],
        });

        mapObj.on("singleclick", (e) => {
            mapObj.forEachFeatureAtPixel(e.pixel, (feature) => {
                const data = feature.get("data");
                setPopupContent(data);
            });
        });

        return () => mapObj.setTarget(undefined);
    }, [filteredComplaints]);

    // DataTable kolonları
    const columns = [
        { name: "Başlık", selector: (row) => row.title, sortable: true },
        { name: "Açıklama", selector: (row) => row.desc, sortable: false, grow: 2 },
        { name: "Tür", selector: (row) => row.type, sortable: true, width: "110px", center: true },
        {
            name: "Durum",
            center: true,
            width: "170px",
            cell: (row) => (
                <div className="flex justify-center items-center gap-1.5">
                    <button
                        title="İnceleniyor"
                        onClick={() => setStatus(row.id, "İnceleniyor")}
                        className={`p-0.5 rounded-full border ${row.status === "İnceleniyor" ? "bg-blue-100 border-blue-400" : "hover:bg-blue-50 border-gray-200"
                            }`}
                    >
                        <ClockIcon className={`h-5 w-5 ${row.status === "İnceleniyor" ? "text-blue-600" : "text-gray-400"}`} />
                    </button>
                    <button
                        title="Çözüldü"
                        onClick={() => setStatus(row.id, "Çözüldü")}
                        className={`p-0.5 rounded-full border ${row.status === "Çözüldü" ? "bg-green-100 border-green-400" : "hover:bg-green-50 border-gray-200"
                            }`}
                    >
                        <CheckIcon className={`h-5 w-5 ${row.status === "Çözüldü" ? "text-green-600" : "text-gray-400"}`} />
                    </button>
                    <button
                        title="Çözülemedi"
                        onClick={() => setStatus(row.id, "Çözülemedi")}
                        className={`p-0.5 rounded-full border ${row.status === "Çözülemedi" ? "bg-red-100 border-red-400" : "hover:bg-red-50 border-gray-200"
                            }`}
                    >
                        <XMarkIcon className={`h-5 w-5 ${row.status === "Çözülemedi" ? "text-red-500" : "text-gray-400"}`} />
                    </button>
                </div>
            ),
        },
        {
            name: "Durum Metni",
            selector: (row) => row.status,
            sortable: true,
            cell: (row) => {
                const color = row.status === "Çözüldü" ? "text-green-600" : row.status === "Çözülemedi" ? "text-red-500" : "text-blue-500";
                return <span className={`font-semibold ${color}`}>{row.status}</span>;
            },
        },
        {
            name: "İşlemler",
            cell: (row) => (
                <div className="flex gap-3">
                    <button
                        className="text-blue-500 hover:scale-110 cursor-pointer"
                        onClick={() => handleEdit(row)}
                        title="Düzenle"
                    >
                        <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                        className="text-red-500 hover:scale-110 cursor-pointer"
                        onClick={() => handleDelete(row.id)}
                        title="Sil"
                    >
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Filtreleme */}
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-white rounded-lg shadow mb-2 p-4 gap-4">
                <h2 className="text-lg font-bold">Tüm Şikayetler</h2>
                <div className="flex items-center gap-2">
                    <label htmlFor="complaint-type" className="font-medium text-gray-700">
                        Şikayet Türü:
                    </label>
                    <select
                        id="complaint-type"
                        className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:border-orange-500 transition w-44"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                    >
                        {complaintTypes.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Harita */}
            <div className="bg-white p-0 rounded-lg shadow-lg h-[400px] relative">
                <div ref={mapRef} className="w-full h-full rounded-lg"></div>
                {popupContent && (
                    <div className="absolute bg-white p-4 rounded-lg shadow-lg border w-64 top-4 left-4 z-10">
                        <h3 className="font-bold text-lg">{popupContent.title}</h3>
                        <p className="text-sm text-gray-600">{popupContent.desc}</p>
                        <p className="mt-2 text-sm font-semibold">
                            Çözülme Durumu:{" "}
                            <span
                                className={`${popupContent.status === "Çözüldü"
                                    ? "text-green-600"
                                    : popupContent.status === "Çözülemedi"
                                        ? "text-red-500"
                                        : "text-blue-500"
                                    }`}
                            >
                                {popupContent.status}
                            </span>
                        </p>
                        <button onClick={() => setPopupContent(null)} className="mt-3 w-full bg-gray-300 py-1 rounded hover:bg-gray-400">
                            Kapat
                        </button>
                    </div>
                )}
            </div>

            {/* Tablo */}
            <div className="bg-white p-4 rounded-lg shadow-lg">
                <h2 className="text-lg font-bold mb-4">Tüm Şikayetler</h2>
                <div className="overflow-x-auto">
                    <DataTable
                        columns={columns}
                        data={filteredComplaints}
                        pagination
                        paginationPerPage={10}
                        paginationRowsPerPageOptions={[5, 10, 15, 20]}
                        paginationComponentOptions={{
                            rowsPerPageText: "Sayfa başına kayıt:",
                            rangeSeparatorText: " / ",
                            noRowsPerPage: false,
                            selectAllRowsItem: false,
                        }}
                        noDataComponent={<div className="p-4 text-center text-gray-500">Aramanıza uygun kayıt bulunamadı.</div>}
                        highlightOnHover
                        striped
                        noHeader
                        dense
                        responsive={false}
                    />
                </div>
            </div>

            {/* Düzenleme Modalı */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Şikayet Düzenle</h3>

                        <input
                            type="text"
                            value={editingComplaint.title}
                            onChange={(e) => setEditingComplaint({ ...editingComplaint, title: e.target.value })}
                            placeholder="Başlık"
                            className="border p-2 rounded-lg w-full mb-3"
                        />
                        <textarea
                            value={editingComplaint.desc}
                            onChange={(e) => setEditingComplaint({ ...editingComplaint, desc: e.target.value })}
                            placeholder="Açıklama"
                            className="border p-2 rounded-lg w-full mb-3"
                            rows={4}
                        />

                        <div className="flex justify-end gap-3 mt-4">
                            <button onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
                                İptal
                            </button>
                            <button onClick={handleSave} className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
