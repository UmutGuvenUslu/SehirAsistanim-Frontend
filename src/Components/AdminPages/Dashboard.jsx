import { useEffect, useRef } from "react";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import "ol/ol.css";

export default function Dashboard() {
    const mapRef = useRef(null);

    useEffect(() => {
        if (!mapRef.current) return;

        const map = new Map({
            target: mapRef.current,
            layers: [new TileLayer({ source: new OSM(), attributions: [] })],
            view: new View({
                center: fromLonLat([35.2433, 38.9637]),
                zoom: 6,
            }),
            controls: [],
        });

        return () => map.setTarget(undefined);
    }, []);

    return (
        <>
            {/* İstatistik Kartları */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Toplam Kullanıcı" value="1.250" color="blue" />
                <StatCard title="Toplam Şikayet" value="320" color="green" />
                <StatCard title="Çözülen Şikayetler" value="450" color="purple" />
                <StatCard title="Bekleyen Şikayetler" value="240" color="orange" />
            </section>

            {/* Harita + Tablo */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Harita */}
                <div className="bg-white p-0 rounded-lg shadow-lg lg:col-span-2 h-[400px]">
                    <div ref={mapRef} className="w-full h-full rounded-lg shadow-lg"></div>
                </div>

                {/* Tablo */}
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold mb-4">
                        Şikayet Türüne Göre Dağılım
                    </h3>
                    <div className="overflow-x-auto max-h-64 overflow-y-auto">
                        <table className="w-full text-sm text-left text-gray-600 border-collapse">
                            <thead className="text-xs uppercase bg-gray-100 hidden md:table-header-group">
                                <tr>
                                    <th className="px-4 py-2">Şikayet Türü</th>
                                    <th className="px-4 py-2">Şikayet Sayısı</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { name: "Çöp Toplama", amount: 100 },
                                    { name: "Elektrikler Kesik", amount: 98 },
                                    { name: "Kanalizasyon Taşmış", amount: 47 },
                                ].map((item, idx) => (
                                    <tr
                                        key={idx}
                                        className="border-b block md:table-row md:border-0 mb-4 md:mb-0"
                                    >
                                        <td className="px-4 py-2 font-medium block md:table-cell">
                                            {item.name}
                                        </td>
                                        <td className="px-4 py-2 text-gray-700 block md:table-cell">
                                            {item.amount}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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

