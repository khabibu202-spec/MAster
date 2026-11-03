import React, { useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { Printer } from 'lucide-react';
import { Button } from '../ui/Button';

interface PrintDepreciationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  depreciatedAssets: any[];
}

export function PrintDepreciationReportModal({ isOpen, onClose, depreciatedAssets }: PrintDepreciationReportModalProps) {
  const { schoolProfile } = useData();
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Laporan Penyusutan Aset</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { 
                font-family: 'Times New Roman', Times, serif; 
                margin: 0;
                padding: 0;
                background: white;
              }
              @media print {
                @page { size: A4 portrait; margin: 20mm; }
                body { -webkit-print-color-adjust: exact; }
              }
              table th, table td { border-color: #000 !important; }
            </style>
          </head>
          <body>
            <div style="width: 100%; max-width: 210mm; margin: 0 auto; padding: 20px;">
              ${content}
            </div>
            <script>
              setTimeout(() => {
                window.print();
              }, 1200);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const currentDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const year = new Date().getFullYear();
  
  const kepsekName = schoolProfile?.kepalaSekolah || "..........................";
  const kepsekNip = "NIP. " + (schoolProfile?.nipKepsek || "..........................");
  const bendaharaName = schoolProfile?.operator || "..........................";
  const bendaharaNip = "NIP. " + (schoolProfile?.nipOperator || "..........................");

  const currentLogo = schoolProfile?.logoDinas;

  // Hitung total
  const totalHarga = depreciatedAssets.reduce((acc, curr) => acc + curr.harga, 0);
  const totalPenyusutan = depreciatedAssets.reduce((acc, curr) => acc + curr.akumulasiPenyusutan, 0);
  const totalNilaiBuku = depreciatedAssets.reduce((acc, curr) => acc + curr.nilaiBuku, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-300 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-900">
            Cetak Laporan Penyusutan
          </h3>
          <button 
            onClick={onClose}
            className="p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-slate-200 flex justify-center">
          <div className="bg-white shadow-md" style={{ width: '210mm', minHeight: '297mm', padding: '20mm' }}>
            <div ref={printRef} style={{ width: '100%', margin: '0 auto', fontFamily: '"Times New Roman", Times, serif', fontSize: '11px' }}>
              <div className="text-center border-b-[3px] border-double border-black pb-3 mb-5" style={{ position: 'relative', minHeight: '80px' }}>
                {currentLogo && (
                  <img src={currentLogo} alt="Logo" style={{ width: '70px', height: '70px', objectFit: 'contain', position: 'absolute', left: 0, top: 0 }} />
                )}
                <div>
                  <h3 className="m-0 text-[14pt] font-bold uppercase">{schoolProfile.kementerian || 'KEMENTERIAN PENDIDIKAN'}</h3>
                  <h2 className="mt-[2px] mb-1.5 text-[16pt] font-bold uppercase">{schoolProfile.nama}</h2>
                  <p className="m-0 text-[11pt]">{schoolProfile.alamat} {schoolProfile.kodePos}</p>
                  <p className="m-0 text-[11pt] mb-1">Telp: {schoolProfile.telepon} | Email: {schoolProfile.email} | Website: {schoolProfile.website}</p>
                </div>
              </div>
              
              <div className="text-center mb-6">
                <h1 className="m-0 text-base font-bold uppercase underline">LAPORAN PENYUSUTAN ASET (KIB B)</h1>
                <p className="m-0 text-xs mt-1">Tahun Anggaran {year}</p>
              </div>

              <div className="mb-4">
                <table>
                  <tbody>
                    <tr><td style={{ border: 'none', padding: '2px 0', width: '120px' }}>Metode Penyusutan</td><td style={{ border: 'none' }}>: Garis Lurus (Straight Line)</td></tr>
                    <tr><td style={{ border: 'none', padding: '2px 0' }}>Tanggal Laporan</td><td style={{ border: 'none' }}>: {currentDate}</td></tr>
                  </tbody>
                </table>
              </div>

              <table>
                <thead>
                  <tr>
                    <th style={{ width: '4%' }}>No.</th>
                    <th style={{ width: '14%' }}>NIBAR</th>
                    <th style={{ width: '10%' }}>Kode Barang</th>
                    <th style={{ width: '22%' }}>Nama Barang & Merek</th>
                    <th style={{ width: '6%' }}>Tahun</th>
                    <th style={{ width: '8%' }}>Usia / Manfaat</th>
                    <th style={{ width: '12%' }}>Harga Perolehan (Rp)</th>
                    <th style={{ width: '12%' }}>Akumulasi Susut (Rp)</th>
                    <th style={{ width: '12%' }}>Nilai Buku (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {depreciatedAssets.map((item, index) => (
                    <tr key={item.id}>
                      <td className="text-center">{index + 1}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '10px' }}>{item.nibar || item.nomorRegister || "-"}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '10px' }}>{item.kodeBarang || "-"}</td>
                      <td>
                        <strong>{item.nama}</strong>
                        {item.merk && <div style={{ fontSize: '10px', color: '#555' }}>Merk: {item.merk}</div>}
                      </td>
                      <td className="text-center">{item.tahunPerolehan}</td>
                      <td className="text-center">{item.tahunTerpakai}/{item.umurEkonomis} Thn</td>
                      <td className="text-right">{item.harga.toLocaleString('id-ID')}</td>
                      <td className="text-right">{item.akumulasiPenyusutan.toLocaleString('id-ID')}</td>
                      <td className="text-right" style={{ fontWeight: 'bold' }}>{item.nilaiBuku.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={6} className="text-center font-bold">TOTAL REKAPITULASI</td>
                    <td className="text-right font-bold">{totalHarga.toLocaleString('id-ID')}</td>
                    <td className="text-right font-bold">{totalPenyusutan.toLocaleString('id-ID')}</td>
                    <td className="text-right font-bold">{totalNilaiBuku.toLocaleString('id-ID')}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', fontSize: '11px' }}>
                <div style={{ textAlign: 'center', width: '50%' }}>
                  <p style={{ marginBottom: '60px' }}>Mengetahui,<br/>Kepala Sekolah</p>
                  <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: 0 }}>{kepsekName}</p>
                  <p style={{ marginTop: '4px' }}>{kepsekNip}</p>
                </div>
                <div style={{ textAlign: 'center', width: '50%' }}>
                  <p style={{ marginBottom: '60px' }}>..................., {currentDate}<br/>Pengurus Barang / Bendahara</p>
                  <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: 0 }}>{bendaharaName}</p>
                  <p style={{ marginTop: '4px' }}>{bendaharaNip}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-300 bg-slate-50 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="w-4 h-4" /> Cetak Laporan
          </Button>
        </div>
      </div>
    </div>
  );
}
