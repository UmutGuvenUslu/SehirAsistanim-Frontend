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
import Overlay from "ol/Overlay";
import "ol/ol.css";
import DataTable from "react-data-table-component";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import Swal from "sweetalert2";

// Tik, çarpı, saat ikonları
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
    const overlayRef = useRef(null);

    const [popupContent, setPopupContent] = useState(null);

    // --- Şikayet verilerine tür eklendi
    const [complaints, setComplaints] = useState([
        {
            id: 1,
            title: "Çöp Toplanmadı",
            desc: "Mahallede çöp 3 gündür alınmadı.",
            lat: 39.9208,
            lon: 32.8541,
            status: "İnceleniyor",
            type: "Çöp",
        },
        {
            id: 2,
            title: "Elektrik Kesintisi",
            desc: "Sokakta uzun süredir elektrik yok.",
            lat: 41.0082,
            lon: 28.9784,
            status: "Çözüldü",
            type: "Elektrik",
        },
        {
            id: 3,
            title: "Kanalizasyon Taşması",
            desc: "Yağmur sonrası kanalizasyon taştı.",
            lat: 38.4192,
            lon: 27.1287,
            status: "Çözülemedi",
            type: "Kanalizasyon",
        },
    ]);

    // --- Şikayet türü filtrelemesi için state ve tiplerin listesi
    const [selectedType, setSelectedType] = useState("Tümü");
    const complaintTypes = ["Tümü", ...Array.from(new Set(complaints.map(c => c.type)))];

    // --- Filtrelenmiş şikayetler
    const filteredComplaints =
        selectedType === "Tümü"
            ? complaints
            : complaints.filter((c) => c.type === selectedType);

    // Statüyü direkt set et
    const setStatus = (id, newStatus) => {
        setComplaints((prev) =>
            prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
        );
    };

    // --- Harita sadece filtrelenmiş şikayetleri göstersin
    useEffect(() => {
        if (!mapRef.current) return;

        const vectorSource = new VectorSource();

        filteredComplaints.forEach((c) => {
            const feature = new Feature({
                geometry: new Point(fromLonLat([c.lon, c.lat])),
                data: c,
            });
            feature.setStyle(
                new Style({
                    image: new Icon({
                        src: "https://cdn-icons-png.flaticon.com/512/684/684908.png", // Marker icon
                        scale: 0.05,
                    }),
                })
            );
            vectorSource.addFeature(feature);
        });

        const vectorLayer = new VectorLayer({ source: vectorSource });

        const mapObj = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({
                    source: new OSM(),
                    attributions: [],
                }),
                vectorLayer,
            ],
            view: new View({
                center: fromLonLat([35.2433, 38.9637]),
                zoom: 6,
            }),
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

    const handleDelete = (id) => {
        const item = complaints.find((c) => c.id === id);
        Swal.fire({
            title: `${item.title} silinsin mi?`,
            text: "Bu işlem geri alınamaz!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Evet, sil",
            cancelButtonText: "İptal",
            confirmButtonColor: "oklch(70.5% 0.213 47.604)",
            cancelButtonColor: "oklch(87.2% 0.01 258.338)",
        }).then((result) => {
            if (result.isConfirmed) {
                setComplaints((prev) => prev.filter((c) => c.id !== id));
                window.Swal.fire("Silindi!", "Şikayet başarıyla silindi.", "success");
            }
        });
    };

    const columns = [
        { name: "Başlık", selector: (row) => row.title, sortable: true },
        { name: "Açıklama", selector: (row) => row.desc, sortable: false, grow: 2 },
        // Şikayet Türü sütunu eklendi (opsiyonel, ister kaldır!)
        {
            name: "Tür",
            selector: (row) => row.type,
            sortable: true,
            width: "110px",
            center: true,
        },
        {
            name: "Çözüldü Mü?",
            center: true,
            width: "150px",
            cell: (row) => (
                <div className="flex justify-center items-center gap-1.5">
                    {/* Saat (İnceleniyor) */}
                    <button
                        title="İnceleniyor olarak işaretle"
                        onClick={() => setStatus(row.id, "İnceleniyor")}
                        className={`p-0.5 rounded-full border ${row.status === "İnceleniyor"
                                ? "bg-blue-100 border-blue-400"
                                : "hover:bg-blue-50 border-gray-200"
                            }`}
                    >
                        <ClockIcon
                            className={`h-5 w-5 ${row.status === "İnceleniyor" ? "text-blue-600" : "text-gray-400"
                                }`}
                        />
                    </button>
                    {/* Tik (Çözüldü) */}
                    <button
                        title="Çözüldü olarak işaretle"
                        onClick={() => setStatus(row.id, "Çözüldü")}
                        className={`p-0.5 rounded-full border ${row.status === "Çözüldü"
                                ? "bg-green-100 border-green-400"
                                : "hover:bg-green-50 border-gray-200"
                            }`}
                    >
                        <CheckIcon
                            className={`h-5 w-5 ${row.status === "Çözüldü" ? "text-green-600" : "text-gray-400"
                                }`}
                        />
                    </button>
                    {/* Çarpı (Çözülemedi) */}
                    <button
                        title="Çözülemedi olarak işaretle"
                        onClick={() => setStatus(row.id, "Çözülemedi")}
                        className={`p-0.5 rounded-full border ${row.status === "Çözülemedi"
                                ? "bg-red-100 border-red-400"
                                : "hover:bg-red-50 border-gray-200"
                            }`}
                    >
                        <XMarkIcon
                            className={`h-5 w-5 ${row.status === "Çözülemedi" ? "text-red-500" : "text-gray-400"
                                }`}
                        />
                    </button>
                </div>
            ),
        },
        {
            name: "Çözülme Durumu",
            selector: (row) => row.status,
            sortable: true,
            cell: (row) => {
                let color = "text-gray-600";
                if (row.status === "Çözüldü") color = "text-green-600 font-semibold";
                else if (row.status === "Çözülemedi") color = "text-red-500 font-semibold";
                else if (row.status === "İnceleniyor") color = "text-blue-500 font-semibold";
                return <span className={color}>{row.status}</span>;
            },
        },
        {
            name: "İşlemler",
            cell: (row) => (
                <div className="flex gap-3">
                    <button
                        className="text-blue-500 hover:scale-110 cursor-pointer"
                        onClick={() => alert(`${row.title} düzenlenecek (Modal eklenir)`)}
                    >
                        <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                        className="text-red-500 hover:scale-110 cursor-pointer"
                        onClick={() => handleDelete(row.id)}
                    >
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Şikayet Türü Filtresi */}
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-white rounded-lg shadow mb-2 p-4 gap-4">
                <h2 className="text-lg font-bold">Tüm Şikayetler</h2>
                <div className="flex items-center gap-2">
                    <label htmlFor="complaint-type" className="font-medium text-gray-700">Şikayet Türü:</label>
                    <select
                        id="complaint-type"
                        className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:border-orange-500 transition w-44"
                        value={selectedType}
                        onChange={e => setSelectedType(e.target.value)}
                    >
                        {complaintTypes.map(type => (
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
                    <div
                        ref={overlayRef}
                        className="absolute bg-white p-4 rounded-lg shadow-lg border w-64 top-4 left-4"
                    >
                        <h3 className="font-bold text-lg">{popupContent.title}</h3>
                        <p className="text-sm text-gray-600">{popupContent.desc}</p>
                        <p className="mt-2 text-sm font-semibold">
                            Çözülme Durumu:{" "}
                            <span
                                className={
                                    popupContent.status === "Beklemede"
                                        ? "text-orange-500"
                                        : popupContent.status === "Çözüldü"
                                            ? "text-green-600"
                                            : "text-blue-500"
                                }
                            >
                                {popupContent.status}
                            </span>
                        </p>
                        <button
                            onClick={() => setPopupContent(null)}
                            className="mt-3 w-full bg-gray-300 py-1 rounded hover:bg-gray-400"
                        >
                            Kapat
                        </button>
                    </div>
                )}
            </div>

            {/* DataTable */}
            <div className="bg-white p-4 rounded-lg shadow-lg">
                <h2 className="text-lg font-bold mb-4">Tüm Şikayetler</h2>
                <div className="overflow-x-auto">
                    <DataTable
                        columns={columns}
                        data={filteredComplaints}
                        pagination
                        highlightOnHover
                        striped
                        noHeader
                        dense
                        responsive={false} // Kendi overflow kullanıyoruz
                    />
                </div>
            </div>
        </div>
    );
}
