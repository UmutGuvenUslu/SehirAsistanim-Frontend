import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Components/Login';
import Register from './Components/Register';
import './App.css';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <>
    <div>
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
