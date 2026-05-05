<div align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=28&duration=3000&pause=1000&color=00D9FF&center=true&vCenter=true&width=700&lines=ALIA+%F0%9F%A4%96+Intelligence+Pharmaceutique;AI+Medical+Training+Avatar;Powered+by+Gemini+2.0+%2B+Tavus+CVI;Vital+Company+dima+m3ak+%F0%9F%92%9A" alt="ALIA" />
</div>

<div align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-4285F4?style=for-the-badge&logo=google)
![Tavus](https://img.shields.io/badge/Tavus-CVI-FF6B6B?style=for-the-badge)
![Three.js](https://img.shields.io/badge/Three.js-r184-000000?style=for-the-badge&logo=threedotjs)
![Netlify](https://img.shields.io/badge/Netlify-Deployed-00C7B7?style=for-the-badge&logo=netlify)

</div>

---

## 🏥 About

**ALIA** (Avatar Logique d'Interaction Artificielle) is an AI-powered medical training platform built for the Tunisian pharmaceutical market. It enables pharmaceutical sales representatives to practice medical visits with a realistic AI avatar that speaks Tunisian dialect (Derja), challenges them with evidence-based questions, and evaluates their performance.

Built as a *Projet de Fin d'Études* for the 4DS program (2025/2026), ALIA bridges the gap between traditional training and immersive AI-driven simulation.

---

## 🧠 How It Works

ALIA offers **two completely independent avatar modes** with zero overlap:

### Mode 1: Avatar 3D (Gemini + Three.js)
```
User speaks (mic) → Gemini 2.0 Flash Live API → Real-time AI response
                                                        ↓
                                          Audio stream → Web Audio AnalyserNode
                                                        ↓
                                          Volume data → GLB morph targets (lip-sync)
```

1. User selects a medical product and healthcare profile
2. Live voice session starts with Gemini 2.0 Flash (bidirectional audio)
3. 3D avatar lip-syncs in real time via Web Audio frequency analysis
4. Tunisian dialect (Derja) via system prompt
5. At session end, Gemini evaluates performance across 4 compliance pillars
6. **No Tavus credits consumed**

### Mode 2: Avatar HD (Tavus CVI)
```
User → Tavus iframe → Full conversation handled by Tavus
                              ↓
                    Photorealistic HD video avatar
```

1. User selects Avatar HD mode
2. Netlify function creates Tavus conversation session (server-side)
3. Daily.co iframe loads with photorealistic ALIA avatar
4. **Gemini audio pipeline is completely OFF**
5. Tavus handles the entire conversation
6. Session ends when user clicks "Quitter Session"

---

## 🎙️ Features

- 🎭 **Dual-mode avatar system** — choose between 3D interactive or HD photorealistic
- 🎙️ **Real-time voice in Tunisian dialect (Derja)** — native conversational AI powered by Gemini 2.0 Flash Live
- 🤖 **3D Avatar Mode** — GLB with procedural lip-sync, unlimited free usage
- ✨ **HD Avatar Mode** — Tavus CVI photorealistic video avatar
- 🧬 **Vital Company medical knowledge base** — CardioGuard Forte, NeuroZen, and more
- 💬 **Hybrid text + voice chat interface** — seamless switching between input modes (3D mode)
- 🌍 **Built for the Tunisian pharmaceutical market** — FR / AR (Derja) / EN / ES support
- 📊 **AI-powered session evaluation** — scores on clarity, accuracy, compliance, objection handling (3D mode)
- 🔒 **Secure serverless architecture** — Tavus API key never exposed to the browser

---

## 🤖 Avatar Modes

### Avatar 3D (Gemini + Three.js)
- **FREE • UNLIMITED** — no credits consumed
- Built with React Three Fiber + Three.js
- GLB/GLTF model support with drag-and-drop upload
- Real-time lip-sync via Web Audio AnalyserNode on Gemini audio output
- Supports all common blend shape conventions: `viseme_aa`, `jawOpen`, `mouthOpen`, `Mouth_Open`, `jaw_open`, `viseme_PP`, and more
- 60fps animation via `useFrame` hook
- Debug panel showing all detected blend shapes
- Gemini 2.0 Flash Live handles ALL audio and conversation
- Tunisian dialect (Derja) via system prompt
- Session evaluation at the end

### Avatar HD (Tavus CVI)
- **HAUTE DÉFINITION** — photorealistic digital twin
- Powered by Tavus Conversational Video Intelligence
- Persona ID: `pfdbee1b41de`
- Replica ID: `r55e6793f10f`
- Full transcription enabled
- Daily.co WebRTC infrastructure
- **Gemini is NOT used** — Tavus handles the entire conversation
- No Three.js canvas rendered
- Immersive fullscreen video experience

---

## ⚙️ Setup

### Prerequisites
- Node.js 20+
- A [Google AI Studio](https://aistudio.google.com) API key (Gemini)
- A [Tavus](https://tavus.io) API key

### Installation

```bash
git clone https://github.com/celestial-unit/ALIA-PI.git
cd ALIA-PI
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

```env
# Frontend — exposed via Vite (safe for browser)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GEMINI_API_KEY_TEXT=your_gemini_api_key_here

# Server-side only — NEVER expose in frontend
TAVUS_API_KEY=your_tavus_api_key_here
```

### Development

```bash
npm run dev
```

---

## 🚀 Deploy to Netlify

### One-click deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/celestial-unit/ALIA-PI)

### Manual deploy

1. Push to GitHub
2. Connect repo to Netlify
3. Build settings are auto-detected from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Add environment variables in Netlify dashboard:
   - `VITE_GEMINI_API_KEY` — your Gemini API key (for 3D mode)
   - `VITE_GEMINI_API_KEY_TEXT` — your Gemini API key (for text mode)
   - `TAVUS_API_KEY` — your Tavus API key (for HD mode, server-side only)

### Architecture on Netlify

```
3D Mode:
Browser → Gemini API directly → via VITE_GEMINI_API_KEY (public)

HD Mode:
Browser → /.netlify/functions/tavus → Tavus API (server-side, key hidden)
        → Daily.co iframe → Tavus CVI
```

**Key security principle:** The two modes are 100% isolated. TAVUS_API_KEY is NEVER exposed to the browser.

---

## 👥 Team

| Role | Name |
|------|------|
| Lead Developer | Équipe PI-DS |
| AI Integration | Gemini 2.0 Flash |
| Avatar Engine | Tavus CVI + Three.js |
| Medical Content | Vital Company |

---

## 🎓 Academic Context

**Institution:** École Supérieure de Technologie et d'Informatique (or equivalent)  
**Program:** 4ème année Développement de Solutions (4DS)  
**Year:** 2025/2026  
**Type:** Projet de Fin d'Études (PFE)  
**Domain:** AI × Pharmaceutical Training × Digital Health

This project demonstrates the integration of cutting-edge generative AI (Gemini 2.0), conversational video intelligence (Tavus CVI), and 3D web technologies (Three.js / React Three Fiber) in a real-world healthcare training application tailored for the Tunisian market.

---

<div align="center">
  <b>Vital Company dima m3ak 🏥</b><br/>
  <i>Projet de Fin d'Études — 4DS — 2025/2026</i>
</div>
