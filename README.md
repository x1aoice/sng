# 🃏 6-Max Hyper SNG (Sit & Go) Texas Hold'em

A high-speed, modern 6-player **Hyper Sit & Go** Texas Hold'em tournament web game built with React 19, TypeScript, Tailwind CSS v4, and Vite.

Features a clean, minimalist design aesthetic, hand-by-hand blind doubling, short-stack GTO Push/Fold AI opponents, Web Audio sound effects, and high-impact showdown card animations.

---

## ✨ Features

- **⚡ Hyper SNG Economy & Blinds Doubling**
  - **Starting Stack**: $10,000,000 ($10M) per player ($60M total chips in play).
  - **Dynamic Blinds Doubling Every Hand**:
    - **Hand #1**: $250K / $500K (20 BB deep)
    - **Hand #2**: $500K / $1,000,000 ($1M) (10 BB)
    - **Hand #3**: $1M / $2M (5 BB - Push/Fold territory)
    - **Hand #4**: $2M / $4M (2.5 BB)
    - **Hand #5+**: Doubling indefinitely until a champion is crowned!
  - **$60,000,000 Tournament Prize Pool**:
    - 🥇 **1st Place**: $42,000,000 ($42M · 70%)
    - 🥈 **2nd Place**: $18,000,000 ($18M · 30%)

- **🤖 Intelligent Short-Stack GTO AI**
  - Bot opponents dynamically adjust to stack depth.
  - Switches to GTO Push/Fold shove/call charts when stack drops below 10 BB and 5 BB.

- **🎴 Dynamic Showdown Card Reveal**
  - Opponents' hole cards remain neat and compact while face-down during betting.
  - Upon showdown, opponent cards smoothly flip and expand into the full large-card format identical to Hero's cards (62×88px with 20px typography and crisp vector suits).

- **🎨 Minimalist Apple / OpenAI Design System**
  - Pure white and neutral felt aesthetic with zero visual clutter.
  - Symmetrically balanced stadium table with 6 radial seats.
  - Seamless responsive slider bet control with min/max, 2.5BB, half-pot, and all-in shortcuts.
  - Interactive hand log drawer and instant auto-deal progression.

- **🔊 Synthesized Web Audio Sound Effects**
  - Zero-latency procedural sound generation (chip clicks, card shuffles/flips, win chimes) using the browser's native Web Audio API — no external audio files required.

- **⏱ 30-Second Turn Countdown**
  - Realistic time-bank indicator for both human player and AI bots.

---

## 🛠 Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Effects**: [canvas-confetti](https://github.com/catdad/canvas-confetti)

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+ recommended)
- npm or pnpm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/x1aoice/sng.git

# Navigate to project directory
cd sng

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

---

## 📄 License

MIT License. Free for learning, modification, and personal use.
