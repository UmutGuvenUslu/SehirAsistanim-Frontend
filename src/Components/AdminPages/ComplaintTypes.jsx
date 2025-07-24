import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import Swal from "sweetalert2";
import axios from "axios";

const apiBaseUrl = "https://sehirasistanim-backend-production.up.railway.app/SikayetTuru";

export default function ComplaintTypeManagement() {
    const [search, setSearch] = useState("");
    const [data, setData] = useState([]);

    const [editingItem, setEditingItem] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isNew, setIsNew] = useState(false);

    useEffect(() => {
        fetchComplaintsType();
    }, []);

    const fetchComplaintsType = async () => {
        try {
            const response = await axios.get(`${apiBaseUrl}/GetAll`);
            setData(response.data ?? []);
        } catch (error) {
            Swal.fire("Hata!", "Şikayet türü alınamadı.", "error");
        }
    };

    const filteredData = data.filter(
        (item) =>
            item.ad &&
            item.ad.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = (id) => {
        const dept = data.find((u) => u.id === id);
        Swal.fire({
            title: `${dept?.ad} silinsin mi?`,
            text: "Bu işlem geri alınamaz!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Evet, sil",
            cancelButtonText: "İptal",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`${apiBaseUrl}/Delete/${id}`);
                    setData((prev) => prev.filter((item) => item.id !== id));
                    Swal.fire("Silindi!", "Şikayet türü başarıyla silindi.", "success");
                } catch (error) {
                    console.error("API Hatası:", error); // 👈 Konsola yaz
                    Swal.fire("Hata!", error?.response?.data?.message || "İşlem sırasında hata oluştu.", "error");
                }
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
        setEditingItem({ id: 0, ad: "", varsayilanBirimId: 1 });
        setShowModal(true);
    };
    const handleSave = async () => {
        if (!editingItem.ad.trim()) {
            Swal.fire("Hata!", "Lütfen Şikayet türü giriniz", "warning");
            return;
        }

        try {
            if (isNew) {
                await axios.post(`${apiBaseUrl}/Add`, editingItem);
                await fetchComplaintsType(); // 🔁 listeyi güncelle
                Swal.fire("Eklendi!", "Şikayet Türü başarıyla eklendi.", "success");
            } else {
                await axios.put(`${apiBaseUrl}/Update`, editingItem);
                setData((prev) =>
                    prev.map((item) => (item.id === editingItem.id ? editingItem : item))
                );
                Swal.fire("Güncellendi!", "Şikayet Türü bilgileri güncellendi.", "success");
            }
            setShowModal(false); // ✅ Modal'ı kapat
        } catch (error) {
            console.error("API Hatası:", error); // 👈 Konsola yaz
            Swal.fire("Hata!", error?.response?.data?.message || "İşlem sırasında hata oluştu.", "error");
        }
    };


    const columns = [
        { name: "Şikayet Türü", selector: (row) => row.ad, sortable: true },
        {
            name: "İşlemler",
            cell: (row) => (
                <div className="flex gap-3">
                    <button
                        className="text-blue-500 hover:scale-110 cursor-pointer"
                        onClick={() => handleEdit(row)}
                    >
                        <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                        className="text-red-500 hover:scale-110 cursor-pointer"
                        onClick={() => handleDelete(row.id)}
                    >
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Şikayet türü Yönetimi</h2>
                <button
                    onClick={handleNew}
                    className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg shadow cursor-pointer hover:bg-orange-600"
                >
                    <PlusIcon className="h-5 w-5" /> Yeni Ekle
                </button>
            </div>
            <input
                type="text"
                placeholder="Şikayet Türü..."
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
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                        <h3 className="text-lg font-bold mb-4">
                            {isNew ? "Yeni Şikayet Türü" : "Şikayet Türü Düzenle"}
                        </h3>
                        <input
                            type="text"
                            value={editingItem?.ad || ""}
                            onChange={(e) =>
                                setEditingItem({ ...editingItem, ad: e.target.value })
                            }
                            placeholder="Şikayet Türü"
                            className="border p-2 rounded-lg w-full mb-3"
                        />

                        <div className="flex justify-end gap-3">
                            <button
                                className="px-4 py-2 bg-gray-300 text-white rounded cursor-pointer"
                                onClick={() => setShowModal(false)}
                            >
                                İptal
                            </button>
                            <button
                                className="px-4 py-2 bg-orange-500 text-white rounded cursor-pointer"
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



