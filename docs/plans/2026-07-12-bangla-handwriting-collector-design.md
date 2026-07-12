# Bangla Handwriting Character Data Collector — Design Document

**Date:** 2026-07-12
**Status:** Approved
**Type:** Greenfield project

---

## Goal

A static website where anyone can draw Bangla letters on a canvas, and the collected handwriting samples are stored locally in the browser. Users export their datasets in multiple ML-ready formats (PNG, SVG, JSON strokes, HDF5, TFRecord, CSV) and share them with the dataset curator manually. The purpose is custom handwritten character data collection for ML training.

## Current State

Empty greenfield project directory at `D:\DEVELOPMENT\Custom-HandWriting-Collector`.

## Decisions

### Decision 1: Architecture — Serverless / Static Site
- **Options:** A) Supabase backend with auth, admin panel, rate limiting. B) Pure static client-side site with IndexedDB. C) Serverless edge functions + blob storage.
- **Chosen:** B — Pure static client-side site.
- **Why:** Zero hosting cost, zero maintenance, maximum simplicity. Users own their data. No privacy concerns. No spam risk since data never touches a server.
- **Trade-off:** No central aggregation, no admin review panel, no global stats. Datasets are collected manually from contributors via file sharing.
- **Reversible?** Yes — can add backend later without changing the client architecture.

### Decision 2: Frontend Stack — React 19 + Vite + TypeScript + TailwindCSS
- **Chosen:** React 19 + Vite + TypeScript + TailwindCSS v4 + Zustand
- **Why:** Huge ecosystem, excellent canvas support, fast HMR, type safety. Zustand for lightweight state without provider boilerplate.
- **Reversible?** Yes.

### Decision 3: Canvas Technology — HTML5 Canvas + Pointer Events API
- **Chosen:** Native Canvas with Pointer Events API.
- **Why:** Pointer Events unifies mouse, touch, and pen input into a single API. No need for separate touch/mouse handlers. Supports pressure data from stylus devices.
- **Trade-off:** Not a drawing library — we implement stroke management ourselves. More control but more code.
- **Reversible?** Could switch to perfect-freehand or similar library later.

### Decision 4: Storage — IndexedDB via `idb` library
- **Chosen:** IndexedDB with the `idb` wrapper library.
- **Why:** Stores large binary blobs (PNG images) efficiently, supports indexes for querying by character/date, persists across sessions, works offline. `idb` provides a clean Promise-based API.
- **Reversible?** Data model is decoupled — could swap to different storage.

### Decision 5: Stroke Data — x,y + timestamp + pressure
- **Chosen:** Capture x, y, timestamp (ms since stroke start), and pressure (null for mouse).
- **Why:** Optimal for both raster models (CNN) and sequence models (RNN/Transformer). Tilt excluded (<5% device support, marginal ML value).
- **Reversible?** Yes — stroke schema is versioned.

### Decision 6: Image Storage — Raw PNG at Collection, Variants at Export
- **Chosen:** Store one raw full-canvas PNG (black-on-white) per sample. Generate cropped/centered/resized/inverted variants at export time.
- **Why:** Avoids 5-10x storage multiplication. User selects variants at export, generated client-side on demand.
- **Reversible?** Yes.

### Decision 7: Authentication — Anonymous (Session ID in localStorage)
- **Chosen:** No auth. UUID session ID generated once and stored in localStorage.
- **Why:** Lowest friction for public contributors. ID persists across visits for local data continuity. All data is local, no privacy concerns.
- **Trade-off:** No way to verify contributor identity. Dataset curator trusts contributors.
- **Reversible?** Yes.

### Decision 8: Deployment — Vercel (Static)
- **Chosen:** Vercel static hosting.
- **Why:** Free tier, seamless Vite integration, global CDN, zero config.
- **Reversible?** Yes — any static host works.

### Decision 9: Export Formats — All Client-Side
- **Chosen:** ZIP with user-selected format(s): folder-per-class+CSV, flat+JSONL, TFRecord, HDF5, or all.
- **Why:** All processing client-side. No server needed. User picks what their ML pipeline expects.
- **Trade-off:** Large exports may be slow/memory-intensive in browser. Mitigated by chunked processing + progress indicator.
- **Reversible?** Yes.

---

## Character Set

### Vowels (11)
| # | Char | Transliteration |
|---|------|-----------------|
| 1 | অ | a |
| 2 | আ | aa |
| 3 | ই | i |
| 4 | ঈ | ii |
| 5 | উ | u |
| 6 | ঊ | uu |
| 7 | ঋ | ri |
| 8 | এ | e |
| 9 | ঐ | oi |
| 10 | ও | o |
| 11 | ঔ | ou |

