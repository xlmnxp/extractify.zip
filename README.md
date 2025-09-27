# Extractify.zip [![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://opensource.org/licenses/GPL-3.0) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/xlmnxp/extractify.zip/pulls) 

![](./public/favicon.ico)

A client-side Progressive Web App (PWA) for secure online ZIP file extraction and preview. Works entirely in your browser - no data leaves your device.

[![Live Demo](https://img.shields.io/badge/Demo-Extractify.zip-2ea44f)](https://extractify.zip/)
[![PWA Enabled](https://img.shields.io/badge/PWA-Enabled-success)](https://web.dev/progressive-web-apps/)

## 🌟 Features

- **100% Client-Side Processing**
  - Files never leave your browser (no server upload)
  - Built with WebAssembly for high-performance extraction
  - Offline-capable PWA

- **Advanced Security**
  - Sandboxed environment for safe file handling
  - Malware protection through isolated execution
  - Automatic quarantine for suspicious files

- **Multi-Format Support**
  - **Previewers**: Text/Code, Images, Videos (MP4, WebM), PDF
  - Hex viewer for binary analysis
  - Syntax highlighting for 200+ programming languages

- **Cross-Platform**
  - Mobile-first responsive design
  - Touch-friendly interface
  - Dark/Light theme support

## 📁 Supported Formats

Extractify.zip supports 40+ archive formats through its WebAssembly engine. Files are processed in a secure sandbox with full client-side isolation.

### Core Archive Formats
🗂 **Standard Compression**  
`zip`, `rar`, `7z`, `tar`, `gz` (gzip), `bz2` (bzip2), `xz`, `z` (Z compress), `jar`

📦 **Package Formats**  
`rpm` (Linux packages), `msi` (Windows Installer), `nsis` (Nullsoft Installer), `cab` (Windows Cabinet), `ar` (Unix Archive), `arj` (ARJ Archive), `cpio`, `xar` (eXtensible Archive Format)

### Disk & System Images
💽 **Disk Images**  
`dmg` (macOS), `iso` (Optical Disc), `vdi` (VirtualBox), `vhd` (Hyper-V), `vhdx`, `vmdk` (VMware), `qcow2` (QEMU), `wim` (Windows Imaging)

🔐 **File Systems**  
`apfs` (Apple), `ntfs` (Windows), `hfs` (Mac Hierarchical), `ext` (Linux), `fat` (Legacy Windows), `udf` (Universal Disk), `squashfs` (Compressed Linux FS)

### Specialized Formats
⚙️ **Low-Level System**  
`mbr` (Master Boot Record), `gpt` (GUID Partition Table), `uefi` (Firmware Updates)

🔧 **Technical Formats**  
`chm` (Compiled HTML Help), `lzh` (LHA Archive), `lzma` (LZMA Compression), `ihex` (Intel HEX)

![Format Support Demo](./docs/format-support.gif)

**Key Notes**:
- Read/write support for common archives (ZIP, RAR, 7z)
- Read-only mode for disk images and system formats
- Maximum file size: 2GB (browser limitation)

For advanced format requirements, [open an issue](https://github.com/xlmnxp/extractify.zip/issues).

## 🚀 Quick Start

1. Visit [https://extractify.zip](https://extractify.zip)
2. Drag & drop Compressed/Archived file or click to browse
3. Browse contents directly in your browser
4. Extract individual files or entire archives

![Demo Animation](./docs/demo.gif) *Example: Previewing archive contents*

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- npm 9+

### Installation
```bash
git clone https://github.com/xlmnxp/extractify.zip.git
cd extractify.zip
npm install

# Development server with hot-reload
npm run dev

# Production build
npm run build

# Lint code
npm run lint

# Run tests
npm test

```

## 🛡 Security Architecture

Extractify.zip uses multiple layers of protection:

1. WebAssembly Sandbox: Isolated execution environment
2. Content Security Policy (CSP) headers
3. File type validation and size limits
4. Memory-safe Rust-based extraction core

## 🤝 Contributing

We welcome contributions! Please see our:

- Contributing Guidelines
- Code of Conduct
- Roadmap

Report issues at [GitHub Issues](https://github.com/xlmnxp/extractify.zip/issues)

## 📜 License
GNU GPLv3 © 2025 - [License Details](./LICENSE)