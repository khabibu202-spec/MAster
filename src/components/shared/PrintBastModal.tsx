import React, { useRef, useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Printer } from 'lucide-react';
import { Button } from '../ui/Button';

interface PrintBastModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  type: 'PBJ_BOS' | 'SERAH_TERIMA_PENGGUNA' | 'CONSUMABLE_SERAH_TERIMA';
}

export function PrintBastModal({ isOpen, onClose, item, type }: PrintBastModalProps) {
  const { schoolProfile } = useData();
  const printRef = useRef<HTMLDivElement>(null);
  const [formValues, setFormValues] = useState({
    nomorSurat: '',
    pihak1Nama: '',
    pihak1Jabatan: '',
    pihak1Nip: '',
    pihak2Nama: '',
    pihak2Jabatan: '',
    pihak2Nip: '',
    kepsekNama: '',
    kepsekNip: ''
  });

  useEffect(() => {
    if (item && type) {
      setFormValues({
        nomorSurat: `BAST/${type === 'CONSUMABLE_SERAH_TERIMA' ? 'BHP' : (type === 'PBJ_BOS' ? 'BOS' : 'ASET')}/SMP/${new Date().getFullYear()}/001`,
        pihak1Nama: type === 'PBJ_BOS' ? '..........................' : (schoolProfile?.operator || '..........................'),
        pihak1Jabatan: type === 'PBJ_BOS' ? 'Penyedia Barang / Toko' : 'Pengurus Barang / Operator Aset',
        pihak1Nip: type === 'PBJ_BOS' ? '' : (schoolProfile?.nipOperator || '..........................'),
        pihak2Nama: type === 'PBJ_BOS' ? (schoolProfile?.kepalaSekolah || '..........................') : '..........................',
        pihak2Jabatan: type === 'PBJ_BOS' ? 'Kepala Sekolah / Pejabat Pembuat Komitmen' : 'Pengguna Barang / Penanggung Jawab Ruangan',
        pihak2Nip: type === 'PBJ_BOS' ? (schoolProfile?.nipKepsek || '..........................') : '..........................',
        kepsekNama: schoolProfile?.kepalaSekolah || '..........................',
        kepsekNip: schoolProfile?.nipKepsek || '..........................',
      });
    }
  }, [item, type, schoolProfile]);

  if (!isOpen) return null;

  const itemName = item?.namaItem || item?.nama || '-';
  const itemSpec = item?.spesifikasi || item?.kategori || '-';
  const itemQty = item?.jumlah || '0';
  const funding = item?.sumberDana || 'BOS';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const currentLogo = schoolProfile?.logoDinas;

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Cetak BAST - ${itemName}</title>
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
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-300 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-900">
            {type === 'PBJ_BOS' ? 'Cetak BAST Hasil Pengadaan (Penyedia ke Sekolah)' : 'Cetak BAST (Operator ke Pengguna)'}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto bg-slate-200 flex flex-col items-center">
          <div className="w-full max-w-[210mm] p-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-300">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Surat</label>
                <input 
                  type="text" 
                  name="nomorSurat"
                  value={formValues.nomorSurat}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              <div className="border p-3 rounded-lg bg-slate-50">
                <h4 className="font-semibold text-sm mb-2 text-slate-800">Pihak Pertama (Menyerahkan)</h4>
                <div className="space-y-2">
                  <input type="text" name="pihak1Nama" value={formValues.pihak1Nama} onChange={handleChange} placeholder="Nama" className="w-full px-2 py-1 text-sm border rounded" />
                  <input type="text" name="pihak1Jabatan" value={formValues.pihak1Jabatan} onChange={handleChange} placeholder="Jabatan" className="w-full px-2 py-1 text-sm border rounded" />
                  <input type="text" name="pihak1Nip" value={formValues.pihak1Nip} onChange={handleChange} placeholder="NIP" className="w-full px-2 py-1 text-sm border rounded" />
                </div>
              </div>
              <div className="border p-3 rounded-lg bg-slate-50">
                <h4 className="font-semibold text-sm mb-2 text-slate-800">Pihak Kedua (Menerima)</h4>
                <div className="space-y-2">
                  <input type="text" name="pihak2Nama" value={formValues.pihak2Nama} onChange={handleChange} placeholder="Nama" className="w-full px-2 py-1 text-sm border rounded" />
                  <input type="text" name="pihak2Jabatan" value={formValues.pihak2Jabatan} onChange={handleChange} placeholder="Jabatan" className="w-full px-2 py-1 text-sm border rounded" />
                  <input type="text" name="pihak2Nip" value={formValues.pihak2Nip} onChange={handleChange} placeholder="NIP" className="w-full px-2 py-1 text-sm border rounded" />
                </div>
              </div>
              <div className="col-span-2 border p-3 rounded-lg bg-slate-50 flex gap-4">
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold text-sm mb-1 text-slate-800">Mengetahui (Kepala Sekolah)</h4>
                  <input type="text" name="kepsekNama" value={formValues.kepsekNama} onChange={handleChange} placeholder="Nama" className="w-full px-2 py-1 text-sm border rounded" />
                  <input type="text" name="kepsekNip" value={formValues.kepsekNip} onChange={handleChange} placeholder="NIP" className="w-full px-2 py-1 text-sm border rounded" />
                </div>
                <div className="flex items-end pb-1">
                  <Button onClick={handlePrint} className="flex items-center gap-2 h-10">
                    <Printer className="w-4 h-4" /> Cetak BAST
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white shadow-md my-4" style={{ width: '210mm', minHeight: '297mm', padding: '20mm' }}>
            <div ref={printRef} style={{ width: '100%', margin: '0 auto', fontFamily: '"Times New Roman", Times, serif', fontSize: '12px' }}>
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

              {type === 'PBJ_BOS' ? (
                <>
                  <div className="text-center font-bold underline text-[12pt] mb-1 uppercase">BERITA ACARA SERAH TERIMA HASIL PENGADAAN BARANG</div>
                  <div className="text-center text-[11pt] mb-6">Nomor: {formValues.nomorSurat}</div>
                  <p className="mb-4 text-justify leading-relaxed">
                    Pada hari ini, tanggal <strong>{currentDate}</strong>, kami yang bertanda tangan di bawah ini:
                  </p>
                  <table className="w-full mb-4 text-xs">
                    <tbody>
                      <tr><td className="w-1/3 py-1">Nama</td><td className="w-4 text-center">:</td><td>{formValues.pihak1Nama}</td></tr>
                      <tr><td className="py-1">Jabatan</td><td className="text-center">:</td><td>{formValues.pihak1Jabatan}</td></tr>
                      <tr hidden={!formValues.pihak1Nip}><td className="py-1">NIP</td><td className="text-center">:</td><td>{formValues.pihak1Nip}</td></tr>
                      <tr><td colSpan={3} className="py-1">Selanjutnya disebut <strong>PIHAK PERTAMA</strong>.</td></tr>
                    </tbody>
                  </table>
                  <table className="w-full mb-4 text-xs">
                    <tbody>
                      <tr><td className="w-1/3 py-1">Nama</td><td className="w-4 text-center">:</td><td>{formValues.pihak2Nama}</td></tr>
                      <tr><td className="py-1">Jabatan</td><td className="text-center">:</td><td>{formValues.pihak2Jabatan}</td></tr>
                      <tr hidden={!formValues.pihak2Nip}><td className="py-1">NIP</td><td className="text-center">:</td><td>{formValues.pihak2Nip}</td></tr>
                      <tr><td colSpan={3} className="py-1">Selanjutnya disebut <strong>PIHAK KEDUA</strong>.</td></tr>
                    </tbody>
                  </table>
                  <p className="mb-4 text-justify leading-relaxed">
                    <strong>PIHAK PERTAMA</strong> telah menyerahkan barang/aset hasil pengadaan dana {funding} 
                    kepada <strong>PIHAK KEDUA</strong>, dan <strong>PIHAK KEDUA</strong> telah menerima barang tersebut dalam keadaan baik dan utuh berupa:
                  </p>
                </>
              ) : (
                <>
                  <div className="text-center font-bold underline text-[12pt] mb-1 uppercase">BERITA ACARA PENYALURAN BARANG {type === 'CONSUMABLE_SERAH_TERIMA' ? 'HABIS PAKAI ' : ''}KE PENGGUNA</div>
                  <div className="text-center text-[11pt] mb-6">Nomor: {formValues.nomorSurat}</div>
                  <p className="mb-4 text-justify leading-relaxed">
                    Pada hari ini, tanggal <strong>{currentDate}</strong>, kami yang bertanda tangan di bawah ini:
                  </p>
                  <table className="w-full mb-4 text-xs">
                    <tbody>
                      <tr><td className="w-1/3 py-1">Nama</td><td className="w-4 text-center">:</td><td>{formValues.pihak1Nama}</td></tr>
                      <tr><td className="py-1">Jabatan</td><td className="text-center">:</td><td>{formValues.pihak1Jabatan}</td></tr>
                      <tr hidden={!formValues.pihak1Nip}><td className="py-1">NIP</td><td className="text-center">:</td><td>{formValues.pihak1Nip}</td></tr>
                      <tr><td colSpan={3} className="py-1">Selanjutnya disebut <strong>PIHAK PERTAMA</strong>.</td></tr>
                    </tbody>
                  </table>
                  <table className="w-full mb-4 text-xs">
                    <tbody>
                      <tr><td className="w-1/3 py-1">Nama</td><td className="w-4 text-center">:</td><td>{formValues.pihak2Nama}</td></tr>
                      <tr><td className="py-1">Jabatan/Ruangan</td><td className="text-center">:</td><td>{formValues.pihak2Jabatan}</td></tr>
                      <tr hidden={!formValues.pihak2Nip}><td className="py-1">NIP</td><td className="text-center">:</td><td>{formValues.pihak2Nip}</td></tr>
                      <tr><td colSpan={3} className="py-1">Selanjutnya disebut <strong>PIHAK KEDUA</strong>.</td></tr>
                    </tbody>
                  </table>
                  <p className="mb-4 text-justify leading-relaxed">
                    <strong>PIHAK PERTAMA</strong> telah menyerahkan barang kepada <strong>PIHAK KEDUA</strong> untuk dipergunakan sebagaimana mestinya, berupa:
                  </p>
                </>
              )}

              <table className="w-full border-collapse mb-6 text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold">
                    <th className="border border-black p-1 text-center w-8">No.</th>
                    <th className="border border-black p-1">NIBAR</th>
                    <th className="border border-black p-1">Kode Barang</th>
                    <th className="border border-black p-1">Nama Barang / Aset</th>
                    <th className="border border-black p-1">Merek & Spesifikasi</th>
                    <th className="border border-black p-1 text-center">Jumlah</th>
                    <th className="border border-black p-1 text-right">Nilai (Rp)</th>
                    <th className="border border-black p-1 text-center">Kondisi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-1 text-center">1</td>
                    <td className="border border-black p-1 font-mono text-[10px]">{item?.nibar || item?.nomorRegister || "-"}</td>
                    <td className="border border-black p-1 font-mono text-[10px]">{item?.kodeBarang || item?.kodeAset || "-"}</td>
                    <td className="border border-black p-1 font-bold">{itemName}</td>
                    <td className="border border-black p-1">{item?.merk ? `Merk: ${item.merk} - ` : ''}{itemSpec}</td>
                    <td className="border border-black p-1 text-center font-bold">{type === 'CONSUMABLE_SERAH_TERIMA' ? `${itemQty} ${item?.satuan || 'Unit'}` : `${itemQty} Unit`}</td>
                    <td className="border border-black p-1 text-right font-mono">{typeof item?.harga === 'number' ? `Rp ${(item.harga * (Number(itemQty) || 1)).toLocaleString('id-ID')}` : '-'}</td>
                    <td className="border border-black p-1 text-center font-semibold">{item?.kondisi || 'Baik'}</td>
                  </tr>
                </tbody>
              </table>

              <p className="mb-8 text-justify leading-relaxed">
                Demikian Berita Acara Serah Terima Barang ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
              </p>

              <div className="flex justify-between mt-8 text-xs">
                <div className="text-center w-[45%]">
                  <p className="mb-16"><strong>PIHAK KEDUA</strong>,<br/>Yang Menerima</p>
                  <p className="font-bold underline mb-0">
                    {formValues.pihak2Nama || '(..............................)'}
                  </p>
                  <p className="mt-1">{formValues.pihak2Nip ? (formValues.pihak2Nip.startsWith('NIP') ? formValues.pihak2Nip : `NIP. ${formValues.pihak2Nip}`) : 'NIP. .......................'}</p>
                </div>
                <div className="text-center w-[45%]">
                  <p className="mb-16"><strong>PIHAK PERTAMA</strong>,<br/>Yang Menyerahkan</p>
                  <p className="font-bold underline mb-0">
                    {formValues.pihak1Nama || '(..............................)'}
                  </p>
                  <p className="mt-1">{formValues.pihak1Nip ? (formValues.pihak1Nip.startsWith('NIP') ? formValues.pihak1Nip : `NIP. ${formValues.pihak1Nip}`) : ''}</p>
                </div>
              </div>
              
              <div className="text-center mt-8 text-xs">
                <p className="mb-16">Mengetahui,<br/>Kepala Sekolah</p>
                <p className="font-bold underline mb-0">{formValues.kepsekNama}</p>
                <p className="mt-1">{formValues.kepsekNip ? (formValues.kepsekNip.startsWith('NIP') ? formValues.kepsekNip : `NIP. ${formValues.kepsekNip}`) : ''}</p>
              </div>

            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-300 bg-slate-50 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="w-4 h-4" /> Cetak BAST
          </Button>
        </div>
      </div>
    </div>
  );
}

