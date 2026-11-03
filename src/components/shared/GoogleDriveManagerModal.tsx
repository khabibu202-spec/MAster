import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Cloud,
  RefreshCw,
  Download,
  Upload,
  ExternalLink,
  Folder,
  FileText,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileSpreadsheet,
  UserCheck,
  X,
  History,
  CheckCircle2,
  HardDrive,
  LogOut,
  Sparkles,
  Link2,
  Layers,
  Plus
} from "lucide-react";
import { useGoogleDrive } from "../../contexts/GoogleDriveContext";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/Button";

interface GoogleDriveManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoogleDriveManagerModal({ isOpen, onClose }: GoogleDriveManagerModalProps) {
  const { user } = useAuth();
  const {
    isConnected,
    isConnecting,
    isSyncing,
    lastSyncedAt,
    syncError,
    folderInfo,
    dbFileInfo,
    targetFolderId,
    targetFolderUrl,
    setTargetFolder,
    resetTargetFolder,
    snapshots,
    autoSync,
    setAutoSync,
    connectDrive,
    disconnectDrive,
    syncNow,
    pullFromDrive,
    createSnapshotBackup,
    restoreSnapshotById,
    exportToSheets,
    loadSnapshots,
  } = useGoogleDrive();

  const [snapshotNote, setSnapshotNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [isEditingFolder, setIsEditingFolder] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(targetFolderUrl);

  useEffect(() => {
    setCustomUrlInput(targetFolderUrl);
  }, [targetFolderUrl]);

  useEffect(() => {
    if (isOpen && isConnected) {
      loadSnapshots();
    }
  }, [isOpen, isConnected, loadSnapshots]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleCreateSnapshot = async () => {
    await createSnapshotBackup(snapshotNote.trim() || undefined);
    setSnapshotNote("");
    setShowNoteInput(false);
  };

  const handleConfirmRestore = async (fileId: string) => {
    await restoreSnapshotById(fileId);
    setConfirmRestoreId(null);
  };

  const handleExecuteAction = async (action: () => Promise<any> | void) => {
    if (!isConnected) {
      const success = await connectDrive(false);
      if (success) {
        action();
      }
      return;
    }
    action();
  };

  const handleConfirmDisconnect = () => {
    disconnectDrive();
    setShowDisconnectConfirm(false);
  };

  const handleSaveTargetFolder = async () => {
    if (!customUrlInput.trim()) return;
    await setTargetFolder(customUrlInput.trim());
    setIsEditingFolder(false);
  };

  const handleResetTargetFolder = async () => {
    await resetTargetFolder();
    setCustomUrlInput(targetFolderUrl);
    setIsEditingFolder(false);
  };

  if (!isOpen) return null;

  // Use createPortal to mount directly to document.body, ensuring no parent overflow or backdrop-filter traps it
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true"
      />

      {/* Main Dialog Container */}
      <div className="relative w-full max-w-3xl max-h-[92vh] sm:max-h-[90vh] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900 z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* 1. HEADER (Fixed at top, never cut off) */}
        <div className="relative overflow-hidden px-4 py-3.5 sm:px-6 sm:py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white shrink-0">
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10 gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 sm:p-2.5 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 shadow-inner shrink-0">
                <HardDrive className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5 truncate">
                    Google Drive Master Database
                    <Sparkles className="h-3.5 w-3.5 text-emerald-300 animate-pulse shrink-0" />
                  </h2>
                  <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-emerald-400/30 text-emerald-100 border border-emerald-300/40 rounded-full shrink-0">
                    Cloud v3
                  </span>
                </div>
                <p className="text-emerald-100/90 text-[11px] sm:text-xs truncate">
                  Database sentral, sinkronisasi otomatis, dan arsip dokumen sekolah di Google Drive.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-black/15 hover:bg-black/30 text-white/90 hover:text-white transition-colors shrink-0"
              title="Tutup dialog"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          {/* Connection Status Banner */}
          <div className="mt-3 p-2.5 sm:p-3 rounded-xl bg-black/25 backdrop-blur-md border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="relative flex h-3 w-3 shrink-0">
                {isConnected ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
                  </>
                ) : isConnecting ? (
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400 animate-pulse" />
                ) : (
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                  {isConnected
                    ? "Tersambung ke Google Drive"
                    : isConnecting
                    ? "Sedang Menghubungkan ke Google..."
                    : "Google Drive Belum Tersambung"}
                </p>
                <p className="text-emerald-100/80 text-[10px] sm:text-[11px] truncate">
                  {isConnected
                    ? `Akun: ${user?.email || "Google Account Aktif"}`
                    : "Hubungkan akun Google (@belajar.id atau Gmail) sekolah untuk aktivasi Cloud Database."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0 flex-wrap">
              {isConnected ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => connectDrive(true)}
                    disabled={isConnecting || isSyncing}
                    className="h-7 text-[11px] bg-white/15 hover:bg-white/25 text-white border-white/30 whitespace-nowrap px-2.5"
                    title="Ganti akun Google yang tersambung"
                  >
                    <UserCheck className="h-3 w-3 mr-1" />
                    Ganti Akun
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowDisconnectConfirm(true)}
                    disabled={isConnecting || isSyncing}
                    className="h-7 text-[11px] bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 border-rose-400/40 whitespace-nowrap px-2.5"
                    title="Lepas sambungan Google Drive"
                  >
                    <LogOut className="h-3 w-3 mr-1" />
                    Putuskan
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => connectDrive(false)}
                  disabled={isConnecting}
                  className="h-8 px-3.5 text-xs bg-white hover:bg-emerald-50 text-emerald-950 font-bold shadow-md hover:shadow-lg transition-all active:scale-95 whitespace-nowrap"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin text-emerald-700" />
                      Menghubungkan...
                    </>
                  ) : (
                    <>
                      <Cloud className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                      Hubungkan Sekarang
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Disconnect confirmation dialog */}
          {showDisconnectConfirm && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-rose-950/85 border border-rose-400/50 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-rose-100 animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-300 shrink-0" />
                <span>Lepas sambungan Google Drive? Data lokal aplikasi tetap aman.</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleConfirmDisconnect}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-sm transition-colors"
                >
                  Ya, Putuskan
                </button>
                <button
                  onClick={() => setShowDisconnectConfirm(false)}
                  className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold text-xs transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2. SCROLLABLE BODY - ALL ELEMENTS DISPLAYED FULLY & VISIBLY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Sync Error Alert Banner */}
          {syncError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-rose-700 dark:text-rose-300 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Terjadi Kendala Koneksi:</p>
                  <p className="mt-0.5 text-rose-600 dark:text-rose-400">{syncError}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => connectDrive(true)}
                disabled={isConnecting}
                className="self-start sm:self-auto h-7 text-xs border-rose-300 text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/40 shrink-0"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Hubungkan Ulang
              </Button>
            </div>
          )}

          {/* Section 1: Cloud Info Cards (Target Folder & Master File) */}
          <div className="p-3.5 sm:p-4 rounded-xl border border-emerald-300 dark:border-emerald-800/70 bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-slate-50/60 dark:from-emerald-950/30 dark:via-slate-900/40 dark:to-slate-900/60 space-y-3 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm shrink-0">
                  <Folder className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                      Alamat Direktori Target Master Database
                    </h4>
                    <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 rounded-md">
                      Target Khusus
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    File master <code className="font-semibold text-emerald-700 dark:text-emerald-300">sim_sarpras_db.json</code>, arsip snapshot, dan spreadsheet langsung disimpan ke folder ini.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0 flex-wrap">
                <a
                  href={folderInfo?.webViewLink || targetFolderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
                  title="Buka folder langsung di Google Drive"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Buka Folder di Drive
                </a>
                <button
                  onClick={() => {
                    setIsEditingFolder(!isEditingFolder);
                    setCustomUrlInput(targetFolderUrl);
                  }}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                >
                  {isEditingFolder ? "Tutup" : "Ganti Folder"}
                </button>
              </div>
            </div>

            {/* URL Display */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900/90 rounded-lg border border-emerald-200 dark:border-emerald-900/60 text-xs font-mono text-slate-800 dark:text-slate-200">
              <Link2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="truncate flex-1 font-semibold" title={folderInfo?.webViewLink || targetFolderUrl}>
                {folderInfo?.webViewLink || targetFolderUrl}
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 shrink-0">
                ID: {targetFolderId}
              </span>
            </div>

            {/* Edit Target Folder Form */}
            {isEditingFolder && (
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-300 dark:border-emerald-700 space-y-2 animate-in fade-in duration-150">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Masukkan Link Folder Google Drive atau Folder ID:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      onClick={handleSaveTargetFolder}
                      className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap"
                    >
                      Terapkan Folder
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleResetTargetFolder}
                      className="text-xs h-8 whitespace-nowrap"
                      title="Reset ke folder default sekolah"
                    >
                      Reset Default
                    </Button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Folder tujuan default sekolah: <code className="text-emerald-600 dark:text-emerald-400 font-mono">1fqjFnsuAU4WH7I5AkEomZ6JA-a3Fi_5d</code>
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Status Folder Card */}
            <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0">
                  <Folder className="h-3.5 w-3.5 text-amber-500" />
                  Status Folder Google Drive
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isConnected ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>
                  {isConnected ? "Tersambung" : "Offline"}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 break-words">
                {folderInfo ? folderInfo.name : "Folder Database Khusus Sekolah"}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isConnected
                  ? "Direktori Google Drive terverifikasi dan siap menerima sinkronisasi."
                  : "Klik tombol Hubungkan Sekarang di atas untuk mengaktifkan koneksi ke folder ini."}
              </p>
            </div>

            {/* Master File Card */}
            <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0">
                  <FileText className="h-3.5 w-3.5 text-teal-600" />
                  File Database Master
                </span>
                {dbFileInfo && (
                  <a
                    href={dbFileInfo.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-600 hover:text-primary-700 hover:underline shrink-0"
                  >
                    Lihat File <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 break-words">
                {dbFileInfo ? dbFileInfo.name : "sim_sarpras_db.json"}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {lastSyncedAt ? `Sinkron: ${lastSyncedAt.toLocaleTimeString("id-ID")}` : isConnected ? "Siap disinkronkan" : "Menunggu koneksi"}
                </span>
                {dbFileInfo?.size && (
                  <span>{(parseInt(dbFileInfo.size) / 1024).toFixed(1)} KB</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: 4 Action Command Cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-emerald-600" />
                Perintah Operasional Database
              </h4>
              {!isConnected && (
                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  Klik kartu untuk menghubungkan & mengeksekusi
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Sync Now */}
              <button
                onClick={() => handleExecuteAction(() => syncNow())}
                disabled={isSyncing || isConnecting}
                className="group p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 text-left transition-all active:scale-[0.99] flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-emerald-500 text-white shadow-sm group-hover:scale-105 transition-transform shrink-0">
                  <Upload className={`h-4 w-4 ${isSyncing ? "animate-bounce" : ""}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    Sinkronkan Sekarang
                    {isSyncing && <RefreshCw className="h-3 w-3 animate-spin text-emerald-600" />}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Unggah seluruh data aset dan ruangan saat ini langsung ke file master Google Drive.
                  </p>
                </div>
              </button>

              {/* Pull from Drive */}
              <button
                onClick={() => handleExecuteAction(() => pullFromDrive())}
                disabled={isSyncing || isConnecting}
                className="group p-3 rounded-xl border border-cyan-200 dark:border-cyan-900/50 bg-cyan-50/50 dark:bg-cyan-950/20 hover:bg-cyan-100/50 dark:hover:bg-cyan-900/30 text-left transition-all active:scale-[0.99] flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-cyan-600 text-white shadow-sm group-hover:scale-105 transition-transform shrink-0">
                  <Download className={`h-4 w-4 ${isSyncing ? "animate-bounce" : ""}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                    Tarik Data dari Drive
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Muat database terbaru yang tersimpan di Google Drive jika ada perubahan dari perangkat lain.
                  </p>
                </div>
              </button>

              {/* Create Snapshot */}
              <button
                onClick={() => {
                  if (!isConnected) {
                    handleExecuteAction(() => setShowNoteInput(true));
                  } else {
                    setShowNoteInput(!showNoteInput);
                  }
                }}
                disabled={isSyncing || isConnecting}
                className="group p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 text-left transition-all active:scale-[0.99] flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-sm group-hover:scale-105 transition-transform shrink-0">
                  <History className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                    Buat Snapshot Cadangan
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Simpan salinan cadangan bertanggal (arsip permanen) di Google Drive sebelum modifikasi besar.
                  </p>
                </div>
              </button>

              {/* Export Sheets */}
              <button
                onClick={() => {
                  handleExecuteAction(async () => {
                    const url = await exportToSheets();
                    if (url) window.open(url, "_blank");
                  });
                }}
                disabled={isSyncing || isConnecting}
                className="group p-3 rounded-xl border border-teal-200 dark:border-teal-900/50 bg-teal-50/50 dark:bg-teal-950/20 hover:bg-teal-100/50 dark:hover:bg-teal-900/30 text-left transition-all active:scale-[0.99] flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-teal-600 text-white shadow-sm group-hover:scale-105 transition-transform shrink-0">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                    Ekspor ke Google Sheets
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Buat lembar spreadsheet otomatis berisi tabel KIB Aset, Ruangan, dan Peminjaman.
                  </p>
                </div>
              </button>
            </div>

            {/* Note input for snapshot creation */}
            {showNoteInput && (
              <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/40 dark:bg-indigo-950/30 flex flex-col sm:flex-row gap-2 items-center animate-in fade-in">
                <input
                  type="text"
                  placeholder="Catatan snapshot (misal: 'Audit Semester Genap 2026')..."
                  value={snapshotNote}
                  onChange={(e) => setSnapshotNote(e.target.value)}
                  className="w-full sm:flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <Button size="sm" onClick={handleCreateSnapshot} disabled={isSyncing} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-xs">
                    Simpan Snapshot
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowNoteInput(false)} className="text-xs">
                    Batal
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Auto Sync Toggle */}
          <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  Sinkronisasi Otomatis Real-time (Auto-Sync)
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Setiap kali Anda menambah atau memperbarui data aset, sistem otomatis mengunggah perubahan ke Google Drive di latar belakang.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Section 4: Snapshot History & Backups (Visible directly, no tabs required) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-indigo-600" />
                Daftar Snapshot Cadangan di Google Drive ({snapshots.length})
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNoteInput(!showNoteInput)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Tambah Cadangan
                </button>
                {isConnected && (
                  <button
                    onClick={() => loadSnapshots()}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 ml-2"
                  >
                    <RefreshCw className="h-3 w-3" /> Segarkan
                  </button>
                )}
              </div>
            </div>

            {snapshots.length === 0 ? (
              <div className="p-4 sm:p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  {isConnected
                    ? "Belum ada file snapshot cadangan yang dibuat."
                    : "Google Drive belum tersambung."}
                </p>
                <p className="text-[11px]">
                  {isConnected
                    ? "Klik tombol 'Buat Snapshot Cadangan' di atas untuk membuat arsip permanen bertanggal."
                    : "Hubungkan Google Drive untuk melihat dan mengelola riwayat cadangan arsip sekolah."}
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs divide-y divide-slate-100 dark:divide-slate-800 max-h-52 overflow-y-auto">
                {snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 break-words">
                        {snap.name}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                        <span>{new Date(snap.timestamp).toLocaleString("id-ID")}</span>
                        <span>•</span>
                        <span>{(snap.sizeBytes / 1024).toFixed(1)} KB</span>
                        {snap.note && (
                          <>
                            <span>•</span>
                            <span className="italic text-slate-600 dark:text-slate-400 break-words">
                              {snap.note}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={snap.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Lihat di Drive"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      {confirmRestoreId === snap.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-[11px] px-2 bg-rose-600 hover:bg-rose-700"
                            onClick={() => handleConfirmRestore(snap.id)}
                            disabled={isSyncing}
                          >
                            Yakin?
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
                          className="h-7 text-[11px] px-2.5 text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-600"
                          onClick={() => setConfirmRestoreId(snap.id)}
                          disabled={isSyncing}
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

        </div>

        {/* 3. FOOTER (Always visible at bottom, never cut off) */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-slate-50/95 dark:bg-slate-800/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="flex items-center gap-1.5 text-[11px] sm:text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">Data tersimpan aman di akun Google terisolasi sekolah Anda.</span>
          </span>
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 px-4 text-xs font-semibold shrink-0">
            Tutup
          </Button>
        </div>

      </div>
    </div>,
    document.body
  );
}
