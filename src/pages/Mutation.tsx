import React, { useState } from "react";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { DataActions } from "../components/shared/DataActions";
import { useData } from "../contexts/DataContext";
import { Plus, Search, ArrowRight, Eye, Edit, Trash2, Calendar, MapPin, Box , ChevronDown, Filter, Inbox} from "lucide-react";
import { RowActions } from "../components/shared/RowActions";
import { FormModal } from "../components/shared/FormModal";
import { DetailModal } from "../components/shared/DetailModal";
import { useToast } from "../contexts/ToastContext";
import { printRawHtml } from "../lib/printUtils";
import { exportToExcel, exportToPdf } from "../lib/exportUtils";
import { ConfirmDeleteModal } from "../components/shared/ConfirmDeleteModal";
import { StickyTableWrapper } from "../components/shared/StickyTableWrapper";

export default function Mutation() {
  const { 
    mutations, setMutations, assets, rooms, schoolProfile, 
    completeMutation, getAssetLiveStatus, updateAssetWithAudit 
  } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [sortBy, setSortBy] = useState("Terbaru");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMutationId, setSelectedMutationId] = useState<string | null>(null);
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModalState, setDeleteModalState] = useState<{isOpen: boolean, isBulk: boolean, idToDelete?: string, title?: string, message?: string}>({isOpen: false, isBulk: false});
const toast = useToast();

  
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
      setMutations(prev => prev.filter(item => !selectedIds.includes(item.id)));
      toast(`Berhasil menghapus ${selectedIds.length} data terpilih.`, 'success');
      setSelectedIds([]);
    } else if (deleteModalState.idToDelete) {
      setMutations(prev => prev.filter(item => item.id !== deleteModalState.idToDelete));
      toast('Berhasil menghapus data.', 'success');
      setSelectedIds(prev => prev.filter(id => id !== deleteModalState.idToDelete));
    }
    setDeleteModalState({ isOpen: false, isBulk: false });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredMutations.length && filteredMutations.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMutations.map(item => item.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]);
  };
