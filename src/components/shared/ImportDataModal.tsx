import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '../ui/Button';
import { Asset, AssetCategory } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { useData } from '../../contexts/DataContext';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (assets: Asset[]) => void;
}

export function ImportDataModal({ isOpen, onClose, onSuccess }: ImportDataModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const { rooms, assets } = useData();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls') && !selectedFile.name.endsWith('.csv')) {
        toast("Harap unggah file Excel (.xlsx/.xls) atau CSV", "error");
        return;
      }
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const processFile = (file: File) => {
    setIsProcessing(true);
    setErrors([]);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const data = new Uint8Array(buffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        if (!jsonData || jsonData.length === 0) {
          setErrors(["File tidak memiliki data atau baris kosong."]);
        } else {
          setParsedData(jsonData);
        }
      } catch (error: any) {
        console.error("Gagal membaca file Excel/CSV", error);
        setErrors(["Gagal membaca file: " + (error?.message || "Pastikan format file benar.")]);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setErrors(["Gagal membaca file saat diunggah."]);
      setIsProcessing(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleLoadAttachedData = async () => {
    setIsLoadingSample(true);
    setErrors([]);
    try {
      const response = await fetch('/assets/aistudio/Daftar_Barang_2025-S2_1.3_8a05938f.2_UPTD_SMPN_3_Kras');
      if (!response.ok) throw new Error("Gagal mengambil file terlampir");
      const csvText = await response.text();
      const workbook = XLSX.read(csvText, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      setParsedData(jsonData);
      setFile(new File([csvText], "Daftar_Barang_UPTD_SMPN_3_Kras.csv", { type: "text/csv" }));
      toast(`Berhasil membaca ${jsonData.length} baris data barang resmi SMPN 3 Kras!`, "success");
    } catch (e: any) {
      console.error(e);
      setErrors(["Gagal memuat file: " + (e.message || "File tidak ditemukan")]);
      toast("Gagal memuat file terlampir", "error");
    } finally {
      setIsLoadingSample(false);
    }
  };

  const validateAndImport = () => {
    if (parsedData.length === 0) {
      setErrors(["Data kosong. Pastikan file tidak kosong dan sesuai template."]);
      return;
    }

    const newAssets: Asset[] = [];
    const currentErrors: string[] = [];
    const seenNibars = new Set<string>();

    parsedData.forEach((row, index) => {
      // Check if row is completely empty
      const hasAnyContent = Object.values(row).some(val => String(val ?? '').trim().length > 0);
      if (!hasAnyContent) {
        return;
      }

      // Support both standard 'Nama Barang' and official BMD 'Uraian Barang'
      const namaBarang = String(row['Nama Barang'] || row['Uraian Barang'] || row['nama'] || '').trim();
      if (!namaBarang) {
        currentErrors.push(`Baris ${index + 2}: 'Nama Barang' / 'Uraian Barang' wajib diisi.`);
        return;
      }

      // Check duplicate NIBAR
      const rowNibar = row['NIBAR'] ? String(row['NIBAR']).trim() : undefined;
      if (rowNibar) {
        if (seenNibars.has(rowNibar)) {
          currentErrors.push(`Baris ${index + 2}: Duplikasi NIBAR "${rowNibar}" ditemukan berulang dalam file Excel.`);
          return;
        }
        seenNibars.add(rowNibar);
        const existingWithNibar = assets.find(a => a.nibar && a.nibar.trim() === rowNibar);
        if (existingWithNibar) {
          currentErrors.push(`Baris ${index + 2}: NIBAR "${rowNibar}" sudah terdaftar di database sistem pada "${existingWithNibar.nama}". Harap ganti nomor register/NIBAR.`);
          return;
        }
      }

      // Try finding room by name
      let roomId = '';
      if (row['Ruangan']) {
        const foundRoom = rooms.find(r => r.nama.toLowerCase().includes(String(row['Ruangan']).toLowerCase()));
        if (foundRoom) {
          roomId = foundRoom.id;
        }
      }

      const validCategories = [
        "Tanah (KIB A)", 
        "Peralatan & Mesin (KIB B)", 
        "Gedung & Bangunan (KIB C)", 
        "Jalan, Irigasi & Jaringan (KIB D)", 
        "Aset Tetap Lainnya (KIB E)", 
        "Aset Tak Berwujud", 
        "Ekstrakomptabel"
      ];
      
      let kategori: AssetCategory = "Peralatan & Mesin (KIB B)";
      if (row['Kategori KIB']) {
        const found = validCategories.find(c => c === row['Kategori KIB'] || String(row['Kategori KIB']).includes(c));
        if (found) kategori = found as AssetCategory;
      } else if (String(row['Komptabel']).toLowerCase().trim() === 'ekstra') {
        kategori = "Ekstrakomptabel";
      }

      // Parse Tahun & Tanggal Perolehan
      let tahunPerolehan = parseInt(row['Tahun Perolehan']);
      const tglPerolehan = row['Tgl Perolehan'] ? String(row['Tgl Perolehan']).trim() : undefined;
      if (!tahunPerolehan && tglPerolehan) {
        const matchYear = tglPerolehan.match(/(\d{4})/);
        if (matchYear) {
          tahunPerolehan = parseInt(matchYear[1]);
        }
      }
      if (!tahunPerolehan) tahunPerolehan = new Date().getFullYear();

      // Parse Nilai / Harga
      const rawHarga = row['Nilai Perolehan'] ?? row['Harga/Nilai'] ?? row['Harga'] ?? 0;
      const harga = typeof rawHarga === 'number' ? rawHarga : (parseFloat(String(rawHarga).replace(/[^0-9.-]/g, '')) || 0);

      // Parse Asal Usul / Sumber Dana
      const asalUsul = String(row['Asal Usul'] || row['Sumber Dana'] || 'Pengadaan APBD').trim();
      let sumberDana: any = 'BOS Reguler';
      const asalLower = asalUsul.toLowerCase();
      if (asalLower.includes('bos kinerja')) sumberDana = 'BOS Kinerja';
      else if (asalLower.includes('bos')) sumberDana = 'BOS Reguler';
      else if (asalLower.includes('hibah')) sumberDana = 'Hibah / Sumbangan';
      else if (asalLower.includes('yayasan')) sumberDana = 'Yayasan';
      else if (asalLower.includes('apbd') || asalLower.includes('pusat')) sumberDana = 'Pemerintah Pusat';
      else sumberDana = 'Lainnya';

      // Parse Kondisi
      const rawKondisi = String(row['Kondisi'] || row['Kondisi (Baik/Rusak Ringan/Rusak Berat)'] || 'Baik').trim().toLowerCase();
      const kondisi = rawKondisi === 'baik' ? 'Baik' :
                      rawKondisi.includes('berat') ? 'Rusak Berat' :
                      rawKondisi.includes('rusak') ? 'Rusak Ringan' : 'Baik';

      const asset: Asset = {
        id: "AST-" + Date.now().toString() + "-" + (index + 1) + "-" + Math.floor(Math.random() * 1000),
        kodeBarang: String(row['Kode Barang'] || `KB-${Date.now().toString().slice(-6)}`),
        nomorRegister: String(row['Kode Register'] || row['Nomor Register'] || row['NIBAR'] || `000${index + 1}`),
        nibar: row['NIBAR'] ? String(row['NIBAR']).trim() : undefined,
        nama: namaBarang,
        uraianBarang: row['Uraian Barang'] ? String(row['Uraian Barang']).trim() : namaBarang,
        kategori: kategori,
        merk: String(row['Merek / Tipe'] || row['Merk/Tipe'] || row['Merk'] || '').trim(),
        spesifikasiLainnya: row['Spesifikasi Lainnya'] ? String(row['Spesifikasi Lainnya']).trim() : undefined,
        ukuranCc: String(row['Ukuran/CC'] || row['Spesifikasi Lainnya'] || '').trim(),
        bahan: row['Bahan'] ? String(row['Bahan']).trim() : '',
        nomorSertifikat: row['Nomor Sertifikat/Pabrik/Chasis/Mesin'] ? String(row['Nomor Sertifikat/Pabrik/Chasis/Mesin']).trim() : undefined,
        nomorPolisi: row['No. Polisi'] ? String(row['No. Polisi']).trim() : undefined,
        nomorRangka: row['No. Rangka'] ? String(row['No. Rangka']).trim() : undefined,
        nomorMesin: row['No. Mesin'] ? String(row['No. Mesin']).trim() : undefined,
        nomorBpkb: row['No. BPKB'] ? String(row['No. BPKB']).trim() : undefined,
        skpd: row['SKPD'] ? String(row['SKPD']).trim() : undefined,
        lokasi: row['Lokasi'] ? String(row['Lokasi']).trim() : undefined,
        penggunaan: row['Penggunaan'] ? String(row['Penggunaan']).trim() : undefined,
        tanggalPerolehan: tglPerolehan,
        komptabel: row['Komptabel'] ? String(row['Komptabel']).trim() : undefined,
        tahunPerolehan: tahunPerolehan,
        kondisi: kondisi,
        harga: harga,
        asalUsul: asalUsul,
        sumberDana: sumberDana,
        ruanganId: roomId,
        keterangan: row['Keterangan'] ? String(row['Keterangan']).trim() : undefined,
        catatan: row['Keterangan'] ? String(row['Keterangan']).trim() : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      newAssets.push(asset);
    });

    if (currentErrors.length > 0) {
      setErrors(currentErrors);
    } else {
      if (newAssets.length > 0) {
        onSuccess(newAssets);
        toast(`${newAssets.length} data aset berhasil diimpor!`, "success");
        onClose();
      }
    }
  };

  const handleDownloadTemplate = () => {
    // Official 21-column SIPD BMD format matching Daftar Barang SMPN 3 Kras
    const templateData = [
      {
        "SKPD": "UPTD SMPN 3 Kras",
        "Kode Barang": "1.3.2.01.03.05.002",
        "Uraian Barang": "Portable Water Pump",
        "NIBAR": "120235060100000044000020091320103050020000001",
        "Kode Register": "120235060100000044000020091320103050020000001",
        "Nama Barang": "Portable Water Pump",
        "Merek / Tipe": "Merk: Shimizu",
        "Spesifikasi Lainnya": "Kapasitas 125 Watt",
        "No. Polisi": "",
        "No. Rangka": "",
        "No. Mesin": "",
        "No. BPKB": "",
        "Lokasi": "UPTD SMPN 3 Kras",
        "Ruangan": "Ruang Sarpras",
        "Tgl Perolehan": "2009-06-30",
        "Komptabel": "ekstra",
        "Nilai Perolehan": 600000,
        "Asal Usul": "Hibah",
        "Kondisi": "Baik",
        "Penggunaan": "UPTD SMPN 3 Kras",
        "Keterangan": "Kondisi terawat"
      },
      {
        "SKPD": "UPTD SMPN 3 Kras",
        "Kode Barang": "1.3.2.10.01.02.002",
        "Uraian Barang": "Lap Top",
        "NIBAR": "120135060100000044000020191321001020020000008",
        "Kode Register": "120135060100000044000020191321001020020000008",
        "Nama Barang": "Lap Top",
        "Merek / Tipe": "Merk: HP 240 G6 I3-7020U",
        "Spesifikasi Lainnya": "Intel Core i3, RAM 4GB, SSD 256GB",
        "No. Polisi": "",
        "No. Rangka": "",
        "No. Mesin": "",
        "No. BPKB": "",
        "Lokasi": "UPTD SMPN 3 Kras",
        "Ruangan": "Lab Komputer",
        "Tgl Perolehan": "2019-06-30",
        "Komptabel": "intra",
        "Nilai Perolehan": 11349310,
        "Asal Usul": "Pengadaan APBD",
        "Kondisi": "Baik",
        "Penggunaan": "UPTD SMPN 3 Kras",
        "Keterangan": "Inventaris Lab TIK"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Format_KIB_B_Resmi");
    XLSX.writeFile(wb, "Template_Format_KIB_B_Resmi_SIPD_BMD.xlsx");
    toast("Template format Excel KIB B (21 Kolom) berhasil diunduh", "success");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl overflow-hidden bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-300 dark:border-slate-800 my-8"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
              Impor Data Aset Excel
            </h3>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-slate-600 hover:text-slate-700 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            {!file ? (
              <div className="space-y-4">
                <div 
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 sm:p-10 text-center hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="bg-primary-50 dark:bg-slate-800 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-7 h-7 text-primary-600" />
                  </div>
                  <h4 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-200">Pilih file Excel (.xlsx) atau CSV</h4>
                  <p className="text-slate-700 mt-1.5 max-w-sm mx-auto text-xs sm:text-sm">
                    Mendukung format resmi SIPD / BMD KIB B (21 Kolom) serta template standar data inventaris.
                  </p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".xlsx, .xls, .csv" 
                    className="hidden" 
                  />
                </div>

                <div className="bg-sky-50 dark:bg-slate-800/80 border border-sky-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm text-slate-950 dark:text-sky-200">File Lampiran: Daftar Barang 2025 (UPTD SMPN 3 Kras)</p>
                    <p className="text-xs text-slate-700 dark:text-sky-400">Tersedia data resmi KIB B dengan 21 kolom dan 3.587 data barang.</p>
                  </div>
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={handleLoadAttachedData} 
                    disabled={isLoadingSample}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shrink-0 rounded-xl"
                  >
                    {isLoadingSample ? 'Membaca File...' : 'Muat File Lampiran Ini'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 flex items-center justify-between border border-emerald-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 p-2 rounded-lg">
                      <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{file.name}</p>
                      <p className="text-sm text-slate-700">{(file.size / 1024).toFixed(2)} KB • {parsedData.length} Baris data ditemukan</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setFile(null); setParsedData([]); setErrors([]); }}
                    className="text-slate-600 hover:text-rose-500 transition-colors bg-white dark:bg-slate-900 border shadow-sm p-1.5 rounded-md"
                    title="Ganti File"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {errors.length > 0 && (
                  <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4">
                    <h4 className="font-semibold text-rose-800 flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4" />
                      Ditemukan {errors.length} Kesalahan
                    </h4>
                    <ul className="text-sm text-rose-600 max-h-40 overflow-y-auto space-y-1 list-disc pl-5">
                      {errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-8 flex justify-between items-end border-t border-slate-300 dark:border-slate-800 pt-6">
              <div>
                <p className="text-sm text-slate-700 mb-2">Belum punya format yang sesuai?</p>
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-2">
                  <Download className="w-4 h-4" />
                  Unduh Template Excel
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>Batal</Button>
                <Button 
                  onClick={validateAndImport} 
                  disabled={!file || parsedData.length === 0 || isProcessing}
                  className="gap-2"
                >
                  {isProcessing ? 'Memproses...' : 'Impor Data Sekarang'}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
