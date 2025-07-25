import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import photo from "./photo.jpg";
import { toast } from "react-toastify";

const schema = z.object({
  email: z.string().email("Geçerli bir email girin"),
  password: z.string(),
});

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
  setError("");
  setLoading(true);

  try {
    const response = await axios.post(
      "https://sehirasistanim-backend-production.up.railway.app/api/auth/login",
      {
        email: data.email,
        password: data.password,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.token) {
      const expiry = Date.now() + 60 * 60 * 1000; 
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("tokenExpiry", expiry.toString());

      if (response.data.fullName) {
        localStorage.setItem("userName", response.data.fullName);
      }

      toast.success("Giriş başarılı! Hoşgeldiniz " + (response.data.fullName || ""));
      window.location.href = "/";     
    } else {
      setError("Giriş başarısız: Token alınamadı.");
    }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      // Hata mesajını tek bir error'a indirgemek için
      setError("Email adresiniz ve/veya şifreniz yanlış.");
    } else {
      setError("Bilinmeyen bir hata oluştu.");
    }
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white">
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
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-12 min-h-screen">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">Giriş Yap</h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            Şehir Asistanım hesabına giriş yaparak sistemin tüm özelliklerinden yararlanabilirsin.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <input
                type="email"
                {...register("email")}
                placeholder="Email adresiniz"
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
              <p className="text-red-500 text-sm">{errors.email?.message}</p>
            </div>

            <div>
              <input
                type="password"
                {...register("password")}
                placeholder="Şifreniz"
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            {error && (
              <p className="text-red-600 text-center text-sm">{error}</p>
            )}

            <button
              type="submit"
              className={`w-full bg-black text-white py-2 rounded hover:bg-gray-700 transition cursor-pointer ${
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
