import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { PencilIcon, TrashIcon, PlusIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import Swal from "sweetalert2";
import axios from "axios";

export default function UserManagement() {
    const [search, setSearch] = useState("");
    const [data, setData] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isNew, setIsNew] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState({});

    const API_URL = "https://sehirasistanim-backend-production.up.railway.app/Kullanici";

    const roleMap = {
        0: "Vatandaş",
        1: "Belediye Çalışanı",
        2: "Admin",
    };

    const reverseRoleMap = {
        "Vatandaş": 0,
        "Belediye Çalışanı": 1,
        "Admin": 2,
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        axios
            .get(`${API_URL}/GetAll`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                const users = Array.isArray(res.data) ? res.data : [];
                const mapped = users.map((u) => ({
                    id: u.id ?? 0,
                    isim: u.isim ?? "",
                    soyisim: u.soyisim ?? "",
                    name: `${u.isim ?? ""} ${u.soyisim ?? ""}`.trim(),
                    email: u.email ?? "",
                    role: roleMap[u.rol] ?? "Vatandaş",
                    tc: u.tc ?? "",
                    sifre: u.sifre ?? "",
                }));
                setData(mapped);
            })
            .catch((err) => {
                console.error("API'den kullanıcı verisi alınamadı:", err);
                Swal.fire("Hata", "Kullanıcılar yüklenemedi.", "error");
            });
    }, []);

    const handleDelete = (id) => {
        const token = localStorage.getItem("token");
        const user = data.find((u) => u.id === id);
        Swal.fire({
            title: `${user?.name} silinsin mi?`,
            text: "Bu işlem geri alınamaz!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Evet, sil",
            cancelButtonText: "İptal",
        }).then((result) => {
            if (result.isConfirmed) {
                axios
                    .delete(`${API_URL}/Delete/${id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                    .then(() => {
                        setData((prev) => prev.filter((u) => u.id !== id));
                        Swal.fire("Silindi!", "Kullanıcı silindi.", "success");
                    })
                    .catch(() => Swal.fire("Hata", "Silme başarısız.", "error"));
            }
        });
    };

    const handleEdit = (user) => {
        setIsNew(false);
        setEditingItem({ ...user });
        setShowModal(true);
    };

    const handleNew = () => {
        setIsNew(true);
        setEditingItem({
            isim: "",
            soyisim: "",
            email: "",
            role: "Vatandaş",
            tc: "",
            sifre: "",
        });
        setShowModal(true);
    };

    const handleSave = () => {
        const token = localStorage.getItem("token");

        if (!editingItem.isim || !editingItem.soyisim || !editingItem.email) {
            Swal.fire("Eksik bilgi", "Lütfen tüm alanları doldurunuz.", "warning");
            return;
        }

        const payload = {
            ...(isNew ? {} : { id: editingItem.id }),
            isim: editingItem.isim,
            soyisim: editingItem.soyisim,
            email: editingItem.email,
            rol: reverseRoleMap[editingItem.role] ?? 0,
            tc: editingItem.tc,
            sifre: editingItem.sifre,
        };

        const method = isNew ? axios.post : axios.put;
        const url = isNew ? `${API_URL}/Add` : `${API_URL}/Update`;

        method(url, payload, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => {
                const updatedUser = res.data;
                const mappedUser = {
                    id: updatedUser.id,
                    isim: updatedUser.isim,
                    soyisim: updatedUser.soyisim,
                    name: `${updatedUser.isim} ${updatedUser.soyisim}`,
                    email: updatedUser.email,
                    role: roleMap[updatedUser.rol],
                    tc: updatedUser.tc,
                    sifre: updatedUser.sifre,
                };

                if (isNew) {
                    setData((prev) => [...prev, mappedUser]);
                    Swal.fire("Eklendi", "Yeni kullanıcı eklendi.", "success");
                } else {
                    setData((prev) => prev.map((u) => (u.id === mappedUser.id ? mappedUser : u)));
                    Swal.fire("Güncellendi", "Kullanıcı güncellendi.", "success");
                }

                setShowModal(false);
            })
            .catch((err) => {
                console.error("Kayıt hatası:", err.response?.data || err);
                Swal.fire("Hata", "İşlem başarısız.", "error");
            });
    };

    const togglePasswordVisibility = (id) => {
        setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const filteredData = data.filter(
        (item) =>
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.email.toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        { name: "Ad Soyad", selector: (row) => row.name, sortable: true },
        { name: "E-Posta", selector: (row) => row.email, sortable: true },
        { name: "Rol", selector: (row) => row.role, sortable: true },
        { name: "TC", selector: (row) => row.tc, sortable: true },

        {
            name: "İşlemler",
            cell: (row) => (
                <div className="flex gap-3 justify-center">
                    <button onClick={() => handleEdit(row)} className="text-blue-500 hover:scale-110">
                        <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDelete(row.id)} className="text-red-500 hover:scale-110">
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
                <h2 className="text-xl font-bold">Kullanıcı İşlemleri</h2>
                <button
                    onClick={handleNew}
                    className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg shadow hover:bg-orange-600"
                >
                    <PlusIcon className="h-5 w-5" />
                    Yeni Ekle
                </button>
            </div>

            <input
                type="text"
                placeholder="Kullanıcı ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border p-2 rounded-lg w-full mb-4"
            />

            <DataTable
                columns={columns}
                data={filteredData}
                pagination
                highlightOnHover
                striped
                noHeader
                noDataComponent={<div>Aramanıza uygun kayıt bulunamadı.</div>}
                paginationComponentOptions={{
                    rowsPerPageText: 'Sayfa başına kayıt',
                    rangeSeparatorText: ' / ',
                }}
            />

            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">
                            {isNew ? "Yeni Kullanıcı Ekle" : "Kullanıcıyı Düzenle"}
                        </h3>

                        <input
                            type="text"
                            value={editingItem.isim}
                            onChange={(e) => setEditingItem({ ...editingItem, isim: e.target.value })}
                            placeholder="İsim"
                            className="border p-2 rounded-lg w-full mb-3"
                        />
                        <input
                            type="text"
                            value={editingItem.soyisim}
                            onChange={(e) => setEditingItem({ ...editingItem, soyisim: e.target.value })}
                            placeholder="Soyisim"
                            className="border p-2 rounded-lg w-full mb-3"
                        />
                        <input
                            type="text"
                            value={editingItem.tc}
                            onChange={(e) => setEditingItem({ ...editingItem, tc: e.target.value })}
                            placeholder="T.C. Kimlik No"
                            className="border p-2 rounded-lg w-full mb-3"
                        />
                        <input
                            type="password"
                            value={editingItem.sifre}
                            onChange={(e) => setEditingItem({ ...editingItem, sifre: e.target.value })}
                            placeholder="Şifre"
                            className="border p-2 rounded-lg w-full mb-3"
                        />
                        <input
                            type="email"
                            value={editingItem.email}
                            onChange={(e) => setEditingItem({ ...editingItem, email: e.target.value })}
                            placeholder="E-Posta"
                            className="border p-2 rounded-lg w-full mb-3"
                        />
                        <select
                            value={editingItem.role}
                            onChange={(e) => setEditingItem({ ...editingItem, role: e.target.value })}
                            className="border p-2 rounded-lg w-full mb-3"
                        >
                            <option value="Vatandaş">Vatandaş</option>
                            <option value="Belediye Çalışanı">Belediye Çalışanı</option>
                            <option value="Admin">Admin</option>
                        </select>

                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-4">
                            <button
                                className="px-4 py-2 bg-gray-300 text-white rounded"
                                onClick={() => setShowModal(false)}
                            >
                                İptal
                            </button>
                            <button
                                className="px-4 py-2 bg-orange-500 text-white rounded"
                                onClick={handleSave}
                            >
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
