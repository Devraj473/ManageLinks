# ManageLinks

**Your Links. Your Categories. Your Control.**

An offline-first Progressive Web Application (PWA) designed for personal link management, organization, storage, encryption, backup, and cross-device restoration without any third-party backend servers, cloud databases, or tracking scripts.

**Developer:** Devraj Chauhan  
**Application Version:** 1.0.0  
**Application Type:** Offline-first Progressive Web Application (PWA)  
**License:** MIT  

---

## 🚀 Key Features

- **100% Client-Side & Offline-First:** Runs completely on your device using browser IndexedDB storage and Service Worker caching. Operates smoothly with or without an active internet connection.
- **Privacy-Guaranteed:** No user registration, no authentication servers, no telemetry, no analytics, and no external API calls. Your links stay on your machine.
- **Hierarchical Nested Folders:** Organize links into deep tree hierarchies with circular reference protection.
- **Custom Categories & Collections:** Manage bookmarks with color-coded categories and independent project/study collections.
- **Link Inbox:** Fast capture for unassigned links with inline quick-add and batch organization.
- **Read Later & Reading Statuses:** Track reading workflows across *Unread*, *Currently Reading*, and *Completed* states.
- **Instant Local Search (Ctrl + K):** Global multi-token searching across titles, URLs, descriptions, tags, notes, categories, and folders with text highlighting.
- **Multiple Display Modes:** Switch between Grid Cards, Horizontal List, and Dense Compact Table views.
- **Encrypted Backups (PBKDF2 + AES-GCM):** Export password-protected ZIP or JSON backups using the standard Web Crypto API.
- **Safe Restoration Wizard:** Preview backup contents, detect duplicate URLs, and choose between *Merge* or *Full Replace* with automatic safety snapshots.
- **Browser Bookmarks Import/Export:** Import and export standard Netscape Bookmark HTML files (compatible with Google Chrome, Microsoft Edge, Mozilla Firefox, and Safari) preserving nested folders.
- **Spreadsheet CSV Import/Export:** Import and export compliant RFC 4180 CSV files with column mapping.
- **PWA Installation:** Installable as a native standalone desktop or mobile application on Windows, Android, macOS, and Linux.
- **Optional Application PIN Lock:** Secure session lock powered by salted PBKDF2 hash verifiers with inactivity auto-lock.
- **Keyboard Shortcuts:** Built-in speed shortcuts for power users (`Ctrl+K`, `Ctrl+N`, `Ctrl+Shift+N`, `Ctrl+B`, `Ctrl+Shift+F`, `/`, `Esc`).

---

## 🛠️ Technology Stack

| Component | Technology | Role |
|---|---|---|
| **Structure** | HTML5 Semantic Elements | Accessible application layout |
| **Styling** | CSS3 & Bootstrap 5 | Modern responsive SaaS design (Light & Dark modes) |
| **Logic** | Vanilla JavaScript (ES Modules) | Lightweight, modular, zero-framework logic |
| **Storage** | IndexedDB (`ManageLinksDB` v1) | Persistent local database for unlimited links |
| **Preferences** | LocalStorage & SessionStorage | UI theme, view preferences, and session tokens |
| **Offline Engine** | Service Worker (`service-worker.js`) | Pre-caches application shell assets |
| **PWA Manifest** | Web App Manifest (`manifest.json`) | Standalone app installation and icon definition |
| **Cryptography** | Web Crypto API (`crypto.subtle`) | PBKDF2 (SHA-256) key derivation & AES-GCM 256-bit encryption |
| **Compression** | JSZip (Vendored locally) | Offline ZIP backup packaging |
| **Icons** | Lucide SVG System (Vendored locally) | High-definition, zero-network SVG iconography |

---

## 📁 Project Structure

