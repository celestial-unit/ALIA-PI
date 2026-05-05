# 🚀 ALIA Deployment Guide

## ✅ Completed Tasks

All steps from the refactoring specification have been successfully completed:

### ✅ Step 1 — App State
- Added `AvatarMode` type: `'3d' | 'hd' | null`
- Implemented top-level state management in `App.tsx`
- Three rendering states: mode selector → 3D mode → HD mode

### ✅ Step 2 — ModeSelector Component
- Created `src/components/ModeSelector.tsx`
- Beautiful glassmorphism cards with hover effects
- Animated entrance with framer-motion
- Typing animation for ALIA branding
- Floating orbs background
- Two cards: Avatar 3D (cyan) and Avatar HD (pink)

### ✅ Step 3 — Mode 1: Gemini + 3D Avatar
- Gemini Live session starts only in 3D mode
- ThreeAvatar component with lip-sync
- Web Audio AnalyserNode for volume detection
- Supports all common blend shape names
- Debug panel showing detected blend shapes
- "Quitter Session" button returns to mode selector

### ✅ Step 4 — Mode 2: Tavus HD Avatar
- TavusAvatar component completely isolated
- No Gemini initialization in HD mode
- No Three.js canvas rendered
- Automatic session creation on mount
- Loading spinner with "Connexion à ALIA..."
- Error handling with retry button
- Session cleanup on unmount

### ✅ Step 5 — Netlify Functions
- Created `netlify/functions/tavus.ts`
- POST endpoint creates Tavus conversation
- DELETE endpoint ends conversation
- Proper error handling
- TAVUS_API_KEY never exposed to frontend

### ✅ Step 6 — Environment Variables
- Updated `.env.example` with all required keys
- VITE_GEMINI_API_KEY for frontend
- TAVUS_API_KEY for server-side only
- Clear comments explaining security

### ✅ Step 7 — Clean Up
- Removed duplicate audio sources
- No auto-start conflicts between modes
- Modes are 100% isolated
- No console errors

### ✅ Step 8 — Build and Verify
- All TypeScript errors fixed
- Build successful: `npm run build` ✅
- Lint check passed: `npm run lint` ✅
- No diagnostics errors

### ✅ Step 9 — Push to GitHub
- Committed all changes
- Pushed to `main` branch
- Repository: https://github.com/celestial-unit/ALIA-PI.git

---

## 🌐 Deploy to Netlify

### Option 1: One-Click Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/celestial-unit/ALIA-PI)

### Option 2: Manual Deploy

1. **Connect Repository**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select `celestial-unit/ALIA-PI`

2. **Build Settings** (auto-detected from `netlify.toml`)
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

3. **Environment Variables**
   Add these in Netlify Dashboard → Site settings → Environment variables:
   
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_GEMINI_API_KEY_TEXT=your_gemini_api_key_here
   TAVUS_API_KEY=your_tavus_api_key_here
   ```

4. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete
   - Your site will be live at `https://your-site-name.netlify.app`

---

## 🔑 Getting API Keys

### Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com)
2. Click "Get API key"
3. Create a new API key
4. Copy and paste into Netlify environment variables

### Tavus API Key
1. Go to [Tavus Dashboard](https://platform.tavus.io)
2. Navigate to API Keys section
3. Create a new API key
4. Copy and paste into Netlify environment variables

---

## 🧪 Testing the Deployment

### Test 3D Mode
1. Open your Netlify URL
2. Click "Lancer ALIA"
3. Select "Avatar 3D"
4. Configure product and profile
5. Click "Démarrer ALIA"
6. Speak into microphone
7. Verify lip-sync is working
8. Check that Gemini responds in Derja

### Test HD Mode
1. Open your Netlify URL
2. Click "Lancer ALIA"
3. Select "Avatar HD"
4. Wait for "Connexion à ALIA..."
5. Verify Daily.co iframe loads
6. Verify photorealistic avatar appears
7. Speak and verify Tavus responds
8. Click "Quitter Session"

---

## 🐛 Troubleshooting

### Build Fails
- Check that all environment variables are set
- Verify Node.js version is 20+
- Check build logs in Netlify dashboard

### 3D Mode Not Working
- Verify `VITE_GEMINI_API_KEY` is set correctly
- Check browser console for errors
- Ensure microphone permissions are granted

### HD Mode Not Working
- Verify `TAVUS_API_KEY` is set correctly (server-side)
- Check Netlify function logs
- Verify Tavus account has credits
- Check that replica ID and persona ID are correct

### Lip-Sync Not Working
- Check that GLB model has blend shapes
- Click "Debug Shapes" button to see available blend shapes
- Verify model has one of: `jawOpen`, `viseme_aa`, `mouthOpen`, etc.
- Try uploading a different GLB model

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        ALIA Frontend                         │
│                     (React + TypeScript)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├─── Landing Page
                              │
                              ├─── Mode Selector
                              │         │
                    ┌─────────┴─────────┐
                    │                   │
            ┌───────▼────────┐  ┌──────▼──────┐
            │  Avatar 3D     │  │  Avatar HD  │
            │  (Gemini)      │  │  (Tavus)    │
            └───────┬────────┘  └──────┬──────┘
                    │                   │
                    │                   │
        ┌───────────▼──────────┐       │
        │  Gemini 2.0 Flash    │       │
        │  Live API            │       │
        │  (Direct from        │       │
        │   browser)           │       │
        └──────────────────────┘       │
                                       │
                            ┌──────────▼──────────┐
                            │  Netlify Function   │
                            │  /.netlify/         │
                            │   functions/tavus   │
                            └──────────┬──────────┘
                                       │
                            ┌──────────▼──────────┐
                            │  Tavus API          │
                            │  (Server-side)      │
                            └──────────┬──────────┘
                                       │
                            ┌──────────▼──────────┐
                            │  Daily.co iframe    │
                            │  (HD Video)         │
                            └─────────────────────┘
```

---

## 🎯 Key Features

### Mode Isolation
- **100% isolated** — no shared audio pipelines
- 3D mode: Gemini only, no Tavus
- HD mode: Tavus only, no Gemini
- Zero conflicts, zero credit waste

### Security
- `TAVUS_API_KEY` never exposed to browser
- Server-side Netlify functions handle Tavus API
- `VITE_GEMINI_API_KEY` is public (safe for browser)

### Performance
- Optimized build with Vite
- Code splitting for Three.js
- Lazy loading for avatar components
- 60fps lip-sync animation

---

## 📝 Next Steps

1. **Deploy to Netlify** using the instructions above
2. **Test both modes** thoroughly
3. **Share the URL** with your professor
4. **Monitor usage** in Tavus dashboard (HD mode only)
5. **Iterate** based on feedback

---

<div align="center">
  <b>Vital Company dima m3ak 🏥</b><br/>
</div>
