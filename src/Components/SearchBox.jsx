import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const SearchBox = ({ onSearchResult }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);

    const wrapperRef = useRef(null);

    // Sayfa dışında tıklanınca dropdown'u kapatmak için:
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Sorgu değiştikçe sonuçları getir
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
                const response = await axios.get("https://nominatim.openstreetmap.org/search", {
                    params: {
                        q: query,
                        format: "json",
                        addressdetails: 1,
                        limit: 5, // En fazla 5 sonuç göster
                        countrycodes: "tr",
                    },
                });
                setResults(response.data);
                setShowDropdown(true);
            } catch {
                setError("Arama sırasında hata oluştu.");
            } finally {
                setLoading(false);
            }
        };

        // 300ms debounce ile istek gönderelim (fazla istek önlemek için)
        const timeoutId = setTimeout(fetchResults, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    // Bir sonucu seçince
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
                background: "white",
                padding: 8,
                borderRadius: 6,
                boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
                position: "relative",
                width: 300,
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
                    padding: "6px 8px",
                    fontSize: 14,
                    borderRadius: 4,
                    border: "1px solid #ccc",
                }}
            />

            {loading && <div style={{ marginTop: 4, fontSize: 12 }}>Aranıyor...</div>}

            {error && (
                <div style={{ color: "red", marginTop: 4, fontSize: 12 }}>
                    {error}
                </div>
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
                            onMouseDown={(e) => e.preventDefault()} // Input focus kaybını önler
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