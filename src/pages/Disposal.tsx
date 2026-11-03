import React, { useState, useMemo } from "react";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { DataActions } from "../components/shared/DataActions";
import { useData } from "../contexts/DataContext";
import { 
  Plus, Search, Eye, Edit, Trash2, CheckCircle, FileX, Calendar, 
  Printer, ChevronDown, Filter, Inbox, Tag, FileText, Layers, AlertTriangle, ShieldCheck
} from "lucide-react";
import { RowActions } from "../components/shared/RowActions";
import { FormModal } from "../components/shared/FormModal";
import { DetailModal } from "../components/shared/DetailModal";
import { useToast } from "../contexts/ToastContext";
import { PrintDisposalReportModal } from "../components/shared/PrintDisposalReportModal";
import { PrintDisposalLabelModal } from "../components/shared/PrintDisposalLabelModal";
import { ConfirmDeleteModal } from "../components/shared/ConfirmDeleteModal";
import { exportToExcel, exportToPdf } from "../lib/exportUtils";
import { StickyTableWrapper } from "../components/shared/StickyTableWrapper";

export default function Disposal() {
  const { disposals, setDisposals, assets, schoolProfile, rooms, approveDisposalAndArchive, updateAssetWithAudit } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [sortBy, setSortBy] = useState("Terbaru");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [selectedDisposalId, setSelectedDisposalId] = useState<string | null>(null);
  const [selectedDisposalIdsForLabel, setSelectedDisposalIdsForLabel] = useState<string[]>([]);
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModalState, setDeleteModalState] = useState<{isOpen: boolean, isBulk: boolean, idToDelete?: string, title?: string, message?: string}>({isOpen: false, isBulk: false});
  const toast = useToast();

  const openDeleteModal = (id: string, name?: string) => {
    setDeleteModalState({
      isOpen: true,
      isBulk: false,
      idToDelete: id,
      title: "Hapus Data Penghapusan",
      message: `Apakah Anda yakin ingin menghapus data pengajuan ${name ? '"' + name + '"' : 'ini'}? Aksi ini tidak dapat dibatalkan.`
    });
  };

  const openBulkDeleteModal = () => {
    setDeleteModalState({
      isOpen: true,
      isBulk: true,
      title: "Hapus Kelompok Data Penghapusan",
      message: `Apakah Anda yakin ingin menghapus ${selectedIds.length} data terpilih? Aksi ini tidak dapat dibatalkan.`
    });
  };

  const confirmDelete = () => {
    if (deleteModalState.isBulk) {
      setDisposals(prev => prev.filter(item => !selectedIds.includes(item.id)));
      toast(`Berhasil menghapus ${selectedIds.length} data terpilih.`, 'success');
      setSelectedIds([]);
    } else if (deleteModalState.idToDelete) {
      setDisposals(prev => prev.filter(item => item.id !== deleteModalState.idToDelete));
      toast('Berhasil menghapus data penghapusan.', 'success');
      setSelectedIds(prev => prev.filter(id => id !== deleteModalState.idToDelete));
    }
    setDeleteModalState({ isOpen: false, isBulk: false });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredDisposals.length && filteredDisposals.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDisposals.map(item => item.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]);
  };

  const handleAction = (msg: string, type: 'info'|'success'|'error' = 'info') => toast(msg, type);

  const openDetail = (id: string) => {
    setSelectedDisposalId(id);
    setIsDetailModalOpen(true);
  };

  const openEdit = (id: string) => {
    setSelectedDisposalId(id);
    setIsModalOpen(true);
  };

  const openPrintLetter = (id: string) => {
    setSelectedDisposalId(id);
    setIsPrintModalOpen(true);
  };

  // Open single item label print
  const openPrintLabel = (id: string) => {
    setSelectedDisposalId(id);
    setSelectedDisposalIdsForLabel([id]);
    setIsLabelModalOpen(true);
  };

  // Open multi-item label print from selected rows
  const openBulkPrintLabels = () => {
    if (selectedIds.length > 0) {
      setSelectedDisposalIdsForLabel(selectedIds);
      setIsLabelModalOpen(true);
    } else {
      toast("Pilih minimal 1 barang melalui kotak centang untuk cetak massal", "info");
    }
  };

  // Open multi-item label print for all filtered items
  const openMassPrintLabels = () => {
    const idsToUse = selectedIds.length > 0 ? selectedIds : filteredDisposals.map(d => d.id);
    if (idsToUse.length === 0) {
      toast("Tidak ada data penghapusan untuk dicetak", "info");
      return;
    }
    setSelectedDisposalIdsForLabel(idsToUse);
    setIsLabelModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const rawJumlah = parseInt(formData.get('jumlah') as string, 10);
    const jumlah = isNaN(rawJumlah) || rawJumlah < 1 ? 1 : rawJumlah;
    const nomorSurat = (formData.get('nomorSurat') as string)?.trim() || undefined;
    const penanggungJawab = (formData.get('penanggungJawab') as string)?.trim() || undefined;

    const data: any = {
      assetId: formData.get('assetId'),
      jumlah,
      nomorSurat,
      penanggungJawab,
      tanggalPengajuan: formData.get('tanggalPengajuan'),
      metode: formData.get('metode') as any,
      alasan: formData.get('alasan'),
      status: formData.get('status') || 'Diajukan',
    };
    
    if (selectedDisposalId) {
      setDisposals(prev => prev.map(d => d.id === selectedDisposalId ? { ...d, ...data } : d));
      if (data.status === 'Disetujui' || data.status === 'Selesai') {
        updateAssetWithAudit(data.assetId, { statusOperasional: "Dihapus / Dimusnahkan", kondisi: "Rusak Berat" }, "Admin Sarpras", `Penghapusan disetujui (Surat: ${data.nomorSurat || 'BAST'})`);
      }
      handleAction("Pengajuan penghapusan diperbarui & status aset master diarsipkan", "success");
    } else {
      const newDspId = `DSP-${Date.now()}`;
      setDisposals(prev => [...prev, { id: newDspId, ...data }]);
      if (data.status === 'Disetujui' || data.status === 'Selesai') {
        updateAssetWithAudit(data.assetId, { statusOperasional: "Dihapus / Dimusnahkan", kondisi: "Rusak Berat" }, "Admin Sarpras", `Penghapusan disetujui langsung (Surat: ${data.nomorSurat || 'BAST'})`);
      }
      handleAction("Pengajuan penghapusan berhasil disimpan", "success");
    }
    setIsModalOpen(false);
  };

  const selectedDisposal = disposals.find(d => d.id === selectedDisposalId) || null;
  const selectedDisposalAsset = selectedDisposal ? (assets.find(a => a.id === selectedDisposal.assetId) || null) : null;

  // KPI Calculations
  const totalPengajuan = disposals.length;
  const totalUnitDihapus = disposals.reduce((sum, d) => sum + (d.jumlah || 1), 0);
  const totalNilaiBukuDihapus = disposals.reduce((sum, d) => {
    const asset = assets.find(a => a.id === d.assetId);
    return sum + ((asset?.harga || 0) * (d.jumlah || 1));
  }, 0);
  const totalDisetujuiAtauSelesai = disposals.filter(d => d.status === "Disetujui" || d.status === "Selesai").length;

  const filteredDisposals = (disposals || []).filter(item => {
    if (!item) return false;
    const asset = assets.find(a => a.id === item.assetId);
    const assetName = (asset?.nama || "").toLowerCase();
    const assetKode = (asset?.kodeBarang || "").toLowerCase();
    const assetNibar = (asset?.nibar || "").toLowerCase();
    const noSurat = (item.nomorSurat || "").toLowerCase();
    const alasan = (item.alasan || "").toLowerCase();
    const term = (searchTerm || "").toLowerCase().trim();
    
    const matchesSearch = !term || 
      assetName.includes(term) || 
      assetKode.includes(term) || 
      assetNibar.includes(term) || 
      noSurat.includes(term) || 
      alasan.includes(term);

    const matchesStatus = filterStatus === "Semua" || item.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case "Terbaru":
        return new Date(b.tanggalPengajuan || 0).getTime() - new Date(a.tanggalPengajuan || 0).getTime();
      case "Terlama":
        return new Date(a.tanggalPengajuan || 0).getTime() - new Date(b.tanggalPengajuan || 0).getTime();
      case "Jumlah Terbanyak":
        return (b.jumlah || 1) - (a.jumlah || 1);
      case "Aset A-Z": {
        const assetA = assets.find(as => as.id === a.assetId)?.nama || "";
        const assetB = assets.find(as => as.id === b.assetId)?.nama || "";
        return assetA.localeCompare(assetB);
      }
      default:
        return 0;
    }
  });

  // Prepare items for multi-item label modal
  const disposalItemsForLabel = useMemo(() => {
    const targetIds = selectedDisposalIdsForLabel.length > 0 
      ? selectedDisposalIdsForLabel 
      : (selectedDisposalId ? [selectedDisposalId] : []);
    
    return targetIds
      .map(id => {
        const d = disposals.find(disp => disp.id === id);
        const a = d ? assets.find(ast => ast.id === d.assetId) : null;
        if (d && a) return { disposal: d, asset: a };
        return null;
      })
      .filter((it): it is { disposal: typeof disposals[0]; asset: typeof assets[0] } => it !== null);
  }, [selectedDisposalIdsForLabel, selectedDisposalId, disposals, assets]);

  const exportColumns = [
    { header: "Tanggal", key: "tanggalPengajuan", render: (item: any) => new Date(item.tanggalPengajuan).toLocaleDateString("id-ID") },
    { header: "No. SK / BA", key: "nomorSurat", render: (item: any) => item.nomorSurat || "-" },
    { header: "NIBAR", key: "nibar", render: (item: any) => { const a = assets.find(ast => ast.id === item.assetId); return a?.nibar || a?.nomorRegister || "-"; } },
    { header: "Kode Barang", key: "kodeBarang", render: (item: any) => { const a = assets.find(ast => ast.id === item.assetId); return a?.kodeBarang || a?.kodeAset || "-"; } },
    { header: "Nama Aset & Merek", key: "assetId", render: (item: any) => { const a = assets.find(ast => ast.id === item.assetId); return a ? `${a.nama}${a.merk ? ` (${a.merk})` : ''}` : "-"; } },
    { header: "Ruangan Asal", key: "ruang", render: (item: any) => { const a = assets.find(ast => ast.id === item.assetId); const r = a?.ruanganId ? rooms.find(rm => rm.id === a.ruanganId) : null; return r ? r.nama : "-"; } },
    { header: "Sumber Dana", key: "sumberDana", render: (item: any) => { const a = assets.find(ast => ast.id === item.assetId); return a?.sumberDana || a?.asalUsul || "BOS"; } },
    { header: "Jumlah (Unit)", key: "jumlah", render: (item: any) => `${item.jumlah || 1} unit` },
    { header: "Harga Satuan", key: "hargaSatuan", render: (item: any) => { const a = assets.find(ast => ast.id === item.assetId); return `Rp ${(a?.harga || 0).toLocaleString('id-ID')}`; } },
    { header: "Total Nilai Buku Dihapus", key: "totalNilai", render: (item: any) => { const a = assets.find(ast => ast.id === item.assetId); return `Rp ${((a?.harga || 0) * (item.jumlah || 1)).toLocaleString('id-ID')}`; } },
    { header: "Metode", key: "metode" },
    { header: "Penanggung Jawab", key: "penanggungJawab", render: (item: any) => item.penanggungJawab || schoolProfile.operator || "-" },
    { header: "Alasan", key: "alasan" },
    { header: "Status", key: "status" },
  ];

  const handleExportExcel = () => {
    exportToExcel(filteredDisposals, exportColumns, `Data_Detail_Penghapusan_Aset_BMD`);
    toast("Berhasil mengekspor data detail penghapusan ke Excel", "success");
  };

  const handleExportPdf = () => {
    exportToPdf(filteredDisposals, exportColumns, `Laporan Detail Penghapusan Aset BMD`, schoolProfile, `Total Pengajuan: ${filteredDisposals.length} Dokumen`);
    toast("Berhasil mengekspor data detail penghapusan ke PDF", "success");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-black">Penghapusan Aset & Berita Acara</h2>
          <p className="text-slate-800 text-sm mt-0.5">
            Manajemen pengajuan pemusnahan/lelang, pencatatan jumlah unit rusak berat, cetak label fisik massal/satuan, dan Surat Berita Acara (BA).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DataActions 
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
          />
          <Button 
            variant="outline"
            onClick={openMassPrintLabels}
            className="bg-white border-rose-300 text-rose-800 hover:bg-rose-50 font-bold shadow-2xs"
            title="Cetak label stiker untuk lebih dari 1 barang sekaligus"
          >
            <Tag className="mr-2 w-4 h-4 text-rose-600" />
            Cetak Label Massal ({selectedIds.length > 0 ? `${selectedIds.length} Terpilih` : `Semua (${filteredDisposals.length})`})
          </Button>
          <Button onClick={() => { setSelectedDisposalId(null); setIsModalOpen(true); }} className="bg-primary-600 hover:bg-primary-700 text-white font-semibold">
            <Plus className="mr-2 w-4 h-4" />
            Ajukan Penghapusan
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-300 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Total Pengajuan</p>
            <p className="text-2xl font-extrabold text-black mt-1">{totalPengajuan} <span className="text-xs font-normal text-slate-600">Berkas</span></p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FileX className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-300 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Total Unit Dihapus</p>
            <p className="text-2xl font-extrabold text-rose-600 mt-1">{totalUnitDihapus} <span className="text-xs font-normal text-slate-600">Unit Barang</span></p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-300 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Nilai Buku Dihapus</p>
            <p className="text-xl font-extrabold text-black mt-1">Rp {totalNilaiBukuDihapus.toLocaleString('id-ID')}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-300 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Disetujui / Selesai</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{totalDisetujuiAtauSelesai} <span className="text-xs font-normal text-slate-600">Berkas Selesai</span></p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-300 bg-slate-50/50 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="relative w-full lg:w-80 shrink-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-600" />
              <input
                type="text"
                placeholder="Cari aset, NIBAR, no. SK, alasan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full appearance-none bg-white pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all font-medium text-black placeholder:text-slate-500"
              />
            </div>
            <div className="flex flex-wrap gap-2 w-full lg:w-auto lg:justify-end">
              <div className="hidden xl:flex items-center mr-1">
                <Filter className="h-4 w-4 text-slate-600" />
              </div>
              <div className="relative w-full sm:w-auto">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full sm:w-auto appearance-none bg-white px-4 py-2 pr-10 text-sm border border-slate-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all hover:bg-slate-50 shadow-sm font-semibold text-black"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Diajukan">Dalam Pengajuan</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Selesai">Selesai (Aset Dihapus)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
              </div>
              <div className="relative w-full sm:w-auto">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto appearance-none bg-white px-4 py-2 pr-10 text-sm border border-slate-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all font-semibold text-primary-700 hover:bg-slate-50 shadow-sm"
                >
                  <option value="Terbaru">Urutkan: Pengajuan Terbaru</option>
                  <option value="Terlama">Urutkan: Pengajuan Terlama</option>
                  <option value="Jumlah Terbanyak">Urutkan: Jumlah Terbanyak</option>
                  <option value="Aset A-Z">Urutkan: Nama Aset A-Z</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedIds.length > 0 && (
            <div className="bg-primary-50 px-6 py-3 border-b border-primary-100 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-bold text-primary-900">
                {selectedIds.length} baris barang terpilih
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={openBulkPrintLabels}
                  className="h-8 bg-white border-rose-300 text-rose-800 hover:bg-rose-50 font-bold shadow-2xs"
                >
                  <Tag className="w-4 h-4 mr-1.5 text-rose-600" />
                  Cetak Label Terpilih ({selectedIds.length} Barang)
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={openBulkDeleteModal} 
                  className="h-8 font-semibold"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Hapus Terpilih
                </Button>
              </div>
            </div>
          )}

          <StickyTableWrapper
            tableContainerClassName="min-h-[280px]"
            label="Tabel Pengajuan Penghapusan Aset (Disposal)"
          >
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-black dark:text-slate-200 font-bold uppercase bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 sticky top-0 z-10 shadow-xs">
                <tr>
                  <th className="px-5 py-3 font-bold w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-400 text-primary-600 focus:ring-primary-500" 
                      checked={selectedIds.length === filteredDisposals.length && filteredDisposals.length > 0} 
                      onChange={toggleSelectAll} 
                    />
                  </th>
                  <th className="px-5 py-3 font-bold">No. SK / Berkas</th>
                  <th className="px-5 py-3 font-bold">Tanggal</th>
                  <th className="px-5 py-3 font-bold">Aset yang Dihapus</th>
                  <th className="px-5 py-3 font-bold text-center">Jumlah (Unit)</th>
                  <th className="px-5 py-3 font-bold text-right">Total Nilai Buku</th>
                  <th className="px-5 py-3 font-bold">Metode</th>
                  <th className="px-5 py-3 font-bold">Alasan</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 font-bold text-right pr-6">Cetak & Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredDisposals.length > 0 ? (
                  filteredDisposals.map((item) => {
                    const asset = assets.find(a => a.id === item.assetId);
                    const jumlahUnit = item.jumlah || 1;
                    const totalNilai = (asset?.harga || 0) * jumlahUnit;
                    const defaultNoSurat = item.nomorSurat || `BA/${String(item.id).replace(/\D/g, '').padStart(3, '0')}/${new Date(item.tanggalPengajuan).getFullYear()}`;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4 text-center">
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-400 text-primary-600 focus:ring-primary-500" 
                            checked={selectedIds.includes(item.id)} 
                            onChange={() => toggleSelect(item.id)} 
                          />
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded inline-block border border-slate-300">
                            {defaultNoSurat}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {new Date(item.tanggalPengajuan).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-4 max-w-xs">
                          <div className="font-bold text-slate-950 truncate">{asset ? asset.nama : "Barang Tidak Ditemukan"}</div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-xs text-slate-600">{asset?.kodeBarang || "-"}</span>
                            {asset?.nibar && (
                              <span className="text-[10px] bg-sky-50 text-sky-800 font-mono px-1.5 py-0.2 rounded border border-sky-200 font-semibold" title={`NIBAR: ${asset.nibar}`}>
                                NIBAR: {asset.nibar.substring(0, 16)}...
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                            {jumlahUnit} Unit
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-black">
                          Rp {totalNilai.toLocaleString('id-ID')}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-300">
                            {item.metode}
                          </span>
                        </td>
                        <td className="px-5 py-4 max-w-[200px]">
                          <span className="text-slate-800 text-xs line-clamp-1 font-medium" title={item.alasan}>
                            {item.alasan}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={item.status === "Selesai" ? "success" : item.status === "Disetujui" ? "default" : (item.status as string) === "Ditolak" ? "destructive" : "warning"}>
                            {item.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-right pr-6">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openPrintLabel(item.id)}
                              title="Cetak Label Stiker Barang Ini"
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors inline-flex items-center gap-1 text-xs font-bold"
                            >
                              <Tag className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Label</span>
                            </button>
                            <button
                              onClick={() => openPrintLetter(item.id)}
                              title="Cetak Surat / Berita Acara Penghapusan"
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors inline-flex items-center gap-1 text-xs font-bold"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Surat BA</span>
                            </button>
                            <RowActions actions={[
                              { label: "Detail Pengajuan", icon: Eye, onClick: () => openDetail(item.id) },
                              { label: "Cetak Label Fisik", icon: Tag, onClick: () => openPrintLabel(item.id) },
                              { label: "Cetak Surat / BA", icon: FileText, onClick: () => openPrintLetter(item.id) },
                              { label: "Edit Pengajuan", icon: Edit, onClick: () => openEdit(item.id) },
                              { label: "Hapus Catatan", icon: Trash2, variant: "destructive", onClick: () => openDeleteModal(item.id, asset ? asset.nama : "Data") }
                            ]} />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="px-6 py-16 text-center text-slate-700">
                      <div className="flex flex-col items-center justify-center">
                        <Inbox className="h-12 w-12 text-slate-400 mb-3" />
                        <p className="text-black font-bold text-base">Tidak Ada Data Penghapusan</p>
                        <p className="text-slate-600 text-sm mt-1">Belum ada catatan penghapusan aset atau filter pencarian tidak menemukan hasil.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </StickyTableWrapper>
        </CardContent>
      </Card>

      {/* Form Modal: Ajukan / Edit Penghapusan */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedDisposalId ? "Edit Pengajuan Penghapusan Aset" : "Formulir Pengajuan Penghapusan Aset BMD"}
        onSubmit={handleSave}
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-bold text-slate-900">Pilih Aset yang Akan Dihapus *</label>
            <select 
              name="assetId" 
              required 
              defaultValue={selectedDisposal?.assetId || ''} 
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none bg-white font-medium text-black"
            >
              <option value="">-- Pilih aset BMD dari daftar KIB --</option>
              {assets.map(a => (
                <option key={a.id} value={a.id}>
                  {a.nama} ({a.kodeBarang}) {a.nibar ? `[NIBAR: ${a.nibar.substring(0, 16)}...]` : ''} - Nilai: Rp {a.harga.toLocaleString('id-ID')}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-900">Jumlah Unit yang Dihapuskan *</label>
              <input 
                name="jumlah" 
                type="number" 
                min="1" 
                required 
                defaultValue={selectedDisposal?.jumlah || 1} 
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none font-bold text-black" 
                placeholder="Contoh: 1, 5, 10 unit..."
              />
              <p className="text-xs text-slate-600">Jumlah fisik barang rusak berat atau musnah.</p>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-900">Nomor Surat / SK Penghapusan</label>
              <input 
                name="nomorSurat" 
                type="text" 
                defaultValue={selectedDisposal?.nomorSurat || `028/${Math.floor(100 + Math.random() * 900)}/418.20/SMPN3/${new Date().getFullYear()}`} 
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none font-mono text-black font-semibold" 
                placeholder="028/045/418.20/SMPN3/2025"
              />
              <p className="text-xs text-slate-600">Nomor SK / Berita Acara resmi dari sekolah atau dinas.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-900">Tanggal Pengajuan *</label>
              <input 
                name="tanggalPengajuan" 
                required 
                defaultValue={selectedDisposal ? new Date(selectedDisposal.tanggalPengajuan).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} 
                type="date" 
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none font-semibold text-black" 
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-900">Metode Penghapusan *</label>
              <select 
                name="metode" 
                required 
                defaultValue={selectedDisposal?.metode || 'Pemusnahan'} 
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none bg-white font-semibold text-black"
              >
                <option value="Pemusnahan">Pemusnahan (Bakar / Daur Ulang / Hancur)</option>
                <option value="Lelang">Penjualan / Lelang Resmi Melalui KPKNL</option>
                <option value="Hibah">Hibah ke Lembaga Lain</option>
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-bold text-slate-900">Nama Petugas Penanggung Jawab / Pengurus Barang</label>
            <input 
              name="penanggungJawab" 
              type="text" 
              defaultValue={selectedDisposal?.penanggungJawab || schoolProfile?.operator || 'Pengurus Barang SMPN 3 Kras'} 
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none font-semibold text-black" 
              placeholder="Nama penanggung jawab pengajuan..."
            />
          </div>

          {selectedDisposal && (
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-900">Status Proses</label>
              <select 
                name="status" 
                defaultValue={selectedDisposal.status} 
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none bg-white font-semibold text-black"
              >
                <option value="Diajukan">Dalam Pengajuan</option>
                <option value="Disetujui">Disetujui Kepala Sekolah / Verifikasi Dinas</option>
                <option value="Selesai">Proses Selesai / Resmi Dihapus dari KIB</option>
              </select>
            </div>
          )}

          <div className="grid gap-2">
            <label className="text-sm font-bold text-slate-900">Alasan Kuat Penghapusan *</label>
            <textarea 
              name="alasan" 
              required 
              defaultValue={selectedDisposal?.alasan || ''} 
              rows={3} 
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none font-medium text-black" 
              placeholder="Contoh: Barang mengalami kerusakan total/rusak berat (RB), tidak dapat diperbaiki secara ekonomis, terbakar/lapuk karena usia pakai..."
            ></textarea>
          </div>
        </div>
      </FormModal>

      {/* Detail Modal */}
      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Dokumen & Rincian Penghapusan Aset"
      >
        {selectedDisposal && selectedDisposalAsset ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-300 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-700">
                  <FileX className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Berita Acara Penghapusan</h4>
                  <div className="flex items-center gap-2 text-slate-700 text-xs mt-0.5 font-medium">
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-300 font-bold text-black">
                      {selectedDisposal.nomorSurat || selectedDisposal.id}
                    </span>
                    <span>•</span>
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(selectedDisposal.tanggalPengajuan).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
              <Badge 
                variant={
                  selectedDisposal.status === "Selesai" ? "success" : 
                  selectedDisposal.status === "Disetujui" ? "default" : "warning"
                }
                className="text-sm px-3 py-1 font-bold"
              >
                Status: {selectedDisposal.status}
              </Badge>
            </div>

            {/* Asset Identity Card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-300 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-slate-600 block text-xs uppercase font-bold tracking-wider mb-1">Identitas Barang Milik Daerah</span>
                  <span className="font-extrabold text-slate-950 block text-xl">{selectedDisposalAsset.nama}</span>
                  <span className="font-mono text-slate-700 text-sm font-semibold mt-1 block">
                    Kode Barang: {selectedDisposalAsset.kodeBarang} {selectedDisposalAsset.nomorRegister ? `• Reg: ${selectedDisposalAsset.nomorRegister}` : ''}
                  </span>
                  {selectedDisposalAsset.nibar && (
                    <span className="inline-block mt-2 font-mono text-xs bg-sky-100 text-sky-900 border border-sky-300 px-2 py-1 rounded font-bold">
                      NIBAR: {selectedDisposalAsset.nibar}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-slate-600 block text-xs uppercase font-bold tracking-wider mb-1">Jumlah Unit Dihapus</span>
                  <span className="inline-block bg-rose-600 text-white font-extrabold text-lg px-3 py-1 rounded-lg">
                    {selectedDisposal.jumlah || 1} Unit
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-600 block font-medium">Harga Satuan:</span>
                  <span className="font-bold text-slate-900">Rp {(selectedDisposalAsset.harga || 0).toLocaleString('id-ID')}</span>
                </div>
                <div>
                  <span className="text-slate-600 block font-medium">Total Nilai Buku Dihapus:</span>
                  <span className="font-extrabold text-rose-700 text-sm">
                    Rp {((selectedDisposalAsset.harga || 0) * (selectedDisposal.jumlah || 1)).toLocaleString('id-ID')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 block font-medium">Metode Rencana:</span>
                  <span className="font-bold text-slate-900">{selectedDisposal.metode}</span>
                </div>
              </div>
            </div>

            {/* Reasons */}
            <div className="space-y-1.5">
              <h5 className="font-bold text-slate-900 text-sm">Alasan Kuat Penghapusan:</h5>
              <div className="bg-white border border-slate-300 p-3.5 rounded-lg text-sm text-slate-800 leading-relaxed font-medium">
                {selectedDisposal.alasan}
              </div>
            </div>

            {/* Approvals */}
            <div className="space-y-3 pt-2 border-t border-slate-300">
              <h5 className="font-bold text-slate-900 text-sm">Alur Persetujuan & Eksekusi:</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                    <CheckCircle className="w-4 h-4" />
                    1. Pengurus Barang
                  </div>
                  <p className="text-[11px] text-emerald-950 mt-1 font-medium">{selectedDisposal.penanggungJawab || schoolProfile?.operator || 'Pengurus Barang'}</p>
                </div>

                <div className={`p-3 rounded-lg border ${selectedDisposal.status !== 'Diajukan' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`flex items-center gap-1.5 font-bold text-xs ${selectedDisposal.status !== 'Diajukan' ? 'text-emerald-800' : 'text-slate-600'}`}>
                    <CheckCircle className="w-4 h-4" />
                    2. Kepala Sekolah
                  </div>
                  <p className="text-[11px] text-slate-800 mt-1 font-medium">{schoolProfile?.kepalaSekolah || 'Kepala Sekolah'}</p>
                </div>

                <div className={`p-3 rounded-lg border ${selectedDisposal.status === 'Selesai' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`flex items-center gap-1.5 font-bold text-xs ${selectedDisposal.status === 'Selesai' ? 'text-emerald-800' : 'text-slate-600'}`}>
                    <CheckCircle className="w-4 h-4" />
                    3. Berita Acara & Label
                  </div>
                  <p className="text-[11px] text-slate-800 mt-1 font-medium">
                    {selectedDisposal.status === 'Selesai' ? 'Resmi Dihapuskan' : 'Menunggu Pelaksanaan'}
                  </p>
                </div>
              </div>
            </div>

            {/* Print Action Buttons */}
            <div className="mt-8 pt-4 border-t border-slate-300 flex flex-wrap gap-2.5">
              <Button 
                variant="outline" 
                className="flex-1 bg-white border-rose-300 text-rose-700 hover:bg-rose-50 font-bold"
                onClick={() => {
                  setSelectedDisposalIdsForLabel([selectedDisposal.id]);
                  setIsLabelModalOpen(true);
                }}
              >
                <Tag className="mr-2 h-4 w-4 text-rose-600" /> 
                Cetak Stiker Label ({selectedDisposal.jumlah || 1} Unit)
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 bg-white border-blue-300 text-blue-700 hover:bg-blue-50 font-bold" 
                onClick={() => setIsPrintModalOpen(true)}
              >
                <FileText className="mr-2 h-4 w-4 text-blue-600" /> 
                Cetak Surat Berita Acara (BA)
              </Button>
              {selectedDisposal.status !== "Selesai" && (
                <Button 
                  variant="default" 
                  className="w-full sm:w-auto font-bold bg-primary-600 hover:bg-primary-700 text-white" 
                  onClick={() => {
                    if (selectedDisposal.status === "Diajukan") {
                      approveDisposalAndArchive(selectedDisposal.id, "Kepala Sekolah / Admin Sarpras");
                      handleAction(`Permohonan penghapusan disetujui & aset master otomatis diarsipkan ke status Dihapus`, 'success');
                    } else {
                      setDisposals(prev => prev.map(d => d.id === selectedDisposal.id ? { ...d, status: "Selesai" } : d));
                      handleAction(`Proses eksekusi penghapusan ditandai selesai resmi`, 'success');
                    }
                    setIsDetailModalOpen(false);
                  }}
                >
                  {selectedDisposal.status === "Diajukan" ? "Setujui Permohonan (Arsipkan Master)" : "Tandai Selesai Dieksekusi"}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-700 font-medium">Mencari data pengajuan...</div>
        )}
      </DetailModal>

      {/* Surat / Berita Acara Penghapusan Modal */}
      <PrintDisposalReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        disposal={selectedDisposal}
        asset={selectedDisposalAsset}
      />

      {/* Label Stiker Fisik Barang Dihapus Modal (Mendukung Satuan Maupun Banyak Barang) */}
      <PrintDisposalLabelModal
        isOpen={isLabelModalOpen}
        onClose={() => {
          setIsLabelModalOpen(false);
          setSelectedDisposalIdsForLabel([]);
        }}
        items={disposalItemsForLabel}
        disposal={selectedDisposal}
        asset={selectedDisposalAsset}
      />

      {/* Delete Confirmation Modal */}
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
