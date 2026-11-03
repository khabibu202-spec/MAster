import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import {
  Building2,
  Users,
  Database,
  Globe,
  Bell,
  Shield,
  Download,
  Upload,
  Plus,
  Edit2,
  Trash2,
  HardDrive,
  Cloud,
  RefreshCw,
  FileSpreadsheet,
  ExternalLink,
  CheckCircle2,
  History,
  Folder,
  FileText,
  Clock,
  UserCheck,
  LogOut,
  AlertCircle,
  Copy,
  Wifi,
  Sun,
  Moon,
  Check
} from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import { useData } from "../contexts/DataContext";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useGoogleDrive } from "../contexts/GoogleDriveContext";
import { createGoogleSheetsBackup } from "../lib/googleSheets";
import { LocalServerConfig } from "../components/settings/LocalServerConfig";
import { DatabaseSettingsTab } from "../components/settings/DatabaseSettingsTab";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("sistem");
  const [isBackingUp, setIsBackingUp] = useState(false);
  const toast = useToast();
  const dataContext = useData();
  const { schoolProfile, setSchoolProfile } = dataContext;
  const { themeColor, setThemeColor, themeMode, setThemeMode, themeStyle, setThemeStyle, uiScale, setUiScale, fontColor, setFontColor } = useTheme();
  const { accessToken, loginWithGoogle, user: googleUser } = useAuth();

  
  const { isConnected: isDriveConnected } = useGoogleDrive();

  // Profil State mapped to Context
  const profil = schoolProfile;
  const setProfil = (newProfile: any) => {
    setSchoolProfile((prev: any) => ({...prev, ...newProfile}));
  };

  // Sistem State
  const [sistem, setSistem] = useState({
    bahasa: "id",
    zonaWaktu: "Asia/Jakarta",
    formatTanggal: "DD/MM/YYYY",
    itemPerHalaman: "10"
  });

  // Notif State
  const [notif, setNotif] = useState({
    emailAsetBaru: true,
    emailRusak: true,
    emailPinjam: false,
    waNotif: false,
    browserNotif: true
  });

  const tabs = [
    { id: "profil", name: "Profil Sekolah", icon: Building2 },
    { id: "users", name: "Pengguna & Akses", icon: Users },
    { id: "sistem", name: "Preferensi Sistem", icon: Globe },
    { id: "notif", name: "Notifikasi Cerdas", icon: Bell },
    { id: "backup", name: "Database & Google Drive", icon: HardDrive },
    { id: "keamanan", name: "Keamanan", icon: Shield },
    { id: "server_lokal", name: "Server Lokal (LAN Sekolah)", icon: Wifi },
  ];

  const handleAction = (msg: string, type: 'info'|'success'|'error' = 'info') => toast(msg, type);

  const saveProfil = () => {
    handleAction("Profil sekolah berhasil disimpan", "success");
  };

  const saveSistem = () => {
    handleAction("Preferensi sistem berhasil disimpan", "success");
  };

  const saveNotif = () => {
    handleAction("Pengaturan notifikasi berhasil disimpan", "success");
  };

  const saveKeamanan = () => {
    handleAction("Pengaturan keamanan berhasil diperbarui", "success");
  };

  const handleBackup = () => {
    const fullData = dataContext.getFullDatabase();
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", "backup_sarpras_" + new Date().toISOString().slice(0, 10) + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
    handleAction("File backup JSON berhasil diunduh.", "success");
  };

  const handleRestore = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const parsed = JSON.parse(event.target?.result as string);
            dataContext.importFullDatabase(parsed);
            handleAction("Data berhasil dipulihkan dari file backup lokal!", "success");
          } catch {
            handleAction("File backup tidak valid atau format rusak.", "error");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">Pengaturan Sistem</h2>
        <p className="text-slate-700">Konfigurasi menyeluruh aplikasi sarana dan prasarana.</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <Card className="w-full md:w-64 shrink-0 overflow-hidden border border-sky-200">
          <div className="p-2 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all ${activeTab === tab.id ? 'bg-sky-100 text-black font-extrabold border-l-4 border-sky-600 shadow-xs' : 'text-black font-semibold hover:bg-sky-50'}`}
              >
                <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-sky-700' : 'text-slate-800'}`} />
                {tab.name}
              </button>
            ))}
          </div>
        </Card>
        <div className="flex-1 w-full">
          <Card>
            <CardHeader className="border-b border-slate-300 bg-slate-50/50">
              <CardTitle className="text-lg">{tabs.find(t => t.id === activeTab)?.name}</CardTitle>
              <CardDescription>
                {activeTab === "profil" && "Informasi instansi yang akan dipakai pada kop laporan PDF / cetakan KIR."}
                {activeTab === "users" && "Kelola pengguna, operator, dan hak akses aplikasi."}
                {activeTab === "sistem" && "Pengaturan bahasa, waktu, dan preferensi tampilan."}
                {activeTab === "notif" && "Atur notifikasi kapan dan kemana akan dikirimkan."}
                {activeTab === "backup" && "Pusat kendali database terpusat Google Drive, arsip berkas bertanggal, dan ekspor spreadsheet."}
                {activeTab === "keamanan" && "Ubah kata sandi dan pengaturan keamanan akun."}
                {activeTab === "server_lokal" && "Konfigurasi server intranet mandiri untuk diakses seluruh komputer dan ponsel di jaringan Wi-Fi / LAN sekolah."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {activeTab === "profil" && (
                <div className="space-y-6 max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold text-slate-900">Nama Kementerian / Dinas Pelindung</label>
                      <input 
                        type="text" 
                        value={profil.kementerian}
                        onChange={(e) => setProfil({ kementerian: e.target.value })}
                        className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-900">Nama Sekolah</label>
                      <input 
                        type="text" 
                        value={profil.nama}
                        onChange={(e) => setProfil({ nama: e.target.value })}
                        className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-900">NPSN</label>
                      <input 
                        type="text" 
                        value={profil.npsn}
                        onChange={(e) => setProfil({ npsn: e.target.value })}
                        className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-900">Telepon</label>
                      <input 
                        type="text" 
                        value={profil.telepon}
                        onChange={(e) => setProfil({ telepon: e.target.value })}
                        className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-900">Email</label>
                      <input 
                        type="email" 
                        value={profil.email}
                        onChange={(e) => setProfil({ email: e.target.value })}
                        className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-900">Website</label>
                      <input 
                        type="text" 
                        value={profil.website}
                        onChange={(e) => setProfil({ website: e.target.value })}
                        className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-900">Kode Pos</label>
                      <input 
                        type="text" 
                        value={profil.kodePos}
                        onChange={(e) => setProfil({ kodePos: e.target.value })}
                        className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold text-slate-900">Alamat Lengkap</label>
                      <textarea 
                        value={profil.alamat}
                        onChange={(e) => setProfil({ alamat: e.target.value })}
                        className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm h-24 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all resize-none" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-900">Nama Kepala Sekolah</label>
                      <input 
                        type="text" 
                        value={profil.kepalaSekolah}
                        onChange={(e) => setProfil({ kepalaSekolah: e.target.value })}
                        className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-900">NIP Kepala Sekolah</label>
                      <input 
                        type="text" 
                        value={profil.nipKepsek}
                        onChange={(e) => setProfil({ nipKepsek: e.target.value })}
                        className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-900">Nama Operator / Sarpras</label>
                      <input 
                        type="text" 
                        value={profil.operator}
                        onChange={(e) => setProfil({ operator: e.target.value })}
                        className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-900">NIP Operator</label>
                      <input 
                        type="text" 
                        value={profil.nipOperator}
                        onChange={(e) => setProfil({ nipOperator: e.target.value })}
                        className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold text-slate-900">Logo Dinas (Kiri - Opsional)</label>
                      <div className="flex items-center gap-4">
                        {profil.logoDinas && (
                          <div className="w-16 h-16 flex items-center justify-center bg-transparent shrink-0">
                            <img src={profil.logoDinas} alt="Logo Dinas" className="w-full h-full object-contain" />
                          </div>
                        )}
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setProfil({ ...profil, logoDinas: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all" 
                        />
                      </div>
                    </div>
                    
                      <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold text-slate-900">Logo Sekolah (Kanan - Opsional)</label>
                      <div className="flex items-center gap-4">
                        {profil.logoSekolah && (
                          <div className="w-16 h-16 flex items-center justify-center bg-transparent shrink-0">
                            <img src={profil.logoSekolah} alt="Logo Sekolah" className="w-full h-full object-contain" />
                          </div>
                        )}
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setProfil({ ...profil, logoSekolah: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold text-slate-900">Ikon Aplikasi & Tab (Favicon)</label>
                      <p className="text-xs text-slate-500 mt-0">Digunakan sebagai logo resmi aplikasi, sidebar, header portal peminjaman, dan favicon tab browser (rasio 1:1).</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-1">
                        <div className="w-16 h-16 flex items-center justify-center shrink-0">
                          <img src={profil.logoAplikasi || "/icon.svg"} alt="Ikon Aplikasi" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setProfil({ ...profil, logoAplikasi: reader.result as string });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all" 
                          />
                          {profil.logoAplikasi && profil.logoAplikasi !== "/icon.svg" && (
                            <button
                              type="button"
                              onClick={() => setProfil({ ...profil, logoAplikasi: "/icon.svg" })}
                              className="text-xs text-primary-600 hover:text-primary-800 font-semibold underline"
                            >
                              Kembalikan ke Logo Aplikasi Resmi (Default)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button onClick={saveProfil}>Simpan Perubahan Profil</Button>
                  </div>
                </div>
              )}

              {activeTab === "users" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Daftar Pengguna</h3>
                    <Button onClick={() => handleAction("Form tambah pengguna dibuka", "info")}>
                      <Plus className="h-4 w-4 mr-2" /> Tambah Pengguna
                    </Button>
                  </div>
                  <div className="overflow-x-auto border border-slate-300 rounded-xl">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className="bg-slate-50 text-slate-700">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Nama Lengkap</th>
                          <th className="px-4 py-3 font-semibold">Email</th>
                          <th className="px-4 py-3 font-semibold">Peran (Role)</th>
                          <th className="px-4 py-3 font-semibold text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {[
                          {name: "Admin System", email: "admin@smpbelajar.id", role: "Super Admin"},
                          {name: "Ibu Mahani", email: "mahani.309@admin.smp.belajar.id", role: "Operator Sarpras"},
                          {name: "Bpk. H. Ahmad Sudirman", email: "kepsek@smpbelajar.id", role: "Kepala Sekolah (Read Only)"},
                        ].map((u, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 bg-white">
                            <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                            <td className="px-4 py-3 text-slate-700">{u.email}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                {u.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center space-x-2">
                              <Button variant="outline" size="sm" className="h-8 px-2 text-slate-700 hover:bg-slate-50" onClick={() => handleAction("Edit pengguna", "info")}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="h-8 px-2 text-rose-600 hover:bg-rose-50 border-rose-200" onClick={() => handleAction("Hapus pengguna", "error")}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "sistem" && (
                <div className="space-y-6 max-w-xl">
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold text-slate-900">Bahasa Antarmuka</label>
                      <select 
                        value={sistem.bahasa}
                        onChange={(e) => setSistem({...sistem, bahasa: e.target.value})}
                        className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                      >
                        <option value="id">Bahasa Indonesia</option>
                        <option value="en">English (US)</option>
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold text-slate-900">Zona Waktu</label>
                      <select 
                        value={sistem.zonaWaktu}
                        onChange={(e) => setSistem({...sistem, zonaWaktu: e.target.value})}
                        className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                      >
                        <option value="Asia/Jakarta">WIB - Asia/Jakarta</option>
                        <option value="Asia/Makassar">WITA - Asia/Makassar</option>
                        <option value="Asia/Jayapura">WIT - Asia/Jayapura</option>
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold text-slate-900">Format Tanggal Defaults</label>
                      <select 
                        value={sistem.formatTanggal}
                        onChange={(e) => setSistem({...sistem, formatTanggal: e.target.value})}
                        className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2026)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2026)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (2026-12-31)</option>
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold text-slate-900">Item per Halaman (Tabel)</label>
                      <select 
                        value={sistem.itemPerHalaman}
                        onChange={(e) => setSistem({...sistem, itemPerHalaman: e.target.value})}
                        className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                      >
                        <option value="10">10 Item</option>
                        <option value="25">25 Item</option>
                        <option value="50">50 Item</option>
                        <option value="100">100 Item</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="h-px bg-slate-200 my-6"></div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800">Personalisasi Antarmuka</h3>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-900">Ukuran Tampilan (Zoom)</label>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                            {[
                              { id: "small", name: "Kecil" },
                              { id: "medium", name: "Normal" },
                              { id: "large", name: "Besar" },
                              { id: "extra-large", name: "Ekstra Besar" }
                            ].map((scale) => (
                              <button
                                key={scale.id}
                                onClick={() => setUiScale(scale.id as any)}
                                className={`py-2 px-2 text-xs font-semibold rounded-lg border flex items-center justify-center transition-all ${uiScale === scale.id ? "bg-slate-800 text-white border-slate-900 shadow-sm dark:bg-primary-600 dark:border-primary-700 dark:text-primary-foreground" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"}`}
                              >
                                {scale.name}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <label className="text-sm font-bold text-black dark:text-white">Pilihan Mode Layar (Tema)</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Mode Terang */}
                            <button
                              type="button"
                              onClick={() => {
                                setThemeMode("light");
                                toast("Beralih ke Mode Terang (Full Putih, Tulisan Hitam, Kombinasi Biru)", "success");
                              }}
                              className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                                themeMode === "light"
                                  ? "border-sky-600 bg-sky-50/60 shadow-md ring-2 ring-sky-500/20"
                                  : "border-slate-200 bg-white hover:border-sky-300 hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center justify-between w-full mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 rounded-lg bg-sky-600 text-white">
                                    <Sun className="w-4 h-4" />
                                  </div>
                                  <span className="font-extrabold text-sm text-black">Mode Terang</span>
                                </div>
                                {themeMode === "light" && (
                                  <span className="px-2 py-0.5 rounded-full bg-sky-600 text-white text-[10px] font-bold">
                                    Aktif
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-black font-semibold leading-relaxed">
                                Full putih bersih, semua tulisan hitam pekat dengan aksen biru langit.
                              </p>
                              {/* Mini visual preview */}
                              <div className="mt-2.5 p-2 rounded-lg bg-white border border-sky-200 flex items-center justify-between text-[10px]">
                                <span className="font-bold text-black">Teks Hitam</span>
                                <span className="px-2 py-0.5 rounded bg-sky-600 text-white font-bold">Tombol Biru</span>
                              </div>
                            </button>

                            {/* Mode Gelap */}
                            <button
                              type="button"
                              onClick={() => {
                                setThemeMode("dark");
                                toast("Beralih ke Mode Gelap", "success");
                              }}
                              className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                                themeMode === "dark" || themeMode === "midnight" || themeMode === "oled"
                                  ? "border-sky-500 bg-slate-900 text-white shadow-md ring-2 ring-sky-500/20"
                                  : "border-slate-700 bg-slate-900/90 text-slate-200 hover:border-sky-400"
                              }`}
                            >
                              <div className="flex items-center justify-between w-full mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 rounded-lg bg-sky-600 text-white">
                                    <Moon className="w-4 h-4" />
                                  </div>
                                  <span className="font-extrabold text-sm text-white">Mode Gelap</span>
                                </div>
                                {(themeMode === "dark" || themeMode === "midnight" || themeMode === "oled") && (
                                  <span className="px-2 py-0.5 rounded-full bg-sky-500 text-white text-[10px] font-bold">
                                    Aktif
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                                Latar belakang gelap elegan, tulisan putih tajam, dan aksen biru terang.
                              </p>
                              {/* Mini visual preview */}
                              <div className="mt-2.5 p-2 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-between text-[10px]">
                                <span className="font-bold text-white">Teks Putih</span>
                                <span className="px-2 py-0.5 rounded bg-sky-500 text-white font-bold">Tombol Biru</span>
                              </div>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-900">Gaya Tampilan Keseluruhan</label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: "modern", name: "Modern" },
                              { id: "elegan", name: "Elegan" },
                              { id: "ceria", name: "Ceria" },
                              { id: "brutalist", name: "Brutalist" },
                              { id: "cyberpunk", name: "Cyberpunk" },
                              { id: "glassmorphism", name: "Glassmorphism" },
                              { id: "retro", name: "Retro UI" },
                              { id: "minimalist", name: "Minimalis" },
                              { id: "neo-brutalism", name: "Neo-Brutalism" },
                              { id: "skumorphism", name: "Skeuomorphism" },
                              { id: "futuristik", name: "Futuristik AI" }
                            ].map((style) => (
                              <button
                                key={style.id}
                                onClick={() => setThemeStyle(style.id as any)}
                                className={`py-2 px-3 text-sm font-medium rounded-lg border flex items-center justify-center transition-all ${themeStyle === style.id ? "bg-primary-50 text-primary-700 border-primary-500" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"}`}
                              >
                                {style.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium text-slate-900">Warna Teks (Font Base Color)</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                            {[
                              { id: "slate", name: "Standar (Slate)" },
                              { id: "gray", name: "Abu-abu (Gray)" },
                              { id: "zinc", name: "Seng (Zinc)" },
                              { id: "neutral", name: "Netral" },
                              { id: "stone", name: "Batu (Stone)" },
                              { id: "blue", name: "Biru" },
                              { id: "rose", name: "Merah (Rose)" },
                              { id: "emerald", name: "Hijau (Emerald)" },
                              { id: "amber", name: "Kuning (Amber)" },
                              { id: "violet", name: "Ungu (Violet)" }
                            ].map((fc) => (
                              <button
                                key={fc.id}
                                onClick={() => setFontColor(fc.id as any)}
                                className={`py-2 px-2 text-xs font-semibold rounded-lg border flex items-center justify-center transition-all ${fontColor === fc.id ? "bg-slate-800 text-white border-slate-900 shadow-sm dark:bg-primary-600 dark:border-primary-700 dark:text-primary-foreground" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"}`}
                              >
                                {fc.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-900">Warna Aksen Utama</label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { id: "ocean", color: "bg-sky-500", name: "Biru Muda (Sky Blue) - Pilihan Utama" },
                            { id: "cyan", color: "bg-cyan-500", name: "Siber (Cyan)" },
                            { id: "blue", color: "bg-blue-600", name: "Biru Laut" },
                            { id: "indigo", color: "bg-indigo-600", name: "Indigo Klasik" },
                            { id: "emerald", color: "bg-emerald-600", name: "Hijau Emerald" },
                            { id: "rose", color: "bg-rose-600", name: "Mawar" },
                            { id: "violet", color: "bg-violet-600", name: "Malam" },
                            { id: "amber", color: "bg-amber-500", name: "Senja" },
                            { id: "slate", color: "bg-slate-700", name: "Monokrom" },
                            { id: "teal", color: "bg-teal-500", name: "Zamrud" },
                            { id: "fuchsia", color: "bg-fuchsia-500", name: "Fuchsia" },
                            { id: "pink", color: "bg-pink-500", name: "Merah Muda" },
                            { id: "orange", color: "bg-orange-500", name: "Jeruk" },
                            { id: "lime", color: "bg-lime-500", name: "Jeruk Nipis" },
                            { id: "zinc", color: "bg-zinc-500", name: "Logam" },
                            { id: "neon", color: "bg-[#ccff00]", name: "Neon" },
                            { id: "gold", color: "bg-yellow-500", name: "Emas" },
                            { id: "forest", color: "bg-green-700", name: "Rimba" },
                            { id: "lavender", color: "bg-purple-400", name: "Lavender" },
                            { id: "cherry", color: "bg-red-600", name: "Ceri" },
                            { id: "coffee", color: "bg-stone-600", name: "Kopi" },
                            { id: "dracula", color: "bg-[#282a36]", name: "Drakula" },
                            { id: "sapphire", color: "bg-blue-800", name: "Safir" },
                            { id: "ruby", color: "bg-rose-800", name: "Delima" },
                            { id: "sunset", color: "bg-orange-600", name: "Matahari Terbenam" },
                            { id: "galaxy", color: "bg-indigo-900", name: "Galaksi" }
                          ].map((theme) => (
                            <button
                              key={theme.id}
                              onClick={() => setThemeColor(theme.id as any)}
                              className={`group relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${themeColor === theme.id ? "ring-2 ring-sky-500 ring-offset-2 scale-110 shadow-md" : "hover:scale-110 border border-slate-300"}`}
                              title={theme.name}
                            >
                              <span className={`w-full h-full rounded-full ${theme.color} opacity-90 shadow-sm transition-opacity group-hover:opacity-100`}></span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-px bg-slate-200 my-6"></div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800">Aplikasi Komputer (PWA)</h3>
                    <div className="p-4 bg-primary-50 rounded-xl border border-primary-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-primary-900">Instal Aplikasi Secara Offline</p>
                        <p className="text-xs text-primary-700 mt-1">Gunakan sistem ini seperti aplikasi desktop (bisa diakses tanpa internet setelah data tersimpan).</p>
                      </div>
                      <Button onClick={() => {
                        handleAction("Mencoba install aplikasi.. Jika tidak muncul, pastikan browser Anda mendukung instalasi PWA atau klik ikon install di URL bar browser Anda.", "info");
                        const event = (window as any).deferredPrompt;
                        if (event) {
                          event.prompt();
                          event.userChoice.then((choiceResult: any) => {
                            if (choiceResult.outcome === 'accepted') {
                                handleAction('Berhasil diinstal!', 'success');
                            }
                            (window as any).deferredPrompt = null;
                          });
                        }
                      }}>
                        <Download className="h-4 w-4 mr-2" /> Instal Sekarang
                      </Button>
                    </div>
                  </div>

                  <div className="pt-2 mt-6">
                    <Button onClick={saveSistem}>Simpan Preferensi</Button>
                  </div>
                </div>
              )}

              {activeTab === "notif" && (
                <div className="space-y-6 max-w-xl">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800">Email Notifications</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input type="checkbox" checked={notif.emailAsetBaru} onChange={(e) => setNotif({...notif, emailAsetBaru: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-600" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">Pencatatan Aset Baru</p>
                          <p className="text-xs text-slate-700">Kirim email saat ada aset baru yang didaftarkan.</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" checked={notif.emailRusak} onChange={(e) => setNotif({...notif, emailRusak: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-600" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">Laporan Kerusakan</p>
                          <p className="text-xs text-slate-700">Kirim email saat ada keluhan kerusakan aset dilaporkan.</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" checked={notif.emailPinjam} onChange={(e) => setNotif({...notif, emailPinjam: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-600" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">Peminjaman Aset</p>
                          <p className="text-xs text-slate-700">Kirim email saat ada aset yang dipinjam atau dikembalikan.</p>
                        </div>
                      </label>
                    </div>
                  </div>
                  <div className="h-px bg-slate-200 my-6"></div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800">Notifikasi Lainnya</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input type="checkbox" checked={notif.browserNotif} onChange={(e) => setNotif({...notif, browserNotif: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-600" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">Web Push Notification</p>
                          <p className="text-xs text-slate-700">Tampilkan notifikasi di browser Anda.</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" checked={notif.waNotif} onChange={(e) => setNotif({...notif, waNotif: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-slate-700 focus:ring-primary-600" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">WhatsApp Notification</p>
                          <p className="text-xs text-slate-700">Integrasi WhatsApp (Memerlukan API Terpisah).</p>
                        </div>
                      </label>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button onClick={saveNotif}>Simpan Pengaturan Notifikasi</Button>
                  </div>
                </div>
              )}

              {activeTab === "backup" && (
                <DatabaseSettingsTab />
              )}

              {activeTab === "keamanan" && (
                <div className="space-y-6 max-w-xl">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary-600" />
                      Kredensial Login Administrator
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Kredensial ini digunakan saat Anda masuk ke dalam dashboard administrator aplikasi.
                    </p>

                    <div className="grid gap-4">
                      {/* Username Admin */}
                      <div className="grid gap-1.5">
                        <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Username Admin
                        </label>
                        <input 
                          type="text" 
                          value={profil.adminUsername || "admin"}
                          onChange={(e) => setProfil({ adminUsername: e.target.value })}
                          placeholder="admin"
                          className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all" 
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">Username default: <code>admin</code></p>
                      </div>

                      {/* Password Admin */}
                      <div className="grid gap-1.5">
                        <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Password Admin
                        </label>
                        <input 
                          type="text" 
                          value={profil.adminPassword || "admin123"}
                          onChange={(e) => setProfil({ adminPassword: e.target.value })}
                          placeholder="admin123"
                          className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-mono" 
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">Password default: <code>admin123</code></p>
                      </div>

                      {/* PIN Cepat */}
                      <div className="grid gap-1.5">
                        <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          PIN Akses Alternatif (6 Angka)
                        </label>
                        <input 
                          type="text" 
                          value={profil.adminPin || "123456"}
                          onChange={(e) => setProfil({ adminPin: e.target.value })}
                          placeholder="123456"
                          maxLength={6}
                          className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-mono" 
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">Dapat digunakan sebagai alternatif pengganti password (Default: <code>123456</code>).</p>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-200 dark:bg-slate-800 my-6"></div>

                  {/* Google Account for Backup Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Cloud className="h-4 w-4 text-emerald-600" />
                      Akun Google (Khusus Backup & Cloud Drive)
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Akun Google tidak diwajibkan untuk login aplikasi, melainkan digunakan khusus untuk pencadangan database master (<code>sim_sarpras_db.json</code>), snapshot arsip, dan ekspor spreadsheet Google Sheets.
                    </p>

                    <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${isDriveConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {isDriveConnected ? "Google Drive Backup Aktif" : "Google Drive Belum Tersambung"}
                          </p>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mt-1 text-[11px]">
                          {isDriveConnected
                            ? `Akun Backup: ${googleUser?.email || "Akun Google Terhubung"}`
                            : "Hubungkan akun Google sekolah (@belajar.id / Gmail) untuk pencadangan otomatis."}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => window.dispatchEvent(new CustomEvent("open-gdrive-manager"))}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-xs shrink-0"
                      >
                        <HardDrive className="h-3.5 w-3.5 mr-1.5" />
                        Kelola Backup Drive
                      </Button>
                    </div>
                  </div>
                  
                  <div className="h-px bg-slate-200 my-6"></div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800">Keamanan Sesi</h3>
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold text-slate-900">Batas Waktu Sesi (Timeout)</label>
                      <select 
                        defaultValue="120"
                        className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                      >
                        <option value="15">15 Menit</option>
                        <option value="30">30 Menit</option>
                        <option value="60">1 Jam</option>
                        <option value="120">2 Jam</option>
                        <option value="240">4 Jam</option>
                        <option value="never">Jangan Pernah Logout</option>
                      </select>
                      <p className="text-xs text-slate-700">Otomatis logout saat tidak ada aktivitas.</p>
                    </div>
                  </div>

                  <div className="h-px bg-slate-200 my-6"></div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 text-rose-600">Zona Bahaya</h3>
                    <div className="p-4 bg-rose-50 rounded-xl border border-rose-200/50">
                      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-rose-900">Hapus Akun & Seluruh Data</p>
                          <p className="text-xs text-rose-700 mt-1">Tindakan ini tidak dapat dibatalkan. Seluruh data aset dan pengaturan akan hilang selamanya.</p>
                        </div>
                        <Button variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-100 whitespace-nowrap" onClick={() => handleAction("Fungsi ini dinonaktifkan di mode demo", "error")}>
                          Hapus Permanen
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                </div>
              )}

              {activeTab === "server_lokal" && (
                <LocalServerConfig />
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AlertCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}