```
ManageLinks/
│
├── index.html                  # Main application entry point
├── manifest.json               # Web App Manifest for PWA installation
├── service-worker.js           # Offline caching service worker
├── package.json                # Project metadata & test scripts
├── README.md                   # Complete application documentation
├── LICENSE                     # MIT License (Devraj Chauhan)
│
├── assets/
│   ├── css/
│   │   ├── style.css           # Core layout, typography, navigation
│   │   ├── responsive.css      # Mobile, tablet, desktop responsive breakpoints
│   │   ├── themes.css          # Light and Dark theme custom CSS variables
│   │   └── components.css      # Link cards, modals, toasts, stat cards
│   │
│   ├── js/
│   │   ├── app.js              # Application bootstrap & event orchestration
│   │   ├── router.js           # Single Page Application (SPA) hash router
│   │   ├── database.js         # IndexedDB ManageLinksDB abstraction & transactions
│   │   ├── storage.js          # LocalStorage & SessionStorage helpers
│   │   ├── link-manager.js     # Link CRUD, soft-delete, visit tracker, duplicate detector
│   │   ├── category-manager.js # Category management & safe reassign deletion
│   │   ├── folder-manager.js   # Hierarchical nested folders with circular checks
│   │   ├── collection-manager.js # Project-based link groupings
│   │   ├── search.js           # Multi-field search engine & text highlighter
│   │   ├── filters.js          # Observable filter state manager
│   │   ├── analytics.js        # On-device SVG charts & metric calculation
│   │   ├── backup.js           # Backup generator (Complete, JSON, ZIP, Encrypted)
│   │   ├── restore.js          # Restoration wizard, duplicate resolver & safety snapshots
│   │   ├── import.js           # Importer for JSON, CSV, Netscape HTML & TXT
│   │   ├── export.js           # Exporter for JSON, CSV, Netscape HTML, TXT & ZIP
│   │   ├── security.js         # PIN lock, PBKDF2 hashing & inactivity timer
│   │   ├── settings.js         # Settings manager & theme applicator
│   │   ├── notifications.js    # Toast notification system
│   │   ├── shortcuts.js        # Global keyboard shortcuts dispatcher
│   │   ├── icons.js            # Offline SVG icon set (Lucide-compatible)
│   │   └── ui.js               # Common link card action event bindings & bulk bar
│   │
│   ├── icons/
│   │   ├── favicon.svg         # Application favicon
│   │   ├── icon-192.svg        # PWA 192x192 icon
│   │   └── icon-512.svg        # PWA 512x512 icon
│   │
│   └── vendor/
│       ├── bootstrap.min.css       # Bootstrap 5 layout CSS
│       ├── bootstrap.bundle.min.js # Bootstrap 5 modal & dropdown runtime
│       └── jszip.min.js            # Local JSZip library for offline ZIP packaging
│
├── pages/
│   ├── dashboard.js            # Live dashboard with statistics & recents
│   ├── all-links.js            # Primary link directory with view switchers
│   ├── link-inbox.js           # Unassigned links & quick paste capture
│   ├── favorites.js            # Favourites & Pinned bookmarks
│   ├── categories.js           # Category cards & category detail views
│   ├── folders.js              # Hierarchical folder tree view
│   ├── collections.js          # Cross-category project collections
│   ├── reading-list.js         # Read Later workflow by reading status
│   ├── archive.js              # Inactive bookmarks archive
│   ├── trash.js                # Soft-deleted items recovery bin
│   ├── analytics.js            # Usage metrics & SVG visualization charts
│   ├── data-management.js      # Backup, Restore, Import, and Export centers
│   ├── settings.js             # Theme, PIN, auto-lock & storage persistence
│   └── about.js                # Architecture, privacy & developer credit
│
├── components/
│   ├── sidebar.js              # Collapsible desktop navigation sidebar
│   ├── navbar.js               # Top header with global search & quick actions
│   ├── link-card.js            # Card rendering (Grid, List, and Compact views)
│   ├── link-modal.js           # Add/Edit Link dialog with duplicate alerts
│   ├── category-modal.js       # Create/Edit Category dialog
│   ├── folder-modal.js         # Create/Edit Folder dialog
│   ├── collection-modal.js     # Create/Edit Collection dialog
│   ├── search-modal.js         # Quick Search dialog (Ctrl + K)
│   ├── confirmation-modal.js   # Safe verification for destructive actions
│   ├── toast.js                # Toast notification wrapper
│   └── empty-state.js          # Clean empty state placeholders
│
├── utils/
│   ├── validators.js           # URL, title, PIN, and color validators
│   ├── date-utils.js           # Relative time and date formatters
│   ├── url-utils.js            # URL normalizer, title generator & copy formats
│   ├── file-utils.js           # Blob downloaders and file size formatters
│   ├── csv-parser.js           # RFC 4180 CSV parser and generator
│   ├── html-bookmark-parser.js # Netscape Bookmark HTML parser and generator
│   └── encryption.js           # Web Crypto PBKDF2 + AES-GCM cryptography
│
└── tests/
    ├── validation-tests.js     # Unit tests for URL and data validators
    ├── database-tests.js       # IndexedDB CRUD and transaction tests
    ├── link-tests.js           # Link lifecycle, duplicates, and visit counter tests
    ├── backup-tests.js         # Cryptographic encryption/decryption tests
    ├── import-export-tests.js  # CSV & Netscape HTML roundtrip tests
    ├── node-runner.js          # Automated command-line Node test runner
    └── test-runner.html        # Interactive in-browser visual test runner
```

