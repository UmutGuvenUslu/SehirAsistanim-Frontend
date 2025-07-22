import { useState } from "react";
import userImg from "../user.png"; // Profil resmi (mevcut resim)

export default function AdminProfile() {
    const [user, setUser] = useState({
        name: "Ahmet Yılmaz",
        email: "ahmet@example.com",
        role: "Admin",
    });

    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const handleSavePassword = () => {
        if (!password || !newPassword) {
            alert("Lütfen tüm alanları doldurun.");
            return;
        }
        alert("Şifre başarıyla güncellendi! (Backend entegrasyonu eklenebilir.)");
        setPassword("");
        setNewPassword("");
    };

    return (
        <div className="flex justify-center items-center min-h-[80vh]">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full space-y-8">
                {/* Profil Başlığı */}
                <div className="flex items-center gap-6">
                    <img
                        src={userImg}
                        alt="Profil"
                        className="w-24 h-24 rounded-full"
                    />
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">{user.name}</h2>
                        <p className="text-gray-600">{user.email}</p>
                        <span className="inline-block mt-2 px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-full">
                            {user.role}
                        </span>
                    </div>
                </div>

                {/* Şifre Değiştirme Alanı */}
                <div className="space-y-4">
                    <h3 className="text-2xl font-semibold text-gray-700">Şifre Değiştir</h3>
                    <div>
                        <label className="block text-gray-600 text-sm mb-1">Mevcut Şifre</label>
                        <input
                            type="password"
                            placeholder="Mevcut Şifre"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="border p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600 text-sm mb-1">Yeni Şifre</label>
                        <input
                            type="password"
                            placeholder="Yeni Şifre"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="border p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                    </div>
                    <button
                        onClick={handleSavePassword}
                        className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
                    >
                        Şifreyi Güncelle
                    </button>
                </div>
            </div>
        </div>
    );
}
