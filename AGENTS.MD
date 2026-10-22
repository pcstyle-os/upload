# Project Identity: uploader

This project follows the **pcstyle** high-performance stack and aesthetic.

## 🛠 Technical Stack
- **Framework**: Next.js 16 (App Router)
- **File Storage**: UploadThing (v7.7.4)
- **Styling**: Tailwind CSS v4 (CSS-first)
- **Runtime**: Bun
- **Icons**: pixel SVGs in `components/Pix.tsx`

## 🎨 Design System: pcstyle.dev desktop
Matches the home site (pcstyle.dev, repo pc-style/homepage): a pixel desktop on a dithered aurora. Shared with s.pcstyle.dev; keep `components/{Aurora,Desk,Pix,Clock}.tsx` and `app/globals.css` in sync with that repo.
- **Shell**: `components/Desk.tsx` — aurora wallpaper (`Aurora.tsx`, Bayer 8x8), 30px top bar, one window with a dithered title bar, 26px taskbar with the CET clock
- **Colors**: bg #0a0a0b, fg #e8e6e3, dim #8a8782, faint #4a4845, line #252327, magenta #8c1862 for text accents, violet #9d5cff for anything clickable or focused; dither ink #e45aa3, tint #9d5cff, dim #2a1a4d
- **Typography**: Departure Mono (`app/fonts`), lowercase copy, font sizes in multiples of 11px
- **Motifs**: `$ ` fact labels, `##` section labels over a dither rule, square corners everywhere, 1px dithered edge as the only shadow
- **No**: rounded corners, gradients, blur/glow, smooth-scaled pixel art, Lucide-style line icons

## 📁 File Structure
```
uploader/
├── app/
│   ├── api/uploadthing/
│   │   ├── core.ts       # FileRouter definitions
│   │   └── route.ts      # API route handler
│   ├── globals.css       # pcstyle.dev theme tokens
│   ├── layout.tsx        # Root layout (Departure Mono)
│   └── page.tsx          # Main upload page
├── components/
│   ├── Desk.tsx          # Desktop shell (aurora, bars, window)
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