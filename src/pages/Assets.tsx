import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { formatISO } from "date-fns";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { DataActions } from "../components/shared/DataActions";
import { useData } from "../contexts/DataContext";
import { ImportDataModal } from "../components/shared/ImportDataModal";
import { Asset, AssetCategory, getAssetConditionBreakdown } from "../types";
import { Plus, Search, Filter, Eye, Edit, Trash2, QrCode, Package, LayoutGrid, List, Copy, ChevronDown , Inbox, Tag, Layers, CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle} from "lucide-react";
import { RowActions } from "../components/shared/RowActions";
import { FormModal } from "../components/shared/FormModal";
import { DetailModal } from "../components/shared/DetailModal";
import { useToast } from "../contexts/ToastContext";
import { exportToExcel, exportToPdf, exportKibBToExcel, exportKibBToCsv, exportDetailedAssetsToExcel } from "../lib/exportUtils";
import { BarcodeDisplay } from "../components/shared/BarcodeDisplay";
import { PrintBarcodesModal } from "../components/shared/PrintBarcodesModal";
import { PrintSchoolLabelsModal } from "../components/shared/PrintSchoolLabelsModal";
import { ConfirmDeleteModal } from "../components/shared/ConfirmDeleteModal";
import { StickyTableWrapper } from "../components/shared/StickyTableWrapper";
import { motion, AnimatePresence } from 'motion/react';