### Consonants (39)
| # | Char | Transliteration | Category |
|---|------|-----------------|----------|
| 12 | ক | ko | Velar (কবর্গ) |
| 13 | খ | kho | Velar |
| 14 | গ | go | Velar |
| 15 | ঘ | gho | Velar |
| 16 | ঙ | ngo | Velar nasal |
| 17 | চ | cho | Palatal (চবর্গ) |
| 18 | ছ | chho | Palatal |
| 19 | জ | jo | Palatal |
| 20 | ঝ | jho | Palatal |
| 21 | ঞ | nyo | Palatal nasal |
| 22 | ট | to | Retroflex (টবর্গ) |
| 23 | ঠ | tho | Retroflex |
| 24 | ড | do | Retroflex |
| 25 | ঢ | dho | Retroflex |
| 26 | ণ | no | Retroflex nasal |
| 27 | ত | to | Dental (তবর্গ) |
| 28 | থ | tho | Dental |
| 29 | দ | do | Dental |
| 30 | ধ | dho | Dental |
| 31 | ন | no | Dental nasal |
| 32 | প | po | Labial (পবর্গ) |
| 33 | ফ | pho | Labial |
| 34 | ব | bo | Labial |
| 35 | ভ | bho | Labial |
| 36 | ম | mo | Labial nasal |
| 37 | য | yo | Semivowel |
| 38 | র | ro | Semivowel |
| 39 | ল | lo | Semivowel |
| 40 | শ | sho | Sibilant |
| 41 | ষ | sho | Sibilant |
| 42 | স | so | Sibilant |
| 43 | হ | ho | Sibilant |
| 44 | ড় | ro | Post-reform |
| 45 | ঢ় | rho | Post-reform |
| 46 | য় | yo | Post-reform |
| 47 | ৎ | to (khanda ta) | Special |
| 48 | ং | n (anusvara) | Special |
| 49 | ঃ | h (visarga) | Special |
| 50 | ঁ | (chandrabindu) | Special |

### Numerals (10)
| # | Char | Transliteration |
|---|------|-----------------|
| 51 | ০ | 0 |
| 52 | ১ | 1 |
| 53 | ২ | 2 |
| 54 | ৩ | 3 |
| 55 | ৪ | 4 |
| 56 | ৫ | 5 |
| 57 | ৬ | 6 |
| 58 | ৭ | 7 |
| 59 | ৮ | 8 |
| 60 | ৯ | 9 |

---

## Data Model

### IndexedDB Schema

**Database:** `bangla-handwriting` (version 1)

#### Store: `samples`
- **Key path:** `id` (auto-generated UUID)
- **Value:**
```typescript
interface Sample {
  id: string;                    // UUID v4
  character: string;            // 'ক', 'খ', etc. (Unicode)
  characterId: number;           // 1-60
  transliteration: string;       // 'ko', 'kho', etc.
  category: string;              // 'vowel' | 'consonant' | 'numeral'
  strokes: Stroke[];             // Array of stroke objects
  strokeCount: number;           // Number of strokes
  deviceType: string;            // 'mouse' | 'touch' | 'pen'
  hasPressure: boolean;          // Whether any pressure data was captured
  canvasWidth: number;           // Canvas dimensions at draw time
  canvasHeight: number;
  penThickness: number;          // Pen thickness used (px)
  pngBlob: Blob;                 // Raw full-canvas PNG (black-on-white)
  svgString: string;             // SVG vector paths
  createdAt: number;             // Timestamp (ms)
  contributorId: string;         // localStorage session UUID
}
```
- **Indexes:** `character`, `characterId`, `createdAt`, `contributorId`, `category`

#### Store: `contributor`
- **Key path:** `'session'` (single record)
- **Value:**
```typescript
interface Contributor {
  id: string;                    // UUID, generated once
  deviceType: string;            // Detected primary input
  userAgent: string;
  createdAt: number;
  lastActive: number;
  sampleCount: number;           // Total samples by this contributor
}
```

#### Store: `settings`
- **Key path:** `key` (string)
- **Value:** `{ key: string, value: any }`
- **Keys:** `presentation-mode`, `pen-thickness`, `theme`, `default-mode`

### Stroke Data Structure
```typescript
interface Stroke {
  points: Point[];
}

interface Point {
  x: number;          // Canvas X coordinate (px)
  y: number;          // Canvas Y coordinate (px)
  t: number;          // Milliseconds since stroke start
  p: number | null;   // Pressure (0.0-1.0), null for mouse/touch without pressure
}
```

