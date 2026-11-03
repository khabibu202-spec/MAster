const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const os = require('os');

const PORT = 3030;
let serverInstance = null;
let mainWindow = null;
const sseClients = new Set();

// Path penyimpanan database terpusat
const dbDir = app ? app.getPath('userData') : __dirname;
const dbFile = path.join(dbDir, 'sarpras-database.json');

// Inisialisasi database
let inMemoryDb = null;

function loadDatabase() {
  try {
    if (fs.existsSync(dbFile)) {
      inMemoryDb = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
    } else {
      // Inisialisasi database bawaan jika file belum ada
      inMemoryDb = getInitialDatabase();
      saveDatabase();
    }
  } catch (e) {
    inMemoryDb = getInitialDatabase();
  }
}

function saveDatabase() {
  if (!inMemoryDb) return;
  try {
    inMemoryDb.lastUpdated = new Date().toISOString();
    fs.writeFileSync(dbFile, JSON.stringify(inMemoryDb, null, 2), 'utf8');
  } catch (e) {
    console.error('Gagal menyimpan database:', e);
  }
}

function broadcastUpdate(payload) {
  const message = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

function getInitialDatabase() {
  return {
    schoolProfile: {
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
      logoAplikasi: "/icon.svg",
      adminPin: "123456",
      adminUsername: "admin",
      adminPassword: "admin123"
    },
    rooms: [
      { id: "r1", kodeRuangan: "R-VII-A", nama: "Ruang Kelas VII-A", jenis: "Kelas", kapasitas: 32, penanggungJawab: "Bpk. Budi Santoso" },
      { id: "r2", kodeRuangan: "R-VII-B", nama: "Ruang Kelas VII-B", jenis: "Kelas", kapasitas: 32, penanggungJawab: "Ibu Siti Aminah" },
      { id: "r3", kodeRuangan: "R-LAB-KOM", nama: "Laboratorium Komputer", jenis: "Laboratorium", kapasitas: 40, penanggungJawab: "Bpk. Adi Gunawan" },
      { id: "r4", kodeRuangan: "R-PERPUS", nama: "Perpustakaan Pusat", jenis: "Perpustakaan", kapasitas: 50, penanggungJawab: "Ibu Ratna Kumala" },
      { id: "r5", kodeRuangan: "R-GURU", nama: "Ruang Guru", jenis: "Kantor", kapasitas: 60, penanggungJawab: "Bpk. Kepala Sekolah" },
      { id: "r6", kodeRuangan: "R-AULA", nama: "Aula Utama", jenis: "Fasilitas Umum", kapasitas: 200, penanggungJawab: "Staf Sarpras" }
    ],
    assets: [
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
    ],
    consumables: [
      { id: "c1", nama: "Kertas HVS A4 80gr", kategori: "ATK & Kertas", stokSisa: 12, satuan: "Rim", batasMinimum: 5 },
      { id: "c2", nama: "Tinta Printer Epson 003 Hitam", kategori: "ATK & Tinta", stokSisa: 2, satuan: "Botol", batasMinimum: 5 },
      { id: "c3", nama: "Spidol Papan Tulis Snowman", kategori: "ATK", stokSisa: 45, satuan: "Pcs", batasMinimum: 20 },
      { id: "c4", nama: "Cairan Pembersih Lantai", kategori: "Kebersihan", stokSisa: 15, satuan: "Botol", batasMinimum: 10 }
    ],
    borrowings: [
      { id: "b1", assetId: "a3", peminjam: "Bpk. Andi (Guru IPA)", tanggalPinjam: new Date(Date.now() - 2 * 86400000).toISOString(), status: "Dipinjam" },
      { id: "b2", assetId: "a7", peminjam: "Staf TU", tanggalPinjam: new Date(Date.now() - 5 * 86400000).toISOString(), tanggalKembali: new Date(Date.now() - 4 * 86400000).toISOString(), status: "Dikembalikan" }
    ],
    procurements: [
      { id: "p1", namaItem: "Laptop Guru", jumlah: 5, estimasiHarga: 40000000, tanggalPengajuan: new Date(Date.now() - 15 * 86400000).toISOString(), status: "Disetujui", sumberDana: "BOS Reguler" },
      { id: "p2", namaItem: "Meja & Kursi Siswa", jumlah: 40, estimasiHarga: 16000000, tanggalPengajuan: new Date(Date.now() - 3 * 86400000).toISOString(), status: "Pengajuan", sumberDana: "Yayasan" }
    ],
    mutations: [
      { id: "mu1", assetId: "a4", dariRuanganId: "r3", keRuanganId: "r5", tanggalMutasi: new Date(Date.now() - 10 * 86400000).toISOString(), alasan: "Pemindahan sementara untuk staf TU", status: "Selesai" }
    ],
    maintenances: [
      { id: "m1", assetId: "a6", tanggalLapor: new Date(Date.now() - 5 * 86400000).toISOString(), pelapor: "Bpk. Adi Gunawan", deskripsiKerusakan: "AC kurang dingin, sudah 1 minggu tidak terasa anginnya.", status: "Proses Perbaikan", teknisi: "Pak Marno (Teknisi Luar)", biayaEstimasi: 150000 },
      { id: "m2", assetId: "a8", tanggalLapor: new Date(Date.now() - 30 * 86400000).toISOString(), pelapor: "Ibu Ratna Kumala", deskripsiKerusakan: "Sampul lepas dan beberapa halaman inti hilang.", status: "Dibatalkan", catatan: "Buku ditarik dari peredaran, ganti baru." },
      { id: "m3", assetId: "a10", tanggalLapor: new Date(Date.now() - 2 * 86400000).toISOString(), pelapor: "Ibu Nurul", deskripsiKerusakan: "Hasil print warna hitam putus-putus. Sudah dicoba cleaning tetap sama.", status: "Menunggu" }
    ],
    stocktakes: [
      { id: "st1", tanggal: new Date(Date.now() - 60 * 86400000).toISOString(), petugas: "Tim Inventarisasi Sekolah", catatan: "Sensus Aset Awal Tahun Ajaran", totalAset: 11, sesuai: 10, selisih: 1 }
    ],
    disposals: [],
    version: "1.0.0",
    lastUpdated: new Date().toISOString()
  };
}

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({ name, ip: iface.address });
      }
    }
  }
  return addresses;
}

