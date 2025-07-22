import { useState } from "react";
import DataTable from "react-data-table-component";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import Swal from "sweetalert2";

export default function DepartmentManagement() {
    const [search, setSearch] = useState("");
    const [data, setData] = useState([
        { id: 1, name: "Temizlik İşleri Müdürlüğü" },
        { id: 2, name: "Fen İşleri Müdürlüğü" },
        { id: 3, name: "Park ve Bahçeler Müdürlüğü" },
    ]);

    const [editingItem, setEditingItem] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isNew, setIsNew] = useState(false);

    const filteredData = data.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = (id) => {
        const dept = data.find((u) => u.id === id);
        Swal.fire({
            title: `${dept.name} silinsin mi?`,
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
                Swal.fire("Silindi!", "Birim başarıyla silindi.", "success");
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
        setEditingItem({ id: Date.now(), name: "" });
        setShowModal(true);
    };

    const handleSave = () => {
        if (isNew) {
            setData((prev) => [...prev, editingItem]);
            Swal.fire("Eklendi!", "Birim başarıyla eklendi.", "success");
        } else {
            setData((prev) => prev.map((item) => (item.id === editingItem.id ? editingItem : item)));
            Swal.fire("Güncellendi!", "Birim bilgileri güncellendi.", "success");
        }
        setShowModal(false);
    };

    const columns = [
        { name: "Birim Adı", selector: (row) => row.name, sortable: true },
        {
            name: "İşlemler",
            cell: (row) => (
                <div className="flex gap-3">
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

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Birim Yönetimi</h2>
                <button
                    onClick={handleNew}
                    className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg shadow cursor-pointer hover:bg-orange-600"
                >
                    <PlusIcon className="h-5 w-5" /> Yeni Ekle
                </button>
            </div>
            <input
                type="text"
                placeholder="Birim ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border p-2 rounded-lg w-full mb-4"
            />
            <DataTable columns={columns} data={filteredData} pagination highlightOnHover striped noHeader />

            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                        <h3 className="text-lg font-bold mb-4">
                            {isNew ? "Yeni Birim Ekle" : "Birim Düzenle"}
                        </h3>
                        <input
                            type="text"
                            value={editingItem.name}
                            onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                            placeholder="Birim Adı"
                            className="border p-2 rounded-lg w-full mb-3"
                        />
                        <div className="flex justify-end gap-3">
                            <button className="px-4 py-2 bg-gray-300 text-white rounded cursor-pointer" onClick={() => setShowModal(false)}>
                                İptal
                            </button>
                            <button className="px-4 py-2 bg-orange-500 text-white rounded cursor-pointer" onClick={handleSave}>
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
