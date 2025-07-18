import React, { useState } from "react";
import { Link } from "react-router-dom";
import photo from "./photo.jpg";
import Modal from "./Modal";
import axios from "axios";

export default function Register() {
  const [form, setForm] = useState({
    Isim: "", Soyisim: "", TC: "", Email: "", TelefonNo: "",
    Cinsiyet: "", DogumTarihi: "", Sifre: "", SifreTekrar: ""
  });
  const [showModal, setShowModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("https://localhost:7272/api/auth/send-verification-code", null, {
        params: { email: form.Email }
      });
      setShowModal(true);
    } catch (err) {
      alert("Kod gönderilirken hata oluştu: " + err.response?.data?.message);
    }
  };

  const handleVerifyAndRegister = async () => {
    try {
      const response = await axios.post("https://localhost:7272/api/auth/verify-and-register", {
        ...form,
        Kod: verificationCode
      });
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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            ŞehirAsistanım CBS Yardım Sistemi’ne Hoş Geldiniz!
          </h1>
          <p className="text-gray-300">
            Vatandaş odaklı Coğrafi Bilgi Sistemi desteğiyle şehirdeki sorunları kolayca bildirebilir,
            çözümleri takip edebilirsiniz. Hızlı, şeffaf ve etkili bir iletişim için şimdi kayıt olun.
          </p>
        </div>
        <img src={photo} alt="ŞehirAsistanım" className="w-full max-w-md rounded-xl shadow-lg" />
        <div className="flex justify-center space-x-3 mt-6">
          <img src="https://cdn.simpleicons.org/html5" alt="html" className="w-6 h-6" />
          <img src="https://cdn.simpleicons.org/tailwindcss" alt="tailwind" className="w-6 h-6" />
          <img src="https://cdn.simpleicons.org/react" alt="react" className="w-6 h-6" />
          <img src="https://cdn.simpleicons.org/nextdotjs" alt="next" className="w-6 h-6" />
        </div>
      </div>

      {/* Sağ Form */}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" name="Isim" placeholder="Adınız" className="w-full border rounded px-3 py-2" required onChange={handleChange} />
            <input type="text" name="Soyisim" placeholder="Soyadınız" className="w-full border rounded px-3 py-2" required onChange={handleChange} />
            <input type="text" name="TC" placeholder="TC Kimlik No (11 hane)" maxLength={11} className="w-full border rounded px-3 py-2" required onChange={handleChange} />
            <input type="email" name="Email" placeholder="Email adresiniz" className="w-full border rounded px-3 py-2" required onChange={handleChange} />
            <input type="tel" name="TelefonNo" placeholder="05xx xxx xx xx" className="w-full border rounded px-3 py-2" onChange={handleChange} />
            <select name="Cinsiyet" className="w-full border rounded px-3 py-2 text-gray-500" onChange={handleChange}>
              <option value="">Cinsiyet seçiniz</option>
              <option value="Kadın">Kadın</option>
              <option value="Erkek">Erkek</option>
              <option value="Belirtmek istemiyorum">Belirtmek istemiyorum</option>
            </select>
            <input type="date" name="DogumTarihi" className="w-full border rounded px-3 py-2" onChange={handleChange} />
            <input type="password" name="Sifre" placeholder="Şifrenizi girin" className="w-full border rounded px-3 py-2" required onChange={handleChange} />
            <input type="password" name="SifreTekrar" placeholder="Şifrenizi tekrar girin" className="w-full border rounded px-3 py-2" required onChange={handleChange} />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="form-checkbox" />
                <span>Beni Hatırla</span>
              </label>
              <a href="#" className="text-purple-600 hover:underline">Şifremi Unuttum?</a>
            </div>

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