export default function Assets() {
  const { 
    assets, setAssets, rooms, schoolProfile, setMaintenances, setDisposals, 
    maintenances, borrowings, disposals,
    updateAssetWithAudit, deleteAssetSafe, isNibarUnique, isRegisterUnique, getAssetLiveStatus 
  } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearchTerm = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedKib, setSelectedKib] = useState<AssetCategory | "Semua">("Semua");
  const [selectedKondisi, setSelectedKondisi] = useState<string>("Semua");
  const [selectedTahun, setSelectedTahun] = useState<string>("Semua");
  const [selectedSumberDana, setSelectedSumberDana] = useState<string>("Semua");
  const [sortBy, setSortBy] = useState<string>("Terbaru (Tahun)");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isPrintAllModalOpen, setIsPrintAllModalOpen] = useState(false);
  const [isPrintSchoolModalOpen, setIsPrintSchoolModalOpen] = useState(false);
  const [isPrintAllSchoolModalOpen, setIsPrintAllSchoolModalOpen] = useState(false);
  const [isPrintSelectedSchoolModalOpen, setIsPrintSelectedSchoolModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModalState, setDeleteModalState] = useState<{isOpen: boolean, isBulk: boolean, idToDelete?: string, title?: string, message?: string}>({isOpen: false, isBulk: false});

  // Quantity & Condition Breakdown Form State
  const [formJumlah, setFormJumlah] = useState<number>(1);
  const [formSatuan, setFormSatuan] = useState<string>("Unit");
  const [formKondisiBaik, setFormKondisiBaik] = useState<number>(1);
  const [formKondisiRusakRingan, setFormKondisiRusakRingan] = useState<number>(0);
  const [formKondisiRusakBerat, setFormKondisiRusakBerat] = useState<number>(0);
  const [formKondisiHilang, setFormKondisiHilang] = useState<number>(0);
  const [formKondisiTidakDiketahui, setFormKondisiTidakDiketahui] = useState<number>(0);
  const [formPrimaryKondisi, setFormPrimaryKondisi] = useState<string>("Baik");

  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) {
      setSearchTerm(q);
    }
    const kib = searchParams.get("kib");
    if (kib) {
      setSelectedKib(decodeURIComponent(kib) as any);
    }
    const dana = searchParams.get("dana");
    if (dana) {
      if (dana === "bos") setSelectedSumberDana("BOS");
      else if (dana === "mandiri") setSelectedSumberDana("Mandiri");
      else setSelectedSumberDana("Semua");
    }
  }, [searchParams]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Update URL softly
    if (value) {
      searchParams.set("q", value);
    } else {
      searchParams.delete("q");
    }
    setSearchParams(searchParams, { replace: true });
  };
  
  const [formKib, setFormKib] = useState<AssetCategory>("Peralatan & Mesin (KIB B)");
  const [formImage, setFormImage] = useState<string | null>(null);
  const toast = useToast();

  const filteredAssets = (assets || []).filter(asset => {
    if (!asset) return false;
    const term = (searchTerm || "").toLowerCase().trim();
    const nama = (asset.nama || "").toLowerCase();
    const kode = (asset.kodeBarang || "").toLowerCase();
    const reg = (asset.nomorRegister || "").toLowerCase();
    const nibar = (asset.nibar || "").toLowerCase();
    const matchesSearch = !term || nama.includes(term) || kode.includes(term) || reg.includes(term) || nibar.includes(term);
      
    const matchesKib = selectedKib === "Semua" || asset.kategori === selectedKib;

    // Smart condition filter taking condition quantity breakdown into account
    const bd = getAssetConditionBreakdown(asset);
    let matchesKondisi = true;
    if (selectedKondisi !== "Semua") {
      if (selectedKondisi === "Baik") matchesKondisi = bd.baik > 0;
      else if (selectedKondisi === "Rusak Ringan") matchesKondisi = bd.rusakRingan > 0;
      else if (selectedKondisi === "Rusak Berat") matchesKondisi = bd.rusakBerat > 0;
      else if (selectedKondisi === "Hilang") matchesKondisi = bd.hilang > 0;
      else if (selectedKondisi === "Tidak Diketahui") matchesKondisi = bd.tidakDiketahui > 0;
      else matchesKondisi = asset.kondisi === selectedKondisi;
    }

    const matchesTahun = selectedTahun === "Semua" || String(asset.tahunPerolehan) === selectedTahun;

    const isBos = (asset.sumberDana || "").toLowerCase().includes("bos") || (asset.asalUsul || "").toLowerCase().includes("bos");
    const matchesDana = selectedSumberDana === "Semua" ||
      (selectedSumberDana === "BOS" && isBos) ||
      (selectedSumberDana === "Mandiri" && !isBos);

    return matchesSearch && matchesKib && matchesKondisi && matchesTahun && matchesDana;
  }).sort((a, b) => {
    switch (sortBy) {
      case "Terbaru (Tahun)":
        return (b.tahunPerolehan || 0) - (a.tahunPerolehan || 0);
      case "Terlama (Tahun)":
        return (a.tahunPerolehan || 0) - (b.tahunPerolehan || 0);
      case "Nama A-Z":
        return (a.nama || "").localeCompare(b.nama || "");
      case "Nama Z-A":
        return (b.nama || "").localeCompare(a.nama || "");
      case "Harga Tertinggi":
        return (b.harga || 0) - (a.harga || 0);
      case "Harga Terendah":
        return (a.harga || 0) - (b.harga || 0);
      default:
        return 0;
    }
  });

  const exportColumns = [
    { header: "Kode Barang", key: "kodeBarang" },
    { header: "NIBAR (44 Digit)", key: "nibar", render: (item: any) => item.nibar || item.nomorRegister || "-" },
    { header: "No. Register", key: "nomorRegister", render: (item: any) => item.nomorRegister || "-" },
    { header: "Nama Aset", key: "nama" },
    { header: "Merek / Tipe", key: "merk", render: (item: any) => item.merk || "-" },
    { header: "Spesifikasi / Ukuran", key: "spesifikasi", render: (item: any) => [item.spesifikasiLainnya, item.ukuranCc, item.ukuranBahan, item.bahan].filter(Boolean).join(", ") || "-" },
    { header: "Kategori", key: "kategori" },
    { header: "Ruangan / Lokasi", key: "ruanganId", render: (item: any) => { const r = rooms.find(rm => rm.id === item.ruanganId); return r ? r.nama : (item.ruanganId || "-"); } },
    { header: "Tahun", key: "tahunPerolehan" },
    { header: "Sumber Dana", key: "sumberDana", render: (item: any) => item.sumberDana || item.asalUsul || "BOS" },
    { header: "Harga Perolehan", key: "harga", render: (item: any) => `Rp ${(item.harga || 0).toLocaleString('id-ID')}` },
    { header: "Kondisi", key: "kondisi" },
    { header: "Keterangan", key: "keterangan", render: (item: any) => item.keterangan || item.catatan || "-" },
  ];

  const handleExportExcel = () => {
    if (selectedKib === "Semua") {
      exportDetailedAssetsToExcel(
        filteredAssets,
        schoolProfile,
        rooms,
        `Master_Data_Aset_Detail_${schoolProfile?.nama?.replace(/\s+/g, '_') || 'UPTD_SMPN_3_Kras'}`
      );
      toast("Berhasil mengekspor data aset lengkap ke Excel (Format Resmi 22 Kolom)", "success");
    } else if (selectedKib === "Peralatan & Mesin (KIB B)") {
      exportKibBToExcel(
        filteredAssets, 
        schoolProfile, 
        rooms, 
        `Daftar_Barang_KIB_B_${schoolProfile?.nama?.replace(/\s+/g, '_') || 'UPTD_SMPN_3_Kras'}`
      );
      toast("Berhasil mengekspor KIB B ke Excel (Format Resmi SIPD/BMD 21 Kolom)", "success");
    } else {
      exportToExcel(filteredAssets, exportColumns, `Data_Aset_${selectedKib.replace(/[^a-zA-Z0-9]/g, '_')}`);
      toast("Berhasil mengekspor KIB ke Excel dengan rincian lengkap", "success");
    }
  };

  const handleExportCsv = () => {
    const targetItems = selectedKib === "Semua" 
      ? filteredAssets.filter(a => a.kategori === "Peralatan & Mesin (KIB B)")
      : filteredAssets;
    exportKibBToCsv(
      targetItems.length > 0 ? targetItems : filteredAssets, 
      schoolProfile, 
      rooms, 
      `Daftar_Barang_KIB_B_${schoolProfile?.nama?.replace(/\s+/g, '_') || 'UPTD_SMPN_3_Kras'}`
    );
    toast("Berhasil mengekspor KIB B ke CSV (Format Resmi SIPD/BMD 21 Kolom)", "success");
  };

  const handleExportPdf = () => {
    exportToPdf(
      filteredAssets, 
      exportColumns, 
      `Laporan Detail Data Aset KIB - ${selectedKib}`, 
      schoolProfile,
      `Kategori: ${selectedKib} | Sumber Dana: ${selectedSumberDana} | Kondisi: ${selectedKondisi}`
    );
    toast("Berhasil mengekspor KIB ke PDF lengkap dengan tanda tangan dinas", "success");
  };

  const kibOptions: (AssetCategory | "Semua")[] = [
    "Semua",
    "Tanah (KIB A)",
    "Peralatan & Mesin (KIB B)",
    "Gedung & Bangunan (KIB C)",
    "Jalan, Irigasi & Jaringan (KIB D)",
    "Aset Tetap Lainnya (KIB E)",
    "Aset Tak Berwujud",
    "Ekstrakomptabel"
  ];
  
  const tahunOptions = ["Semua", ...Array.from(new Set(assets.map(a => String(a.tahunPerolehan)))).sort().reverse()];

  const handleAction = (action: string, assetName: string, type: 'info' | 'success' | 'error' = 'info') => {
    toast(`${action} untuk aset: ${assetName}`, type);
  };

  const openDeleteModal = (id: string, name: string) => {
    const live = getAssetLiveStatus(id);
    if (!live.canBorrow && live.status !== "Tersedia") {
      toast(`Aset "${name}" tidak dapat dihapus: ${live.lockReason || live.keterangan}. Selesaikan transaksi terlebih dahulu.`, "error");
      return;
    }

    setDeleteModalState({
      isOpen: true,
      isBulk: false,
      idToDelete: id,
      title: "Hapus Data Aset",
      message: `Apakah Anda yakin ingin menghapus aset "${name}"? Aksi ini tidak dapat dibatalkan.`
    });
  };

  const openBulkDeleteModal = () => {
    setDeleteModalState({
      isOpen: true,
      isBulk: true,
      title: "Hapus Kelompok Aset",
      message: `Apakah Anda yakin ingin menghapus ${selectedIds.length} data aset terpilih? Aksi ini tidak dapat dibatalkan.`
    });
  };

  const confirmDelete = () => {
    if (deleteModalState.isBulk) {
      const safeToDelete = selectedIds.filter(id => {
        const live = getAssetLiveStatus(id);
        return live.canBorrow || live.status === "Tersedia";
      });
      if (safeToDelete.length === 0) {
        toast("Semua aset terpilih sedang terlibat dalam sirkulasi aktif atau perbaikan, penghapusan dibatalkan demi integritas data.", "error");
        setDeleteModalState({ isOpen: false, isBulk: false });
        return;
      }
      setAssets(prev => prev.filter(a => !safeToDelete.includes(a.id)));
      toast(`Berhasil menghapus ${safeToDelete.length} aset terpilih (aset yang sedang dipinjam/diservis dilewati demi keamanan).`, 'success');
      setSelectedIds([]);
    } else if (deleteModalState.idToDelete) {
      const res = deleteAssetSafe(deleteModalState.idToDelete);
      if (res.success) {
        toast(res.message, 'success');
        setSelectedIds(prev => prev.filter(id => id !== deleteModalState.idToDelete));
      } else {
        toast(res.message, 'error');
      }
    }
    setDeleteModalState({ isOpen: false, isBulk: false });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAssets.length && filteredAssets.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAssets.map(a => a.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const rawJumlah = parseInt(formData.get('jumlah') as string);
    const jumlah = !isNaN(rawJumlah) && rawJumlah > 0 ? rawJumlah : formJumlah || 1;
    const satuan = (formData.get('satuan') as string) || formSatuan || 'Unit';

    const rawBaik = parseInt(formData.get('kondisiBaik') as string);
    const kondisiBaik = !isNaN(rawBaik) ? rawBaik : formKondisiBaik;

    const rawRusakRingan = parseInt(formData.get('kondisiRusakRingan') as string);
    const kondisiRusakRingan = !isNaN(rawRusakRingan) ? rawRusakRingan : formKondisiRusakRingan;

    const rawRusakBerat = parseInt(formData.get('kondisiRusakBerat') as string);
    const kondisiRusakBerat = !isNaN(rawRusakBerat) ? rawRusakBerat : formKondisiRusakBerat;

    const rawHilang = parseInt(formData.get('kondisiHilang') as string);
    const kondisiHilang = !isNaN(rawHilang) ? rawHilang : formKondisiHilang;

    const rawTidakDiketahui = parseInt(formData.get('kondisiTidakDiketahui') as string);
    const kondisiTidakDiketahui = !isNaN(rawTidakDiketahui) ? rawTidakDiketahui : formKondisiTidakDiketahui;

    let primaryKondisi = (formData.get('kondisi') as string) || formPrimaryKondisi || 'Baik';
    const conditionTallies = [
      { name: "Baik", count: kondisiBaik },
      { name: "Rusak Berat", count: kondisiRusakBerat },
      { name: "Rusak Ringan", count: kondisiRusakRingan },
      { name: "Hilang", count: kondisiHilang },
      { name: "Tidak Diketahui", count: kondisiTidakDiketahui },
    ];
    const activeSelectedTally = conditionTallies.find(t => t.name === primaryKondisi)?.count || 0;
    if (activeSelectedTally === 0) {
      const dominant = [...conditionTallies].sort((a, b) => b.count - a.count)[0];
      if (dominant && dominant.count > 0) {
        primaryKondisi = dominant.name as any;
      }
    }

    const assetData: any = {
      nama: formData.get('nama'),
      kodeBarang: formData.get('kodeBarang'),
      nomorRegister: formData.get('nomorRegister'),
      kategori: formKib,
      gambarUrl: formImage || undefined,
      tahunPerolehan: parseInt(formData.get('tahunPerolehan') as string) || new Date().getFullYear(),
      harga: parseInt(formData.get('harga') as string) || 0,
      sumberDana: formData.get('sumberDana'),
      jumlah,
      satuan,
      kondisiBaik,
      kondisiRusakRingan,
      kondisiRusakBerat,
      kondisiHilang,
      kondisiTidakDiketahui,
      kondisi: primaryKondisi,
      ruanganId: formKib === "Gedung & Bangunan (KIB C)" ? formData.getAll('ruanganId').join(',') : (formData.get('ruanganId') || ''),
      catatan: formData.get('catatan') || '',
      merk: formData.get('merk') || '',
      bahan: formData.get('bahan') || '',
      luasTanah: formData.get('luasTanah') ? parseInt(formData.get('luasTanah') as string) : undefined,
      statusHak: formData.get('statusHak') || undefined,
      letakAlamat: formData.get('letakAlamat') || undefined,
      tanggalSertifikat: formData.get('tanggalSertifikat') || undefined,
      nomorSertifikat: formData.get('nomorSertifikat') || undefined,
      penggunaan: formData.get('penggunaan') || undefined,
      ukuranCc: formData.get('ukuranCc') || undefined,
      nomorPabrik: formData.get('nomorPabrik') || undefined,
      nomorMesin: formData.get('nomorMesin') || undefined,
      nomorRangka: formData.get('nomorRangka') || undefined,
      nomorPolisi: formData.get('nomorPolisi') || undefined,
      nomorBpkb: formData.get('nomorBpkb') || undefined,
      nibar: formData.get('nibar') || undefined,
      spesifikasiLainnya: formData.get('spesifikasiLainnya') || undefined,
      tanggalPerolehan: formData.get('tanggalPerolehan') || undefined,
      komptabel: formData.get('komptabel') || undefined,
      skpd: formData.get('skpd') || undefined,
      lokasi: formData.get('lokasi') || undefined,
      uraianBarang: formData.get('uraianBarang') || undefined,
      kondisiBangunan: formData.get('kondisiBangunan') || undefined,
      bertingkat: formData.get('bertingkat') || undefined,
      beton: formData.get('beton') || undefined,
      luasLantai: formData.get('luasLantai') ? parseInt(formData.get('luasLantai') as string) : undefined,
      dokumenGedungTanggal: formData.get('dokumenGedungTanggal') || undefined,
      dokumenGedungNomor: formData.get('dokumenGedungNomor') || undefined,
      statusTanah: formData.get('statusTanah') || undefined,
      nomorKodeTanah: formData.get('nomorKodeTanah') || undefined,
      konstruksi: formData.get('konstruksi') || undefined,
      panjang: formData.get('panjang') ? parseInt(formData.get('panjang') as string) : undefined,
      lebar: formData.get('lebar') ? parseInt(formData.get('lebar') as string) : undefined,
      luasKibD: formData.get('luasKibD') ? parseInt(formData.get('luasKibD') as string) : undefined,
      dokumenTanggalKibD: formData.get('dokumenTanggalKibD') || undefined,
      dokumenNomorKibD: formData.get('dokumenNomorKibD') || undefined,
      statusTanahKibD: formData.get('statusTanahKibD') || undefined,
      nomorKodeTanahKibD: formData.get('nomorKodeTanahKibD') || undefined,
      bukuJudulPencipta: formData.get('bukuJudulPencipta') || undefined,
      bukuSpesifikasi: formData.get('bukuSpesifikasi') || undefined,
      seniAsalDaerah: formData.get('seniAsalDaerah') || undefined,
      seniPencipta: formData.get('seniPencipta') || undefined,
      seniBahan: formData.get('seniBahan') || undefined,
      hewanTumbuhanJenis: formData.get('hewanTumbuhanJenis') || undefined,
      hewanTumbuhanUkuran: formData.get('hewanTumbuhanUkuran') || undefined,
      jumlahKibE: formData.get('jumlahKibE') ? parseInt(formData.get('jumlahKibE') as string) : undefined,
      tahunCetakKibE: formData.get('tahunCetakKibE') || undefined,
    };

    // Data Integrity: Uniqueness Validation
    if (assetData.nibar && assetData.nibar.trim()) {
      if (!isNibarUnique(assetData.nibar, selectedAssetId || undefined)) {
        toast(`Duplikasi Ditolak: NIBAR "${assetData.nibar}" sudah terdaftar pada aset lain di sistem!`, 'error');
        return;
      }
    }
    if (assetData.kodeBarang && assetData.nomorRegister) {
      if (!isRegisterUnique(assetData.kodeBarang, assetData.nomorRegister, selectedAssetId || undefined)) {
        toast(`Duplikasi Ditolak: Kode Barang "${assetData.kodeBarang}" dengan Nomor Register "${assetData.nomorRegister}" sudah ada!`, 'error');
        return;
      }
    }

    if (selectedAssetId) {
      updateAssetWithAudit(selectedAssetId, assetData, "Admin Sarpras", "Pembaruan data inventaris via Formulir KIB");
      toast('Data aset berhasil diperbarui dengan audit trail otomatis', 'success');
      
      const previousAsset = assets.find(a => a.id === selectedAssetId);
      if (previousAsset && previousAsset.kondisi !== assetData.kondisi) {
        if (assetData.kondisi === "Rusak") {
          setMaintenances(prev => [...prev, {
            id: `MNT-${Date.now()}`,
            assetId: selectedAssetId,
            tanggalLapor: formatISO(new Date()),
            pelapor: "Sistem (Otomatis)",
            deskripsiKerusakan: "Aset dilaporkan rusak melalui perubahan status kondisi.",
            status: "Menunggu"
          }]);
          toast("Aset otomatis masuk ke daftar Pemeliharaan.", "info");
        } else if (assetData.kondisi === "Rusak Berat") {
          setDisposals(prev => [...prev, {
            id: `DSP-${Date.now()}`,
            assetId: selectedAssetId,
            jumlah: 1,
            nomorSurat: `421.3/${Math.floor(Math.random() * 900 + 100)}/SMPN3/DISP/${new Date().getFullYear()}`,
            tanggalPengajuan: formatISO(new Date()),
            metode: "Pemusnahan",
            alasan: "Kondisi aset diubah menjadi rusak berat.",
            status: "Diajukan"
          }]);
          toast("Aset otomatis masuk ke daftar Penghapusan.", "info");
        }
      }
    } else {
      const newAssetId = `ASSET-${Date.now()}`;
      setAssets(prev => [...prev, { id: newAssetId, ...assetData }]);
      toast('Aset baru berhasil ditambahkan', 'success');

      if (assetData.kondisi === "Rusak") {
        setMaintenances(prev => [...prev, {
          id: `MNT-${Date.now()}`,
          assetId: newAssetId,
          tanggalLapor: formatISO(new Date()),
          pelapor: "Sistem (Otomatis)",
          deskripsiKerusakan: "Aset dilaporkan rusak saat ditambahkan.",
          status: "Menunggu"
        }]);
        toast("Aset otomatis masuk ke daftar Pemeliharaan.", "info");
      } else if (assetData.kondisi === "Rusak Berat") {
        setDisposals(prev => [...prev, {
          id: `DSP-${Date.now()}`,
          assetId: newAssetId,
          jumlah: 1,
          nomorSurat: `421.3/${Math.floor(Math.random() * 900 + 100)}/SMPN3/DISP/${new Date().getFullYear()}`,
          tanggalPengajuan: formatISO(new Date()),
          metode: "Pemusnahan",
          alasan: "Aset ditambahkan dengan kondisi rusak berat.",
          status: "Diajukan"
        }]);
        toast("Aset otomatis masuk ke daftar Penghapusan.", "info");
      }
    }
    
    setIsModalOpen(false);
  };

  const openDetail = (assetId: string) => {
    setSelectedAssetId(assetId);
    setIsDetailModalOpen(true);
  };

  const openAddAssetModal = () => {
    setSelectedAssetId(null);
    setFormKib("Peralatan & Mesin (KIB B)");
    setFormImage(null);
    setFormJumlah(1);
    setFormSatuan("Unit");
    setFormKondisiBaik(1);
    setFormKondisiRusakRingan(0);
    setFormKondisiRusakBerat(0);
    setFormKondisiHilang(0);
    setFormKondisiTidakDiketahui(0);
    setFormPrimaryKondisi("Baik");
    setIsModalOpen(true);
  };

  const openEdit = (assetId: string, assetName: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (asset) {
      setFormKib(asset.kategori);
      setFormImage(asset.gambarUrl || null);
      const bd = getAssetConditionBreakdown(asset);
      setFormJumlah(bd.total);
      setFormSatuan(bd.satuan);
      setFormKondisiBaik(bd.baik);
      setFormKondisiRusakRingan(bd.rusakRingan);
      setFormKondisiRusakBerat(bd.rusakBerat);
      setFormKondisiHilang(bd.hilang);
      setFormKondisiTidakDiketahui(bd.tidakDiketahui);
      setFormPrimaryKondisi(asset.kondisi || 'Baik');
    }
    setSelectedAssetId(assetId);
    setIsModalOpen(true);
    handleAction("Memuat edit mode", assetName);
  };

  const handleDuplicate = (assetId: string) => {
    const assetToDuplicate = assets.find(a => a.id === assetId);
    if (!assetToDuplicate) return;

    const newAssetId = `ASSET-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    let newNibar = undefined;
    if (assetToDuplicate.nibar) {
      const lastDigits = assetToDuplicate.nibar.slice(-5);
      const incremented = String((parseInt(lastDigits) || 0) + 1).padStart(5, '0');
      newNibar = `${assetToDuplicate.nibar.slice(0, -5)}${incremented}`;
    }

    const duplicatedAsset: Asset = {
      ...assetToDuplicate,
      id: newAssetId,
      kodeBarang: assetToDuplicate.kodeBarang,
      nomorRegister: String(parseInt(assetToDuplicate.nomorRegister) + 1 || 0).padStart(4, '0'),
      nibar: newNibar,
      nama: assetToDuplicate.nama + ' (Copy)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setAssets(prev => [...prev, duplicatedAsset]);
    toast(`Aset "${assetToDuplicate.nama}" berhasil diduplikat`, "success");
  };

  const selectedAsset = assets.find(a => a.id === selectedAssetId);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast("Ukuran gambar terlalu besar (Maksimal 2MB)", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Data Aset (KIB)</h2>
          <p className="text-slate-700">Kartu Inventaris Barang sarana dan prasarana sekolah.</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-sky-100/70 dark:bg-slate-800/80 rounded-2xl border-0 border-none shadow-none w-full sm:w-auto">
          <DataActions 
            className="flex items-center gap-1"
            onExportExcel={handleExportExcel}
            onExportCsv={handleExportCsv}
            onExportPdf={handleExportPdf}
            onImport={() => setIsImportModalOpen(true)}
          />
          <div className="relative group">
            <Button 
              variant="ghost" 
              className="flex items-center justify-center gap-1.5 border-0 border-none shadow-none bg-transparent hover:bg-white dark:hover:bg-slate-700 text-black dark:text-white h-9 sm:h-10 px-3 sm:px-3.5 font-semibold rounded-xl transition-all"
            >
              <QrCode className="w-4 h-4 text-black" />
              <span className="text-black font-semibold">Cetak Label QR</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-slate-700" />
            </Button>
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 border-0 border-none shadow-2xl rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex flex-col py-1.5 ring-1 ring-black/5">
              <button 
                onClick={() => setIsPrintModalOpen(true)}
                className="text-left px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors w-full"
              >
                QR Code Aktif
              </button>
              <button 
                onClick={() => setIsPrintAllModalOpen(true)}
                className="text-left px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors w-full"
              >
                Semua QR Code
              </button>
              <button 
                onClick={() => setIsPrintSchoolModalOpen(true)}
                className="text-left px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors w-full"
              >
                Label Sekolah Aktif
              </button>
              <button 
                onClick={() => setIsPrintAllSchoolModalOpen(true)}
                className="text-left px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors w-full"
              >
                Semua Label Sekolah
              </button>
            </div>
          </div>
          <Button 
            onClick={openAddAssetModal}
            className="border-0 border-none bg-primary-600 hover:bg-primary-700 text-white rounded-xl h-9 sm:h-10 px-4 font-semibold shadow-sm transition-all flex items-center justify-center shrink-0 ml-auto sm:ml-0 cursor-pointer"
          >
            <Plus className="mr-1.5 w-4 h-4" />
            Tambah Aset
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-300 bg-slate-50/50 pb-4">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 justify-between items-start lg:items-center">
            <div className="relative w-full lg:w-72 shrink-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari kode, register, atau nama..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full appearance-none bg-white dark:bg-slate-800 pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-xl focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all"
              />
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full lg:w-auto lg:justify-end">
              <div className="hidden xl:flex items-center mr-1">
                <Filter className="h-4 w-4 text-slate-500" />
              </div>
              <div className="relative col-span-2 sm:col-span-1 w-full sm:w-auto">
                <select 
                  value={selectedKib}
                  onChange={(e) => setSelectedKib(e.target.value as any)}
                  className="w-full sm:w-auto appearance-none bg-white dark:bg-slate-800 px-3 py-2 pr-8 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-xl focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all hover:bg-slate-50 dark:hover:bg-slate-750 shadow-xs"
                >
                  {kibOptions.map(option => (
                    <option key={option} value={option}>
                      {option === "Semua" ? "Kategori: Semua KIB" : option}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              </div>
              <div className="relative w-full sm:w-auto">
                <select
                  value={selectedKondisi}
                  onChange={(e) => setSelectedKondisi(e.target.value)}
                  className="w-full sm:w-auto appearance-none bg-white dark:bg-slate-800 px-3 py-2 pr-8 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-xl focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all hover:bg-slate-50 dark:hover:bg-slate-750 shadow-xs"
                >
                  <option value="Semua">Semua Kondisi</option>
                  <option value="Baik">Baik</option>
                  <option value="Rusak Ringan">Rusak Ringan</option>
                  <option value="Rusak Berat">Rusak Berat</option>
                  <option value="Hilang">Hilang</option>
                  <option value="Tidak Diketahui">Tidak Diketahui</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              </div>
              <div className="relative w-full sm:w-auto">
                <select
                  value={selectedTahun}
                  onChange={(e) => setSelectedTahun(e.target.value)}
                  className="w-full sm:w-auto appearance-none bg-white dark:bg-slate-800 px-3 py-2 pr-8 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-xl focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all hover:bg-slate-50 dark:hover:bg-slate-750 shadow-xs"
                >
                  {tahunOptions.map(t => (
                    <option key={t} value={t}>{t === "Semua" ? "Semua Tahun" : t}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              </div>
              <div className="relative col-span-2 sm:col-span-1 w-full sm:w-auto">
                <select
                  value={selectedSumberDana}
                  onChange={(e) => setSelectedSumberDana(e.target.value)}
                  className="w-full sm:w-auto appearance-none bg-white dark:bg-slate-800 px-3 py-2 pr-8 text-xs sm:text-sm border border-sky-300 dark:border-slate-700 rounded-xl focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all hover:bg-slate-50 dark:hover:bg-slate-750 shadow-xs font-medium text-black dark:text-white"
                >
                  <option value="Semua">Sumber: Semua Dana</option>
                  <option value="BOS">Tercatat Dana BOS</option>
                  <option value="Mandiri">Beli Mandiri (Non-BOS)</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              </div>
              <div className="relative col-span-2 sm:col-span-1 w-full sm:w-auto">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto appearance-none bg-white dark:bg-slate-800 px-3 py-2 pr-8 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-xl focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all font-semibold text-primary-700 dark:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-xs"
                >
                  <option value="Terbaru (Tahun)">Urut: Terbaru</option>
                  <option value="Terlama (Tahun)">Urut: Terlama</option>
                  <option value="Nama A-Z">Nama A-Z</option>
                  <option value="Nama Z-A">Nama Z-A</option>
                  <option value="Harga Tertinggi">Harga Tertinggi</option>
                  <option value="Harga Terendah">Harga Terendah</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              </div>
              <div className="col-span-2 sm:col-span-1 flex justify-end">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button 
                    onClick={() => setViewMode("list")} 
                    className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-xs text-primary-600 dark:text-primary-400" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode("grid")} 
                    className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white dark:bg-slate-700 shadow-xs text-primary-600 dark:text-primary-400" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
                    title="Grid/Card View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-primary-50 px-6 py-3 border-b border-primary-100 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-bold text-primary-900">
              {selectedIds.length} baris aset terpilih
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsPrintSelectedSchoolModalOpen(true)}
                className="h-8 bg-white border-primary-300 text-primary-800 hover:bg-primary-100 font-bold shadow-2xs"
              >
                <Tag className="w-4 h-4 mr-1.5 text-primary-700" />
                Cetak Label Terpilih ({selectedIds.length} Barang)
              </Button>
              <Button variant="destructive" size="sm" onClick={openBulkDeleteModal} className="h-8 font-semibold">
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus Terpilih
              </Button>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          {viewMode === "list" ? (
            <>
              {/* Mobile Card List View for screen < 768px */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800 pb-20">
                {filteredAssets.length > 0 ? (
                  filteredAssets.map((asset) => {
                    let roomDisplay = "-";
                    if (asset.ruanganId) {
                      const assetRooms = asset.ruanganId.split(',').map(id => rooms.find(r => r.id === id)?.nama).filter(Boolean);
                      if (assetRooms.length > 0) {
                        roomDisplay = assetRooms.join(', ');
                      }
                    }

                    return (
                      <div key={asset.id} className="p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="pt-1">
                            <input 
                              type="checkbox" 
                              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                              checked={selectedIds.includes(asset.id)}
                              onChange={() => toggleSelect(asset.id)}
                            />
                          </div>
                          
                          {asset.gambarUrl ? (
                            <div className="w-13 h-13 rounded-xl shadow-xs overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                              <img src={asset.gambarUrl} alt={asset.nama} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-13 h-13 rounded-xl shrink-0 bg-primary-50 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 text-primary-600 dark:text-primary-400">
                              <Package className="w-6 h-6" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">
                                {asset.nama}
                              </h4>
                              <RowActions actions={[
                                { label: "Lihat Detail", icon: Eye, onClick: () => openDetail(asset.id) },
                                { label: "Edit Aset", icon: Edit, onClick: () => openEdit(asset.id, asset.nama) },
                                { label: "Duplikat", icon: Copy, onClick: () => handleDuplicate(asset.id) },
                                { label: "Hapus", icon: Trash2, variant: "destructive", onClick: () => openDeleteModal(asset.id, asset.nama) }
                              ]} />
                            </div>

                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                {asset.kodeBarang}
                              </span>
                              <span className="text-[10px] text-slate-600 font-mono">
                                Reg: {asset.nomorRegister}
                              </span>
                              {asset.nibar && (
                                <span className="font-mono text-[10px] text-sky-800 font-bold bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded max-w-[170px] truncate" title={`NIBAR: ${asset.nibar}`}>
                                  NIBAR: {asset.nibar}
                                </span>
                              )}
                            </div>

                            {(() => {
                              const bd = getAssetConditionBreakdown(asset);
                              const totalHarga = (asset.harga || 0) * bd.total;

                              return (
                                <>
                                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-xs">
                                    <div>
                                      <span className="font-bold text-primary-700 dark:text-primary-400">
                                        Rp {totalHarga.toLocaleString('id-ID')}
                                      </span>
                                      {bd.total > 1 && (
                                        <span className="text-[10px] text-slate-500 ml-1">
                                          (@ Rp {(asset.harga || 0).toLocaleString('id-ID')})
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                                      {bd.total} {bd.satuan}
                                    </span>
                                  </div>

                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {bd.isMixed ? (
                                      <>
                                        {bd.baik > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">🟢 {bd.baik} Baik</span>}
                                        {bd.rusakRingan > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-50 text-amber-800 border border-amber-200">🟡 {bd.rusakRingan} RR</span>}
                                        {bd.rusakBerat > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-rose-50 text-rose-800 border border-rose-200">🔴 {bd.rusakBerat} RB</span>}
                                        {bd.hilang > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-red-100 text-red-800 border border-red-300">🛑 {bd.hilang} Hilang</span>}
                                        {bd.tidakDiketahui > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-100 text-slate-800 border border-slate-300">❓ {bd.tidakDiketahui} Tdk Tahu</span>}
                                      </>
                                    ) : (
                                      <Badge 
                                        variant={
                                          asset.kondisi === "Baik" ? "success" : 
                                          asset.kondisi === "Rusak Ringan" ? "warning" : 
                                          asset.kondisi === "Rusak Berat" ? "destructive" :
                                          asset.kondisi === "Hilang" ? "destructive" : "secondary"
                                        }
                                        className={`text-[10px] px-2 py-0.2 ${
                                          asset.kondisi === "Hilang" ? "bg-red-600 text-white border-red-700 font-extrabold" :
                                          asset.kondisi === "Tidak Diketahui" ? "bg-slate-200 text-slate-800 border-slate-400 font-bold" : ""
                                        }`}
                                      >
                                        {asset.kondisi}
                                      </Badge>
                                    )}
                                  </div>
                                </>
                              );
                            })()}

                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              <span className="truncate">🏢 {roomDisplay}</span>
                              <span className="shrink-0">{asset.tahunPerolehan}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-sm">Tidak ada data aset</p>
                  </div>
                )}
              </div>

              {/* Desktop Table View for screen >= 768px with Standby Scroll Bar */}
              <div className="hidden md:block">
                <StickyTableWrapper
                  tableContainerClassName="min-h-[280px]"
                  label="Tabel Aset Tetap (KIB)"
                >
                  <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 sticky top-0 z-10 shadow-xs">
                  <tr>
                    <th className="px-6 py-3 font-medium w-12">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        checked={selectedIds.length === filteredAssets.length && filteredAssets.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-3 font-medium">Kode & Register</th>
                    <th className="px-6 py-3 font-medium">Informasi Aset</th>
                    <th className="px-6 py-3 font-medium">Kategori KIB</th>
                    <th className="px-6 py-3 font-medium">Sumber Dana</th>
                    <th className="px-6 py-3 font-medium">Jumlah & Nilai</th>
                    <th className="px-6 py-3 font-medium">Kondisi Fisik</th>
                    <th className="px-6 py-3 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssets.length > 0 ? (
                    filteredAssets.map((asset) => {
                      let roomDisplay = "-";
                      if (asset.ruanganId) {
                        const assetRooms = asset.ruanganId.split(',').map(id => rooms.find(r => r.id === id)?.nama).filter(Boolean);
                        if (assetRooms.length > 0) {
                          roomDisplay = assetRooms.join(', ');
                        }
                      }
                      const bd = getAssetConditionBreakdown(asset);
                      const totalNilai = asset.harga * bd.total;

                      return (
                        <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <input 
                              type="checkbox" 
                              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                              checked={selectedIds.includes(asset.id)}
                              onChange={() => toggleSelect(asset.id)}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-mono font-bold text-slate-900">{asset.kodeBarang}</div>
                            <div className="font-mono text-slate-700 text-xs mt-0.5">Reg: {asset.nomorRegister}</div>
                            {asset.nibar && (
                              <div className="font-mono text-[10px] text-sky-900 font-bold bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded mt-1 max-w-[200px] truncate" title={`NIBAR: ${asset.nibar}`}>
                                NIBAR: {asset.nibar}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {asset.gambarUrl ? (
                                <div className="w-10 h-10 rounded shadow-sm overflow-hidden border border-slate-300 shrink-0">
                                  <img src={asset.gambarUrl} alt={asset.nama} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded shrink-0 bg-slate-100 flex items-center justify-center border border-slate-300">
                                  <Package className="w-5 h-5 text-slate-600" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-slate-900">{asset.nama}</p>
                                <p className="text-slate-700 text-xs mt-0.5">{asset.merk || '-'} • {asset.tahunPerolehan} • 🏢 {roomDisplay}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-700">
                            {asset.kategori}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border border-slate-300 bg-white text-slate-700 shadow-sm">
                              {asset.sumberDana}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                              <span>{bd.total} {bd.satuan}</span>
                            </div>
                            <div className="text-xs text-slate-600 mt-0.5">
                              @ Rp {asset.harga.toLocaleString('id-ID')}
                            </div>
                            {bd.total > 1 && (
                              <div className="text-[11px] font-bold text-primary-700 mt-0.5">
                                Total: Rp {totalNilai.toLocaleString('id-ID')}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {bd.isMixed ? (
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-1 max-w-[240px]">
                                  {bd.baik > 0 && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                                      🟢 {bd.baik} Baik
                                    </span>
                                  )}
                                  {bd.rusakRingan > 0 && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                                      🟡 {bd.rusakRingan} RR
                                    </span>
                                  )}
                                  {bd.rusakBerat > 0 && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                                      🔴 {bd.rusakBerat} RB
                                    </span>
                                  )}
                                  {bd.hilang > 0 && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-600 text-white text-xs font-bold border border-red-700">
                                      ⬛ {bd.hilang} Hilang
                                    </span>
                                  )}
                                  {bd.tidakDiketahui > 0 && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300">
                                      ❓ {bd.tidakDiketahui} TD
                                    </span>
                                  )}
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex max-w-[160px]">
                                  {bd.baik > 0 && <div style={{ width: `${(bd.baik / bd.total) * 100}%` }} className="bg-emerald-500 h-full" />}
                                  {bd.rusakRingan > 0 && <div style={{ width: `${(bd.rusakRingan / bd.total) * 100}%` }} className="bg-amber-500 h-full" />}
                                  {bd.rusakBerat > 0 && <div style={{ width: `${(bd.rusakBerat / bd.total) * 100}%` }} className="bg-rose-500 h-full" />}
                                  {bd.hilang > 0 && <div style={{ width: `${(bd.hilang / bd.total) * 100}%` }} className="bg-red-700 h-full" />}
                                  {bd.tidakDiketahui > 0 && <div style={{ width: `${(bd.tidakDiketahui / bd.total) * 100}%` }} className="bg-slate-400 h-full" />}
                                </div>
                              </div>
                            ) : (
                              <Badge 
                                variant={
                                  asset.kondisi === "Baik" ? "success" : 
                                  asset.kondisi === "Rusak Ringan" ? "warning" : 
                                  asset.kondisi === "Rusak Berat" ? "destructive" :
                                  asset.kondisi === "Hilang" ? "destructive" : "secondary"
                                }
                                className={
                                  asset.kondisi === "Hilang" ? "bg-red-600 text-white border-red-700 font-extrabold" :
                                  asset.kondisi === "Tidak Diketahui" ? "bg-slate-200 text-slate-800 border-slate-400 font-bold" : ""
                                }
                              >
                                {bd.total > 1 ? `${bd.total} ${bd.satuan} - ${asset.kondisi}` : asset.kondisi}
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right pr-4">
                            <RowActions actions={[
                              { label: "Lihat Detail", icon: Eye, onClick: () => openDetail(asset.id) },
                              { label: "Edit Aset", icon: Edit, onClick: () => openEdit(asset.id, asset.nama) },
                              { label: "Duplikat", icon: Copy, onClick: () => handleDuplicate(asset.id) },
                              { label: "Hapus", icon: Trash2, variant: "destructive", onClick: () => openDeleteModal(asset.id, asset.nama) }
                            ]} />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-16 text-center text-slate-700">
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
              </div>
            </>
          ) : (
            <div className="p-6">
              {filteredAssets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredAssets.map((asset) => {
                    let roomDisplay = "-";
                    if (asset.ruanganId) {
                      const assetRooms = asset.ruanganId.split(',').map(id => rooms.find(r => r.id === id)?.nama).filter(Boolean);
                      if (assetRooms.length > 0) {
                        roomDisplay = assetRooms.join(', ');
                      }
                    }
                    return (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={asset.id} 
                        className="bg-white border border-slate-300 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group relative"
                      >
                        <div className="absolute top-3 left-3 z-10 bg-white/50 backdrop-blur-md rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer shadow-sm"
                            checked={selectedIds.includes(asset.id)}
                            onChange={() => toggleSelect(asset.id)}
                          />
                        </div>
                        <div className="absolute top-3 right-3 z-10">
                          <Badge 
                            variant={
                              asset.kondisi === "Baik" ? "success" : 
                              asset.kondisi === "Rusak Ringan" ? "warning" : "destructive"
                            }
                            className="shadow-sm border border-white/20 backdrop-blur-md bg-white/90"
                          >
                            {asset.kondisi}
                          </Badge>
                        </div>
                        <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                          {asset.gambarUrl ? (
                            <img src={asset.gambarUrl} alt={asset.nama} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <Package className="w-16 h-16 text-slate-300" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end">
                            <div className="p-4 w-full">
                              <h3 className="text-white font-bold truncate">{asset.nama}</h3>
                              <p className="text-white/80 text-xs font-mono">{asset.kodeBarang}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col gap-3">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-slate-700 text-xs">Register</p>
                              <p className="font-medium text-slate-800">{asset.nomorRegister}</p>
                              {asset.nibar && (
                                <p className="font-mono text-[10px] text-sky-800 font-bold truncate mt-0.5" title={`NIBAR: ${asset.nibar}`}>
                                  NIBAR: {asset.nibar}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-slate-700 text-xs">Tahun</p>
                              <p className="font-medium text-slate-800">{asset.tahunPerolehan}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-slate-700 text-xs">Ruangan</p>
                              <p className="font-medium text-slate-800 truncate">🏢 {roomDisplay}</p>
                            </div>
                          </div>
                          
                          <div className="mt-auto pt-3 border-t border-slate-300 flex items-center justify-between">
                            <p className="font-bold text-primary-600">Rp {asset.harga.toLocaleString('id-ID')}</p>
                            <div className="flex gap-1">
                              <button onClick={() => openDetail(asset.id)} className="p-1.5 text-slate-600 hover:text-slate-900 transition-colors" title="Lihat Detail">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button onClick={() => openEdit(asset.id, asset.nama)} className="p-1.5 text-slate-600 hover:text-primary-600 transition-colors" title="Edit">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDuplicate(asset.id)} className="p-1.5 text-slate-600 hover:text-primary-600 transition-colors" title="Duplikat Aset">
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-700 font-medium">Tidak ada data aset yang ditemukan untuk kategori atau pencarian tersebut.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <FormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedAssetId ? "Edit Formulir Aset KIB" : "Tambah Formulir Aset KIB"}
        onSubmit={handleSave}
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">Gambar Aset (Opsional)</label>
            <div className="flex items-center gap-4">
              {formImage ? (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-300">
                  <img src={formImage} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => setFormImage(null)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
                  <span className="text-slate-600 text-xs text-center px-2">Tidak ada gambar</span>
                </div>
              )}
              <div className="flex-1">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition-colors cursor-pointer"
                />
                <p className="mt-1 text-xs text-slate-600">Maks. 2MB. Format: JPG, PNG.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">Kategori KIB</label>
            <select 
              value={formKib}
              onChange={(e) => setFormKib(e.target.value as AssetCategory)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none bg-white"
            >
              {kibOptions.filter(k => k !== "Semua").map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">Nama / Jenis Barang</label>
            <input name="nama" required defaultValue={selectedAsset?.nama || ''} type="text" className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none" placeholder="Contoh: Laptop Asus Zenbook" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-900">Kode Barang</label>
              <input id="input-form-kode-barang" name="kodeBarang" required defaultValue={selectedAsset?.kodeBarang || ''} type="text" className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none font-mono" placeholder="1.3.2.01.03.05.002" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-900">Nomor Register</label>
              <input id="input-form-nomor-register" name="nomorRegister" required defaultValue={selectedAsset?.nomorRegister || ''} type="text" className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none font-mono" placeholder="000001" />
            </div>
          </div>

          <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-3.5 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <label className="text-sm font-bold text-sky-950 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-600 inline-block"></span>
                NIBAR (Nomor Induk Barang)
                <span className="text-[10px] font-semibold text-sky-800 bg-sky-100 border border-sky-300 px-1.5 py-0.5 rounded">SIPD-RI / BMD</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  const kodeInput = document.getElementById('input-form-kode-barang') as HTMLInputElement;
                  const regInput = document.getElementById('input-form-nomor-register') as HTMLInputElement;
                  const thnInput = document.querySelector('input[name="tahunPerolehan"]') as HTMLInputElement;
                  const rawKode = kodeInput?.value || "1.3.2.01.03.05.002";
                  const cleanKode = rawKode.replace(/[^0-9]/g, '').padEnd(12, '0').slice(0, 12);
                  const rawReg = regInput?.value || "1";
                  const cleanReg = String(rawReg.replace(/\D/g, '') || "1").padStart(7, '0').slice(-7);
                  const tahun = thnInput?.value || new Date().getFullYear();
                  const genNibar = `1202350601000000440000${tahun}${cleanKode}${cleanReg}`;
                  const nibarInput = document.getElementById('input-form-nibar') as HTMLInputElement;
                  if (nibarInput) {
                    nibarInput.value = genNibar;
                  }
                }}
                className="text-xs font-bold text-sky-700 hover:text-sky-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                + Buat NIBAR Otomatis
              </button>
            </div>
            <input 
              id="input-form-nibar"
              name="nibar" 
              type="text" 
              defaultValue={selectedAsset?.nibar || ''} 
              className="w-full border border-sky-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none font-mono bg-white text-black" 
              placeholder="Contoh: 120235060100000044000020091320103050020000001" 
            />
            <p className="text-[11px] text-slate-600">
              Nomor unik 44-digit identitas barang milik daerah (SIPD / BMD) untuk tracking dan inventarisasi resmi.
            </p>
          </div>

          {/* Conditional Fields based on KIB Category */}
          {formKib === "Tanah (KIB A)" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Luas Tanah (m2)</label>
                  <input name="luasTanah" type="number" defaultValue={selectedAsset?.luasTanah || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none" placeholder="Luas m2" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Status Hak</label>
                  <select name="statusHak" defaultValue={selectedAsset?.statusHak || 'Hak Milik'} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none bg-white">
                    <option value="Hak Milik">Hak Milik</option>
                    <option value="Hak Pakai">Hak Pakai</option>
                    <option value="Hak Guna Bangunan">Hak Guna Bangunan</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-900">Letak / Alamat</label>
                <textarea name="letakAlamat" defaultValue={selectedAsset?.letakAlamat || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none" placeholder="Alamat lengkap lokasi tanah"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Tanggal Sertifikat</label>
                  <input name="tanggalSertifikat" type="date" defaultValue={selectedAsset?.tanggalSertifikat || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">No. Sertifikat</label>
                  <input name="nomorSertifikat" type="text" defaultValue={selectedAsset?.nomorSertifikat || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none" placeholder="Nomor Sertifikat" />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-900">Penggunaan</label>
                <input name="penggunaan" type="text" defaultValue={selectedAsset?.penggunaan || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none" placeholder="Contoh: Bangunan Sekolah" />
              </div>
            </>
          )}

          {formKib === "Peralatan & Mesin (KIB B)" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Bahan / Material</label>
                  <input name="bahan" type="text" defaultValue={selectedAsset?.bahan || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none" placeholder="Contoh: Logam, Plastik, Kayu" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Merk / Type</label>
                  <input name="merk" type="text" defaultValue={selectedAsset?.merk || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none" placeholder="Contoh: Merk: Shimizu" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Spesifikasi Lainnya</label>
                  <input name="spesifikasiLainnya" type="text" defaultValue={selectedAsset?.spesifikasiLainnya || selectedAsset?.ukuranCc || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none" placeholder="Spesifikasi / Ukuran" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Komptabel</label>
                  <select name="komptabel" defaultValue={selectedAsset?.komptabel || (selectedAsset && selectedAsset.harga < 500000 ? 'ekstra' : 'intra')} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none bg-white">
                    <option value="intra">Intrakomptabel (intra - aset bernilai &gt;= Rp 500.000)</option>
                    <option value="ekstra">Ekstrakomptabel (ekstra - aset operasional kecil)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Tanggal Perolehan Lengkap</label>
                  <input name="tanggalPerolehan" type="date" defaultValue={selectedAsset?.tanggalPerolehan || (selectedAsset?.tahunPerolehan ? `${selectedAsset.tahunPerolehan}-06-30` : '')} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Penggunaan / SKPD</label>
                  <input name="penggunaan" type="text" defaultValue={selectedAsset?.penggunaan || selectedAsset?.skpd || schoolProfile?.nama || 'UPTD SMPN 3 Kras'} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none" placeholder="UPTD SMPN 3 Kras" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">No. Pabrik / No. Rangka</label>
                  <input name="nomorPabrik" type="text" defaultValue={`${selectedAsset?.nomorPabrik || ''}`} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none mb-1" placeholder="Nomor Pabrik" />
                  <input name="nomorRangka" type="text" defaultValue={`${selectedAsset?.nomorRangka || ''}`} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none" placeholder="Nomor Rangka" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">No. Mesin / No. Polisi / No. BPKB</label>
                  <input name="nomorMesin" type="text" defaultValue={`${selectedAsset?.nomorMesin || ''}`} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none mb-1" placeholder="Nomor Mesin" />
                  <div className="grid grid-cols-2 gap-2">
                    <input name="nomorPolisi" type="text" defaultValue={`${selectedAsset?.nomorPolisi || ''}`} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none" placeholder="No. Polisi" />
                    <input name="nomorBpkb" type="text" defaultValue={`${selectedAsset?.nomorBpkb || ''}`} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none" placeholder="No. BPKB" />
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-900">Bahan</label>
                <input name="bahan" type="text" defaultValue={selectedAsset?.bahan || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none" placeholder="Bahan (Plastik, Besi, Kayu...)" />
              </div>
            </>
          )}

          {formKib === "Gedung & Bangunan (KIB C)" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Kondisi Bangunan</label>
                  <select name="kondisiBangunan" defaultValue={selectedAsset?.kondisiBangunan || 'Baik'} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none bg-white">
                    <option value="Baik">Baik</option>
                    <option value="Kurang Baik">Kurang Baik</option>
                    <option value="Rusak Berat">Rusak Berat</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Konstruksi</label>
                  <div className="flex gap-2 items-center">
                    <select name="bertingkat" defaultValue={selectedAsset?.bertingkat || 'Tidak'} className="border border-slate-300 rounded-lg px-2 py-2 text-xs focus:border-primary-500 outline-none bg-white w-full">
                      <option value="Bertingkat">Bertingkat</option>
                      <option value="Tidak">Tidak</option>
                    </select>
                    <select name="beton" defaultValue={selectedAsset?.beton || 'Beton'} className="border border-slate-300 rounded-lg px-2 py-2 text-xs focus:border-primary-500 outline-none bg-white w-full">
                      <option value="Beton">Beton</option>
                      <option value="Bukan">Bukan Beton</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-900">Letak / Alamat</label>
                <textarea name="letakAlamat" defaultValue={selectedAsset?.letakAlamat || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none" placeholder="Alamat lengkap gedung"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Dokumen Gedung (Tgl & No)</label>
                  <input name="dokumenGedungTanggal" type="date" defaultValue={selectedAsset?.dokumenGedungTanggal || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none mb-1" />
                  <input name="dokumenGedungNomor" type="text" defaultValue={selectedAsset?.dokumenGedungNomor || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none" placeholder="Nomor Dokumen" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Status & No Kode Tanah</label>
                  <input name="statusTanah" type="text" defaultValue={selectedAsset?.statusTanah || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none mb-1" placeholder="Status (Hak Milik, Hak Pakai)" />
                  <input name="nomorKodeTanah" type="text" defaultValue={selectedAsset?.nomorKodeTanah || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none" placeholder="Nomor Kode Tanah" />
                </div>
              </div>
            </>
          )}

          {formKib === "Jalan, Irigasi & Jaringan (KIB D)" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Konstruksi</label>
                  <input name="konstruksi" type="text" defaultValue={selectedAsset?.konstruksi || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none" placeholder="Konstruksi baja/beton" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Letak / Lokasi</label>
                  <input name="letakAlamat" type="text" defaultValue={selectedAsset?.letakAlamat || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none" placeholder="Lokasi" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Panjang (m)</label>
                  <input name="panjang" type="number" defaultValue={selectedAsset?.panjang || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none" placeholder="0" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Lebar (m)</label>
                  <input name="lebar" type="number" defaultValue={selectedAsset?.lebar || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none" placeholder="0" />
                </div>
                <div className="grid gap-2">
                   <label className="text-sm font-medium text-slate-900">Luas (m2)</label>
                  <input name="luasKibD" type="number" defaultValue={selectedAsset?.luasKibD || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Dokumen (Tgl & No)</label>
                  <input name="dokumenTanggalKibD" type="date" defaultValue={selectedAsset?.dokumenTanggalKibD || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none mb-1" />
                  <input name="dokumenNomorKibD" type="text" defaultValue={selectedAsset?.dokumenNomorKibD || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none" placeholder="Nomor Dokumen" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Status & No Kode Tanah</label>
                  <input name="statusTanahKibD" type="text" defaultValue={selectedAsset?.statusTanahKibD || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none mb-1" placeholder="Status Tanah" />
                  <input name="nomorKodeTanahKibD" type="text" defaultValue={selectedAsset?.nomorKodeTanahKibD || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none" placeholder="Nomor Kode Tanah" />
                </div>
              </div>
            </>
          )}

          {formKib === "Aset Tetap Lainnya (KIB E)" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Buku Perpustakaan</label>
                  <input name="bukuJudulPencipta" type="text" defaultValue={selectedAsset?.bukuJudulPencipta || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none mb-1" placeholder="Judul / Pencipta" />
                  <input name="bukuSpesifikasi" type="text" defaultValue={selectedAsset?.bukuSpesifikasi || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none" placeholder="Spesifikasi" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Barang Kesenian / Kebudayaan</label>
                  <input name="seniAsalDaerah" type="text" defaultValue={selectedAsset?.seniAsalDaerah || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none mb-1" placeholder="Asal Daerah" />
                  <div className="flex gap-1">
                    <input name="seniPencipta" type="text" defaultValue={selectedAsset?.seniPencipta || ''} className="border border-slate-300 rounded-lg px-2 py-2 text-sm focus:border-primary-500 outline-none w-1/2" placeholder="Pencipta" />
                    <input name="seniBahan" type="text" defaultValue={selectedAsset?.seniBahan || ''} className="border border-slate-300 rounded-lg px-2 py-2 text-sm focus:border-primary-500 outline-none w-1/2" placeholder="Bahan" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Hewan Ternak / Tumbuhan</label>
                  <input name="hewanTumbuhanJenis" type="text" defaultValue={selectedAsset?.hewanTumbuhanJenis || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none mb-1" placeholder="Jenis Hewan/Tumbuhan" />
                  <input name="hewanTumbuhanUkuran" type="text" defaultValue={selectedAsset?.hewanTumbuhanUkuran || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none" placeholder="Ukuran" />
                </div>
                <div className="grid gap-2">
                   <label className="text-sm font-medium text-slate-900">Jumlah & Tahun Cetak</label>
                   <input name="jumlahKibE" type="number" defaultValue={selectedAsset?.jumlahKibE || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none mb-1" placeholder="Jumlah" />
                   <input name="tahunCetakKibE" type="text" defaultValue={selectedAsset?.tahunCetakKibE || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none" placeholder="Tahun Cetak / Pengadaan" />
                </div>
              </div>
            </>
          )}

          <hr className="my-2 border-slate-300" />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-900">Tahun Pengadaan/Perolehan</label>
              <input name="tahunPerolehan" required defaultValue={selectedAsset?.tahunPerolehan || new Date().getFullYear()} type="number" min="1990" max="2099" className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none" placeholder="2023" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-900">Harga Satuan Perolehan (Rp)</label>
              <input name="harga" required defaultValue={selectedAsset?.harga || ''} type="number" className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none" placeholder="Rp" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-900">Asal Usul Cara Perolehan</label>
              <select name="sumberDana" defaultValue={selectedAsset?.sumberDana || 'BOS Reguler'} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none bg-white">
                <option value="BOS Reguler">BOS Reguler</option>
                <option value="BOS Kinerja">BOS Kinerja</option>
                <option value="BOS Daerah (BOSDa)">BOS Daerah (BOSDa)</option>
                <option value="Hibah / Sumbangan">Hibah / Sumbangan</option>
                <option value="Yayasan">Yayasan</option>
                <option value="Pemerintah Pusat">Pemerintah Pusat</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-900">Jumlah Total</label>
                <input 
                  type="number" 
                  min="1" 
                  value={formJumlah} 
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 1);
                    setFormJumlah(val);
                    if (formKondisiBaik === formJumlah && formKondisiRusakRingan === 0 && formKondisiRusakBerat === 0 && formKondisiHilang === 0 && formKondisiTidakDiketahui === 0) {
                      setFormKondisiBaik(val);
                    }
                  }} 
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none" 
                  required 
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-900">Satuan</label>
                <input 
                  type="text" 
                  value={formSatuan} 
                  onChange={(e) => setFormSatuan(e.target.value)} 
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none" 
                  placeholder="Unit, Buah, Set" 
                  required 
                />
              </div>
            </div>
          </div>

          {/* Interactive Multi-Condition Breakdown Section */}
          <div className="border border-primary-200 bg-primary-50/30 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-primary-600" />
                  Rincian Kuantitas per Kondisi Fisik
                </h4>
                <p className="text-xs text-slate-600">
                  Tentukan jumlah pasti untuk masing-masing kondisi fisik (contoh: 100 Meja = 50 Baik, 50 Rusak Berat).
                </p>
              </div>
              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setFormKondisiBaik(formJumlah);
                    setFormKondisiRusakRingan(0);
                    setFormKondisiRusakBerat(0);
                    setFormKondisiHilang(0);
                    setFormKondisiTidakDiketahui(0);
                  }}
                  className="px-2 py-1 text-xs font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-md transition-colors"
                >
                  Semua Baik
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const halfBaik = Math.floor(formJumlah / 2);
                    const halfRB = formJumlah - halfBaik;
                    setFormKondisiBaik(halfBaik);
                    setFormKondisiRusakRingan(0);
                    setFormKondisiRusakBerat(halfRB);
                    setFormKondisiHilang(0);
                    setFormKondisiTidakDiketahui(0);
                  }}
                  className="px-2 py-1 text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-md transition-colors"
                >
                  50% Baik : 50% RB
                </button>
              </div>
            </div>

            {/* Hidden fields for FormData submission */}
            <input type="hidden" name="jumlah" value={formJumlah} />
            <input type="hidden" name="satuan" value={formSatuan} />
            <input type="hidden" name="kondisiBaik" value={formKondisiBaik} />
            <input type="hidden" name="kondisiRusakRingan" value={formKondisiRusakRingan} />
            <input type="hidden" name="kondisiRusakBerat" value={formKondisiRusakBerat} />
            <input type="hidden" name="kondisiHilang" value={formKondisiHilang} />
            <input type="hidden" name="kondisiTidakDiketahui" value={formKondisiTidakDiketahui} />
            <input type="hidden" name="kondisi" value={formPrimaryKondisi} />

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="bg-white border border-emerald-300 rounded-lg p-2.5 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Baik (B)
                  </span>
                </div>
                <input 
                  type="number" 
                  min="0" 
                  value={formKondisiBaik} 
                  onChange={(e) => setFormKondisiBaik(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-center font-bold text-sm bg-emerald-50/50 border border-emerald-200 rounded px-2 py-1 text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div className="bg-white border border-amber-300 rounded-lg p-2.5 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Rusak Ringan (RR)
                  </span>
                </div>
                <input 
                  type="number" 
                  min="0" 
                  value={formKondisiRusakRingan} 
                  onChange={(e) => setFormKondisiRusakRingan(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-center font-bold text-sm bg-amber-50/50 border border-amber-200 rounded px-2 py-1 text-amber-900 outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="bg-white border border-rose-300 rounded-lg p-2.5 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-rose-800">
                  <span className="flex items-center gap-1">
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                    Rusak Berat (RB)
                  </span>
                </div>
                <input 
                  type="number" 
                  min="0" 
                  value={formKondisiRusakBerat} 
                  onChange={(e) => setFormKondisiRusakBerat(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-center font-bold text-sm bg-rose-50/50 border border-rose-200 rounded px-2 py-1 text-rose-900 outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div className="bg-white border border-red-400 rounded-lg p-2.5 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-red-800">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    Hilang (H)
                  </span>
                </div>
                <input 
                  type="number" 
                  min="0" 
                  value={formKondisiHilang} 
                  onChange={(e) => setFormKondisiHilang(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-center font-bold text-sm bg-red-50/50 border border-red-200 rounded px-2 py-1 text-red-900 outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              <div className="bg-white border border-slate-300 rounded-lg p-2.5 space-y-1 col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                    Tidak Tahu (TD)
                  </span>
                </div>
                <input 
                  type="number" 
                  min="0" 
                  value={formKondisiTidakDiketahui} 
                  onChange={(e) => setFormKondisiTidakDiketahui(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-center font-bold text-sm bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-800 outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>
            </div>

            {/* Validation & Balance Status */}
            {(() => {
              const totalAllocated = formKondisiBaik + formKondisiRusakRingan + formKondisiRusakBerat + formKondisiHilang + formKondisiTidakDiketahui;
              const isMatch = totalAllocated === formJumlah;
              const diff = formJumlah - totalAllocated;

              return (
                <div className="pt-2 border-t border-primary-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">Total Terhitung:</span>
                    <span className={`font-mono font-bold px-2 py-0.5 rounded ${isMatch ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {totalAllocated} / {formJumlah} {formSatuan} {isMatch ? "✓ Pas" : `(Selisih ${diff > 0 ? `+${diff}` : diff})`}
                    </span>
                  </div>
                  {!isMatch && (
                    <button
                      type="button"
                      onClick={() => {
                        const newBaik = Math.max(0, formKondisiBaik + diff);
                        setFormKondisiBaik(newBaik);
                      }}
                      className="text-xs font-bold text-primary-700 hover:text-primary-800 underline flex items-center gap-1 cursor-pointer"
                    >
                      ⚡ Seimbangkan Sisa ({diff > 0 ? `+${diff}` : diff}) ke Kondisi Baik
                    </button>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">Ruangan</label>
            <select 
              name="ruanganId" 
              multiple={formKib === "Gedung & Bangunan (KIB C)"}
              defaultValue={formKib === "Gedung & Bangunan (KIB C)" ? (selectedAsset?.ruanganId ? selectedAsset.ruanganId.split(',') : []) : (selectedAsset?.ruanganId || "")} 
              className={`border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none bg-white ${formKib === "Gedung & Bangunan (KIB C)" ? "h-24" : ""}`}
            >
              {formKib !== "Gedung & Bangunan (KIB C)" && <option value="">Pilih ruangan (opsional)...</option>}
              {rooms.map(r => <option key={r.id} value={r.id}>{r.nama}</option>)}
            </select>
            {formKib === "Gedung & Bangunan (KIB C)" && <p className="text-xs text-slate-700 mt-1">Gunakan Ctrl/Cmd + Klik untuk memilih lebih dari satu ruangan.</p>}
          </div>
          
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-900">Keterangan / Tambahan</label>
            <textarea name="catatan" defaultValue={selectedAsset?.catatan || ''} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none" placeholder="Catatan tambahan..."></textarea>
          </div>
        </div>
      </FormModal>

      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detail Kartu Inventaris Barang"
      >
        {selectedAsset ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h4 className="text-xl font-bold text-slate-900">{selectedAsset.nama}</h4>
                <div className="flex flex-wrap gap-2 items-center mt-1">
                  <Badge variant="secondary">{selectedAsset.kategori}</Badge>
                  <span className="text-sm font-mono text-slate-700">Kode: {selectedAsset.kodeBarang}</span>
                  <span className="text-sm font-mono text-slate-700">Reg: {selectedAsset.nomorRegister}</span>
                  {selectedAsset.nibar && (
                    <span className="text-xs font-mono font-bold text-sky-800 bg-sky-100 border border-sky-300 px-2 py-0.5 rounded-md">
                      NIBAR: {selectedAsset.nibar}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(() => {
                  const live = getAssetLiveStatus(selectedAsset.id);
                  return (
                    <Badge 
                      variant={
                        live.status === "Tersedia" ? "success" :
                        live.status === "Dipinjam" ? "info" :
                        live.status === "Dalam Perbaikan" ? "warning" : "destructive"
                      }
                      className="text-xs px-2.5 py-1 font-semibold"
                    >
                      Status: {live.status}
                    </Badge>
                  );
                })()}
                <Badge 
                  variant={
                    selectedAsset.kondisi === "Baik" ? "success" : 
                    selectedAsset.kondisi === "Rusak Ringan" ? "warning" : 
                    selectedAsset.kondisi === "Rusak Berat" ? "destructive" :
                    selectedAsset.kondisi === "Hilang" ? "destructive" : "secondary"
                  }
                  className={`text-xs px-2.5 py-1 ${
                    selectedAsset.kondisi === "Hilang" ? "bg-red-600 text-white border-red-700 font-extrabold" :
                    selectedAsset.kondisi === "Tidak Diketahui" ? "bg-slate-200 text-slate-800 border-slate-400 font-bold" : ""
                  }`}
                >
                  Kondisi: {selectedAsset.kondisi}
                </Badge>
              </div>
            </div>

            {selectedAsset.nibar ? (
              <div className="bg-sky-50 border-2 border-sky-200 p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-sky-950 uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-600 inline-block"></span>
                    NIBAR (Nomor Induk Barang SIPD / BMD)
                  </span>
                  <p className="font-mono font-bold text-sky-900 text-xs sm:text-sm break-all">{selectedAsset.nibar}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedAsset.nibar || '');
                    toast("NIBAR berhasil disalin ke clipboard", "success");
                  }}
                  className="px-3 py-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-lg shrink-0 cursor-pointer shadow-xs"
                >
                  Salin NIBAR
                </button>
              </div>
            ) : (
              <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <span className="text-amber-900 font-medium">Aset ini belum memiliki NIBAR resmi SIPD.</span>
                <button
                  type="button"
                  onClick={() => {
                    const cleanKode = (selectedAsset.kodeBarang || "1.3.2").replace(/[^0-9]/g, '').padEnd(12, '0').slice(0, 12);
                    const cleanReg = String(selectedAsset.nomorRegister || "1").replace(/\D/g, '').padStart(7, '0').slice(-7);
                    const genNibar = `1202350601000000440000${selectedAsset.tahunPerolehan || new Date().getFullYear()}${cleanKode}${cleanReg}`;
                    setAssets(prev => prev.map(a => a.id === selectedAsset.id ? { ...a, nibar: genNibar } : a));
                    toast("NIBAR resmi berhasil dibuat & disimpan!", "success");
                  }}
                  className="px-3 py-1 font-bold text-amber-950 bg-white border border-amber-300 rounded-lg hover:bg-amber-100 cursor-pointer"
                >
                  + Buat NIBAR Sekarang
                </button>
              </div>
            )}

            {/* Multi-Condition & Quantity Breakdown Card */}
            {(() => {
              const detailBd = getAssetConditionBreakdown(selectedAsset);
              const totalValuation = selectedAsset.harga * detailBd.total;

              return (
                <div className="bg-white border-2 border-primary-200 rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary-50 text-primary-700">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Kuantitas & Rincian Kondisi Fisik</h4>
                        <p className="text-xs text-slate-600">Total volume barang dan pembagian kondisi fisik nyata</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Total Kuantitas</div>
                      <div className="text-lg font-extrabold text-primary-700">
                        {detailBd.total} <span className="text-sm font-semibold">{detailBd.satuan}</span>
                      </div>
                    </div>
                  </div>

                  {/* 5 Conditions Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-800">Baik (B)</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div className="text-lg font-black text-emerald-900 mt-1">{detailBd.baik}</div>
                      <div className="text-[10px] text-emerald-700">
                        {((detailBd.baik / detailBd.total) * 100).toFixed(0)}% • Rp {(selectedAsset.harga * detailBd.baik).toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-800">Rusak Ringan</span>
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <div className="text-lg font-black text-amber-900 mt-1">{detailBd.rusakRingan}</div>
                      <div className="text-[10px] text-amber-700">
                        {((detailBd.rusakRingan / detailBd.total) * 100).toFixed(0)}% • Rp {(selectedAsset.harga * detailBd.rusakRingan).toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-rose-800">Rusak Berat</span>
                        <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                      </div>
                      <div className="text-lg font-black text-rose-900 mt-1">{detailBd.rusakBerat}</div>
                      <div className="text-[10px] text-rose-700">
                        {((detailBd.rusakBerat / detailBd.total) * 100).toFixed(0)}% • Rp {(selectedAsset.harga * detailBd.rusakBerat).toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className="bg-red-50/70 border border-red-300 rounded-lg p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-red-800">Hilang</span>
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      </div>
                      <div className="text-lg font-black text-red-900 mt-1">{detailBd.hilang}</div>
                      <div className="text-[10px] text-red-700">
                        {((detailBd.hilang / detailBd.total) * 100).toFixed(0)}% • Rp {(selectedAsset.harga * detailBd.hilang).toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className="bg-slate-100/70 border border-slate-300 rounded-lg p-2.5 col-span-2 sm:col-span-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-800">Tidak Tahu</span>
                        <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div className="text-lg font-black text-slate-900 mt-1">{detailBd.tidakDiketahui}</div>
                      <div className="text-[10px] text-slate-600">
                        {((detailBd.tidakDiketahui / detailBd.total) * 100).toFixed(0)}% • Rp {(selectedAsset.harga * detailBd.tidakDiketahui).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  {/* Proportion bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                    {detailBd.baik > 0 && <div style={{ width: `${(detailBd.baik / detailBd.total) * 100}%` }} className="bg-emerald-500 h-full" title={`Baik: ${detailBd.baik}`} />}
                    {detailBd.rusakRingan > 0 && <div style={{ width: `${(detailBd.rusakRingan / detailBd.total) * 100}%` }} className="bg-amber-500 h-full" title={`Rusak Ringan: ${detailBd.rusakRingan}`} />}
                    {detailBd.rusakBerat > 0 && <div style={{ width: `${(detailBd.rusakBerat / detailBd.total) * 100}%` }} className="bg-rose-500 h-full" title={`Rusak Berat: ${detailBd.rusakBerat}`} />}
                    {detailBd.hilang > 0 && <div style={{ width: `${(detailBd.hilang / detailBd.total) * 100}%` }} className="bg-red-700 h-full" title={`Hilang: ${detailBd.hilang}`} />}
                    {detailBd.tidakDiketahui > 0 && <div style={{ width: `${(detailBd.tidakDiketahui / detailBd.total) * 100}%` }} className="bg-slate-400 h-full" title={`Tidak Diketahui: ${detailBd.tidakDiketahui}`} />}
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-xs pt-1 text-slate-600">
                    <span>Harga Satuan: <strong>Rp {selectedAsset.harga.toLocaleString('id-ID')}</strong> / {detailBd.satuan}</span>
                    <span className="font-bold text-slate-900">Total Nilai Buku: <strong className="text-primary-700">Rp {totalValuation.toLocaleString('id-ID')}</strong></span>
                  </div>
                </div>
              );
            })()}

            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-300">
                  <div className="space-y-3">
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Tahun Perolehan</span> <span className="font-semibold text-slate-900">{selectedAsset.tahunPerolehan}</span></p>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Asal Usul / Sumber Dana</span> <span className="font-semibold text-slate-900">{selectedAsset.sumberDana}</span></p>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Harga Perolehan Satuan</span> <span className="font-semibold text-slate-900 text-primary-700">Rp {selectedAsset.harga.toLocaleString('id-ID')}</span></p>
                  </div>
                  <div className="space-y-3">
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Lokasi Ruangan</span> 
                      <span className="font-semibold text-slate-900">
                        {selectedAsset.ruanganId ? 
                          (selectedAsset.ruanganId.split(',').map(id => rooms.find(r => r.id === id)?.nama).filter(Boolean).join(', ') || "Tidak Ditetapkan") 
                          : "Tidak Ditetapkan"}
                      </span>
                    </p>
                    {selectedAsset.merk && (
                      <p><span className="text-slate-700 block text-xs uppercase font-medium">Merk / Type</span> <span className="font-semibold text-slate-900">{selectedAsset.merk}</span></p>
                    )}
                    {selectedAsset.bahan && (
                      <p><span className="text-slate-700 block text-xs uppercase font-medium">Bahan</span> <span className="font-semibold text-slate-900">{selectedAsset.bahan}</span></p>
                    )}
                  </div>
                </div>

                {/* Additional KIB Details if present */}
                {selectedAsset.kategori === "Tanah (KIB A)" && (
                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm p-4 border border-slate-300 rounded-xl">
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Luas Tanah (M2)</span> <span className="font-semibold text-slate-900">{selectedAsset.luasTanah || '-'}</span></p>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Status Hak</span> <span className="font-semibold text-slate-900">{selectedAsset.statusHak || '-'}</span></p>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Letak/Alamat</span> <span className="font-semibold text-slate-900">{selectedAsset.letakAlamat || '-'}</span></p>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Sertifikat</span> <span className="font-semibold text-slate-900">{selectedAsset.tanggalSertifikat || '-'} / {selectedAsset.nomorSertifikat || '-'}</span></p>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Penggunaan</span> <span className="font-semibold text-slate-900">{selectedAsset.penggunaan || '-'}</span></p>
                  </div>
                )}

                {selectedAsset.kategori === "Peralatan & Mesin (KIB B)" && (
                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm p-4 border border-slate-300 rounded-xl bg-slate-50/50">
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">NIBAR</span> <span className="font-semibold text-slate-900 font-mono text-xs break-all">{selectedAsset.nibar || selectedAsset.nomorRegister || '-'}</span></p>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Spesifikasi Lainnya / CC</span> <span className="font-semibold text-slate-900">{selectedAsset.spesifikasiLainnya || selectedAsset.ukuranCc || '-'}</span></p>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Nomor Pabrik / Mesin</span> <span className="font-semibold text-slate-900">{selectedAsset.nomorPabrik || '-'} / {selectedAsset.nomorMesin || '-'}</span></p>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Nomor Rangka / Polisi</span> <span className="font-semibold text-slate-900">{selectedAsset.nomorRangka || '-'} / {selectedAsset.nomorPolisi || '-'}</span></p>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Nomor BPKB</span> <span className="font-semibold text-slate-900">{selectedAsset.nomorBpkb || '-'}</span></p>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Status Komptabel</span> <span className="font-semibold text-slate-900 uppercase">{selectedAsset.komptabel || (selectedAsset.harga < 500000 ? 'ekstra' : 'intra')}</span></p>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Tanggal Perolehan</span> <span className="font-semibold text-slate-900">{selectedAsset.tanggalPerolehan || `${selectedAsset.tahunPerolehan}-06-30`}</span></p>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">SKPD / Penggunaan</span> <span className="font-semibold text-slate-900">{selectedAsset.penggunaan || selectedAsset.skpd || schoolProfile?.nama || '-'}</span></p>
                  </div>
                )}
                
                {selectedAsset.kategori === "Gedung & Bangunan (KIB C)" && (
                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm p-4 border border-slate-300 rounded-xl">
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Kondisi Bangunan</span> <span className="font-semibold text-slate-900">{selectedAsset.kondisiBangunan || '-'}</span></p>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Konstruksi Bertingkat / Beton</span> <span className="font-semibold text-slate-900">{selectedAsset.bertingkat || '-'} / {selectedAsset.beton || '-'}</span></p>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Luas Lantai (M2)</span> <span className="font-semibold text-slate-900">{selectedAsset.luasLantai || '-'}</span></p>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Letak/Alamat</span> <span className="font-semibold text-slate-900">{selectedAsset.letakAlamat || '-'}</span></p>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Dokumen Gedung</span> <span className="font-semibold text-slate-900">{selectedAsset.dokumenGedungTanggal || '-'} / {selectedAsset.dokumenGedungNomor || '-'}</span></p>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Status / Kode Tanah</span> <span className="font-semibold text-slate-900">{selectedAsset.statusTanah || '-'} / {selectedAsset.nomorKodeTanah || '-'}</span></p>
                  </div>
                )}

                {selectedAsset.kategori === "Jalan, Irigasi & Jaringan (KIB D)" && (
                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm p-4 border border-slate-300 rounded-xl">
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Konstruksi</span> <span className="font-semibold text-slate-900">{selectedAsset.konstruksi || '-'}</span></p>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Letak/Lokasi</span> <span className="font-semibold text-slate-900">{selectedAsset.letakAlamat || '-'}</span></p>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Panjang / Lebar / Luas</span> <span className="font-semibold text-slate-900">{selectedAsset.panjang || 0}m / {selectedAsset.lebar || 0}m / {selectedAsset.luasKibD || 0}m2</span></p>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Dokumen Gedung</span> <span className="font-semibold text-slate-900">{selectedAsset.dokumenTanggalKibD || '-'} / {selectedAsset.dokumenNomorKibD || '-'}</span></p>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Status / Kode Tanah</span> <span className="font-semibold text-slate-900">{selectedAsset.statusTanahKibD || '-'} / {selectedAsset.nomorKodeTanahKibD || '-'}</span></p>
                  </div>
                )}

                {selectedAsset.kategori === "Aset Tetap Lainnya (KIB E)" && (
                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm p-4 border border-slate-300 rounded-xl">
                    <div className="col-span-2 border-b border-slate-300 pb-2 mb-2"><span className="font-bold text-slate-800">Buku Perpustakaan</span></div>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Judul / Pencipta</span> <span className="font-semibold text-slate-900">{selectedAsset.bukuJudulPencipta || '-'}</span></p>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Spesifikasi</span> <span className="font-semibold text-slate-900">{selectedAsset.bukuSpesifikasi || '-'}</span></p>
                    
                    <div className="col-span-2 border-b border-slate-300 pb-2 mb-2 mt-2"><span className="font-bold text-slate-800">Kesenian / Kebudayaan</span></div>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Asal Daerah</span> <span className="font-semibold text-slate-900">{selectedAsset.seniAsalDaerah || '-'}</span></p>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Pencipta / Bahan</span> <span className="font-semibold text-slate-900">{selectedAsset.seniPencipta || '-'} / {selectedAsset.seniBahan || '-'}</span></p>

                    <div className="col-span-2 border-b border-slate-300 pb-2 mb-2 mt-2"><span className="font-bold text-slate-800">Hewan / Tumbuhan</span></div>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Jenis</span> <span className="font-semibold text-slate-900">{selectedAsset.hewanTumbuhanJenis || '-'}</span></p>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Ukuran</span> <span className="font-semibold text-slate-900">{selectedAsset.hewanTumbuhanUkuran || '-'}</span></p>

                    <div className="col-span-2 border-b border-slate-300 pb-2 mb-2 mt-2"><span className="font-bold text-slate-800">Informasi Umum KIB E</span></div>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Jumlah</span> <span className="font-semibold text-slate-900">{selectedAsset.jumlahKibE || '-'}</span></p>
                    <p><span className="text-slate-700 block text-xs uppercase font-medium">Tahun Cetak / Pengadaan</span> <span className="font-semibold text-slate-900">{selectedAsset.tahunCetakKibE || '-'}</span></p>
                  </div>
                )}

                {selectedAsset.catatan && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg text-sm text-slate-700">
                    <span className="font-medium text-slate-900 block mb-1">Keterangan:</span>
                    {selectedAsset.catatan}
                  </div>
                )}
              </div>
              
              <div className="md:col-span-1 space-y-6">
                {selectedAsset.gambarUrl && (
                  <div className="w-full text-center">
                    <img src={selectedAsset.gambarUrl} alt={selectedAsset.nama} className="w-full max-w-[250px] mx-auto rounded-lg shadow-sm border border-slate-300" />
                  </div>
                )}
                <BarcodeDisplay 
                  value={selectedAsset.kodeBarang} 
                  title={selectedAsset.nama} 
                  subtitle={`Reg: ${selectedAsset.nomorRegister}`} 
                />

                {/* History Section */}
                <div className="mt-8 space-y-4">
                  <h5 className="font-bold text-slate-800 border-b border-slate-300 pb-2">Riwayat Peminjaman Terakhir</h5>
                  {(() => {
                    const assetBorrowings = borrowings?.filter((b: any) => b.assetId === selectedAsset.id) || [];
                    if (assetBorrowings.length === 0) {
                      return <p className="text-sm text-slate-700 italic">Belum ada riwayat peminjaman.</p>;
                    }
                    // Sort descending by date
                    const latestBorrowings = assetBorrowings.sort((a: any, b: any) => new Date(b.tanggalPinjam).getTime() - new Date(a.tanggalPinjam).getTime()).slice(0, 3);
                    return (
                      <div className="space-y-3">
                        {latestBorrowings.map((b: any, idx: number) => (
                          <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-300 text-sm">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-semibold text-slate-900">{b.peminjam}</span>
                              <Badge variant={b.status === "Dikembalikan" ? "success" : "warning"}>{b.status}</Badge>
                            </div>
                            <p className="text-slate-700 text-xs">
                              {new Date(b.tanggalPinjam).toLocaleDateString('id-ID')}
                              {b.tanggalKembali ? ` - ${new Date(b.tanggalKembali).toLocaleDateString('id-ID')}` : ' (Belum dikembalikan)'}
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                <div className="mt-4 space-y-4">
                  <h5 className="font-bold text-slate-800 border-b border-slate-300 pb-2">Riwayat Pemeliharaan/Servis</h5>
                  {(() => {
                    const assetMaint = maintenances?.filter((m: any) => m.assetId === selectedAsset.id) || [];
                    if (assetMaint.length === 0) {
                      return <p className="text-sm text-slate-700 italic">Belum ada riwayat pemeliharaan.</p>;
                    }
                    const latestMaint = assetMaint.sort((a: any, b: any) => new Date(b.tanggalLapor).getTime() - new Date(a.tanggalLapor).getTime()).slice(0, 3);
                    return (
                      <div className="space-y-3">
                        {latestMaint.map((m: any, idx: number) => (
                          <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-300 text-sm">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-semibold text-slate-900 line-clamp-1 mr-2">{m.keluhan || m.deskripsiKerusakan}</span>
                              <Badge variant={m.status === "Selesai" ? "success" : "warning"}>{m.status}</Badge>
                            </div>
                            <p className="text-slate-700 text-xs mt-1">Lapor: {new Date(m.tanggalLapor).toLocaleDateString('id-ID')}</p>
                            {m.biayaEstimasi > 0 && <p className="text-slate-700 text-xs font-semibold mt-1">Biaya: Rp {m.biayaEstimasi.toLocaleString('id-ID')}</p>}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Audit Trail & History Perubahan Nilai/Data */}
                <div className="mt-4 space-y-4">
                  <h5 className="font-bold text-slate-800 border-b border-slate-300 pb-2 flex items-center justify-between">
                    <span>Audit Trail Perubahan Data</span>
                    <span className="text-[10px] text-slate-500 font-normal">Terekam Otomatis</span>
                  </h5>
                  {(() => {
                    const auditHistory = selectedAsset.auditHistory || [];
                    if (auditHistory.length === 0) {
                      return <p className="text-xs text-slate-500 italic">Belum ada revisi data tersimpan (data awal pengadaan/impor).</p>;
                    }
                    return (
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {auditHistory.map((log: any, idx: number) => (
                          <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-slate-900">{log.label || log.field}</span>
                              <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                            <div className="text-[11px] text-slate-600 bg-white p-1.5 rounded border border-slate-100">
                              <span className="line-through text-rose-600">{String(log.oldValue)}</span>
                              <span className="mx-1.5 font-bold text-slate-400">&rarr;</span>
                              <span className="font-semibold text-emerald-700">{String(log.newValue)}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                              <span>Petugas: {log.actor}</span>
                              {log.reason && <span className="italic truncate max-w-[130px]">{log.reason}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-700">Mencari data aset...</div>
        )}
      </DetailModal>

      <PrintBarcodesModal 
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        assets={filteredAssets}
      />
      <PrintBarcodesModal 
        isOpen={isPrintAllModalOpen}
        onClose={() => setIsPrintAllModalOpen(false)}
        assets={assets}
      />
      <PrintSchoolLabelsModal
        isOpen={isPrintSchoolModalOpen}
        onClose={() => setIsPrintSchoolModalOpen(false)}
        assets={filteredAssets}
      />
      <PrintSchoolLabelsModal
        isOpen={isPrintAllSchoolModalOpen}
        onClose={() => setIsPrintAllSchoolModalOpen(false)}
        assets={assets}
      />
      <PrintSchoolLabelsModal
        isOpen={isPrintSelectedSchoolModalOpen}
        onClose={() => setIsPrintSelectedSchoolModalOpen(false)}
        assets={assets.filter(a => selectedIds.includes(a.id))}
      />
      <ConfirmDeleteModal 
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, isBulk: false })}
        onConfirm={confirmDelete}
        title={deleteModalState.title}
        message={deleteModalState.message}
      />
      <ImportDataModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={(newAssets) => {
          setAssets([...assets, ...newAssets]);
        }}
      />
    </div>
  );
}
