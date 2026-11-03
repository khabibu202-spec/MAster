import React, { useState, useRef, useEffect } from "react";
import QRCode from "react-qr-code";
import {
  Wifi,
  Server,
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Laptop,
  Terminal,
  FileCode,
  HelpCircle,
  Radio,
  Network,
  Cpu,
  RefreshCw,
  Info
} from "lucide-react";
import { Button } from "../ui/Button";
import { useToast } from "../../contexts/ToastContext";
import { useData } from "../../contexts/DataContext";

export function LocalServerConfig() {
  const toast = useToast();
  const { schoolProfile } = useData();
  const qrWrapperRef = useRef<HTMLDivElement>(null);

  // Deteksi hostname saat ini
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const currentPort = typeof window !== 'undefined' ? (window.location.port || '3000') : '3000';
  const currentProtocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';

  // State konfigurasi server lokal
  const [serverIp, setServerIp] = useState<string>(() => {
    if (currentHost !== 'localhost' && currentHost !== '127.0.0.1' && !currentHost.includes('run.app')) {
      return currentHost;
    }
    return "192.168.1.100";
  });
  const [serverPort, setServerPort] = useState<string>(currentPort || "3000");
  const [targetPath, setTargetPath] = useState<"portal" | "dashboard" | "custom">("portal");
  const [customPath, setCustomPath] = useState<string>("/#/portal-peminjaman");
  const [copied, setCopied] = useState(false);
  const [activeGuideStep, setActiveGuideStep] = useState<number>(1);
  const [restrictLanOnly, setRestrictLanOnly] = useState(true);

  // Hitung Tautan Akses Lengkap
  const getResolvedPath = () => {
    if (targetPath === "portal") return "/#/portal-peminjaman";
    if (targetPath === "dashboard") return "/#/";
    return customPath.startsWith("/") ? customPath : `/${customPath}`;
  };

  const localAccessUrl = `http://${serverIp}:${serverPort}${getResolvedPath()}`;
  const baseLocalUrl = `http://${serverIp}:${serverPort}`;

  const copyToClipboard = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast(msg, "success");
    setTimeout(() => setCopied(false), 2500);
  };

  // Unduh Stiker QR Code beresolusi tinggi dengan nama sekolah
  const handleDownloadQrCode = () => {
    if (!qrWrapperRef.current) return;
    const svgElement = qrWrapperRef.current.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const canvasWidth = 650;
    const canvasHeight = 780;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const img = new Image();
    img.onload = () => {
      // Background kartu futuristik
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Gradient Header Bar
      const gradient = ctx.createLinearGradient(0, 0, canvasWidth, 0);
      gradient.addColorStop(0, "#4f46e5");
      gradient.addColorStop(0.5, "#06b6d4");
      gradient.addColorStop(1, "#3b82f6");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasWidth, 12);

      // Judul Sekolah & Aplikasi
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(schoolProfile.nama || "SMP NEGERI 1 CONTOH", canvasWidth / 2, 60);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 16px 'Inter', sans-serif";
      ctx.fillText("PORTAL PEMINJAMAN SARANA & PRASARANA (SIM SARPRAS)", canvasWidth / 2, 90);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 13px 'Inter', monospace";
      ctx.fillText("KHUSUS JARINGAN INTRANET & WI-FI SEKOLAH", canvasWidth / 2, 115);

      // White container box untuk QR Code
      const qrBoxSize = 420;
      const qrBoxX = (canvasWidth - qrBoxSize) / 2;
      const qrBoxY = 140;

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 24);
      ctx.fill();

      // Gambar QR Code di tengah kotak putih
      const qrInnerPadding = 30;
      ctx.drawImage(
        img,
        qrBoxX + qrInnerPadding,
        qrBoxY + qrInnerPadding,
        qrBoxSize - qrInnerPadding * 2,
        qrBoxSize - qrInnerPadding * 2
      );

      // URL Teks di Bawah QR
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 16px monospace";
      ctx.fillText(localAccessUrl, canvasWidth / 2, 600);

      // Petunjuk untuk Guru & Siswa
      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px 'Inter', sans-serif";
      ctx.fillText("1. Hubungkan HP / Laptop ke Wi-Fi Sekolah (SSID Guru / Sekolah)", canvasWidth / 2, 640);
      ctx.fillText("2. Buka Kamera ponsel lalu arahkan ke QR Code di atas", canvasWidth / 2, 665);
      ctx.fillText("3. Masuk dengan NIP / NIS untuk meminjam sarana & alat sekolah", canvasWidth / 2, 690);

      // Footer
      ctx.fillStyle = "#64748b";
      ctx.font = "12px 'Inter', sans-serif";
      ctx.fillText("Generated by SIM Sarpras SMP Local Intranet Hub", canvasWidth / 2, 740);

      // Trigger Download
      const link = document.createElement("a");
      link.download = `QR_Akses_Wi-Fi_Sekolah_${serverIp}.png`;
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast("Stiker QR Code siap cetak berhasil diunduh!", "success");
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Handler Download File Launcher Windows
  const handleDownloadLauncherBat = () => {
    const batContent = `@echo off
title SERVER LOKAL SIM SARPRAS SMP (JARINGAN INTRANET SEKOLAH)
color 0B
cd /d "%~dp0"

echo ======================================================================
echo          SIM SARPRAS SMP - SISTEM SERVER LOKAL SEKOLAH
echo ======================================================================
echo  Server ini akan berjalan di jaringan lokal (LAN / Wi-Fi Sekolah).
echo  Hanya perangkat yang terhubung ke jaringan sekolah yang dapat mengakses.
echo ======================================================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js belum terpasang di komputer ini!
    echo Silakan pasang Node.js LTS terlebih dahulu dari: https://nodejs.org/
    echo.
    pause
    exit /b
)

if not exist "node_modules\\" (
    echo [1/3] Mempersiapkan dependensi awal (npm install)...
    call npm install
    echo.
)

if not exist "dist\\" (
    echo [2/3] Membangun bundle aplikasi web (npm run build)...
    call npm run build
    echo.
) else (
    echo [2/3] Bundle aplikasi (dist) sudah siap!
)

echo [3/3] Mendeteksi IP Lokal Komputer...
echo.
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" /c:"Alamat IPv4"') do (
    echo [*] Alamat IP Komputer Anda : %%a
)
echo.

start "" "http://localhost:${serverPort}"

echo Menjalankan Server Lokal (Tekan Ctrl + C untuk mematikan)...
echo.
node server-lokal.cjs

pause
`;
    downloadTextFile("JALANKAN_SERVER_LOKAL.bat", batContent);
    toast("File JALANKAN_SERVER_LOKAL.bat berhasil diunduh!", "success");
  };

  // Handler Download Mode Cepat (Vite LAN) Bat
  const handleDownloadModeCepatBat = () => {
    const batContent = `@echo off
title SERVER SIM SARPRAS SMP - MODE CEPAT (VITE LAN)
color 0A
cd /d "%~dp0"

echo ======================================================================
echo       SIM SARPRAS SMP - SERVER CEPAT JARINGAN SEKOLAH (VITE LAN)
echo ======================================================================
echo  Mode ini langsung berjalan tanpa perlu proses build terlebih dahulu!
echo ======================================================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js belum terpasang di komputer ini!
    echo Silakan download dan pasang Node.js dari: https://nodejs.org/
    echo.
    pause
    exit /b
)

if not exist "node_modules\\" (
    echo [1/2] Memasang paket library awal (npm install)...
    call npm install
    echo.
)

echo [2/2] Memulai Server Jaringan Lokal...
echo.
timeout /t 2 >nul 2>&1
start "" "http://localhost:${serverPort}"

call npx vite --host 0.0.0.0 --port ${serverPort}

pause
`;
    downloadTextFile("JALANKAN_MODE_CEPAT.bat", batContent);
    toast("File JALANKAN_MODE_CEPAT.bat berhasil diunduh!", "success");
  };

  // Handler Download Firewall Bat
  const handleDownloadFirewallBat = () => {
    const batContent = `@echo off
title BUKA PORT FIREWALL UNTUK SIM SARPRAS SMP
color 0E

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ======================================================================
    echo  PERHATIAN: SCRIPT INI HARUS DIJALANKAN SEBAGAI ADMINISTRATOR!
    echo ======================================================================
    echo.
    echo  Klik Kanan file ini, lalu pilih "Run as administrator".
    echo.
    pause
    exit /b
)

echo ======================================================================
echo     MEMBUKA PORT FIREWALL WINDOWS UNTUK SERVER SIM SARPRAS SMP
echo ======================================================================
echo.
echo Menambahkan aturan Firewall Inbound TCP Port 3000...
netsh advfirewall firewall add rule name="SIM Sarpras SMP - Port 3000 (Inbound TCP)" dir=in action=allow protocol=TCP localport=3000

echo Menambahkan aturan Firewall Inbound TCP Port 80 (Web Standar)...
netsh advfirewall firewall add rule name="SIM Sarpras SMP - Port 80 (Inbound TCP)" dir=in action=allow protocol=TCP localport=80

echo.
echo ======================================================================
echo [BERHASIL] Port 3000 dan 80 telah berhasil dibuka di Windows Firewall!
echo Komputer dan smartphone di jaringan Wi-Fi sekolah sekarang
echo dapat mengakses aplikasi secara lancar.
echo ======================================================================
echo.
pause
`;
    downloadTextFile("BUKA_FIREWALL_SEKOLAH.bat", batContent);
    toast("File BUKA_FIREWALL_SEKOLAH.bat berhasil diunduh!", "success");
  };

  const downloadTextFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Top Futuristic Hero Status Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 shadow-2xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 tracking-wider">
                <Radio className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                SERVER INTRANET LOKAL SEKOLAH
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Terisolasi & Aman (Khusus Wi-Fi / LAN)
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Akses Mandiri Khusus Lingkungan Sekolah
            </h3>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Konfigurasi satu PC/Komputer di sekolah (PC TU, Lab, atau Laptop Sarpras) sebagai 
              <strong className="text-cyan-300"> Server Pusat Lokal</strong>. Semua guru, siswa, dan staf dapat mengakses portal peminjaman dan data aset langsung dari HP/Laptop via Wi-Fi sekolah tanpa perlu kuota internet luar.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            <Button
              onClick={handleDownloadLauncherBat}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-10 px-4 shadow-lg shadow-indigo-600/30 border border-indigo-400/30 flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Launcher (.bat)
            </Button>
            <Button
              onClick={handleDownloadModeCepatBat}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 px-4 shadow-lg shadow-emerald-600/30 border border-emerald-400/30 flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Mode Cepat (.bat)
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadFirewallBat}
              className="border-slate-700 bg-slate-800/80 text-cyan-300 hover:bg-slate-700 hover:text-white font-semibold text-xs h-10 px-4 flex items-center justify-center gap-2"
            >
              <Terminal className="h-4 w-4" />
              Download Buka Firewall (.bat)
            </Button>
          </div>
        </div>
      </div>

      {/* Grid: Konfigurasi IP & Live QR Code Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Konfigurasi Parameter Jaringan (7 Kolom) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Network className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                    Parameter IP Komputer Server
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Masukkan IP Lokal komputer host yang menjalankan server SIM Sarpras.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5 text-indigo-500" />
                  Alamat IP Lokal Server (IPv4)
                </label>
                <input
                  type="text"
                  value={serverIp}
                  onChange={(e) => setServerIp(e.target.value.trim())}
                  placeholder="Contoh: 192.168.1.100"
                  className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 rounded-lg px-3.5 py-2 text-sm font-mono font-bold text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                />
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <span>Saran cepat:</span>
                  {["192.168.1.100", "192.168.0.100", "10.0.0.100"].map((ip) => (
                    <button
                      key={ip}
                      type="button"
                      onClick={() => setServerIp(ip)}
                      className="underline hover:text-indigo-600 font-mono transition-colors"
                    >
                      {ip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Port Jaringan
                </label>
                <input
                  type="text"
                  value={serverPort}
                  onChange={(e) => setServerPort(e.target.value.trim())}
                  placeholder="3000"
                  className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 rounded-lg px-3.5 py-2 text-sm font-mono font-bold text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                />
                <span className="text-[11px] text-slate-500 block">Default: 3000 / 80</span>
              </div>
            </div>

            {/* Target URL Selector */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Halaman Tujuan untuk QR Code Akses:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTargetPath("portal")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    targetPath === "portal"
                      ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Smartphone className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    Portal Peminjaman Guru & Siswa
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Halaman publik ringan untuk scan barcode alat dan pengajuan pinjam barang.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetPath("dashboard")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    targetPath === "dashboard"
                      ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Laptop className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    Dashboard Penuh Admin Sarpras
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Akses lengkap manajemen aset, KIB, stocktake, dan pembukuan barang.
                  </p>
                </button>
              </div>
            </div>

            {/* Proteksi Filter Subnet Sekolah */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-900 dark:text-slate-100">
                  Proteksi Subnet Otomatis (RFC 1918)
                </p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                  Skrip <code>server-lokal.cjs</code> secara aktif memeriksa IP perangkat yang meminta akses. Koneksi dari IP publik luar akan langsung ditolak otomatis dengan kode <code>403 Forbidden</code>, memastikan sistem hanya dapat diakses melalui Wi-Fi atau kabel LAN sekolah.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Terminal Helper Snippet */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5 font-sans font-semibold">
                <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                Perintah Terminal Menjalankan Server Lokal:
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard("npm run serve:local", "Perintah terminal disalin!")}
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <Copy className="h-3 w-3" /> Salin
              </button>
            </div>
            <p className="text-cyan-300 font-semibold">$ npm run serve:local</p>
            <p className="text-[11px] text-slate-500 font-sans">
              Menjalankan server Express intranet terisolasi yang mempublikasikan folder <code>dist</code> ke port 3000 pada seluruh adapter LAN/Wi-Fi.
            </p>
          </div>
        </div>

        {/* Kolom Kanan: Live Futuristic QR Code & Akses Cepat (5 Kolom) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/50 bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-6 shadow-md text-center space-y-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                <Wifi className="h-3 w-3" /> Wi-Fi Sekolah Scanner
              </span>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                QR Code Akses Cepat Guru & Siswa
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Arahkan kamera smartphone ke QR Code ini saat terhubung ke Wi-Fi sekolah.
              </p>
            </div>

            {/* QR Code Container */}
            <div
              ref={qrWrapperRef}
              className="inline-block p-4 rounded-2xl bg-white shadow-xl border border-slate-200 dark:border-slate-700"
            >
              <QRCode
                value={localAccessUrl}
                size={200}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 256 256`}
              />
            </div>

            {/* URL Display */}
            <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs">
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate select-all">
                {localAccessUrl}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(localAccessUrl, "Tautan akses lokal disalin!")}
                className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0 transition-colors"
                title="Salin Tautan"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <Button
                size="sm"
                onClick={handleDownloadQrCode}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Cetak Stiker QR
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(localAccessUrl, "_blank")}
                className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs h-9"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Uji Buka Tautan
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Step-by-Step Implementation Guide */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
              <Cpu className="h-5 w-5 text-indigo-600" />
              Langkah Konfigurasi Server Lokal di Sekolah
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ikuti 5 langkah mudah berikut agar aplikasi dapat beroperasi permanen di sekolah.
            </p>
          </div>
        </div>

        {/* Step Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { step: 1, title: "1. Siapkan PC", desc: "Komputer TU / Server" },
            { step: 2, title: "2. IP Statis", desc: "Kunci IP Komputer" },
            { step: 3, title: "3. Buka Firewall", desc: "Izin Port 3000" },
            { step: 4, title: "4. Start Server", desc: "Jalankan 1-Klik" },
            { step: 5, title: "5. Akses Wi-Fi", desc: "Guru & Siswa" },
          ].map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => setActiveGuideStep(item.step)}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeGuideStep === item.step
                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold ring-2 ring-indigo-500/20"
                  : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <span className="text-xs font-bold block">{item.title}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                {item.desc}
              </span>
            </button>
          ))}
        </div>

        {/* Step Detail Cards */}
        <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70">
          {activeGuideStep === 1 && (
            <div className="space-y-3">
              <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Laptop className="h-4 w-4 text-indigo-600" />
                Langkah 1: Menentukan Komputer Host Server Sekolah
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Pilihlah satu komputer yang selalu menyala saat jam sekolah berlangsung. Contoh: Komputer Tata Usaha (TU), PC Server CBT/UNBK di Lab Komputer, atau laptop khusus pengurus Sarpras.
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc pl-5">
                <li>Pastikan komputer terhubung ke Router / Switch sekolah melalui kabel LAN atau Wi-Fi yang stabil.</li>
                <li>Pasang perangkat lunak <strong>Node.js LTS</strong> (dapat diunduh gratis dari <a href="https://nodejs.org" target="_blank" rel="noreferrer" className="text-indigo-600 underline">nodejs.org</a>).</li>
                <li>Salin folder proyek SIM Sarpras SMP ini ke dalam komputer server tersebut (misal di <code>D:\SIM-SARPRAS-SMP\</code>).</li>
              </ul>
            </div>
          )}

          {activeGuideStep === 2 && (
            <div className="space-y-3">
              <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Network className="h-4 w-4 text-indigo-600" />
                Langkah 2: Menetapkan Alamat IP Statis (Fixed IP)
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Agar alamat IP komputer server tidak berubah-ubah saat router sekolah mati listrik atau restart, tetapkan IP Statis di Windows:
              </p>
              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs space-y-1 text-slate-800 dark:text-slate-200">
                <p>1. Tekan <strong>Windows + R</strong> &rarr; ketik <code>ncpa.cpl</code> &rarr; tekan Enter.</p>
                <p>2. Klik kanan kartu jaringan (Wi-Fi / Ethernet) &rarr; pilih <strong>Properties</strong>.</p>
                <p>3. Pilih <strong>Internet Protocol Version 4 (TCP/IPv4)</strong> &rarr; klik <strong>Properties</strong>.</p>
                <p>4. Masukkan IP Statis, misal: IP: <code>192.168.1.100</code> | Subnet: <code>255.255.255.0</code> | Gateway: <code>192.168.1.1</code>.</p>
              </div>
              <p className="text-[11px] text-slate-500">
                <em>Tips Operator:</em> Anda juga bisa membuat <strong>DHCP Static Lease</strong> di Router MikroTik sekolah berdasarkan MAC Address PC tersebut.
              </p>
            </div>
          )}

          {activeGuideStep === 3 && (
            <div className="space-y-3">
              <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                Langkah 3: Membuka Port Inbound di Windows Defender Firewall
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Secara default, Windows memblokir permintaan koneksi dari HP atau laptop lain demi keamanan. Anda cukup membuka port 3000 sekali saja:
              </p>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={handleDownloadFirewallBat}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Unduh BUKA_FIREWALL_SEKOLAH.bat
                </Button>
                <span className="text-xs text-slate-500">
                  (Klik kanan file &rarr; pilih <strong>Run as administrator</strong>)
                </span>
              </div>
            </div>
          )}

          {activeGuideStep === 4 && (
            <div className="space-y-3">
              <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Terminal className="h-4 w-4 text-indigo-600" />
                Langkah 4: Menjalankan Server Lokal (1-Klik)
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Jalankan script launcher otomatis yang sudah kami sediakan:
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  onClick={handleDownloadLauncherBat}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Unduh JALANKAN_SERVER_LOKAL.bat
                </Button>
                <span className="text-xs text-slate-500">
                  Cukup double-click file ini di komputer server sekolah.
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                <strong>Ingin berjalan otomatis saat komputer dinyalakan?</strong> Tekan <code>Windows + R</code>, ketik <code>shell:startup</code>, lalu salin shortcut file <code>JALANKAN_SERVER_LOKAL.bat</code> ke folder startup tersebut.
              </p>
            </div>
          )}

          {activeGuideStep === 5 && (
            <div className="space-y-3">
              <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-indigo-600" />
                Langkah 5: Guru dan Siswa Terhubung Melalui Wi-Fi Sekolah
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Seluruh pengurus barang, guru piket, dan siswa dapat langsung membuka aplikasi:
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc pl-5">
                <li>Sambungkan smartphone ke Wi-Fi sekolah yang sama (SSID: <em>WiFi_Guru</em> atau <em>WiFi_Sekolah</em>).</li>
                <li>Buka browser Google Chrome atau Safari &rarr; ketik <code>{localAccessUrl}</code> atau scan QR Code stiker.</li>
                <li>Guru dan siswa dapat menyimpan halaman ke Layar Utama (Home Screen / PWA) di ponsel mereka sehingga berfungsi seperti aplikasi native offline!</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Troubleshooting Section: Jika File .BAT Mengalami Masalah */}
      <div className="rounded-2xl border border-amber-300 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              Pusat Solusi: Mengapa File .BAT Tidak Bisa Berjalan di Windows?
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Berikut 4 penyebab paling umum dan solusi cepatnya jika file <code>.bat</code> menutup sendiri atau menampilkan error:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Kendala 1 */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-black">
                1
              </span>
              <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                File .BAT Diunduh Sendirian ke Folder "Downloads"
              </h5>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Jika file diunduh langsung dari web browser ke folder <em>Downloads</em>, file tersebut tidak dapat menemukan file aplikasi lainnya (<code>package.json</code> & <code>server-lokal.cjs</code>).
            </p>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium">
              <strong>Solusi:</strong> Pindahkan file <code>JALANKAN_SERVER_LOKAL.bat</code> ke dalam folder utama aplikasi Anda (tempat Anda mengekstrak source code SIM Sarpras).
            </div>
          </div>

          {/* Kendala 2 */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-black">
                2
              </span>
              <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                Komputer Belum Memiliki Node.js
              </h5>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Server lokal memerlukan mesin runtime <strong>Node.js</strong> agar dapat menyajikan data ke seluruh jaringan Wi-Fi sekolah.
            </p>
            <div className="pt-1">
              <a
                href="https://nodejs.org/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition-colors"
              >
                <Download className="h-3 w-3" /> Unduh Node.js LTS Resmi (Gratis)
              </a>
            </div>
          </div>

          {/* Kendala 3 */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-black">
                3
              </span>
              <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                Peringatan Windows SmartScreen ("Protected PC")
              </h5>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Windows Defender sering menampilkan layar biru bertuliskan <em>"Windows protected your PC"</em> saat pertama kali membuka file <code>.bat</code> yang baru diunduh.
            </p>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
              <strong>Solusi:</strong> Klik tulisan <u>More info</u> (Informasi selengkapnya) &rarr; lalu klik tombol <u>Run anyway</u> (Tetap jalankan).
            </div>
          </div>

          {/* Kendala 4 */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-black">
                4
              </span>
              <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                Cara Alternatif: Jalankan Langsung dari Terminal / CMD
              </h5>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Jika file <code>.bat</code> bermasalah di sistem Anda, Anda dapat menjalankannya langsung via Command Prompt (CMD):
            </p>
            <div className="bg-slate-950 p-2.5 rounded-lg text-cyan-300 font-mono text-[11px] flex items-center justify-between">
              <span>npx vite --host 0.0.0.0 --port 3000</span>
              <button
                type="button"
                onClick={() => copyToClipboard("npx vite --host 0.0.0.0 --port 3000", "Perintah disalin!")}
                className="hover:text-white"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
