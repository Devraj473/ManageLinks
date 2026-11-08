/**
 * ManageLinks - Native Windows Installer Builder
 * Developer: Devraj Chauhan
 * Compiles a standalone native Windows .exe installer using csc.exe
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Required files to bundle into the installer
const APP_FILES = [
  'index.html',
  'manifest.json',
  'service-worker.js',
  'README.md',
  'LICENSE',
  'assets/vendor/bootstrap.min.css',
  'assets/vendor/bootstrap.bundle.min.js',
  'assets/vendor/jszip.min.js',
  'assets/css/style.css',
  'assets/css/responsive.css',
  'assets/css/themes.css',
  'assets/css/components.css',
  'assets/icons/favicon.svg',
  'assets/icons/icon-192.svg',
  'assets/icons/icon-512.svg',
  'assets/js/app.js',
  'assets/js/database.js',
  'assets/js/storage.js',
  'assets/js/icons.js',
  'assets/js/link-manager.js',
  'assets/js/category-manager.js',
  'assets/js/folder-manager.js',
  'assets/js/collection-manager.js',
  'assets/js/search.js',
  'assets/js/filters.js',
  'assets/js/notes-manager.js',
  'assets/js/analytics.js',
  'assets/js/backup.js',
  'assets/js/restore.js',
  'assets/js/import.js',
  'assets/js/export.js',
  'assets/js/security.js',
  'assets/js/settings.js',
  'assets/js/notifications.js',
  'assets/js/shortcuts.js',
  'assets/js/router.js',
  'assets/js/ui.js',
  'assets/js/pwa-installer.js',
  'components/sidebar.js',
  'components/navbar.js',
  'components/link-card.js',
  'components/link-modal.js',
  'components/note-modal.js',
  'components/category-modal.js',
  'components/folder-modal.js',
  'components/collection-modal.js',
  'components/search-modal.js',
  'components/confirmation-modal.js',
  'components/toast.js',
  'components/empty-state.js',
  'components/pdf-modal.js',
  'components/share-modal.js',
  'pages/dashboard.js',
  'pages/all-links.js',
  'pages/link-inbox.js',
  'pages/favorites.js',
  'pages/categories.js',
  'pages/folders.js',
  'pages/collections.js',
  'pages/notes.js',
  'pages/reading-list.js',
  'pages/archive.js',
  'pages/trash.js',
  'pages/analytics.js',
  'pages/data-management.js',
  'pages/settings.js',
  'pages/about.js',
  'utils/validators.js',
  'utils/date-utils.js',
  'utils/url-utils.js',
  'utils/file-utils.js',
  'utils/csv-parser.js',
  'utils/html-bookmark-parser.js',
  'utils/encryption.js',
  'utils/pdf-generator.js',
  'utils/app-downloader.js'
];

console.log('Building ManageLinks Native Windows Installer (.exe)...');

// 1. Pack files into in-memory archive
const fileMap = {};
for (const relPath of APP_FILES) {
  const fullPath = path.join(rootDir, relPath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath);
    fileMap[relPath.replace(/\\/g, '/')] = content.toString('base64');
  } else {
    console.warn(`File not found: ${relPath}`);
  }
}

const payloadJson = JSON.stringify(fileMap);
const payloadGz = Buffer.from(payloadJson, 'utf8');

// Write payload to installer directory
const payloadPath = path.join(__dirname, 'payload.dat');
fs.writeFileSync(payloadPath, payloadGz);

console.log(`Payload created: ${payloadGz.length} bytes for ${Object.keys(fileMap).length} files.`);

// 2. Generate C# Installer source code
const csharpSource = `
using System;
using System.IO;
using System.Text;
using System.Collections.Generic;
using System.Diagnostics;
using System.Windows.Forms;
using System.Drawing;

namespace ManageLinksInstaller
{
    public class InstallerForm : Form
    {
        private ProgressBar progressBar;
        private Label statusLabel;
        private Label titleLabel;
        private Label subLabel;
        private Button startButton;

        public InstallerForm()
        {
            this.Text = "ManageLinks Setup - Devraj Chauhan";
            this.Size = new Size(480, 320);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.White;

            titleLabel = new Label();
            titleLabel.Text = "ManageLinks";
            titleLabel.Font = new Font("Segoe UI", 18, FontStyle.Bold);
            titleLabel.ForeColor = Color.FromArgb(37, 99, 235);
            titleLabel.Location = new Point(24, 20);
            titleLabel.AutoSize = true;

            subLabel = new Label();
            subLabel.Text = "Your Links. Your Categories. Your Control.\\n100% Offline Personal Bookmark Tool\\nDeveloped by Devraj Chauhan";
            subLabel.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            subLabel.ForeColor = Color.FromArgb(71, 85, 105);
            subLabel.Location = new Point(26, 60);
            subLabel.Size = new Size(420, 60);

            statusLabel = new Label();
            statusLabel.Text = "Click 'Install Now' to install ManageLinks on this computer.";
            statusLabel.Font = new Font("Segoe UI", 9, FontStyle.Regular);
            statusLabel.ForeColor = Color.FromArgb(100, 116, 139);
            statusLabel.Location = new Point(26, 140);
            statusLabel.Size = new Size(420, 25);

            progressBar = new ProgressBar();
            progressBar.Location = new Point(26, 170);
            progressBar.Size = new Size(410, 24);
            progressBar.Style = ProgressBarStyle.Blocks;
            progressBar.Value = 0;

            startButton = new Button();
            startButton.Text = "Install & Launch";
            startButton.Font = new Font("Segoe UI", 10, FontStyle.Bold);
            startButton.BackColor = Color.FromArgb(37, 99, 235);
            startButton.ForeColor = Color.White;
            startButton.FlatStyle = FlatStyle.Flat;
            startButton.FlatAppearance.BorderSize = 0;
            startButton.Location = new Point(280, 220);
            startButton.Size = new Size(156, 38);
            startButton.Click += new EventHandler(this.OnInstallClick);

            this.Controls.Add(titleLabel);
            this.Controls.Add(subLabel);
            this.Controls.Add(statusLabel);
            this.Controls.Add(progressBar);
            this.Controls.Add(startButton);
        }

        private void OnInstallClick(object sender, EventArgs e)
        {
            startButton.Enabled = false;
            statusLabel.Text = "Installing application files...";
            progressBar.Value = 25;

            try
            {
                string targetDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "ManageLinks");
                if (!Directory.Exists(targetDir))
                {
                    Directory.CreateDirectory(targetDir);
                }

                // Unpack embedded files
                progressBar.Value = 50;
                string jsonPayload = null;
                using (Stream stream = typeof(InstallerForm).Assembly.GetManifestResourceStream("payload.dat"))
                {
                    if (stream != null)
                    {
                        using (StreamReader reader = new StreamReader(stream, Encoding.UTF8))
                        {
                            jsonPayload = reader.ReadToEnd();
                        }
                    }
                }

                if (string.IsNullOrEmpty(jsonPayload))
                {
                    string localPayload = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "payload.dat");
                    if (File.Exists(localPayload))
                    {
                        jsonPayload = File.ReadAllText(localPayload, Encoding.UTF8);
                    }
                }

                if (string.IsNullOrEmpty(jsonPayload))
                {
                    throw new Exception("Embedded application payload could not be loaded.");
                }
                
                // Parse simple dictionary
                int count = 0;
                int idx = 0;
                while ((idx = jsonPayload.IndexOf("\\"", idx)) != -1)
                {
                    int endKey = jsonPayload.IndexOf("\\"", idx + 1);
                    if (endKey == -1) break;
                    string key = jsonPayload.Substring(idx + 1, endKey - idx - 1);

                    int startVal = jsonPayload.IndexOf("\\"", endKey + 1);
                    if (startVal == -1) break;
                    int endVal = jsonPayload.IndexOf("\\"", startVal + 1);
                    if (endVal == -1) break;
                    string b64 = jsonPayload.Substring(startVal + 1, endVal - startVal - 1);

                    idx = endVal + 1;

                    if (!string.IsNullOrEmpty(key) && !string.IsNullOrEmpty(b64))
                    {
                        string destPath = Path.Combine(targetDir, key.Replace('/', Path.DirectorySeparatorChar));
                        string destFolder = Path.GetDirectoryName(destPath);
                        if (!Directory.Exists(destFolder)) Directory.CreateDirectory(destFolder);

                        byte[] bytes = Convert.FromBase64String(b64);
                        File.WriteAllBytes(destPath, bytes);
                        count++;
                    }
                }

                progressBar.Value = 80;
                statusLabel.Text = "Creating desktop and start menu shortcuts...";

                // Create Shortcut
                string indexHtmlPath = Path.Combine(targetDir, "index.html");
                CreateShortcuts(targetDir, indexHtmlPath);

                progressBar.Value = 100;
                statusLabel.Text = "Installation complete! Launching ManageLinks...";

                // Launch Application
                LaunchApp(indexHtmlPath);

                MessageBox.Show(
                    "ManageLinks has been successfully installed on your computer!\\n\\nDesktop and Start Menu shortcuts have been created.\\nDeveloped by Devraj Chauhan.",
                    "ManageLinks Setup Complete",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information
                );

                this.Close();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Installation error: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                startButton.Enabled = true;
                statusLabel.Text = "Installation failed.";
            }
        }

        private void CreateShortcuts(string targetDir, string indexHtmlPath)
        {
            try
            {
                // Create VBScript to create .lnk shortcuts safely without COM references
                string vbsPath = Path.Combine(Path.GetTempPath(), "ml_create_shortcut.vbs");
                string desktopLnk = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "ManageLinks.lnk");
                string startMenuLnk = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.StartMenu), "Programs", "ManageLinks.lnk");

                string edgePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Microsoft", "Edge", "Application", "msedge.exe");
                if (!File.Exists(edgePath))
                {
                    edgePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Microsoft", "Edge", "Application", "msedge.exe");
                }

                string targetExe = File.Exists(edgePath) ? edgePath : "explorer.exe";
                char q = (char)34;
                string args = File.Exists(edgePath) ? ("--app=" + q + indexHtmlPath + q) : (q + indexHtmlPath + q);

                using (StreamWriter sw = new StreamWriter(vbsPath, false, Encoding.ASCII))
                {
                    sw.WriteLine("Set w = CreateObject(" + q + "WScript.Shell" + q + ")");
                    sw.WriteLine("Set s1 = w.CreateShortcut(" + q + desktopLnk + q + ")");
                    sw.WriteLine("s1.TargetPath = " + q + targetExe + q);
                    sw.WriteLine("s1.Arguments = " + q + args + q);
                    sw.WriteLine("s1.WorkingDirectory = " + q + targetDir + q);
                    sw.WriteLine("s1.Description = " + q + "ManageLinks Offline Personal Bookmark Manager" + q);
                    sw.WriteLine("s1.Save");

                    sw.WriteLine("Set s2 = w.CreateShortcut(" + q + startMenuLnk + q + ")");
                    sw.WriteLine("s2.TargetPath = " + q + targetExe + q);
                    sw.WriteLine("s2.Arguments = " + q + args + q);
                    sw.WriteLine("s2.WorkingDirectory = " + q + targetDir + q);
                    sw.WriteLine("s2.Description = " + q + "ManageLinks Offline Personal Bookmark Manager" + q);
                    sw.WriteLine("s2.Save");
                }

                Process p = Process.Start(new ProcessStartInfo("wscript.exe", q + vbsPath + q) { CreateNoWindow = true, UseShellExecute = false });
                if (p != null)
                {
                    p.WaitForExit(4000);
                }
                try { File.Delete(vbsPath); } catch {}
            }
            catch {}
        }

        private void LaunchApp(string indexHtmlPath)
        {
            try
            {
                string edgePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Microsoft", "Edge", "Application", "msedge.exe");
                if (!File.Exists(edgePath))
                {
                    edgePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Microsoft", "Edge", "Application", "msedge.exe");
                }

                if (File.Exists(edgePath))
                {
                    Process.Start(edgePath, "--app=\\"" + indexHtmlPath + "\\"");
                }
                else
                {
                    Process.Start(indexHtmlPath);
                }
            }
            catch
            {
                Process.Start(indexHtmlPath);
            }
        }

        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new InstallerForm());
        }
    }

    internal static class Properties
    {
        internal static class Resources
        {
            internal static byte[] Payload
            {
                get
                {
                    string path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "payload.dat");
                    if (File.Exists(path)) return File.ReadAllBytes(path);
                    return new byte[0];
                }
            }
        }
    }
}
`;

const csPath = path.join(__dirname, 'ManageLinksSetup.cs');
fs.writeFileSync(csPath, csharpSource);

// 3. Compile with csc.exe into ManageLinks-Setup.exe
const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
const outExePath = path.join(rootDir, 'ManageLinks-Setup.exe');
const resPath = path.join(__dirname, 'payload.dat');

try {
  const compileCmd = `"${cscPath}" /target:winexe /optimize+ /out:"${outExePath}" /resource:"${resPath}",payload.dat "${csPath}" /reference:System.Windows.Forms.dll /reference:System.Drawing.dll`;
  console.log('Compiling C# installer...');
  execSync(compileCmd, { stdio: 'inherit' });
  console.log(`Successfully built: ${outExePath}`);
} catch (e) {
  console.error('Compilation failed:', e);
}
