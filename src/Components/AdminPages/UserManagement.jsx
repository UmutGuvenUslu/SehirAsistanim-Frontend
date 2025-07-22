import { useState } from "react";
import DataTable from "react-data-table-component";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import Swal from "sweetalert2";



export default function UserManagement() {
    const [search, setSearch] = useState("");
    const [data, setData] = useState([
        { id: 1, name: "Ahmet Yılmaz", email: "ahmet@example.com", role: "Admin" },
        { id: 2, name: "Ayşe Demir", email: "ayse@example.com", role: "Kullanıcı" },
        { id: 3, name: "Mehmet Kaya", email: "mehmet@example.com", role: "Kullanıcı" },
    ]);

    const [editingItem, setEditingItem] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isNew, setIsNew] = useState(false);

    const filteredData = data.filter(
        (item) =>
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.email.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = (id) => {
        const user = data.find((u) => u.id === id);
        Swal.fire({
            title: `${user.name} silinsin mi?`,
            text: "Bu işlem geri alınamaz!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "oklch(70.5% 0.213 47.604)",
            cancelButtonColor: "oklch(87.2% 0.01 258.338)",
            confirmButtonText: "Evet, sil",
            cancelButtonText: "İptal",
        }).then((result) => {
            if (result.isConfirmed) {
                setData(data.filter((item) => item.id !== id));
                Swal.fire("Silindi!", "Kullanıcı başarıyla silindi.", "success");
            }
        });
    };

    const handleEdit = (row) => {
        setIsNew(false);
        setEditingItem({ ...row });
        setShowModal(true);
    };

    const handleNew = () => {
        setIsNew(true);
        setEditingItem({ id: Date.now(), name: "", email: "", role: "Kullanıcı" });
        setShowModal(true);
    };

    const handleSave = () => {
        if (isNew) {
            setData((prev) => [...prev, editingItem]);
            Swal.fire("Eklendi!", "Kullanıcı başarıyla eklendi.", "success");
        } else {
            setData((prev) => prev.map((item) => (item.id === editingItem.id ? editingItem : item)));
            Swal.fire("Güncellendi!", "Kullanıcı bilgileri güncellendi.", "success");
        }
        setShowModal(false);
    };

    const columns = [
        { name: "Ad Soyad", selector: (row) => row.name, sortable: true },
        { name: "E-Posta", selector: (row) => row.email, sortable: true },
        { name: "Rol", selector: (row) => row.role, sortable: true },
        {
            name: "İşlemler",
            cell: (row) => (
                <div className="flex gap-3 justify-center">
                    <button className="text-blue-500 hover:scale-110 cursor-pointer" onClick={() => handleEdit(row)}>
                        <PencilIcon className="h-5 w-5" />
                    </button>
                    <button className="text-red-500 hover:scale-110 cursor-pointer" onClick={() => handleDelete(row.id)}>
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </div>
            ),
        },
    ];

    const customStyles = {
        table: {
            style: {
                minWidth: "400px", // Tablo için minimum genişlik
            },
        },
        rows: {
            style: {
                minHeight: "48px",
            },
        },
    };

    return (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
            {/* Başlık ve Ekle Butonu */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
                <h2 className="text-xl font-bold">Kullanıcı İşlemleri</h2>
                <button
                    onClick={handleNew}
                    className="flex items-center justify-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg shadow cursor-pointer hover:bg-orange-600 w-full md:w-auto"
                >
                    <PlusIcon className="h-5 w-5" /> Yeni Ekle
                </button>
            </div>

            {/* Arama Çubuğu */}
            <input
                type="text"
                placeholder="Kullanıcı ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border p-2 rounded-lg w-full mb-4"
            />

            {/* Tablo (responsive) */}
            <div className="w-full max-w-full overflow-x-auto">

                <div className="w-full overflow-x-auto">
                    <DataTable
                        columns={columns}
                        data={filteredData}
                        pagination
                        highlightOnHover
                        striped
                        noHeader
                        customStyles={customStyles}
                    />
                </div>

                {/* Düzenleme/Ekleme Modalı */}
                {showModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                            <h3 className="text-lg font-bold mb-4">
                                {isNew ? "Yeni Kullanıcı Ekle" : "Kullanıcı Düzenle"}
                            </h3>
                            <input
                                type="text"
                                value={editingItem.name}
                                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                placeholder="Ad Soyad"
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
                                <option value="Admin">Admin</option>
                                <option value="Kullanıcı">Kullanıcı</option>
                            </select>
                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-4">
                                <button
                                    className="px-4 py-2 bg-gray-300 text-white rounded w-full sm:w-auto cursor-pointer"
                                    onClick={() => setShowModal(false)}
                                >
                                    İptal
                                </button>
                                <button
                                    className="px-4 py-2 bg-orange-500 text-white rounded w-full sm:w-auto cursor-pointer"
                                    onClick={handleSave}
                                >
                                    Kaydet
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
