import React, { useState, useEffect } from "react";
import {
  HardDrive,
  Cloud,
  RefreshCw,
  Upload,
  Download,
  FileSpreadsheet,
  History,
  Folder,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  LogOut,
  Sparkles,
  Link2,
  Copy,
  Layers,
  Database,
  ArrowRight,
  Plus,
  Server,
  Package,
  DoorClosed,
  Boxes,
  HelpCircle,
  FileCheck2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { useGoogleDrive } from "../../contexts/GoogleDriveContext";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { useToast } from "../../contexts/ToastContext";

export function DatabaseSettingsTab() {
  const toast = useToast();
  const dataContext = useData();
  const { user: googleUser } = useAuth();
  const {
    isConnected: isDriveConnected,
    isConnecting: isDriveConnecting,
    isSyncing: isDriveSyncing,
    lastSyncedAt: driveLastSyncedAt,
    syncError: driveSyncError,
    folderInfo: driveFolderInfo,
    dbFileInfo: driveDbFileInfo,
    targetFolderId,
    targetFolderUrl,
    setTargetFolder,
    resetTargetFolder,
    snapshots: driveSnapshots,
    autoSync: driveAutoSync,
    setAutoSync: setDriveAutoSync,
    connectDrive,
    disconnectDrive: driveDisconnect,
    syncNow: driveSyncNow,
    pullFromDrive: drivePullFromDrive,
    createSnapshotBackup: driveCreateSnapshot,
    restoreSnapshotById: driveRestoreSnapshot,
    exportToSheets: driveExportToSheets,
    loadSnapshots: driveLoadSnapshots,
  } = useGoogleDrive();

  const [showDriveDisconnectConfirm, setShowDriveDisconnectConfirm] = useState(false);
  const [isEditingFolder, setIsEditingFolder] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(targetFolderUrl);
  const [snapshotNote, setSnapshotNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);

  useEffect(() => {
    setCustomUrlInput(targetFolderUrl);
  }, [targetFolderUrl]);

  useEffect(() => {
    if (isDriveConnected) {
      driveLoadSnapshots();
    }
  }, [isDriveConnected, driveLoadSnapshots]);

  const executeDriveAction = async (action: () => Promise<any> | void) => {
    if (!isDriveConnected) {
      const success = await connectDrive(false);
      if (success) {
        action();
      }
      return;
    }
    action();
  };

  const handleBackupJson = () => {
    const fullData = dataContext.getFullDatabase();
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", "backup_sarpras_" + new Date().toISOString().slice(0, 10) + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
    toast("File backup JSON berhasil diunduh ke komputer Anda.", "success");
  };

  const handleRestoreJson = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const content = event.target?.result as string;
            const validation = dataContext.validateDatabaseBackup(content);
            if (!validation.valid) {
              toast(`Integritas Cadangan Gagal: ${validation.error}`, "error");
              return;
            }
            const parsed = JSON.parse(content);
            dataContext.importFullDatabase(parsed);
            toast(`Database berhasil diverifikasi & dipulihkan (${validation.summary?.assetCount || 0} aset, ${validation.summary?.roomCount || 0} ruangan)!`, "success");
          } catch (err: any) {
            toast(`File backup tidak valid: ${err.message}`, "error");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleSaveTargetFolder = async () => {
    if (!customUrlInput.trim()) return;
    await setTargetFolder(customUrlInput.trim());
    setIsEditingFolder(false);
  };

  const handleResetFolder = async () => {
    await resetTargetFolder();
    setCustomUrlInput(targetFolderUrl);
    setIsEditingFolder(false);
  };

  const handleCreateSnapshot = async () => {
    await driveCreateSnapshot(snapshotNote.trim() || undefined);
    setSnapshotNote("");
    setShowNoteInput(false);
  };

  const handleConfirmRestore = async (fileId: string) => {
    await driveRestoreSnapshot(fileId);
    setConfirmRestoreId(null);
  };

  // Quick stats from live data
  const totalAssets = dataContext.assets?.length || 0;
  const totalRooms = dataContext.rooms?.length || 0;
  const totalConsumables = dataContext.consumables?.length || 0;
  const totalBorrowings = dataContext.borrowings?.length || 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 1. HERO BANNER: ELEGAN, FUTURISTIK & DETAIL */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 shadow-2xl text-white">
        {/* Glow & Grid Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0596690a_1px,transparent_1px),linear-gradient(to_bottom,#0596690a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-8 space-y-6">
          {/* Header Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3.5 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl border border-emerald-300/30 shadow-[0_0_25px_rgba(16,185,129,0.35)] shrink-0">
                <HardDrive className="h-8 w-8 text-white animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                    Master Cloud Database
                    <Sparkles className="h-4 w-4 text-emerald-300" />
                  </h3>
                  <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded-full">
                    Arsitektur Terpusat Google Drive
                  </span>
                </div>
                <p className="text-emerald-100/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  Penyimpanan basis data resmi SIM Sarpras SMP. Berkas master (<code className="text-emerald-300 font-mono font-semibold">sim_sarpras_db.json</code>)
                  tersimpan aman di Google Drive sekolah dengan sinkronisasi instan, arsip snapshot bertanggal, dan ekspor spreadsheet.
                </p>
              </div>
            </div>

            {/* Auth Actions */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              {isDriveConnected ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => connectDrive(true)}
                    disabled={isDriveConnecting || isDriveSyncing}
                    className="h-9 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-sm"
                    title="Ganti akun Google Drive"
                  >
                    <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                    Ganti Akun
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowDriveDisconnectConfirm(true)}
                    disabled={isDriveConnecting || isDriveSyncing}
                    className="h-9 text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border-rose-400/30 shadow-sm"
                    title="Lepas koneksi Google Drive"
                  >
                    <LogOut className="h-3.5 w-3.5 mr-1.5" />
                    Putuskan
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => connectDrive(false)}
                  disabled={isDriveConnecting}
                  className="h-10 px-5 text-xs bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black shadow-[0_0_20px_rgba(52,211,153,0.4)] transition-all active:scale-95"
                >
                  {isDriveConnecting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin text-slate-950" />
                      Menghubungkan Otorisasi...
                    </>
                  ) : (
                    <>
                      <Cloud className="h-4 w-4 mr-2 text-slate-950" />
                      Hubungkan Google Drive Sekolah
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Disconnect Alert */}
          {showDriveDisconnectConfirm && (
            <div className="p-3.5 rounded-xl bg-rose-950/90 border border-rose-400/50 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-rose-100 animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-300 shrink-0" />
                <span>
                  Putuskan sambungan Google Drive dari aplikasi? Data aset yang sudah ada di perangkat dan cloud tetap utuh.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    driveDisconnect();
                    setShowDriveDisconnectConfirm(false);
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-sm transition-colors"
                >
                  Ya, Putuskan
                </button>
                <button
                  onClick={() => setShowDriveDisconnectConfirm(false)}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold text-xs transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* Status Bar Chips */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                {isDriveConnected ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  </>
                ) : isDriveConnecting ? (
                  <RefreshCw className="h-3.5 w-3.5 text-amber-300 animate-spin" />
                ) : (
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-slate-500" />
                )}
              </span>
              <div>
                <p className="font-bold text-white text-xs sm:text-sm">
                  {isDriveConnected
                    ? "Status: Terhubung & Aktif"
                    : isDriveConnecting
                    ? "Status: Sedang Memvalidasi Izin Otorisasi..."
                    : "Status: Belum Terhubung"}
                </p>
                <p className="text-emerald-100/70 text-[11px]">
                  {isDriveConnected
                    ? `Akun Cloud: ${googleUser?.email || "Google Account Terhubung"}`
                    : "Klik 'Hubungkan Google Drive' untuk mengaktifkan sinkronisasi cloud real-time"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap text-emerald-200 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 border border-white/10">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                <span>
                  {driveLastSyncedAt
                    ? `Sinkron Terakhir: ${driveLastSyncedAt.toLocaleTimeString("id-ID")}`
                    : isDriveConnected
                    ? "Siap disinkronkan"
                    : "Offline"}
                </span>
              </div>
              <a
                href={driveFolderInfo?.webViewLink || targetFolderUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-semibold transition-all"
              >
                <Folder className="h-3.5 w-3.5 text-amber-300" />
                Buka Folder Drive <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Error Notice Banner if any */}
      {driveSyncError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-800 dark:text-rose-200 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-bold">Pemberitahuan Sinkronisasi Cloud:</p>
              <p className="mt-0.5 text-rose-700 dark:text-rose-300 leading-relaxed">{driveSyncError}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => connectDrive(true)}
            disabled={isDriveConnecting}
            className="self-start sm:self-auto h-8 text-xs border-rose-300 text-rose-800 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/40 shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Perbarui Otorisasi
          </Button>
        </div>
      )}

      {/* 2. STATISTIK DATA REALTIME SISTEM */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
            <Package className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Aset</p>
            <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">{totalAssets} Unit</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
            <DoorClosed className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ruang & Gedung</p>
            <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">{totalRooms} Lokasi</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0">
            <Boxes className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Barang Habis Pakai</p>
            <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">{totalConsumables} Item</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 shrink-0">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Peminjaman</p>
            <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">{totalBorrowings} Transaksi</p>
          </div>
        </div>
      </div>

      {/* 3. DIREKTORI TARGET FOLDER & FILE MASTER JSON */}
      <div className="p-4 sm:p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-slate-50/40 dark:from-emerald-950/20 dark:via-slate-900/40 dark:to-slate-900/60 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shrink-0">
              <Folder className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Direktori Target Basis Data Google Drive
                </h4>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 rounded-md">
                  Shared Folder Sekolah
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Seluruh berkas database master, arsip snapshot, dan ekspor spreadsheet diarahkan ke folder ini.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            <a
              href={driveFolderInfo?.webViewLink || targetFolderUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Buka di Drive
            </a>
            <button
              onClick={() => {
                setIsEditingFolder(!isEditingFolder);
                setCustomUrlInput(targetFolderUrl);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
            >
              {isEditingFolder ? "Tutup" : "Ubah Folder Target"}
            </button>
          </div>
        </div>

        {/* URL Target & ID */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-900/60 text-xs font-mono text-slate-800 dark:text-slate-200">
          <Link2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="truncate flex-1 font-semibold" title={driveFolderInfo?.webViewLink || targetFolderUrl}>
            {driveFolderInfo?.webViewLink || targetFolderUrl}
          </span>
          <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 shrink-0">
            ID: {targetFolderId}
          </span>
        </div>

        {/* Edit Target Form */}
        {isEditingFolder && (
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-300 dark:border-emerald-700 space-y-2 animate-in fade-in duration-150">
            <label className="text-xs font-bold text-slate-900 dark:text-white">
              Masukkan URL Folder Google Drive Baru atau Folder ID:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="flex-1 px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSaveTargetFolder} className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap">
                  Simpan Folder
                </Button>
                <Button size="sm" variant="outline" onClick={handleResetFolder} className="text-xs h-9 whitespace-nowrap">
                  Reset Default
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Default Shared Folder Sekolah: <code className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">1fqjFnsuAU4WH7I5AkEomZ6JA-a3Fi_5d</code>
            </p>
          </div>
        )}

        {/* Master File Card Info */}
        <div className="p-3.5 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <FileText className="h-4 w-4 text-teal-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                File Master: <span className="font-mono text-teal-700 dark:text-teal-400">{driveDbFileInfo ? driveDbFileInfo.name : "sim_sarpras_db.json"}</span>
              </p>
              <p className="text-[11px] text-slate-500">
                {driveDbFileInfo?.size
                  ? `Ukuran berkas: ${(parseInt(driveDbFileInfo.size) / 1024).toFixed(1)} KB`
                  : "Berkas pusat JSON yang menyatukan seluruh mutasi dan data sarpras"}
              </p>
            </div>
          </div>
          {driveDbFileInfo && (
            <a
              href={driveDbFileInfo.webViewLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
            >
              Buka File Master di Drive <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* 4. PERINTAH OPERASIONAL UTAMA: 4 KARTU AKSI ELEGAN */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-emerald-600" />
            Operasi Sinkronisasi & Ekspor Google Drive
          </h4>
          {!isDriveConnected && (
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Link2 className="h-3 w-3" />
              Klik kartu untuk menghubungkan & mengeksekusi otomatis
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Sinkronkan Sekarang */}
          <Card className="border border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/70 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10 hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm">
                  <Upload className={`h-4 w-4 ${isDriveSyncing ? "animate-bounce" : ""}`} />
                </div>
                Sinkronkan ke Google Drive
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Unggah seluruh perubahan data aset, inventaris ruangan, peminjaman, dan riwayat mutasi ke berkas master Google Drive.
              </p>
              <Button
                onClick={() => executeDriveAction(() => driveSyncNow())}
                disabled={isDriveSyncing || isDriveConnecting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 shadow-sm"
              >
                <Upload className="h-3.5 w-3.5 mr-2" />
                {isDriveSyncing ? "Menyinkronkan ke Cloud..." : "Sinkronkan Sekarang"}
              </Button>
            </CardContent>
          </Card>

          {/* Tarik Data dari Drive */}
          <Card className="border border-cyan-200 dark:border-cyan-900/60 bg-gradient-to-br from-cyan-50/70 to-blue-50/30 dark:from-cyan-950/20 dark:to-blue-950/10 hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-600 text-white shadow-sm">
                  <Download className={`h-4 w-4 ${isDriveSyncing ? "animate-bounce" : ""}`} />
                </div>
                Tarik Data dari Drive
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Unduh dan terapkan data terbaru yang telah diinput oleh operator lain dari file master Google Drive sekolah.
              </p>
              <Button
                variant="outline"
                onClick={() => executeDriveAction(() => drivePullFromDrive())}
                disabled={isDriveSyncing || isDriveConnecting}
                className="w-full border-cyan-300 text-cyan-800 dark:text-cyan-300 hover:bg-cyan-100/60 dark:hover:bg-cyan-950/40 text-xs h-9"
              >
                <Download className="h-3.5 w-3.5 mr-2 text-cyan-600" />
                Tarik Data Terbaru
              </Button>
            </CardContent>
          </Card>

          {/* Buat Snapshot Cadangan */}
          <Card className="border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/70 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/10 hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
                  <History className="h-4 w-4" />
                </div>
                Buat Snapshot Cadangan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Buat salinan arsip bertanggal permanen di Google Drive sebelum audit semester atau pembaruan inventaris massal.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  if (!isDriveConnected) {
                    executeDriveAction(() => setShowNoteInput(true));
                  } else {
                    setShowNoteInput(!showNoteInput);
                  }
                }}
                disabled={isDriveSyncing || isDriveConnecting}
                className="w-full border-indigo-300 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100/60 dark:hover:bg-indigo-950/40 text-xs h-9"
              >
                <History className="h-3.5 w-3.5 mr-2 text-indigo-600" />
                Buat Snapshot Bertanggal
              </Button>
            </CardContent>
          </Card>

          {/* Ekspor ke Google Sheets */}
          <Card className="border border-teal-200 dark:border-teal-900/60 bg-gradient-to-br from-teal-50/70 to-emerald-50/30 dark:from-teal-950/20 dark:to-emerald-950/10 hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-600 text-white shadow-sm">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                Ekspor ke Google Sheets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Hasilkan spreadsheet otomatis di Google Drive berisi tabulasi KIB A-E, daftar ruangan, dan buku peminjaman.
              </p>
              <Button
                variant="outline"
                onClick={() =>
                  executeDriveAction(async () => {
                    const url = await driveExportToSheets();
                    if (url) window.open(url, "_blank");
                  })
                }
                disabled={isDriveSyncing || isDriveConnecting}
                className="w-full border-teal-300 text-teal-800 dark:text-teal-300 hover:bg-teal-100/60 dark:hover:bg-teal-950/40 text-xs h-9"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 mr-2 text-teal-600" />
                Buat File Spreadsheet
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Form Input Catatan Snapshot */}
        {showNoteInput && (
          <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/30 flex flex-col sm:flex-row gap-2.5 items-center animate-in fade-in">
            <input
              type="text"
              placeholder="Catatan arsip (misal: 'Audit Sarpras Awal Semester Genap 2026')..."
              value={snapshotNote}
              onChange={(e) => setSnapshotNote(e.target.value)}
              className="w-full sm:flex-1 text-xs px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <Button size="sm" onClick={handleCreateSnapshot} disabled={isDriveSyncing} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-xs h-8">
                Simpan Snapshot
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowNoteInput(false)} className="text-xs h-8">
                Batal
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 5. AUTO-SYNC TOGGLE REALTIME */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Sinkronisasi Otomatis Real-time (Auto-Sync)
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Sistem secara otomatis mengunggah pembaruan inventaris ke Google Drive di latar belakang setiap kali data ditambahkan,
            diubah, atau dihapus tanpa perlu menekan tombol sinkronisasi manual.
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={driveAutoSync}
            onChange={(e) => setDriveAutoSync(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
      </div>

      {/* 6. RIWAYAT SNAPSHOT CADANGAN DI GOOGLE DRIVE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <History className="h-4 w-4 text-indigo-600" />
            Daftar Snapshot Cadangan di Google Drive ({driveSnapshots.length})
          </h4>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNoteInput(!showNoteInput)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Tambah Snapshot
            </button>
            {isDriveConnected && (
              <button
                onClick={() => driveLoadSnapshots()}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium flex items-center gap-1 ml-2"
              >
                <RefreshCw className="h-3 w-3" /> Segarkan
              </button>
            )}
          </div>
        </div>

        {driveSnapshots.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-500 space-y-1">
            <p className="font-bold text-slate-700 dark:text-slate-300">
              {isDriveConnected ? "Belum ada snapshot cadangan bertanggal." : "Google Drive belum tersambung."}
            </p>
            <p className="text-[11px] text-slate-500">
              {isDriveConnected
                ? "Gunakan tombol 'Buat Snapshot Cadangan' untuk mengarsipkan database sekolah secara berkala."
                : "Hubungkan Google Drive untuk memantau dan memulihkan arsip berkas."}
            </p>
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 shadow-sm">
            {driveSnapshots.map((snap) => (
              <div
                key={snap.id}
                className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="font-bold text-slate-900 dark:text-white break-words">{snap.name}</p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                    <span>{new Date(snap.timestamp).toLocaleString("id-ID")}</span>
                    <span>•</span>
                    <span>{(snap.sizeBytes / 1024).toFixed(1)} KB</span>
                    {snap.note && (
                      <>
                        <span>•</span>
                        <span className="italic text-slate-600 dark:text-slate-400">{snap.note}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={snap.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Lihat di Google Drive"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  {confirmRestoreId === snap.id ? (
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-[11px] px-2.5 bg-rose-600 hover:bg-rose-700"
                        onClick={() => handleConfirmRestore(snap.id)}
                        disabled={isDriveSyncing}
                      >
                        Yakin Pulihkan?
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] px-2"
                        onClick={() => setConfirmRestoreId(null)}
                      >
                        Batal
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] px-3 text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-600"
                      onClick={() => setConfirmRestoreId(snap.id)}
                      disabled={isDriveSyncing}
                    >
                      <Download className="h-3 w-3 mr-1 text-emerald-600" />
                      Pulihkan
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. CADANGAN BERKAS LOKAL (OFFLINE JSON FALLBACK) */}
      <div className="pt-2 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Cadangan Berkas Lokal (Komputer / Laptop)
        </h4>
        <div className="grid sm:grid-cols-2 gap-3.5">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Download className="h-4 w-4 text-primary-600" />
                Unduh Berkas JSON Lokal
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Simpan berkas cadangan mandiri ke penyimpanan laptop/komputer dalam format file JSON offline.
              </p>
              <Button variant="outline" className="w-full text-xs h-9" onClick={handleBackupJson}>
                <Download className="h-3.5 w-3.5 mr-2 text-primary-600" />
                Unduh File JSON Sekarang
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <Upload className="h-4 w-4 text-rose-500" />
                Pulihkan dari Berkas JSON
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Pulihkan seluruh database sarpras sekolah dari file cadangan JSON lokal yang telah diunduh sebelumnya.
              </p>
              <Button
                variant="outline"
                className="w-full text-xs h-9 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                onClick={handleRestoreJson}
              >
                <Upload className="h-3.5 w-3.5 mr-2 text-rose-500" />
                Pilih File JSON Lokal
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 8. PANDUAN ONLINE HOSTING (VERCEL + GOOGLE DRIVE) */}
      <Card className="border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-slate-50/50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-slate-900/40 shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="pb-3 border-b border-indigo-100 dark:border-indigo-900/40">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
              <Server className="h-4 w-4 text-indigo-600" />
              Panduan Deployment Online (Vercel & Google Drive)
            </CardTitle>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
              Arsitektur Cloud Siap Pakai
            </span>
          </div>
          <CardDescription className="text-xs text-indigo-800/80 dark:text-indigo-300/80">
            Aplikasi dapat diakses oleh dewan guru dan operator dari mana pun melalui tautan online, sementara basis data tetap terpusat di Google Drive sekolah.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 text-xs text-slate-700 dark:text-slate-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900/40 shadow-sm space-y-1">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px]">
                1
              </span>
              <p className="font-bold text-slate-900 dark:text-white">Push ke GitHub & Vercel</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Konfigurasi <code>vercel.json</code> telah siap. Import repository ke Vercel dengan perintah build standar: <code>npm run build</code>.
              </p>
            </div>
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900/40 shadow-sm space-y-1">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px]">
                2
              </span>
              <p className="font-bold text-slate-900 dark:text-white">Daftarkan Domain Vercel</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tambahkan URL domain Vercel Anda ke Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains.
              </p>
            </div>
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900/40 shadow-sm space-y-1">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px]">
                3
              </span>
              <p className="font-bold text-slate-900 dark:text-white">Hubungkan Google Drive</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Login via akun admin lalu klik &quot;Hubungkan Google Drive&quot;. File <code>sim_sarpras_db.json</code> langsung menjadi sumber data bersama.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-indigo-200/80 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <ExternalLink className="h-4 w-4 text-indigo-600" />
                Firebase Console Authorized Domains
              </span>
              <p className="text-[11px] text-slate-500 font-mono">
                Project ID Aktif: <span className="font-bold text-indigo-600 dark:text-indigo-400">gen-lang-client-0313588070</span>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://console.firebase.google.com/project/gen-lang-client-0313588070/authentication/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Buka Pengaturan Domain
              </a>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800"
                onClick={() => {
                  navigator.clipboard.writeText(
                    "https://console.firebase.google.com/project/gen-lang-client-0313588070/authentication/settings"
                  );
                  toast("Link Firebase Console berhasil disalin ke clipboard!", "success");
                }}
              >
                <Copy className="h-3.5 w-3.5 mr-1" />
                Salin Link
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
