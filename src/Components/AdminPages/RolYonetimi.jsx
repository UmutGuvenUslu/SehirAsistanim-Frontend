import { useState, useEffect } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";

const apiBaseUrl = "https://sehirasistanim-backend-production.up.railway.app/RolTuru";

export default function RolYonetimi() {
    const [rolListesi, setRolListesi] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        rollerGetir();
    }, []);

    const rollerGetir = async () => {
        try {
            const response = await axios.get(`${apiBaseUrl}/GetRolTurleri`);
            setRolListesi(response.data || []);
        } catch (error) {
            Swal.fire("Hata!", "Roller alınamadı.", "error");
        }
    };

    const formatRolAdi = (text) =>
        text.replace(/([\p{Ll}])([\p{Lu}])/gu, "$1 $2").replace(/ve/g, " ve ");

    const filteredRoles = rolListesi.filter((rol) =>
        rol.name.toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        {
            name: "Rol Adı",
            selector: (row) => formatRolAdi(row.name),
            sortable: true
        }
    ];

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Rol Listesi</h2>

            <input
                type="text"
                placeholder="Rol ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border p-2 rounded-lg w-full mb-4"
            />

            <DataTable
                columns={columns}
                data={filteredRoles}
                pagination
                highlightOnHover
                striped
                noHeader
                noDataComponent={<div>Rol bulunamadı.</div>}
                paginationComponentOptions={{
                    rowsPerPageText: 'Sayfa başına',
                    rangeSeparatorText: ' / ',
                }}
            />
        </div>
    );
}
