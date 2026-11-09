# ManageLinks

<div align="center">

![ManageLinks Logo](assets/icons/icon-192.svg)

### **Your Links. Your Categories. Your Control.**

An offline-first, privacy-guaranteed Progressive Web Application (PWA) for managing website links, personal notes, Google Drive-style folders, and bookmarks with zero cloud databases, zero servers, and zero telemetry.

[![GitHub Repository](https://img.shields.io/badge/GitHub_Repository-Devraj473%2FManageLinks-181717?style=for-the-badge&logo=github)](https://github.com/Devraj473/ManageLinks)
[![Live Demo](https://img.shields.io/badge/Live_App-GitHub_Pages-2563eb?style=for-the-badge&logo=github)](https://devraj473.github.io/ManageLinks/)
[![PWA Ready](https://img.shields.io/badge/PWA-100%25_Installable-16a34a?style=for-the-badge&logo=pwa)](https://devraj473.github.io/ManageLinks/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Zero Cloud](https://img.shields.io/badge/Privacy-100%25_Offline_Local-0ea5e9?style=for-the-badge)](LICENSE)

**Official GitHub Repository:** [https://github.com/Devraj473/ManageLinks](https://github.com/Devraj473/ManageLinks)  
**Live Web Application:** [https://devraj473.github.io/ManageLinks/](https://devraj473.github.io/ManageLinks/)  
**Developer Profile:** [Devraj Chauhan](https://github.com/Devraj473)  
**Contact Email:** [chauhandevraj473@gmail.com](mailto:chauhandevraj473@gmail.com)  
**Version:** 1.0.0 (Production Release)

</div>

---

## 🌟 Overview

**ManageLinks** is an open-source, client-side bookmark, link, and personal note cataloging workstation. Unlike traditional bookmark managers that require third-party accounts, monthly subscription fees, and track your browsing history, ManageLinks runs **100% locally inside your browser's IndexedDB engine**.

No user accounts, no login servers, no Firebase/Supabase, and no advertising trackers. Your data remains strictly on your machine.

---

## 🚀 Key Features

### 🔖 Link & Bookmark Management
- **Hierarchical Nested Folders:** Organize links into multi-level folder trees.
- **Color-Coded Categories & Collections:** Group bookmarks by domain, study topics, or active projects.
- **Link Inbox:** Rapid capture for unsorted links with inline quick-add and bulk organizing.
- **Read Later & Workflow Statuses:** Track items across *Unread*, *Currently Reading*, and *Completed* stages.
- **Smart Metadata Extraction:** Automatic domain icons, titles, clean URL normalization, and tag indexing.
- **Global Instant Search (`Ctrl + K`):** Multi-token real-time search across titles, URLs, notes, tags, and folders.
- **Multiple Display Modes:** Switch freely between Grid Cards, List Rows, and Compact Table views.

### 📝 Personal Notes with Google Drive-Style Folders
- **Google Drive-Style Note Folders:** Create and manage note folders with folder cards, note counters, and quick actions.
- **Clickable Hyperlinks Inside Notes:** Web URLs (`https://...`) and Markdown links (`[text](url)`) are automatically converted into live clickable links.
- **Distraction-Free Full-Page Editor:** Professional full-page writing workspace with rich formatting shortcuts (**Bold**, *Italic*, **H1**, **H2**, Checklists, Code, Links).
- **Tabbed Live Preview:** Switch between **Write** and **Preview** modes with live word and character counters.
- **Timestamps:** Every note tracks exact `Created` and `Updated` timestamps plus relative time badges.
- **Note Sharing:** Share notes directly to WhatsApp, Telegram, Email, or System Share Sheet without saving to disk first.
- **Clickable PDF Generation:** Generate print-ready vector PDFs for individual notes or an entire compiled notes catalog with 100% clickable links.

### 💾 Backup, Restore & Cross-Device Portability
- **Master ZIP Backup Archive (`.zip`):** One-click package containing full database JSON, browser-standard `bookmarks.html`, spreadsheet `links.csv`, and individual readable `.txt` files for every note in a `notes/` directory.
- **Instant JSON Backups:** Clean JSON exports of your complete database or selective scopes (Links Only, Notes Only, Categories Only).
- **Direct Sharing (Zero Unwanted Downloads):** Share database backups directly via WhatsApp, Telegram, Email, or OS Native Share Sheet without downloading first.
- **Client-Side AES-GCM 256-Bit Encryption:** Password-protect sensitive backups with PBKDF2 (100,000 rounds) key derivation.
- **Safety Snapshot Restoration Wizard:** Inspect incoming backups, preview duplicates, and choose between *Merge* or *Full Replace* with automatic safety snapshots.
- **Standard Import/Export:** Two-way sync with Netscape HTML bookmarks (Chrome, Edge, Firefox, Brave, Safari) and CSV spreadsheets.

---

## 📱 How to Install ManageLinks on Your Device (PWA)

ManageLinks is an official **Progressive Web App (PWA)**. You can install it on any device to run as a standalone desktop or mobile app with an app icon and offline capabilities.

### 💻 Desktop (Google Chrome, Microsoft Edge, Brave)
1. Open [https://devraj473.github.io/ManageLinks/](https://devraj473.github.io/ManageLinks/) in your browser.
2. In the browser address bar (top right), click the **Install icon** (🖥️ or ➕) or click **"Install App"** inside the top navigation bar.
3. Click **Install**.
4. ManageLinks is now installed on your desktop and start menu. It opens in its own window and works 100% offline!

### 📱 Android (Google Chrome, Samsung Internet)
1. Open [https://devraj473.github.io/ManageLinks/](https://devraj473.github.io/ManageLinks/).
2. Tap the three dots menu (**⋮**) in the top right corner.
3. Tap **"Install app"** or **"Add to Home screen"**.
4. ManageLinks will install as a native Android app on your home screen.

### 🍏 iPhone & iPad (Safari)
1. Open [https://devraj473.github.io/ManageLinks/](https://devraj473.github.io/ManageLinks/) in Safari.
2. Tap the **Share** button (box with an arrow pointing up at the bottom).
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **Add**. ManageLinks is now accessible from your home screen like any native iOS app!

---

## 🌐 Live Deployment on GitHub Profile

ManageLinks is deployed directly from the official GitHub account **Devraj473**:
- **Official GitHub Repository:** [https://github.com/Devraj473/ManageLinks](https://github.com/Devraj473/ManageLinks)
- **Live Web Application (GitHub Pages):** [https://devraj473.github.io/ManageLinks/](https://devraj473.github.io/ManageLinks/)

> [!NOTE]
> On GitHub, any website hosted from your profile `https://github.com/Devraj473/` is automatically given the official web address `https://devraj473.github.io/ManageLinks/`. Both the repository and the live address are part of your exact same GitHub account.

### How to Make Live in 1 Click:
1. Open **[https://github.com/new](https://github.com/new)** in your browser (signed in as **Devraj473**).
2. Enter Repository name: **`ManageLinks`** (Set to **Public**).
3. Do **NOT** check "Add a README" or license (all files are already generated and committed locally).
4. Click **Create repository**.
5. Push your local files:
   ```bash
   git push -u origin main
   ```
6. In your GitHub repository:
   - Click **Settings** &rarr; **Pages** (on the left menu).
   - Under **Build and deployment > Source**, select **Deploy from a branch**.
   - Under **Branch**, select **`main`** and **`/ (root)`**, then click **Save**.
7. Your app is now **100% LIVE**! Anyone can open `https://devraj473.github.io/ManageLinks/` on any mobile phone or computer to use and install the tool with one click.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Structure** | HTML5 Semantic Elements | Clean, accessible application layout |
| **Styling** | CSS3 & Bootstrap 5 | Responsive UI with System Default, Light & Dark themes |
| **Logic** | Vanilla JavaScript (ES Modules) | Ultra-fast, zero-framework, dependency-free execution |
| **Local Storage** | IndexedDB (`ManageLinksDB` v3) | Main persistent offline database for unlimited items |
| **Preferences** | LocalStorage & SessionStorage | Theme preferences and UI view modes |
| **Offline Engine** | Service Worker (`service-worker.js`) | Pre-caches application shell for offline execution |
| **PWA Manifest** | Web App Manifest (`manifest.json`) | Standalone app installation, display, and icons |
| **Cryptography** | Web Crypto API (`crypto.subtle`) | PBKDF2 (SHA-256) key derivation & AES-GCM 256-bit encryption |
| **Compression** | JSZip (Vendored locally) | Complete ZIP backup packaging |
| **Icons** | Lucide Icons (Vendored SVG) | Zero-network SVG iconography |

---

## 📁 Repository Structure

```
ManageLinks/
│
├── index.html                  # Main application shell
├── manifest.json               # PWA installation manifest
├── service-worker.js           # Offline caching service worker
├── LICENSE                     # MIT License
├── README.md                   # Complete documentation
├── .env.example                # Environment configuration template
│
├── assets/
│   ├── css/                    # Modular stylesheets (style, responsive, themes, components)
│   ├── js/                     # Core application managers (database, link-manager, notes-manager, etc.)
│   ├── icons/                  # Vector icons & PWA assets (favicon, 192px, 512px)
│   └── vendor/                 # Offline vendored assets (Bootstrap, JSZip)
│
├── components/                 # UI components (sidebar, navbar, modals, cards)
├── pages/                      # Single-page application views (dashboard, all-links, notes, settings, etc.)
├── utils/                      # Pure utilities (validators, date-utils, pdf-generator, app-downloader)
└── tests/                      # Automated unit test suite (node-runner.js)
```

---

## ⌨️ Built-in Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + K` / `Cmd + K` | Global Search links, notes, and tags |
| `Ctrl + N` | Add New Link |
| `Ctrl + S` | Save Note (inside Full-Page Editor) |
| `Ctrl + B` | Database & Backup Center |
| `Ctrl + Shift + F` | Create New Folder |
| `/` | Focus search bar |
| `Esc` | Close open modal or editor |

---

## 🔒 Privacy Guarantee

ManageLinks operates under a strict **Zero-Knowledge Privacy Policy**:
1. **No User Registration:** No email, password, or profile required.
2. **No Analytics:** No Google Analytics, Mixpanel, or third-party trackers.
3. **No External APIs:** URL metadata and bookmarks are processed locally.
4. **Air-Gapped Operation:** Works seamlessly in Airplane Mode or without an internet connection.

---

## 📄 License & Author

Developed with care by **Devraj Chauhan**.

- **Email:** [chauhandevraj473@gmail.com](mailto:chauhandevraj473@gmail.com)
- **GitHub:** [@Devraj473](https://github.com/Devraj473)
- **License:** [MIT License](LICENSE) &bull; Free for personal and commercial use.
