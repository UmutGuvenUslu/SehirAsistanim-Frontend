import React, { useState } from "react";
import Navbar from "../Components/Navbar";
import UserMap from "../Components/UserMap";

export default function MainLayout() {
  // Arama sonucundan gelen koordinatı tutuyoruz
  const [selectedCoord, setSelectedCoord] = useState(null);

  return (
    <>
      {/* Navbar'a arama sonucu callback'i veriyoruz */}
      <Navbar onSearchResult={setSelectedCoord} />

      {/* UserMap'e seçili koordinatı ve sürüklemede güncelleme fonksiyonunu veriyoruz */}
      <UserMap selectedCoordinate={selectedCoord} onCoordinateSelect={setSelectedCoord} />
    </>
  );
}
