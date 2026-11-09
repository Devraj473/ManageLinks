/**
 * ManageLinks - About & Technical Architecture Documentation
 * Developer: Devraj Chauhan
 * Comprehensive details on local storage, browser developer tools inspection, account login/logout behavior, data deletion, security, and developer contact.
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
            <p class="text-secondary max-w-lg mx-auto mb-3" style="max-width: 620px;">
              An offline-first, client-side Progressive Web Application (PWA) for organizing bookmarks, links, personal notes, and Google Drive-style folders with complete data sovereignty and zero telemetry.
            </p>
            <div class="d-flex flex-wrap justify-content-center gap-2">
              <span class="badge bg-primary px-3 py-2">Version 1.0</span>
              <span class="badge bg-success-subtle text-success px-3 py-2 border border-success-subtle">100% Offline-First</span>
              <span class="badge bg-secondary-subtle text-secondary px-3 py-2 border">Zero Server Architecture</span>
              <span class="badge bg-info-subtle text-info px-3 py-2 border border-info-subtle">No Cloud Tracking</span>
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
                <strong>ManageLinks</strong> is a client-side offline personal link cataloging workstation developed by <strong>Devraj Chauhan</strong>. Built on the principle of digital ownership, it replaces cloud-hosted bookmark services that track browsing behavior with a local, self-contained system.
              </p>
              <p class="text-secondary mb-3">
                Your bookmarks, personal notes, color-coded categories, nested folders, reading lists, and collections are processed and preserved exclusively inside your browser's private local storage engine. The application contains no remote database, transmits no analytics, and operates identically whether you are connected to high-speed internet or running completely offline.
              </p>
              <div class="row g-3 mt-1">
                <div class="col-sm-6">
                  <div class="p-3 bg-light rounded border h-100">
                    <div class="fw-bold text-dark mb-1">Local Sovereignty</div>
                    <div class="text-muted small">No account creation, no password servers, and zero telemetry tracking your reading habits.</div>
                  </div>
                </div>
                <div class="col-sm-6">
                  <div class="p-3 bg-light rounded border h-100">
                    <div class="fw-bold text-dark mb-1">True Offline Utility</div>
                    <div class="text-muted small">Pre-cached application shell opens instantly anywhere, even in Airplane Mode.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: How to View & Inspect Your Data on Your Browser (Step-by-Step) -->
          <div class="card border shadow-sm mb-4">
            <div class="card-header bg-transparent py-3">
              <h5 class="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                ${Icons.get('hard-drive', { size: 18 })}
                <span>How to View and Inspect Your Data in the Browser (Step-by-Step)</span>
              </h5>
            </div>
            <div class="card-body">
              <p class="text-secondary mb-3">
                Because ManageLinks is transparent and stores data in standard open web formats, you can inspect every single saved bookmark and note directly inside your browser. Here are two ways to view your data:
              </p>

              <!-- Method A: In-App My Data Page -->
              <h6 class="fw-bold text-dark mb-2">Method 1: Using the Built-in "My Data & Storage Hub"</h6>
              <div class="p-3 bg-light rounded border mb-4">
                <ol class="small text-secondary mb-0 ps-3">
                  <li class="mb-1">Click <strong>My Data & Storage</strong> in the left sidebar (or navigate to <code>#my-data</code>).</li>
                  <li class="mb-1">View your current browser name, operating system, and storage quota bar.</li>
                  <li>Review the <strong>Stored Items Breakdown Table</strong> to see item counts and byte sizes for links, notes, categories, folders, tags, and recycle bin.</li>
                </ol>
              </div>

              <!-- Method B: Native Browser Developer Tools -->
              <h6 class="fw-bold text-dark mb-2">Method 2: Using Browser Developer Tools (Native Inspection)</h6>
              <p class="text-secondary small mb-3">
                Every modern desktop web browser (Google Chrome, Microsoft Edge, Brave, Mozilla Firefox, Apple Safari) includes a built-in storage inspector:
              </p>
              <div class="d-flex flex-column gap-3 mb-2">
                <div class="d-flex gap-3">
                  <div class="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle flex-shrink-0" style="width: 26px; height: 26px; font-weight: bold; font-size: 0.8rem;">
                    1
                  </div>
                  <div>
                    <strong class="text-dark small d-block">Open Browser Developer Tools</strong>
                    <span class="text-muted small">Press <kbd>F12</kbd> or <kbd>Ctrl + Shift + I</kbd> on Windows/Linux (or <kbd>Cmd + Option + I</kbd> on macOS).</span>
                  </div>
                </div>

                <div class="d-flex gap-3">
                  <div class="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle flex-shrink-0" style="width: 26px; height: 26px; font-weight: bold; font-size: 0.8rem;">
                    2
                  </div>
                  <div>
                    <strong class="text-dark small d-block">Navigate to the Storage Panel</strong>
                    <span class="text-muted small">In Google Chrome, Edge, and Brave, click the <strong>Application</strong> tab at the top. In Firefox, click the <strong>Storage</strong> tab.</span>
                  </div>
                </div>

                <div class="d-flex gap-3">
                  <div class="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle flex-shrink-0" style="width: 26px; height: 26px; font-weight: bold; font-size: 0.8rem;">
                    3
                  </div>
                  <div>
                    <strong class="text-dark small d-block">Expand IndexedDB</strong>
                    <span class="text-muted small">In the left sidebar of Developer Tools, expand <strong>Storage &rarr; IndexedDB &rarr; ManageLinksDB</strong>.</span>
                  </div>
                </div>

                <div class="d-flex gap-3">
                  <div class="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle flex-shrink-0" style="width: 26px; height: 26px; font-weight: bold; font-size: 0.8rem;">
                    4
                  </div>
                  <div>
                    <strong class="text-dark small d-block">Inspect Saved Records Live</strong>
                    <span class="text-muted small">Click on any table (e.g. <code>links</code>, <code>notes</code>, <code>categories</code>, <code>folders</code>). You will see the raw records stored on your hard drive, confirming zero cloud communication.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 3: Browser Account Login / Logout Behavior -->
          <div class="card border shadow-sm mb-4">
            <div class="card-header bg-transparent py-3">
              <h5 class="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                ${Icons.get('user', { size: 18 })}
                <span>Browser Email Login & Logout: Will Your Data Be Removed?</span>
              </h5>
            </div>
            <div class="card-body">
              <div class="alert alert-info border border-info-subtle mb-3">
                <h6 class="fw-bold mb-1 d-flex align-items-center gap-2">
                  ${Icons.get('info', { size: 18 })}
                  <span>Direct Answer: No, logging in or out of email does not delete your data.</span>
                </h6>
                <div class="small text-info-emphasis">
                  Logging into or logging out of your Google (Gmail), Microsoft (Outlook), or Yahoo email accounts in your browser does <strong>NOT</strong> delete or remove your ManageLinks bookmarks and notes.
                </div>
              </div>

              <p class="text-secondary small mb-3">
                Here is how browser storage profiles handle your data in different situations:
              </p>

              <div class="row g-3">
                <div class="col-md-6">
                  <div class="p-3 bg-light rounded border h-100">
                    <strong class="text-dark d-block mb-1">Standard Browsing (Safe)</strong>
                    <p class="text-secondary small mb-0">
                      When you log in or out of websites (like Google or Microsoft), the browser only manages session cookies for those websites. Your local IndexedDB storage for ManageLinks remains untouched in that browser profile.
                    </p>
                  </div>
                </div>

                <div class="col-md-6">
                  <div class="p-3 bg-light rounded border h-100">
                    <strong class="text-dark d-block mb-1">Switching Browser Profiles</strong>
                    <p class="text-secondary small mb-0">
                      Each browser profile (e.g., <em>Work Profile</em> vs <em>Personal Profile</em> in Chrome/Edge) has its own independent storage container. If you switch profiles, your data remains safely stored inside the profile where you saved it.
                    </p>
                  </div>
                </div>

                <div class="col-md-6">
                  <div class="p-3 bg-light rounded border h-100">
                    <strong class="text-dark d-block mb-1">Deleting a Browser Profile (Caution)</strong>
                    <p class="text-secondary small mb-0">
                      If you delete an entire browser profile from your computer settings, the browser deletes all site data associated with that profile. Always export a JSON backup beforehand.
                    </p>
                  </div>
                </div>

                <div class="col-md-6">
                  <div class="p-3 bg-light rounded border h-100">
                    <strong class="text-dark d-block mb-1">Incognito / Private Windows</strong>
                    <p class="text-secondary small mb-0">
                      If you run ManageLinks in an Incognito / Private window, modern browsers erase all IndexedDB data the moment you close the private window. Use standard browsing windows for permanent storage.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 4: How to Delete Data & What Happens After Deletion -->
          <div class="card border shadow-sm mb-4">
            <div class="card-header bg-transparent py-3">
              <h5 class="fw-bold mb-0 text-danger d-flex align-items-center gap-2">
                ${Icons.get('trash-2', { size: 18 })}
                <span>How to Delete Your Data & What Happens After Deletion</span>
              </h5>
            </div>
            <div class="card-body">
              <p class="text-secondary mb-3">
                You have absolute control over your information and can permanently purge all data from your browser at any time.
              </p>

              <h6 class="fw-bold text-dark mb-2">How to Delete All Data:</h6>
              <div class="p-3 bg-light rounded border mb-3">
                <ol class="small text-secondary mb-0 ps-3">
                  <li class="mb-2">Open <strong>My Data & Storage Hub</strong> (<code>#my-data</code>) from the left sidebar.</li>
                  <li class="mb-2">Scroll down to the <strong>Danger Zone: Permanent Browser Data Erasure</strong> section.</li>
                  <li class="mb-2">Click the red <strong>"Delete All Data"</strong> button.</li>
                  <li class="mb-0">A confirmation dialog will appear. Click <strong>"Yes, Delete Everything"</strong> to execute permanent deletion.</li>
                </ol>
              </div>

              <h6 class="fw-bold text-dark mb-2">What Happens After Deletion:</h6>
              <ul class="text-secondary small ps-3 mb-0">
                <li class="mb-2"><strong>Database Purged:</strong> The local IndexedDB database (<code>ManageLinksDB</code>) and all object stores (links, notes, folders, categories, tags, collections) are permanently dropped.</li>
                <li class="mb-2"><strong>Preferences Reset:</strong> LocalStorage and SessionStorage preferences (themes, display modes, PIN locks) are wiped clean.</li>
                <li class="mb-2"><strong>Zero Cloud Trace:</strong> Because there are no backend servers, nothing remains online. Your data is completely gone from the computer.</li>
                <li class="mb-0"><strong>Recovery:</strong> Deletion is irreversible unless you have previously downloaded a <code>.json</code> or <code>.zip</code> backup file from the Database & Backup Center.</li>
              </ul>
            </div>
          </div>

          <!-- Section 5: Security Architecture & Device Protection -->
          <div class="card border shadow-sm mb-4">
            <div class="card-header bg-transparent py-3">
              <h5 class="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                ${Icons.get('shield', { size: 18 })}
                <span>Security Architecture & Device Protection</span>
              </h5>
            </div>
            <div class="card-body">
              <p class="text-secondary small mb-3">
                ManageLinks is engineered with multi-layered client-side security to protect your links and notes on shared or personal devices:
              </p>
              <div class="row g-3">
                <div class="col-md-4">
                  <div class="p-3 bg-light rounded border h-100">
                    <strong class="text-dark small d-block mb-1">AES-GCM 256-Bit Cryptography</strong>
                    <span class="text-muted small">Backups can be encrypted with Web Crypto API standards using PBKDF2 (100,000 rounds) key derivation.</span>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="p-3 bg-light rounded border h-100">
                    <strong class="text-dark small d-block mb-1">Session PIN Lock</strong>
                    <span class="text-muted small">Protects against casual access on shared devices with automatic lock on user inactivity.</span>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="p-3 bg-light rounded border h-100">
                    <strong class="text-dark small d-block mb-1">XSS Sanitization Guard</strong>
                    <span class="text-muted small">All link titles, notes, and imported files are strictly HTML-escaped to prevent script injection.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 6: Terms & Conditions and Disclaimer -->
          <div class="card border shadow-sm mb-4">
            <div class="card-header bg-transparent py-3">
              <h5 class="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                ${Icons.get('file-text', { size: 18 })}
                <span>Terms & Conditions &bull; Disclaimer</span>
              </h5>
            </div>
            <div class="card-body">
              <p class="text-secondary small mb-3">
                <strong>Terms of Use:</strong> ManageLinks is provided free of charge under the open-source MIT License for personal and commercial organization. You retain 100% exclusive ownership of all bookmarks, URLs, notes, and backup files. Because ManageLinks maintains no cloud mirrors, users are responsible for regularly exporting backups before clearing browser history or formatting disks.
              </p>
              <p class="text-secondary small mb-0">
                <strong>Disclaimer:</strong> The software is provided "AS-IS" without warranties of any kind. The developer cannot be held liable for accidental local data loss resulting from hardware drive failures, browser profile deletions, or forgotten backup passwords.
              </p>
            </div>
          </div>

          <!-- Section 7: Developer Credit & Contact -->
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
                  <div class="text-secondary small">Official Title: ManageLinks by Devraj Chauhan</div>
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
                    <a href="mailto:dc4682786@gmail.com" class="text-primary text-decoration-none">
                      dc4682786@gmail.com
                    </a>
                  </div>
                  <div class="text-muted small">Direct personal contact for inquiries, feedback, and support</div>
                </div>
                <div class="col-md-6">
                  <div class="text-muted small">GitHub Profile</div>
                  <div class="fw-bold fs-6">
                    <a href="https://github.com/Devraj473" target="_blank" rel="noopener noreferrer" class="text-primary text-decoration-none">
                      github.com/Devraj473
                    </a>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="text-muted small">Official GitHub Repository</div>
                  <div class="fw-bold fs-6">
                    <a href="https://github.com/Devraj473/ManageLinks" target="_blank" rel="noopener noreferrer" class="text-primary text-decoration-none">
                      github.com/Devraj473/ManageLinks
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;
  }
};
