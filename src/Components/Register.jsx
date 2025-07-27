import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom"; // useNavigate eklendi
import Modal from "./Modal";
import axios from "axios";
import photo from "./photo.jpg";
import { toast } from "react-toastify";

// Bugünkü tarih (gelecek tarih seçimini engellemek için)
const today = new Date().toISOString().split("T")[0];

//Özel TC Validasyonu
const isValidTCKN = (tc) => {
  if (!/^[1-9][0-9]{10}$/.test(tc)) return false;

  const digits = tc.split("").map(Number);
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];

  const digit10 = ((oddSum * 7) - evenSum) % 10;
  const digit11 = digits.slice(0, 10).reduce((a, b) => a + b, 0) % 10;

  return digit10 === digits[9] && digit11 === digits[10];
};

// Zod validasyon şeması
const schema = z
  .object({
    Isim: z.string()
      .min(1, "İsim gerekli")
      .regex(/^[a-zA-ZığüşöçİĞÜŞÖÇ\s]+$/, "İsim yalnızca harflerden oluşmalı"),

    Soyisim: z.string()
      .min(1, "Soyisim gerekli")
      .regex(/^[a-zA-ZığüşöçİĞÜŞÖÇ]+$/, "Soyisim yalnızca harflerden oluşmalı"),

    TC: z.string()
      .length(11, "TC Kimlik numarası 11 haneli olmalı")
      .regex(/^[0-9]+$/, "TC Kimlik numarası sadece rakamlardan oluşmalı")
      .refine(isValidTCKN, {
        message: "Geçersiz TC Kimlik numarası",
      }),

    Email: z.string().email("Geçerli email girin"),

    TelefonNo: z.string()
      .min(1, "Telefon numarası gerekli")
      .transform((val) => val.replace(/\s/g, ''))
      .refine((val) => /^05\d{9}$/.test(val), {
        message: "Geçerli bir telefon numarası girin (05xxxxxxxxx formatında)",
      }),

    Cinsiyet: z.string()
      .min(1, "Cinsiyet seçiniz"),

    DogumTarihi: z.string()
      .min(1, "Doğum tarihi gerekli")
      .refine((date) => {
        if (!date) return false; // boşsa hata
        const inputDate = new Date(date);
        const minDate = new Date("1950-01-01");
        const today = new Date();
        return inputDate >= minDate && inputDate <= today;
      }, {
        message: "Doğum tarihi 01.01.1950'den küçük ve bugünden ileri olamaz",
      }),

    // Şifre: en az 6 karakter, bir harf, bir sayı ve sadece belirtilen özel karakterlerden biri
    Sifre: z.string()
      .min(6, "Şifre en az 6 karakter olmalı")
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&.,_-])[A-Za-z\d@$!%*?&.,_-]{6,}$/,
        "Şifre en az bir harf, bir rakam ve (@, $, !, %, *, ?, &, ., ,, _, -) karakterlerinden en az birini içermeli"
      ),

    SifreTekrar: z.string()
      .min(6, "Şifre tekrarı gerekli"),
  })
  .refine((data) => data.Sifre === data.SifreTekrar, {
    message: "Şifreler eşleşmiyor",
    path: ["SifreTekrar"],
  });


export default function Register() {
  const [showModal, setShowModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [formData, setFormData] = useState(null); // Axios için veriyi sakla
  const [loadingSubmit, setLoadingSubmit] = useState(false); // Kod gönderme için
  const [loadingVerify, setLoadingVerify] = useState(false); // Doğrulama için

  const navigate = useNavigate(); // useNavigate hook'u

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoadingSubmit(true);
    try {
      // 1. Önce e-posta kayıtlı mı kontrol et
      const checkResponse = await axios.get(
        "https://sehirasistanim-backend-production.up.railway.app/api/auth/IsEmailRegistered",
        { params: { email: data.Email } }
      );

      if (checkResponse.data.emailVar) {
        toast.error("Bu e-posta adresi zaten kayıtlı!");
        setLoadingSubmit(false);
        return; // Burada dur, doğrulama kodu göndermiyoruz
      }

      // 2. Eğer kayıtlı değilse, doğrulama kodu gönder
      await axios.post(
        "https://sehirasistanim-backend-production.up.railway.app/api/auth/send-verification-code",
        null,
        {
          params: { email: data.Email },
        }
      );
      setFormData(data); // Kod doğrulaması sonrası kullanılmak üzere sakla
      setShowModal(true);
      toast.success("Doğrulama kodu e-postanıza gönderildi!");
    } catch (err) {
      toast.error("Kod gönderilirken hata oluştu: " + err.response?.data?.message);
    } finally {
      setLoadingSubmit(false); // İşlem bitti
    }
  };

  const handleVerifyAndRegister = async () => {
    setLoadingVerify(true);
    try {
      const response = await axios.post(
        "https://sehirasistanim-backend-production.up.railway.app/api/auth/verify-and-register",
        {
          ...formData,
          Kod: verificationCode,
        }
      );
      toast.success("Kayıt başarılı: " + response.data.message);
      setShowModal(false);

      // Kayıt başarılıysa giriş sayfasına yönlendir
      navigate("/girisyap");

    } catch (err) {
      toast.error("Kayıt başarısız: " + err.response?.data?.message);
    } finally {
      setLoadingVerify(false);
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
          <h2 className="text-2xl font-bold text-center pt-10 mb-2 text-gray-800">Kayıt Ol</h2>
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

            <div>
              <select {...register("Cinsiyet")} className="w-full border border-gray-300 rounded px-3 py-2 text-gray-500">
                <option value="">Cinsiyet seçiniz</option>
                <option value="Kadın">Kadın</option>
                <option value="Erkek">Erkek</option>
                <option value="Belirtmek istemiyorum">Belirtmek istemiyorum</option>
              </select>
              <p className="text-red-500 text-sm">{errors.Cinsiyet?.message}</p>
            </div>

            {/* Doğum tarihi inputu - max bugünkü tarih */}
            <input
              type="date"
              {...register("DogumTarihi")}
              max={today} // Gelecek tarih seçimini engeller
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
            <p className="text-red-500 text-sm">{errors.DogumTarihi?.message}</p>

            <div>
              <input type="password" {...register("Sifre")} placeholder="Şifrenizi girin" className="w-full border border-gray-300 rounded px-3 py-2" />
              <p className="text-red-500 text-sm">{errors.Sifre?.message}</p>
            </div>

            <div>
              <input type="password" {...register("SifreTekrar")} placeholder="Şifrenizi tekrar girin" className="w-full border border-gray-300 rounded px-3 py-2" />
              <p className="text-red-500 text-sm">{errors.SifreTekrar?.message}</p>
            </div>

            <button
              type="submit"
              disabled={loadingSubmit} // İşlem devam ediyorsa tıklanamaz
              className={`w-full bg-black text-white py-2 rounded transition flex items-center justify-center 
                ${loadingSubmit ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-700 cursor-pointer"}`}
            >
              {loadingSubmit ? (
                // Tailwind spinner
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 000 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                  ></path>
                </svg>
              ) : null}
              {loadingSubmit ? "İşlem yapılıyor..." : "Kayıt Ol"}
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
          onCancel={() => { setShowModal(false); setVerificationCode(""); }}
          loadingVerify={loadingVerify}
        />
      )}
    </div>
  );
}
