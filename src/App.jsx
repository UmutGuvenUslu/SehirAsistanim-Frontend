import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Components/Login';
import Register from './Components/Register';
import './App.css';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from './Components/Navbar';
import Navbar2 from './Components/Navbar2';

function App() {
  return (
    <>
     
    <div>
    <Navbar2/>
    <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/girisyap" element={<Login />} />
        <Route path="/kayitol" element={<Register />} />
    </Routes>
    </div>
    {/* Toastify'ı global olarak ekliyoruz */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
      />
    </>
  );
}

export default App;
