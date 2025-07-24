import { useEffect, useRef, useState } from "react";
import axios from "axios";
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
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";

export default function Dashboard() {
    const mapRef = useRef(null);
    const vectorSourceRef = useRef(null);
    const vectorLayerRef = useRef(null);
    const mapObjRef = useRef(null);

    const [totalUsers, setTotalUsers] = useState(0);
    const [totalComplaints, setTotalComplaints] = useState(0);
    const [resolvedComplaints, setResolvedComplaints] = useState(0);
    const [pendingComplaints, setPendingComplaints] = useState(0);
    const [complaints, setComplaints] = useState([]);
    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#a855f7", "#fb923c", "#facc15", "#34d399"];
    // ---- API'den verileri çek
    useEffect(() => {
        const token = localStorage.getItem("token");

        Promise.all([
            axios.get("https://sehirasistanim-backend-production.up.railway.app/Kullanici/TotalKullaniciSayisi", {
                headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get("https://sehirasistanim-backend-production.up.railway.app/Sikayet/TotalSikayetSayisi", {
                headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get("https://sehirasistanim-backend-production.up.railway.app/Sikayet/CozulenSikayetSayisi", {
                headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get("https://sehirasistanim-backend-production.up.railway.app/Sikayet/BekleyenSikayetSayisi", {
                headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get("https://sehirasistanim-backend-production.up.railway.app/Sikayet/GetAll", {
                headers: { Authorization: `Bearer ${token}` },
            }),
        ])
            .then(
                ([
                    totalUsersRes,
                    totalComplaintsRes,
                    resolvedComplaintsRes,
                    pendingComplaintsRes,
                    complaintsRes,
                ]) => {
                    setTotalUsers(totalUsersRes.data ?? 0);
                    setTotalComplaints(totalComplaintsRes.data ?? 0);
                    setResolvedComplaints(resolvedComplaintsRes.data ?? 0);
                    setPendingComplaints(pendingComplaintsRes.data ?? 0);

                    const data = Array.isArray(complaintsRes.data) ? complaintsRes.data : [];
                    setComplaints(data);
                }
            )
            .catch((err) => console.error("Veriler çekilemedi:", err));
    }, []);

    // ---- Haritayı kur (arayüzü değiştirmeden)
    useEffect(() => {
        if (!mapRef.current) return;

        vectorSourceRef.current = new VectorSource();
        vectorLayerRef.current = new VectorLayer({ source: vectorSourceRef.current });

        const map = new Map({
            target: mapRef.current,
            layers: [new TileLayer({ source: new OSM(), attributions: [] }), vectorLayerRef.current],
            view: new View({
                center: fromLonLat([35.2433, 38.9637]),
                zoom: 6,
            }),
            controls: [],
        });

        mapObjRef.current = map;

        return () => map.setTarget(undefined);
    }, []);

    // ---- Şikayet marker'larını ekle/güncelle
    useEffect(() => {
        if (!mapObjRef.current || !vectorSourceRef.current) return;

        const vectorSource = vectorSourceRef.current;
        vectorSource.clear();

        complaints.forEach((c) => {
            if (!c.longitude || !c.latitude) return;

            const feature = new Feature({
                geometry: new Point(fromLonLat([c.longitude, c.latitude])),
                data: c,
            });

            feature.setStyle(
                new Style({
                    image: new Icon({
                        src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
                        scale: 0.05,
                    }),
                })
            );

            vectorSource.addFeature(feature);
        });
    }, [complaints]);

    // ---- Şikayet türü dağılımı (UI aynı kalıyor, sadece dinamikleştiriyoruz)
    const typeDistribution = (() => {
        try {
            const map = complaints.reduce((acc, cur) => {
                const key =
                    cur.sikayetTuruAdi ??
                    cur.sikayetTuru?.adi ??
                    cur.sikayetTuruId ??
                    "Diğer";
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});
            const entries = Object.entries(map).map(([name, amount]) => ({ name, amount }));
            if (entries.length === 0) {
                // API henüz dönmediyse placeholder göster
                return [
                    { name: "Çöp Toplama", amount: 0 },
                    { name: "Elektrikler Kesik", amount: 0 },
                    { name: "Kanalizasyon Taşmış", amount: 0 },
                ];
            }
            return entries;
        } catch {
            return [
                { name: "Çöp Toplama", amount: 0 },
                { name: "Elektrikler Kesik", amount: 0 },
                { name: "Kanalizasyon Taşmış", amount: 0 },
            ];
        }
    })();

    return (
        <>
            {/* İstatistik Kartları (UI aynı) */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Toplam Kullanıcı" value={totalUsers} color="blue" />
                <StatCard title="Toplam Şikayet" value={totalComplaints} color="green" />
                <StatCard title="Çözülen Şikayetler" value={resolvedComplaints} color="purple" />
                <StatCard title="Bekleyen Şikayetler" value={pendingComplaints} color="orange" />
            </section>

            {/* Harita + Tablo (UI aynı) */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Harita */}
                <div className="bg-white p-0 rounded-lg shadow-lg lg:col-span-2 h-[400px]">
                    <div ref={mapRef} className="w-full h-full rounded-lg shadow-lg"></div>
                </div>

                {/* Tablo */}
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold mb-4">
                        Şikayet Türlerine Göre Dağılım
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={typeDistribution}
                                    dataKey="amount"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label
                                >
                                    {typeDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>
        </>
    );
}

/* Kart Bileşeni */
function StatCard({ title, value, color }) {
    const colorMap = {
        blue: "text-blue-500",
        green: "text-green-500",
        purple: "text-purple-500",
        orange: "text-orange-500",
    };
    return (
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-gray-500 text-sm">{title}</h3>
            <p className={`text-2xl font-bold ${colorMap[color]}`}>{value}</p>
        </div>
    );
}

