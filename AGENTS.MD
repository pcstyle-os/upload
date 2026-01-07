# Project Identity: uploader

This project follows the **pcstyle** high-performance stack and aesthetic.

## 🛠 Technical Stack
- **Framework**: Next.js 16 (App Router)
- **File Storage**: UploadThing (v7.7.4)
- **Styling**: Tailwind CSS v4 (CSS-first)
- **Runtime**: Bun
- **Animation**: Framer Motion
- **Icons**: Lucide React

## 🎨 Design System: "Cybernetic Minimalism"
- **Colors**: Absolute Black (#000000) & Neon Magenta (#ff00ff)
- **Effects**: Glassmorphism, CRT Overlays, Matrix backgrounds
- **Typography**: JetBrains Mono with aggressive tracking
- **Identity**: Protocol: UPLOAD-777-ALPHA

## 📁 File Structure
```
uploader/
├── app/
│   ├── api/uploadthing/
│   │   ├── core.ts       # FileRouter definitions
│   │   └── route.ts      # API route handler
│   ├── globals.css       # Cyberpunk styles
│   ├── layout.tsx        # Root layout with overlays
│   └── page.tsx          # Main upload page
├── components/
│   ├── ui/
│   │   ├── CRTOverlay.tsx
│   │   ├── MatrixBackground.tsx
│   │   └── NeuralCursor.tsx
│   └── CyberUploadZone.tsx  # Main upload component
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