// Lightweight HTTP server serving production build & REST/SSE API on port 3030
function startLocalServer(callback) {
  loadDatabase();

  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.webp': 'image/webp'
  };

  const distDir = __dirname;

  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      return res.end();
    }

    const [reqPath] = req.url.split('?');

    // API ENDPOINTS
    if (reqPath === '/api/realtime') {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      sseClients.add(res);

      res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientCount: sseClients.size })}\n\n`);
      req.on('close', () => sseClients.delete(res));
      return;
    }

    if (reqPath === '/api/server-info') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      const localIps = getLocalIpAddresses();
      return res.end(JSON.stringify({
        success: true,
        appName: 'SIM Sarpras SMP',
        port: PORT,
        connectedClients: sseClients.size,
        localIps: localIps.map(item => ({
          interface: item.name,
          ip: item.ip,
          url: `http://${item.ip}:${PORT}`,
          portalUrl: `http://${item.ip}:${PORT}/#/portal-peminjaman`
        }))
      }));
    }

    if (reqPath === '/api/data' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.end(JSON.stringify({ success: true, data: inMemoryDb }));
    }

    if (reqPath.startsWith('/api/data/') && req.method === 'GET') {
      const key = reqPath.replace('/api/data/', '');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      if (key in inMemoryDb) {
        return res.end(JSON.stringify({ success: true, key, data: inMemoryDb[key] }));
      }
      res.statusCode = 404;
      return res.end(JSON.stringify({ success: false, message: 'Koleksi tidak ditemukan' }));
    }

    if (reqPath.startsWith('/api/data/') && req.method === 'POST') {
      const key = reqPath.replace('/api/data/', '');
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body || '{}');
          if (parsed.value !== undefined) {
            inMemoryDb[key] = parsed.value;
            saveDatabase();
            broadcastUpdate({
              type: 'DATA_UPDATE',
              key,
              value: parsed.value,
              senderId: parsed.clientId || req.headers['x-client-id'] || 'server',
              timestamp: new Date().toISOString()
            });
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.end(JSON.stringify({ success: true }));
          }
        } catch (e) {}
        res.statusCode = 400;
        return res.end(JSON.stringify({ success: false }));
      });
      return;
    }

    // STATIC FILES
    let cleanUrl = reqPath;
    if (cleanUrl === '/') cleanUrl = '/index.html';

    let filePath = path.join(distDir, decodeURIComponent(cleanUrl));
    if (!filePath.startsWith(distDir)) {
      res.statusCode = 403;
      return res.end('Akses Ditolak');
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        const indexPath = path.join(distDir, 'index.html');
        fs.readFile(indexPath, (readErr, content) => {
          if (readErr) {
            res.statusCode = 404;
            return res.end('File index.html tidak ditemukan');
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content);
        });
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      fs.readFile(filePath, (readErr, content) => {
        if (readErr) {
          res.statusCode = 500;
          return res.end('Kesalahan Server');
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      });
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[SIM SARPRAS] Port ${PORT} sudah aktif. Menggunakan server yang ada.`);
      if (callback) callback(null, PORT);
    } else {
      console.error('[SIM SARPRAS] Gagal memulai internal HTTP server:', err);
      if (callback) callback(err, PORT);
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[SIM SARPRAS] Server lokal siap di http://localhost:${PORT} dan jaringan Wi-Fi 0.0.0.0:${PORT}`);
    serverInstance = server;
    if (callback) callback(null, PORT);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'SIM Sarpras SMP (Port 3030 - Realtime Server)',
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 720,
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    icon: path.join(__dirname, 'icon.svg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
  });

  Menu.setApplicationMenu(null);
  const localUrl = `http://localhost:${PORT}`;

  startLocalServer((err) => {
    if (!err) {
      mainWindow.loadURL(localUrl).catch(() => {
        mainWindow.loadFile(path.join(__dirname, 'index.html'));
      });
    } else {
      mainWindow.loadFile(path.join(__dirname, 'index.html'));
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverInstance) {
    try {
      serverInstance.close();
    } catch (e) {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
