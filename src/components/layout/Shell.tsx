import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  DoorClosed,
  Wrench,
  Settings,
  LogOut,
  Search,
  Bell,
  FileBarChart,
  Box,
  ShoppingCart,
  ArrowRightLeft,
  RefreshCw,
  ClipboardCheck,
  TrendingDown,
  Trash2,
  ScanLine,
  Sun,
  Moon,
  WifiOff,
  Mic,
  HardDrive,
  Cloud,
  Menu,
  X,
  Radio,
  PanelLeftClose,
  PanelLeftOpen,
  FileText as LogIcon,
  Map,
  Activity,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useToast } from "../../contexts/ToastContext";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";
import { useGoogleDrive } from "../../contexts/GoogleDriveContext";
import { ScannerModal } from "../shared/ScannerModal";
import { GoogleDriveManagerModal } from "../shared/GoogleDriveManagerModal";
import { ServerClientModal } from "../shared/ServerClientModal";
import { BroadcastAlertModal } from "../shared/BroadcastAlertModal";

const navGroups = [
  {
    title: "Utama",
    items: [{ name: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    title: "Master Data",
    items: [
      { name: "Aset Tetap (KIB)", href: "/assets", icon: Package },
      { name: "Ruangan (KIR)", href: "/rooms", icon: DoorClosed },
      { name: "Denah Sekolah", href: "/school-map", icon: Map },
      { name: "Habis Pakai", href: "/consumables", icon: Box },
    ],
  },
  {
    title: "Sirkulasi & Logistik",
    items: [
      { name: "Pengadaan", href: "/procurement", icon: ShoppingCart },
      { name: "Peminjaman", href: "/borrowing", icon: ArrowRightLeft },
      { name: "Mutasi Aset", href: "/mutation", icon: RefreshCw },
    ],
  },
  {
    title: "Kondisi & Nilai",
    items: [
      { name: "Status Penggunaan", href: "/asset-status", icon: Activity },
      { name: "Pemeliharaan", href: "/maintenance", icon: Wrench },
      { name: "Stok Opname", href: "/stocktake", icon: ClipboardCheck },
      { name: "Penyusutan", href: "/depreciation", icon: TrendingDown },
      { name: "Penghapusan", href: "/disposal", icon: Trash2 },
    ],
  },
  {
    title: "Sistem & Jaringan",
    items: [
      { name: "Perangkat Terhubung", href: "/active-sessions", icon: Radio },
      { name: "Log Sistem", href: "/system-logs", icon: LogIcon },
      { name: "Laporan", href: "/reports", icon: FileBarChart },
      { name: "Pengaturan", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar({ 
  isOpen, 
  onClose,
  isMinimized,
  onToggleMinimize
}: { 
  isOpen?: boolean; 
  onClose?: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}) {
  const location = useLocation();
  const toast = useToast();
  const { logout, adminUser } = useAuth();
  const { schoolProfile, activeClients } = useData();
  const appIcon = schoolProfile.logoAplikasi || schoolProfile.logoSekolah || "/icon.svg";

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 md:hidden" 
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={cn(
        "fixed top-0 left-0 z-50 h-screen flex flex-col bg-white dark:bg-slate-900/95 backdrop-blur-xl border-r border-sky-200/80 dark:border-slate-800 transition-all duration-300 ease-in-out md:translate-x-0 print:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full",
        isMinimized ? "md:w-20 w-72" : "w-72"
      )}>
        <div className={cn(
          "flex h-16 shrink-0 items-center border-b border-sky-200/80 dark:border-slate-800 transition-all",
          isMinimized ? "md:px-3 px-6 justify-between md:justify-center" : "px-6 justify-between"
        )}>
          <div className={cn("flex items-center gap-3 font-extrabold text-lg tracking-tight text-black dark:text-white", isMinimized && "md:justify-center")}>
            <div className="h-9 w-9 flex items-center justify-center shrink-0">
              <img src={appIcon} alt="Logo Aplikasi" className="h-full w-full object-contain" />
            </div>
            <div className={cn("flex flex-col", isMinimized && "md:hidden")}>
              <span className="leading-tight text-base font-black dark:text-white" style={{ color: '#080000' }}>Sarpras SMP</span>
              <span className="text-sky-700 dark:text-sky-400 tracking-wider uppercase" style={{ fontStyle: 'italic', fontWeight: 'bold', fontFamily: 'Verdana', fontSize: '12px' }}>Master Cloud</span>
            </div>
          </div>
          
          {/* Desktop Minimize Toggle Button (when expanded) */}
          {!isMinimized && (
            <button 
              type="button"
              onClick={onToggleMinimize}
              title="Minimize Menu (Kecilkan Sidebar)"
              className="hidden md:flex p-1.5 rounded-xl text-slate-500 hover:text-black dark:hover:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}

          {/* Close button for mobile */}
          <button 
            onClick={onClose}
            aria-label="Tutup Menu"
            className="md:hidden p-2.5 -mr-2 text-slate-700 hover:text-black dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors touch-target flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Small Expand Button when Minimized */}
        {isMinimized && (
          <div className="hidden md:flex justify-center py-1.5 border-b border-sky-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onToggleMinimize}
              title="Perluas Menu Sidebar"
              className="p-1.5 rounded-xl text-slate-700 hover:text-sky-700 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-all active:scale-95"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        )}

      <div className={cn("flex-1 overflow-y-auto py-3", isMinimized ? "md:px-2 px-4" : "px-4")}>
        {navGroups.map((group, i) => (
          <div key={i} className="mb-4">
            {isMinimized && <div className="hidden md:block h-px bg-sky-200/60 dark:bg-slate-800/80 my-2 mx-1" />}
            <h3 className={cn(
              "mb-1.5 px-3 text-[11px] font-black uppercase tracking-wider text-black dark:text-slate-200",
              isMinimized && "md:hidden"
            )}>
              {group.title}
            </h3>
            <nav className="grid items-start gap-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onClose}
                    title={isMinimized ? item.name : undefined}
                    className={cn(
                      "flex items-center rounded-xl transition-all text-sm touch-target group relative",
                      isMinimized ? "md:justify-center md:px-0 md:py-2.5 px-3 py-2.5 gap-3" : "px-3 py-2.5 gap-3",
                      isActive
                        ? "bg-sky-100 text-black font-black shadow-xs border-l-4 border-sky-600 dark:bg-sky-950/60 dark:text-sky-300"
                        : "text-black font-bold hover:text-black hover:bg-sky-50 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800/60",
                    )}
                  >
                    <div className="relative flex items-center justify-center shrink-0">
                      <item.icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                          isActive ? "text-sky-700 dark:text-sky-400" : "text-black dark:text-slate-400",
                        )}
                      />
                      {isMinimized && item.href === '/active-sessions' && activeClients.length > 0 && (
                        <span className="hidden md:block absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      )}
                    </div>

                    <span className={cn("flex-1 truncate font-bold text-black dark:text-white", isMinimized && "md:hidden")}>{item.name}</span>

                    {!isMinimized && item.href === '/active-sessions' && activeClients.length > 0 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping mr-1" />
                        {activeClients.length}
                      </span>
                    )}

                    {/* Floating tooltip on hover when minimized */}
                    {isMinimized && (
                      <div className="hidden md:group-hover:flex absolute left-full ml-3 px-3 py-1.5 bg-slate-950 text-white text-xs font-bold rounded-xl shadow-2xl whitespace-nowrap z-50 pointer-events-none items-center gap-1.5 border border-sky-700 animate-in fade-in zoom-in-95 duration-150">
                        <span>{item.name}</span>
                        {item.href === '/active-sessions' && activeClients.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500 text-white font-bold">
                            {activeClients.length}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className={cn(
        "shrink-0 border-t border-sky-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/50 transition-all",
        isMinimized ? "p-2" : "p-4"
      )}>
        {/* Google Drive Button */}
        <div className="mb-2">
          <button
            type="button"
            onClick={() => {
              onClose?.();
              window.dispatchEvent(new CustomEvent("open-gdrive-manager"));
            }}
            title="Google Drive DB - Master Database Cloud"
            className={cn(
              "w-full flex items-center rounded-xl border border-sky-200 dark:border-emerald-900/60 bg-sky-50 dark:bg-emerald-950/30 hover:bg-sky-100 transition-all text-xs text-left group",
              isMinimized ? "md:justify-center md:p-2 p-2.5 justify-between" : "justify-between p-2.5"
            )}
          >
            <div className="flex items-center gap-2.5 truncate">
              <div className="p-1.5 rounded-lg bg-sky-600 text-white shadow-sm shrink-0">
                <HardDrive className="h-3.5 w-3.5" />
              </div>
              <div className={cn("truncate", isMinimized && "md:hidden")}>
                <p className="font-black text-black dark:text-slate-200">Google Drive DB</p>
                <p className="text-[10px] text-black font-bold">Master Database Cloud</p>
              </div>
            </div>
            <span className={cn("relative flex h-2 w-2", isMinimized && "md:hidden")}>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
          </button>
        </div>

        {/* Current Logged-in Admin User Info */}
        <div 
          title={`Masuk sebagai ${adminUser?.username || "admin"} (Administrator)`}
          className={cn(
            "mb-2 rounded-xl bg-sky-50/80 dark:bg-slate-800/80 border border-sky-200 dark:border-slate-700/80 flex items-center transition-all",
            isMinimized ? "md:justify-center md:p-1.5 p-2 gap-2.5" : "p-2 gap-2.5"
          )}
        >
          <div className="h-7 w-7 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
            {adminUser?.username?.[0]?.toUpperCase() || "A"}
          </div>
          <div className={cn("min-w-0 flex-1", isMinimized && "md:hidden")}>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-black text-black dark:text-slate-200 truncate">
                {adminUser?.username || "admin"}
              </p>
              <span className="px-1.5 py-0.5 bg-sky-200 text-black text-[9px] font-black rounded">
                Admin
              </span>
            </div>
            <p className="text-[10px] text-black font-semibold truncate">Akun Administrator</p>
          </div>
        </div>

        {/* Developed By (hidden when minimized) */}
        <div className={cn("mb-2 px-2 flex flex-col pt-1 border-slate-200", isMinimized && "md:hidden")}>
          <span className="text-[10px] uppercase font-black text-black dark:text-slate-400 tracking-wider">
            Dikembangkan Oleh
          </span>
          <span className="text-xs font-bold text-black dark:text-primary-400 mt-0.5">
            Khabibu Rohman
          </span>
        </div>

        <button
          onClick={() => {
            toast("Berhasil keluar dari akun admin.", "success");
            logout();
          }}
          title="Keluar dari Akun Admin"
          className={cn(
            "flex w-full items-center rounded-lg text-sm font-bold text-black dark:text-slate-300 transition-all hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer",
            isMinimized ? "md:justify-center md:p-2 p-2.5 gap-3" : "px-3 py-2 gap-3"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0 text-black" />
          <span className={cn(isMinimized && "md:hidden")}>Keluar</span>
        </button>
      </div>
    </div>
    </>
  );
}

import { useTheme } from "../../contexts/ThemeContext";

export function Header({ 
  onMenuClick,
  isMinimized,
  onToggleMinimize
}: { 
  onMenuClick?: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}) {
  const toast = useToast();
  const { assets, rooms, realtimeStatus, serverInfo } = useData();
  const { themeMode, setThemeMode } = useTheme();
  const { adminUser } = useAuth();
  const { isConnected, isConnecting, isSyncing, lastSyncedAt } = useGoogleDrive();
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOpenDrive = () => setIsDriveModalOpen(true);
    window.addEventListener("open-gdrive-manager", handleOpenDrive);
    return () => window.removeEventListener("open-gdrive-manager", handleOpenDrive);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast("Browser Anda tidak mendukung pencarian suara.", "error");
      return;
    }
    
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      setIsListening(true);
      toast("Mendengarkan... Silakan bicara.", "info");
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsDropdownOpen(true);
    };
    
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  const searchResults = {
    assets: assets
      .filter(
        (a) =>
          a.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.kodeBarang.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .slice(0, 5),
    rooms: rooms
      .filter((r) => r.nama.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 3),
  };
  const hasResults =
    searchResults.assets.length > 0 || searchResults.rooms.length > 0;

  return (
    <header className="sticky print:hidden top-0 z-30 flex h-14 md:h-16 items-center justify-between gap-1.5 sm:gap-4 border-b border-sky-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl px-2.5 sm:px-6">
      <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 max-w-md lg:max-w-lg">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-1 text-black dark:text-slate-200 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-800 active:scale-95 transition-all touch-target flex items-center justify-center shrink-0"
          aria-label="Buka menu navigasi"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop Minimize / Expand Toggle Button */}
        {onToggleMinimize && (
          <button
            type="button"
            onClick={onToggleMinimize}
            className="hidden md:flex p-2 text-slate-700 hover:text-sky-700 dark:text-slate-400 dark:hover:text-primary-400 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-800 active:scale-95 transition-all items-center justify-center shrink-0"
            title={isMinimized ? "Perluas Menu Sidebar (Ctrl+B)" : "Kecilkan Menu Sidebar (Ctrl+B)"}
            aria-label="Toggle Minimize Sidebar"
          >
            {isMinimized ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        )}

        <form
          className="flex-1 min-w-0"
          onSubmit={(e) => {
            e.preventDefault();
            if (searchQuery.trim()) {
              navigate(`/assets?q=${encodeURIComponent(searchQuery)}`);
              setIsDropdownOpen(false);
            }
          }}
        >
          <div className="relative flex items-center w-full" ref={dropdownRef}>
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-700 pointer-events-none" />
            <input
              type="search"
              placeholder="Cari aset atau ruangan..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              className="w-full appearance-none bg-white dark:bg-slate-800/90 pl-8 sm:pl-9 pr-14 sm:pr-20 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm border border-sky-300 dark:border-slate-700 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-500/15 transition-all text-black dark:text-white placeholder:text-slate-500 font-semibold"
            />
            <div className="absolute right-1 flex items-center gap-0.5">
              <button
                type="button"
                onClick={startVoiceSearch}
                className={cn("p-1 sm:p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors",
                  isListening ? "text-primary-600 bg-primary-50 animate-pulse" : "text-slate-500 hover:text-primary-600"
                )}
                title="Pencarian Suara"
              >
                <Mic className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="text-slate-500 hover:text-primary-600 p-1 sm:p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                title="Scan Barcode/QR Code"
              >
                <ScanLine className="h-3.5 w-3.5" />
              </button>
            </div>

            {isDropdownOpen && searchQuery.trim() !== "" && (
              <div className="absolute top-full left-0 mt-2 w-full sm:w-80 lg:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                {hasResults ? (
                  <div className="max-h-96 overflow-y-auto">
                    {searchResults.assets.length > 0 && (
                      <div className="p-2">
                        <div className="px-2 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Aset
                        </div>
                        {searchResults.assets.map((asset) => (
                          <div
                            key={asset.id}
                            onClick={() => {
                              navigate(
                                `/assets?q=${encodeURIComponent(asset.kodeBarang)}`,
                              );
                              setSearchQuery("");
                              setIsDropdownOpen(false);
                            }}
                            className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                          >
                            <Package className="h-4 w-4 text-primary-600 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                {asset.nama}
                              </div>
                              <div className="text-xs text-slate-500 font-mono truncate">
                                {asset.kodeBarang}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchResults.assets.length > 0 &&
                      searchResults.rooms.length > 0 && (
                        <div className="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
                      )}

                    {searchResults.rooms.length > 0 && (
                      <div className="p-2">
                        <div className="px-2 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Ruangan
                        </div>
                        {searchResults.rooms.map((room) => (
                          <div
                            key={room.id}
                            onClick={() => {
                              navigate(
                                `/rooms?q=${encodeURIComponent(room.nama)}`,
                              );
                              setSearchQuery("");
                              setIsDropdownOpen(false);
                            }}
                            className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                          >
                            <DoorClosed className="h-4 w-4 text-blue-500 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                {room.nama}
                              </div>
                              <div className="text-xs text-slate-500 truncate">
                                PJ: {room.penanggungJawab}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-slate-500">
                    Tidak ditemukan hasil untuk "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto">
        {/* Server-Client Realtime Status Quick Button */}
        <button
          type="button"
          onClick={() => setIsServerModalOpen(true)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-full border text-[11px] sm:text-xs font-semibold transition-all shadow-sm active:scale-95 shrink-0 whitespace-nowrap",
            realtimeStatus === 'connected'
              ? "bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 hover:bg-indigo-100"
              : realtimeStatus === 'connecting'
              ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 animate-pulse"
              : "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-200"
          )}
          title={`Server-Client Realtime (Port ${serverInfo?.port || 3030}) - Klik untuk melihat IP Server & QR Code`}
        >
          <span className="flex h-2 w-2 relative shrink-0">
            <span className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              realtimeStatus === 'connected' ? "bg-emerald-400" : realtimeStatus === 'connecting' ? "bg-amber-400" : "bg-slate-400"
            )} />
            <span className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              realtimeStatus === 'connected' ? "bg-emerald-500" : realtimeStatus === 'connecting' ? "bg-amber-500" : "bg-slate-500"
            )} />
          </span>
          <span className="whitespace-nowrap font-medium">
            <span className="hidden sm:inline">Server 3030</span>
            <span className="sm:hidden">:3030</span>
          </span>
        </button>

        {/* Google Drive Master DB Quick Button */}
        <button
          type="button"
          onClick={() => setIsDriveModalOpen(true)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-full border text-[11px] sm:text-xs font-semibold transition-all shadow-sm active:scale-95 shrink-0 whitespace-nowrap",
            isConnected
              ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100"
              : isConnecting
              ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 animate-pulse"
              : "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-200"
          )}
          title={
            isConnected
              ? `Google Drive Master DB: Tersinkron (${lastSyncedAt ? lastSyncedAt.toLocaleTimeString("id-ID") : "Aktif"})`
              : isConnecting
              ? "Sedang menghubungkan ke Google Drive..."
              : "Klik untuk menghubungkan Google Drive Master Database"
          }
        >
          <HardDrive
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              isConnected ? "text-emerald-600" : isConnecting ? "text-amber-600" : "text-slate-500",
              (isSyncing || isConnecting) && "animate-spin text-emerald-600"
            )}
          />
          <span className="whitespace-nowrap font-medium">
            {isConnecting ? (
              "Menghubungkan..."
            ) : isSyncing ? (
              "Menyinkronkan..."
            ) : isConnected ? (
              "Drive DB"
            ) : (
              <>
                <span className="hidden sm:inline">Hubungkan Drive</span>
                <span className="sm:hidden">Drive</span>
              </>
            )}
          </span>
          <span className="relative flex h-2 w-2 shrink-0">
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={cn(
                "relative inline-flex rounded-full h-2 w-2",
                isConnected ? (isSyncing ? "bg-amber-400" : "bg-emerald-500") : isConnecting ? "bg-amber-500" : "bg-slate-400"
              )}
            ></span>
          </span>
        </button>

        <button
          onClick={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
          className="p-1.5 sm:p-2 text-black hover:text-sky-600 transition-colors bg-white dark:bg-slate-800 rounded-full border border-sky-300 dark:border-slate-700 shadow-xs shrink-0 flex items-center justify-center"
          title={themeMode === "dark" ? "Beralih ke Mode Terang (Full Putih, Tulisan Hitam, Kombinasi Biru)" : "Beralih ke Mode Gelap"}
        >
          {themeMode === "dark" ? <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-sky-700" />}
        </button>
        <button
          onClick={() => toast("Belum ada notifikasi baru", "info")}
          className="relative p-1.5 sm:p-2 text-slate-600 hover:text-slate-700 transition-colors bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm shrink-0"
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="absolute top-[2px] right-[2px] sm:top-[3px] sm:right-[5px] h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>
        <div
          className="h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-primary-100 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800 flex items-center justify-center cursor-pointer hover:bg-primary-200 dark:hover:bg-primary-900 transition-all shadow-sm shrink-0"
          title={`Masuk sebagai ${adminUser?.username || "admin"}. Klik untuk Pengaturan.`}
          onClick={() => navigate("/settings")}
        >
          <span className="text-xs sm:text-sm font-bold text-primary-700 dark:text-primary-300">
            {adminUser?.username?.[0]?.toUpperCase() || "A"}
          </span>
        </div>
      </div>
      <ScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
      <GoogleDriveManagerModal isOpen={isDriveModalOpen} onClose={() => setIsDriveModalOpen(false)} />
      <ServerClientModal isOpen={isServerModalOpen} onClose={() => setIsServerModalOpen(false)} />
    </header>
  );
}

function BottomNav({ onMenuClick, onScanClick }: { onMenuClick: () => void, onScanClick: () => void }) {
  const location = useLocation();

  const isNavActive = (paths: string[]) => paths.some(p => location.pathname === p || (p !== '/' && location.pathname.startsWith(p)));
  
  return (
    <nav 
      aria-label="Navigasi Bawah Mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 shadow-[0_-4px_25px_-5px_rgba(0,0,0,0.12)] pb-[max(env(safe-area-inset-bottom),8px)] tap-transparent"
    >
      <div className="flex items-center justify-around w-full h-[58px] px-1 relative">
        {/* Tab 1: Beranda */}
        <Link 
          to="/" 
          className={cn(
            "flex flex-col items-center justify-center gap-1 py-1 text-[10px] transition-all flex-1 touch-target",
            location.pathname === '/' 
              ? "text-black font-black" 
              : "text-black font-bold hover:text-sky-800"
          )}
        >
          <div className="relative">
            <LayoutDashboard className="h-5 w-5 text-black" />
            {location.pathname === '/' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-sky-600 dark:bg-sky-400" />
            )}
          </div>
          <span className="text-black font-bold">Beranda</span>
        </Link>

        {/* Tab 2: Aset (KIB / Ruangan) */}
        <Link 
          to="/assets" 
          className={cn(
            "flex flex-col items-center justify-center gap-1 py-1 text-[10px] transition-all flex-1 touch-target",
            isNavActive(['/assets', '/rooms', '/consumables']) 
              ? "text-black font-black" 
              : "text-black font-bold hover:text-sky-800"
          )}
        >
          <div className="relative">
            <Package className="h-5 w-5 text-black" />
            {isNavActive(['/assets', '/rooms', '/consumables']) && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-sky-600 dark:bg-sky-400" />
            )}
          </div>
          <span className="text-black font-bold">Aset & KIR</span>
        </Link>
        
        {/* Center Floating Action Button (FAB) - Scanner */}
        <div className="relative -top-5 flex-1 flex justify-center items-center pointer-events-auto">
          <button 
            type="button"
            onClick={onScanClick}
            aria-label="Buka Pemindai Barcode dan QR Code"
            className="group relative h-12 w-12 rounded-2xl bg-sky-600 text-white flex flex-col items-center justify-center shadow-lg shadow-sky-600/30 border-2 border-white dark:border-slate-950 active:scale-90 transition-all duration-200 touch-target"
          >
            <ScanLine className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Tab 4: Sirkulasi */}
        <Link 
          to="/borrowing" 
          className={cn(
            "flex flex-col items-center justify-center gap-1 py-1 text-[10px] transition-all flex-1 touch-target",
            isNavActive(['/borrowing', '/procurement', '/mutation']) 
              ? "text-black font-black" 
              : "text-black font-bold hover:text-sky-800"
          )}
        >
          <div className="relative">
            <ArrowRightLeft className="h-5 w-5 text-black" />
            {isNavActive(['/borrowing', '/procurement', '/mutation']) && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-sky-600 dark:bg-sky-400" />
            )}
          </div>
          <span className="text-black font-bold">Sirkulasi</span>
        </Link>

        {/* Tab 5: Menu Drawer */}
        <button 
          type="button"
          onClick={onMenuClick} 
          className={cn(
            "flex flex-col items-center justify-center gap-1 py-1 text-[10px] transition-all flex-1 touch-target",
            isNavActive(['/settings', '/reports', '/maintenance', '/stocktake', '/depreciation', '/disposal']) 
              ? "text-black font-black" 
              : "text-black font-bold hover:text-sky-800"
          )}
        >
          <div className="relative">
            <Menu className="h-5 w-5 text-black" />
            {isNavActive(['/settings', '/reports', '/maintenance', '/stocktake', '/depreciation', '/disposal', '/system-logs', '/active-sessions']) && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-sky-600 dark:bg-sky-400" />
            )}
          </div>
          <span className="text-black font-bold">Menu</span>
        </button>
      </div>
    </nav>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileScannerOpen, setIsMobileScannerOpen] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(() => {
    try {
      return localStorage.getItem('sarpras_sidebar_minimized') === 'true';
    } catch {
      return false;
    }
  });
  const location = useLocation();

  const toggleSidebarMinimize = () => {
    setIsSidebarMinimized(prev => {
      const next = !prev;
      try {
        localStorage.setItem('sarpras_sidebar_minimized', String(next));
      } catch {}
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar minimize
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when inside inputs or textareas
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebarMinimize();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close mobile menu when navigating
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 print:bg-white w-full flex text-black dark:text-white font-sans selection:bg-sky-200 selection:text-sky-950 overflow-x-clip">
      <Sidebar 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        isMinimized={isSidebarMinimized}
        onToggleMinimize={toggleSidebarMinimize}
      />
      <div className={cn(
        "flex flex-col print:pl-0 w-full min-w-0 pb-[calc(76px+env(safe-area-inset-bottom))] md:pb-0 transition-all duration-300 ease-in-out",
        isSidebarMinimized ? "md:pl-20" : "md:pl-72"
      )}>
        <Header 
          onMenuClick={() => setIsMobileMenuOpen(true)} 
          isMinimized={isSidebarMinimized}
          onToggleMinimize={toggleSidebarMinimize}
        />
        
        {isOffline && (
          <div className="bg-amber-500 text-white w-full px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium z-50 shadow-md">
            <WifiOff className="h-4 w-4" />
            Mode Offline: Aplikasi berjalan di luar jaringan. Beberapa fitur mungkin tidak tersinkronisasi.
          </div>
        )}

        <main className="flex-1 space-y-4 p-3 sm:p-6 md:p-8 pt-4 md:pt-6 print:p-0 print:pt-0 w-full max-w-full print:max-w-none border-0 border-none">
          {children}
        </main>
      </div>
      
      <BottomNav 
        onMenuClick={() => setIsMobileMenuOpen(true)} 
        onScanClick={() => setIsMobileScannerOpen(true)} 
      />
      
      <ScannerModal isOpen={isMobileScannerOpen} onClose={() => setIsMobileScannerOpen(false)} />
      <BroadcastAlertModal />
    </div>
  );
}
