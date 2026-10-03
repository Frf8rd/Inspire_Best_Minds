const { app, BrowserWindow, shell } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8081; // același port ca Expo web, ca CLIENT_URL să rămână http://localhost:8081
const DIST = path.join(__dirname, '..', 'dist');
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.ttf': 'font/ttf', '.woff2': 'font/woff2',
};

function serveDist() {
  return new Promise((resolve) => {
    http
      .createServer((req, res) => {
        const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
        const file = [urlPath, `${urlPath}.html`, path.join(urlPath, 'index.html')]
          .map((p) => path.join(DIST, p))
          .find((p) => p.startsWith(DIST) && fs.existsSync(p) && fs.statSync(p).isFile());
        const target = file ?? path.join(DIST, 'index.html');
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(target)] ?? 'application/octet-stream' });
        fs.createReadStream(target).pipe(res);
      })
      .listen(PORT, '127.0.0.1', resolve);
  });
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 480,
    backgroundColor: '#101010',
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  win.setMenuBarVisibility(false);
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (!process.argv.includes('--dev')) await serveDist();
  win.loadURL(`http://localhost:${PORT}`);
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());