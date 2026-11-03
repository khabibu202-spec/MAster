import React, { useRef, useState, useMemo } from 'react';
import QRCode from 'react-qr-code';
import { useData } from '../../contexts/DataContext';
import { 
  Printer, Tag, X, Check, Scissors, ShieldAlert, Layers, 
  CheckSquare, Square, Filter
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Disposal, Asset } from '../../types';

export interface DisposalLabelItem {
  disposal: Disposal;
  asset: Asset;
}

interface PrintDisposalLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  items?: DisposalLabelItem[];
  disposal?: Disposal | null;
  asset?: Asset | null;
}

type BorderStyle = 'double' | 'solid-red' | 'solid-black';
type CopiesMode = 'by-unit' | 'one-each' | 'fixed';

export function PrintDisposalLabelModal({ 
  isOpen, 
  onClose, 
  items, 
  disposal, 
  asset 
}: PrintDisposalLabelModalProps) {
  const { schoolProfile, rooms } = useData();
  const printRef = useRef<HTMLDivElement>(null);
  
  // Combine props to unified items list
  const allItems: DisposalLabelItem[] = useMemo(() => {
    if (items && items.length > 0) {
      return items;
    }
    if (disposal && asset) {
      return [{ disposal, asset }];
    }
    return [];
  }, [items, disposal, asset]);

  const [borderStyle, setBorderStyle] = useState<BorderStyle>('double');
  const [copiesMode, setCopiesMode] = useState<CopiesMode>('by-unit');
  const [fixedCopiesCount, setFixedCopiesCount] = useState<number>(1);
  const [showCutLines, setShowCutLines] = useState<boolean>(true);
  
  // Selection state for multiple items
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Initialize selected IDs whenever modal opens or items change
  React.useEffect(() => {
    if (isOpen && allItems.length > 0) {
      setSelectedIds(allItems.map(it => it.disposal.id));
    }
  }, [isOpen, allItems]);

  if (!isOpen || allItems.length === 0) return null;

  const isMultiItem = allItems.length > 1;
  const activeItems = allItems.filter(it => selectedIds.includes(it.disposal.id));

  // Toggle selection for an item
  const toggleItemSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? (prev.length > 1 ? prev.filter(item => item !== id) : prev) 
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === allItems.length) {
      // keep at least 1
      setSelectedIds([allItems[0].disposal.id]);
    } else {
      setSelectedIds(allItems.map(it => it.disposal.id));
    }
  };

  // Calculate total labels that will be printed
  const totalLabelsCount = activeItems.reduce((sum, item) => {
    if (copiesMode === 'by-unit') {
      return sum + (item.disposal.jumlah || 1);
    }
    if (copiesMode === 'one-each') {
      return sum + 1;
    }
    return sum + Math.max(1, fixedCopiesCount);
  }, 0);

  // Border classes mapping
  const getBorderContainerClasses = () => {
    switch (borderStyle) {
      case 'solid-red':
        return 'border-[3px] border-rose-600 bg-white rounded-lg p-2.5';
      case 'solid-black':
        return 'border-[2.5px] border-black bg-white rounded-lg p-2.5';
      case 'double':
      default:
        return 'border-2 border-black bg-white rounded-lg p-1.5 shadow-sm';
    }
  };

  const getInnerBorderClasses = () => {
    if (borderStyle === 'double') {
      return 'border border-slate-800 rounded-md p-2.5 bg-white flex flex-col justify-between';
    }
    return 'flex flex-col justify-between';
  };

  const handlePrint = () => {
    const printableElement = printRef.current;
    if (!printableElement) return;

    // Grab all rendered label HTML cards from printRef
    const labelCards = printableElement.querySelectorAll('.label-card-instance');
    let copiesHtml = '';

    labelCards.forEach((card) => {
      const copiesAttr = parseInt(card.getAttribute('data-copies') || '1', 10);
      const cardHtml = card.innerHTML;

      for (let i = 0; i < copiesAttr; i++) {
        copiesHtml += `
          <div class="label-wrapper ${showCutLines ? 'has-cutlines' : ''}">
            <div class="${getBorderContainerClasses()}">
              ${cardHtml}
            </div>
          </div>
        `;
      }
    });

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="id">
          <head>
            <meta charset="UTF-8">
            <title>Label_Penghapusan_BMD_${activeItems.length}_Barang_${totalLabelsCount}_Stiker</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 8mm;
                background: #ffffff;
                color: #000000;
              }
              @page {
                size: A4 portrait;
                margin: 8mm;
              }
              .sheet-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 7mm;
                max-width: 195mm;
                margin: 0 auto;
              }
              .label-wrapper {
                page-break-inside: avoid;
                break-inside: avoid;
                position: relative;
              }
              .has-cutlines {
                outline: 1px dashed #cbd5e1;
                outline-offset: 3mm;
              }
              @media print {
                body {
                  padding: 0;
                  margin: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="sheet-grid">
              ${copiesHtml}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 400);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-300 dark:border-slate-800 my-6 flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-rose-50/80 dark:bg-rose-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-sm">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-black dark:text-white leading-tight flex items-center gap-2">
                Cetak Label Stiker Penghapusan Barang
                {isMultiItem && (
                  <span className="text-xs font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full">
                    {activeItems.length} dari {allItems.length} Barang
                  </span>
                )}
              </h3>
              <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                Stiker fisik berbingkai tegas resmi BMD untuk ditempel pada setiap barang yang dihapuskan.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-black dark:hover:text-white rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          {/* Multi-Item Selector Bar (When multiple items exist) */}
          {isMultiItem && (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Pilih Barang yang Ingin Dicetak Labelnya:
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs font-bold text-primary-700 hover:text-primary-800 flex items-center gap-1 cursor-pointer"
                >
                  {selectedIds.length === allItems.length ? (
                    <>
                      <CheckSquare className="w-4 h-4" />
                      Semua Terpilih ({allItems.length})
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4" />
                      Pilih Semua ({allItems.length})
                    </>
                  )}
                </button>
              </div>

              {/* Badges / Checklist of Items */}
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                {allItems.map(({ disposal: d, asset: a }) => {
                  const isSelected = selectedIds.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleItemSelect(d.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                        isSelected 
                          ? 'bg-rose-50 text-rose-900 border-rose-300 shadow-2xs' 
                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${isSelected ? 'bg-rose-600 text-white' : 'border border-slate-400'}`}>
                        {isSelected && '✓'}
                      </span>
                      <span className="truncate max-w-[180px]">{a.nama}</span>
                      <span className="text-[10px] font-mono px-1 rounded bg-white border border-rose-200 text-rose-800">
                        {d.jumlah || 1} unit
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Controls Bar: Model Bingkai & Opsi Cetak */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-800 space-y-3.5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  Model Garis Tepi Bingkai:
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400">Pilih bingkai kedinasan standar atau bingkai merah peringatan</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBorderStyle('double')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    borderStyle === 'double' 
                      ? 'bg-slate-900 text-white border-slate-950 shadow-sm' 
                      : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {borderStyle === 'double' && <Check className="w-3.5 h-3.5" />}
                  Bingkai Ganda (Standar BMD)
                </button>
                <button
                  type="button"
                  onClick={() => setBorderStyle('solid-red')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    borderStyle === 'solid-red' 
                      ? 'bg-rose-600 text-white border-rose-700 shadow-sm' 
                      : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {borderStyle === 'solid-red' && <Check className="w-3.5 h-3.5" />}
                  Bingkai Merah Tegas
                </button>
                <button
                  type="button"
                  onClick={() => setBorderStyle('solid-black')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    borderStyle === 'solid-black' 
                      ? 'bg-black text-white border-black shadow-sm' 
                      : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {borderStyle === 'solid-black' && <Check className="w-3.5 h-3.5" />}
                  Bingkai Hitam Solid
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">Jumlah Cetak per Barang:</span>
                <button
                  type="button"
                  onClick={() => setCopiesMode('by-unit')}
                  className={`px-2.5 py-1 rounded-md font-bold border cursor-pointer ${copiesMode === 'by-unit' ? 'bg-sky-600 text-white border-sky-700' : 'bg-white text-black border-slate-300'}`}
                >
                  Sesuai Jumlah Fisik (Total {activeItems.reduce((acc, it) => acc + (it.disposal.jumlah || 1), 0)} Stiker)
                </button>
                <button
                  type="button"
                  onClick={() => setCopiesMode('one-each')}
                  className={`px-2.5 py-1 rounded-md font-bold border cursor-pointer ${copiesMode === 'one-each' ? 'bg-sky-600 text-white border-sky-700' : 'bg-white text-black border-slate-300'}`}
                >
                  1 Stiker per Barang (Total {activeItems.length} Stiker)
                </button>
                <button
                  type="button"
                  onClick={() => { setCopiesMode('fixed'); setFixedCopiesCount(2); }}
                  className={`px-2.5 py-1 rounded-md font-bold border cursor-pointer ${copiesMode === 'fixed' ? 'bg-sky-600 text-white border-sky-700' : 'bg-white text-black border-slate-300'}`}
                >
                  2 Stiker per Barang
                </button>
              </div>

              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={showCutLines} 
                  onChange={(e) => setShowCutLines(e.target.checked)} 
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="font-semibold flex items-center gap-1 text-[11px]">
                  <Scissors className="w-3.5 h-3.5 text-slate-500" />
                  Garis potong putus-putus
                </span>
              </label>
            </div>
          </div>

          {/* Pratinjau Grid Stiker */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                Pratinjau Hasil Cetak ({activeItems.length} Barang • Total {totalLabelsCount} Lembar Stiker Fisik)
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Format Lembar A4 (Grid 2 Kolom)
              </span>
            </div>

            {/* Container for preview & printable source */}
            <div 
              ref={printRef}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-200/70 dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-800"
            >
              {activeItems.map(({ disposal: d, asset: a }) => {
                const noSurat = d.nomorSurat || `028/${String(d.id).replace(/\D/g, '').padStart(3, '0')}/418.20/SMPN3/${new Date(d.tanggalPengajuan).getFullYear()}`;
                const jumlahUnit = d.jumlah || 1;
                const roomName = a.ruanganId ? rooms.find(r => r.id === a.ruanganId)?.nama || a.ruanganId : "-";
                const penanggungJawab = d.penanggungJawab || schoolProfile?.operator || 'Pengurus Barang SMPN 3 Kras';
                const tglPengajuanFormatted = new Date(d.tanggalPengajuan).toLocaleDateString("id-ID", {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                });

                // Copies count for this item
                const copiesForItem = copiesMode === 'by-unit' 
                  ? (d.jumlah || 1) 
                  : (copiesMode === 'one-each' ? 1 : Math.max(1, fixedCopiesCount));

                const qrData = JSON.stringify({
                  dokumen: "LABEL_PENGHAPUSAN_BMD",
                  instansi: schoolProfile?.nama || "UPTD SMPN 3 Kras",
                  noSK: noSurat,
                  kodeBarang: a.kodeBarang,
                  nomorRegister: a.nomorRegister || "-",
                  nibar: a.nibar || "-",
                  namaBarang: a.nama,
                  jumlahUnit: jumlahUnit,
                  metode: d.metode,
                  status: d.status,
                  tanggal: d.tanggalPengajuan
                });

                return (
                  <div
                    key={d.id}
                    data-copies={copiesForItem}
                    className={`label-card-instance w-full font-sans text-black relative select-none ${getBorderContainerClasses()}`}
                    style={{ backgroundColor: '#ffffff', color: '#000000' }}
                  >
                    <div className={getInnerBorderClasses()}>
                      {/* 1. KOP RESMI INSTANSI */}
                      <div className="pb-2 border-b-2 border-slate-900 flex items-center gap-2.5">
                        {schoolProfile?.logoSekolah ? (
                          <img 
                            src={schoolProfile.logoSekolah} 
                            alt="Logo Sekolah" 
                            className="w-10 h-10 object-contain shrink-0" 
                          />
                        ) : (
                          <div className="w-9 h-9 rounded border border-slate-400 bg-slate-100 flex flex-col items-center justify-center text-[7px] font-black shrink-0 leading-tight text-center">
                            <span>PEMKAB</span>
                            <span>KEDIRI</span>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="text-[8.5px] font-bold text-slate-700 uppercase tracking-wider leading-tight">
                            PEMERINTAH KABUPATEN KEDIRI • DINAS PENDIDIKAN
                          </div>
                          <div className="text-xs font-black text-black uppercase truncate leading-tight tracking-tight">
                            {schoolProfile?.nama || "UPTD SMP NEGERI 3 KRAS"}
                          </div>
                          <div className="text-[9.5px] font-black text-rose-800 uppercase tracking-wide leading-tight mt-0.5">
                            LABEL PENGHAPUSAN BARANG MILIK DAERAH (BMD)
                          </div>
                        </div>
                      </div>

                      {/* 2. WARNING BANNER DENGAN BINGKAI MERAH TERSTRUKTUR */}
                      <div className="my-2 bg-rose-50 border border-rose-400 rounded p-1.5 flex items-center justify-between text-rose-900">
                        <div className="flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <div>
                            <span className="text-[9.5px] font-black uppercase tracking-wider block leading-tight">
                              STATUS: DINONAKTIFKAN / DIHAPUSKAN
                            </span>
                            <span className="text-[8.5px] font-bold text-rose-800 block leading-tight">
                              SK/BA: <span className="font-mono">{noSurat}</span>
                            </span>
                          </div>
                        </div>
                        <span className="text-[9.5px] font-black bg-rose-600 text-white px-2 py-0.5 rounded shadow-2xs shrink-0">
                          {d.metode.toUpperCase()}
                        </span>
                      </div>

                      {/* 3. RINCIAN DATA BARANG BERSIH DENGAN TABEL TITIK DUA PRESISI */}
                      <div className="text-[10.5px] space-y-1.5 py-1 text-slate-950 font-medium">
                        {/* Nama Barang */}
                        <div className="grid grid-cols-[85px_8px_1fr] items-start">
                          <span className="font-bold text-slate-700">Nama Barang</span>
                          <span className="font-bold">:</span>
                          <span className="font-black text-black text-xs leading-tight line-clamp-2">
                            {a.nama}
                          </span>
                        </div>

                        {/* Kode Barang & Jumlah */}
                        <div className="grid grid-cols-[85px_8px_1fr] items-center">
                          <span className="font-bold text-slate-700">Kode Barang</span>
                          <span className="font-bold">:</span>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono font-bold text-black bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 text-[10.5px]">
                              {a.kodeBarang}
                            </span>
                            <span className="bg-rose-100 text-rose-900 font-extrabold px-1.5 py-0.5 rounded border border-rose-300 text-[9.5px]">
                              {jumlahUnit} Unit Fisik
                            </span>
                          </div>
                        </div>

                        {/* NIBAR 44 Digit */}
                        {a.nibar && (
                          <div className="grid grid-cols-[85px_8px_1fr] items-start">
                            <span className="font-bold text-slate-700">NIBAR BMD</span>
                            <span className="font-bold">:</span>
                            <span className="font-mono text-[8.5px] font-extrabold text-sky-950 break-all leading-tight bg-sky-50 px-1 py-0.5 rounded border border-sky-300 block">
                              {a.nibar}
                            </span>
                          </div>
                        )}

                        {/* No Register & Tahun */}
                        <div className="grid grid-cols-[85px_8px_1fr] items-center">
                          <span className="font-bold text-slate-700">No. Reg / Thn</span>
                          <span className="font-bold">:</span>
                          <span className="font-bold text-black font-mono text-[10.5px]">
                            {a.nomorRegister || '-'} <span className="text-slate-600 font-sans font-normal">(Th. {a.tahunPerolehan})</span>
                          </span>
                        </div>

                        {/* Ruangan / Lokasi Terakhir */}
                        <div className="grid grid-cols-[85px_8px_1fr] items-center">
                          <span className="font-bold text-slate-700">Lokasi Asal</span>
                          <span className="font-bold">:</span>
                          <span className="font-semibold text-slate-900 truncate">
                            {roomName}
                          </span>
                        </div>

                        {/* Alasan Penghapusan */}
                        <div className="grid grid-cols-[85px_8px_1fr] items-start">
                          <span className="font-bold text-slate-700">Alasan Afkir</span>
                          <span className="font-bold">:</span>
                          <span className="text-[9.5px] font-semibold text-slate-800 italic line-clamp-1">
                            "{d.alasan}"
                          </span>
                        </div>
                      </div>

                      {/* 4. FOOTER PENGESAHAN DENGAN QR CODE & PENANGGUNG JAWAB */}
                      <div className="pt-2 mt-1 border-t-2 border-slate-900 flex items-center justify-between gap-2.5">
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <span className="text-[8px] font-bold text-slate-600 uppercase block">
                            PENGURUS BARANG:
                          </span>
                          <span className="text-[9.5px] font-black text-black truncate block">
                            {penanggungJawab}
                          </span>
                          <span className="text-[8px] text-slate-700 block">
                            Kediri, {tglPengajuanFormatted}
                          </span>
                        </div>

                        {/* Copies Indicator for preview */}
                        <div className="text-right">
                          <span className="text-[9px] font-extrabold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-300 block">
                            Cetak: {copiesForItem}x
                          </span>
                        </div>

                        {/* QR Code Validation Box */}
                        <div className="flex flex-col items-center shrink-0">
                          <div className="p-0.5 bg-white border border-slate-400 rounded shadow-2xs">
                            <QRCode value={qrData} size={42} className="w-10 h-10 object-contain" />
                          </div>
                          <span className="text-[7px] font-black text-slate-700 mt-0.5 tracking-tight">
                            VALIDASI
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
            <Layers className="w-4 h-4 text-rose-600" />
            <span>
              Akan mencetak <strong className="text-black dark:text-white font-extrabold">{totalLabelsCount} lembar stiker</strong> ({activeItems.length} jenis barang)
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
              Tutup
            </Button>
            <Button 
              onClick={handlePrint} 
              className="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center justify-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Cetak {totalLabelsCount} Stiker Sekarang
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
