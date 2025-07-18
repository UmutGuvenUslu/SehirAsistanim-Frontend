import React, { useState } from "react";
import { Link } from "react-router-dom";
import photo from "./photo.jpg";
import Modal from "./Modal";
import axios from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// ZOD ŞEMA
const schema = z.object({
  Isim: z.string().min(2, "Adınız en az 2 karakter olmalı"),
  Soyisim: z.string().min(2, "Soyadınız en az 2 karakter olmalı"),
  TC: z.string().length(11, "TC Kimlik No 11 hane olmalı"),
  Email: z.string().email("Geçerli bir email girin"),
  TelefonNo: z.string().optional().refine(
    val => !val || (/^\d{10,11}$/.test(val)), {
      message: "Telefon numarası 10-11 hane olmalı"
    }),
  Cinsiyet: z.string().optional(),
  DogumTarihi: z.string().optional(),
  Sifre: z.string().min(6, "Şifre en az 6 karakter olmalı"),
  SifreTekrar: z.string()
}).refine(data => data.Sifre === data.SifreTekrar, {
  message: "Şifreler uyuşmuyor",
  path: ["SifreTekrar"]
});

export default function Register() {
  const [showModal, setShowModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const { register, handleSubmit, formState: { errors }, getValues } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data) => {
    try {
      await axios.post("https://sehirasistanim-backend-production.up.railway.app/api/auth/send-verification-code", null, {
        params: { email: data.Email }
      });
      setShowModal(true);
    } catch (err) {
      alert("Kod gönderilirken hata oluştu: " + err.response?.data?.message);
    }
  };

  const handleVerifyAndRegister = async () => {
    try {
      const data = { ...getValues(), Kod: verificationCode };
      const response = await axios.post("https://sehirasistanim-backend-production.up.railway.app/api/auth/verify-and-register", data);
      alert("Kayıt başarılı: " + response.data.message);
      setShowModal(false);
    } catch (err) {
      alert("Kayıt başarısız: " + err.response?.data?.message);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white">
      {/* Sol Tanıtım */}
      <div className="hidden md:flex md:w-1/2 bg-purple-800 text-white flex-col justify-center items-center px-10 py-12 space-y-6">
        <div className="max-w-md text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">ŞehirAsistanım CBS Yardım Sistemi’ne Hoş Geldiniz!</h1>
          <p className="text-gray-300">Vatandaş odaklı Coğrafi Bilgi Sistemi desteğiyle şehirdeki sorunları kolayca bildirebilir, çözümleri takip edebilirsiniz.</p>
        </div>
        <img src={photo} alt="ŞehirAsistanım" className="w-full max-w-md rounded-xl shadow-lg" />
      </div>

      {/* Sağ Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-12 min-h-screen">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">Kayıt Ol</h2>
          <p className="text-sm text-gray-500 text-center mb-6">Haydi sen de kayıt ol ve sorunlarının çözümlerine ulaş!</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input {...register("Isim")} placeholder="Adınız" className="w-full border rounded px-3 py-2" />
            <p className="text-red-500 text-sm">{errors.Isim?.message}</p>

            <input {...register("Soyisim")} placeholder="Soyadınız" className="w-full border rounded px-3 py-2" />
            <p className="text-red-500 text-sm">{errors.Soyisim?.message}</p>

            <input {...register("TC")} placeholder="TC Kimlik No (11 hane)" maxLength={11} className="w-full border rounded px-3 py-2" />
            <p className="text-red-500 text-sm">{errors.TC?.message}</p>

            <input type="email" {...register("Email")} placeholder="Email adresiniz" className="w-full border rounded px-3 py-2" />
            <p className="text-red-500 text-sm">{errors.Email?.message}</p>

            <input {...register("TelefonNo")} placeholder="05xx xxx xx xx" className="w-full border rounded px-3 py-2" />
            <p className="text-red-500 text-sm">{errors.TelefonNo?.message}</p>

            <select {...register("Cinsiyet")} className="w-full border rounded px-3 py-2 text-gray-500">
              <option value="">Cinsiyet seçiniz</option>
              <option value="Kadın">Kadın</option>
              <option value="Erkek">Erkek</option>
              <option value="Belirtmek istemiyorum">Belirtmek istemiyorum</option>
            </select>

            <input type="date" {...register("DogumTarihi")} className="w-full border rounded px-3 py-2" />

            <input type="password" {...register("Sifre")} placeholder="Şifrenizi girin" className="w-full border rounded px-3 py-2" />
            <p className="text-red-500 text-sm">{errors.Sifre?.message}</p>

            <input type="password" {...register("SifreTekrar")} placeholder="Şifrenizi tekrar girin" className="w-full border rounded px-3 py-2" />
            <p className="text-red-500 text-sm">{errors.SifreTekrar?.message}</p>

            <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition">Kayıt Ol</button>
          </form>

          <p className="text-sm text-center mt-6">
            Zaten bir hesabınız var mı?{" "}
            <Link to="/girisyap" className="text-purple-600 hover:underline">Giriş Yap</Link>
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
