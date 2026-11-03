import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const { mountCentralDbRoutes } = require('./scripts/central-db.cjs');

async function createServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(express.text({ type: ['text/plain', 'application/json'] }));

  // Mount central DB and Realtime SSE routes (/api/realtime, /api/presence, /api/active-clients, etc.)
  mountCentralDbRoutes(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[REALTIME SERVER] SIM Sarpras berjalan aktif di http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('[SERVER ERROR]', err);
  process.exit(1);
});