### Export ZIP Structure
```
bangla-handwriting-dataset.zip
  ├── metadata.csv              // character, transliteration, category, strokeCount,
  │                             // deviceType, hasPressure, createdAt, contributorId, fileName
  ├── strokes.jsonl             // One JSON object per line: { id, character, strokes }
  ├── images/
  │   ├── 01_ক/
  │   │   ├── 0001.png
  │   │   └── ...
  │   ├── 02_খ/
  │   └── ...
  ├── svg/
  │   ├── 01_ক/
  │   │   ├── 0001.svg
  │   │   └── ...
  │   └── ...
  └── README.txt               // Dataset info, format, collection date, contributor ID
```

**Note:** Folders use `XX_ক` format (number prefix + Unicode character) for sortability and to avoid filesystem Unicode issues.

### Export Format Options
1. **Folder-per-class + CSV** — images organized by character folder + metadata.csv
2. **Flat images + labels file** — all images flat + labels in JSONL/CSV
3. **TFRecord** — TensorFlow-compatible binary format
4. **HDF5** — PyTorch-compatible hierarchical data format
5. **All** — all of the above in one ZIP

### Image Variant Options (at export)
- Raw full-canvas (as drawn)
- Cropped to bounding box (remove whitespace)
- Centered (drawing centered in canvas)
- Resized: 28x28, 64x64, 128x128
- Color: black-on-white (default) or white-on-black (inverted)

---

## UI/UX Design (Mobile-First)

### Main Collection View
```
┌─────────────────────────────┐
│  ☰  Bangla Handwriting  ⚙  │  Top bar
├─────────────────────────────┤
│                             │
│  ┌─────────┐  Target: ক    │  Reference card (top-right corner)
│  │ Stats   │  (ko)         │  Glyph + transliteration
│  │ 12/60   │               │
│  └─────────┘               │
│                             │
│  ┌─────────────────────┐   │
│  │                     │   │
│  │   DRAWING CANVAS    │   │  Responsive canvas
│  │                     │   │  Black strokes on white
│  │                     │   │
│  └─────────────────────┘   │
│                             │
│  [↩ Undo] [↪ Redo] [🧹]   │  Tool row
│  [ thickness: ━━●━━ ]      │  Pen thickness slider
│                             │
│  [⬅ Prev] [⏭ Skip] [OK ✓] │  Navigation row
│                             │
│  ●●●○○○○○... 3/60          │  Progress dots + counter
└─────────────────────────────┘
```

### Collection Overview Grid
- 60-character grid grouped by category (vowels, consonants, numerals)
- Each cell shows: character, sample count, progress bar
- Color-coded: red (0), orange (1-5), yellow (6-20), green (20+)
- Click any character to jump to writing it
- Category filter tabs: All / Vowels / Consonants / Numerals

### Stats Dashboard
- Total samples count
- Per-category breakdown (vowels/consonants/numerals)
- Per-character counts (bar chart)
- Last 7 days activity chart
- Device type breakdown (mouse/touch/pen)

### Export View
- Format selector (checkboxes: CSV, JSONL, TFRecord, HDF5)
- Image variant selector (dropdowns: normalization, size, color scheme)
- Export progress bar
- Download ZIP button
- Share button (Web Share API for mobile)

### Settings View
- Presentation mode (sequential, randomized, adaptive, user-select)
- Theme toggle (dark/light)
- Default pen thickness
- Device info display
- Clear all data button (with confirmation)

---

## Implementation Phases

### Phase 1: Project Setup & Foundations
**What:** Scaffold the project with all tooling and foundational data/code.
**Files:**
- `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`
- `index.html`, `src/main.tsx`, `src/App.tsx`
- `src/data/banglaChars.ts` — character data (60 entries)
- `src/db/database.ts` — IndexedDB setup (idb)
- `src/store/useStore.ts` — Zustand store
- `src/types/index.ts` — TypeScript interfaces (Stroke, Point, Sample, etc.)
- `src/router.tsx` — Route definitions
**Test:** `npm run dev` starts, shows placeholder routes, IndexedDB initializes.
**Depends on:** Nothing.

### Phase 2: Drawing Canvas (Core Feature)
**What:** The canvas where users draw, with all tools and stroke capture.
**Files:**
- `src/components/Canvas/DrawingCanvas.tsx` — main canvas component
- `src/components/Canvas/Toolbar.tsx` — undo/redo/clear/eraser/thickness
- `src/hooks/usePointerDrawing.ts` — pointer events handling + stroke capture
- `src/utils/canvasUtils.ts` — drawing, rendering, PNG export
- `src/utils/svgUtils.ts` — SVG path generation
- `src/types/stroke.ts` — stroke types
**Test:** Draw with mouse/touch, undo/redo/clear works, PNG + SVG generated.
**Depends on:** Phase 1.

