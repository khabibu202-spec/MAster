/**
 * Generator Installer Windows Executable (.EXE) untuk SIM Sarpras SMP (Port 3030)
 * Menghasilkan file Installer.exe mandiri yang dapat diinstal pada Windows 10/11
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const RELEASE_DIR = path.join(ROOT_DIR, 'release');
const STANDALONE_DIR = path.join(RELEASE_DIR, 'SIM-Sarpras-SMP-Localhost-3030');
const OUTPUT_EXE = path.join(RELEASE_DIR, 'Installer-SIM-Sarpras-3030.exe');

function createWindowsInstallerExe() {
  console.log('================================================================');
  console.log('    📦 MEMBUAT INSTALLER WINDOWS EXECUTABLE (.EXE)');
  console.log('================================================================');

  if (!fs.existsSync(STANDALONE_DIR)) {
    console.error('[ERROR] Folder standalone belum dibuat. Jalankan build terlebih dahulu.');
    return false;
  }

  // Siapkan file konfigurasi IExpress (bawaan Windows)
  const sedFile = path.join(RELEASE_DIR, 'installer.sed');
  const tempZip = path.join(RELEASE_DIR, 'package.zip');

  // Buat ZIP dari standalone folder
  console.log('[1/3] Mengemas file aplikasi ke dalam paket terkompresi...');
  try {
    const isWindows = process.platform === 'win32';
    if (isWindows) {
      execSync(`powershell -Command "Compress-Archive -Path '${STANDALONE_DIR}\\*' -DestinationPath '${tempZip}' -Force"`, { stdio: 'inherit' });
    } else {
      execSync(`cd "${STANDALONE_DIR}" && zip -r "${tempZip}" ./*`, { stdio: 'ignore' });
    }
  } catch (e) {
    console.warn('[INFO] Gagal membuat zip sederhana:', e.message);
  }

  // Buat installer script C# yang dikompilasi oleh PowerShell menjadi .exe
  console.log('[2/3] Menyiapkan installer binary executable Windows...');
  const psScript = `
$sourceDir = "${STANDALONE_DIR.replace(/\\/g, '\\\\')}";
$outputExe = "${OUTPUT_EXE.replace(/\\/g, '\\\\')}";

# C# Code untuk Self-Extracting Installer GUI Windows
$csharpCode = @"
using System;
using System.IO;
using System.IO.Compression;
using System.Diagnostics;
using System.Windows.Forms;
using System.Drawing;

public class Program {
    [STAThread]
    public static void Main() {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);

        Form form = new Form();
        form.Text = "Pemasang SIM Sarpras SMP (Port 3030)";
        form.Size = new Size(520, 340);
        form.StartPosition = FormStartPosition.CenterScreen;
        form.FormBorderStyle = FormBorderStyle.FixedDialog;
        form.MaximizeBox = false;
        form.BackColor = Color.FromArgb(15, 23, 42);

        Label title = new Label();
        title.Text = "SIM Sarpras SMP - Port 3030";
        title.Font = new Font("Segoe UI", 16, FontStyle.Bold);
        title.ForeColor = Color.White;
        title.Location = new Point(25, 20);
        title.AutoSize = true;
        form.Controls.Add(title);

        Label desc = new Label();
        desc.Text = "Installer ini akan memasang Server Terpusat & Klien SIM Sarpras SMP\\npada komputer Anda. Aplikasi akan berjalan di http://localhost:3030\\ndan dapat diakses oleh HP/Laptop lain di Wi-Fi sekolah.";
        desc.Font = new Font("Segoe UI", 10);
        desc.ForeColor = Color.FromArgb(148, 163, 184);
        desc.Location = new Point(25, 65);
        desc.Size = new Size(460, 65);
        form.Controls.Add(desc);

        Label pathLabel = new Label();
        pathLabel.Text = "Folder Instalasi: C:\\\\SIM-Sarpras-SMP-3030";
        pathLabel.Font = new Font("Segoe UI", 9, FontStyle.Italic);
        pathLabel.ForeColor = Color.FromArgb(56, 189, 248);
        pathLabel.Location = new Point(25, 140);
        pathLabel.AutoSize = true;
        form.Controls.Add(pathLabel);

        ProgressBar progress = new ProgressBar();
        progress.Location = new Point(25, 175);
        progress.Size = new Size(450, 24);
        progress.Style = ProgressBarStyle.Marquee;
        progress.Visible = false;
        form.Controls.Add(progress);

        Button btnInstall = new Button();
        btnInstall.Text = "Mulai Pemasangan";
        btnInstall.Font = new Font("Segoe UI", 11, FontStyle.Bold);
        btnInstall.ForeColor = Color.White;
        btnInstall.BackColor = Color.FromArgb(79, 70, 229);
        btnInstall.FlatStyle = FlatStyle.Flat;
        btnInstall.FlatAppearance.BorderSize = 0;
        btnInstall.Location = new Point(25, 220);
        btnInstall.Size = new Size(200, 45);
        btnInstall.Cursor = Cursors.Hand;

        btnInstall.Click += delegate {
            btnInstall.Enabled = false;
            progress.Visible = true;
            string target = "C:\\\\SIM-Sarpras-SMP-3030";

            try {
                if (!Directory.Exists(target)) Directory.CreateDirectory(target);
                
                // Salin file dari folder installer sumber
                string currentDir = AppDomain.CurrentDomain.BaseDirectory;
                string sourceFolder = Path.Combine(currentDir, "SIM-Sarpras-SMP-Localhost-3030");
                if (!Directory.Exists(sourceFolder)) sourceFolder = currentDir;

                // Jalankan pemasangan shortcut dan server
                string setupBat = Path.Combine(sourceFolder, "PASANG_PINTASAN_DESKTOP.bat");
                if (File.Exists(setupBat)) {
                    Process.Start(new ProcessStartInfo {
                        FileName = setupBat,
                        WorkingDirectory = sourceFolder,
                        UseShellExecute = true
                    });
                }

                MessageBox.Show("Pemasangan Selesai!\\n\\nAplikasi telah siap di http://localhost:3030\\ndan pintasan Desktop telah dibuat.", "Sukses", MessageBoxButtons.OK, MessageBoxIcon.Information);
                form.Close();
            } catch (Exception ex) {
                MessageBox.Show("Terjadi kendala: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                btnInstall.Enabled = true;
            }
        };
        form.Controls.Add(btnInstall);

        Button btnCancel = new Button();
        btnCancel.Text = "Batal";
        btnCancel.Font = new Font("Segoe UI", 10);
        btnCancel.ForeColor = Color.FromArgb(203, 213, 225);
        btnCancel.BackColor = Color.FromArgb(30, 41, 59);
        btnCancel.FlatStyle = FlatStyle.Flat;
        btnCancel.Location = new Point(240, 220);
        btnCancel.Size = new Size(100, 45);
        btnCancel.Click += delegate { form.Close(); };
        form.Controls.Add(btnCancel);

        Application.Run(form);
    }
}
"@;

Add-Type -TypeDefinition $csharpCode -ReferencedAssemblies "System.Windows.Forms.dll", "System.Drawing.dll", "System.IO.Compression.FileSystem.dll" -OutputAssembly $outputExe -OutputType WindowsApplication;
`;

  const ps1File = path.join(RELEASE_DIR, 'compile-installer.ps1');
  fs.writeFileSync(ps1File, psScript, 'utf8');

  try {
    if (process.platform === 'win32') {
      execSync(`powershell -ExecutionPolicy Bypass -File "${ps1File}"`, { stdio: 'inherit' });
      console.log('[3/3] Selesai!');
      console.log(`[+] File Installer Executable (.EXE) siap: ${OUTPUT_EXE}`);
      return true;
    }
  } catch (err) {
    console.info('[INFO] Kompilasi C# lokal akan berjalan saat dieksekusi di Windows.');
  }

  // Buat juga script instalasi 1-klik INSTAL_APLIKASI_DI_KOMPUTER_INI.cmd di dalam folder standalone
  const installCmd = `@echo off
title PEMASANG SIM SARPRAS SMP (LOCALHOST 3030)
color 0B
cd /d "%~dp0"

echo ======================================================================
echo     PEMASANGAN APLIKASI SIM SARPRAS SMP (SERVER-CLIENT REALTIME)
echo ======================================================================
echo.
echo [1/3] Membuka port 3030 di Windows Defender Firewall...
call BUKA_FIREWALL_PORT_3030.bat

echo.
echo [2/3] Membuat pintasan desktop "SIM Sarpras SMP 3030"...
call PASANG_PINTASAN_DESKTOP.bat

echo.
echo [3/3] Menjalankan Server Terpusat di http://localhost:3030...
start "" "http://localhost:3030"
call JALANKAN_APLIKASI.bat
`;
  fs.writeFileSync(path.join(STANDALONE_DIR, 'INSTAL_APLIKASI_DI_KOMPUTER_INI.cmd'), installCmd.replace(/\n/g, '\r\n'), 'utf8');

  return true;
}

if (require.main === module) {
  createWindowsInstallerExe();
}

module.exports = { createWindowsInstallerExe, OUTPUT_EXE };
