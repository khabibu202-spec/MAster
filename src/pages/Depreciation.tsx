import React, { useState } from "react";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { DataActions } from "../components/shared/DataActions";
import { useData } from "../contexts/DataContext";
import { Badge } from "../components/ui/Badge";
import { useToast } from "../contexts/ToastContext";
import { Search, Printer, Trash2, Filter, ChevronDown , Inbox} from "lucide-react";
import { PrintDepreciationReportModal } from "../components/shared/PrintDepreciationReportModal";
import { ConfirmDeleteModal } from "../components/shared/ConfirmDeleteModal";
import { exportToExcel, exportToPdf } from "../lib/exportUtils";
import { StickyTableWrapper } from "../components/shared/StickyTableWrapper";

export default function Depreciation() {
  const { assets, setAssets, schoolProfile, rooms } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Nilai Buku Tertinggi");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModalState, setDeleteModalState] = useState<{isOpen: boolean, isBulk: boolean, idToDelete?: string, title?: string, message?: string}>({isOpen: false, isBulk: false});
const toast = useToast();
  
  // Calculate straight-line depreciation (Garis Lurus) 
  // Assuming general useful life (Umur Ekonomis) = 5 years for KIB B
  const depreciatedAssets = (assets || [])
    .filter(a => {
      if (!a) return false;
      const term = (searchTerm || "").toLowerCase().trim();
      const nama = (a.nama || "").toLowerCase();
      const kode = (a.kodeBarang || "").toLowerCase();
      const matchesSearch = !term || nama.includes(term) || kode.includes(term);
      return (a.harga || 0) > 0 && a.kategori === "Peralatan & Mesin (KIB B)" && matchesSearch;
    })
    .map(asset => {
      const umurEkonomis = 5;
      const harga = asset.harga || 0;
      const nilaiSisa = harga * 0.1; // 10% residual value assumption
      const selisihHarga = harga - nilaiSisa;
      const penyusutanPerTahun = selisihHarga / umurEkonomis;
      
      const tahunTerpakai = Math.max(0, Math.min(currentYear - (asset.tahunPerolehan || currentYear), umurEkonomis));
      const akumulasiPenyusutan = tahunTerpakai * penyusutanPerTahun;
      const nilaiBuku = Math.max(0, harga - akumulasiPenyusutan);
      
      return {
        ...asset,
        umurEkonomis,
        akumulasiPenyusutan,
        nilaiBuku,
        tahunTerpakai
      };
    }).sort((a, b) => {
      switch(sortBy) {
        case "Nilai Buku Tertinggi": return (b.nilaiBuku || 0) - (a.nilaiBuku || 0);
        case "Nilai Buku Terendah": return (a.nilaiBuku || 0) - (b.nilaiBuku || 0);
        case "Tahun Terbaru": return (b.tahunPerolehan || 0) - (a.tahunPerolehan || 0);
        case "Tahun Terlama": return (a.tahunPerolehan || 0) - (b.tahunPerolehan || 0);
        case "Nama A-Z": return (a.nama || "").localeCompare(b.nama || "");
        case "Nama Z-A": return (b.nama || "").localeCompare(a.nama || "");
        default: return 0;
      }
    });

  
  const openDeleteModal = (id: string, name?: string) => {
    setDeleteModalState({
      isOpen: true,
      isBulk: false,
      idToDelete: id,
      title: "Hapus Data",
      message: `Apakah Anda yakin ingin menghapus data ${name ? '"'+name+'"' : 'ini'}? Aksi ini tidak dapat dibatalkan.`
    });
  };

  const openBulkDeleteModal = () => {
    setDeleteModalState({
      isOpen: true,
      isBulk: true,
      title: "Hapus Kelompok Data",
      message: `Apakah Anda yakin ingin menghapus ${selectedIds.length} data terpilih? Aksi ini tidak dapat dibatalkan.`
    });
  };

  const confirmDelete = () => {
    if (deleteModalState.isBulk) {
      setAssets(prev => prev.filter(item => !selectedIds.includes(item.id)));
      toast(`Berhasil menghapus ${selectedIds.length} data terpilih.`, 'success');
      setSelectedIds([]);
    } else if (deleteModalState.idToDelete) {
      setAssets(prev => prev.filter(item => item.id !== deleteModalState.idToDelete));
      toast('Berhasil menghapus data.', 'success');
      setSelectedIds(prev => prev.filter(id => id !== deleteModalState.idToDelete));
    }
    setDeleteModalState({ isOpen: false, isBulk: false });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === depreciatedAssets.length && depreciatedAssets.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(depreciatedAssets.map(item => item.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]);
  };
  const exportColumns = [
    { header: "NIBAR", key: "nibar", render: (item: any) => item.nibar || item.nomorRegister || "-" },
    { header: "Kode Barang", key: "kodeBarang", render: (item: any) => item.kodeBarang || item.kodeAset || "-" },
    { header: "Nama Aset", key: "nama", render: (item: any) => item.nama || "-" },
    { header: "Merek / Model", key: "merk", render: (item: any) => item.merk || "-" },
    { header: "Ruangan", key: "ruang", render: (item: any) => { const r = rooms?.find(rm => rm.id === item.ruanganId); return r ? r.nama : "-"; } },
    { header: "Tahun Perolehan", key: "tahunPerolehan" },
    { header: "Masa Manfaat", key: "umurEkonomis", render: (item: any) => `${item.umurEkonomis} Tahun` },
    { header: "Usia Pakai", key: "tahunTerpakai", render: (item: any) => `${item.tahunTerpakai} Tahun` },
    { header: "Harga Perolehan", key: "harga", render: (item: any) => `Rp ${(item.harga || 0).toLocaleString('id-ID')}` },
    { header: "Akumulasi Penyusutan", key: "akumulasiPenyusutan", render: (item: any) => `Rp ${(item.akumulasiPenyusutan || 0).toLocaleString('id-ID')}` },
    { header: "Nilai Buku Saat Ini", key: "nilaiBuku", render: (item: any) => `Rp ${(item.nilaiBuku || 0).toLocaleString('id-ID')}` },
    { header: "Kondisi", key: "kondisi" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Penyusutan Nilai (Depresiasi)</h2>
          <p className="text-slate-700">Kalkulasi nilai penyusutan KIB B secara otomatis (Metode Garis Lurus).</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Button variant="outline" onClick={() => setIsPrintModalOpen(true)}>
            <Printer className="mr-2 h-4 w-4" /> Cetak Laporan
          </Button>
          <DataActions 
            onExportExcel={() => {
              exportToExcel(depreciatedAssets, exportColumns, `Data_Penyusutan_Aset_KIB_B`);
              toast("Berhasil mengekspor data penyusutan lengkap ke Excel", "success");
            }}
            onExportPdf={() => {
              exportToPdf(depreciatedAssets, exportColumns, `Laporan Detail Penyusutan Aset KIB B`, schoolProfile, `Total Aset Depresiasi: ${depreciatedAssets.length} Barang`);
              toast("Berhasil mengekspor data penyusutan lengkap ke PDF", "success");
            }}
          />
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-300 bg-slate-50/50 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="relative w-full lg:w-72 shrink-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-600" />
              <input
                type="text"
                placeholder="Cari aset penyusutan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full appearance-none bg-white pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-2 w-full lg:w-auto lg:justify-end">
              <div className="hidden xl:flex items-center mr-1">
                <Filter className="h-4 w-4 text-slate-600" />
              </div>
              <div className="relative w-full sm:w-auto">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto appearance-none bg-white px-4 py-2 pr-10 text-sm border border-slate-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all font-medium text-primary-700 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <option value="Nilai Buku Tertinggi">Urutkan: Nilai Buku Tertinggi</option>
                  <option value="Nilai Buku Terendah">Urutkan: Nilai Buku Terendah</option>
                  <option value="Tahun Terbaru">Urutkan: Tahun Terbaru</option>
                  <option value="Tahun Terlama">Urutkan: Tahun Terlama</option>
                  <option value="Nama A-Z">Urutkan: Nama A-Z</option>
                  <option value="Nama Z-A">Urutkan: Nama Z-A</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
              </div>
            </div>
          </div>
                  {selectedIds.length > 0 && (
          <div className="bg-primary-50 px-6 py-3 border-b border-primary-100 flex items-center justify-between">
            <span className="text-sm font-medium text-primary-700">
              {selectedIds.length} baris terpilih
            </span>
            <Button variant="destructive" size="sm" onClick={openBulkDeleteModal} className="h-8">
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus Terpilih
            </Button>
          </div>
        )}
        <StickyTableWrapper
          tableContainerClassName="min-h-[280px]"
          label="Tabel Depresiasi & Nilai Buku Aset"
        >
          <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 sticky top-0 z-10 shadow-xs">
<tr>
<th className="px-6 py-3 font-medium w-12"><input type="checkbox" className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" checked={selectedIds.length === depreciatedAssets.length && depreciatedAssets.length > 0} onChange={toggleSelectAll} /></th>
                  <th className="px-6 py-3 font-medium">Aset / Register</th>
                  <th className="px-6 py-3 font-medium text-center">Tahun</th>
                  <th className="px-6 py-3 font-medium text-right">Harga Perolehan</th>
                  <th className="px-6 py-3 font-medium text-right">Akumulasi Penyusutan</th>
                  <th className="px-6 py-3 font-medium text-right text-primary-700">Nilai Buku (Saat Ini)</th>
                </tr>
              </thead>
                                          <tbody className="divide-y divide-slate-100">
                {depreciatedAssets.length > 0 ? (
                  depreciatedAssets.map((item) => {
                    
                    return (
                                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4"><input type="checkbox" className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} /></td>
                      <td className="px-6 py-4 font-medium text-slate-900">{item.nama} <span className="text-slate-700 font-normal">({item.kodeBarang})</span></td>
                      <td className="px-6 py-4 text-center">{item.tahunPerolehan}</td>
                      <td className="px-6 py-4 text-right">Rp {item.harga.toLocaleString("id-ID")}</td>
                      <td className="px-6 py-4 text-right text-rose-600">Rp {item.akumulasiPenyusutan}</td>
                      <td className="px-6 py-4 text-right font-medium text-primary-700">Rp {item.nilaiBuku}</td>
                    </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-700">
                        <div className="flex flex-col items-center justify-center">
                          <Inbox className="h-12 w-12 text-slate-300 mb-3" />
                          <p className="text-slate-700 font-medium text-base">Tidak Ada Data</p>
                          <p className="text-slate-600 text-sm mt-1">Belum ada catatan yang ditemukan atau kriteria pencarian tidak cocok.</p>
                        </div>
                      </td>
                  </tr>
                )}
              </tbody>
            </table>
        </StickyTableWrapper>
        </CardContent>
      </Card>

      <PrintDepreciationReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        depreciatedAssets={depreciatedAssets}
      />
          <ConfirmDeleteModal 
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, isBulk: false })}
        onConfirm={confirmDelete}
        title={deleteModalState.title}
        message={deleteModalState.message}
      />
    </div>
  );
}
