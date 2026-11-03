import React, { useRef, useState, useMemo } from 'react';
import { Asset } from '../../types';
import { BarcodeDisplay } from './BarcodeDisplay';
import { Printer, Download, Filter } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

interface PrintBarcodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  roomName?: string;
}

export function PrintBarcodesModal({ isOpen, onClose, assets, roomName }: PrintBarcodesModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { rooms } = useData();

  const [filterRoom, setFilterRoom] = useState<string>("Semua");
  const [filterCategory, setFilterCategory] = useState<string>("Semua");

  const categories = useMemo(() => {
    const cats = new Set(assets.map(a => a.kategori || (a as any).kib).filter(Boolean));
    return ["Semua", ...Array.from(cats)] as string[];
  }, [assets]);

  const availableRooms = useMemo(() => {
    return ["Semua", ...rooms.map(r => r.nama)];
  }, [rooms]);

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchRoom = filterRoom === "Semua" || 
        (rooms.find(r => r.id === asset.ruanganId)?.nama === filterRoom);
      const matchCategory = filterCategory === "Semua" || 
        ((asset.kategori || (asset as any).kib) === filterCategory);
      return matchRoom && matchCategory;
    });
  }, [assets, filterRoom, filterCategory, rooms]);

  if (!isOpen) return null;

  const handlePrint = () => {
    // A simple print approach relying on the browser's native print-to-pdf functionality
    const content = printRef.current?.innerHTML;
    if (!content) return;
    
    // We use a clean document for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Cetak QR Code</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { 
                font-family: sans-serif; 
                margin: 0;
                padding: 20px;
              }
              .grid { 
                display: grid; 
                grid-template-columns: repeat(3, 1fr); 
                gap: 20px; 
              }
              /* Hide the download buttons from the print view */
              button {
                display: none !important;
              }
              .barcode-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 16px; 
                border: 1px solid #ccc; 
                border-radius: 8px; 
                page-break-inside: avoid;
              }
              @media print {
                body { margin: 0; padding: 0; }
                .grid { grid-template-columns: repeat(3, 1fr); gap: 15px; }
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              }
            </style>
          </head>
          <body>
            <div class="grid">
              ${content.replace(/<div class="flex items-center/g, '<div class="barcode-container"').replace(/<div class="flex flex-col items-center justify-center w-full">/g, '<div>')}
            </div>
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  setTimeout(() => window.close(), 500);
                }, 1000);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-300 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-900">Cetak QR Code Aset</h3>
          <button 
            onClick={onClose}
            className="p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex flex-col gap-6">
          <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-700 mb-1">Filter Ruangan</label>
              <select
                value={filterRoom}
                onChange={(e) => setFilterRoom(e.target.value)}
                className="w-full rounded-lg border-slate-300 text-sm focus:border-primary-500 focus:ring-primary-500 border p-2"
              >
                {availableRooms.map(room => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-700 mb-1">Filter Kategori (KIB)</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full rounded-lg border-slate-300 text-sm focus:border-primary-500 focus:ring-primary-500 border p-2"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                disabled={filteredAssets.length === 0}
                className="px-6 py-2 bg-primary-600 text-primary-foreground rounded-lg flex items-center gap-2 font-medium hover:bg-primary-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className="w-4 h-4" /> Print {filteredAssets.length} Label
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm w-full mx-auto overflow-x-auto">
            <div className="mb-4 text-sm text-slate-700 border-b border-slate-300 pb-2">
              Menampilkan {filteredAssets.length} dari {assets.length} total data.{' '}
              Bisa langsung dicetak atau disave ke PDF.
            </div>
            <div 
              ref={printRef}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
            >
              {filteredAssets.map(asset => {
                const rName = roomName || rooms.find(r => r.id === asset.ruanganId)?.nama || '-';
                return (
                  <div key={asset.id} className="h-full flex flex-col">
                    <BarcodeDisplay 
                      value={asset.kodeBarang} 
                      title={asset.nama} 
                      subtitle={`Reg: ${asset.nomorRegister}`} 
                      roomName={rName}
                    />
                  </div>
                );
              })}
              {filteredAssets.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-600 italic">
                  Tidak ada data aset yang sesuai dengan filter.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
