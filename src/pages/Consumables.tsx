import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { DataActions } from "../components/shared/DataActions";
import { useData } from "../contexts/DataContext";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  PlusCircle,
  MinusCircle,
  AlertTriangle,
  QrCode,
  ChevronDown, Filter, Inbox
} from "lucide-react";
import { RowActions } from "../components/shared/RowActions";
import { FormModal } from "../components/shared/FormModal";
import { DetailModal } from "../components/shared/DetailModal";
import { useToast } from "../contexts/ToastContext";
import { exportToExcel, exportToPdf } from "../lib/exportUtils";
import { BarcodeDisplay } from "../components/shared/BarcodeDisplay";
import { PrintBarcodesModal } from "../components/shared/PrintBarcodesModal";
import { PrintBastModal } from "../components/shared/PrintBastModal";
import { Printer } from "lucide-react";
import { ConfirmDeleteModal } from "../components/shared/ConfirmDeleteModal";
import { StickyTableWrapper } from "../components/shared/StickyTableWrapper";

export default function Consumables() {
  const { consumables, setConsumables, schoolProfile } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterKategori, setFilterKategori] = useState("Semua");
  const [sortBy, setSortBy] = useState("Nama A-Z");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isBastModalOpen, setIsBastModalOpen] = useState(false);
  const [selectedConsumableId, setSelectedConsumableId] = useState<
    string | null
  >(null);

  // Stock operation modal state
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockOperation, setStockOperation] = useState<"add" | "remove">("add");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    isBulk: boolean;
    idToDelete?: string;
    title?: string;
    message?: string;
  }>({ isOpen: false, isBulk: false });
  const toast = useToast();

  const openDeleteModal = (id: string, name?: string) => {
    setDeleteModalState({
      isOpen: true,
      isBulk: false,
      idToDelete: id,
      title: "Hapus Data",
      message: `Apakah Anda yakin ingin menghapus data ${name ? '"' + name + '"' : "ini"}? Aksi ini tidak dapat dibatalkan.`,
    });
  };

  const openBulkDeleteModal = () => {
    setDeleteModalState({
      isOpen: true,
      isBulk: true,
      title: "Hapus Kelompok Data",
      message: `Apakah Anda yakin ingin menghapus ${selectedIds.length} data terpilih? Aksi ini tidak dapat dibatalkan.`,
    });
  };

  const confirmDelete = () => {
    if (deleteModalState.isBulk) {
      setConsumables((prev) =>
        prev.filter((item) => !selectedIds.includes(item.id)),
      );
      toast(
        `Berhasil menghapus ${selectedIds.length} data terpilih.`,
        "success",
      );
      setSelectedIds([]);
    } else if (deleteModalState.idToDelete) {
      setConsumables((prev) =>
        prev.filter((item) => item.id !== deleteModalState.idToDelete),
      );
      toast("Berhasil menghapus data.", "success");
      setSelectedIds((prev) =>
        prev.filter((id) => id !== deleteModalState.idToDelete),
      );
    }
    setDeleteModalState({ isOpen: false, isBulk: false });
  };

  const toggleSelectAll = () => {
    if (
      selectedIds.length === filteredConsumables.length &&
      filteredConsumables.length > 0
    ) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredConsumables.map((item) => item.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id],
    );
  };
  const handleAction = (
    msg: string,
    type: "info" | "success" | "error" = "info",
  ) => toast(msg, type);

  const openDetail = (id: string) => {
    setSelectedConsumableId(id);
    setIsDetailModalOpen(true);
  };

  const openEdit = (id: string) => {
    setSelectedConsumableId(id);
    setIsModalOpen(true);
    handleAction("Memuat edit mode");
  };

  const openStockModal = (id: string, operation: "add" | "remove") => {
    setSelectedConsumableId(id);
    setStockOperation(operation);
    setIsStockModalOpen(true);
  };

  const handleConsumableSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const consumableData: any = {
      nama: formData.get("nama"),
      kategori: formData.get("kategori"),
      merk: formData.get("merk"),
      spesifikasi: formData.get("spesifikasi"),
      lokasiPenyimpanan: formData.get("lokasiPenyimpanan"),
      satuan: formData.get("satuan"),
      stokSisa: parseInt(formData.get("stokSisa") as string) || 0,
      batasMinimum: parseInt(formData.get("batasMinimum") as string) || 0,
    };

    if (selectedConsumableId) {
      setConsumables((prev) =>
        prev.map((c) =>
          c.id === selectedConsumableId ? { ...c, ...consumableData } : c,
        ),
      );
      handleAction("Barang habis pakai berhasil diperbarui", "success");
    } else {
      setConsumables((prev) => [
        ...prev,
        { id: `BHP-${Date.now()}`, ...consumableData },
      ]);
      handleAction("Barang habis pakai baru berhasil ditambahkan", "success");
    }

    setIsModalOpen(false);
  };

  const handleStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt((e.target as any).qty.value);
    setConsumables((prev) =>
      prev.map((c) => {
        if (c.id === selectedConsumableId) {
          return {
            ...c,
            stokSisa:
              stockOperation === "add"
                ? c.stokSisa + qty
                : Math.max(0, c.stokSisa - qty),
          };
        }
        return c;
      }),
    );
    handleAction(
      stockOperation === "add"
        ? "Stok berhasil disuplai"
        : "Stok berhasil dikurangi",
      "success",
    );
    setIsStockModalOpen(false);
  };

  const selectedConsumable = consumables.find(
    (c) => c.id === selectedConsumableId,
  );

  const filteredConsumables = (consumables || [])
    .filter((item) => {
      if (!item) return false;
      const term = (searchTerm || "").toLowerCase().trim();
      const nama = (item.nama || "").toLowerCase();
      const merk = (item.merk || "").toLowerCase();
      const spesifikasi = (item.spesifikasi || "").toLowerCase();
      const matchesSearch = !term || nama.includes(term) || merk.includes(term) || spesifikasi.includes(term);
      const matchesKategori =
        filterKategori === "Semua" || item.kategori === filterKategori;
      return matchesSearch && matchesKategori;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "Nama A-Z":
          return (a.nama || "").localeCompare(b.nama || "");
        case "Nama Z-A":
          return (b.nama || "").localeCompare(a.nama || "");
        case "Stok Terbanyak":
          return (b.stokSisa || 0) - (a.stokSisa || 0);
        case "Stok Paling Sedikit":
          return (a.stokSisa || 0) - (b.stokSisa || 0);
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            Barang Habis Pakai
          </h2>
          <p className="text-slate-700">
            Stok inventaris barang habis pakai, ATK, dan kebersihan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DataActions
            onExportExcel={() => {
              exportToExcel(
                filteredConsumables,
                [
                  { header: "Kode BHP", key: "id" },
                  { header: "Nama Barang", key: "nama" },
                  { header: "Kategori", key: "kategori" },
                  { header: "Merek", key: "merk", render: (item: any) => item.merk || "-" },
                  { header: "Spesifikasi", key: "spesifikasi", render: (item: any) => item.spesifikasi || "-" },
                  { header: "Lokasi Rak/Gudang", key: "lokasiPenyimpanan", render: (item: any) => item.lokasiPenyimpanan || "Gudang Sarpras" },
                  { header: "Satuan", key: "satuan" },
                  { header: "Stok Sisa", key: "stokSisa" },
                  { header: "Batas Minimum", key: "batasMinimum" },
                  { header: "Status", key: "status", render: (item: any) => item.stokSisa <= item.batasMinimum ? "Kritis" : "Aman" },
                ],
                "Data_Detail_Barang_Habis_Pakai",
              );
              handleAction("Berhasil mengekspor Data Habis Pakai Lengkap ke Excel", "success");
            }}
            onExportPdf={() => {
              exportToPdf(
                filteredConsumables,
                [
                  { header: "Kode BHP", key: "id" },
                  { header: "Nama Barang", key: "nama" },
                  { header: "Kategori", key: "kategori" },
                  { header: "Merek / Spesifikasi", key: "spesifikasi", render: (item: any) => [item.merk, item.spesifikasi].filter(Boolean).join(" - ") || "-" },
                  { header: "Lokasi", key: "lokasiPenyimpanan", render: (item: any) => item.lokasiPenyimpanan || "Gudang" },
                  { header: "Satuan", key: "satuan" },
                  { header: "Stok Sisa", key: "stokSisa" },
                  { header: "Batas Min", key: "batasMinimum" },
                  { header: "Status", key: "status", render: (item: any) => item.stokSisa <= item.batasMinimum ? "Kritis" : "Aman" },
                ],
                "Laporan Detail Stok Barang Habis Pakai",
                schoolProfile,
                `Total Item: ${filteredConsumables.length} Jenis BHP`
              );
              handleAction("Berhasil mengekspor PDF Habis Pakai Lengkap", "success");
            }}
            onExportCsv={() =>
              handleAction("Format CSV dapat diunduh melalui menu Laporan", "info")
            }
          />
          <Button variant="outline" onClick={() => setIsPrintModalOpen(true)}>
            <QrCode className="mr-2 w-4 h-4" />
            Cetak QR Code
          </Button>
          <Button
            onClick={() => {
              setSelectedConsumableId(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="mr-2 w-4 h-4" />
            Barang Baru
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader className="border-b border-slate-300 bg-slate-50/50 pb-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="relative w-full lg:w-72 shrink-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-600" />
              <input
                type="text"
                placeholder="Cari ATK atau bahan..."
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
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
                className="w-full sm:w-auto appearance-none bg-white px-4 py-2 pr-10 text-sm border border-slate-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all hover:bg-slate-50 transition-colors shadow-sm"
              >
                <option value="Semua">Semua Kategori</option>
                <option value="ATK Tulis">ATK Tulis</option>
                <option value="Kertas & Buku">Kertas & Buku</option>
                <option value="Alat Kebersihan">Alat Kebersihan</option>
                <option value="Perlengkapan Umum">Perlengkapan Umum</option>
                <option value="Tinta & Toner">Tinta & Toner</option>
                <option value="Suku Cadang">Suku Cadang</option>
                <option value="Bahan Praktikum">Bahan Praktikum</option>
                <option value="Kesehatan (P3K)">Kesehatan (P3K)</option>
                <option value="Konsumsi">Konsumsi</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
            </div>
              <div className="relative w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto appearance-none bg-white px-4 py-2 pr-10 text-sm border border-slate-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all font-medium text-primary-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <option value="Nama A-Z">Urutkan: Nama A-Z</option>
                <option value="Nama Z-A">Urutkan: Nama Z-A</option>
                <option value="Stok Terbanyak">Urutkan: Stok Terbanyak</option>
                <option value="Stok Paling Sedikit">
                  Urutkan: Stok Paling Sedikit
                </option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
            </div>
            </div>
          </div>
        </CardHeader>
        {selectedIds.length > 0 && (
          <div className="bg-primary-50 px-6 py-3 border-b border-primary-100 flex items-center justify-between">
            <span className="text-sm font-medium text-primary-700">
              {selectedIds.length} baris terpilih
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={openBulkDeleteModal}
              className="h-8"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus Terpilih
            </Button>
          </div>
        )}
        <CardContent className="p-0">
          <StickyTableWrapper
            tableContainerClassName="min-h-[280px]"
            label="Tabel Barang Habis Pakai (BHP)"
          >
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 sticky top-0 z-10 shadow-xs">
                <tr>
                  <th className="px-6 py-3 font-medium w-12">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      checked={
                        selectedIds.length === filteredConsumables.length &&
                        filteredConsumables.length > 0
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 font-medium">Nama Barang</th>
                  <th className="px-6 py-3 font-medium">Kategori</th>
                  <th className="px-6 py-3 font-medium text-right">
                    Sisa Stok
                  </th>
                  <th className="px-6 py-3 font-medium">Satuan</th>
                  <th className="px-6 py-3 font-medium">Status Stok</th>
                  <th className="px-6 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredConsumables.length > 0 ? (
                  filteredConsumables.map((item) => {
                    const isLowStock = item.stokSisa <= item.batasMinimum;
                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${isLowStock ? "bg-rose-50/30 hover:bg-rose-50/60" : "hover:bg-slate-50/50"}`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelect(item.id)}
                          />
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                          {isLowStock && <span title="Stok Menipis!"><AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" /></span>}
                          {item.nama}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {item.kategori}
                        </td>
                        <td
                          className={`px-6 py-4 text-right font-bold ${isLowStock ? "text-rose-600" : "text-slate-900"}`}
                        >
                          {item.stokSisa}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {item.satuan}
                        </td>
                        <td className="px-6 py-4">
                          {isLowStock ? (
                            <Badge variant="destructive">Menipis</Badge>
                          ) : (
                            <Badge variant="success">Aman</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right pr-4">
                          <RowActions
                            actions={[
                              {
                                label: "Cetak BAST",
                                icon: Printer,
                                onClick: () => {
                                  setSelectedConsumableId(item.id);
                                  setIsBastModalOpen(true);
                                },
                              },
                              {
                                label: "Lihat Detail",
                                icon: Eye,
                                onClick: () => openDetail(item.id),
                              },
                              {
                                label: "Suplai (Tambah)",
                                icon: PlusCircle,
                                onClick: () => openStockModal(item.id, "add"),
                              },
                              {
                                label: "Gunakan (Kurangi)",
                                icon: MinusCircle,
                                onClick: () =>
                                  openStockModal(item.id, "remove"),
                              },
                              {
                                label: "Edit Item",
                                icon: Edit,
                                onClick: () => openEdit(item.id),
                              },
                              {
                                label: "Hapus",
                                icon: Trash2,
                                variant: "destructive",
                                onClick: () =>
                                  openDeleteModal(item.id, item.nama),
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-16 text-center text-slate-700"
                    >
                        <div className="flex flex-col items-center justify-center">
                          <Inbox className="h-12 w-12 text-slate-300 mb-3" />
                          <p className="text-slate-700 font-medium text-base">Tidak Ada Data</p>
                          <p className="text-slate-600 text-sm mt-1">Belum ada barang habis pakai yang ditemukan atau kriteria tidak cocok.</p>
                        </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </StickyTableWrapper>
        </CardContent>
      </Card>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          selectedConsumableId
            ? "Edit Barang Habis Pakai"
            : "Input Barang Habis Pakai Baru"
        }
        onSubmit={handleConsumableSave}
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">
              Nama Barang
            </label>
            <input
              name="nama"
              required
              type="text"
              defaultValue={selectedConsumable?.nama || ""}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
              placeholder="Misal: Kertas HVS A4 80gr"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-900">
                Kategori
              </label>
              <select
                name="kategori"
                defaultValue={selectedConsumable?.kategori || "ATK Tulis"}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none bg-white"
              >
                <option value="ATK Tulis">ATK Tulis</option>
                <option value="Kertas & Buku">Kertas & Buku</option>
                <option value="Alat Kebersihan">Alat Kebersihan</option>
                <option value="Perlengkapan Umum">Perlengkapan Umum</option>
                <option value="Tinta & Toner">Tinta & Toner</option>
                <option value="Suku Cadang">Suku Cadang</option>
                <option value="Bahan Praktikum">Bahan Praktikum</option>
                <option value="Kesehatan (P3K)">Kesehatan (P3K)</option>
                <option value="Konsumsi">Konsumsi</option>
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-900">
                Satuan (UoM)
              </label>
              <input
                name="satuan"
                required
                type="text"
                defaultValue={selectedConsumable?.satuan || ""}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                placeholder="Rim, Pcs, Box..."
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-900">
                Merek / Produsen
              </label>
              <input
                name="merk"
                type="text"
                defaultValue={selectedConsumable?.merk || ""}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                placeholder="Opsional"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-900">
                Spesifikasi / Ukuran
              </label>
              <input
                name="spesifikasi"
                type="text"
                defaultValue={selectedConsumable?.spesifikasi || ""}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                placeholder="Opsional"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">
              Lokasi Penyimpanan
            </label>
            <input
              name="lokasiPenyimpanan"
              type="text"
              defaultValue={selectedConsumable?.lokasiPenyimpanan || ""}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
              placeholder="Misal: Lemari ATK 01, Gudang..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-900">
                Stok (Sistem)
              </label>
              <input
                name="stokSisa"
                required
                type="number"
                defaultValue={selectedConsumable?.stokSisa || 0}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                placeholder="10"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-900">
                Batas Minimum
              </label>
              <input
                name="batasMinimum"
                required
                type="number"
                defaultValue={selectedConsumable?.batasMinimum || 5}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                placeholder="5"
              />
            </div>
          </div>
        </div>
      </FormModal>

      <FormModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title={
          stockOperation === "add"
            ? "Suplai / Tambah Stok"
            : "Gunakan / Kurangi Stok"
        }
        onSubmit={handleStockSubmit}
      >
        <div className="grid gap-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-300">
            <p className="text-sm text-slate-700">
              Barang:{" "}
              <span className="font-semibold text-slate-900">
                {selectedConsumable?.nama}
              </span>
            </p>
            <p className="text-sm text-slate-700">
              Stok Saat Ini:{" "}
              <span className="font-semibold text-slate-900">
                {selectedConsumable?.stokSisa} {selectedConsumable?.satuan}
              </span>
            </p>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">
              Jumlah{" "}
              {stockOperation === "add" ? "yang ditambahkan" : "yang dikurangi"}
            </label>
            <input
              required
              autoFocus
              name="qty"
              type="number"
              min="1"
              max={
                stockOperation === "remove"
                  ? selectedConsumable?.stokSisa
                  : undefined
              }
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
              placeholder="Kuantitas"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">
              Keterangan / Tujuan Penggunaan
            </label>
            <input
              type="text"
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
              placeholder="Misal: Untuk ruangan guru..."
            />
          </div>
        </div>
      </FormModal>

      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Rincian Barang Habis Pakai"
      >
        {selectedConsumable ? (
          <div className="space-y-6">
            <div className="flex justify-between items-start gap-4 border-b border-slate-300 pb-4">
              <div>
                <h4 className="text-xl font-bold text-slate-900">
                  {selectedConsumable.nama}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">
                    {selectedConsumable.kategori}
                  </Badge>
                  <span className="text-sm text-slate-700">
                    Satuan: {selectedConsumable.satuan}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-sm text-slate-700 font-medium">
                  Stok Tersedia
                </span>
                <span className="text-3xl font-bold tracking-tight text-slate-900">
                  {selectedConsumable.stokSisa}
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-300">
                    <p className="text-xs text-slate-700 mb-1">
                      Merek / Produsen
                    </p>
                    <p className="text-sm font-medium text-slate-900">
                      {selectedConsumable.merk || "-"}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-300">
                    <p className="text-xs text-slate-700 mb-1">Spesifikasi</p>
                    <p className="text-sm font-medium text-slate-900">
                      {selectedConsumable.spesifikasi || "-"}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-300 col-span-2">
                    <p className="text-xs text-slate-700 mb-1">
                      Lokasi Penyimpanan
                    </p>
                    <p className="text-sm font-medium text-slate-900">
                      {selectedConsumable.lokasiPenyimpanan || "-"}
                    </p>
                  </div>
                </div>

                {selectedConsumable.stokSisa <=
                  selectedConsumable.batasMinimum && (
                  <div className="bg-rose-50 border border-rose-100 p-4 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="text-rose-500 h-5 w-5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-rose-900">
                        Stok Barang Menipis!
                      </p>
                      <p className="text-xs text-rose-700 mt-0.5">
                        Sisa stok saat ini lebih kecil atau sama dengan batas
                        peringatan minimum ({selectedConsumable.batasMinimum}{" "}
                        {selectedConsumable.satuan}). Anda disarankan segera
                        melakukan rekab / pengadaan stok baru.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <h5 className="font-semibold text-slate-900">
                    Histori Pergerakan Barang Terakhir
                  </h5>
                  <div className="border border-slate-300 rounded-lg overflow-hidden overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 border-b border-slate-300 text-slate-700 text-xs">
                        <tr>
                          <th className="py-2 px-4 font-medium font-medium">
                            Tanggal
                          </th>
                          <th className="py-2 px-4 font-medium font-medium">
                            Transaksi
                          </th>
                          <th className="py-2 px-4 font-medium font-medium flex justify-end">
                            Kuantitas
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr className="bg-white">
                          <td className="py-2 px-4 text-slate-700">Hari ini</td>
                          <td className="py-2 px-4 text-slate-900 font-medium">
                            Diambil oleh Ruang Staf
                          </td>
                          <td className="py-2 px-4 text-rose-600 font-medium text-right">
                            -2
                          </td>
                        </tr>
                        <tr className="bg-white">
                          <td className="py-2 px-4 text-slate-700">
                            3 Hari lalu
                          </td>
                          <td className="py-2 px-4 text-slate-900 font-medium">
                            Suplai Masuk (Pembelian)
                          </td>
                          <td className="py-2 px-4 text-emerald-600 font-medium text-right">
                            +20
                          </td>
                        </tr>
                        <tr className="bg-white">
                          <td className="py-2 px-4 text-slate-700">
                            10 Hari lalu
                          </td>
                          <td className="py-2 px-4 text-slate-900 font-medium">
                            Diambil oleh Lab Komputer
                          </td>
                          <td className="py-2 px-4 text-rose-600 font-medium text-right">
                            -5
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="md:col-span-1">
                <BarcodeDisplay
                  value={selectedConsumable.id}
                  title={selectedConsumable.nama}
                  subtitle={`Kategori: ${selectedConsumable.kategori}`}
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-300 flex gap-3 flex-wrap">
              <Button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setIsBastModalOpen(true);
                }}
                variant="outline"
                className="flex-1 min-w-[120px] bg-white text-slate-700"
              >
                <Printer className="w-4 h-4 mr-2" />
                Cetak BAST
              </Button>
              <Button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  openStockModal(selectedConsumable.id, "add");
                }}
                variant="outline"
                className="flex-1 min-w-[120px] bg-white text-primary-700 border-primary-200 hover:bg-primary-50"
              >
                Suplai (Tambah)
              </Button>
              <Button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  openStockModal(selectedConsumable.id, "remove");
                }}
                className="flex-1 min-w-[120px]"
                variant="default"
              >
                Gunakan Barang
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-700">
            Mencari data barang...
          </div>
        )}
      </DetailModal>

      <PrintBarcodesModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        assets={filteredConsumables.map(
          (c) =>
            ({
              ...c,
              kodeBarang: c.id,
              nomorRegister: c.kategori,
            }) as any,
        )}
      />

      <PrintBastModal
        isOpen={isBastModalOpen}
        onClose={() => setIsBastModalOpen(false)}
        item={selectedConsumable}
        type="CONSUMABLE_SERAH_TERIMA"
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
