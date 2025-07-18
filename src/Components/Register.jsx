import React, { useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import axios from "axios";

const schema = yup.object().shape({
  Isim: yup.string().required("İsim gerekli").min(3).max(30).matches(/^[^\d]+$/, "İsim sayı içeremez"),
  Soyisim: yup.string().required("Soyisim gerekli").min(2).max(30).matches(/^[^\d]+$/, "Soyisim sayı içeremez"),
  TC: yup.string().required("TC gerekli").matches(/^\d{11}$/, "TC 11 haneli sayı olmalı"),
  Email: yup.string().required("Email gerekli").email("Geçerli email girin"),
  TelefonNo: yup.string().required("Telefon gerekli").matches(/^05\d{9}$/, "05xxxxxxxxx formatında olmalı"),
  Sifre: yup.string().required("Şifre gerekli").min(4, "Şifre en az 4 karakter"),
  SifreTekrar: yup.string().oneOf([yup.ref("Sifre"), null], "Şifreler uyuşmuyor"),
});

const Register = () => {
  const [showModal, setShowModal] = useState(false);
  const [kod, setKod] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await axios.post(
        "https://sehirasistanim-backend-production.up.railway.app/api/auth/send-verification-code",
        null,
        { params: { email: data.Email } }
      );
      setShowModal(true);
    } catch (err) {
      alert("Kod gönderme hatası: " + err.response?.data?.message);
    }
  };

  const handleVerifyAndRegister = async () => {
    const formData = getValues();
    try {
      const registerDto = {
        ...formData,
        Kod: kod,
      };

      const response = await axios.post(
        "https://sehirasistanim-backend-production.up.railway.app/api/auth/verify-and-register",
        registerDto
      );

      alert("Kayıt başarılı: " + response.data.message);
      setShowModal(false);
    } catch (err) {
      alert("Kayıt başarısız: " + err.response?.data?.message);
    }
  };

  return (
    <div>
      <h2>Kayıt Ol</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input placeholder="İsim" {...register("Isim")} />
        <p>{errors.Isim?.message}</p>

        <input placeholder="Soyisim" {...register("Soyisim")} />
        <p>{errors.Soyisim?.message}</p>

        <input placeholder="TC Kimlik No" {...register("TC")} />
        <p>{errors.TC?.message}</p>

        <input placeholder="Email" {...register("Email")} />
        <p>{errors.Email?.message}</p>

        <input placeholder="Telefon (05xxxxxxxxx)" {...register("TelefonNo")} />
        <p>{errors.TelefonNo?.message}</p>

        <input type="password" placeholder="Şifre" {...register("Sifre")} />
        <p>{errors.Sifre?.message}</p>

        <input type="password" placeholder="Şifre Tekrar" {...register("SifreTekrar")} />
        <p>{errors.SifreTekrar?.message}</p>

        <button type="submit">Kayıt Ol</button>
      </form>

      {showModal && (
        <div className="modal">
          <h3>E-posta Doğrulama</h3>
          <input
            placeholder="E-posta kodunu girin"
            value={kod}
            onChange={(e) => setKod(e.target.value)}
          />
          <button onClick={handleVerifyAndRegister}>Kodu Doğrula ve Kaydol</button>
        </div>
      )}
    </div>
  );
};

export default Register;