---

## 🏃 How to Run Locally

Because ManageLinks utilizes modern ES Modules (`import`/`export`) and Service Workers, it should be served through a local HTTP server:

### Option 1: Using Node.js (Built-in npx)
```bash
# Run using npx serve
npx serve . -l 8080
```
Then open your browser at: `http://localhost:8080`

### Option 2: Using Python
```bash
# Python 3
python -m http.server 8080
```
Then open: `http://localhost:8080`

### Option 3: Using VS Code Live Server
Right-click on `index.html` and select **"Open with Live Server"**.

---

## 📱 How to Install as a PWA

ManageLinks is a fully compliant Progressive Web App. When served over `http://localhost` or `https://`:

1. **Google Chrome / Microsoft Edge (Desktop):**
   - Click the **Install ManageLinks** icon on the right side of the URL address bar, or open the browser menu (`...`) and click **"Install ManageLinks"**.
   - ManageLinks will open in its own clean, distraction-free desktop window without browser tabs or address bar.
2. **Android (Chrome):**
   - Open ManageLinks in Chrome.
   - Tap the three dots menu (`⋮`) and select **"Add to Home screen"** or **"Install app"**.
   - The app icon will appear on your home screen and app drawer, functioning like a native app.
3. **iPhone / iPad (Safari):**
   - Open ManageLinks in Safari.
   - Tap the Share button (`Share` icon at bottom).
   - Scroll down and tap **"Add to Home Screen"**.

---

## 💾 How Data is Stored

- **Primary Database:** All links, categories, folders, collections, notes, and trash items are persisted inside **IndexedDB** under the database named `ManageLinksDB` (version 1).
- **Persistent Storage:** Under **Settings > Local Storage Management**, you can request `navigator.storage.persist()` to tell the browser not to evict your bookmarks when device disk space is low.
- **Preferences:** Light/Dark theme and view layout preferences are synchronized to `LocalStorage` for instantaneous styling before IndexedDB initializes.

---

## 📦 How to Create Backups

1. Click **Backup & Data** in the left sidebar or press <kbd>Ctrl</kbd> + <kbd>B</kbd>.
2. Choose your **Backup Scope**:
   - *Complete Backup* (All links, categories, folders, collections, settings)
   - *Links Only*
   - *Categories & Folders Only*
   - *Favourites Only*
3. Select your format:
   - **Standard JSON:** Plain readable `.json` file.
   - **Compressed ZIP:** `.zip` package containing data and metadata manifest.
4. *(Optional)* **Password Encryption:** Expand the encryption drawer and enter a master password. ManageLinks uses **PBKDF2 (SHA-256 with 100,000 iterations)** to derive a 256-bit key and encrypts your data with **AES-GCM**.
5. Click **Generate & Download Backup**. The file will download immediately with a timestamped filename (e.g. `ManageLinks_Backup_2026-11-07_14-30.zip`).

---

## 🔄 How to Restore Data

1. Open **Data & Backup Center** and switch to the **Restore Wizard** tab.
2. Select your `.json` or `.zip` backup file.
3. If the backup is encrypted, you will be prompted for your master password.
4. The wizard inspects the backup and displays:
   - Number of links, categories, and folders detected.
   - Duplicate records found.
