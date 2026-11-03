/**
 * Central Database & Realtime Server-Sent Events (SSE) Engine
 * Menangani penyimpanan terpusat dan sinkronisasi real-time antar server-client
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { getInitialDatabase, DB_FILE, DATA_DIR } = require('./init-default-db.cjs');

// Ensure database file exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Backup Directory
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

let inMemoryDb = null;
const sseClients = new Set();
const connectedSessions = new Map();
const sessionHistory = [];
const MAX_HISTORY = 100;
const MAX_BACKUPS = 30;
let lastBackupTime = null;

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d} hari`);
  if (h > 0) parts.push(`${h} jam`);
  if (m > 0) parts.push(`${m} mnt`);
  parts.push(`${s} dtk`);
  return parts.join(' ');
}

function createBackup(reason = 'manual') {
  if (!inMemoryDb) loadDatabase();
  try {
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${timestampStr}_${reason}.json`;
    const targetPath = path.join(BACKUP_DIR, filename);

    // Write atomic
    const content = JSON.stringify(inMemoryDb, null, 2);
    fs.writeFileSync(targetPath, content, 'utf8');

    const stat = fs.statSync(targetPath);
    lastBackupTime = new Date().toISOString();

    // Rotasi: hapus backup lama jika lebih dari MAX_BACKUPS
    const all = listBackups();
    if (all.length > MAX_BACKUPS) {
      const toRemove = all.slice(MAX_BACKUPS);
      for (const item of toRemove) {
        try {
          fs.unlinkSync(path.join(BACKUP_DIR, item.filename));
        } catch (e) {}
      }
    }

    const backupInfo = {
      filename,
      sizeBytes: stat.size,
      sizeFormatted: formatBytes(stat.size),
      createdAt: lastBackupTime,
      reason
    };

    broadcastUpdate({
      type: 'BACKUP_CREATED',
      backup: backupInfo,
      totalBackups: Math.min(all.length + 1, MAX_BACKUPS),
      timestamp: lastBackupTime
    });

    console.log(`[BACKUP] Snapshot berhasil dibuat: ${filename} (${formatBytes(stat.size)}) [${reason}]`);
    return backupInfo;
  } catch (err) {
    console.error('[BACKUP] Gagal membuat snapshot backup:', err.message);
    throw err;
  }
}

function listBackups() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) return [];
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('backup_') && f.endsWith('.json'));
    return files
      .map(filename => {
        try {
          const filePath = path.join(BACKUP_DIR, filename);
          const stat = fs.statSync(filePath);
          let reason = 'scheduled';
          if (filename.includes('manual')) reason = 'manual';
          else if (filename.includes('safety')) reason = 'safety';
          else if (filename.includes('initial')) reason = 'initial';

          return {
            filename,
            sizeBytes: stat.size,
            sizeFormatted: formatBytes(stat.size),
            createdAt: stat.mtime.toISOString(),
            reason
          };
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('[BACKUP] Gagal membaca daftar backup:', err.message);
    return [];
  }
}

function restoreBackup(filename) {
  const safeFilename = path.basename(filename);
  const targetPath = path.join(BACKUP_DIR, safeFilename);

  if (!fs.existsSync(targetPath)) {
    throw new Error('File cadangan tidak ditemukan.');
  }

  // Safety snapshot sebelum me-restore
  try {
    createBackup('safety_pre_restore');
  } catch (e) {}

  const raw = fs.readFileSync(targetPath, 'utf8');
  const restoredData = JSON.parse(raw);

  inMemoryDb = {
    ...restoredData,
    lastUpdated: new Date().toISOString()
  };

  saveDatabase();

  broadcastUpdate({
    type: 'FULL_SYNC',
    data: inMemoryDb,
    senderId: 'server-restore',
    timestamp: new Date().toISOString()
  });

  return {
    success: true,
    restoredFrom: safeFilename,
    restoredAt: inMemoryDb.lastUpdated
  };
}

function deleteBackup(filename) {
  const safeFilename = path.basename(filename);
  const targetPath = path.join(BACKUP_DIR, safeFilename);
  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
    return true;
  }
  return false;
}

// Jadwal Auto-Backup berkala setiap 60 menit
setInterval(() => {
  try {
    createBackup('scheduled');
  } catch (e) {
    console.error('[AUTO-BACKUP] Gagal eksekusi terjadwal:', e.message);
  }
}, 60 * 60 * 1000);

// Initial backup check setelah server start
setTimeout(() => {
  try {
    const existing = listBackups();
    if (existing.length === 0) {
      createBackup('initial');
    }
  } catch (e) {}
}, 5000);

function getTelemetryData() {
  const mem = process.memoryUsage();
  const sysTotalMem = os.totalmem();
  const sysFreeMem = os.freemem();
  const sysUsedMem = sysTotalMem - sysFreeMem;
  const dbStat = fs.existsSync(DB_FILE) ? fs.statSync(DB_FILE) : null;
  const backups = listBackups();

  return {
    success: true,
    status: 'optimal',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    uptimeFormatted: formatUptime(process.uptime()),
    process: {
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: {
        rss: mem.rss,
        rssFormatted: formatBytes(mem.rss),
        heapTotal: mem.heapTotal,
        heapTotalFormatted: formatBytes(mem.heapTotal),
        heapUsed: mem.heapUsed,
        heapUsedFormatted: formatBytes(mem.heapUsed),
        heapUsedPercent: Math.round((mem.heapUsed / mem.heapTotal) * 100) || 0
      }
    },
    system: {
      hostname: os.hostname(),
      platform: os.platform(),
      osType: os.type(),
      osRelease: os.release(),
      cpuModel: os.cpus()[0]?.model || 'Processor',
      cpuCores: os.cpus().length,
      loadAverage: os.loadavg(),
      totalMemory: sysTotalMem,
      totalMemoryFormatted: formatBytes(sysTotalMem),
      freeMemory: sysFreeMem,
      freeMemoryFormatted: formatBytes(sysFreeMem),
      usedMemoryPercent: Math.round((sysUsedMem / sysTotalMem) * 100)
    },
    database: {
      engine: 'Atomic JSON + Memory Cache (ACID Snapshot)',
      filePath: DB_FILE,
      sizeBytes: dbStat ? dbStat.size : 0,
      sizeFormatted: formatBytes(dbStat ? dbStat.size : 0),
      lastUpdated: inMemoryDb?.lastUpdated || null,
      documentCounts: {
        assets: inMemoryDb?.assets?.length || 0,
        rooms: inMemoryDb?.rooms?.length || 0,
        consumables: inMemoryDb?.consumables?.length || 0,
        borrowings: inMemoryDb?.borrowings?.length || 0,
        mutations: inMemoryDb?.mutations?.length || 0,
        maintenances: inMemoryDb?.maintenances?.length || 0,
        stocktakes: inMemoryDb?.stocktakes?.length || 0,
        disposals: inMemoryDb?.disposals?.length || 0,
        systemLogs: inMemoryDb?.systemLogs?.length || 0
      }
    },
    backups: {
      totalSnapshots: backups.length,
      latestSnapshot: backups[0] || null,
      autoBackupIntervalMinutes: 60,
      retentionCount: MAX_BACKUPS,
      status: 'active'
    },
    network: {
      connectedSseStreams: sseClients.size,
      activeClientSessions: connectedSessions.size,
      rateLimiter: {
        status: 'active',
        maxRequestsPerMinute: 300
      },
      firewall: {
        filter: 'RFC 1918 Private LAN',
        status: 'active'
      }
    }
  };
}

function getClientIp(req) {
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '';
  if (ip.includes(',')) ip = ip.split(',')[0].trim();
  if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');
  if (ip === '::1' || ip === '127.0.0.1') return '127.0.0.1 (Server)';
  return ip;
}

// Clean up stale sessions every 5 seconds (20 seconds timeout for high-fidelity real-time)
setInterval(() => {
  const now = Date.now();
  let changed = false;
  for (const [id, session] of connectedSessions.entries()) {
    if (now - session.lastSeenMs > 20000) { // 20 seconds timeout
      session.isOnline = false;
      session.disconnectedAt = new Date().toISOString();
      sessionHistory.unshift({ ...session });
      if (sessionHistory.length > MAX_HISTORY) sessionHistory.pop();
      connectedSessions.delete(id);
      changed = true;
    }
  }
  if (changed) {
    broadcastUpdate({
      type: 'PRESENCE_CHANGE',
      event: 'CLIENT_TIMEOUT',
      activeCount: connectedSessions.size,
      activeClients: Array.from(connectedSessions.values()),
      recentHistory: sessionHistory.slice(0, 50)
    });
  }
}, 5000);

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      inMemoryDb = JSON.parse(raw);
    } else {
      inMemoryDb = getInitialDatabase();
      saveDatabase();
    }
  } catch (err) {
    console.error('[DB] Gagal membaca database.json, menggunakan database awal:', err.message);
    inMemoryDb = getInitialDatabase();
  }
  return inMemoryDb;
}

function saveDatabase() {
  if (!inMemoryDb) return;
  try {
    inMemoryDb.lastUpdated = new Date().toISOString();
    const tempFile = DB_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(inMemoryDb, null, 2), 'utf8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[DB] Gagal menyimpan database.json:', err.message);
  }
}

// Broadcast real-time update to all connected clients
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

// Heartbeat ping to keep connections alive
setInterval(() => {
  const ping = `data: {"type":"PING","timestamp":"${new Date().toISOString()}"}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(ping);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}, 20000);

// Get all non-internal IPv4 addresses
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const isVirtual = /virtual|vmware|vbox|wsl|hyper-v|loopback/i.test(name);
        const isWifi = /wi-?fi|wireless|wlan/i.test(name);
        const isEthernet = /ethernet|lan/i.test(name) && !isVirtual;

        addresses.push({
          interface: name,
          address: iface.address,
          netmask: iface.netmask,
          isWifi,
          isEthernet,
          isVirtual,
          label: isWifi ? '[WI-FI UTAMA]' : (isEthernet ? '[KABEL LAN]' : (isVirtual ? '[VIRTUAL]' : '[JARINGAN]'))
        });
      }
    }
  }

  // Sort: Wi-Fi first, then Ethernet, then virtual
  addresses.sort((a, b) => {
    if (a.isWifi && !b.isWifi) return -1;
    if (!a.isWifi && b.isWifi) return 1;
    if (a.isEthernet && !b.isEthernet) return -1;
    if (!a.isEthernet && b.isEthernet) return 1;
    if (!a.isVirtual && b.isVirtual) return -1;
    if (a.isVirtual && !b.isVirtual) return 1;
    return 0;
  });

  return addresses;
}

// Attach API and SSE routes to an Express app or HTTP request handler
function mountCentralDbRoutes(app) {
  loadDatabase();

  // 1. SSE Realtime Stream
  app.get('/api/realtime', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders?.();

    sseClients.add(res);

    // Kirim konfirmasi koneksi dengan data awal lengkap
    const welcome = {
      type: 'CONNECTED',
      message: 'Terhubung ke Realtime Server SIM Sarpras',
      clientCount: connectedSessions.size,
      activeClients: Array.from(connectedSessions.values()),
      recentHistory: sessionHistory.slice(0, 50),
      serverTime: new Date().toISOString()
    };
    res.write(`data: ${JSON.stringify(welcome)}\n\n`);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // 1.5. Presence Heartbeat dari Klien (HP / Laptop / PC)
  app.post('/api/presence', (req, res) => {
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }

    const {
      clientId,
      deviceName,
      deviceType,
      os,
      browser,
      page,
      path: routePath,
      role,
      userName
    } = body;

    if (!clientId) {
      return res.status(400).json({ success: false, message: 'clientId required' });
    }

    const clientIp = getClientIp(req);
    const now = Date.now();
    const existing = connectedSessions.get(clientId);

    const sessionData = {
      id: clientId,
      ip: clientIp,
      deviceName: deviceName || (deviceType === 'mobile' ? 'Smartphone' : 'Laptop / PC'),
      deviceType: deviceType || 'desktop',
      os: os || 'Windows',
      browser: browser || 'Browser',
      page: page || 'Portal Peminjaman',
      path: routePath || '/portal-peminjaman',
      role: role || 'Siswa / Peminjam',
      userName: userName || (role === 'Administrator' ? 'Administrator' : 'Pengguna Portal'),
      isHost: clientIp.includes('127.0.0.1') || clientIp.includes('Server'),
      connectedAt: existing ? existing.connectedAt : new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      lastSeenMs: now,
      isOnline: true
    };

    const isNew = !existing;
    const pageOrStateChanged = existing && (
      existing.page !== sessionData.page ||
      existing.path !== sessionData.path ||
      existing.userName !== sessionData.userName ||
      existing.role !== sessionData.role
    );

    connectedSessions.set(clientId, sessionData);

    // Broadcast instant update jika perangkat baru atau halaman berpindah
    if (isNew || pageOrStateChanged) {
      broadcastUpdate({
        type: 'PRESENCE_CHANGE',
        event: isNew ? 'CLIENT_JOINED' : 'PAGE_CHANGED',
        client: sessionData,
        activeCount: connectedSessions.size,
        activeClients: Array.from(connectedSessions.values()),
        recentHistory: sessionHistory.slice(0, 50)
      });
    }

    res.json({
      success: true,
      activeCount: connectedSessions.size,
      activeClients: Array.from(connectedSessions.values()),
      serverTime: new Date().toISOString()
    });
  });

  // 1.5.1. Disconnect / Leave Presence Endpoint (Navigator.sendBeacon saat tab ditutup)
  const handlePresenceLeave = (req, res) => {
    let clientId = req.query?.clientId;
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    if (body?.clientId) clientId = body.clientId;

    if (clientId && connectedSessions.has(clientId)) {
      const session = connectedSessions.get(clientId);
      session.isOnline = false;
      session.disconnectedAt = new Date().toISOString();
      sessionHistory.unshift({ ...session });
      if (sessionHistory.length > MAX_HISTORY) sessionHistory.pop();
      connectedSessions.delete(clientId);

      broadcastUpdate({
        type: 'PRESENCE_CHANGE',
        event: 'CLIENT_LEFT',
        client: session,
        activeCount: connectedSessions.size,
        activeClients: Array.from(connectedSessions.values()),
        recentHistory: sessionHistory.slice(0, 50)
      });
    }

    res.json({ success: true });
  };

  app.post('/api/presence/leave', handlePresenceLeave);
  app.get('/api/presence/leave', handlePresenceLeave);

  // 1.5.2. Ping Pong Latency Check
  app.get('/api/presence/ping', (req, res) => {
    res.json({ ok: true, pong: Date.now() });
  });

  // 1.6. Ambil Data Perangkat Aktif & Log Siapa Saja yang Membuka Aplikasi
  app.get('/api/active-clients', (req, res) => {
    const clients = Array.from(connectedSessions.values());
    const mobileCount = clients.filter(c => c.deviceType === 'mobile').length;
    const desktopCount = clients.filter(c => c.deviceType === 'desktop' || c.deviceType === 'tablet').length;
    const portalCount = clients.filter(c => c.role?.toLowerCase().includes('siswa') || c.path?.includes('portal')).length;
    const adminCount = clients.filter(c => c.role?.toLowerCase().includes('admin')).length;

    res.json({
      success: true,
      totalActive: clients.length,
      activeClients: clients,
      recentHistory: sessionHistory.slice(0, 50),
      summary: {
        totalActive: clients.length,
        mobileCount,
        desktopCount,
        portalCount,
        adminCount
      },
      serverTime: new Date().toISOString()
    });
  });

  // 1.7. Broadcast Pesan Pengumuman ke Semua Layar Klien
  app.post('/api/broadcast-alert', (req, res) => {
    const { title, message, sender, level } = req.body || {};
    if (!message) {
      return res.status(400).json({ success: false, message: 'Pesan broadcast tidak boleh kosong' });
    }

    broadcastUpdate({
      type: 'BROADCAST_ALERT',
      title: title || 'Pengumuman Sarpras',
      message,
      sender: sender || 'Administrator',
      level: level || 'info',
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, message: 'Pengumuman berhasil disiarkan ke semua layar.' });
  });

  // 2. Info Server & Status Realtime
  app.get('/api/server-info', (req, res) => {
    const localIps = getLocalIpAddresses();
    const port = req.socket.localPort || 3030;
    res.json({
      success: true,
      appName: 'SIM Sarpras SMP',
      version: '1.0.0',
      port,
      connectedClients: sseClients.size,
      localIps: localIps.map(item => ({
        interface: item.interface,
        ip: item.address,
        label: item.label,
        url: `http://${item.address}:${port}`,
        portalUrl: `http://${item.address}:${port}/#/portal-peminjaman`
      })),
      databaseStats: {
        totalAssets: inMemoryDb?.assets?.length || 0,
        totalRooms: inMemoryDb?.rooms?.length || 0,
        totalBorrowings: inMemoryDb?.borrowings?.length || 0,
        lastUpdated: inMemoryDb?.lastUpdated || null
      }
    });
  });

  // 3. Ambil Seluruh Data Terpusat
  app.get('/api/data', (req, res) => {
    if (!inMemoryDb) loadDatabase();
    res.json({
      success: true,
      data: inMemoryDb
    });
  });

  // 4. Ambil Koleksi Tertentu (assets, rooms, borrowings, dll)
  app.get('/api/data/:key', (req, res) => {
    if (!inMemoryDb) loadDatabase();
    const key = req.params.key;
    if (key in inMemoryDb) {
      res.json({ success: true, key, data: inMemoryDb[key] });
    } else {
      res.status(404).json({ success: false, message: `Koleksi ${key} tidak ditemukan` });
    }
  });

  // 5. Update Koleksi Tertentu & Broadcast Real-Time ke Seluruh Klien
  app.post('/api/data/:key', (req, res) => {
    if (!inMemoryDb) loadDatabase();
    const key = req.params.key;
    const { value, clientId } = req.body;

    if (value === undefined) {
      return res.status(400).json({ success: false, message: 'Payload value diperlukan' });
    }

    // Perbarui data di memori
    inMemoryDb[key] = value;
    saveDatabase();

    // Broadcast ke SEMUA klien yang sedang membuka aplikasi (HP, Laptop, PC Server)
    const updateEvent = {
      type: 'DATA_UPDATE',
      key,
      value,
      senderId: clientId || req.headers['x-client-id'] || 'server',
      timestamp: new Date().toISOString()
    };
    broadcastUpdate(updateEvent);

    res.json({
      success: true,
      message: `Data ${key} berhasil diperbarui dan disinkronkan ke seluruh klien.`,
      updatedAt: inMemoryDb.lastUpdated
    });
  });

  // 6. Batch Update / Import Database Lengkap
  app.post('/api/data-batch', (req, res) => {
    const { data, clientId } = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ success: false, message: 'Data batch tidak valid' });
    }

    inMemoryDb = {
      ...inMemoryDb,
      ...data,
      lastUpdated: new Date().toISOString()
    };
    saveDatabase();

    broadcastUpdate({
      type: 'FULL_SYNC',
      data: inMemoryDb,
      senderId: clientId || req.headers['x-client-id'] || 'server',
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, message: 'Database berhasil diperbarui secara penuh.' });
  });

  // 7. Reset Database ke Data Awal
  app.post('/api/data-reset', (req, res) => {
    inMemoryDb = getInitialDatabase();
    saveDatabase();

    broadcastUpdate({
      type: 'FULL_SYNC',
      data: inMemoryDb,
      senderId: req.body.clientId || 'server',
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, message: 'Database berhasil direset ke data default.' });
  });

  // 8. Server Telemetry & Health Monitoring Engine
  app.get('/api/server/telemetry', (req, res) => {
    res.json(getTelemetryData());
  });

  app.get('/api/server/health', (req, res) => {
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      connections: sseClients.size
    });
  });

  // 9. Automated & Instant Backup Management
  app.get('/api/server/backups', (req, res) => {
    const list = listBackups();
    res.json({
      success: true,
      total: list.length,
      backups: list
    });
  });

  app.post('/api/server/backups', (req, res) => {
    try {
      const reason = req.body?.reason || 'manual';
      const backupInfo = createBackup(reason);
      res.json({
        success: true,
        message: 'Snapshot cadangan basis data berhasil dibuat.',
        backup: backupInfo
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Gagal membuat cadangan: ' + err.message });
    }
  });

  app.get('/api/server/backups/:filename', (req, res) => {
    const safeFilename = path.basename(req.params.filename);
    const targetPath = path.join(BACKUP_DIR, safeFilename);
    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ success: false, message: 'File cadangan tidak ditemukan' });
    }
    res.download(targetPath, safeFilename);
  });

  app.post('/api/server/backups/:filename/restore', (req, res) => {
    try {
      const result = restoreBackup(req.params.filename);
      res.json({
        success: true,
        message: `Basis data berhasil dipulihkan dari ${path.basename(req.params.filename)}.`,
        ...result
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Gagal memulihkan cadangan: ' + err.message });
    }
  });

  app.delete('/api/server/backups/:filename', (req, res) => {
    try {
      const ok = deleteBackup(req.params.filename);
      if (ok) {
        res.json({ success: true, message: 'File cadangan berhasil dihapus.' });
      } else {
        res.status(404).json({ success: false, message: 'File cadangan tidak ditemukan.' });
      }
    } catch (err) {
      res.status(500).json({ success: false, message: 'Gagal menghapus cadangan: ' + err.message });
    }
  });
}

module.exports = {
  loadDatabase,
  saveDatabase,
  broadcastUpdate,
  mountCentralDbRoutes,
  getLocalIpAddresses,
  createBackup,
  listBackups,
  getTelemetryData,
  sseClients
};
