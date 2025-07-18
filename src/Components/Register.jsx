import React from "react";
import { Link,Links } from "react-router-dom";
import photo from "./photo.jpg"; 

export default function Register() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white">
      {/* Sol tanıtım alanı - sadece md ve üstü ekranlarda görünür */}
  <div className="hidden md:flex md:w-1/2 bg-gradient-to-r from-slate-500 to-zinc-900 text-white flex-col justify-center items-center px-10 py-12 space-y-6">
     <div className="max-w-md text-center">
    <h1 className="text-3xl md:text-4xl font-bold mb-4">
      Şehir Asistanım'a Hoş Geldiniz!
    </h1>
    <p className="text-gray-300">
      Vatandaş odaklı Coğrafi Bilgi Sistemi desteğiyle şehirdeki sorunları kolayca bildirebilir,
      çözümleri takip edebilirsiniz. Hızlı, şeffaf ve etkili bir iletişim için şimdi kayıt olun.
    </p>
  </div>

  <img
    src={photo}
    alt="ŞehirAsistanım Görseli"
    className="w-full max-w-xl rounded-xl shadow-lg"
  />
  {/* Buse */}
  {/* Alt ikonlar (isteğe bağlı) */}
  <div className="flex justify-center space-x-3 mt-6">
    {/*<img src="https://cdn.simpleicons.org/html5" alt="html" className="w-6 h-6" />*/}
  </div>
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

    {/* Form alanı */}
   <form className="space-y-4">
  <input
    type="text"
    name="Isim"
    placeholder="Adınız"
    className="w-full border border-gray-300 rounded px-3 py-2"
    required
  />

  <input
    type="text"
    name="Soyisim"
    placeholder="Soyadınız"
    className="w-full border border-gray-300 rounded px-3 py-2"
    required
  />

  <input
    type="text"
    name="TC"
    placeholder="TC Kimlik No (11 hane)"
    maxLength={11}
    className="w-full border border-gray-300 rounded px-3 py-2"
    required
  />

  <input
    type="email"
    name="Email"
    placeholder="Email adresiniz"
    className="w-full border border-gray-300 rounded px-3 py-2"
    required
  />

  <input
    type="tel"
    name="TelefonNo"
    placeholder="05xx xxx xx xx"
    className="w-full border border-gray-300 rounded px-3 py-2"
  />

  <select
    name="Cinsiyet"
    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-500"
  >
    <option value="">Cinsiyet seçiniz</option>
    <option value="Kadın">Kadın</option>
    <option value="Erkek">Erkek</option>
    <option value="Belirtmek istemiyorum">Belirtmek istemiyorum</option>
  </select>

  <input
    type="date"
    name="DogumTarihi"
    className="w-full border border-gray-300 rounded px-3 py-2"
  />

  <input
    type="password"
    name="Sifre"
    placeholder="Şifrenizi girin"
    className="w-full border border-gray-300 rounded px-3 py-2"
    required
  />

  <input
    type="password"
    name="SifreTekrar"
    placeholder="Şifrenizi tekrar girin"
    className="w-full border border-gray-300 rounded px-3 py-2"
    required
  />

  {/* <div className="flex items-center justify-between text-sm">
    <label className="flex items-center space-x-2">
      <input type="checkbox" className="form-checkbox" />
      <span>Beni Hatırla</span>
    </label>
    <a href="#" className="text-purple-600 hover:underline">
      Şifremi Unuttum?
    </a>
  </div> */}

  <button
    type="submit"
    className="w-full bg-black text-white py-2 rounded hover:bg-gray-700 transition"
  >
    Kayıt Ol
  </button>
</form>


    <p className="text-sm text-center mt-6">
      Zaten bir hesabınız var mı ?{" "}
      <Link to="/girisyap" href="#" className="text-orange-500 hover:underline">
        Giriş Yap
      </Link>
    </p>
  </div>
</div>

    </div>
  );
}
