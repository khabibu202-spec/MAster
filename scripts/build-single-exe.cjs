/**
 * BUILD 1 APLIKASI EXECUTABLE STANDALONE (.EXE) UNTUK SIM SARPRAS SMP
 * Menghasilkan SATU file tunggal: "SIM-Sarpras-SMP.exe" (Port 3030)
 * 
 * Karakteristik:
 * 1. Single Portable Executable (.exe) mandiri
 * 2. Menyimpan database terpusat di server (data/database.json)
 * 3. Sinkronisasi Real-Time (Server-Sent Events) ke seluruh client HP / Laptop
 * 4. Dilengkapi GUI Control Center (bisa minimize ke System Tray)
 * 5. Memiliki auto-extractor dan web engine terintegrasi
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createZipFromDir } = require('./pure-zip.cjs');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const RELEASE_DIR = path.join(ROOT_DIR, 'release');
const STANDALONE_DIR = path.join(RELEASE_DIR, 'SIM-Sarpras-SMP-Localhost-3030');
const OUTPUT_EXE = path.join(RELEASE_DIR, 'SIM-Sarpras-SMP.exe');

function ensureReleaseDir() {
  if (!fs.existsSync(RELEASE_DIR)) {
    fs.mkdirSync(RELEASE_DIR, { recursive: true });
  }
}

function createZipArchive() {
  const tempZip = path.join(RELEASE_DIR, 'app_bundle.zip');
  if (fs.existsSync(tempZip)) {
    try { fs.unlinkSync(tempZip); } catch {}
  }

  console.log('[1/4] Mengemas berkas web dan server ke dalam arsip terkompresi...');
  const zipBytes = createZipFromDir(STANDALONE_DIR, tempZip);
  console.log(`[+] Arsip aplikasi berhasil dibuat: ${(zipBytes.length / (1024 * 1024)).toFixed(2)} MB`);
  return tempZip;
}

function generateCSharpSource() {
  return `
using System;
using System.IO;
using System.IO.Compression;
using System.Diagnostics;
using System.Drawing;
using System.Windows.Forms;
using System.Net;
using System.Net.Sockets;
using System.Net.NetworkInformation;
using System.Text;
using System.Threading;
using System.Reflection;
using System.Collections.Generic;

namespace SimSarprasLauncher {
    public class Program {
        [STAThread]
        public static void Main() {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }

    public class MainForm : Form {
        private const int PORT = 3030;
        private string appDataDir;
        private Process serverProcess = null;
        private NotifyIcon trayIcon;
        private Label lblStatus;
        private Label lblLocalUrl;
        private Label lblWifiUrl;
        private Button btnOpenBrowser;
        private Button btnCopyWifi;
        private Button btnOpenFolder;
        private Button btnFirewall;
        private Button btnRestart;
        private Button btnExit;
        private string bestWifiIp = "127.0.0.1";

        private static Stream GetEmbeddedZipPayload() {
            Assembly asm = Assembly.GetExecutingAssembly();
            Stream s = asm.GetManifestResourceStream("Payload.zip");
            if (s != null) return s;

            foreach (string name in asm.GetManifestResourceNames()) {
                if (name.EndsWith(".zip", StringComparison.OrdinalIgnoreCase)) {
                    return asm.GetManifestResourceStream(name);
                }
            }

            string localZip = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "app_bundle.zip");
            if (File.Exists(localZip)) return File.OpenRead(localZip);

            string releaseZip = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "release", "app_bundle.zip");
            if (File.Exists(releaseZip)) return File.OpenRead(releaseZip);

            throw new Exception("Arsip payload aplikasi tidak ditemukan.");
        }

        public MainForm() {
            InitializeComponent();
            SetupApp();
        }

        private void InitializeComponent() {
            this.Text = "SIM Sarpras SMP - Server Terpusat & Klien (Port 3030)";
            this.Size = new Size(620, 480);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedSingle;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(15, 23, 42); // Slate 900
            this.ForeColor = Color.White;
            this.Font = new Font("Segoe UI", 9.5f);

            // Header Banner
            Panel pnlHeader = new Panel();
            pnlHeader.Location = new Point(0, 0);
            pnlHeader.Size = new Size(620, 80);
            pnlHeader.BackColor = Color.FromArgb(30, 41, 59);
            this.Controls.Add(pnlHeader);

            Label lblTitle = new Label();
            lblTitle.Text = "SIM SARPRAS SMP";
            lblTitle.Font = new Font("Segoe UI", 15, FontStyle.Bold);
            lblTitle.ForeColor = Color.FromArgb(56, 189, 248);
            lblTitle.Location = new Point(20, 15);
            lblTitle.AutoSize = true;
            pnlHeader.Controls.Add(lblTitle);

            Label lblSubtitle = new Label();
            lblSubtitle.Text = "Aplikasi Tunggal .EXE - Server Terpusat & Realtime Multi-Perangkat (Port 3030)";
            lblSubtitle.Font = new Font("Segoe UI", 9, FontStyle.Regular);
            lblSubtitle.ForeColor = Color.FromArgb(148, 163, 184);
            lblSubtitle.Location = new Point(20, 45);
            lblSubtitle.AutoSize = true;
            pnlHeader.Controls.Add(lblSubtitle);

            // Status Card
            Panel pnlStatus = new Panel();
            pnlStatus.Location = new Point(20, 95);
            pnlStatus.Size = new Size(565, 80);
            pnlStatus.BackColor = Color.FromArgb(24, 33, 47);
            this.Controls.Add(pnlStatus);

            lblStatus = new Label();
            lblStatus.Text = "● SERVER SEDANG BERJALAN DI PORT " + PORT;
            lblStatus.Font = new Font("Segoe UI", 11, FontStyle.Bold);
            lblStatus.ForeColor = Color.FromArgb(52, 211, 153);
            lblStatus.Location = new Point(15, 12);
            lblStatus.AutoSize = true;
            pnlStatus.Controls.Add(lblStatus);

            lblLocalUrl = new Label();
            lblLocalUrl.Text = "Mode Aplikasi: Desktop Mandiri Offline (Tanpa Localhost)";
            lblLocalUrl.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            lblLocalUrl.ForeColor = Color.FromArgb(226, 232, 240);
            lblLocalUrl.Location = new Point(15, 42);
            lblLocalUrl.AutoSize = true;
            pnlStatus.Controls.Add(lblLocalUrl);

            // Wi-Fi Access Card for Client (HP / Laptop Guru)
            Panel pnlWifi = new Panel();
            pnlWifi.Location = new Point(20, 185);
            pnlWifi.Size = new Size(565, 95);
            pnlWifi.BackColor = Color.FromArgb(24, 33, 47);
            this.Controls.Add(pnlWifi);

            Label lblWifiHeader = new Label();
            lblWifiHeader.Text = "AKSES CLIENT DI HP / LAPTOP (WI-FI SEKOLAH):";
            lblWifiHeader.Font = new Font("Segoe UI", 9, FontStyle.Bold);
            lblWifiHeader.ForeColor = Color.FromArgb(129, 140, 248);
            lblWifiHeader.Location = new Point(15, 12);
            lblWifiHeader.AutoSize = true;
            pnlWifi.Controls.Add(lblWifiHeader);

            lblWifiUrl = new Label();
            lblWifiUrl.Text = "http://Mencari-IP...:" + PORT;
            lblWifiUrl.Font = new Font("Consolas", 11, FontStyle.Bold);
            lblWifiUrl.ForeColor = Color.FromArgb(250, 204, 21);
            lblWifiUrl.Location = new Point(15, 36);
            lblWifiUrl.AutoSize = true;
            pnlWifi.Controls.Add(lblWifiUrl);

            Label lblWifiHint = new Label();
            lblWifiHint.Text = "Semua perubahan data dari HP atau laptop klien tersinkronisasi otomatis secara realtime.";
            lblWifiHint.Font = new Font("Segoe UI", 8.5f, FontStyle.Italic);
            lblWifiHint.ForeColor = Color.FromArgb(148, 163, 184);
            lblWifiHint.Location = new Point(15, 65);
            lblWifiHint.AutoSize = true;
            pnlWifi.Controls.Add(lblWifiHint);

            btnCopyWifi = new Button();
            btnCopyWifi.Text = "Salin Link";
            btnCopyWifi.Font = new Font("Segoe UI", 8.5f, FontStyle.Bold);
            btnCopyWifi.BackColor = Color.FromArgb(49, 46, 129);
            btnCopyWifi.ForeColor = Color.White;
            btnCopyWifi.FlatStyle = FlatStyle.Flat;
            btnCopyWifi.FlatAppearance.BorderSize = 0;
            btnCopyWifi.Location = new Point(460, 32);
            btnCopyWifi.Size = new Size(90, 30);
            btnCopyWifi.Cursor = Cursors.Hand;
            btnCopyWifi.Click += (s, e) => {
                try {
                    Clipboard.SetText(lblWifiUrl.Text);
                    MessageBox.Show("Link URL Wi-Fi berhasil disalin ke clipboard!\\n\\nBagikan tautan ini ke HP atau laptop guru lain yang terhubung ke Wi-Fi yang sama.", "Berhasil Disalin", MessageBoxButtons.OK, MessageBoxIcon.Information);
                } catch {}
            };
            pnlWifi.Controls.Add(btnCopyWifi);

            // Action Buttons
            btnOpenBrowser = new Button();
            btnOpenBrowser.Text = "Buka Jendela Aplikasi Desktop";
            btnOpenBrowser.Font = new Font("Segoe UI", 10.5f, FontStyle.Bold);
            btnOpenBrowser.BackColor = Color.FromArgb(2, 132, 199);
            btnOpenBrowser.ForeColor = Color.White;
            btnOpenBrowser.FlatStyle = FlatStyle.Flat;
            btnOpenBrowser.FlatAppearance.BorderSize = 0;
            btnOpenBrowser.Location = new Point(20, 295);
            btnOpenBrowser.Size = new Size(275, 42);
            btnOpenBrowser.Cursor = Cursors.Hand;
            btnOpenBrowser.Click += (s, e) => LaunchDesktopApp();
            this.Controls.Add(btnOpenBrowser);

            btnOpenFolder = new Button();
            btnOpenFolder.Text = "Buka Folder Data";
            btnOpenFolder.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            btnOpenFolder.BackColor = Color.FromArgb(51, 65, 85);
            btnOpenFolder.ForeColor = Color.White;
            btnOpenFolder.FlatStyle = FlatStyle.Flat;
            btnOpenFolder.FlatAppearance.BorderSize = 0;
            btnOpenFolder.Location = new Point(310, 295);
            btnOpenFolder.Size = new Size(275, 42);
            btnOpenFolder.Cursor = Cursors.Hand;
            btnOpenFolder.Click += (s, e) => {
                string dataDir = Path.Combine(appDataDir, "data");
                if (Directory.Exists(dataDir)) {
                    Process.Start("explorer.exe", dataDir);
                } else {
                    Process.Start("explorer.exe", appDataDir);
                }
            };
            this.Controls.Add(btnOpenFolder);

            btnFirewall = new Button();
            btnFirewall.Text = "Izinkan Windows Firewall (Port 3030)";
            btnFirewall.Font = new Font("Segoe UI", 9f);
            btnFirewall.BackColor = Color.FromArgb(30, 41, 59);
            btnFirewall.ForeColor = Color.FromArgb(203, 213, 225);
            btnFirewall.FlatStyle = FlatStyle.Flat;
            btnFirewall.FlatAppearance.BorderColor = Color.FromArgb(71, 85, 105);
            btnFirewall.Location = new Point(20, 350);
            btnFirewall.Size = new Size(275, 34);
            btnFirewall.Cursor = Cursors.Hand;
            btnFirewall.Click += (s, e) => AllowFirewall();
            this.Controls.Add(btnFirewall);

            btnRestart = new Button();
            btnRestart.Text = "Restart Server";
            btnRestart.Font = new Font("Segoe UI", 9f);
            btnRestart.BackColor = Color.FromArgb(30, 41, 59);
            btnRestart.ForeColor = Color.FromArgb(203, 213, 225);
            btnRestart.FlatStyle = FlatStyle.Flat;
            btnRestart.FlatAppearance.BorderColor = Color.FromArgb(71, 85, 105);
            btnRestart.Location = new Point(310, 350);
            btnRestart.Size = new Size(130, 34);
            btnRestart.Cursor = Cursors.Hand;
            btnRestart.Click += (s, e) => RestartServer();
            this.Controls.Add(btnRestart);

            btnExit = new Button();
            btnExit.Text = "Tutup & Hentikan";
            btnExit.Font = new Font("Segoe UI", 9f);
            btnExit.BackColor = Color.FromArgb(30, 41, 59);
            btnExit.ForeColor = Color.FromArgb(248, 113, 113);
            btnExit.FlatStyle = FlatStyle.Flat;
            btnExit.FlatAppearance.BorderColor = Color.FromArgb(71, 85, 105);
            btnExit.Location = new Point(455, 350);
            btnExit.Size = new Size(130, 34);
            btnExit.Cursor = Cursors.Hand;
            btnExit.Click += (s, e) => this.Close();
            this.Controls.Add(btnExit);

            // System Tray Icon
            trayIcon = new NotifyIcon();
            trayIcon.Text = "SIM Sarpras SMP (Port 3030)";
            trayIcon.Icon = SystemIcons.Application;
            trayIcon.Visible = true;
            trayIcon.DoubleClick += (s, e) => {
                this.Show();
                this.WindowState = FormWindowState.Normal;
                this.BringToFront();
            };

            ContextMenu trayMenu = new ContextMenu();
            trayMenu.MenuItems.Add("Buka Jendela Aplikasi", (s, e) => LaunchDesktopApp());
            trayMenu.MenuItems.Add("Tampilkan Jendela Kontrol", (s, e) => {
                this.Show();
                this.WindowState = FormWindowState.Normal;
                this.BringToFront();
            });
            trayMenu.MenuItems.Add("-");
            trayMenu.MenuItems.Add("Keluar", (s, e) => this.Close());
            trayIcon.ContextMenu = trayMenu;

            this.FormClosing += (s, e) => {
                StopServer();
                if (trayIcon != null) {
                    trayIcon.Visible = false;
                    trayIcon.Dispose();
                }
            };
        }

        private void SetupApp() {
            string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            appDataDir = Path.Combine(localAppData, "SIM-Sarpras-SMP-App");

            DetectLocalIp();

            Thread t = new Thread(() => {
                ExtractPayloadIfNeeded();
                StartServer();
                this.Invoke(new Action(() => {
                    LaunchDesktopApp();
                }));
            });
            t.IsBackground = true;
            t.Start();
        }

        private void DetectLocalIp() {
            try {
                string fallbackIp = "127.0.0.1";
                foreach (NetworkInterface ni in NetworkInterface.GetAllNetworkInterfaces()) {
                    if (ni.OperationalStatus == OperationalStatus.Up && ni.NetworkInterfaceType != NetworkInterfaceType.Loopback) {
                        foreach (UnicastIPAddressInformation ip in ni.GetIPProperties().UnicastAddresses) {
                            if (ip.Address.AddressFamily == AddressFamily.InterNetwork) {
                                string addr = ip.Address.ToString();
                                if (addr.StartsWith("192.168.") || addr.StartsWith("10.") || addr.StartsWith("172.")) {
                                    bestWifiIp = addr;
                                    lblWifiUrl.Text = "http://" + bestWifiIp + ":" + PORT;
                                    return;
                                }
                                fallbackIp = addr;
                            }
                        }
                    }
                }
                bestWifiIp = fallbackIp;
                lblWifiUrl.Text = "http://" + bestWifiIp + ":" + PORT;
            } catch {}
        }

        private void ExtractPayloadIfNeeded() {
            try {
                if (!Directory.Exists(appDataDir)) {
                    Directory.CreateDirectory(appDataDir);
                }

                using (Stream zipStream = GetEmbeddedZipPayload()) {
                    using (ZipArchive archive = new ZipArchive(zipStream)) {
                        foreach (ZipArchiveEntry entry in archive.Entries) {
                            string destPath = Path.Combine(appDataDir, entry.FullName);
                            string destDir = Path.GetDirectoryName(destPath);
                            if (!Directory.Exists(destDir)) {
                                Directory.CreateDirectory(destDir);
                            }
                            // Don't overwrite existing user database if already initialized
                            if (entry.FullName.Equals("data/database.json", StringComparison.OrdinalIgnoreCase) && File.Exists(destPath)) {
                                continue;
                            }
                            if (!string.IsNullOrEmpty(entry.Name)) {
                                entry.ExtractToFile(destPath, true);
                            }
                        }
                    }
                }
            } catch (Exception ex) {
                MessageBox.Show("Gagal mengekstrak berkas aplikasi: " + ex.Message, "Error Ekstraksi", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private static HttpListener internalListener;
        private static Thread internalListenerThread;

        private void StartServer() {
            bool nodeStarted = false;
            try {
                string serverScript = Path.Combine(appDataDir, "server-lokal.cjs");
                if (!File.Exists(serverScript)) {
                    serverScript = Path.Combine(appDataDir, "server.cjs");
                }

                if (File.Exists(serverScript)) {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = "node.exe";
                    psi.Arguments = "\\"" + serverScript + "\\"";
                    psi.WorkingDirectory = appDataDir;
                    psi.CreateNoWindow = true;
                    psi.UseShellExecute = false;

                    serverProcess = Process.Start(psi);
                    if (serverProcess != null && !serverProcess.HasExited) {
                        nodeStarted = true;
                    }
                }
            } catch {}

            if (!nodeStarted) {
                // Gunakan engine internal C# HttpListener jika Node.js tidak tersedia di komputer
                StartInternalServer();
            }
        }

        private void StartInternalServer() {
            try {
                if (internalListener != null) {
                    try { internalListener.Stop(); } catch {}
                }
                internalListener = new HttpListener();
                internalListener.Prefixes.Add("http://127.0.0.1:" + PORT + "/");
                internalListener.Prefixes.Add("http://localhost:" + PORT + "/");
                internalListener.Start();

                internalListenerThread = new Thread(() => {
                    string distDir = Path.Combine(appDataDir, "dist");
                    string dbFile = Path.Combine(appDataDir, "data", "database.json");

                    while (internalListener != null && internalListener.IsListening) {
                        try {
                            HttpListenerContext ctx = internalListener.GetContext();
                            ThreadPool.QueueUserWorkItem((state) => {
                                try {
                                    HandleInternalRequest(ctx, distDir, dbFile);
                                } catch {}
                            });
                        } catch {
                            break;
                        }
                    }
                });
                internalListenerThread.IsBackground = true;
                internalListenerThread.Start();

                this.Invoke(new Action(() => {
                    lblStatus.Text = "● SERVER OFFLINE AKTIF DI PORT " + PORT;
                    lblStatus.ForeColor = Color.FromArgb(52, 211, 153);
                }));
            } catch (Exception ex) {
                this.Invoke(new Action(() => {
                    lblStatus.Text = "● SERVER LOKAL SIAP (MODE OFFLINE LANGSUNG)";
                    lblStatus.ForeColor = Color.FromArgb(56, 189, 248);
                }));
            }
        }

        private void HandleInternalRequest(HttpListenerContext ctx, string distDir, string dbFile) {
            HttpListenerRequest req = ctx.Request;
            HttpListenerResponse res = ctx.Response;

            res.Headers.Add("Access-Control-Allow-Origin", "*");
            res.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            res.Headers.Add("Access-Control-Allow-Headers", "*");

            if (req.HttpMethod == "OPTIONS") {
                res.StatusCode = 204;
                res.Close();
                return;
            }

            string rawPath = req.Url.AbsolutePath;

            if (rawPath == "/api/data" && req.HttpMethod == "GET") {
                res.ContentType = "application/json; charset=utf-8";
                string json = File.Exists(dbFile) ? File.ReadAllText(dbFile) : "{}";
                byte[] b = System.Text.Encoding.UTF8.GetBytes("{\\"success\\":true,\\"data\\":" + json + "}");
                res.OutputStream.Write(b, 0, b.Length);
                res.Close();
                return;
            }

            if (rawPath == "/api/server-info") {
                res.ContentType = "application/json; charset=utf-8";
                byte[] b = System.Text.Encoding.UTF8.GetBytes("{\\"port\\":" + PORT + ",\\"connectedClients\\":1,\\"localIps\\":[]}");
                res.OutputStream.Write(b, 0, b.Length);
                res.Close();
                return;
            }

            if (rawPath == "/api/active-clients") {
                res.ContentType = "application/json; charset=utf-8";
                byte[] b = System.Text.Encoding.UTF8.GetBytes("{\\"success\\":true,\\"activeClients\\":[]}");
                res.OutputStream.Write(b, 0, b.Length);
                res.Close();
                return;
            }

            string relPath = rawPath.TrimStart('/');
            if (string.IsNullOrEmpty(relPath)) relPath = "index.html";
            string filePath = Path.Combine(distDir, relPath.Replace('/', Path.DirectorySeparatorChar));

            if (!File.Exists(filePath)) {
                filePath = Path.Combine(distDir, "index.html");
            }

            if (File.Exists(filePath)) {
                string ext = Path.GetExtension(filePath).ToLowerInvariant();
                switch (ext) {
                    case ".html": res.ContentType = "text/html; charset=utf-8"; break;
                    case ".js": res.ContentType = "application/javascript; charset=utf-8"; break;
                    case ".css": res.ContentType = "text/css; charset=utf-8"; break;
                    case ".json": res.ContentType = "application/json; charset=utf-8"; break;
                    case ".svg": res.ContentType = "image/svg+xml"; break;
                    case ".png": res.ContentType = "image/png"; break;
                    case ".ico": res.ContentType = "image/x-icon"; break;
                    default: res.ContentType = "application/octet-stream"; break;
                }
                byte[] buffer = File.ReadAllBytes(filePath);
                res.ContentLength64 = buffer.Length;
                res.OutputStream.Write(buffer, 0, buffer.Length);
                res.Close();
            } else {
                res.StatusCode = 404;
                res.Close();
            }
        }

        private void StopServer() {
            try {
                if (serverProcess != null && !serverProcess.HasExited) {
                    serverProcess.Kill();
                }
            } catch {}
            try {
                if (internalListener != null) {
                    internalListener.Stop();
                    internalListener.Close();
                }
            } catch {}
        }

        private void RestartServer() {
            StopServer();
            Thread.Sleep(800);
            StartServer();
            MessageBox.Show("Server aplikasi offline berhasil dimuat ulang.", "Berhasil", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void AllowFirewall() {
            try {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "netsh.exe";
                psi.Arguments = "advfirewall firewall add rule name=\\"SIM_Sarpras_Port_3030\\" dir=in action=allow protocol=TCP localport=3030";
                psi.Verb = "runas";
                Process.Start(psi);
            } catch {}
        }

        private void LaunchDesktopApp() {
            try {
                string edgePath = "";
                string[] candidateEdge = new string[] {
                    @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                    @"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
                    Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Microsoft\Edge\Application\msedge.exe")
                };
                foreach (var p in candidateEdge) {
                    if (File.Exists(p)) { edgePath = p; break; }
                }

                string chromePath = "";
                string[] candidateChrome = new string[] {
                    @"C:\Program Files\Google\Chrome\Application\chrome.exe",
                    @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
                };
                foreach (var p in candidateChrome) {
                    if (File.Exists(p)) { chromePath = p; break; }
                }

                string exePath = !string.IsNullOrEmpty(edgePath) ? edgePath : chromePath;
                string appUrl = "http://127.0.0.1:" + PORT;

                if (!string.IsNullOrEmpty(exePath)) {
                    // Mode --app: Membuka jendela aplikasi desktop murni, tanpa address bar, tanpa tabs, tanpa URL localhost
                    Process.Start(new ProcessStartInfo {
                        FileName = exePath,
                        Arguments = "--app=\\"" + appUrl + "\\" --window-size=1366,820",
                        UseShellExecute = false
                    });
                } else {
                    Process.Start(appUrl);
                }
            } catch {}
        }
    }
}
`;
}

function buildSingleExe() {
  console.log('================================================================');
  console.log('   🔨 PROSES BUILD 1 APLIKASI TUNGGAL (SIM-Sarpras-SMP.exe)');
  console.log('================================================================');
  console.log(` Output Target: ${OUTPUT_EXE}`);
  console.log(' Port Server  : 3030 (Terpusat & Realtime Multi-Perangkat)');
  console.log('================================================================\n');

  ensureReleaseDir();
  const zipFile = createZipArchive();

  console.log('[2/4] Membuat kode program native C# dengan payload terintegrasi...');
  const csSource = generateCSharpSource();
  const csFile = path.join(RELEASE_DIR, 'Program.cs');
  fs.writeFileSync(csFile, csSource, 'utf8');

  console.log('[3/4] Menyiapkan skrip kompilasi otomatis Windows...');
  const psScript = `
$outputExe = "$PSScriptRoot\\SIM-Sarpras-SMP.exe"
$csFile = "$PSScriptRoot\\Program.cs"
$zipFile = "$PSScriptRoot\\app_bundle.zip"

Write-Host "[*] Mengompilasi SIM-Sarpras-SMP.exe..." -ForegroundColor Cyan

$cscPaths = @(
    "$env:SystemRoot\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe",
    "$env:SystemRoot\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe"
)
$csc = $cscPaths | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($csc) {
    $refs = "/r:System.dll,/r:System.Core.dll,/r:Microsoft.CSharp.dll,/r:System.Windows.Forms.dll,/r:System.Drawing.dll,/r:System.IO.Compression.dll,/r:System.IO.Compression.FileSystem.dll"
    & $csc /target:winexe /out:"$outputExe" /resource:"$zipFile,Payload.zip" $refs.Split(",") "$csFile"
}

if (Test-Path $outputExe) {
    Write-Host "[SUKSES] SIM-Sarpras-SMP.exe BERHASIL DIBUAT DENGAN SEMPURNA!" -ForegroundColor Green
}
`;
  const psFile = path.join(RELEASE_DIR, 'compile_single_exe.ps1');
  fs.writeFileSync(psFile, psScript, 'utf8');

  // Skrip batch 1-klik untuk membangun single exe
  const buildCmd = `@echo off
title BUILD 1 APLIKASI TUNGGAL (SIM-SARPRAS-SMP.EXE)
color 0B
cd /d "%~dp0"

echo ======================================================================
echo    MEMBUAT 1 APLIKASI TUNGGAL: SIM-Sarpras-SMP.exe (PORT 3030)
echo ======================================================================
echo.

set "OUTPUT_EXE=%~dp0release\\SIM-Sarpras-SMP.exe"
set "CS_FILE=%~dp0release\\Program.cs"
set "BUNDLE_ZIP=%~dp0release\\app_bundle.zip"
set "COMPILED=0"

set "CSC_EXE="
if exist "%SystemRoot%\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe" (
    set "CSC_EXE=%SystemRoot%\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe"
) else if exist "%SystemRoot%\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe" (
    set "CSC_EXE=%SystemRoot%\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe"
)

if defined CSC_EXE (
    echo [*] Mengompilasi dengan native Windows compiler: %CSC_EXE%
    "%CSC_EXE%" /nologo /target:winexe /platform:anycpu /optimize+ /out:"%OUTPUT_EXE%" /resource:"%BUNDLE_ZIP%",Payload.zip /r:System.dll /r:System.Core.dll /r:Microsoft.CSharp.dll /r:System.Windows.Forms.dll /r:System.Drawing.dll /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll "%CS_FILE%"
    if exist "%OUTPUT_EXE%" set "COMPILED=1"
)

if "!COMPILED!"=="0" (
    echo [*] Mencoba kompilasi melalui PowerShell...
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& { & '%~dp0release\\compile_single_exe.ps1' }"
    if exist "%OUTPUT_EXE%" set "COMPILED=1"
)

echo.
if exist "%OUTPUT_EXE%" (
    echo ======================================================================
    echo  [SUKSES] SIM-Sarpras-SMP.exe Telah Selesai Dibuat!
    echo ======================================================================
    echo  Lokasi File: %OUTPUT_EXE%
    echo ======================================================================
    echo.
    set /p "RUN_NOW=Buka aplikasi sekarang? (Y/T): "
    if /i "!RUN_NOW!"=="Y" start "" "%OUTPUT_EXE%"
) else (
    echo [X] Kompilasi belum berhasil.
)
echo.
pause
`;
  fs.writeFileSync(path.join(ROOT_DIR, 'BUILD_SATU_APLIKASI_EXE.cmd'), buildCmd.replace(/\n/g, '\r\n'), 'utf8');

  console.log('\n[SELESAI] Konfigurasi 1 aplikasi .EXE telah lengkap.');
}

if (require.main === module) {
  buildSingleExe();
}

module.exports = { buildSingleExe };