5. Select **Restoration Mode**:
   - **Merge:** Adds imported records to your library while keeping your existing bookmarks intact.
   - **Full Replace:** Wipes the existing database and replaces it with the backup.
6. Choose how duplicate URLs should be handled (*Skip*, *Replace*, or *Import as New*).
7. ManageLinks automatically takes an in-memory safety snapshot before executing the restore transaction.
8. Click **Execute Restoration**.

---

## 🌐 How to Transfer Data Between Devices

Because ManageLinks does not use third-party cloud servers or centralized accounts, each installation maintains independent local storage:

```
[Device A (PC)]                     [Device B (Laptop / Phone)]
      │                                          │
1. Create Backup ───────────────────> 3. Open ManageLinks
      │       (Transfer file via                 │
2. Download   USB / Bluetooth / AirDrop) 4. Restore Wizard
   .zip/.json                                    │
                                         5. Merge or Replace
```

1. On **Device A**, go to **Backup Center** and download a Complete Backup.
2. Send the backup file to **Device B** via USB drive, Bluetooth, Local Network, or secure messaging.
3. On **Device B**, open ManageLinks, open the **Restore Wizard**, and select the backup file.
4. Click **Restore Now** to immediately populate your bookmarks.

---

## 📥 How to Import Existing Browser Bookmarks

1. In Google Chrome, Edge, or Firefox:
   - Open Bookmark Manager (`Ctrl + Shift + O`).
   - Click the menu (`⋮`) and select **"Export Bookmarks"** to save an HTML file.
2. In ManageLinks, open **Data & Backup Center > Import Center**.
3. Select format: **Browser Bookmarks HTML**.
4. Choose your exported `.html` file.
5. Check **"Auto-recreate nested folder hierarchy"** if you want your browser's exact bookmark folder folders recreated in ManageLinks.
6. Review the parsed links preview and click **Complete Import**.

---

## 📤 How to Export Links

ManageLinks provides multiple export targets in **Data & Backup Center > Export Formats**:
- **Browser HTML Bookmarks:** Produces standard Netscape Bookmark HTML compatible with all major browsers.
- **CSV Spreadsheet:** Generates RFC 4180 compliant CSV for Excel or Google Sheets.
- **Raw JSON:** Standard JSON array for scripts and developers.
- **Plain URLs TXT:** One URL per line for command-line tools (`curl`, `wget`).

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | Open Global Instant Search |
| <kbd>Ctrl</kbd> + <kbd>N</kbd> | Add New Link dialog |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>N</kbd> | Create Category dialog |
| <kbd>Ctrl</kbd> + <kbd>B</kbd> | Open Backup Center |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd> | Open Favourites |
| <kbd>/</kbd> | Focus search bar (when not inside an input) |
| <kbd>Esc</kbd> | Close active modal, dialog, or overlay |

---

## 🧪 Testing and Verification

ManageLinks includes both command-line and in-browser automated test suites:

### Command-Line Node.js Tests:
```bash
npm test
# Runs node tests/node-runner.js (22/22 unit checks)
```

### In-Browser Interactive Test Runner:
Open `tests/test-runner.html` in your web browser to execute full live tests covering:
- Database initialization and transaction boundaries
- Link creation, visit counting, and soft-delete/restore
- Web Crypto PBKDF2 + AES-GCM encryption and decryption
- RFC 4180 CSV and Netscape Bookmark HTML parsing roundtrips
- URL normalization and duplicate detection

---

## ❓ Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| **PWA Install icon does not appear** | App is opened via `file://` protocol | Serve app via `http://localhost:8080` or `https://` |
| **Service Worker not registering** | Service workers require secure context | Access via `localhost` or `https://` |
| **Encrypted backup fails to restore** | Incorrect password entered | Enter the exact master password set during backup generation |
| **Browser cleared bookmarks** | Low disk space eviction on browser | Go to **Settings** and click **"Request Persistence"** |

---

## 👨‍💻 Developer & Credits

**ManageLinks** was architected and developed by **Devraj Chauhan**.  
Designed with an uncompromising focus on simplicity, speed, data safety, and digital sovereignty.
