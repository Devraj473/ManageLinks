/**
 * ManageLinks - About & Legal Documentation
 * Developer: Devraj Chauhan
 * Contains Comprehensive About, Data Storage Architecture, Privacy Policy, Terms, Disclaimer & Contact
 */

import { Icons } from '../assets/js/icons.js';

export const AboutPage = {
  render() {
    const container = document.getElementById('content-area');

    container.innerHTML = `
      <div class="row g-4">
        <div class="col-lg-9 mx-auto">
          <!-- Main Brand Hero Box -->
          <div class="card border shadow-sm text-center p-4 mb-4">
            <div class="d-inline-flex p-3 rounded-3 bg-primary text-white mx-auto mb-3 shadow">
              ${Icons.get('bookmark', { size: 36, color: '#fff' })}
            </div>
            <h2 class="fw-bold mb-1">ManageLinks by Devraj Chauhan</h2>
            <div class="text-primary fw-semibold mb-2">Your Links. Your Categories. Your Control.</div>
            <p class="text-secondary max-w-lg mx-auto mb-3" style="max-width: 600px;">
              Personal, privacy-first offline Progressive Web Application (PWA) for managing, categorizing, organizing, backing up, and restoring website links and personal notes across all your devices.
            </p>
            <div class="d-flex flex-wrap justify-content-center gap-2">
              <span class="badge bg-primary px-3 py-2">Version 1.0</span>
              <span class="badge bg-success-subtle text-success px-3 py-2 border border-success-subtle">100% Offline-First</span>
              <span class="badge bg-secondary-subtle text-secondary px-3 py-2 border">Zero Server Architecture</span>
              <span class="badge bg-info-subtle text-info px-3 py-2 border border-info-subtle">No Cloud Telemetry</span>
            </div>
          </div>

          <!-- Section 1: About the Application -->
          <div class="card border shadow-sm mb-4">
            <div class="card-header bg-transparent py-3">
              <h5 class="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                ${Icons.get('info', { size: 18 })}
                <span>About ManageLinks</span>
              </h5>
            </div>
            <div class="card-body">
              <p class="text-secondary mb-3">
                <strong>ManageLinks</strong> is a client-side offline personal link management and cataloging workstation developed by <strong>Devraj Chauhan</strong>. In an era where most bookmark managers require third-party cloud accounts, subscription fees, and track browsing habits, ManageLinks is built on the fundamental principle of complete digital sovereignty.
              </p>
              <p class="text-secondary mb-3">
                With ManageLinks, your links, personal notes, custom categories, nested folders, reading lists, and collections are managed exclusively inside your own device storage. The application does not possess any backend servers, does not send data over the internet, and functions identically whether you are connected to high-speed internet or operating in complete offline isolation.
              </p>
              <div class="row g-3 mt-1">
                <div class="col-sm-6">
                  <div class="p-3 bg-light rounded border h-100">
                    <div class="fw-bold text-dark mb-1">Total Privacy</div>
                    <div class="text-muted small">No account creation, no password servers, and no behavioral tracking scripts whatsoever.</div>
                  </div>
                </div>
                <div class="col-sm-6">
                  <div class="p-3 bg-light rounded border h-100">
                    <div class="fw-bold text-dark mb-1">True Offline Utility</div>
                    <div class="text-muted small">Runs completely standalone. Open anytime without an internet connection or web server.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: Data Storage & Comprehensive Step-by-Step Backup Guide -->
          <div class="card border shadow-sm mb-4">
            <div class="card-header bg-transparent py-3">
              <h5 class="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                ${Icons.get('database', { size: 18 })}
                <span>Local Data Storage & Step-by-Step Backup Guide</span>
              </h5>
            </div>
            <div class="card-body">
              <p class="text-secondary mb-4">
                ManageLinks is built upon a 100% offline-first architecture. Here is the exact architectural breakdown of where your data lives, all available backup types, and how to safely backup and restore your data across devices:
              </p>

              <!-- Local Storage Architecture Pillars -->
              <div class="row g-3 mb-4">
                <div class="col-md-6">
                  <div class="p-3 bg-light rounded border h-100">
                    <div class="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                      <span class="text-primary">${Icons.get('database', { size: 16 })}</span>
                      <span>Local Sandboxed IndexedDB</span>
                    </div>
                    <p class="small text-secondary mb-0">
                      All links, personal notes, Google Drive style note folders, categories, and tags are stored in your browser's local <strong>IndexedDB</strong> (<code>ManageLinksDB</code>). No external cloud databases (Firebase, Supabase, MySQL) are ever contacted.
                    </p>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="p-3 bg-light rounded border h-100">
                    <div class="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                      <span class="text-success">${Icons.get('shield', { size: 16 })}</span>
                      <span>Zero Cloud Telemetry</span>
                    </div>
                    <p class="small text-secondary mb-0">
                      Zero tracking scripts, zero background analytics, zero telemetry. The application operates flawlessly in Airplane Mode or without an active internet connection.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Available Backup Types Breakdown -->
              <h6 class="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                ${Icons.get('file-text', { size: 16, color: 'var(--ml-primary)' })}
                <span>Available Backup Formats & Types</span>
              </h6>
              <div class="table-responsive mb-4">
                <table class="table table-bordered table-sm small align-middle mb-0">
                  <thead class="table-light">
                    <tr>
                      <th style="width: 25%;">Backup Type</th>
                      <th style="width: 15%;">Format</th>
                      <th>Contents & Recommended Use</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="fw-bold text-primary">Instant Database Backup</td>
                      <td><code>.json</code></td>
                      <td>Complete library: All links, personal notes, note folders, categories, and settings in one portable JSON file.</td>
                    </tr>
                    <tr>
                      <td class="fw-bold text-primary">Master ZIP Backup Archive</td>
                      <td><code>.zip</code></td>
                      <td>Comprehensive multi-format bundle: includes <code>backup.json</code>, browser-standard <code>bookmarks.html</code>, spreadsheet <code>links.csv</code>, and individual <code>.txt</code> files for each note inside a <code>notes/</code> directory.</td>
                    </tr>
                    <tr>
                      <td class="fw-bold text-primary">Personal Notes Only</td>
                      <td><code>.json</code></td>
                      <td>Backs up personal notes, tags, and Google Drive style folder hierarchy only. Ideal when backing up private memos.</td>
                    </tr>
                    <tr>
                      <td class="fw-bold text-primary">Encrypted Military-Grade Backup</td>
                      <td><code>.json</code></td>
                      <td>Password-protected archive encrypted via Web Crypto API with PBKDF2 (100,000 rounds) and AES-GCM 256-bit encryption.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Step-by-Step Backup Walkthrough -->
              <h6 class="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                ${Icons.get('check-circle', { size: 16, color: '#16a34a' })}
                <span>Step-by-Step Guide: How to Backup Your Data</span>
              </h6>

              <div class="d-flex flex-column gap-3 mb-4">
                <!-- Step 1 -->
                <div class="d-flex gap-3">
                  <div class="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle flex-shrink-0" style="width: 28px; height: 28px; font-weight: bold; font-size: 0.85rem;">
                    1
                  </div>
                  <div>
                    <div class="fw-bold text-dark small">Open Database & Backup Center</div>
                    <p class="text-secondary small mb-0">
                      Navigate to <strong>Settings &rarr; Database & Backup Center</strong> or click the Database icon in the top navbar.
                    </p>
                  </div>
                </div>

                <!-- Step 2 -->
                <div class="d-flex gap-3">
                  <div class="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle flex-shrink-0" style="width: 28px; height: 28px; font-weight: bold; font-size: 0.85rem;">
                    2
                  </div>
                  <div>
                    <div class="fw-bold text-dark small">Select Your Backup Method</div>
                    <p class="text-secondary small mb-0">
                      Choose <strong>Download Backup (.json)</strong> for standard JSON, or <strong>Download Master ZIP (.zip)</strong> for the all-inclusive multi-file archive, or configure a custom password in the Encrypted Backup accordion.
                    </p>
                  </div>
                </div>

                <!-- Step 3 -->
                <div class="d-flex gap-3">
                  <div class="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle flex-shrink-0" style="width: 28px; height: 28px; font-weight: bold; font-size: 0.85rem;">
                    3
                  </div>
                  <div>
                    <div class="fw-bold text-dark small">Download to Disk or Share Directly</div>
                    <p class="text-secondary small mb-0">
                      Click <strong>Download</strong> to save the backup file onto your hard drive or USB flash drive, or click <strong>Directly Share Backup File</strong> to invoke native sharing or send via WhatsApp, Telegram, or Email without manual downloading.
                    </p>
                  </div>
                </div>

                <!-- Step 4 -->
                <div class="d-flex gap-3">
                  <div class="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle flex-shrink-0" style="width: 28px; height: 28px; font-weight: bold; font-size: 0.85rem;">
                    4
                  </div>
                  <div>
                    <div class="fw-bold text-dark small">Safe Storage & Retention</div>
                    <p class="text-secondary small mb-0">
                      Store your backup file on a USB flash drive, secondary computer, or external disk. Because ManageLinks backups are standard JSON/ZIP, they can be read on Windows, macOS, Linux, Android, and iOS.
                    </p>
                  </div>
                </div>

                <!-- Step 5 -->
                <div class="d-flex gap-3">
                  <div class="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle flex-shrink-0" style="width: 28px; height: 28px; font-weight: bold; font-size: 0.85rem;">
                    5
                  </div>
                  <div>
                    <div class="fw-bold text-dark small">How to Restore on Any Device</div>
                    <p class="text-secondary small mb-0">
                      To transfer your data to a new computer or phone, open ManageLinks, go to <strong>Database & Backup Center &rarr; Restore Wizard</strong>, select your <code>.json</code> or <code>.zip</code> file, select <em>Merge</em> or <em>Replace</em>, and click <strong>Execute Restoration</strong>. An automatic emergency safety snapshot is generated before any restoration.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 3: Privacy Policy -->
          <div class="card border shadow-sm mb-4">
            <div class="card-header bg-transparent py-3">
              <h5 class="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                ${Icons.get('shield', { size: 18 })}
                <span>Strict Privacy Policy</span>
              </h5>
            </div>
            <div class="card-body">
              <p class="text-secondary mb-3">
                ManageLinks is designed under a <strong>Zero-Knowledge & Zero-Collection Privacy Policy</strong>:
              </p>
              <ul class="text-secondary small ps-3 mb-3">
                <li class="mb-2"><strong>No Personal Information Collected:</strong> We do not ask for, collect, store, or transmit your name, email address, phone number, or identity.</li>
                <li class="mb-2"><strong>No Browsing History Tracking:</strong> We never log, track, monitor, or analyze which links you bookmark, which categories you create, or what notes you write.</li>
                <li class="mb-2"><strong>No Cookies or Tracking Pixels:</strong> ManageLinks does not use HTTP tracking cookies, marketing scripts, fingerprinting scripts, Google Analytics, or third-party ad networks.</li>
                <li class="mb-2"><strong>Device Confinement:</strong> All data stored in IndexedDB is confined to your browser's security origin sandbox. Other websites cannot inspect or access your saved links.</li>
                <li class="mb-0"><strong>Permanent Local Deletion:</strong> You have the absolute right to purge all data at any moment from the Settings page. Wiping data deletes all tables and local stores permanently from your computer.</li>
              </ul>
            </div>
          </div>

          <!-- Section 4: Terms & Conditions -->
          <div class="card border shadow-sm mb-4">
            <div class="card-header bg-transparent py-3">
              <h5 class="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                ${Icons.get('file-text', { size: 18 })}
                <span>Terms & Conditions</span>
              </h5>
            </div>
            <div class="card-body">
              <p class="text-secondary small mb-3">
                By utilizing ManageLinks, you agree to the following straightforward terms:
              </p>
              <ol class="text-secondary small ps-3 mb-0">
                <li class="mb-2"><strong>Free Personal Use:</strong> ManageLinks is provided free of charge for personal bookmarking, cataloging, research, and offline organization.</li>
                <li class="mb-2"><strong>100% User Ownership:</strong> You retain full, exclusive ownership of all bookmarks, URLs, descriptions, tags, notes, and files created in or exported from the application.</li>
                <li class="mb-2"><strong>Offline Responsibility:</strong> Because ManageLinks does not maintain cloud mirrors of your data, you are solely responsible for creating regular backups using the built-in Backup Center before clearing your browser cache or reformatting your operating system.</li>
                <li class="mb-0"><strong>Lawful Use:</strong> You agree not to use the tool for storing or transmitting harmful, unlawful, or infringing content in accordance with your local jurisdiction.</li>
              </ol>
            </div>
          </div>

          <!-- Section 5: Disclaimer -->
          <div class="card border shadow-sm mb-4">
            <div class="card-header bg-transparent py-3">
              <h5 class="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                ${Icons.get('alert-triangle', { size: 18 })}
                <span>Disclaimer</span>
              </h5>
            </div>
            <div class="card-body">
              <p class="text-secondary small mb-0">
                ManageLinks is provided on an "AS-IS" and "AS-AVAILABLE" basis without warranties of any kind, either express or implied. While the software employs robust data persistence models, automated error handling, and optional AES-GCM encryption, the developer cannot be held liable for accidental local data loss caused by hardware drive failures, browser cache purges, operating system re-installations, or forgotten encryption passwords. Regular JSON backups are strongly recommended.
              </p>
            </div>
          </div>

          <!-- Section 6: Developer Credit & Contact -->
          <div class="card border border-primary-subtle shadow-sm">
            <div class="card-header bg-primary bg-opacity-10 py-3">
              <h5 class="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                ${Icons.get('user', { size: 18 })}
                <span>Developer Credit & Contact Information</span>
              </h5>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <div class="text-muted small">Application Name</div>
                  <div class="fw-bold fs-6 text-dark">ManageLinks</div>
                  <div class="text-secondary small">Official Full Title: ManageLinks by Devraj Chauhan</div>
                </div>
                <div class="col-md-6">
                  <div class="text-muted small">Software Version</div>
                  <div class="fw-bold fs-6 text-dark">Version 1.0 (Production Release)</div>
                </div>
                <div class="col-md-6">
                  <div class="text-muted small">Lead Architect & Developer</div>
                  <div class="fw-bold fs-6 text-dark">Devraj Chauhan</div>
                  <div class="text-secondary small">Software Engineer & Frontend Specialist</div>
                </div>
                <div class="col-md-6">
                  <div class="text-muted small">Developer Contact Email</div>
                  <div class="fw-bold fs-6">
                    <a href="mailto:devrajchauhan.work@gmail.com" class="text-primary text-decoration-none">
                      devrajchauhan.work@gmail.com
                    </a>
                  </div>
                  <div class="text-muted small">Direct inquiries, feedback, and questions</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;
  }
};