### Phase 3: Collection Flow
**What:** Character presentation, navigation, submission, progress.
**Files:**
- `src/components/Collection/CollectionView.tsx` — main collection page
- `src/components/Collection/ReferenceCard.tsx` — target glyph display
- `src/components/Collection/ProgressBar.tsx` — dots + counter
- `src/components/Collection/NavigationRow.tsx` — prev/skip/ok buttons
- `src/hooks/useCollectionFlow.ts` — presentation logic, state
- `src/utils/presentationModes.ts` — sequential/random/adaptive/user-select
- `src/utils/sessionId.ts` — UUID generation + localStorage
**Test:** Cycle through characters in all 4 modes, submit saves to IndexedDB, progress updates.
**Depends on:** Phase 2.

### Phase 4: Collection Overview Grid
**What:** 60-character grid with counts and click-to-jump.
**Files:**
- `src/components/Grid/CollectionGrid.tsx`
- `src/components/Grid/CharacterCard.tsx`
- `src/components/Grid/CategoryFilter.tsx`
**Test:** Grid shows correct counts, colors update, clicking jumps to character.
**Depends on:** Phase 3.

### Phase 5: Stats Dashboard
**What:** Statistics view with totals, breakdowns, charts.
**Files:**
- `src/components/Stats/StatsView.tsx`
- `src/components/Stats/CategoryBreakdown.tsx`
- `src/components/Stats/ActivityChart.tsx`
- `src/components/Stats/DeviceBreakdown.tsx`
**Test:** Stats reflect actual IndexedDB data, charts render correctly.
**Depends on:** Phase 3.

### Phase 6: Export System
**What:** Multi-format export with variant generation, ZIP packaging, Web Share.
**Files:**
- `src/components/Export/ExportView.tsx`
- `src/components/Export/FormatSelector.tsx`
- `src/components/Export/VariantSelector.tsx`
- `src/components/Export/ExportProgress.tsx`
- `src/utils/imageProcessing.ts` — crop, center, resize, invert
- `src/utils/exportFormats.ts` — CSV, JSONL, TFRecord, HDF5 generators
- `src/utils/zipBuilder.ts` — ZIP assembly (JSZip)
- `src/utils/webShare.ts` — Web Share API integration
**Test:** Export in all formats, verify file structures, test on mobile with Web Share.
**Depends on:** Phase 3.

### Phase 7: Settings & Polish
**What:** Settings panel, theme, PWA, accessibility, responsive polish.
**Files:**
- `src/components/Settings/SettingsView.tsx`
- `src/hooks/useSettings.ts`
- `src/hooks/useTheme.ts`
- `public/manifest.json`, `public/sw.js`
- CSS responsive breakpoints across all components
**Test:** PWA installs, works offline, theme toggles, keyboard navigation works.
**Depends on:** Phases 3-6.

### Phase 8: Deploy
**What:** Vercel deployment, build optimization, final testing.
**Files:**
- `vercel.json`
- Final `vite.config.ts` optimization
**Test:** Deploy succeeds, site loads, all features work on production URL.
**Depends on:** All phases.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| HDF5 in browser (h5wasm) | Medium | Fallback to JSON if HDF5 fails, mark as experimental |
| TFRecord in browser | Medium | Use @tensorflow/tfjs buffer serialization |
| Canvas pointer events on old browsers | Low | Pointer events widely supported (97%+); no polyfill needed |
| Large dataset export OOM | Medium | Process in chunks, show progress, warn above 1000 samples |
| IndexedDB storage limits | Low | Show storage estimate, allow bulk delete, warn at 80% capacity |
| Bangla Unicode in filenames | Low | Use `XX_ক` format (number prefix + Unicode) with mapping in CSV |
| Touch scrolling vs drawing conflict | Medium | Set `touch-action: none` on canvas element |
| High-DPI display rendering | Low | Scale canvas context by `devicePixelRatio` |
| Eraser + undo interaction edge cases | Medium | Maintain stroke stack; eraser marks strokes as deleted (not hard delete) |

---

## Out of Scope

- Backend server or database
- User authentication or accounts
- Admin review panel
- Rate limiting or spam prevention
- Global collection statistics (across all users)
- Contributor banning
- Online sync or cloud storage
- Real-time collaboration
- Conjunct characters (যুক্তাক্ষর)
- Multi-language support (UI is English only)
- OCR or ML model training (this is data collection only)

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Build tool | Vite |
| Language | TypeScript |
| Styling | TailwindCSS v4 (mobile-first) |
| State | Zustand |
| Storage | IndexedDB via `idb` |
| Canvas | HTML5 Canvas + Pointer Events API |
| ZIP | JSZip |
| TFRecord | @tensorflow/tfjs |
| HDF5 | h5wasm |
| PWA | vite-plugin-pwa |
| Deploy | Vercel (static) |