const handleAction = (msg: string, type: 'info'|'success'|'error' = 'info') => toast(msg, type);

  const openDetail = (id: string) => {
    setSelectedMutationId(id);
    setIsDetailModalOpen(true);
  };

  const openEdit = (id: string) => {
    setSelectedMutationId(id);
    setIsModalOpen(true);
    handleAction("Memuat formulir mutasi");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data: any = {
      assetId: formData.get('assetId'),
      dariRuanganId: formData.get('dariRuanganId'),
      keRuanganId: formData.get('keRuanganId'),
      tanggalMutasi: formData.get('tanggalMutasi'),
      status: formData.get('status') || 'Proses',
      alasan: formData.get('alasan'),
    };
    
    if (selectedMutationId) {
      setMutations(prev => prev.map(m => m.id === selectedMutationId ? { ...m, ...data } : m));
      if (data.status === 'Selesai' && data.keRuanganId) {
        updateAssetWithAudit(data.assetId, { ruanganId: data.keRuanganId }, "Admin Sarpras", `Mutasi ID #${selectedMutationId} diselesaikan.`);
      }
      handleAction("Mutasi aset telah diperbarui & data master ruangan disinkronisasi", "success");
    } else {
      const newMutId = `MUT-${Date.now()}`;
      setMutations(prev => [...prev, { id: newMutId, ...data }]);
      if (data.status === 'Selesai' && data.keRuanganId) {
        updateAssetWithAudit(data.assetId, { ruanganId: data.keRuanganId }, "Admin Sarpras", `Mutasi ID #${newMutId} langsung selesai.`);
      }
      handleAction("Mutasi aset berhasil dicatat & data master ruangan disinkronisasi", "success");
    }
    setIsModalOpen(false);
  };

  const selectedMutation = mutations.find(m => m.id === selectedMutationId);
  const selectedMutationAsset = selectedMutation ? assets.find(a => a.id === selectedMutation.assetId) : null;
  const selectedMutationDariRuang = selectedMutation ? rooms.find(r => r.id === selectedMutation.dariRuanganId) : null;
  const selectedMutationKeRuang = selectedMutation ? rooms.find(r => r.id === selectedMutation.keRuanganId) : null;

  const filteredMutations = (mutations || []).filter(item => {
    if (!item) return false;
    const asset = assets.find(a => a.id === item.assetId);
    const assetName = (asset?.nama || "").toLowerCase();
    const alasan = (item.alasan || "").toLowerCase();
    const term = (searchTerm || "").toLowerCase().trim();
    
    const matchesSearch = !term || assetName.includes(term) || alasan.includes(term);
    const matchesStatus = filterStatus === "Semua" || item.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case "Terbaru":
        return new Date(b.tanggalMutasi || 0).getTime() - new Date(a.tanggalMutasi || 0).getTime();
      case "Terlama":
        return new Date(a.tanggalMutasi || 0).getTime() - new Date(b.tanggalMutasi || 0).getTime();
      case "Aset A-Z": {
        const assetA = assets.find(as => as.id === a.assetId)?.nama || "";
        const assetB = assets.find(as => as.id === b.assetId)?.nama || "";
        return assetA.localeCompare(assetB);
      }
      default:
        return 0;
    }
  });

  const exportColumns = [
    { header: "Tanggal Mutasi", key: "tanggalMutasi", render: (item: any) => new Date(item.tanggalMutasi).toLocaleDateString("id-ID") },
    { header: "NIBAR", key: "nibar", render: (item: any) => { const a = assets.find(ast => ast.id === item.assetId); return a?.nibar || a?.nomorRegister || "-"; } },
    { header: "Kode Barang", key: "kodeBarang", render: (item: any) => { const a = assets.find(ast => ast.id === item.assetId); return a?.kodeBarang || a?.kodeAset || "-"; } },
    { header: "Nama Aset & Merek", key: "assetId", render: (item: any) => { const a = assets.find(ast => ast.id === item.assetId); return a ? `${a.nama}${a.merk ? ` (${a.merk})` : ''}` : "-"; } },
    { header: "Dari Ruangan", key: "dariRuanganId", render: (item: any) => { const r = rooms.find(rm => rm.id === item.dariRuanganId); return r ? `${r.nama} (${r.penanggungJawab || '-'})` : "-"; } },
    { header: "Ke Ruangan", key: "keRuanganId", render: (item: any) => { const r = rooms.find(rm => rm.id === item.keRuanganId); return r ? `${r.nama} (${r.penanggungJawab || '-'})` : "-"; } },
    { header: "Alasan Pemindahan", key: "alasan", render: (item: any) => item.alasan || "-" },
    { header: "Status", key: "status" },
  ];

  const handleExportExcel = () => {
    exportToExcel(filteredMutations, exportColumns, `Data_Detail_Mutasi_Aset`);
    toast("Berhasil mengekspor data mutasi detail ke Excel", "success");
  };

  const handleExportPdf = () => {
    exportToPdf(filteredMutations, exportColumns, `Laporan Detail Mutasi Aset Sarpras`, schoolProfile, `Total Mutasi: ${filteredMutations.length} Transaksi`);
    toast("Berhasil mengekspor data mutasi detail ke PDF", "success");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Mutasi Aset</h2>
          <p className="text-slate-700">Pencatatan perpindahan aset antar ruangan atau unit kerja.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DataActions 
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
          />
          <Button onClick={() => { setSelectedMutationId(null); setIsModalOpen(true); }}>
            <Plus className="mr-2 w-4 h-4" />
            Catat Mutasi
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-300 bg-slate-50/50 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="relative w-full lg:w-72 shrink-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-600" />
              <input
                type="text"
                placeholder="Cari aset yang dimutasi..."
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
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full sm:w-auto appearance-none bg-white px-4 py-2 pr-10 text-sm border border-slate-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all hover:bg-slate-50 transition-colors shadow-sm"
              >
                <option value="Semua">Semua Status</option>
                <option value="Diajukan">Proses</option>
                <option value="Selesai">Selesai</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
            </div>
              <div className="relative w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto appearance-none bg-white px-4 py-2 pr-10 text-sm border border-slate-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all font-medium text-primary-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <option value="Terbaru">Urutkan: Mutasi Terbaru</option>
                <option value="Terlama">Urutkan: Mutasi Terlama</option>
                <option value="Aset A-Z">Urutkan: Nama Aset A-Z</option>
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
          label="Tabel Riwayat Mutasi Aset"
        >
          <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 sticky top-0 z-10 shadow-xs">
<tr>
<th className="px-6 py-3 font-medium w-12"><input type="checkbox" className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" checked={selectedIds.length === filteredMutations.length && filteredMutations.length > 0} onChange={toggleSelectAll} /></th>
                  <th className="px-6 py-3 font-medium">Tanggal</th>
                  <th className="px-6 py-3 font-medium">Aset yang Dimutasi</th>
                  <th className="px-6 py-3 font-medium">Perpindahan Ruangan</th>
                  <th className="px-6 py-3 font-medium">Alasan Mutasi</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
                                          <tbody className="divide-y divide-slate-100">
                {filteredMutations.length > 0 ? (
                  filteredMutations.map((item) => {
                    const asset = assets.find(a => a.id === item.assetId);
const dariRuang = rooms.find(r => r.id === item.dariRuanganId);
const keRuang = rooms.find(r => r.id === item.keRuanganId);
                    return (
                                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4"><input type="checkbox" className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} /></td>
                      <td className="px-6 py-4 font-medium text-slate-900">{new Date(item.tanggalMutasi).toLocaleDateString("id-ID")}</td>
                      <td className="px-6 py-4">{asset ? asset.nama : "Unknown"}</td>
                      <td className="px-6 py-4 text-slate-700">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-700 line-through">{dariRuang ? dariRuang.nama : "-"}</span>
                            <span>&rarr;</span>
                            <span className="font-medium text-primary-600">{keRuang ? keRuang.nama : "-"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-700 line-clamp-1" title={item.alasan}>{item.alasan}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={item.status === "Selesai" ? "success" : (item.status as string) === "Ditolak" ? "destructive" : "warning"}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right pr-4">
                        <RowActions actions={[
                          ...(item.status === 'Proses' ? [
                            { label: "Selesaikan", icon: Box, onClick: () => { setMutations(prev => prev.map(m => m.id === item.id ? { ...m, status: "Selesai" } : m)); handleAction("Mutasi selesai", "success"); } }
                          ] : []),
                          { label: "Update Status", icon: Edit, onClick: () => { setSelectedMutationId(item.id); setIsModalOpen(true); } },
                          
                          { label: "Hapus", icon: Trash2, variant: "destructive", onClick: () => openDeleteModal(item.id, asset ? asset.nama : "Data") }
                        ]} />
                      </td>
                    </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-700">
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

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedMutationId ? "Edit Mutasi Aset" : "Formulir Mutasi Aset Baru"}
        onSubmit={handleSave}
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-900">Pilih Aset</label>
              <span className="text-xs text-primary-700 bg-primary-50 px-2 py-0.5 rounded font-medium">Validasi Kunci Status</span>
            </div>
            <select name="assetId" required defaultValue={selectedMutation?.assetId || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none bg-white">
              <option value="">Pilih aset yang akan dimutasi...</option>
              {assets.map(a => {
                const live = getAssetLiveStatus(a.id);
                const isCurrent = selectedMutation?.assetId === a.id;
                const isAvailable = live.canMutate || isCurrent;
                return (
                  <option 
                    key={a.id} 
                    value={a.id}
                    disabled={!isAvailable}
                    className={!isAvailable ? "text-slate-400 bg-slate-100" : "text-slate-900"}
                  >
                    {!isAvailable ? `[TERKUNCI: ${live.status}] ` : ""}{a.nama} ({a.kodeBarang || a.kodeAset || a.nomorRegister}) {!isAvailable ? `— ${live.lockReason}` : ""}
                  </option>
                );
              })}
            </select>
            <p className="text-xs text-slate-700">Barang yang sedang dipinjam atau dalam servis tidak dapat dimutasi.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-900">Dari Ruangan</label>
              <select name="dariRuanganId" required defaultValue={selectedMutation?.dariRuanganId || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none bg-white">
                <option value="">Pilih ruangan asal...</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.nama}</option>)}
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-900">Ke Ruangan</label>
              <select name="keRuanganId" required defaultValue={selectedMutation?.keRuanganId || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none bg-white">
                <option value="">Pilih ruangan tujuan...</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.nama}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-900">Tanggal Mutasi</label>
              <input name="tanggalMutasi" required defaultValue={selectedMutation ? new Date(selectedMutation.tanggalMutasi).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} type="date" className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none" />
            </div>
             <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-900">Status</label>
              <select name="status" defaultValue={selectedMutation?.status || 'Proses'} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none bg-white">
                <option value="Diajukan">Dalam Proses Pindahan</option>
                <option value="Selesai">Sudah Selesai Dipindah</option>
              </select>
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">Alasan / Keterangan</label>
            <textarea name="alasan" required defaultValue={selectedMutation?.alasan || ''} rows={3} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none" placeholder="Tuliskan alasan mutasi..."></textarea>
          </div>
        </div>
      </FormModal>

      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Dokumen Mutasi Aset"
      >
        {selectedMutation && selectedMutationAsset ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-300 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600">
                  <Box className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Mutasi {selectedMutationAsset.kodeBarang}</h4>
                  <p className="text-sm text-slate-700">{new Date(selectedMutation.tanggalMutasi).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
              <Badge 
                variant={selectedMutation.status === "Selesai" ? "success" : "warning"}
                className="text-sm px-3 py-1"
              >
                Status: {selectedMutation.status}
              </Badge>
            </div>

            <div className="grid gap-4">
              <h5 className="font-semibold text-slate-900">Detail Aset yang Dimutasi</h5>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-300 flex flex-col gap-2">
                <p className="font-medium text-slate-800 text-lg">{selectedMutationAsset.nama}</p>
                <div className="grid sm:grid-cols-2 text-sm gap-2 mt-2">
                  <p><span className="text-slate-700">Kode Barang:</span> <span className="font-medium font-mono text-slate-700">{selectedMutationAsset.kodeBarang}</span></p>
                  <p><span className="text-slate-700">Kategori:</span> <span className="font-medium text-slate-700">{selectedMutationAsset.kategori}</span></p>
                  {selectedMutationAsset.merk && <p><span className="text-slate-700">Merek/Tipe:</span> <span className="font-medium text-slate-700">{selectedMutationAsset.merk}</span></p>}
                </div>
              </div>
            </div>

            <div className="grid gap-4 relative">
               <h5 className="font-semibold text-slate-900">Rincian Perpindahan (Lokasi)</h5>
               <div className="relative pt-2 pb-6 pl-4 ml-3 border-l-2 border-primary-100 space-y-8">
                  <div className="relative">
                    <div className="absolute -left-[23px] top-0 h-4 w-4 rounded-full border-2 border-slate-300 bg-white" />
                    <div>
                      <p className="text-xs uppercase font-bold text-slate-700 tracking-wider">Ruangan Asal</p>
                      <p className="text-slate-900 font-medium text-lg mt-1">{selectedMutationDariRuang?.nama}</p>
                      <p className="text-slate-700 text-sm mt-0.5">Penanggung Jawab: {selectedMutationDariRuang?.penanggungJawab}</p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute -left-[23px] top-0 h-4 w-4 rounded-full border-2 border-primary-500 bg-white" />
                    <div>
                      <p className="text-xs uppercase font-bold text-primary-600 tracking-wider">Ruangan Tujuan / Baru</p>
                      <p className="text-slate-900 font-medium text-lg mt-1">{selectedMutationKeRuang?.nama}</p>
                      <p className="text-slate-700 text-sm mt-0.5">Penanggung Jawab: {selectedMutationKeRuang?.penanggungJawab}</p>
                    </div>
                  </div>
               </div>
            </div>

            <div className="grid gap-2 pt-2 border-t border-slate-300">
               <h5 className="font-semibold text-slate-900">Alasan Mutasi</h5>
               <div className="bg-white border border-slate-300 p-4 rounded-lg text-sm text-slate-700 leading-relaxed">
                  {selectedMutation.alasan}
               </div>
            </div>
            
            <div className="mt-8 border-t border-slate-300 pt-6">
              <h5 className="font-semibold text-slate-800 mb-2">Pengaturan Cetak BAST Mutasi</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nomor Surat</label>
                  <input
                    type="text"
                    className="w-full px-2 py-1.5 bg-white text-slate-900 border border-slate-300 rounded text-sm"
                    defaultValue={`${String(selectedMutation.id).replace(/\D/g, '').padStart(3, '0') || '001'} / BAST-MUTASI / SMP / ${new Date(selectedMutation.tanggalMutasi).getFullYear()}`}
                    id="nomor-surat-mutasi"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Pihak Pertama (Menyerahkan)</label>
                  <input type="text" id="m-pihak1" defaultValue={selectedMutationDariRuang?.penanggungJawab || ''} className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-sm mb-1" placeholder="Nama" />
                  <input type="text" id="m-nip1" defaultValue="" className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-sm" placeholder="NIP (Opsional)" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Pihak Kedua (Menerima)</label>
                  <input type="text" id="m-pihak2" defaultValue={selectedMutationKeRuang?.penanggungJawab || ''} className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-sm mb-1" placeholder="Nama" />
                  <input type="text" id="m-nip2" defaultValue="" className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-sm" placeholder="NIP (Opsional)" />
                </div>
                <div className="sm:col-start-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Pengelola Barang / Aset</label>
                  <input type="text" id="m-pengelola" defaultValue={schoolProfile.operator || ''} className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-sm mb-1" placeholder="Nama" />
                  <input type="text" id="m-nip3" defaultValue={schoolProfile.nipOperator || ''} className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-sm" placeholder="NIP (Opsional)" />
                </div>
              </div>
              <div className="flex gap-3 print:hidden">
              <Button variant="outline" className="flex-1" onClick={() => {
                const mutationDate = new Date(selectedMutation.tanggalMutasi).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' });
                const customNomor = (document.getElementById('nomor-surat-mutasi') as HTMLInputElement)?.value || `${String(selectedMutation.id).replace(/\D/g, '').padStart(3, '0') || '001'} / BAST-MUTASI / SMP / ${new Date(selectedMutation.tanggalMutasi).getFullYear()}`;
                const pihak1Name = (document.getElementById('m-pihak1') as HTMLInputElement)?.value || "(....................)";
                const nip1 = (document.getElementById('m-nip1') as HTMLInputElement)?.value;
                const parties1Nip = nip1 ? (nip1.startsWith('NIP') ? nip1 : `NIP. ${nip1}`) : "";
                
                const pihak2Name = (document.getElementById('m-pihak2') as HTMLInputElement)?.value || "(....................)";
                const nip2 = (document.getElementById('m-nip2') as HTMLInputElement)?.value;
                const parties2Nip = nip2 ? (nip2.startsWith('NIP') ? nip2 : `NIP. ${nip2}`) : "";

                const pengelolaName = (document.getElementById('m-pengelola') as HTMLInputElement)?.value || "(....................)";
                const nip3 = (document.getElementById('m-nip3') as HTMLInputElement)?.value;
                const pengelolaNip = nip3 ? (nip3.startsWith('NIP') ? nip3 : `NIP. ${nip3}`) : "";
                
                const logoHtml = schoolProfile.logoDinas 
                  ? `<img src="${schoolProfile.logoDinas}" alt="Logo" style="width: 60px; height: 60px; object-fit: contain; margin-right: 15px; position: absolute; left: 0; top: 0;" />` 
                  : '';

                const docHtml = `
                  <div style="font-family: 'Times New Roman', Times, serif; line-height: 1.5; padding: 20px;">
                    <div style="text-align: center; border-bottom: 3px double; padding-bottom: 10px; margin-bottom: 20px; position: relative; min-height: 70px;">
                      ${logoHtml}
                      <h3 style="margin: 0; font-size: 14pt; font-weight: bold; text-transform: uppercase;">${schoolProfile.kementerian || 'KEMENTERIAN PENDIDIKAN'}</h3>
                      <h2 style="margin: 2px 0 5px; font-size: 16pt; font-weight: bold; text-transform: uppercase;">${schoolProfile.nama || 'NAMA SEKOLAH'}</h2>
                      <p style="margin: 0; font-size: 11pt;">${schoolProfile.alamat || ''} ${schoolProfile.kodePos || ''}</p>
                      <p style="margin: 0; font-size: 11pt; margin-bottom: 5px;">Telp: ${schoolProfile.telepon || '-'} | Email: ${schoolProfile.email || '-'} | Website: ${schoolProfile.website || '-'}</p>
                    </div>

                    <h3 style="text-align: center; text-decoration: underline; margin-bottom: 5px; font-size: 12pt;">BERITA ACARA SERAH TERIMA MUTASI BARANG</h3>
                    <p style="text-align: center; margin-top: 0; margin-bottom: 30px; font-size: 11pt;">Nomor: ${customNomor}</p>
                    
                    <p style="font-size: 11pt;">Pada hari ini, tanggal <strong>${mutationDate}</strong>, yang bertanda tangan di bawah ini:</p>
                    
                    <table style="width: 100%; border: none; margin-bottom: 10px; font-size: 11pt;">
                      <tr><td style="width: 20px; vertical-align: top;">1.</td><td style="width: 150px; border: none; padding: 2px;">Nama</td><td style="border: none; padding: 2px;">: <strong>${selectedMutationDariRuang?.penanggungJawab || "-"}</strong></td></tr>
                      <tr><td></td><td style="border: none; padding: 2px;">Jabatan</td><td style="border: none; padding: 2px;">: Penanggung Jawab ${selectedMutationDariRuang?.nama || "-"}</td></tr>
                      <tr><td></td><td colspan="2" style="padding: 2px;">Selanjutnya disebut <strong>PIHAK PERTAMA</strong> (Yang Menyerahkan)</td></tr>
                    </table>

                    <table style="width: 100%; border: none; margin-bottom: 15px; font-size: 11pt;">
                      <tr><td style="width: 20px; vertical-align: top;">2.</td><td style="width: 150px; border: none; padding: 2px;">Nama</td><td style="border: none; padding: 2px;">: <strong>${selectedMutationKeRuang?.penanggungJawab || "-"}</strong></td></tr>
                      <tr><td></td><td style="border: none; padding: 2px;">Jabatan</td><td style="border: none; padding: 2px;">: Penanggung Jawab ${selectedMutationKeRuang?.nama || "-"}</td></tr>
                      <tr><td></td><td colspan="2" style="padding: 2px;">Selanjutnya disebut <strong>PIHAK KEDUA</strong> (Yang Menerima)</td></tr>
                    </table>
                    
                    <p style="font-size: 11pt; text-align: justify;">PIHAK PERTAMA telah menyerahkan barang/aset berupa kepada PIHAK KEDUA, dan PIHAK KEDUA telah menerima penyerahan barang tersebut dalam kondisi seperti tercantum di bawah ini:</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11pt;">
                      <thead>
                        <tr>
                          <th style="border: 1px solid black; padding: 8px;">No</th>
                          <th style="border: 1px solid black; padding: 8px;">Kode Barang</th>
                          <th style="border: 1px solid black; padding: 8px;">Nama Barang / Aset</th>
                          <th style="border: 1px solid black; padding: 8px;">Ruangan Tujuan</th>
                          <th style="border: 1px solid black; padding: 8px;">Kondisi</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style="border: 1px solid black; padding: 8px; text-align: center;">1</td>
                          <td style="border: 1px solid black; padding: 8px; text-align: center;">${selectedMutationAsset.kodeBarang}</td>
                          <td style="border: 1px solid black; padding: 8px;">${selectedMutationAsset.nama}</td>
                          <td style="border: 1px solid black; padding: 8px; text-align: center;">${selectedMutationKeRuang?.nama || "-"}</td>
                          <td style="border: 1px solid black; padding: 8px; text-align: center;">${selectedMutationAsset.kondisi}</td>
                        </tr>
                      </tbody>
                    </table>

                    <p style="text-align: justify; font-size: 11pt; margin-bottom: 10px;">Alasan Mutasi: ${selectedMutation.alasan || "-"}</p>
                    <p style="text-align: justify; font-size: 11pt; margin-bottom: 40px; line-height: 1.5;">Demikian Berita Acara Serah Terima Mutasi Barang ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>
                    
                    <table style="width: 100%; border: none; text-align: center; font-size: 11pt;">
                      <tr>
                        <td style="width: 33%; border: none;">
                          <p style="margin: 0;">Yang Menyerahkan,<br/>PIHAK PERTAMA</p>
                          <p style="margin-top: 80px; margin-bottom: 0;"><strong><u>${pihak1Name}</u></strong></p>
                          <p style="margin-top: 2px;">${parties1Nip}</p>
                        </td>
                        <td style="width: 33%; border: none;">
                          <p style="margin: 0;">Mengetahui,<br/>Pengelola Barang / Aset</p>
                          <p style="margin-top: 80px; margin-bottom: 0;"><strong><u>${pengelolaName}</u></strong></p>
                          <p style="margin-top: 2px;">${pengelolaNip}</p>
                        </td>
                        <td style="width: 33%; border: none;">
                          <p style="margin: 0;">Yang Menerima,<br/>PIHAK KEDUA</p>
                          <p style="margin-top: 80px; margin-bottom: 0;"><strong><u>${pihak2Name}</u></strong></p>
                          <p style="margin-top: 2px;">${parties2Nip}</p>
                        </td>
                      </tr>
                    </table>
                  </div>
                `;
                printRawHtml(docHtml, "BAST Mutasi Barang / Aset");
              }}>
                Cetak BAST Mutasi
              </Button>
               {selectedMutation.status !== "Selesai" && (
                <Button variant="default" className="flex-1" onClick={() => {
                  completeMutation(selectedMutation.id, "Admin Sarpras");
                  setIsDetailModalOpen(false);
                  handleAction(`Mutasi ${selectedMutationAsset.nama} telah selesai & lokasi ruangan master data otomatis diperbarui`, 'success');
                }}>
                  Tandai Selesai (Diterima)
                </Button>
              )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-700">Mencari data mutasi...</div>
        )}
      </DetailModal>
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
