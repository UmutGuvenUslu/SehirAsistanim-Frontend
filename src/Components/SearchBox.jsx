import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { getDistance } from "geolib";

const SearchBox = ({ onSearchResult, userLocation }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [locationError, setLocationError] = useState("");

    const wrapperRef = useRef(null);
    const LIMIT_RADIUS = 25000; // 25 km in meters

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setShowDropdown(false);
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            setError("");
            try {
                const response = await axios.get(
                    "https://nominatim.openstreetmap.org/search",
                    {
                        params: {
                            q: query,
                            format: "json",
                            addressdetails: 1,
                            limit: 10, // Daha fazla sonuç alalım ki filtreleyebilelim
                            countrycodes: "tr",
                        },
                    }
                );
                
                // Kullanıcı konumuna göre filtreleme yap
                let filteredResults = response.data;
                if (userLocation) {
                    filteredResults = response.data.filter(place => {
                        const distance = getDistance(
                            { latitude: userLocation[1], longitude: userLocation[0] },
                            { latitude: parseFloat(place.lat), longitude: parseFloat(place.lon) }
                        );
                        return distance <= LIMIT_RADIUS;
                    });
                }

                // En fazla 5 sonuç göster
                setResults(filteredResults.slice(0, 5));
                setShowDropdown(true);

                if (userLocation && filteredResults.length === 0) {
                    setLocationError("Aradığınız konum bulunamadı veya 25 km sınırının dışında kaldı.");
                } else {
                    setLocationError("");
                }
            } catch {
                setError("Arama sırasında hata oluştu.");
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchResults, 300);
        return () => clearTimeout(timeoutId);
    }, [query, userLocation]);

    const handleSelect = (place) => {
        setQuery(place.display_name);
        setShowDropdown(false);
        const lon = parseFloat(place.lon);
        const lat = parseFloat(place.lat);
        onSearchResult([lon, lat]);
    };

    return (
        <div
            ref={wrapperRef}
            style={{
                background: "transparent",
                padding: 8,
                position: "relative",
                width: "100%",
            }}
        >
            <input
                type="text"
                placeholder="Adres veya yer ara..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query && setShowDropdown(true)}
                style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: 14,
                    borderRadius: 6,
                    border: "1px solid #ccc",
                }}
                autoFocus
            />

            {loading && <div style={{ marginTop: 4, fontSize: 12 }}>Aranıyor...</div>}

            {error && (
                <div style={{ color: "red", marginTop: 4, fontSize: 12 }}>{error}</div>
            )}

            {locationError && (
                <div style={{ color: "orange", marginTop: 4, fontSize: 12 }}>{locationError}</div>
            )}

            {showDropdown && results.length > 0 && (
                <ul
                    style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        maxHeight: 200,
                        overflowY: "auto",
                        backgroundColor: "white",
                        border: "1px solid #ccc",
                        borderRadius: "0 0 6px 6px",
                        zIndex: 1000,
                        marginTop: 2,
                        padding: 0,
                        listStyle: "none",
                    }}
                >
                    {results.map((place) => (
                        <li
                            key={place.place_id}
                            onClick={() => handleSelect(place)}
                            style={{
                                padding: "8px",
                                cursor: "pointer",
                                borderBottom: "1px solid #eee",
                            }}
                            onMouseDown={(e) => e.preventDefault()}
                        >
                            {place.display_name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SearchBox;