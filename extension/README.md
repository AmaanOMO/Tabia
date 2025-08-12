# Tabia Chrome Extension

A smart tab session manager with real-time collaboration features.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Extension
```bash
npm run build
```

### 3. Load in Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `dist/` folder

## 🔧 Development

### Development Server
```bash
npm run dev
```

### Watch Mode (Auto-rebuild)
```bash
npm run watch
```

## 📁 Project Structure

```
extension/
├─ src/
│  ├─ popup/           # Extension popup UI
│  │  ├─ App.tsx      # Main application
│  │  ├─ components/  # UI components
│  │  └─ main.tsx     # React entry point
│  ├─ common/         # Shared utilities
│  │  ├─ api.ts       # API client
│  │  ├─ types.ts     # TypeScript types
│  │  └─ shortcuts.ts # Keyboard shortcuts
│  ├─ background.ts   # Service worker
│  └─ styles.css      # Global styles
├─ dist/              # Built extension
└─ public/            # Static assets
```

## 🌐 API Configuration

Set environment variables in `.env`:
```bash
VITE_API_BASE=http://localhost:8080/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🎯 Features

- ✅ Save current window as session
- ✅ Save all windows as session
- ✅ Save individual tabs
- ✅ Drag & drop tab reordering
- ✅ Search sessions and tabs
- ✅ Star/unstar sessions
- ✅ Keyboard shortcuts (Alt+S, Alt+T)
- ✅ Undo functionality
- ✅ Real-time updates (ready for Supabase)

## 🐛 Troubleshooting

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Check for TypeScript errors: `npm run type-check`

### Extension Not Loading
- Verify manifest.json is in dist/ folder
- Check Chrome console for errors
- Ensure background script is properly built

## 🔄 Next Steps

1. **Connect to Supabase**: Update `api.ts` with real Supabase client
2. **Add Authentication**: Implement proper user login flow
3. **Test Real-time**: Verify WebSocket/Realtime functionality
4. **Deploy**: Package for Chrome Web Store

## 📝 Notes

- Extension is built with React 18 + TypeScript
- Uses Tailwind CSS for styling
- SortableJS for drag & drop
- Chrome Extension Manifest V3
- Service worker for background tasks
