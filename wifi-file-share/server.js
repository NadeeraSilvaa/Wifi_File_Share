const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 8080;
const SHARED_DIR = path.join(__dirname, 'shared-files');
const META_PATH = path.join(SHARED_DIR, '.meta.json');

// Create shared-files directory at startup if it doesn't exist
if (!fs.existsSync(SHARED_DIR)) {
  fs.mkdirSync(SHARED_DIR, { recursive: true });
}

function readMeta() {
  try {
    const data = fs.readFileSync(META_PATH, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

function writeMeta(meta) {
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2), 'utf8');
}

// Multer: store uploads in shared-files with original filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, SHARED_DIR),
  filename: (req, file, cb) => cb(null, file.originalname || `upload-${Date.now()}`),
});
const upload = multer({ storage });

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Get local network IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Safe filename: no path traversal
function safeFilename(name) {
  const base = path.basename(name);
  return base && !base.includes('..') && !base.includes('/') && !base.includes('\\') ? base : null;
}

// GET /api/files - list shared files (with device metadata)
app.get('/api/files', (req, res) => {
  fs.readdir(SHARED_DIR, { withFileTypes: true }, (err, entries) => {
    if (err) return res.status(500).json({ error: err.message });
    const meta = readMeta();
    const files = entries
      .filter((e) => e.isFile() && e.name !== '.meta.json')
      .map((e) => {
        const stat = fs.statSync(path.join(SHARED_DIR, e.name));
        const fileMeta = meta[e.name] || {};
        return {
          name: e.name,
          size: stat.size,
          mtime: stat.mtime.toISOString(),
          deviceId: fileMeta.deviceId || null,
          deviceName: fileMeta.deviceName || null,
          uploadedAt: fileMeta.uploadedAt || null,
        };
      })
      .sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
    res.json({ files });
  });
});

// POST /api/upload - upload one or more files (deviceId, deviceName via X-Device-Id, X-Device-Name headers)
app.post('/api/upload', (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    const deviceId = req.get('X-Device-Id') ? String(req.get('X-Device-Id')).slice(0, 64) : null;
    const deviceName = req.get('X-Device-Name') ? String(req.get('X-Device-Name')).slice(0, 128) : null;
    const uploaded = (req.files || []).map((f) => f.originalname);
    if (uploaded.length && (deviceId || deviceName)) {
      const meta = readMeta();
      const now = new Date().toISOString();
      uploaded.forEach((name) => {
        meta[name] = { deviceId: deviceId || null, deviceName: deviceName || null, uploadedAt: now };
      });
      writeMeta(meta);
    }
    res.json({ ok: true, uploaded });
  });
});

// GET /files/:filename - download file
app.get('/files/:filename', (req, res) => {
  const name = safeFilename(req.params.filename);
  if (!name) return res.status(400).send('Invalid filename');
  const filePath = path.join(SHARED_DIR, name);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return res.status(404).send('Not found');
  }
  res.setHeader('Content-Disposition', `attachment; filename="${name.replace(/"/g, '\\"')}"`);
  res.sendFile(filePath);
});

// GET /api/info - share URL for other devices
app.get('/api/info', (req, res) => {
  const localIP = getLocalIP();
  const port = req.socket?.server?.address()?.port || PORT;
  const url = `http://${localIP}:${port}`;
  res.json({ url });
});

// DELETE /api/files/:filename
app.delete('/api/files/:filename', (req, res) => {
  const name = safeFilename(req.params.filename);
  if (!name) return res.status(400).json({ error: 'Invalid filename' });
  const filePath = path.join(SHARED_DIR, name);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return res.status(404).json({ error: 'Not found' });
  }
  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    const meta = readMeta();
    if (meta[name]) {
      delete meta[name];
      writeMeta(meta);
    }
    res.json({ ok: true });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log(`WiFi File Share running at:`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  http://${localIP}:${PORT} (use this on other devices)`);
});
