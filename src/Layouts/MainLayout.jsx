import React, { useState, useEffect } from "react";
import Navbar from "../Components/Navbar";
import UserMap from "../Components/UserMap";
import { Outlet, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { getDistance } from "geolib";

export default function MainLayout() {
  const [selectedCoord, setSelectedCoord] = useState(null);
  const [appUserLocation, setAppUserLocation] = useState(null);
  const location = useLocation();
  const LIMIT_RADIUS = 25000; // 25 km in meters

  // Kullanıcı konumunu al
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lon = position.coords.longitude;
          const lat = position.coords.latitude;
          setAppUserLocation([lon, lat]);
        },
        (error) => {
          console.error("Konum alınamadı:", error);
          toast.warning("Konum servisleri kapalı. Harita özellikleri sınırlı olabilir.");
        }
      );
    }
  }, []);

  const handleSearchResult = (coords) => {
    // Seçilen konumun kullanıcı konumuna uzaklığını kontrol et
    if (appUserLocation) {
      const distance = getDistance(
        { latitude: appUserLocation[1], longitude: appUserLocation[0] },
        { latitude: coords[1], longitude: coords[0] }
      );
      
      if (distance <= LIMIT_RADIUS) {
        setSelectedCoord(coords);
      } else {
        toast.warning("Seçtiğiniz konum 25 km sınırının dışında kaldı.");
      }
    } else {
      // Konum izni yoksa direkt kabul et
      setSelectedCoord(coords);
    }
  };

  return (
    <>
      <Navbar 
        onSearchResult={handleSearchResult} 
        userLocation={appUserLocation} 
      />

      {/* Sadece anasayfada çalışsın */}
      {location.pathname === "/" && (
        <UserMap
          selectedCoordinate={selectedCoord}
          onCoordinateSelect={setSelectedCoord}
          userLocation={appUserLocation}
        />
      )}

      {/* Alt sayfaları buraya yerleştiriyoruz */}
      <div>
        <Outlet />
      </div>
    </>
  );
}