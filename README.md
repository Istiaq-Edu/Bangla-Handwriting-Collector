<div align="center">

# 🖊️ Bangla Handwriting Collector

**A privacy-first, offline-ready PWA for collecting handwritten Bangla character samples for machine learning.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?logo=vercel&logoColor=white)](https://vercel.com)

<a href="https://bangla-handwriting-collector.vercel.app" target="_blank"><strong>🚀 Live Demo</strong></a>

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Character Set](#-character-set)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Data & Export Formats](#-data--export-formats)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🎯 Overview

**Bangla Handwriting Collector** is a static, serverless web application that lets anyone draw Bangla characters on a digital canvas. All collected handwriting samples are stored **locally in the browser** using IndexedDB — no data ever touches a server. Users can export their datasets in multiple ML-ready formats (PNG, SVG, JSON, CSV, TFRecord, HDF5) and share them manually with dataset curators.

This project was built to address the scarcity of publicly available handwritten Bangla character datasets for training OCR and handwriting recognition models.

### Why This Matters

| Problem | Solution |
|---------|----------|
| 🔒 Privacy concerns with cloud storage | All data stays in the user's browser |
| 🌐 Need for offline access in rural areas | Full PWA with offline support |
| 📊 Diverse handwriting styles needed | Open contribution model with zero friction |
| 🤖 ML pipelines need specific formats | Export to PNG, SVG, JSON, CSV, TFRecord, HDF5 |

---

## ✨ Features

### ✍️ Drawing & Collection
- **Pressure-sensitive canvas** — supports mouse, touch, and stylus (Wacom/Apple Pencil)
- **60 Bangla characters** — 11 vowels, 39 consonants, 10 numerals
- **Undo / Redo** — full stroke history with keyboard shortcuts (`Ctrl+Z` / `Ctrl+Y`)
- **Eraser mode** — selectively remove stroke segments
- **Pen customization** — adjustable thickness (1–20px) and color picker
- **Alignment grid** — optional grid overlay on the canvas
- **Canvas rotation** — rotate the drawing surface for better angles

### 🧭 Collection Flow
- **4 presentation modes:**
  | Mode | Description |
  |------|-------------|
  | `sequential` | Cycle through characters alphabetically |
  | `randomized` | Random order every session |
  | `adaptive` | Prioritize characters with fewest samples |
  | `user-select` | Pick any character from the grid |
- **Progress tracking** — visual dots and per-character counters
- **Skip & navigate** — move between characters freely

### 📊 Stats & Grid
- **Collection grid** — 60-character overview with color-coded progress (red → green)
- **Stats dashboard** — total samples, category breakdown, 7-day activity chart, device breakdown
- **Sample management** — view, delete, or edit any previously saved sample

### 📦 Export System
- **Format selection** (choose one or all):
  - `Folder-per-class + CSV` — organized folders with metadata
  - `Flat + JSONL` — all images flat with labels file
  - `TFRecord` — TensorFlow binary format
  - `HDF5` — PyTorch hierarchical format
- **Image variants:** raw, cropped, centered, 28x28, 64x64, 128x128
- **Color schemes:** black-on-white (default) or white-on-black (inverted)
- **ZIP packaging** — everything bundled with a README and metadata
- **Web Share API** — native sharing on mobile devices

### 🎨 UX & Accessibility
- **Dark / Light theme** — auto-detects system preference, manually toggle anytime
- **Mobile-first responsive design** — fully usable on phones and tablets
- **Lazy-loaded routes** — fast initial load with code splitting
- **Smooth animations** — powered by Framer Motion
- **Haptic feedback** — vibration on mobile when saving samples

---

## 🔤 Character Set

The app covers the full basic Bangla alphabet plus numerals — **60 characters total**.

### স্বরবর্ণ (Vowels) — 11
| # | Char | Transliteration | # | Char | Transliteration |
|---|------|-----------------|---|------|-----------------|
| 1 | অ | a | 7 | ঋ | ri |
| 2 | আ | aa | 8 | এ | e |
| 3 | ই | i | 9 | ঐ | oi |
| 4 | ঈ | ii | 10 | ও | o |
| 5 | উ | u | 11 | ঔ | ou |
| 6 | ঊ | uu | | | |

### ব্যঞ্জনবর্ণ (Consonants) — 39
| # | Char | Transliteration | Group | # | Char | Transliteration | Group |
|---|------|-----------------|-------|---|------|-----------------|-------|
| 12 | ক | ko | কবর্গ | 32 | প | po | পবর্গ |
| 13 | খ | kho | কবর্গ | 33 | ফ | pho | পবর্গ |
| 14 | গ | go | কবর্গ | 34 | ব | bo | পবর্গ |
| 15 | ঘ | gho | কবর্গ | 35 | ভ | bho | পবর্গ |
| 16 | ঙ | ngo | কবর্গ | 36 | ম | mo | পবর্গ |
| 17 | চ | cho | চবর্গ | 37 | য | yo | অন্তঃস্থ |
| 18 | ছ | chho | চবর্গ | 38 | র | ro | অন্তঃস্থ |
| 19 | জ | jo | চবর্গ | 39 | ল | lo | অন্তঃস্থ |
| 20 | ঝ | jho | চবর্গ | 40 | শ | sho | ঊষ্ম |
| 21 | ঞ | nyo | চবর্গ | 41 | ষ | sho | ঊষ্ম |
| 22 | ট | to | টবর্গ | 42 | স | so | ঊষ্ম |
| 23 | ঠ | tho | টবর্গ | 43 | হ | ho | ঊষ্ম |
| 24 | ড | do | টবর্গ | 44 | ড় | ro | পরবর্তী |
| 25 | ঢ | dho | টবর্গ | 45 | ঢ় | rho | পরবর্তী |
| 26 | ণ | no | টবর্গ | 46 | য় | yo | পরবর্তী |
| 27 | ত | to | তবর্গ | 47 | ৎ | to | বিশেষ |
| 28 | থ | tho | তবর্গ | 48 | ং | n | বিশেষ |
| 29 | দ | do | তবর্গ | 49 | ঃ | h | বিশেষ |
| 30 | ধ | dho | তবর্গ | 50 | ঁ | m | বিশেষ |
| 31 | ন | no | তবর্গ | | | | |

### সংখ্যা (Numerals) — 10
| # | Char | # | Char | # | Char | # | Char |
|---|------|---|------|---|------|---|------|
| 51 | ০ | 53 | ২ | 55 | ৪ | 57 | ৬ |
| 52 | ১ | 54 | ৩ | 56 | ৫ | 58 | ৭ |
| 59 | ৮ | 60 | ৯ | | | | |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | [React 19](https://react.dev/) | UI library with latest features |
| **Build Tool** | [Vite 8](https://vitejs.dev/) | Fast dev server & optimized builds |
| **Language** | [TypeScript 6](https://www.typescriptlang.org/) | Type safety across the codebase |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first CSS |
| **State** | [Zustand](https://github.com/pmndrs/zustand) | Lightweight global state |
| **Storage** | [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) via [`idb`](https://github.com/jakearchibald/idb) | Offline-capable local database |
| **Canvas** | HTML5 Canvas + [Pointer Events API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) | Unified mouse/touch/pen input |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) | Declarative animations |
| **ZIP** | [JSZip](https://stuk.github.io/jszip/) | In-browser ZIP generation |
| **Routing** | [React Router v7](https://reactrouter.com/) | Client-side routing |
| **PWA** | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | Service worker & manifest |
| **Icons** | [Lucide React](https://lucide.dev/) | Consistent icon set |
| **Linter** | [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) | Fast Rust-based linting |
| **Deploy** | [Vercel](https://vercel.com) | Static hosting & CDN |

---

## 🏗️ Architecture

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Architecture** | Pure static client-side | Zero hosting cost, zero maintenance, maximum privacy |
| **Storage** | IndexedDB in browser | Large blob support, offline persistence, no server |
| **Auth** | Anonymous (UUID in localStorage) | Lowest friction, no privacy concerns |
| **Image processing** | Raw at capture, variants at export | Avoids 5–10x storage bloat |
| **Deployment** | Vercel static hosting | Free tier, global CDN, zero config |

### Data Model

#### Sample Record
```typescript
interface Sample {
  id: string;                    // UUID v4
  character: string;             // 'ক', 'খ', etc.
  characterId: number;           // 1–60
  transliteration: string;       // 'ko', 'kho', etc.
  category: 'vowel' | 'consonant' | 'numeral';
  strokes: Stroke[];             // Array of stroke objects
  strokeCount: number;
  deviceType: 'mouse' | 'touch' | 'pen';
  hasPressure: boolean;          // Stylus pressure captured?
  canvasWidth: number;
  canvasHeight: number;
  penThickness: number;
  pngBlob: Blob;                 // Raw full-canvas PNG
  svgString: string;             // SVG vector paths
  createdAt: number;             // Timestamp (ms)
  contributorId: string;         // localStorage session UUID
}
```

#### Stroke Data
```typescript
interface Point {
  x: number;          // Canvas X (px)
  y: number;          // Canvas Y (px)
  t: number;          // ms since stroke start
  p: number | null;   // Pressure (0.0–1.0), null for mouse
}
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 20+ (LTS recommended)
- [npm](https://www.npmjs.com/) 10+ (comes with Node)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/bangla-handwriting-collector.git
cd bangla-handwriting-collector

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check and build for production (`dist/`) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint across the codebase |

---

## 📁 Project Structure

```
bangla-handwriting-collector/
├── public/                     # Static assets
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── components/
│   │   ├── Canvas/
│   │   │   ├── DrawingCanvas.tsx    # Core drawing surface
│   │   │   ├── Toolbar.tsx          # Undo, redo, eraser, color
│   │   │   └── ProgressDots.tsx     # Character progress indicator
│   │   ├── Collection/
│   │   │   └── CollectionView.tsx   # Main collection orchestrator
│   │   ├── Grid/
│   │   │   └── CollectionGrid.tsx   # 60-char overview & management
│   │   ├── Export/
│   │   │   └── ExportView.tsx       # Export & download UI
│   │   ├── Settings/
│   │   │   └── SettingsView.tsx     # Preferences & data management
│   │   ├── Stats/
│   │   │   └── StatsView.tsx        # Analytics dashboard
│   │   ├── Layout.tsx                # App shell & navigation
│   │   └── Icons.tsx                 # Custom SVG icons
│   ├── data/
│   │   └── banglaChars.ts           # 60-character dataset
│   ├── db/
│   │   └── database.ts              # IndexedDB schema & CRUD
│   ├── hooks/
│   │   ├── usePointerDrawing.ts     # Pointer event handling
│   │   └── pointerDrawing.ts        # Drawing logic utilities
│   ├── store/
│   │   └── useStore.ts              # Zustand global state
│   ├── types/
│   │   └── index.ts                 # TypeScript interfaces
│   ├── utils/
│   │   ├── canvasUtils.ts           # Canvas rendering & PNG export
│   │   ├── svgUtils.ts              # SVG path generation
│   │   ├── imageProcessing.ts       # Crop, center, resize, invert
│   │   ├── zipBuilder.ts            # ZIP assembly
│   │   └── presentationModes.ts     # Collection flow logic
│   ├── App.tsx                      # Root router & lazy loading
│   ├── main.tsx                     # Entry point
│   └── index.css                    # Global Tailwind styles
├── docs/
│   └── plans/
│       └── 2026-07-12-bangla-handwriting-collector-design.md
├── index.html
├── vite.config.ts                  # Vite + PWA plugin config
├── vercel.json                     # Vercel deployment rules
├── tsconfig.json
├── .oxlintrc.json                  # Oxlint rules
└── package.json
```

---

## 📦 Data & Export Formats

### Export ZIP Structure
```
bangla-handwriting-dataset.zip
├── metadata.csv              # character, transliteration, category,
│                             # strokeCount, deviceType, hasPressure,
│                             # createdAt, contributorId, fileName
├── strokes.jsonl             # One JSON object per line: { id, character, strokes }
├── images/
│   ├── 01_অ/
│   │   ├── 0001.png
│   │   └── ...
│   ├── 02_আ/
│   └── ...
├── svg/
│   ├── 01_অ/
│   └── ...
└── README.txt                # Dataset info, format, date, contributor ID
```

### Image Variants (generated at export)
| Variant | Description |
|---------|-------------|
| `raw` | Full canvas as drawn (black-on-white) |
| `cropped` | Cropped to bounding box |
| `centered` | Drawing centered in canvas |
| `28x28` | Resized to 28×28 (MNIST-style) |
| `64x64` | Resized to 64×64 |
| `128x128` | Resized to 128×128 |

---

## 🌐 Deployment

This project is configured for **Vercel** static hosting out of the box.

### Deploy to Vercel

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login and deploy
vercel --prod
```

Or connect your GitHub repository to Vercel for automatic deployments on every push.

### Other Static Hosts

Any static hosting provider (Netlify, Cloudflare Pages, GitHub Pages, etc.) will work. Just build the project and deploy the `dist/` folder:

```bash
npm run build
# Deploy dist/ to your host
```

> **Note:** `vercel.json` includes SPA routing rules so React Router works correctly. If deploying elsewhere, configure your host to serve `index.html` for all routes.

---

## 🤝 Contributing

Contributions are welcome! Whether you're improving the UI, adding new export formats, or fixing bugs, your help makes this dataset better for everyone.

### How to Contribute

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** following the existing code style
4. **Lint your code**: `npm run lint`
5. **Commit**: `git commit -m 'feat: add amazing feature'`
6. **Push**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Ideas for Contributions
- [ ] Add more export formats (COCO, LMDB, etc.)
- [ ] Implement adaptive mode algorithm
- [ ] Add multi-language UI support (Bengali interface)
- [ ] Improve accessibility (ARIA labels, keyboard shortcuts)
- [ ] Add handwriting quality scoring
- [ ] Support for conjunct characters (যুক্তাক্ষর)

---

<div align="center">

Made with ❤️ for the Bangla NLP community.

**[⬆ Back to Top](#-bangla-handwriting-collector)**

</div>
