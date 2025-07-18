import React, { useEffect, useRef } from 'react';
import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

const SikayetlerimMap = () => {
    const mapRef = useRef();

    useEffect(() => {
        import('ol/proj').then(({ fromLonLat }) => {
            const map = new Map({
                target: mapRef.current,
                layers: [
                    new TileLayer({
                        source: new OSM(),
                    }),
                ],
                view: new View({
                    center: fromLonLat([35.0, 39.0]), // Türkiye merkezi
                    zoom: 5,
                    minZoom: 5,
                    maxZoom: 5,
                }),
                interactions: [], // hareket kısıtlamaları (scroll zoom vs. yok)
            });

            return () => map.setTarget(undefined);
        });
    }, []);

    return (
        <div
            ref={mapRef}
            style={{
                width: '100%',
                height: 'calc(100vh - 60px)', // Navbar 60px ise
                marginTop: '60px',
            }}
        />
    );
};

export default SikayetlerimMap;
