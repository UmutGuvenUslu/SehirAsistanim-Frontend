import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import photo from "./photo.jpg";
import axios from "axios";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    EmailOrTC: "",
    Sifre: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post("https://localhost:7272/api/auth/login", {
        Email: form.EmailOrTC,
        Password: form.Sifre,
      });

      localStorage.setItem("token", response.data.token);

      alert("Giriş başarılı! Hoşgeldiniz " + response.data.fullName);

      navigate("/");

    } catch (err) {
      setError(err.response?.data?.message || "Giriş sırasında hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white">
      {/* Sol tanıtım alanı */}
      <div className="hidden md:flex md:w-1/2 bg-purple-800  text-white flex-col justify-center items-center px-10 py-12 space-y-6">
        <div className="max-w-md text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Şehir Asistanım CBS Yardım Sistemi
          </h1>
          <p className="text-gray-300 ">
            Sisteme giriş yaparak şehrinizdeki sorunları takip edebilir, bildirimlerinizi
            yönetebilirsiniz. Giriş yap, katkı sağla!
          </p>
        </div>
        <img
          src={photo}
          alt="ŞehirAsistanım Görseli"
          className="w-full max-w-md rounded-xl shadow-lg "
        />
      </div>

      {/* Sağ form alanı */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-12 min-h-screen">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">Giriş Yap</h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            Şehir Asistanım hesabına giriş yaparak sistemin tüm özelliklerinden yararlanabilirsin.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="EmailOrTC"
              placeholder="Email adresiniz veya TC Kimlik No"
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
              value={form.EmailOrTC}
              onChange={handleChange}
            />

            <input
              type="password"
              name="Sifre"
              placeholder="Şifreniz"
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
              value={form.Sifre}
              onChange={handleChange}
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="form-checkbox" />
                <span>Beni hatırla</span>
              </label>
              <a href="#" className="text-purple-600 hover:underline">
                Şifremi unuttum?
              </a>
            </div>

            {error && <p className="text-red-600 text-center">{error}</p>}

            <button
              type="submit"
              className={`w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={loading}
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>

          <p className="text-sm text-center mt-6">
            Hesabın yok mu?{" "}
            <Link to="/kayitol" className="text-purple-600 hover:underline">
              Kayıt Ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
