import React, { useRef, useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Printer, FileText, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Disposal, Asset } from '../../types';

interface PrintDisposalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  disposal: Disposal | null;
  asset: Asset | null;
}

export function PrintDisposalReportModal({ isOpen, onClose, disposal, asset }: PrintDisposalReportModalProps) {
  const { schoolProfile, rooms } = useData();
  const printRef = useRef<HTMLDivElement>(null);
  const [formValues, setFormValues] = useState({
    nomorSurat: '',
    pihak1Nama: '',
    pihak1Nip: '',
    kepsekNama: '',
    kepsekNip: '',
    hariTanggal: ''
  });

  useEffect(() => {
    if (disposal) {
      const year = new Date(disposal.tanggalPengajuan).getFullYear();
      const defaultNo = disposal.nomorSurat || `421.3/${String(disposal.id).replace(/\D/g, '').padStart(3, '0')}/BA-HPS/${year}`;
      const tglObj = new Date(disposal.tanggalPengajuan);
      const namaHari = tglObj.toLocaleDateString('id-ID', { weekday: 'long' });
      const tanggalFormat = tglObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

      setFormValues({
        nomorSurat: defaultNo,
        pihak1Nama: schoolProfile?.operator || 'Petugas Pengurus Barang',
        pihak1Nip: schoolProfile?.nipOperator || '..........................',
        kepsekNama: schoolProfile?.kepalaSekolah || 'Kepala Sekolah',
        kepsekNip: schoolProfile?.nipKepsek || '..........................',
        hariTanggal: `${namaHari}, tanggal ${tanggalFormat}`
      });
    }
  }, [disposal, schoolProfile]);

  if (!isOpen || !disposal || !asset) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const currentLogo = schoolProfile?.logoSekolah || schoolProfile?.logoDinas;
  const jumlahUnit = disposal.jumlah || 1;
  const totalNilai = (asset.harga || 0) * jumlahUnit;
  const roomName = asset.ruanganId ? rooms.find(r => r.id === asset.ruanganId)?.nama || asset.ruanganId : "-";

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Surat Berita Acara Penghapusan Aset - ${formValues.nomorSurat}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { 
                font-family: 'Times New Roman', Times, serif; 
                margin: 0;
                padding: 0;
                background: white;
                color: black;
              }
              @media print {
                @page { size: A4 portrait; margin: 15mm; }
                body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              }
              table th, table td { border-color: #000 !important; }
            </style>
          </head>
          <body>
            <div style="width: 100%; max-width: 210mm; margin: 0 auto; padding: 15px;">
              ${content}
            </div>
            <script>
              setTimeout(() => {
                window.print();
              }, 800);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const currentDateFormatted = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-300 dark:border-slate-800 my-8 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary-600 text-white rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-black dark:text-white">
                Cetak Surat Berita Acara Penghapusan Barang Milik Daerah
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Dokumen formal per barang inventaris dengan kop surat resmi sekolah, rincian NIBAR, jumlah, dan tanda tangan pejabat berwenang.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-600 hover:text-black dark:hover:text-white rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 space-y-4 flex flex-col items-center">
          {/* Editable Parameters */}
          <div className="w-full max-w-[210mm] bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nomor Surat / SK Penghapusan</label>
                <input 
                  type="text" 
                  name="nomorSurat"
                  value={formValues.nomorSurat}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Hari & Tanggal Berita Acara</label>
                <input 
                  type="text" 
                  name="hariTanggal"
                  value={formValues.hariTanggal}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-900 block">Pengurus Barang / Panitia Pemeriksa</span>
                <input 
                  type="text" 
                  name="pihak1Nama" 
                  value={formValues.pihak1Nama} 
                  onChange={handleChange} 
                  placeholder="Nama Lengkap" 
                  className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-md" 
                />
                <input 
                  type="text" 
                  name="pihak1Nip" 
                  value={formValues.pihak1Nip} 
                  onChange={handleChange} 
                  placeholder="NIP" 
                  className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-md font-mono" 
                />
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-900 block">Mengetahui: Kepala Sekolah</span>
                <input 
                  type="text" 
                  name="kepsekNama" 
                  value={formValues.kepsekNama} 
                  onChange={handleChange} 
                  placeholder="Nama Kepala Sekolah" 
                  className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-md" 
                />
                <input 
                  type="text" 
                  name="kepsekNip" 
                  value={formValues.kepsekNip} 
                  onChange={handleChange} 
                  placeholder="NIP Kepala Sekolah" 
                  className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-md font-mono" 
                />
              </div>
            </div>
          </div>

          {/* Printable Letter Sheet (A4 Preview) */}
          <div className="bg-white text-black shadow-xl rounded-lg my-2 border border-slate-300" style={{ width: '100%', maxWidth: '210mm', minHeight: '297mm', padding: '18mm' }}>
            <div ref={printRef} style={{ width: '100%', margin: '0 auto', fontFamily: '"Times New Roman", Times, serif', fontSize: '11pt', color: '#000000', lineHeight: 1.5 }}>
              {/* Kop Surat Resmi */}
              <div style={{ textAlign: 'center', borderBottom: '3px double #000', paddingBottom: '12px', marginBottom: '20px', position: 'relative' }}>
                {currentLogo && (
                  <img 
                    src={currentLogo} 
                    alt="Logo" 
                    style={{ width: '75px', height: '75px', objectFit: 'contain', position: 'absolute', left: '0px', top: '5px' }} 
                  />
                )}
                <div style={{ paddingLeft: currentLogo ? '85px' : '0px', paddingRight: currentLogo ? '85px' : '0px' }}>
                  <h3 style={{ margin: 0, fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    PEMERINTAH KABUPATEN KEDIRI
                  </h3>
                  <h3 style={{ margin: 0, fontSize: '11pt', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    DINAS PENDIDIKAN
                  </h3>
                  <h2 style={{ margin: '4px 0', fontSize: '15pt', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {schoolProfile?.nama || "UPTD SMP NEGERI 3 KRAS"}
                  </h2>
                  <p style={{ margin: 0, fontSize: '9.5pt' }}>
                    {schoolProfile?.alamat || "Jl. Raya Kras, Kec. Kras, Kabupaten Kediri, Jawa Timur"} {schoolProfile?.kodePos}
                  </p>
                  <p style={{ margin: 0, fontSize: '9pt' }}>
                    Telepon: {schoolProfile?.telepon || "-"} | Email: {schoolProfile?.email || "-"} | Website: {schoolProfile?.website || "-"}
                  </p>
                </div>
              </div>

              {/* Judul Surat */}
              <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                <h2 style={{ margin: 0, fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', textDecoration: 'underline' }}>
                  BERITA ACARA PENGHAPUSAN BARANG MILIK DAERAH (BMD)
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '10.5pt', fontWeight: 'bold' }}>
                  Nomor: {formValues.nomorSurat}
                </p>
              </div>
              
              <p style={{ textAlign: 'justify', marginBottom: '12px' }}>
                Pada hari ini, <strong>{formValues.hariTanggal}</strong>, kami yang bertanda tangan di bawah ini panitia pemeriksa / pengurus barang inventaris pada <strong>{schoolProfile?.nama || "UPTD SMPN 3 Kras"}</strong> telah melaksanakan pemeriksaan fisik serta evaluasi kelayakan teknis dan ekonomis terhadap barang inventaris milik daerah yang diusulkan untuk dihapus.
              </p>

              <p style={{ textAlign: 'justify', marginBottom: '8px' }}>
                Berdasarkan hasil penelitian dan verifikasi kondisi fisik di lapangan, barang yang dinyatakan <strong>dihapuskan</strong> dari Buku Induk Inventaris Barang dan Kartu Inventaris Barang (KIB) adalah sebagai berikut:
              </p>

              {/* Tabel Rincian Barang Lengkap */}
              <div style={{ marginBottom: '16px' }}>
                <table style={{ width: '100%', fontSize: '10pt', borderCollapse: 'collapse', border: '1px solid black' }} cellPadding={6}>
                  <tbody>
                    <tr>
                      <th style={{ border: '1px solid black', width: '30%', backgroundColor: '#f3f4f6', textAlign: 'left' }}>Nama Barang</th>
                      <td style={{ border: '1px solid black', fontWeight: 'bold' }}>{asset.nama}</td>
                    </tr>
                    <tr>
                      <th style={{ border: '1px solid black', backgroundColor: '#f3f4f6', textAlign: 'left' }}>Kode Barang</th>
                      <td style={{ border: '1px solid black', fontFamily: 'monospace' }}>{asset.kodeBarang}</td>
                    </tr>
                    <tr>
                      <th style={{ border: '1px solid black', backgroundColor: '#f3f4f6', textAlign: 'left' }}>NIBAR (Nomor Induk Barang)</th>
                      <td style={{ border: '1px solid black', fontFamily: 'monospace', fontWeight: 'bold' }}>
                        {asset.nibar || "1202350601000000440000" + (asset.tahunPerolehan || 2023) + (asset.kodeBarang.replace(/[^0-9]/g, '').padEnd(12, '0').slice(0, 12)) + "0000001"}
                      </td>
                    </tr>
                    <tr>
                      <th style={{ border: '1px solid black', backgroundColor: '#f3f4f6', textAlign: 'left' }}>Nomor Register</th>
                      <td style={{ border: '1px solid black', fontFamily: 'monospace' }}>{asset.nomorRegister || '-'}</td>
                    </tr>
                    <tr>
                      <th style={{ border: '1px solid black', backgroundColor: '#f3f4f6', textAlign: 'left' }}>Klasifikasi KIB</th>
                      <td style={{ border: '1px solid black' }}>{asset.kategori}</td>
                    </tr>
                    <tr>
                      <th style={{ border: '1px solid black', backgroundColor: '#f3f4f6', textAlign: 'left' }}>Merk / Tipe / Spesifikasi</th>
                      <td style={{ border: '1px solid black' }}>{asset.merk || '-'} {asset.spesifikasiLainnya ? `(${asset.spesifikasiLainnya})` : ''}</td>
                    </tr>
                    <tr>
                      <th style={{ border: '1px solid black', backgroundColor: '#f3f4f6', textAlign: 'left' }}>Tahun Perolehan</th>
                      <td style={{ border: '1px solid black' }}>{asset.tahunPerolehan}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#fffbeb' }}>
                      <th style={{ border: '1px solid black', backgroundColor: '#fef3c7', textAlign: 'left', fontWeight: 'bold' }}>Jumlah Unit yang Dihapus</th>
                      <td style={{ border: '1px solid black', fontWeight: 'bold', fontSize: '11pt', color: '#b45309' }}>
                        {jumlahUnit} Unit
                      </td>
                    </tr>
                    <tr>
                      <th style={{ border: '1px solid black', backgroundColor: '#f3f4f6', textAlign: 'left' }}>Harga Satuan Perolehan</th>
                      <td style={{ border: '1px solid black' }}>Rp {(asset.harga || 0).toLocaleString('id-ID')}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#eff6ff' }}>
                      <th style={{ border: '1px solid black', backgroundColor: '#dbeafe', textAlign: 'left', fontWeight: 'bold' }}>Total Nilai Buku Dihapus</th>
                      <td style={{ border: '1px solid black', fontWeight: 'bold', fontSize: '11pt', color: '#1e40af' }}>
                        Rp {totalNilai.toLocaleString('id-ID')}
                      </td>
                    </tr>
                    <tr>
                      <th style={{ border: '1px solid black', backgroundColor: '#f3f4f6', textAlign: 'left' }}>Sumber Pendanaan / Asal Usul</th>
                      <td style={{ border: '1px solid black' }}>{asset.sumberDana} ({asset.asalUsul || "Pengadaan"})</td>
                    </tr>
                    <tr>
                      <th style={{ border: '1px solid black', backgroundColor: '#f3f4f6', textAlign: 'left' }}>Lokasi / Ruangan Terakhir</th>
                      <td style={{ border: '1px solid black' }}>{roomName}</td>
                    </tr>
                    <tr>
                      <th style={{ border: '1px solid black', backgroundColor: '#f3f4f6', textAlign: 'left' }}>Metode Penghapusan</th>
                      <td style={{ border: '1px solid black', fontWeight: 'bold' }}>{disposal.metode}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Alasan dan Pertimbangan */}
              <div style={{ marginBottom: '14px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '10.5pt', fontWeight: 'bold', textTransform: 'uppercase', textDecoration: 'underline' }}>
                  ALASAN DAN PERTIMBANGAN PENGHAPUSAN:
                </h4>
                <div style={{ border: '1px solid black', padding: '10px', fontSize: '10pt', backgroundColor: '#fafafa', minHeight: '50px' }}>
                  {disposal.alasan}
                </div>
              </div>

              <p style={{ textAlign: 'justify', marginBottom: '24px' }}>
                Demikian Berita Acara ini kami buat menurut keadaan yang sebenarnya dalam rangkap secukupnya untuk dipergunakan sebagaimana mestinya dan dijadikan sebagai dasar pembukuan mutasi/penghapusan aset daerah sesuai peraturan perundang-undangan.
              </p>

              {/* Tanda Tangan Resmi */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', fontSize: '10.5pt' }}>
                <div style={{ textAlign: 'center', width: '45%' }}>
                  <p style={{ margin: 0, marginBottom: '60px' }}>
                    Pengurus Barang / Panitia Pemeriksa,
                  </p>
                  <p style={{ margin: 0, fontWeight: 'bold', textDecoration: 'underline' }}>
                    {formValues.pihak1Nama}
                  </p>
                  <p style={{ margin: '2px 0 0 0' }}>
                    {formValues.pihak1Nip ? (formValues.pihak1Nip.startsWith('NIP') ? formValues.pihak1Nip : `NIP. ${formValues.pihak1Nip}`) : ''}
                  </p>
                </div>

                <div style={{ textAlign: 'center', width: '45%' }}>
                  <p style={{ margin: 0 }}>Kediri, {currentDateFormatted}</p>
                  <p style={{ margin: '2px 0 0 0', marginBottom: '60px' }}>
                    Mengetahui / Menyetujui,<br />
                    <strong>Kepala {schoolProfile?.nama || "UPTD SMPN 3 Kras"}</strong>
                  </p>
                  <p style={{ margin: 0, fontWeight: 'bold', textDecoration: 'underline' }}>
                    {formValues.kepsekNama}
                  </p>
                  <p style={{ margin: '2px 0 0 0' }}>
                    {formValues.kepsekNip ? (formValues.kepsekNip.startsWith('NIP') ? formValues.kepsekNip : `NIP. ${formValues.kepsekNip}`) : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handlePrint} className="bg-primary-600 hover:bg-primary-700 text-white font-bold flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Cetak Surat Berita Acara Sekarang
          </Button>
        </div>
      </div>
    </div>
  );
}
