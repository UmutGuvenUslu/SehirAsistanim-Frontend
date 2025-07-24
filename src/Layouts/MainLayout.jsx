import React, { useState } from "react";
import Navbar from "../Components/Navbar";
import UserMap from "../Components/UserMap";
import { Outlet, useLocation } from "react-router-dom";

export default function MainLayout() {
  const [selectedCoord, setSelectedCoord] = useState(null);
  const location = useLocation(); // Şu anki URL'i alır

  return (
    <>
      <Navbar onSearchResult={setSelectedCoord} />

      {/* Sadece anasayfada çalışsın */}
      {location.pathname === "/" && (
        <UserMap
          selectedCoordinate={selectedCoord}
          onCoordinateSelect={setSelectedCoord}
        />
      )}

      {/* Alt sayfaları buraya yerleştiriyoruz */}
      <div>
      <Outlet />
      </div>
    </>
  );
}
