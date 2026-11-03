/**
 * SERVER LOKAL TERPUSAT SIM SARPRAS SMP (PORT 3030)
 * Server-Client Realtime Architecture dengan SSE & Database Terpusat.
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { mountCentralDbRoutes } = require('./scripts/central-db.cjs');

const app = express();
const PORT = parseInt(process.env.LOCAL_PORT || process.env.PORT || '3030', 10);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.text({ type: ['text/plain', 'application/json'] }));

// Mount central DB and Realtime SSE routes
mountCentralDbRoutes(app);

// Static files from dist
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.send('Aplikasi belum dibuild. Jalankan "npm run build" terlebih dahulu.');
  });
}

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal && (net.address.startsWith('192.168.') || net.address.startsWith('10.') || net.address.startsWith('172.'))) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

app.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  console.log('================================================================');
  console.log(` ⚡ SIM SARPRAS SMP BERJALAN AKTIF DI PORT ${PORT}`);
  console.log('================================================================');
  console.log(` Komputer Server  : http://localhost:${PORT}`);
  console.log(` HP / Laptop Lain : http://${localIp}:${PORT}`);
  console.log('================================================================');
});

module.exports = app;
