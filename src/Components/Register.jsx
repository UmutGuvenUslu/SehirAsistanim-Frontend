import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "react-router-dom";
import Modal from "./Modal";
import axios from "axios";
import photo from "./photo.jpg";

// Zod validasyon şeması
const schema = z
  .object({
    Isim: z.string().min(1, "İsim gerekli"),
    Soyisim: z.string().min(1, "Soyisim gerekli"),
    TC: z.string().length(11, "TC 11 haneli olmalıdır"),
    Email: z.string().email("Geçerli email girin"),
    TelefonNo: z.string().optional(),
    Cinsiyet: z.string().optional(),
    DogumTarihi: z.string().optional(),
    Sifre: z.string().min(6, "Şifre en az 6 karakter olmalı"),
    SifreTekrar: z.string().min(6, "Şifre tekrarı gerekli"),
  })
  .refine((data) => data.Sifre === data.SifreTekrar, {
    message: "Şifreler eşleşmiyor",
    path: ["SifreTekrar"],
  });

export default function Register() {
  const [showModal, setShowModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [formData, setFormData] = useState(null); // Axios için veriyi sakla

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await axios.post(
        "https://sehirasistanim-backend-production.up.railway.app/api/auth/send-verification-code",
        null,
        {
          params: { email: data.Email },
        }
      );
      setFormData(data); // Kod doğrulaması sonrası kullanılmak üzere sakla
      setShowModal(true);
    } catch (err) {
      alert("Kod gönderilirken hata oluştu: " + err.response?.data?.message);
    }
  };

  const handleVerifyAndRegister = async () => {
    try {
      const response = await axios.post(
        "https://sehirasistanim-backend-production.up.railway.app/api/auth/verify-and-register",
        {
          ...formData,
          Kod: verificationCode,
        }
      );
      alert("Kayıt başarılı: " + response.data.message);
      setShowModal(false);
    } catch (err) {
      alert("Kayıt başarısız: " + err.response?.data?.message);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white">
      {/* Sol alan */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-r from-slate-500 to-zinc-900 text-white flex-col justify-center items-center px-10 py-12 space-y-6">
        <div className="max-w-md text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Şehir Asistanım'a Hoş Geldiniz!
          </h1>
          <p className="text-gray-300">
            Vatandaş odaklı Coğrafi Bilgi Sistemi desteğiyle şehirdeki sorunları
            kolayca bildirebilir, çözümleri takip edebilirsiniz. Hızlı,
            şeffaf ve etkili bir iletişim için şimdi kayıt olun.
          </p>
        </div>

        <img
          src={photo}
          alt="ŞehirAsistanım Görseli"
          className="w-full max-w-xl rounded-xl shadow-lg"
        />
      </div>

      {/* Sağ form alanı */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-12 min-h-screen">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">Kayıt Ol</h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            Haydi sen de kayıt ol ve sorunlarının çözümlerine ulaş!
          </p>

          <div className="flex items-center my-4">
            <hr className="flex-grow border-gray-300" />
            <span className="mx-4">Kayıt Ol</span>
            <hr className="flex-grow border-gray-300" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <input {...register("Isim")} placeholder="Adınız" className="w-full border border-gray-300 rounded px-3 py-2" />
              <p className="text-red-500 text-sm">{errors.Isim?.message}</p>
            </div>

            <div>
              <input {...register("Soyisim")} placeholder="Soyadınız" className="w-full border border-gray-300 rounded px-3 py-2" />
              <p className="text-red-500 text-sm">{errors.Soyisim?.message}</p>
            </div>

            <div>
              <input {...register("TC")} placeholder="TC Kimlik No (11 hane)" maxLength={11} className="w-full border border-gray-300 rounded px-3 py-2" />
              <p className="text-red-500 text-sm">{errors.TC?.message}</p>
            </div>

            <div>
              <input type="email" {...register("Email")} placeholder="Email adresiniz" className="w-full border border-gray-300 rounded px-3 py-2" />
              <p className="text-red-500 text-sm">{errors.Email?.message}</p>
            </div>

            <div>
              <input {...register("TelefonNo")} placeholder="05xx xxx xx xx" className="w-full border border-gray-300 rounded px-3 py-2" />
              <p className="text-red-500 text-sm">{errors.TelefonNo?.message}</p>
            </div>

            <select {...register("Cinsiyet")} className="w-full border border-gray-300 rounded px-3 py-2 text-gray-500">
              <option value="">Cinsiyet seçiniz</option>
              <option value="Kadın">Kadın</option>
              <option value="Erkek">Erkek</option>
              <option value="Belirtmek istemiyorum">Belirtmek istemiyorum</option>
            </select>

            <input type="date" {...register("DogumTarihi")} className="w-full border border-gray-300 rounded px-3 py-2" />

            <div>
              <input type="password" {...register("Sifre")} placeholder="Şifrenizi girin" className="w-full border border-gray-300 rounded px-3 py-2" />
              <p className="text-red-500 text-sm">{errors.Sifre?.message}</p>
            </div>

            <div>
              <input type="password" {...register("SifreTekrar")} placeholder="Şifrenizi tekrar girin" className="w-full border border-gray-300 rounded px-3 py-2" />
              <p className="text-red-500 text-sm">{errors.SifreTekrar?.message}</p>
            </div>

            <button type="submit" className="w-full bg-black text-white py-2 rounded hover:bg-gray-700 transition">
              Kayıt Ol
            </button>
          </form>

          <p className="text-sm text-center mt-6">
            Zaten bir hesabınız var mı?{" "}
            <Link to="/girisyap" className="text-orange-500 hover:underline">Giriş Yap</Link>
          </p>
        </div>
      </div>

      {showModal && (
        <Modal
          code={verificationCode}
          setCode={setVerificationCode}
          onConfirm={handleVerifyAndRegister}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
