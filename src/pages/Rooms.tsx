import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { DataActions } from "../components/shared/DataActions";
import { useData } from "../contexts/DataContext";
import { 
  Plus, Users, LayoutGrid, Search, Edit, QrCode, Trash2, ChevronDown, 
  Filter, Inbox, DoorClosed, Building2, Landmark, Layers, Maximize2, 
  ExternalLink, ArrowRight, CheckCircle2, Warehouse, Sparkles, Map as MapIcon
} from "lucide-react";
import { FormModal } from "../components/shared/FormModal";
import { useToast } from "../contexts/ToastContext";
import { PrintBarcodesModal } from "../components/shared/PrintBarcodesModal";
import { PrintSchoolLabelsModal } from "../components/shared/PrintSchoolLabelsModal";
import { ConfirmDeleteModal } from "../components/shared/ConfirmDeleteModal";
import { RoomAssetsModal } from "../components/shared/RoomAssetsModal";
import { RowActions } from "../components/shared/RowActions";
import { Room, Asset, getAssetConditionBreakdown } from "../types";
import { exportToPdf, exportToExcel } from "../lib/exportUtils";
import { StickyTableWrapper } from "../components/shared/StickyTableWrapper";

export default function Rooms() {
  const { rooms, setRooms, assets, schoolProfile, deleteRoomSafe } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearchTerm = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [filterJenis, setFilterJenis] = useState("Semua");
  const [filterBangunan, setFilterBangunan] = useState("Semua");
  const [sortBy, setSortBy] = useState("Nama A-Z");
  const [activeTab, setActiveTab] = useState<"rooms" | "buildings">("rooms");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isPrintSchoolModalOpen, setIsPrintSchoolModalOpen] = useState(false);
  const [isRoomAssetsModalOpen, setIsRoomAssetsModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const selectedRoom = rooms.find(r => r.id === selectedRoomId);
  
  // Form state for building selection in room modal
  const [formBuildingOption, setFormBuildingOption] = useState<string>("");
  const [formCustomBuilding, setFormCustomBuilding] = useState<string>("");
  const [formLantai, setFormLantai] = useState<string>("Lantai 1");
  const [formPanjang, setFormPanjang] = useState<string>("");
  const [formLebar, setFormLebar] = useState<string>("");
  const [formLuas, setFormLuas] = useState<string>("");
  const [formTahun, setFormTahun] = useState<string>("");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean; 
    isBulk: boolean; 
    idToDelete?: string; 
    title?: string; 
    message?: string;
  }>({ isOpen: false, isBulk: false });

  const toast = useToast();

  // KIB C Assets for master building linking
  const kibCAssets = useMemo(() => {
    return assets.filter(a => a.kategori === "Gedung & Bangunan (KIB C)");
  }, [assets]);

  // Distinct Building summary & metadata
  const buildingSummaryList = useMemo(() => {
    const map = new Map<string, {
      nama: string;
      kibCAsset?: Asset;
      rooms: Room[];
      totalLuas: number;
      totalKapasitas: number;
      totalAssetsCount: number;
      totalAssetsValue: number;
      tahunPembangunan?: number;
      kondisi: string;
    }>();

    // 1. Initialize from KIB C Assets
    kibCAssets.forEach(kib => {
      map.set(kib.nama, {
        nama: kib.nama,
        kibCAsset: kib,
        rooms: [],
        totalLuas: kib.luasLantai || 0,
        totalKapasitas: 0,
        totalAssetsCount: 0,
        totalAssetsValue: kib.harga || 0,
        tahunPembangunan: kib.tahunPerolehan,
        kondisi: kib.kondisi || 'Baik'
      });
    });

    // 2. Add / merge from rooms data
    rooms.forEach(r => {
      const bName = r.bangunan?.trim() || "Gedung Belum Ditentukan";
      const existing = map.get(bName) || {
        nama: bName,
        kibCAsset: kibCAssets.find(k => k.nama.toLowerCase() === bName.toLowerCase() || (r.kibCAssetId && k.id === r.kibCAssetId)),
        rooms: [],
        totalLuas: 0,
        totalKapasitas: 0,
        totalAssetsCount: 0,
        totalAssetsValue: 0,
        tahunPembangunan: r.tahunBangunan,
        kondisi: r.kondisi || 'Baik'
      };

      existing.rooms.push(r);
      existing.totalLuas += (r.luas || 0);
      existing.totalKapasitas += (r.kapasitas || 0);
      
      const rAssets = assets.filter(a => a.ruanganId && a.ruanganId.includes(r.id));
      const rUnits = rAssets.reduce((sum, a) => sum + getAssetConditionBreakdown(a).total, 0);
      const rVal = rAssets.reduce((sum, a) => sum + ((a.harga || 0) * getAssetConditionBreakdown(a).total), 0);
      existing.totalAssetsCount += rUnits;
      existing.totalAssetsValue += rVal;
      
      if (!existing.tahunPembangunan && r.tahunBangunan) {
        existing.tahunPembangunan = r.tahunBangunan;
      }

      map.set(bName, existing);
    });

    return Array.from(map.values()).sort((a, b) => a.nama.localeCompare(b.nama));
  }, [rooms, assets, kibCAssets]);

  // Overall KPI statistics
  const totalStats = useMemo(() => {
    const totalRooms = rooms.length;
    const totalBuildings = buildingSummaryList.filter(b => b.nama !== "Gedung Belum Ditentukan" || b.rooms.length > 0).length;
    const totalLuas = rooms.reduce((sum, r) => sum + (r.luas || 0), 0);
    const totalKapasitas = rooms.reduce((sum, r) => sum + (r.kapasitas || 0), 0);
    
    // Assets assigned to any room
    const assetsInRooms = assets.filter(a => a.ruanganId && rooms.some(r => a.ruanganId?.includes(r.id)));
    const totalAssetItems = assetsInRooms.reduce((sum, a) => sum + getAssetConditionBreakdown(a).total, 0);
    const totalAssetVal = assetsInRooms.reduce((sum, a) => sum + ((a.harga || 0) * getAssetConditionBreakdown(a).total), 0);

    return { totalRooms, totalBuildings, totalLuas, totalKapasitas, totalAssetItems, totalAssetVal };
  }, [rooms, buildingSummaryList, assets]);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) {
      setSearchTerm(q);
    }
  }, [searchParams]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value) {
      searchParams.set("q", value);
    } else {
      searchParams.delete("q");
    }
    setSearchParams(searchParams, { replace: true });
  };

  const openDeleteModal = (id: string, name?: string) => {
    const assetsInRoom = assets.filter(a => a.ruanganId === id);
    if (assetsInRoom.length > 0) {
      toast(`Ruangan "${name || id}" tidak dapat dihapus karena masih menampung ${assetsInRoom.length} barang inventaris aktif! Harap mutasikan barang ke ruangan lain terlebih dahulu.`, 'error');
      return;
    }

    setDeleteModalState({
      isOpen: true,
      isBulk: false,
      idToDelete: id,
      title: "Hapus Ruangan",
      message: `Apakah Anda yakin ingin menghapus ruangan ${name ? '"'+name+'"' : 'ini'}? Aksi ini tidak dapat dibatalkan.`
    });
  };

  const openBulkDeleteModal = () => {
    const roomsWithAssets = selectedIds.filter(id => assets.some(a => a.ruanganId === id));
    if (roomsWithAssets.length > 0) {
      toast(`Ada ${roomsWithAssets.length} ruangan terpilih yang masih memiliki barang inventaris aktif di dalamnya. Pindahkan barang terlebih dahulu sebelum menghapus.`, 'error');
      return;
    }

    setDeleteModalState({
      isOpen: true,
      isBulk: true,
      title: "Hapus Kelompok Ruangan",
      message: `Apakah Anda yakin ingin menghapus ${selectedIds.length} ruangan terpilih? Aksi ini tidak dapat dibatalkan.`
    });
  };

  const confirmDelete = () => {
    if (deleteModalState.isBulk) {
      const safeToDelete = selectedIds.filter(id => !assets.some(a => a.ruanganId === id));
      if (safeToDelete.length === 0) {
        toast('Semua ruangan terpilih masih memiliki aset aktif, penghapusan dibatalkan demi integritas data.', 'error');
        setDeleteModalState({ isOpen: false, isBulk: false });
        return;
      }
      setRooms(prev => prev.filter(item => !safeToDelete.includes(item.id)));
      toast(`Berhasil menghapus ${safeToDelete.length} ruangan yang kosong.`, 'success');
      setSelectedIds([]);
    } else if (deleteModalState.idToDelete) {
      const res = deleteRoomSafe(deleteModalState.idToDelete);
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
    if (selectedIds.length === filteredRooms.length && filteredRooms.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRooms.map(item => item.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]);
  };

  const handleAction = (msg: string, type: 'info'|'success'|'error' = 'info') => toast(msg, type);

  // Initialize form when opening modal
  const openAddRoomModal = (presetBuilding?: string) => {
    setSelectedRoomId(null);
    if (presetBuilding) {
      const matchingKib = kibCAssets.find(k => k.nama.toLowerCase() === presetBuilding.toLowerCase());
      if (matchingKib) {
        setFormBuildingOption(`KIBC:${matchingKib.id}`);
        setFormTahun(matchingKib.tahunPerolehan ? String(matchingKib.tahunPerolehan) : "");
      } else {
        setFormBuildingOption(presetBuilding);
        setFormTahun("");
      }
      setFormCustomBuilding("");
    } else {
      // Default to first KIB C building if exists, or custom
      if (kibCAssets.length > 0) {
        setFormBuildingOption(`KIBC:${kibCAssets[0].id}`);
        setFormTahun(kibCAssets[0].tahunPerolehan ? String(kibCAssets[0].tahunPerolehan) : "");
      } else {
        setFormBuildingOption("__CUSTOM__");
        setFormTahun("");
      }
      setFormCustomBuilding("");
    }
    setFormLantai("Lantai 1");
    setFormPanjang("");
    setFormLebar("");
    setFormLuas("");
    setIsModalOpen(true);
  };

  const openEditRoomModal = (room: Room) => {
    setSelectedRoomId(room.id);
    
    // Determine building option
    if (room.kibCAssetId) {
      setFormBuildingOption(`KIBC:${room.kibCAssetId}`);
      setFormCustomBuilding("");
    } else if (room.bangunan) {
      const matchingKib = kibCAssets.find(k => k.nama.toLowerCase() === room.bangunan?.toLowerCase());
      if (matchingKib) {
        setFormBuildingOption(`KIBC:${matchingKib.id}`);
        setFormCustomBuilding("");
      } else {
        // Check if building matches one in list
        const existsInList = buildingSummaryList.some(b => b.nama === room.bangunan);
        if (existsInList) {
          setFormBuildingOption(room.bangunan);
          setFormCustomBuilding("");
        } else {
          setFormBuildingOption("__CUSTOM__");
          setFormCustomBuilding(room.bangunan);
        }
      }
    } else {
      setFormBuildingOption("__CUSTOM__");
      setFormCustomBuilding("");
    }

    setFormLantai(room.lantai || "Lantai 1");
    setFormPanjang(room.panjang ? String(room.panjang) : "");
    setFormLebar(room.lebar ? String(room.lebar) : "");
    setFormLuas(room.luas ? String(room.luas) : "");
    setFormTahun(room.tahunBangunan ? String(room.tahunBangunan) : "");
    setIsModalOpen(true);
  };

  // Handle building option changes
  const handleBuildingOptionChange = (val: string) => {
    setFormBuildingOption(val);
    if (val.startsWith("KIBC:")) {
      const assetId = val.replace("KIBC:", "");
      const kib = kibCAssets.find(k => k.id === assetId);
      if (kib && kib.tahunPerolehan) {
        setFormTahun(String(kib.tahunPerolehan));
      }
    }
  };

  // Auto-calculate Luas when panjang / lebar changes
  const handlePanjangChange = (val: string) => {
    setFormPanjang(val);
    const p = parseFloat(val);
    const l = parseFloat(formLebar);
    if (!isNaN(p) && !isNaN(l) && p > 0 && l > 0) {
      setFormLuas(String(Math.round(p * l * 100) / 100));
    }
  };

  const handleLebarChange = (val: string) => {
    setFormLebar(val);
    const p = parseFloat(formPanjang);
    const l = parseFloat(val);
    if (!isNaN(p) && !isNaN(l) && p > 0 && l > 0) {
      setFormLuas(String(Math.round(p * l * 100) / 100));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    let finalBangunan = "";
    let finalKibCAssetId: string | undefined = undefined;

    if (formBuildingOption === "__CUSTOM__") {
      finalBangunan = formCustomBuilding.trim() || (formData.get('customBangunanText') as string)?.trim() || "";
    } else if (formBuildingOption.startsWith("KIBC:")) {
      const assetId = formBuildingOption.replace("KIBC:", "");
      const kib = kibCAssets.find(k => k.id === assetId);
      if (kib) {
        finalBangunan = kib.nama;
        finalKibCAssetId = kib.id;
      }
    } else if (formBuildingOption) {
      finalBangunan = formBuildingOption;
    }

    const roomData: Partial<Room> = {
      nama: formData.get('nama') as string,
      kodeRuangan: formData.get('kodeRuangan') as string,
      kapasitas: parseInt(formData.get('kapasitas') as string) || 0,
      penanggungJawab: formData.get('penanggungJawab') as string,
      nipPenanggungJawab: (formData.get('nipPenanggungJawab') as string) || undefined,
      jenis: formData.get('jenis') as any,
      bangunan: finalBangunan || undefined,
      kibCAssetId: finalKibCAssetId,
      lantai: formLantai || (formData.get('lantai') as string) || undefined,
      panjang: parseFloat(formPanjang) || undefined,
      lebar: parseFloat(formLebar) || undefined,
      tinggi: parseFloat(formData.get('tinggi') as string) || undefined,
      luas: parseFloat(formLuas) || undefined,
      kondisi: (formData.get('kondisi') as string) || "Baik",
      tahunBangunan: parseInt(formTahun) || undefined,
    };

    if (selectedRoomId) {
      setRooms(prev => prev.map(r => r.id === selectedRoomId ? { ...r, ...roomData } : r));
      toast('Data ruangan dan bangunan berhasil diperbarui', 'success');
    } else {
      setRooms(prev => [...prev, { ...roomData, id: `ROOM-${Date.now()}` } as Room]);
      toast('Ruangan baru berhasil ditambahkan', 'success');
    }
    
    setIsModalOpen(false);
  };

  const exportColumns = [
    { header: "Kode Ruangan", key: "kodeRuangan" },
    { header: "Nama Ruangan", key: "nama" },
    { header: "Bangunan / Gedung", key: "bangunan" },
    { header: "Lantai / Tingkat", key: "lantai" },
    { header: "Jenis Ruangan", key: "jenis" },
    { header: "Kapasitas (Orang)", key: "kapasitas" },
    { header: "Panjang (m)", key: "panjang" },
    { header: "Lebar (m)", key: "lebar" },
    { header: "Luas (m²)", key: "luas" },
    { header: "Tahun Bangunan", key: "tahunBangunan" },
    { header: "Kondisi Fisik", key: "kondisi" },
    { header: "Penanggung Jawab", key: "penanggungJawab" },
    { header: "NIP", key: "nipPenanggungJawab" },
  ];

  const handleExportExcel = () => {
    exportToExcel(filteredRooms, exportColumns, `Data_Ruangan_dan_Bangunan`);
    toast("Berhasil mengekspor ruangan ke Excel", "success");
  };

  const handleExportPdf = () => {
    exportToPdf(filteredRooms, exportColumns, `Laporan Data Ruangan & Fasilitas Gedung`, schoolProfile);
    toast("Berhasil mengekspor ruangan ke PDF", "success");
  };

  // Filtered rooms based on search, jenis, and bangunan
  const filteredRooms = useMemo(() => {
    return (rooms || []).filter(room => {
      if (!room) return false;
      const term = (searchTerm || "").toLowerCase().trim();
      const nama = (room.nama || "").toLowerCase();
      const kode = (room.kodeRuangan || "").toLowerCase();
      const pj = (room.penanggungJawab || "").toLowerCase();
      const bgn = (room.bangunan || "").toLowerCase();
      const lnt = (room.lantai || "").toLowerCase();

      const matchesSearch = !term || nama.includes(term) || kode.includes(term) || pj.includes(term) || bgn.includes(term) || lnt.includes(term);
      const matchesJenis = filterJenis === "Semua" || room.jenis === filterJenis;
      
      let matchesBangunan = true;
      if (filterBangunan !== "Semua") {
        if (filterBangunan === "__NONE__") {
          matchesBangunan = !room.bangunan;
        } else {
          matchesBangunan = room.bangunan === filterBangunan;
        }
      }

      return matchesSearch && matchesJenis && matchesBangunan;
    }).sort((a, b) => {
      switch (sortBy) {
        case "Nama A-Z":
          return (a.nama || "").localeCompare(b.nama || "");
        case "Nama Z-A":
          return (b.nama || "").localeCompare(a.nama || "");
        case "Gedung A-Z":
          return (a.bangunan || "Z").localeCompare(b.bangunan || "Z");
        case "Kapasitas Terbesar":
          return (b.kapasitas || 0) - (a.kapasitas || 0);
        case "Kapasitas Terkecil":
          return (a.kapasitas || 0) - (b.kapasitas || 0);
        case "Luas Terbesar":
          return (b.luas || 0) - (a.luas || 0);
        default:
          return 0;
      }
    });
  }, [rooms, searchTerm, filterJenis, filterBangunan, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">Ruangan & Bangunan (KIR)</h2>
            <span className="bg-primary-100 text-primary-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              KIB C Terpadu
            </span>
          </div>
          <p className="text-slate-700 text-sm mt-0.5">
            Kartu Inventaris Ruangan, tata letak fasilitas, dan keterkaitan dengan master Gedung & Bangunan sekolah.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DataActions 
            onExportExcel={handleExportExcel}
            onExportCsv={() => handleAction("Mengekspor daftar Ruangan ke CSV...")}
            onExportPdf={handleExportPdf}
            onImport={() => { openAddRoomModal(); handleAction("Memuat formulir tambah ruangan..."); }}
          />
          <div className="relative group">
            <Button variant="outline" className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              <span>Cetak Label</span>
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-300 shadow-lg rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex flex-col py-1">
              <button 
                onClick={() => setIsPrintModalOpen(true)}
                className="text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors w-full border-b border-slate-200"
              >
                Cetak QR Code Ruangan
              </button>
              <button 
                onClick={() => setIsPrintSchoolModalOpen(true)}
                className="text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors w-full"
              >
                Cetak Label Sekolah
              </button>
            </div>
          </div>
          <Link to="/school-map">
            <Button variant="outline" className="flex items-center gap-1.5">
              <MapIcon className="w-4 h-4 text-primary-600" />
              <span>Denah Sekolah</span>
            </Button>
          </Link>
          <Button onClick={() => openAddRoomModal()}>
            <Plus className="mr-2 w-4 h-4" />
            Tambah Ruangan
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
            <DoorClosed className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Ruangan</p>
            <p className="text-lg sm:text-xl font-bold text-slate-900">{totalStats.totalRooms} Ruangan</p>
            <p className="text-[11px] text-slate-500">Tercatat di sistem</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Bangunan / Gedung</p>
            <p className="text-lg sm:text-xl font-bold text-slate-900">{totalStats.totalBuildings} Unit</p>
            <p className="text-[11px] text-amber-600 font-medium">
              {kibCAssets.length} master KIB C
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Maximize2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Luas Lantai</p>
            <p className="text-lg sm:text-xl font-bold text-slate-900">{totalStats.totalLuas.toLocaleString("id-ID")} m²</p>
            <p className="text-[11px] text-slate-500">Kapasitas: {totalStats.totalKapasitas} org</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Aset dalam Ruangan</p>
            <p className="text-lg sm:text-xl font-bold text-emerald-600">{totalStats.totalAssetItems} Item</p>
            <p className="text-[11px] text-emerald-700 font-medium truncate max-w-[140px]">
              Rp {totalStats.totalAssetVal.toLocaleString("id-ID")}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs navigation: Daftar Ruangan vs Rekapitulasi Gedung */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("rooms")}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition-all ${
            activeTab === "rooms"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <DoorClosed className="w-4 h-4" />
          <span>Daftar Ruangan & KIR ({filteredRooms.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("buildings")}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition-all ${
            activeTab === "buildings"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Rekapitulasi Bangunan & Gedung ({buildingSummaryList.length})</span>
        </button>
        <Link
          to="/school-map"
          className="flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 border-transparent text-slate-500 hover:text-primary-600 transition-all"
        >
          <MapIcon className="w-4 h-4 text-primary-500" />
          <span>Denah Sekolah & Tata Letak →</span>
        </Link>
      </div>

      {activeTab === "buildings" ? (
        /* TAB 2: REKAPITULASI BANGUNAN & FASILITAS GEDUNG */
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Landmark className="w-5 h-5 text-primary-600" />
                Daftar Induk Bangunan & Gedung Sekolah
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Pemetaan seluruh gedung sekolah yang menaungi ruang kelas, laboratorium, kantor, dan fasilitas KIR.
              </p>
            </div>
            <Button size="sm" onClick={() => openAddRoomModal()} className="self-start sm:self-auto">
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Ruangan ke Gedung
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buildingSummaryList.map((bgn, idx) => {
              const isKibLinked = Boolean(bgn.kibCAsset);
              return (
                <div 
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200 hover:border-primary-300 shadow-sm p-4 flex flex-col justify-between transition-all group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-100 group-hover:bg-primary-50 group-hover:text-primary-600 text-slate-700 rounded-lg transition-colors">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-tight group-hover:text-primary-700 transition-colors">
                            {bgn.nama}
                          </h4>
                          <span className="text-[11px] text-slate-500 font-medium">
                            Tahun Bangun: {bgn.tahunPembangunan || "-"}
                          </span>
                        </div>
                      </div>
                      {isKibLinked ? (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          KIB C
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium shrink-0">
                          Lokal
                        </span>
                      )}
                    </div>

                    {bgn.kibCAsset && (
                      <div className="mb-3 px-2.5 py-1.5 bg-slate-50 rounded-lg text-[11px] border border-slate-100 text-slate-600 flex justify-between items-center">
                        <span className="font-mono text-slate-700 font-semibold">{bgn.kibCAsset.kodeBarang}</span>
                        <span>{bgn.kibCAsset.bertingkat || "1 Tingkat"} • {bgn.kibCAsset.beton || "Beton"}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-center text-xs mb-3">
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-500 text-[10px] block">Jumlah Ruangan</span>
                        <span className="font-bold text-slate-900 text-sm">{bgn.rooms.length} Ruangan</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-500 text-[10px] block">Total Luas</span>
                        <span className="font-bold text-slate-900 text-sm">{bgn.totalLuas} m²</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-500 text-[10px] block">Kapasitas</span>
                        <span className="font-bold text-slate-900 text-sm">{bgn.totalKapasitas} Orang</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-500 text-[10px] block">Aset di Gedung</span>
                        <span className="font-bold text-primary-600 text-sm">{bgn.totalAssetsCount} Item</span>
                      </div>
                    </div>

                    {bgn.rooms.length > 0 && (
                      <div className="mb-3">
                        <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Ruangan di Gedung Ini:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {bgn.rooms.slice(0, 4).map(rm => (
                            <span 
                              key={rm.id} 
                              className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium cursor-pointer"
                              onClick={() => { setSelectedRoomId(rm.id); setIsRoomAssetsModalOpen(true); }}
                            >
                              {rm.nama} {rm.lantai ? `(${rm.lantai})` : ''}
                            </span>
                          ))}
                          {bgn.rooms.length > 4 && (
                            <span className="text-[10px] text-slate-500 px-1 py-0.5">
                              +{bgn.rooms.length - 4} lainnya
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs w-full justify-center"
                      onClick={() => {
                        setFilterBangunan(bgn.nama);
                        setActiveTab("rooms");
                      }}
                    >
                      Lihat Ruangan
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                    <Button 
                      size="sm" 
                      className="text-xs shrink-0"
                      onClick={() => openAddRoomModal(bgn.nama)}
                      title="Tambah Ruangan di Gedung Ini"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* TAB 1: DAFTAR RUANGAN (KIR) DENGAN KOLOM & FILTER BANGUNAN */
        <div className="space-y-4">
          <Card>
            <CardContent className="p-3.5 sm:p-4 flex flex-col lg:flex-row gap-3 sm:gap-4 justify-between items-start lg:items-center bg-slate-50 border-b border-slate-200 rounded-t-xl">
              <div className="relative w-full lg:w-72 shrink-0">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari ruangan, gedung, kode..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full appearance-none bg-white pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto lg:justify-end">
                {/* Filter Bangunan / Gedung */}
                <div className="relative w-full sm:w-auto">
                  <select
                    value={filterBangunan}
                    onChange={(e) => setFilterBangunan(e.target.value)}
                    className="w-full appearance-none bg-white px-3 py-2 pr-8 text-xs sm:text-sm border border-slate-300 rounded-xl focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all hover:bg-slate-50 shadow-xs font-medium text-slate-800"
                  >
                    <option value="Semua">🏢 Semua Bangunan</option>
                    {buildingSummaryList.map((b, i) => (
                      <option key={i} value={b.nama}>
                        {b.nama} ({b.rooms.length})
                      </option>
                    ))}
                    <option value="__NONE__">Belum Ditentukan Gedung</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                </div>

                {/* Filter Jenis Ruangan */}
                <div className="relative w-full sm:w-auto">
                  <select
                    value={filterJenis}
                    onChange={(e) => setFilterJenis(e.target.value)}
                    className="w-full appearance-none bg-white px-3 py-2 pr-8 text-xs sm:text-sm border border-slate-300 rounded-xl focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all hover:bg-slate-50 shadow-xs"
                  >
                    <option value="Semua">Semua Jenis Ruangan</option>
                    <option value="Kelas">Kelas</option>
                    <option value="Laboratorium">Laboratorium</option>
                    <option value="Kantor">Kantor</option>
                    <option value="Perpustakaan">Perpustakaan</option>
                    <option value="Gudang">Gudang</option>
                    <option value="Fasilitas Umum">Fasilitas Umum</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                </div>

                {/* Urutkan */}
                <div className="relative w-full sm:w-auto">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full appearance-none bg-white px-3 py-2 pr-8 text-xs sm:text-sm border border-slate-300 rounded-xl focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all font-semibold text-primary-700 hover:bg-slate-50 shadow-xs"
                  >
                    <option value="Nama A-Z">Nama A-Z</option>
                    <option value="Nama Z-A">Nama Z-A</option>
                    <option value="Gedung A-Z">Gedung / Bangunan</option>
                    <option value="Kapasitas Terbesar">Kapasitas Maksimal</option>
                    <option value="Luas Terbesar">Luas Terbesar</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {selectedIds.length > 0 && (
                <div className="bg-primary-50 px-4 sm:px-6 py-2.5 sm:py-3 border-b border-primary-100 flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium text-primary-700">
                    {selectedIds.length} ruangan terpilih
                  </span>
                  <Button variant="destructive" size="sm" onClick={openBulkDeleteModal} className="h-8 text-xs">
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Hapus Terpilih
                  </Button>
                </div>
              )}

              {/* Mobile Card List View for screens < 768px */}
              <div className="md:hidden divide-y divide-slate-100 pb-20">
                {filteredRooms.length > 0 ? (
                  filteredRooms.map((room) => {
                    const roomAssets = assets.filter((a) => a.ruanganId && a.ruanganId.includes(room.id));
                    const totalUnits = roomAssets.reduce((sum, a) => sum + getAssetConditionBreakdown(a).total, 0);
                    const totalValue = roomAssets.reduce((sum, a) => sum + ((a.harga || 0) * getAssetConditionBreakdown(a).total), 0);

                    return (
                      <div key={room.id} className="p-3.5 hover:bg-slate-50/80 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="pt-1">
                            <input 
                              type="checkbox" 
                              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-4 w-4" 
                              checked={selectedIds.includes(room.id)} 
                              onChange={() => toggleSelect(room.id)} 
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <h4 className="font-bold text-sm text-slate-900 leading-tight">
                                  {room.nama}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  <span className="font-mono text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {room.kodeRuangan}
                                  </span>
                                  <span className="text-[10px] text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded font-medium">
                                    {room.jenis}
                                  </span>
                                </div>
                              </div>
                              <RowActions actions={[
                                { label: "Lihat Daftar Aset (KIR)", icon: LayoutGrid, onClick: () => { setSelectedRoomId(room.id); setIsRoomAssetsModalOpen(true); } },
                                { label: "Edit Item", icon: Edit, onClick: () => openEditRoomModal(room) },
                                { label: "Hapus", icon: Trash2, variant: "destructive", onClick: () => openDeleteModal(room.id, room.nama) }
                              ]} />
                            </div>

                            {/* Building & Floor badge in Mobile */}
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-700 bg-amber-50/80 border border-amber-100 px-2 py-1 rounded-lg">
                              <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="font-medium truncate">{room.bangunan || "Gedung Belum Diatur"}</span>
                              <span className="text-amber-700 font-semibold shrink-0">• {room.lantai || "Lt. 1"}</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2 border-t border-slate-100 text-center">
                              <div className="bg-slate-50 p-1.5 rounded-lg">
                                <span className="text-[10px] text-slate-500 block">Kapasitas</span>
                                <span className="text-xs font-bold text-slate-800">{room.kapasitas} org</span>
                              </div>
                              <div className="bg-slate-50 p-1.5 rounded-lg">
                                <span className="text-[10px] text-slate-500 block">Jumlah Aset</span>
                                <span className="text-xs font-bold text-primary-600">{totalUnits} unit</span>
                              </div>
                              <div className="bg-slate-50 p-1.5 rounded-lg">
                                <span className="text-[10px] text-slate-500 block">Est. Nilai</span>
                                <span className="text-[11px] font-bold text-emerald-600 truncate block">Rp {totalValue.toLocaleString("id-ID")}</span>
                              </div>
                            </div>

                            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                              <span>PJ: <strong className="font-medium text-slate-700">{room.penanggungJawab}</strong></span>
                              <button 
                                onClick={() => { setSelectedRoomId(room.id); setIsRoomAssetsModalOpen(true); }}
                                className="text-primary-600 font-semibold hover:underline"
                              >
                                Buka Dokumen KIR →
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    <DoorClosed className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-sm">Tidak ada data ruangan</p>
                  </div>
                )}
              </div>

              {/* Desktop Table View for screens >= 768px with Standby Scroll Bar */}
              <div className="hidden md:block">
                <StickyTableWrapper
                  tableContainerClassName="min-h-[280px]"
                  label="Tabel Data Ruangan (KIR)"
                >
                  <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 sticky top-0 z-10 shadow-xs">
                    <tr>
                      <th className="px-5 py-3 font-medium w-10">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" 
                          checked={selectedIds.length === filteredRooms.length && filteredRooms.length > 0} 
                          onChange={toggleSelectAll} 
                        />
                      </th>
                      <th className="px-5 py-3 font-medium">Kode/Jenis</th>
                      <th className="px-5 py-3 font-medium">Nama Ruangan</th>
                      <th className="px-5 py-3 font-medium">Bangunan / Gedung & Lantai</th>
                      <th className="px-5 py-3 font-medium">Penanggung Jawab</th>
                      <th className="px-5 py-3 font-medium text-right">Luas & Kapasitas</th>
                      <th className="px-5 py-3 font-medium text-right">Jumlah Aset</th>
                      <th className="px-5 py-3 font-medium text-right">Estimasi Nilai</th>
                      <th className="px-5 py-3 font-medium text-right pr-6">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRooms.length > 0 ? (
                      filteredRooms.map((room) => {
                        const roomAssets = assets.filter((a) => a.ruanganId && a.ruanganId.includes(room.id));
                        const totalUnits = roomAssets.reduce((sum, a) => sum + getAssetConditionBreakdown(a).total, 0);
                        const totalValue = roomAssets.reduce((sum, a) => sum + ((a.harga || 0) * getAssetConditionBreakdown(a).total), 0);
                        const damagedUnits = roomAssets.reduce((sum, a) => {
                          const bd = getAssetConditionBreakdown(a);
                          return sum + bd.rusakRingan + bd.rusakBerat;
                        }, 0);

                        return (
                          <tr key={room.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-4">
                              <input 
                                type="checkbox" 
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" 
                                checked={selectedIds.includes(room.id)} 
                                onChange={() => toggleSelect(room.id)} 
                              />
                            </td>
                            <td className="px-5 py-4 text-slate-700">
                              <div className="font-mono font-semibold text-slate-900">{room.kodeRuangan}</div>
                              <span className="text-[11px] bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded font-medium">
                                {room.jenis}
                              </span>
                            </td>
                            <td className="px-5 py-4 font-semibold text-slate-900">
                              {room.nama}
                              {room.kondisi && (
                                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded font-normal ${
                                  room.kondisi === "Baik" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                }`}>
                                  {room.kondisi}
                                </span>
                              )}
                            </td>
                            {/* NEW: Bangunan & Lantai Column */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5 max-w-[240px]">
                                <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                                <div className="truncate">
                                  <div className="font-medium text-slate-800 text-xs truncate" title={room.bangunan || "Belum Ditentukan"}>
                                    {room.bangunan || "Gedung Belum Diatur"}
                                  </div>
                                  <span className="text-[10px] text-slate-500 font-semibold">
                                    {room.lantai || "Lantai 1"} {room.tahunBangunan ? `• Thn ${room.tahunBangunan}` : ''}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-slate-700">
                              <div className="font-medium text-slate-800 text-xs">{room.penanggungJawab}</div>
                              {room.nipPenanggungJawab && (
                                <div className="text-[10px] text-slate-500 font-mono">NIP: {room.nipPenanggungJawab}</div>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="font-semibold text-slate-800 text-xs">{room.kapasitas} orang</div>
                              <div className="text-[11px] text-slate-500">{room.luas ? `${room.luas} m²` : '-'}</div>
                            </td>
                            <td className="px-5 py-4 text-right font-bold text-primary-600">
                              <div>{totalUnits} unit</div>
                              <div className="text-[10px] text-slate-500 font-normal">({roomAssets.length} judul)</div>
                              {damagedUnits > 0 && (
                                <div className="text-[10px] font-bold text-rose-600 mt-0.5">⚠️ {damagedUnits} rusak</div>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right font-medium text-slate-900">
                              Rp {totalValue.toLocaleString("id-ID")}
                            </td>
                            <td className="px-5 py-4 text-right pr-6">
                              <RowActions actions={[
                                { label: "Lihat Dokumen KIR", icon: LayoutGrid, onClick: () => { setSelectedRoomId(room.id); setIsRoomAssetsModalOpen(true); } },
                                { label: "Edit Ruangan", icon: Edit, onClick: () => openEditRoomModal(room) },
                                { label: "Hapus", icon: Trash2, variant: "destructive", onClick: () => openDeleteModal(room.id, room.nama) }
                              ]} />
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-6 py-16 text-center text-slate-700">
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
            </CardContent>
          </Card>
        </div>
      )}

      {/* FORM MODAL WITH BUILDING SELECTION */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedRoomId ? "Edit Data Ruangan & Bangunan" : "Tambah Ruangan & Asosiasi Bangunan"}
        onSubmit={handleSave}
      >
        <div className="grid gap-4 max-h-[75vh] overflow-y-auto px-1">
          {/* Section: Identitas Ruangan */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <DoorClosed className="w-3.5 h-3.5 text-primary-600" />
              Identitas Ruangan
            </h4>
            <div className="grid gap-3">
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-800">Nama Ruangan</label>
                <input 
                  name="nama" 
                  required 
                  defaultValue={selectedRoom?.nama || ''} 
                  type="text" 
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none bg-white" 
                  placeholder="Contoh: Ruang Kelas VII-A" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-slate-800">Kode Ruangan</label>
                  <input 
                    name="kodeRuangan" 
                    required 
                    defaultValue={selectedRoom?.kodeRuangan || ''} 
                    type="text" 
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none bg-white font-mono" 
                    placeholder="Contoh: R-VII-A" 
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-slate-800">Jenis Ruangan</label>
                  <select 
                    name="jenis" 
                    defaultValue={selectedRoom?.jenis || 'Kelas'} 
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none bg-white"
                  >
                    <option value="Kelas">Kelas</option>
                    <option value="Laboratorium">Laboratorium</option>
                    <option value="Kantor">Kantor</option>
                    <option value="Perpustakaan">Perpustakaan</option>
                    <option value="Gudang">Gudang</option>
                    <option value="Fasilitas Umum">Fasilitas Umum</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Data Bangunan / Gedung */}
          <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-700" />
              Data Bangunan & Gedung Induk (KIB C)
            </h4>
            
            <div className="grid gap-3">
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                  <span>Pilih Bangunan / Gedung</span>
                  <span className="text-[10px] text-amber-700 font-normal">Tersinkron dengan KIB C</span>
                </label>
                <select
                  value={formBuildingOption}
                  onChange={(e) => handleBuildingOptionChange(e.target.value)}
                  className="border border-amber-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none bg-white font-medium text-slate-900"
                >
                  <optgroup label="Master KIB C (Gedung & Bangunan)">
                    {kibCAssets.map((kib) => (
                      <option key={kib.id} value={`KIBC:${kib.id}`}>
                        🏛️ {kib.nama} ({kib.kodeBarang})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Gedung Lainnya yang Terdaftar">
                    {buildingSummaryList
                      .filter(b => !kibCAssets.some(k => k.nama === b.nama) && b.nama !== "Gedung Belum Ditentukan")
                      .map((b, i) => (
                        <option key={i} value={b.nama}>
                          🏢 {b.nama}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Kustom">
                    <option value="__CUSTOM__">➕ Ketik Nama Bangunan Baru / Manual</option>
                  </optgroup>
                </select>
              </div>

              {formBuildingOption === "__CUSTOM__" && (
                <div className="grid gap-1 animate-in fade-in duration-200">
                  <label className="text-xs font-semibold text-slate-800">Nama Gedung / Bangunan Baru</label>
                  <input
                    name="customBangunanText"
                    value={formCustomBuilding}
                    onChange={(e) => setFormCustomBuilding(e.target.value)}
                    type="text"
                    required
                    className="border border-amber-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none bg-white"
                    placeholder="Contoh: Gedung Laboratorium Terpadu Baru"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-slate-800">Posisi Lantai / Tingkat</label>
                  <select
                    name="lantai"
                    value={formLantai}
                    onChange={(e) => setFormLantai(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none bg-white"
                  >
                    <option value="Lantai 1">Lantai 1</option>
                    <option value="Lantai 2">Lantai 2</option>
                    <option value="Lantai 3">Lantai 3</option>
                    <option value="Lantai Dasar">Lantai Dasar</option>
                    <option value="Semi-Basement">Semi-Basement</option>
                    <option value="Rooftop / Atap">Rooftop / Atap</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-slate-800">Tahun Pembangunan</label>
                  <input
                    name="tahunBangunan"
                    value={formTahun}
                    onChange={(e) => setFormTahun(e.target.value)}
                    type="number"
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none bg-white"
                    placeholder="Contoh: 2018"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Dimensi Fisik & Kapasitas */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-primary-600" />
              Dimensi & Kapasitas
            </h4>
            
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="grid gap-1">
                <label className="text-[11px] font-semibold text-slate-700">Panjang (m)</label>
                <input 
                  name="panjang" 
                  value={formPanjang}
                  onChange={(e) => handlePanjangChange(e.target.value)}
                  type="number" 
                  step="0.01" 
                  className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:border-primary-500 outline-none bg-white" 
                  placeholder="0" 
                />
              </div>
              <div className="grid gap-1">
                <label className="text-[11px] font-semibold text-slate-700">Lebar (m)</label>
                <input 
                  name="lebar" 
                  value={formLebar}
                  onChange={(e) => handleLebarChange(e.target.value)}
                  type="number" 
                  step="0.01" 
                  className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:border-primary-500 outline-none bg-white" 
                  placeholder="0" 
                />
              </div>
              <div className="grid gap-1">
                <label className="text-[11px] font-semibold text-slate-700">Tinggi (m)</label>
                <input 
                  name="tinggi" 
                  defaultValue={selectedRoom?.tinggi || ''} 
                  type="number" 
                  step="0.01" 
                  className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:border-primary-500 outline-none bg-white" 
                  placeholder="0" 
                />
              </div>
              <div className="grid gap-1">
                <label className="text-[11px] font-semibold text-slate-700">Luas (m²)</label>
                <input 
                  name="luas" 
                  value={formLuas}
                  onChange={(e) => setFormLuas(e.target.value)}
                  type="number" 
                  step="0.01" 
                  className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary-700 focus:border-primary-500 outline-none bg-white" 
                  placeholder="0" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-800">Kapasitas (Orang)</label>
                <input 
                  name="kapasitas" 
                  required 
                  defaultValue={selectedRoom?.kapasitas || 30} 
                  type="number" 
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none bg-white" 
                  placeholder="Contoh: 32" 
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-800">Kondisi Ruangan</label>
                <select 
                  name="kondisi" 
                  defaultValue={selectedRoom?.kondisi || 'Baik'} 
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none bg-white"
                >
                  <option value="Baik">Baik</option>
                  <option value="Rusak Ringan">Rusak Ringan</option>
                  <option value="Rusak Berat">Rusak Berat</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Penanggung Jawab */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary-600" />
              Penanggung Jawab Ruangan (Wali Kelas / Kepala Lab / Staf)
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-800">Nama Penanggung Jawab</label>
                <input 
                  name="penanggungJawab" 
                  required 
                  defaultValue={selectedRoom?.penanggungJawab || ''} 
                  type="text" 
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none bg-white" 
                  placeholder="Nama Guru / Staf" 
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-800">NIP (Opsional)</label>
                <input 
                  name="nipPenanggungJawab" 
                  defaultValue={selectedRoom?.nipPenanggungJawab || ''} 
                  type="text" 
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary-500 outline-none bg-white font-mono" 
                  placeholder="19800101..." 
                />
              </div>
            </div>
          </div>
        </div>
      </FormModal>

      <PrintBarcodesModal 
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        assets={filteredRooms.map(r => ({
          ...r,
          kodeBarang: r.kodeRuangan,
          nomorRegister: r.jenis
        }) as any)}
      />

      <PrintSchoolLabelsModal 
        isOpen={isPrintSchoolModalOpen}
        onClose={() => setIsPrintSchoolModalOpen(false)}
        assets={filteredRooms.map(r => ({
          ...r,
          kodeBarang: r.kodeRuangan,
          nomorRegister: r.jenis
        }) as any)}
      />

      <RoomAssetsModal
        isOpen={isRoomAssetsModalOpen}
        onClose={() => setIsRoomAssetsModalOpen(false)}
        room={selectedRoom || null}
        assets={assets.filter(a => selectedRoomId && a.ruanganId && a.ruanganId.includes(selectedRoomId))}
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
