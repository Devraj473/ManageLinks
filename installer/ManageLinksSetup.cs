
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
            subLabel.Text = "Your Links. Your Categories. Your Control.\n100% Offline Personal Bookmark Tool\nDeveloped by Devraj Chauhan";
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
                while ((idx = jsonPayload.IndexOf("\"", idx)) != -1)
                {
                    int endKey = jsonPayload.IndexOf("\"", idx + 1);
                    if (endKey == -1) break;
                    string key = jsonPayload.Substring(idx + 1, endKey - idx - 1);

                    int startVal = jsonPayload.IndexOf("\"", endKey + 1);
                    if (startVal == -1) break;
                    int endVal = jsonPayload.IndexOf("\"", startVal + 1);
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
                    "ManageLinks has been successfully installed on your computer!\n\nDesktop and Start Menu shortcuts have been created.\nDeveloped by Devraj Chauhan.",
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
                    Process.Start(edgePath, "--app=\"" + indexHtmlPath + "\"");
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
