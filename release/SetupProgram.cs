
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
                    UpdateProgress(75, "Membuat Pintasan Desktop...", "Desktop\\SIM Sarpras SMP.lnk");
                    string desktopPath = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                    string shortcutPath = Path.Combine(desktopPath, "SIM Sarpras SMP.lnk");
                    CreateWindowsShortcut(shortcutPath, installDir);
                }

                if (chkStartMenu.Checked) {
                    UpdateProgress(85, "Mendaftarkan ke Start Menu Windows...", "Start Menu Programs");
                    string startMenu = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), @"Microsoft\Windows\Start Menu\Programs\SIM Sarpras SMP");
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
                    shortcut.Arguments = "\"" + vbsRunner + "\"";
                    shortcut.WorkingDirectory = targetDir;
                    shortcut.Description = "SIM Sarpras SMP (Aplikasi Desktop Mandiri)";
                    shortcut.Save();
                }
            } catch {}
        }

        private void RegisterInWindowsUninstall(string targetDir) {
            try {
                string regKey = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\SIMSarprasSMP";
                using (RegistryKey key = Registry.CurrentUser.CreateSubKey(regKey)) {
                    if (key != null) {
                        key.SetValue("DisplayName", "SIM Sarpras SMP");
                        key.SetValue("DisplayVersion", "1.0.0");
                        key.SetValue("Publisher", "SMP Negeri 3 Kras");
                        key.SetValue("InstallLocation", targetDir);
                        key.SetValue("UninstallString", "cmd.exe /c \"" + Path.Combine(targetDir, "uninstall.cmd") + "\"");
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
                psi.Arguments = "/create /tn \"SIM_Sarpras_Server_Daemon\" /tr \"wscript.exe \\\"" + vbsRunner + "\\\"\" /sc ONLOGON /rl HIGHEST /f";
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
                psi.Arguments = "advfirewall firewall add rule name=\"SIM_Sarpras_Port_3030\" dir=in action=allow protocol=TCP localport=3030";
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
                    Process.Start("wscript.exe", "\"" + vbsRunner + "\"");
                    return;
                }
            } catch {}

            try {
                string silentRunner = Path.Combine(targetDir, "run-server-silent.vbs");
                if (File.Exists(silentRunner)) {
                    Process.Start("wscript.exe", "\"" + silentRunner + "\"");
                }
            } catch {}
        }
    }
}
