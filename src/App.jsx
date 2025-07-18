import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './Components/Login';
import Register from './Components/Register';
import './App.css';
import Navbar from './Components/Navbar';
import SikayetlerimMap from './Components/SikayetlerimMap';

function App() {
  return (
    <>
      <div>
        <Navbar />
        <Routes>
          <Route path="/" element={<Register />} />
          <Route path="/girisyap" element={<Login />} />
          <Route path="/kayitol" element={<Register />} />
          <Route path="/sikayetlerim" element={<SikayetlerimMap />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
