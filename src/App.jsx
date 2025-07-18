import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Components/Login';
import Register from './Components/Register';
import './App.css';

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
    </>
  );
}

export default App;
