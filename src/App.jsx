import React from 'react';
import { Routes, Route } from 'react-router-dom';  // sadece Routes ve Route al
import Login from './Components/Login';
import Register from './Components/Register';
import './App.css';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import AuthLayout from './Layouts/AuthLayout';
import MainLayout from './Layouts/MainLayout';

function App() {
  return (
    <>
      <Routes>
        {/* Auth sayfaları */}
        <Route element={<AuthLayout />}>
          <Route path="/girisyap" element={<Login />} />
          <Route path="/kayitol" element={<Register />} />
        </Route>

        {/* Genel sayfalar */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Register />} />
        </Route>
      </Routes>

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
