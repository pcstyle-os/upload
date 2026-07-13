# Project Identity: uploader

This project follows the **pcstyle** high-performance stack and aesthetic.

## 🛠 Technical Stack
- **Framework**: Next.js 16 (App Router)
- **File Storage**: UploadThing (v7.7.4)
- **Styling**: Tailwind CSS v4 (CSS-first)
- **Runtime**: Bun
- **Animation**: Framer Motion
- **Icons**: Lucide React

## 🎨 Design System: pcstyle.dev
Matches the home site (pcstyle.dev): quiet, narrow single-column mono layout.
- **Colors**: background #0a0a0b, text #e8e6e3, muted #8a8781, faint #55524d, hairline #26262a, accent #e04fb0, accent-dim #8c1862
- **Typography**: JetBrains Mono everywhere, lowercase copy, no letter-spacing tricks
- **Motifs**: `~/pcstyle` wordmark, `→` eyebrow prompts, `##` section labels with hairline rules, pink-bordered tag pills, numbered steps (01/02/03), magenta→pink gradient CTA
- **No**: CRT overlays, matrix backgrounds, custom cursors, neon glow, uppercase tracking

## 📁 File Structure
```
uploader/
├── app/
│   ├── api/uploadthing/
│   │   ├── core.ts       # FileRouter definitions
│   │   └── route.ts      # API route handler
│   ├── globals.css       # pcstyle.dev theme tokens
│   ├── layout.tsx        # Root layout (JetBrains Mono)
│   └── page.tsx          # Main upload page
├── components/
│   └── UploadZone.tsx    # Main upload component
└── lib/
    └── uploadthing.ts    # Generated helpers
```

## 🔧 Configuration Required
Add your UploadThing secret to `.env.local`:
```env
UPLOADTHING_TOKEN=your_uploadthing_token_here
```

## 🚀 Commands
```bash
bun install     # Install dependencies
bun dev         # Start development server
bun build       # Build for production
```