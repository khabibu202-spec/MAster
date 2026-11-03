/**
 * Default Database Initializer
 * Menghasilkan data/database.json awal dari data standar sekolah
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

const defaultProfile = {
  kementerian: "Kementerian Pendidikan dan Kebudayaan",
  nama: "SMP Negeri 3 Kras",
  npsn: "20202020",
  alamat: "Jl. Pendidikan No. 123, Kota Pelajar, Provinsi Ilmu Pengetahuan",
  kodePos: "40123",
  telepon: "(021) 1234567",
  email: "info@smpbelajar.id",
  website: "www.smpbelajar.id",
  kepalaSekolah: "Bpk. H. Ahmad Sudirman, S.Pd., M.Si.",
  nipKepsek: "19780101 200501 1 001",
  operator: "Ibu Mahani",
  nipOperator: "19850101 201001 2 002",
  logoDinas: "",
  logoSekolah: "",
  logoAplikasi: "/icon.svg",
  adminPin: "123456",
  adminUsername: "admin",
  adminPassword: "admin123"
};

const defaultRooms = [
  { id: "r1", kodeRuangan: "R-VII-A", nama: "Ruang Kelas VII-A", jenis: "Kelas", kapasitas: 32, penanggungJawab: "Bpk. Budi Santoso" },
  { id: "r2", kodeRuangan: "R-VII-B", nama: "Ruang Kelas VII-B", jenis: "Kelas", kapasitas: 32, penanggungJawab: "Ibu Siti Aminah" },
  { id: "r3", kodeRuangan: "R-LAB-KOM", nama: "Laboratorium Komputer", jenis: "Laboratorium", kapasitas: 40, penanggungJawab: "Bpk. Adi Gunawan" },
  { id: "r4", kodeRuangan: "R-PERPUS", nama: "Perpustakaan Pusat", jenis: "Perpustakaan", kapasitas: 50, penanggungJawab: "Ibu Ratna Kumala" },
  { id: "r5", kodeRuangan: "R-GURU", nama: "Ruang Guru", jenis: "Kantor", kapasitas: 60, penanggungJawab: "Bpk. Kepala Sekolah" },
  { id: "r6", kodeRuangan: "R-AULA", nama: "Aula Utama", jenis: "Fasilitas Umum", kapasitas: 200, penanggungJawab: "Staf Sarpras" }
];

const defaultAssets = [
  { id: "a1", kodeBarang: "02.06.02.01.21", nomorRegister: "000001", nama: "Meja Siswa", kategori: "Peralatan & Mesin (KIB B)", merk: "Custom Lokal", bahan: "Kayu Jati", tahunPerolehan: 2020, kondisi: "Baik", ruanganId: "r1", harga: 250000, sumberDana: "Yayasan" },
  { id: "a2", kodeBarang: "02.06.02.01.22", nomorRegister: "000002", nama: "Kursi Siswa", kategori: "Peralatan & Mesin (KIB B)", merk: "Custom Lokal", bahan: "Kayu Jati", tahunPerolehan: 2020, kondisi: "Baik", ruanganId: "r1", harga: 150000, sumberDana: "Yayasan" },
  { id: "a3", kodeBarang: "02.06.02.06.03", nomorRegister: "000003", nama: "Proyektor LCD", kategori: "Peralatan & Mesin (KIB B)", merk: "Epson EB-X05", bahan: "Plastik/Logam", tahunPerolehan: 2022, kondisi: "Baik", ruanganId: "r1", harga: 4500000, sumberDana: "BOS Reguler" },
  { id: "a4", kodeBarang: "02.06.03.02.01", nomorRegister: "000004", nama: "PC Desktop All-in-One", kategori: "Peralatan & Mesin (KIB B)", merk: "Lenovo IdeaCentre", bahan: "Campuran", tahunPerolehan: 2023, kondisi: "Baik", ruanganId: "r3", harga: 8500000, sumberDana: "Pemerintah Pusat" },
  { id: "a5", kodeBarang: "02.06.03.02.01", nomorRegister: "000005", nama: "PC Desktop All-in-One", kategori: "Peralatan & Mesin (KIB B)", merk: "Lenovo IdeaCentre", bahan: "Campuran", tahunPerolehan: 2023, kondisi: "Baik", ruanganId: "r3", harga: 8500000, sumberDana: "Pemerintah Pusat" },
  { id: "a6", kodeBarang: "02.06.02.04.04", nomorRegister: "000006", nama: "AC Split 2 PK", kategori: "Peralatan & Mesin (KIB B)", merk: "Daikin", bahan: "Campuran", tahunPerolehan: 2021, kondisi: "Rusak Ringan", ruanganId: "r3", harga: 6000000, sumberDana: "Hibah / Sumbangan", catatan: "Kurang dingin, perlu service cuci" },
  { id: "a7", kodeBarang: "02.06.03.04.12", nomorRegister: "000007", nama: "Switch Hub 24 Port", kategori: "Peralatan & Mesin (KIB B)", merk: "Cisco", bahan: "Logam", tahunPerolehan: 2019, kondisi: "Baik", ruanganId: "r3", harga: 2000000, sumberDana: "BOS Reguler" },
  { id: "a8", kodeBarang: "05.01.01.01.01", nomorRegister: "000008", nama: "Buku Teks Matematika K13", kategori: "Aset Tetap Lainnya (KIB E)", merk: "Kemdikbud", bahan: "Kertas", tahunPerolehan: 2020, kondisi: "Rusak Berat", ruanganId: "r4", harga: 55000, sumberDana: "BOS Reguler", catatan: "Halaman banyak yang sobek" },
  { id: "a9", kodeBarang: "02.06.02.01.33", nomorRegister: "000009", nama: "Rak Buku Besi 5 Susun", kategori: "Peralatan & Mesin (KIB B)", merk: "Brother", bahan: "Besi", tahunPerolehan: 2018, kondisi: "Baik", ruanganId: "r4", harga: 1200000, sumberDana: "Yayasan" },
  { id: "a10", kodeBarang: "02.06.03.03.01", nomorRegister: "000010", nama: "Printer InkJet Multifungsi", kategori: "Peralatan & Mesin (KIB B)", merk: "Brother DCP-T510W", bahan: "Plastik", tahunPerolehan: 2021, kondisi: "Rusak Ringan", ruanganId: "r5", harga: 2800000, sumberDana: "BOS Daerah (BOSDa)", catatan: "Tinta hitam mampet" },
  { id: "a11", kodeBarang: "02.06.02.05.05", nomorRegister: "000011", nama: "Dispenser Air Minum", kategori: "Peralatan & Mesin (KIB B)", merk: "Miyako", bahan: "Plastik", tahunPerolehan: 2019, kondisi: "Baik", ruanganId: "r5", harga: 300000, sumberDana: "Lainnya" }
];

const defaultConsumables = [
  { id: "c1", nama: "Kertas HVS A4 80gr", kategori: "ATK & Kertas", stokSisa: 12, satuan: "Rim", batasMinimum: 5 },
  { id: "c2", nama: "Tinta Printer Epson 003 Hitam", kategori: "ATK & Tinta", stokSisa: 2, satuan: "Botol", batasMinimum: 5 },
  { id: "c3", nama: "Spidol Papan Tulis Snowman", kategori: "ATK", stokSisa: 45, satuan: "Pcs", batasMinimum: 20 },
  { id: "c4", nama: "Cairan Pembersih Lantai", kategori: "Kebersihan", stokSisa: 15, satuan: "Botol", batasMinimum: 10 }
];

const defaultBorrowings = [
  { id: "b1", assetId: "a3", peminjam: "Bpk. Andi (Guru IPA)", tanggalPinjam: new Date(Date.now() - 2 * 86400000).toISOString(), status: "Dipinjam" },
  { id: "b2", assetId: "a7", peminjam: "Staf TU", tanggalPinjam: new Date(Date.now() - 5 * 86400000).toISOString(), tanggalKembali: new Date(Date.now() - 4 * 86400000).toISOString(), status: "Dikembalikan" }
];

const defaultProcurements = [
  { id: "p1", namaItem: "Laptop Guru", jumlah: 5, estimasiHarga: 40000000, tanggalPengajuan: new Date(Date.now() - 15 * 86400000).toISOString(), status: "Disetujui", sumberDana: "BOS Reguler" },
  { id: "p2", namaItem: "Meja & Kursi Siswa", jumlah: 40, estimasiHarga: 16000000, tanggalPengajuan: new Date(Date.now() - 3 * 86400000).toISOString(), status: "Pengajuan", sumberDana: "Yayasan" }
];

const defaultMutations = [
  { id: "mu1", assetId: "a4", dariRuanganId: "r3", keRuanganId: "r5", tanggalMutasi: new Date(Date.now() - 10 * 86400000).toISOString(), alasan: "Pemindahan sementara untuk staf TU", status: "Selesai" }
];

const defaultMaintenance = [
  { id: "m1", assetId: "a6", tanggalLapor: new Date(Date.now() - 5 * 86400000).toISOString(), pelapor: "Bpk. Adi Gunawan", deskripsiKerusakan: "AC kurang dingin, sudah 1 minggu tidak terasa anginnya.", status: "Proses Perbaikan", teknisi: "Pak Marno (Teknisi Luar)", biayaEstimasi: 150000 },
  { id: "m2", assetId: "a8", tanggalLapor: new Date(Date.now() - 30 * 86400000).toISOString(), pelapor: "Ibu Ratna Kumala", deskripsiKerusakan: "Sampul lepas dan beberapa halaman inti hilang.", status: "Dibatalkan", catatan: "Buku ditarik dari peredaran, ganti baru." },
  { id: "m3", assetId: "a10", tanggalLapor: new Date(Date.now() - 2 * 86400000).toISOString(), pelapor: "Ibu Nurul", deskripsiKerusakan: "Hasil print warna hitam putus-putus. Sudah dicoba cleaning tetap sama.", status: "Menunggu" }
];

const defaultStocktakes = [
  { id: "st1", tanggal: new Date(Date.now() - 60 * 86400000).toISOString(), petugas: "Tim Inventarisasi Sekolah", catatan: "Sensus Aset Awal Tahun Ajaran", totalAset: 11, sesuai: 10, selisih: 1 }
];

const defaultDisposals = [];

function getInitialDatabase() {
  return {
    schoolProfile: defaultProfile,
    rooms: defaultRooms,
    assets: defaultAssets,
    consumables: defaultConsumables,
    borrowings: defaultBorrowings,
    procurements: defaultProcurements,
    mutations: defaultMutations,
    maintenances: defaultMaintenance,
    stocktakes: defaultStocktakes,
    disposals: defaultDisposals,
    version: "1.0.0",
    lastUpdated: new Date().toISOString()
  };
}

function initDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const data = getInitialDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log('[OK] Database terpusat berhasil diinisialisasi:', DB_FILE);
  } else {
    console.log('[INFO] Database terpusat sudah ada:', DB_FILE);
  }
}

if (require.main === module) {
  initDatabase();
}

module.exports = {
  getInitialDatabase,
  DB_FILE,
  DATA_DIR
};
