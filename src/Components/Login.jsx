import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import photo from "./photo.jpg";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
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
      const response = await axios.post(
        "https://sehirasistanim-backend-production.up.railway.app/api/auth/login",
        {
          email: form.email,
          password: form.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        alert("Giriş başarılı! Hoşgeldiniz " + (response.data.fullName || ""));
        navigate("/");
      } else {
        setError("Giriş başarısız: Token alınamadı.");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Giriş sırasında hata oluştu.");
      } else {
        setError("Bilinmeyen bir hata oluştu.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white">
      {/* Sol tanıtım alanı */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-r from-slate-500 to-zinc-900 text-white flex-col justify-center items-center px-10 py-12 space-y-6">
        <div className="max-w-md text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Şehir Asistanım</h1>
          <p className="text-gray-300">
            Sisteme giriş yaparak şehrinizdeki sorunları takip edebilir,
            bildirimlerinizi yönetebilirsiniz. Giriş yap ve şehrinin gelişmesine katkı sağla!
          </p>
        </div>
        <img
          src={photo}
          alt="ŞehirAsistanım Görseli"
          className="w-full max-w-xl rounded-xl shadow-lg"
        />
        <div className="flex justify-center space-x-3 mt-6">
          {/* Ek ikonlar buraya eklenebilir */}
        </div>
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
              type="email"
              name="email"
              placeholder="Email adresiniz"
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
              value={form.email}
              onChange={handleChange}
            />

            <input
              type="password"
              name="password"
              placeholder="Şifreniz"
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
              value={form.password}
              onChange={handleChange}
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="form-checkbox accent-orange-500" />
                <span>Beni hatırla</span>
              </label>
              <a href="#" className="text-orange-500 hover:underline">
                Şifremi unuttum?
              </a>
            </div>

            {error && (
              <p className="text-red-600 text-center text-sm">{error}</p>
            )}

            <button
              type="submit"
              className={`w-full bg-black text-white py-2 rounded hover:bg-gray-700 transition ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>

          <p className="text-sm text-center mt-6">
            Hesabın yok mu?{" "}
            <Link to="/kayitol" className="text-orange-500 hover:underline">
              Kayıt Ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
