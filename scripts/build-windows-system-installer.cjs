/**
 * BUILDER INSTALLER SYSTEM WINDOWS (.EXE) - SIM SARPRAS SMP
 * Menghasilkan file installer "Setup-SIM-Sarpras-SMP.exe"
 * 
 * Karakteristik Installer:
 * 1. Pemasang Mandiri Tunggal (.EXE) dengan Embedded Binary Resource (Zero String Bloat).
 * 2. Terpasang langsung ke sistem Windows (%LocalAppData%\Programs\SIM-Sarpras-SMP).
 * 3. Membuat Pintasan Desktop (Desktop Shortcut) & Start Menu Windows.
 * 4. Terdaftar resmi di Windows Settings (Add/Remove Programs / Control Panel) dengan Uninstaller.
 * 5. Mendaftarkan Server Latar Belakang (Windows Background Service / Task Scheduler) agar otomatis aktif saat PC dinyalakan.
 * 6. Membuka Windows Firewall untuk port 3030 agar dapat diakses HP/Laptop siswa & guru.
 * 7. Langsung membuka aplikasi secara otomatis setelah selesai dipasang.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createZipFromDir } = require('./pure-zip.cjs');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const RELEASE_DIR = path.join(ROOT_DIR, 'release');
const STANDALONE_DIR = path.join(RELEASE_DIR, 'SIM-Sarpras-SMP-Localhost-3030');
const OUTPUT_SETUP_EXE = path.join(RELEASE_DIR, 'Setup-SIM-Sarpras-SMP.exe');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
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

function prepareStandaloneFiles() {
  console.log('[1/4] Menyiapkan berkas produksi aplikasi & server...');
  ensureDir(STANDALONE_DIR);

  // 1. Salin dist
  if (fs.existsSync(DIST_DIR)) {
    copyDirRecursive(DIST_DIR, path.join(STANDALONE_DIR, 'dist'));
  }

  // 2. Salin icon
  const iconSrc = path.join(ROOT_DIR, 'public', 'icon.svg');
  if (fs.existsSync(iconSrc)) {
    fs.copyFileSync(iconSrc, path.join(STANDALONE_DIR, 'icon.svg'));
  }

  // 3. Salin data/database.json terpusat
  const dataDirDest = path.join(STANDALONE_DIR, 'data');
  ensureDir(dataDirDest);
  ensureDir(path.join(dataDirDest, 'backups'));

  const rootDb = path.join(ROOT_DIR, 'data', 'database.json');
  if (fs.existsSync(rootDb)) {
    fs.copyFileSync(rootDb, path.join(dataDirDest, 'database.json'));
  } else {
    const { getInitialDatabase } = require('./init-default-db.cjs');
    fs.writeFileSync(path.join(dataDirDest, 'database.json'), JSON.stringify(getInitialDatabase(), null, 2), 'utf8');
  }

  // 4. Salin server backend
  const serverLokalSrc = path.join(ROOT_DIR, 'server-lokal.cjs');
  if (fs.existsSync(serverLokalSrc)) {
    fs.copyFileSync(serverLokalSrc, path.join(STANDALONE_DIR, 'server-lokal.cjs'));
  }
  const centralDbSrc = path.join(ROOT_DIR, 'scripts', 'central-db.cjs');
  ensureDir(path.join(STANDALONE_DIR, 'scripts'));
  if (fs.existsSync(centralDbSrc)) {
    fs.copyFileSync(centralDbSrc, path.join(STANDALONE_DIR, 'scripts', 'central-db.cjs'));
  }
  const initDbSrc = path.join(ROOT_DIR, 'scripts', 'init-default-db.cjs');
  if (fs.existsSync(initDbSrc)) {
    fs.copyFileSync(initDbSrc, path.join(STANDALONE_DIR, 'scripts', 'init-default-db.cjs'));
  }

  // 5. Salin peluncur senyap (Standalone App Mode VBS Launcher)
  const vbsLaunchSrc = path.join(ROOT_DIR, 'launch-app.vbs');
  if (fs.existsSync(vbsLaunchSrc)) {
    fs.copyFileSync(vbsLaunchSrc, path.join(STANDALONE_DIR, 'launch-app.vbs'));
  }
  const vbsCode = `Set WshShell = CreateObject("WScript.Shell")\r\nWshShell.CurrentDirectory = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)\r\nWshShell.Run "wscript.exe launch-app.vbs", 0, False\r\n`;
  fs.writeFileSync(path.join(STANDALONE_DIR, 'run-server-silent.vbs'), vbsCode, 'utf8');

  // 6. Buat skrip uninstaller bawaan
  const uninstallerCode = `@echo off
title UNINSTALL SIM SARPRAS SMP
echo =====================================================================
echo           PENGHAPUSAN SIM SARPRAS SMP DARI SISTEM WINDOWS
echo =====================================================================
echo.
echo Sedang menghentikan layanan latar belakang...
taskkill /F /IM node.exe >nul 2>&1
schtasks /delete /tn "SIM_Sarpras_Server_Daemon" /f >nul 2>&1

echo Menghapus entri Windows Registry...
reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\SIMSarprasSMP" /f >nul 2>&1

echo Menghapus pintasan Desktop dan Start Menu...
del /F /Q "%USERPROFILE%\\Desktop\\SIM Sarpras SMP.lnk" >nul 2>&1
rmdir /S /Q "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\SIM Sarpras SMP" >nul 2>&1

echo Menutup port firewall...
netsh advfirewall firewall delete rule name="SIM_Sarpras_Port_3030" >nul 2>&1

echo.
echo [SUKSES] SIM Sarpras SMP telah berhasil dihapus dari sistem Windows.
echo Folder data di %~dp0 masih disimpan untuk keamanan basis data Anda.
pause
`;
  fs.writeFileSync(path.join(STANDALONE_DIR, 'uninstall.cmd'), uninstallerCode, 'utf8');
}

function createZipArchive() {
  console.log('[2/4] Mengemas seluruh berkas aplikasi ke dalam arsip zip terkompresi...');
  const tempZip = path.join(RELEASE_DIR, 'installer_payload.zip');
  if (fs.existsSync(tempZip)) {
    try { fs.unlinkSync(tempZip); } catch {}
  }
  const zipBytes = createZipFromDir(STANDALONE_DIR, tempZip);
  console.log(`[+] Arsip payload berhasil dibuat: ${(zipBytes.length / (1024 * 1024)).toFixed(2)} MB`);
  return tempZip;
}

function generateInstallerCSharpSource() {
  return `
using System;
using System.IO;
using System.IO.Compression;
using System.Diagnostics;
using System.Drawing;
using System.Windows.Forms;
using System.Threading;
using System.Text;
using System.Reflection;
using Microsoft.Win32;

namespace SimSarprasInstaller {
    public class Program {
        [STAThread]
        public static void Main() {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new InstallerForm());
        }
    }

    public class InstallerForm : Form {
        private const int PORT = 3030;
        private string installDir;
        private ProgressBar prgBar;
        private Label lblStatus;
        private Label lblDetail;
        private TextBox txtInstallPath;
        private Button btnBrowse;
        private Button btnInstall;
        private Button btnCancel;
        private CheckBox chkDesktopShortcut;
        private CheckBox chkStartMenu;
        private CheckBox chkRegisterService;
        private CheckBox chkOpenFirewall;
        private CheckBox chkLaunchAfter;
        private bool isFinished = false;

        private static Stream GetEmbeddedZipPayload() {
            Assembly asm = Assembly.GetExecutingAssembly();
            Stream s = asm.GetManifestResourceStream("Payload.zip");
            if (s != null) return s;

            foreach (string name in asm.GetManifestResourceNames()) {
                if (name.EndsWith(".zip", StringComparison.OrdinalIgnoreCase)) {
                    return asm.GetManifestResourceStream(name);
                }
            }

            string localZip = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "installer_payload.zip");
            if (File.Exists(localZip)) {
                return File.OpenRead(localZip);
            }

            string releaseZip = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "release", "installer_payload.zip");
            if (File.Exists(releaseZip)) {
                return File.OpenRead(releaseZip);
            }

            throw new Exception("Arsip payload instalasi tidak ditemukan.");
        }

        public InstallerForm() {
            InitializeComponent();
        }

        private void InitializeComponent() {
            this.Text = "Pemasang Sistem Windows - SIM Sarpras SMP";
            this.Size = new Size(640, 520);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(15, 23, 42); // Slate 900
            this.ForeColor = Color.White;
            this.Font = new Font("Segoe UI", 9.5f);

            string localApp = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            installDir = Path.Combine(localApp, "Programs", "SIM-Sarpras-SMP");

            // Header Banner
            Panel pnlHeader = new Panel();
            pnlHeader.Location = new Point(0, 0);
            pnlHeader.Size = new Size(640, 95);
            pnlHeader.BackColor = Color.FromArgb(30, 41, 59);
            this.Controls.Add(pnlHeader);

            Label lblTitle = new Label();
            lblTitle.Text = "SIM SARPRAS SMP";
            lblTitle.Font = new Font("Segoe UI", 16, FontStyle.Bold);
            lblTitle.ForeColor = Color.FromArgb(56, 189, 248);
            lblTitle.Location = new Point(25, 18);
            lblTitle.AutoSize = true;
            pnlHeader.Controls.Add(lblTitle);

            Label lblSubtitle = new Label();
            lblSubtitle.Text = "Instalasi Langsung ke Sistem Windows (Desktop, Start Menu, Service & Registry)";
            lblSubtitle.Font = new Font("Segoe UI", 9.2f, FontStyle.Regular);
            lblSubtitle.ForeColor = Color.FromArgb(148, 163, 184);
            lblSubtitle.Location = new Point(25, 52);
            lblSubtitle.AutoSize = true;
            pnlHeader.Controls.Add(lblSubtitle);

            // Path Selector
            Label lblPathTitle = new Label();
            lblPathTitle.Text = "Direktori Pemasangan di Komputer Ini:";
            lblPathTitle.Font = new Font("Segoe UI", 9, FontStyle.Bold);
            lblPathTitle.ForeColor = Color.FromArgb(203, 213, 225);
            lblPathTitle.Location = new Point(25, 115);
            lblPathTitle.AutoSize = true;
            this.Controls.Add(lblPathTitle);

            txtInstallPath = new TextBox();
            txtInstallPath.Text = installDir;
            txtInstallPath.Font = new Font("Segoe UI", 9.5f);
            txtInstallPath.Location = new Point(25, 140);
            txtInstallPath.Size = new Size(475, 28);
            txtInstallPath.BackColor = Color.FromArgb(30, 41, 59);
            txtInstallPath.ForeColor = Color.FromArgb(226, 232, 240);
            this.Controls.Add(txtInstallPath);

            btnBrowse = new Button();
            btnBrowse.Text = "Pilih...";
            btnBrowse.Font = new Font("Segoe UI", 9f);
            btnBrowse.Location = new Point(510, 138);
            btnBrowse.Size = new Size(90, 30);
            btnBrowse.BackColor = Color.FromArgb(51, 65, 85);
            btnBrowse.ForeColor = Color.White;
            btnBrowse.FlatStyle = FlatStyle.Flat;
            btnBrowse.Cursor = Cursors.Hand;
            btnBrowse.Click += (s, e) => {
                FolderBrowserDialog fbd = new FolderBrowserDialog();
                fbd.Description = "Pilih Folder Lokasi Instalasi SIM Sarpras";
                fbd.SelectedPath = txtInstallPath.Text;
                if (fbd.ShowDialog() == DialogResult.OK) {
                    txtInstallPath.Text = fbd.SelectedPath;
                    installDir = fbd.SelectedPath;
                }
            };
            this.Controls.Add(btnBrowse);

            // Options Checklist
            Panel pnlOptions = new Panel();
            pnlOptions.Location = new Point(25, 185);
            pnlOptions.Size = new Size(575, 145);
            pnlOptions.BackColor = Color.FromArgb(24, 33, 47);
            this.Controls.Add(pnlOptions);

            chkDesktopShortcut = new CheckBox();
            chkDesktopShortcut.Text = "Buat Pintasan Desktop (Desktop Shortcut)";
            chkDesktopShortcut.Checked = true;
            chkDesktopShortcut.Location = new Point(15, 12);
            chkDesktopShortcut.Size = new Size(540, 24);
            pnlOptions.Controls.Add(chkDesktopShortcut);

            chkStartMenu = new CheckBox();
            chkStartMenu.Text = "Daftarkan ke Windows Start Menu & Program Files";
            chkStartMenu.Checked = true;
            chkStartMenu.Location = new Point(15, 38);
            chkStartMenu.Size = new Size(540, 24);
            pnlOptions.Controls.Add(chkStartMenu);

            chkRegisterService = new CheckBox();
            chkRegisterService.Text = "Jalankan Server Otomatis saat Windows Boot (Background Service Port 3030)";
            chkRegisterService.Checked = true;
            chkRegisterService.Location = new Point(15, 64);
            chkRegisterService.Size = new Size(540, 24);
            pnlOptions.Controls.Add(chkRegisterService);

            chkOpenFirewall = new CheckBox();
            chkOpenFirewall.Text = "Buka Port 3030 di Windows Firewall (Akses HP/Laptop Guru via Wi-Fi Sekolah)";
            chkOpenFirewall.Checked = true;
            chkOpenFirewall.Location = new Point(15, 90);
            chkOpenFirewall.Size = new Size(540, 24);
            pnlOptions.Controls.Add(chkOpenFirewall);

            chkLaunchAfter = new CheckBox();
            chkLaunchAfter.Text = "Buka Aplikasi di Browser Web Setelah Selesai Dipasang";
            chkLaunchAfter.Checked = true;
            chkLaunchAfter.Location = new Point(15, 116);
            chkLaunchAfter.Size = new Size(540, 24);
            pnlOptions.Controls.Add(chkLaunchAfter);

            // Progress Section
            lblStatus = new Label();
            lblStatus.Text = "Siap untuk memasang SIM Sarpras SMP.";
            lblStatus.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            lblStatus.ForeColor = Color.FromArgb(56, 189, 248);
            lblStatus.Location = new Point(25, 345);
            lblStatus.AutoSize = true;
            this.Controls.Add(lblStatus);

            lblDetail = new Label();
            lblDetail.Text = "Klik tombol 'Pasang Sekarang' untuk memulai proses instalasi otomatis.";
            lblDetail.Font = new Font("Segoe UI", 8.5f);
            lblDetail.ForeColor = Color.FromArgb(148, 163, 184);
            lblDetail.Location = new Point(25, 370);
            lblDetail.Size = new Size(575, 20);
            this.Controls.Add(lblDetail);

            prgBar = new ProgressBar();
            prgBar.Location = new Point(25, 395);
            prgBar.Size = new Size(575, 24);
            prgBar.Style = ProgressBarStyle.Continuous;
            prgBar.Value = 0;
            this.Controls.Add(prgBar);

            // Action Buttons
            btnInstall = new Button();
            btnInstall.Text = "Pasang Sekarang";
            btnInstall.Font = new Font("Segoe UI", 10.5f, FontStyle.Bold);
            btnInstall.BackColor = Color.FromArgb(2, 132, 199);
            btnInstall.ForeColor = Color.White;
            btnInstall.FlatStyle = FlatStyle.Flat;
            btnInstall.FlatAppearance.BorderSize = 0;
            btnInstall.Location = new Point(365, 432);
            btnInstall.Size = new Size(160, 38);
            btnInstall.Cursor = Cursors.Hand;
            btnInstall.Click += (s, e) => {
                if (isFinished) {
                    this.Close();
                } else {
                    StartInstallation();
                }
            };
            this.Controls.Add(btnInstall);

            btnCancel = new Button();
            btnCancel.Text = "Batal";
            btnCancel.Font = new Font("Segoe UI", 10f);
            btnCancel.BackColor = Color.FromArgb(51, 65, 85);
            btnCancel.ForeColor = Color.White;
            btnCancel.FlatStyle = FlatStyle.Flat;
            btnCancel.FlatAppearance.BorderSize = 0;
            btnCancel.Location = new Point(535, 432);
            btnCancel.Size = new Size(65, 38);
            btnCancel.Cursor = Cursors.Hand;
            btnCancel.Click += (s, e) => this.Close();
            this.Controls.Add(btnCancel);
        }

        private void StartInstallation() {
            installDir = txtInstallPath.Text.Trim();
            if (string.IsNullOrEmpty(installDir)) return;

            btnInstall.Enabled = false;
            btnBrowse.Enabled = false;
            txtInstallPath.Enabled = false;
            chkDesktopShortcut.Enabled = false;
            chkStartMenu.Enabled = false;
            chkRegisterService.Enabled = false;
            chkOpenFirewall.Enabled = false;
            chkLaunchAfter.Enabled = false;

            Thread t = new Thread(InstallWorker);
            t.IsBackground = true;
            t.Start();
        }

        private void UpdateProgress(int pct, string status, string detail) {
            if (this.InvokeRequired) {
                this.Invoke(new Action(() => UpdateProgress(pct, status, detail)));
                return;
            }
            prgBar.Value = Math.Min(100, Math.Max(0, pct));
            if (!string.IsNullOrEmpty(status)) lblStatus.Text = status;
            if (!string.IsNullOrEmpty(detail)) lblDetail.Text = detail;
        }

        private void InstallWorker() {
            try {
                UpdateProgress(10, "Menyiapkan direktori instalasi...", installDir);
                Directory.CreateDirectory(installDir);

                UpdateProgress(25, "Mengekstrak berkas aplikasi...", "Memproses arsip payload zip...");
                using (Stream zipStream = GetEmbeddedZipPayload()) {
                    using (ZipArchive archive = new ZipArchive(zipStream)) {
                        int total = archive.Entries.Count;
                        int current = 0;
                        foreach (ZipArchiveEntry entry in archive.Entries) {
                            current++;
                            string destPath = Path.Combine(installDir, entry.FullName);
                            string destDir = Path.GetDirectoryName(destPath);
                            if (!Directory.Exists(destDir)) {
                                Directory.CreateDirectory(destDir);
                            }
                            if (!string.IsNullOrEmpty(entry.Name)) {
                                entry.ExtractToFile(destPath, true);
                            }
                            int pct = 25 + (int)((current / (double)total) * 45);
                            UpdateProgress(pct, "Mengekstrak berkas aplikasi...", entry.Name);
                        }
                    }
                }

                if (chkDesktopShortcut.Checked) {
                    UpdateProgress(75, "Membuat Pintasan Desktop...", "Desktop\\\\SIM Sarpras SMP.lnk");
                    string desktopPath = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                    string shortcutPath = Path.Combine(desktopPath, "SIM Sarpras SMP.lnk");
                    CreateWindowsShortcut(shortcutPath, installDir);
                }

                if (chkStartMenu.Checked) {
                    UpdateProgress(85, "Mendaftarkan ke Start Menu Windows...", "Start Menu Programs");
                    string startMenu = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), @"Microsoft\\Windows\\Start Menu\\Programs\\SIM Sarpras SMP");
                    Directory.CreateDirectory(startMenu);
                    string shortcutPath = Path.Combine(startMenu, "SIM Sarpras SMP.lnk");
                    CreateWindowsShortcut(shortcutPath, installDir);
                }

                RegisterInWindowsUninstall(installDir);

                if (chkRegisterService.Checked) {
                    UpdateProgress(90, "Mendaftarkan Layanan Otomatis...", "Windows Task Scheduler");
                    RegisterWindowsBackgroundService(installDir);
                }

                if (chkOpenFirewall.Checked) {
                    UpdateProgress(95, "Mengonfigurasi Windows Firewall...", "Port 3030 (Wi-Fi Sekolah)");
                    OpenWindowsFirewall();
                }

                UpdateProgress(100, "Instalasi Berhasil!", "SIM Sarpras SMP telah terpasang sempurna di komputer Anda.");

                this.Invoke(new Action(() => {
                    isFinished = true;
                    btnInstall.Text = "Selesai";
                    btnInstall.BackColor = Color.FromArgb(16, 185, 129);
                    btnInstall.Enabled = true;
                    btnCancel.Visible = false;
                    lblStatus.ForeColor = Color.FromArgb(52, 211, 153);
                }));

                if (chkLaunchAfter.Checked) {
                    LaunchAppNow(installDir);
                }
            } catch (Exception ex) {
                UpdateProgress(0, "Instalasi Gagal: " + ex.Message, ex.ToString());
                this.Invoke(new Action(() => {
                    btnInstall.Enabled = true;
                    btnInstall.Text = "Coba Lagi";
                }));
            }
        }

        private void CreateWindowsShortcut(string linkFile, string targetDir) {
            try {
                string vbsRunner = Path.Combine(targetDir, "launch-app.vbs");
                if (!File.Exists(vbsRunner)) {
                    vbsRunner = Path.Combine(targetDir, "run-server-silent.vbs");
                }
                string iconPath = Path.Combine(targetDir, "icon.svg");
                Type shellType = Type.GetTypeFromCLSID(new Guid("72C24DD5-D70A-438B-8A42-98424B88AFB8"));
                if (shellType != null) {
                    dynamic shell = Activator.CreateInstance(shellType);
                    dynamic shortcut = shell.CreateShortcut(linkFile);
                    shortcut.TargetPath = "wscript.exe";
                    shortcut.Arguments = "\\"" + vbsRunner + "\\"";
                    shortcut.WorkingDirectory = targetDir;
                    shortcut.Description = "SIM Sarpras SMP (Aplikasi Desktop Mandiri)";
                    shortcut.Save();
                }
            } catch {}
        }

        private void RegisterInWindowsUninstall(string targetDir) {
            try {
                string regKey = @"Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\SIMSarprasSMP";
                using (RegistryKey key = Registry.CurrentUser.CreateSubKey(regKey)) {
                    if (key != null) {
                        key.SetValue("DisplayName", "SIM Sarpras SMP");
                        key.SetValue("DisplayVersion", "1.0.0");
                        key.SetValue("Publisher", "SMP Negeri 3 Kras");
                        key.SetValue("InstallLocation", targetDir);
                        key.SetValue("UninstallString", "cmd.exe /c \\"" + Path.Combine(targetDir, "uninstall.cmd") + "\\"");
                    }
                }
            } catch {}
        }

        private void RegisterWindowsBackgroundService(string targetDir) {
            try {
                string vbsRunner = Path.Combine(targetDir, "launch-app.vbs");
                if (!File.Exists(vbsRunner)) {
                    vbsRunner = Path.Combine(targetDir, "run-server-silent.vbs");
                }
                if (!File.Exists(vbsRunner)) return;

                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "schtasks.exe";
                psi.Arguments = "/create /tn \\"SIM_Sarpras_Server_Daemon\\" /tr \\"wscript.exe \\\\\\"" + vbsRunner + "\\\\\\"\\" /sc ONLOGON /rl HIGHEST /f";
                psi.CreateNoWindow = true;
                psi.UseShellExecute = false;
                Process p = Process.Start(psi);
                p.WaitForExit(3000);
            } catch {}
        }

        private void OpenWindowsFirewall() {
            try {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "netsh.exe";
                psi.Arguments = "advfirewall firewall add rule name=\\"SIM_Sarpras_Port_3030\\" dir=in action=allow protocol=TCP localport=3030";
                psi.CreateNoWindow = true;
                psi.UseShellExecute = false;
                Process p = Process.Start(psi);
                p.WaitForExit(3000);
            } catch {}
        }

        private void LaunchAppNow(string targetDir) {
            try {
                string vbsRunner = Path.Combine(targetDir, "launch-app.vbs");
                if (File.Exists(vbsRunner)) {
                    Process.Start("wscript.exe", "\\"" + vbsRunner + "\\"");
                    return;
                }
            } catch {}

            try {
                string silentRunner = Path.Combine(targetDir, "run-server-silent.vbs");
                if (File.Exists(silentRunner)) {
                    Process.Start("wscript.exe", "\\"" + silentRunner + "\\"");
                }
            } catch {}
        }
    }
}
`;
}

function buildSystemInstaller() {
  console.log('================================================================');
  console.log('  📦 MEMBANGUN INSTALLER SYSTEM WINDOWS: Setup-SIM-Sarpras-SMP.exe');
  console.log('================================================================');

  ensureDir(RELEASE_DIR);
  prepareStandaloneFiles();
  const zipPath = createZipArchive();

  console.log('[3/4] Menghasilkan kode native Windows Forms Installer (C#)...');
  const csSource = generateInstallerCSharpSource();
  const csFile = path.join(RELEASE_DIR, 'SetupProgram.cs');
  fs.writeFileSync(csFile, csSource, 'utf8');

  console.log('[4/4] Menyiapkan skrip kompilasi otomatis Windows...');
  const psScript = `
$outputExe = "$PSScriptRoot\\Setup-SIM-Sarpras-SMP.exe"
$csFile = "$PSScriptRoot\\SetupProgram.cs"
$zipFile = "$PSScriptRoot\\installer_payload.zip"

Write-Host "[*] Mengompilasi Setup-SIM-Sarpras-SMP.exe..." -ForegroundColor Cyan

$cscPaths = @(
    "$env:SystemRoot\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe",
    "$env:SystemRoot\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe"
)
$csc = $cscPaths | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($csc) {
    $cscArgs = @(
        "/nologo",
        "/target:winexe",
        "/platform:anycpu",
        "/optimize+",
        "/out:$outputExe",
        "/resource:$zipFile,Payload.zip",
        "/r:System.dll",
        "/r:System.Core.dll",
        "/r:Microsoft.CSharp.dll",
        "/r:System.Windows.Forms.dll",
        "/r:System.Drawing.dll",
        "/r:System.IO.Compression.dll",
        "/r:System.IO.Compression.FileSystem.dll",
        $csFile
    )
    & $csc $cscArgs
}

if (Test-Path $outputExe) {
    Write-Host "[SUKSES] Setup-SIM-Sarpras-SMP.exe berhasil dibuat!" -ForegroundColor Green
} else {
    Write-Host "[X] Kompilasi csc.exe belum berhasil." -ForegroundColor Red
}
`;
  const psFile = path.join(RELEASE_DIR, 'compile_setup_installer.ps1');
  fs.writeFileSync(psFile, psScript, 'utf8');

  // Skrip batch 1-klik untuk membangun installer
  const buildCmd = `@echo off
setlocal enabledelayedexpansion
title BUILD INSTALLER SYSTEM WINDOWS (Setup-SIM-Sarpras-SMP.exe)
color 0B
cd /d "%~dp0"

echo ======================================================================
echo    MEMBUAT INSTALLER SYSTEM WINDOWS: Setup-SIM-Sarpras-SMP.exe
echo                   SIM SARPRAS SMP NEGERI 3 KRAS
echo ======================================================================
echo.

set "OUTPUT_EXE=%~dp0release\\Setup-SIM-Sarpras-SMP.exe"
set "CS_FILE=%~dp0release\\SetupProgram.cs"
set "PAYLOAD_ZIP=%~dp0release\\installer_payload.zip"
set "COMPILED=0"

set "CSC_EXE="
if exist "%SystemRoot%\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe" (
    set "CSC_EXE=%SystemRoot%\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe"
) else if exist "%SystemRoot%\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe" (
    set "CSC_EXE=%SystemRoot%\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe"
)

if defined CSC_EXE (
    echo [*] Mengompilasi dengan Windows native compiler: %CSC_EXE%
    "%CSC_EXE%" /nologo /target:winexe /platform:anycpu /optimize+ /out:"%OUTPUT_EXE%" /resource:"%PAYLOAD_ZIP%",Payload.zip /r:System.dll /r:System.Core.dll /r:Microsoft.CSharp.dll /r:System.Windows.Forms.dll /r:System.Drawing.dll /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll "%CS_FILE%"
    if exist "%OUTPUT_EXE%" set "COMPILED=1"
)

if "!COMPILED!"=="0" (
    echo [*] Mencoba kompilasi melalui PowerShell...
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& { & '%~dp0release\\compile_setup_installer.ps1' }"
    if exist "%OUTPUT_EXE%" set "COMPILED=1"
)

echo.
if exist "%OUTPUT_EXE%" (
    echo ======================================================================
    echo  [SUKSES] File Installer Windows Berhasil Dibuat!
    echo ======================================================================
    echo  Lokasi File: %OUTPUT_EXE%
    echo ======================================================================
    echo.
    set /p "RUN_NOW=Jalankan installer sekarang? (Y/T): "
    if /i "!RUN_NOW!"=="Y" start "" "%OUTPUT_EXE%"
) else (
    echo [X] Kompilasi .exe belum berhasil. Anda dapat menjalankan:
    echo     PASANG_KE_SYSTEM_WINDOWS.cmd
)
echo.
pause
`;
  fs.writeFileSync(path.join(ROOT_DIR, 'BUAT_INSTALLER_EXE.cmd'), buildCmd.replace(/\n/g, '\r\n'), 'utf8');

  console.log(`\n🎉 [SELESAI] Konfigurasi Installer Sistem Windows siap di: ${RELEASE_DIR}`);
}

if (require.main === module) {
  buildSystemInstaller();
}

module.exports = { buildSystemInstaller };
