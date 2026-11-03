/**
 * CLI Wizard Build Installer untuk SIM Sarpras SMP (Port 3030)
 * Server-Client Realtime Engine & Windows Installer (.EXE)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const RELEASE_DIR = path.join(ROOT_DIR, 'release');
const STANDALONE_DIR = path.join(RELEASE_DIR, 'SIM-Sarpras-SMP-Localhost-3030');
const { createWindowsInstallerExe } = require('./make-installer-exe.cjs');
const { buildSingleExe } = require('./build-single-exe.cjs');

function printHeader() {
  console.clear();
  console.log('================================================================');
  console.log('   ⚡ BUILD INSTALLER .EXE & SERVER-CLIENT REALTIME (3030) ⚡');
  console.log('================================================================');
  console.log(' Port Target     : http://localhost:3030');
  console.log(' Arsitektur      : Server-Client Intranet (Sinkronisasi Realtime)');
  console.log(' Database        : Terpusat di Server (data/database.json)');
  console.log(' Sistem Operasi  : Windows 10 / 11 (64-bit / 32-bit)');
  console.log(' Multi-Perangkat : Laptop Server <-> HP/Tablet/Laptop Client');
  console.log('================================================================\n');
}

function runCommand(command, label) {
  console.log(`\n[*] ${label}...`);
  console.log(`> ${command}\n`);
  try {
    execSync(command, { cwd: ROOT_DIR, stdio: 'inherit' });
    return true;
  } catch (err) {
    console.error(`\n[ERROR] Gagal saat: ${label}`);
    return false;
  }
}

function ensureDependencies() {
  if (!fs.existsSync(path.join(ROOT_DIR, 'node_modules'))) {
    const ok = runCommand('npm install', 'Memasang dependensi proyek');
    if (!ok) {
      console.error('[ERROR] npm install gagal.');
      process.exit(1);
    }
  }
}

function buildProductionBundle() {
  const ok = runCommand('npm run build', 'Mengompilasi aplikasi web produksi (Vite Build)');
  if (!ok) {
    console.error('[ERROR] Build gagal!');
    process.exit(1);
  }

  // Salin electron.cjs ke dist jika ada
  const electronSrc = path.join(ROOT_DIR, 'public', 'electron.cjs');
  const electronDest = path.join(DIST_DIR, 'electron.cjs');
  if (fs.existsSync(electronSrc)) {
    fs.copyFileSync(electronSrc, electronDest);
  }
  console.log('[+] Bundle produksi selesai dibangun di dist/');
}

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const items = fs.readdirSync(src, { withFileTypes: true });
  for (const item of items) {
    const srcPath = path.join(src, item.name);
    const destPath = path.join(dest, item.name);
    if (item.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function buildStandalonePackage() {
  console.log('\n================================================================');
  console.log('[*] Membuat Paket Standalone Server-Client Terpusat (Port 3030)...');
  console.log('================================================================');

  if (fs.existsSync(STANDALONE_DIR)) {
    fs.rmSync(STANDALONE_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(STANDALONE_DIR, { recursive: true });

  // 1. Salin dist
  console.log('[-] Menyalin aset web produksi...');
  copyDirRecursive(DIST_DIR, path.join(STANDALONE_DIR, 'dist'));

  // 2. Salin icon
  const iconSrc = path.join(ROOT_DIR, 'public', 'icon.svg');
  if (fs.existsSync(iconSrc)) {
    fs.copyFileSync(iconSrc, path.join(STANDALONE_DIR, 'icon.svg'));
  }

  // 3. Salin data/database.json terpusat
  const dataDirDest = path.join(STANDALONE_DIR, 'data');
  fs.mkdirSync(dataDirDest, { recursive: true });

  const rootDb = path.join(ROOT_DIR, 'data', 'database.json');
  if (fs.existsSync(rootDb)) {
    fs.copyFileSync(rootDb, path.join(dataDirDest, 'database.json'));
  } else {
    const { getInitialDatabase } = require('./init-default-db.cjs');
    fs.writeFileSync(path.join(dataDirDest, 'database.json'), JSON.stringify(getInitialDatabase(), null, 2), 'utf8');
  }

  // 4. Buat file server.cjs Mandiri (Real-time SSE + Central Database + Zero Dependency)
  console.log('[-] Menyiapkan server mandiri terpusat dengan real-time Server-Sent Events...');
  const standaloneServerCode = `/**
 * SERVER LOKAL TERPUSAT SIM SARPRAS SMP (PORT 3030)
 * Server-Client Realtime Architecture dengan SSE & Database Terpusat.
 * Zero-Dependency: Berjalan langsung dengan Node.js murni!
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3030;
const DIST_DIR = path.join(__dirname, 'dist');
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

const sseClients = new Set();
const connectedSessions = new Map();
const sessionHistory = [];

function getClientIp(req) {
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  if (ip.includes(',')) ip = ip.split(',')[0].trim();
  if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');
  if (ip === '::1' || ip === '127.0.0.1') return '127.0.0.1 (Server)';
  return ip;
}

// Bersihkan sesi kadaluarsa
setInterval(() => {
  const now = Date.now();
  let changed = false;
  for (const [id, s] of connectedSessions.entries()) {
    if (now - s.lastSeenMs > 45000) {
      s.isOnline = false;
      sessionHistory.unshift({ ...s });
      if (sessionHistory.length > 50) sessionHistory.pop();
      connectedSessions.delete(id);
      changed = true;
    }
  }
  if (changed) {
    broadcastUpdate({
      type: 'PRESENCE_CHANGE',
      activeCount: connectedSessions.size,
      activeClients: Array.from(connectedSessions.values())
    });
  }
}, 15000);
let inMemoryDb = null;

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      inMemoryDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Gagal membaca database.json:', e);
  }
  if (!inMemoryDb) {
    inMemoryDb = {
      schoolProfile: {
        nama: "SMP Negeri 3 Kras",
        kementerian: "Kementerian Pendidikan dan Kebudayaan",
        alamat: "Jl. Pendidikan No. 123",
        logoAplikasi: "/icon.svg"
      },
      rooms: [],
      assets: [],
      borrowings: [],
      consumables: [],
      procurements: [],
      mutations: [],
      maintenances: [],
      stocktakes: [],
      disposals: [],
      lastUpdated: new Date().toISOString()
    };
    saveDatabase();
  }
  return inMemoryDb;
}

function saveDatabase() {
  if (!inMemoryDb) return;
  try {
    inMemoryDb.lastUpdated = new Date().toISOString();
    const temp = DB_FILE + '.tmp';
    fs.writeFileSync(temp, JSON.stringify(inMemoryDb, null, 2), 'utf8');
    fs.renameSync(temp, DB_FILE);
  } catch (e) {
    console.error('Gagal menulis database:', e);
  }
}

function broadcastUpdate(payload) {
  const message = 'data: ' + JSON.stringify(payload) + '\\n\\n';
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

// Heartbeat keepalive setiap 20 detik
setInterval(() => {
  const ping = 'data: {"type":"PING","time":"' + new Date().toISOString() + '"}\\n\\n';
  for (const client of sseClients) {
    try { client.write(ping); } catch (e) { sseClients.delete(client); }
  }
}, 20000);

const MIME_TYPES = {
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

function getLocalIps() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const isVirtual = /virtual|vmware|vbox|wsl|hyper-v|loopback/i.test(name);
        const isWifi = /wi-?fi|wireless|wlan/i.test(name);
        const isEthernet = /ethernet|lan/i.test(name) && !isVirtual;

        ips.push({
          name,
          ip: iface.address,
          isWifi,
          isEthernet,
          label: isWifi ? '[WI-FI UTAMA]' : (isEthernet ? '[KABEL LAN]' : '[JARINGAN]')
        });
      }
    }
  }

  ips.sort((a, b) => (b.isWifi ? 1 : 0) - (a.isWifi ? 1 : 0));
  return ips;
}

loadDatabase();

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const [reqPath] = req.url.split('?');

  // 1. API: Server-Sent Events (Realtime Stream)
  if (reqPath === '/api/realtime') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    sseClients.add(res);

    res.write('data: ' + JSON.stringify({
      type: 'CONNECTED',
      clientCount: sseClients.size,
      time: new Date().toISOString()
    }) + '\\n\\n');

    req.on('close', () => sseClients.delete(res));
    return;
  }

  // 1.5. API: Presence Heartbeat Klien
  if (reqPath === '/api/presence' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        if (parsed.clientId) {
          const clientIp = getClientIp(req);
          const now = Date.now();
          const existing = connectedSessions.get(parsed.clientId);
          const sessionData = {
            id: parsed.clientId,
            ip: clientIp,
            deviceName: parsed.deviceName || (parsed.deviceType === 'mobile' ? 'Smartphone' : 'Laptop / PC'),
            deviceType: parsed.deviceType || 'desktop',
            os: parsed.os || 'Windows',
            browser: parsed.browser || 'Browser',
            page: parsed.page || 'Portal Peminjaman',
            path: parsed.path || '/portal-peminjaman',
            role: parsed.role || 'Siswa / Peminjam',
            userName: parsed.userName || 'Pengguna Portal',
            isHost: clientIp.includes('127.0.0.1') || clientIp.includes('Server'),
            connectedAt: existing ? existing.connectedAt : new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            lastSeenMs: now,
            isOnline: true
          };
          connectedSessions.set(parsed.clientId, sessionData);
          if (!existing) {
            broadcastUpdate({
              type: 'CLIENT_JOINED',
              client: sessionData,
              activeCount: connectedSessions.size
            });
          }
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          return res.end(JSON.stringify({ success: true, activeCount: connectedSessions.size }));
        }
      } catch (e) {}
      res.statusCode = 400;
      return res.end(JSON.stringify({ success: false }));
    });
    return;
  }

  // 1.6. API: Active Clients List & History
  if (reqPath === '/api/active-clients' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const clients = Array.from(connectedSessions.values());
    return res.end(JSON.stringify({
      success: true,
      totalActive: clients.length,
      activeClients: clients,
      recentHistory: sessionHistory.slice(0, 50),
      summary: {
        totalActive: clients.length,
        mobileCount: clients.filter(c => c.deviceType === 'mobile').length,
        desktopCount: clients.filter(c => c.deviceType === 'desktop' || c.deviceType === 'tablet').length,
        portalCount: clients.filter(c => c.role?.toLowerCase().includes('siswa') || c.path?.includes('portal')).length,
        adminCount: clients.filter(c => c.role?.toLowerCase().includes('admin')).length
      }
    }));
  }

  // 1.7. API: Broadcast Alert
  if (reqPath === '/api/broadcast-alert' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        broadcastUpdate({
          type: 'BROADCAST_ALERT',
          title: parsed.title || 'Pengumuman Sarpras',
          message: parsed.message || '',
          sender: parsed.sender || 'Administrator',
          level: parsed.level || 'info',
          timestamp: new Date().toISOString()
        });
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.end(JSON.stringify({ success: true }));
      } catch (e) {}
      res.statusCode = 400;
      return res.end(JSON.stringify({ success: false }));
    });
    return;
  }

  // 2. API: Server Info
  if (reqPath === '/api/server-info') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const localIps = getLocalIps();
    return res.end(JSON.stringify({
      success: true,
      appName: 'SIM Sarpras SMP',
      port: PORT,
      connectedClients: sseClients.size,
      localIps: localIps.map(item => ({
        interface: item.name,
        ip: item.ip,
        label: item.label,
        url: 'http://' + item.ip + ':' + PORT,
        portalUrl: 'http://' + item.ip + ':' + PORT + '/#/portal-peminjaman'
      }))
    }));
  }

  // 3. API: Ambil Seluruh Data
  if (reqPath === '/api/data' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ success: true, data: inMemoryDb }));
  }

  // 4. API: Ambil Koleksi Tertentu
  if (reqPath.startsWith('/api/data/') && req.method === 'GET') {
    const key = reqPath.replace('/api/data/', '');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (key in inMemoryDb) {
      return res.end(JSON.stringify({ success: true, key, data: inMemoryDb[key] }));
    }
    res.statusCode = 404;
    return res.end(JSON.stringify({ success: false, message: 'Not found' }));
  }

  // 5. API: Perbarui Koleksi & Broadcast Realtime
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
          return res.end(JSON.stringify({ success: true, updatedAt: inMemoryDb.lastUpdated }));
        }
      } catch (err) {}
      res.statusCode = 400;
      return res.end(JSON.stringify({ success: false }));
    });
    return;
  }

  // 6. API: Batch Sync
  if (reqPath === '/api/data-batch' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        if (parsed.data) {
          inMemoryDb = { ...inMemoryDb, ...parsed.data };
          saveDatabase();
          broadcastUpdate({
            type: 'FULL_SYNC',
            data: inMemoryDb,
            senderId: parsed.clientId || 'server',
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

  // 7. API: Reset Data
  if (reqPath === '/api/data-reset' && req.method === 'POST') {
    const rootInit = path.join(__dirname, 'scripts', 'init-default-db.cjs');
    if (fs.existsSync(rootInit)) {
      const { getInitialDatabase } = require(rootInit);
      inMemoryDb = getInitialDatabase();
    } else {
      inMemoryDb = {
        schoolProfile: { nama: "SMP Negeri 3 Kras" },
        rooms: [], assets: [], borrowings: [], consumables: [],
        procurements: [], mutations: [], maintenances: [], stocktakes: [], disposals: []
      };
    }
    saveDatabase();
    broadcastUpdate({ type: 'FULL_SYNC', data: inMemoryDb, senderId: 'server' });
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ success: true }));
  }

  // Melayani file statis SPA
  let cleanUrl = reqPath;
  if (cleanUrl === '/') cleanUrl = '/index.html';

  let filePath = path.join(DIST_DIR, decodeURIComponent(cleanUrl));
  if (!filePath.startsWith(DIST_DIR)) {
    res.statusCode = 403;
    return res.end('Akses Ditolak');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const indexPath = path.join(DIST_DIR, 'index.html');
      fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.statusCode = 404;
          return res.end('File index.html tidak ditemukan!');
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.statusCode = 500;
        return res.end('Gagal membaca file');
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('\\n[PERINGATAN] Port ' + PORT + ' sedang digunakan aplikasi lain.');
    console.error('Silakan jalankan file HENTIKAN_APLIKASI.bat lalu coba lagi.\\n');
  } else {
    console.error('[ERROR] Server error:', err);
  }
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  const localIps = getLocalIps();
  console.log('================================================================');
  console.log('  🚀 SERVER TERPUSAT SIM SARPRAS SMP AKTIF (PORT 3030)');
  console.log('================================================================');
  console.log(' AKSES SERVER DI KOMPUTER INI:');
  console.log(' -> http://localhost:' + PORT);
  console.log('----------------------------------------------------------------');
  console.log(' AKSES KLIEN DARI HP / LAPTOP DI WI-FI SEKOLAH:');
  if (localIps.length === 0) {
    console.log(' [!] Komputer belum terhubung ke Wi-Fi / Jaringan.');
  } else {
    localIps.forEach((item, idx) => {
      console.log(' [' + (idx + 1) + '] ' + item.label + ' ' + item.name);
      console.log('     Alamat Akses : http://' + item.ip + ':' + PORT);
      console.log('     Portal Siswa : http://' + item.ip + ':' + PORT + '/#/portal-peminjaman');
    });
  }
  console.log('================================================================');
  console.log(' SINKRONISASI REAL-TIME:');
  console.log(' * Seluruh perubahan data (Server <-> Client) terhubung seketika.');
  console.log(' * Jangan tutup jendela ini selama aplikasi digunakan.');
  console.log(' * Tekan Ctrl + C untuk mematikan server.');
  console.log('================================================================\\n');
});
`;
  fs.writeFileSync(path.join(STANDALONE_DIR, 'server.cjs'), standaloneServerCode.replace(/\n/g, '\r\n'), 'utf8');

  // 5. File batch pendukung
  console.log('[-] Menyiapkan skrip peluncur dan installer Windows...');

  // JALANKAN_APLIKASI.bat
  const runBat = [
    '@echo off',
    'title SIM SARPRAS SMP - SERVER TERPUSAT (PORT 3030)',
    'color 0B',
    'cd /d "%~dp0"',
    'echo ======================================================================',
    'echo      SIM SARPRAS SMP - SERVER TERPUSAT & KLIEN (PORT 3030)',
    'echo ======================================================================',
    'echo  Aplikasi Berjalan di : http://localhost:3030',
    'echo  Database Terpusat    : data/database.json',
    'echo ======================================================================',
    'echo.',
    'where node >nul 2>&1',
    'if %errorlevel% neq 0 (',
    '    echo [ERROR] Node.js belum terpasang di komputer ini!',
    '    echo Silakan unduh dari https://nodejs.org/',
    '    pause',
    '    exit /b',
    ')',
    'start "" "http://localhost:3030"',
    'node server.cjs',
    'pause'
  ].join('\r\n');
  fs.writeFileSync(path.join(STANDALONE_DIR, 'JALANKAN_APLIKASI.bat'), runBat, 'utf8');

  // JALANKAN_LATAR_BELAKANG.vbs
  const vbsSilent = [
    'Set WshShell = CreateObject("WScript.Shell")',
    'WshShell.Run "cmd /c node server.cjs", 0, False',
    'WScript.Sleep 1500',
    'WshShell.Run "http://localhost:3030"'
  ].join('\r\n');
  fs.writeFileSync(path.join(STANDALONE_DIR, 'JALANKAN_LATAR_BELAKANG.vbs'), vbsSilent, 'utf8');

  // PASANG_PINTASAN_DESKTOP.bat
  const shortcutBat = [
    '@echo off',
    'title PEMASANG PINTASAN DESKTOP - SIM SARPRAS SMP',
    'color 0A',
    'cd /d "%~dp0"',
    'echo ======================================================================',
    'echo       PEMASANG PINTASAN DESKTOP (SIM SARPRAS SMP PORT 3030)',
    'echo ======================================================================',
    'echo.',
    'echo Sedang membuat pintasan ke Desktop Windows...',
    'set "CURRENT_DIR=%~dp0"',
    'set "BAT_PATH=%CURRENT_DIR%JALANKAN_APLIKASI.bat"',
    'echo Set oWS = WScript.CreateObject("WScript.Shell") > "%temp%\\CreateShortcut.vbs"',
    'echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\\SIM Sarpras SMP 3030.lnk" >> "%temp%\\CreateShortcut.vbs"',
    'echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%temp%\\CreateShortcut.vbs"',
    'echo oLink.TargetPath = "%BAT_PATH%" >> "%temp%\\CreateShortcut.vbs"',
    'echo oLink.WorkingDirectory = "%CURRENT_DIR%" >> "%temp%\\CreateShortcut.vbs"',
    'echo oLink.Description = "SIM Sarpras SMP - Server & Client Realtime (Port 3030)" >> "%temp%\\CreateShortcut.vbs"',
    'echo oLink.Save >> "%temp%\\CreateShortcut.vbs"',
    'cscript //nologo "%temp%\\CreateShortcut.vbs"',
    'del "%temp%\\CreateShortcut.vbs"',
    'echo.',
    'echo [SUKSES] Pintasan "SIM Sarpras SMP 3030" telah dibuat di Desktop!',
    'echo.',
    'pause'
  ].join('\r\n');
  fs.writeFileSync(path.join(STANDALONE_DIR, 'PASANG_PINTASAN_DESKTOP.bat'), shortcutBat, 'utf8');

  // BUKA_FIREWALL_PORT_3030.bat
  const firewallBat = [
    '@echo off',
    'title BUKA FIREWALL PORT 3030 - SIM SARPRAS SMP',
    'color 0B',
    'cd /d "%~dp0"',
    'net session >nul 2>&1',
    'if %errorlevel% neq 0 (',
    '    echo Meminta izin Administrator...',
    '    powershell -Command "Start-Process cmd -ArgumentList \'/c \"\"%~f0\"\"\' -Verb RunAs"',
    '    exit /b',
    ')',
    'echo Membuka Port 3030 Inbound TCP untuk akses client di Wi-Fi...',
    'netsh advfirewall firewall delete rule name="SIM Sarpras SMP - Port 3030" >nul 2>&1',
    'netsh advfirewall firewall add rule name="SIM Sarpras SMP - Port 3030" dir=in action=allow protocol=TCP localport=3030 profile=any',
    'echo.',
    'echo [SUKSES] Port 3030 telah terbuka di firewall! HP dan perangkat lain siap terhubung.',
    'echo.',
    'ipconfig | findstr /i "IPv4"',
    'echo.',
    'pause'
  ].join('\r\n');
  fs.writeFileSync(path.join(STANDALONE_DIR, 'BUKA_FIREWALL_PORT_3030.bat'), firewallBat, 'utf8');

  // HENTIKAN_APLIKASI.bat
  const stopBat = [
    '@echo off',
    'title HENTIKAN SERVER SIM SARPRAS SMP (PORT 3030)',
    'color 0C',
    'cd /d "%~dp0"',
    'echo Menghentikan proses port 3030...',
    'for /f "tokens=5" %%a in (\'netstat -ano ^| findstr :3030 ^| findstr LISTENING\') do (',
    '    taskkill /F /PID %%a >nul 2>&1',
    ')',
    'echo [SELESAI] Server port 3030 dihentikan.',
    'pause'
  ].join('\r\n');
  fs.writeFileSync(path.join(STANDALONE_DIR, 'HENTIKAN_APLIKASI.bat'), stopBat, 'utf8');

  console.log('[+] Paket Standalone Portabel siap di:');
  console.log(`    ${STANDALONE_DIR}`);
}

function buildElectronInstaller() {
  console.log('\n================================================================');
  console.log('[*] Membangun Installer Executable Windows (.exe) Port 3030...');
  console.log('================================================================');

  try {
    execSync('npx electron-builder --win -c.extraMetadata.main=dist/electron.cjs', {
      cwd: ROOT_DIR,
      stdio: 'inherit'
    });
    console.log('\n[+] Installer Windows (.exe) berhasil dibuat di release/');
  } catch (e) {
    console.log('\n[INFO] Build Electron .exe dilewati atau memerlukan internet.');
  }

  // Buat juga Installer Executable Mandiri (.EXE)
  createWindowsInstallerExe();
}

function testRunNow() {
  console.log('\n[*] Menjalankan Server Terpusat langsung pada http://localhost:3030...');
  process.env.LOCAL_PORT = '3030';
  const serverPath = path.join(ROOT_DIR, 'server-lokal.cjs');

  const openCmd = process.platform === 'win32' ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
  try {
    execSync(`${openCmd} http://localhost:3030`);
  } catch (e) {}

  require(serverPath);
}

function main() {
  printHeader();
  ensureDependencies();

  const arg = process.argv[2];
  if (arg === '--single-exe' || arg === '--exe') {
    buildProductionBundle();
    buildStandalonePackage();
    buildSingleExe();
    process.exit(0);
  }
  if (arg === '--all') {
    buildProductionBundle();
    buildStandalonePackage();
    buildSingleExe();
    buildElectronInstaller();
    process.exit(0);
  }
  if (arg === '--standalone') {
    buildProductionBundle();
    buildStandalonePackage();
    process.exit(0);
  }
  if (arg === '--run') {
    buildProductionBundle();
    testRunNow();
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('PILIH OPSI BUILD:');
  console.log(' [1] 1 FILE .EXE TUNGGAL (SIM-Sarpras-SMP.exe) - Server & Client Realtime (Paling Praktis)');
  console.log(' [2] PAKET STANDALONE LENGKAP: Server-Client Realtime (Folder Portabel Wi-Fi Sekolah)');
  console.log(' [3] INSTALLER WINDOWS .EXE + PAKET LENGKAP');
  console.log(' [4] UJI COBA: Jalankan Server & Buka http://localhost:3030 Sekarang');
  console.log('----------------------------------------------------------------');

  rl.question('Masukkan pilihan (1/2/3/4) [Default 1]: ', (answer) => {
    rl.close();
    const choice = answer.trim() || '1';

    console.log('\nMemproses pilihan ' + choice + '...\n');
    buildProductionBundle();

    if (choice === '1') {
      buildStandalonePackage();
      buildSingleExe();
    } else if (choice === '2') {
      buildStandalonePackage();
      createWindowsInstallerExe();
    } else if (choice === '3') {
      buildStandalonePackage();
      buildSingleExe();
      buildElectronInstaller();
    } else if (choice === '4') {
      testRunNow();
      return;
    }

    console.log('\n================================================================');
    console.log('    🎉 PROSES BUILD INSTALLER SELESAI DENGAN SUKSES! 🎉');
    console.log('================================================================');
    console.log(' Port Aplikasi    : http://localhost:3030');
    console.log(' File Tunggal     : release/SIM-Sarpras-SMP.exe');
    console.log(' Folder Rilis     : release/SIM-Sarpras-SMP-Localhost-3030');
    console.log(' Database Terpusat: data/database.json');
    console.log(' Sinkronisasi     : Realtime Server-Client Aktif');
    console.log('================================================================\n');
  });
}

main();
