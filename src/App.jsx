import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './Components/Login';
import Register from './Components/Register';
import './App.css';
import Navbar from './Components/Navbar';

function App() {
  return (
    <>
      <div>
        <Navbar />
        <Routes>
          <Route path="/" element={<Register />} />
          <Route path="/girisyap" element={<Login />} />
          <Route path="/kayitol" element={<Register />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
