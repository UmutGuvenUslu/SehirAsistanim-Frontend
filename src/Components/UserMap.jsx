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
import { defaults as defaultControls } from 'ol/control';

const UserMap = ({ selectedCoordinate, onCoordinateSelect }) => {
    const mapRef = useRef();
    const mapObjRef = useRef(null);
    const vectorSourceRef = useRef(null);

    const [locationError, setLocationError] = useState("");

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
            controls: defaultControls({ zoom: false }), // zoom kontrollerini kapatır
        });
        mapObjRef.current = map;

        // Konum alma işlemi
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lon = position.coords.longitude;
                    const lat = position.coords.latitude;
                    const userCoord = fromLonLat([lon, lat]);

                    // Eğer başlangıçta seçili koordinat yoksa kullanıcı konumunu göster
                    if (!selectedCoordinate) {
                        addDraggableMarker(userCoord);
                        map.getView().animate({ center: userCoord, zoom: 14 });
                        onCoordinateSelect?.([lon, lat]);
                    }

                    setLocationError("");
                },
                (error) => {
                    console.warn("Konum alınamadı, Türkiye zoomunda kalacak:", error);
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
    }, []); // sadece mount ve unmount

    // Haritada marker ve sürükleme işlemi için fonksiyon
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

        // Önceki Translate kaldır
        mapObjRef.current.getInteractions().forEach((interaction) => {
            if (interaction instanceof Translate) {
                mapObjRef.current.removeInteraction(interaction);
            }
        });

        const translate = new Translate({ features: vectorSourceRef.current.getFeaturesCollection() });
        mapObjRef.current.addInteraction(translate);

        translate.on("translateend", (e) => {
            const geom = e.features.item(0).getGeometry();
            const newCoord = toLonLat(geom.getCoordinates());
            onCoordinateSelect?.(newCoord);
        });
    };

    // selectedCoordinate değiştiğinde haritayı güncelle
    useEffect(() => {
        if (!selectedCoordinate || !mapObjRef.current) return;

        const coord = fromLonLat(selectedCoordinate);
        mapObjRef.current.getView().animate({ center: coord, zoom: 16 });
        addDraggableMarker(coord);
    }, [selectedCoordinate]);

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

            <div
                ref={mapRef}
                style={{ width: "100%", height: "100%", borderRadius: "8px", overflow: "hidden" }}
            />
        </div>
    );
};

export default UserMap;
