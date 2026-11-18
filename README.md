# TORA HOUSE — COFFEE • TEA • JUICES
### بيت تورا — قهوة مختصة • شاي • عصائر طازجة

A production-ready, luxury 3D café website and online ordering system built for **TORA HOUSE** in Riyadh, Saudi Arabia.

---

## 🌟 Key Features

- **Luxury 3D & Framer Motion UI**: Interactive 3D coffee cup powered by Three.js, glassmorphism elements, gold accents, and smooth transitions.
- **Authentic 49-Item Menu**: Cold drinks, hot specialty coffees, mojitos, fresh juices, artisanal teas, sweets, bakery, and syrup customization options with accurate SAR pricing.
- **Smart Shopping Cart & Checkout**: Size selection (Regular / Large / Small), syrup add-ons, sugar & ice customizer, pickup & delivery calculation.
- **Private Owner Admin Portal**:
  - Completely hidden from customer view (`/#owner` route with server-side authorization).
  - Salted and hashed Admin PIN security system (`scryptSync` + `timingSafeEqual`).
  - Owner PIN management with current-PIN verification and emergency Master Recovery Key.
  - Live order management, preparation status workflow, and thermal receipt printing.
- **WhatsApp Integration**:
  - Automatic order notification dispatch to official TORA HOUSE WhatsApp number (`+966579165664`) via Meta WhatsApp Business Cloud API.
  - 1-click WhatsApp order opening and forward fallback.
  - Customer remains on the website after ordering (no unwanted redirects).
- **Full Bilingual EN / AR (RTL)**: Native Arabic support with Cairo and Tajawal fonts, smooth language switching, and RTL alignment.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Three.js, Lucide Icons, Canvas Confetti
- **Backend**: Node.js, Express, Native Crypto (`scryptSync`, `hmac-sha256`)
- **API**: Meta WhatsApp Business Cloud API (Graph API v21.0)
- **Database**: Dual-engine persistence (Server-side JSON database + Supabase PostgreSQL ready)
- **Build Tool**: Vite 5 + pnpm

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18+
- pnpm (`npm install -g pnpm`)

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your configuration (optional for local testing; defaults are preconfigured).

### 4. Run Full-Stack Server
```bash
pnpm run dev
# or
node server/server.js
```
The website will be live at `http://localhost:5173/` (or `http://127.0.0.1:5173/`).

### 5. Access Owner Admin Portal
Navigate to:
```
http://localhost:5173/#owner
```
- **Default Owner PIN**: `tora2026`
- Change PIN anytime inside **🔑 Change PIN & Settings**.

---

## 📦 Production Build

```bash
pnpm run build
```
Build output is generated inside the `dist/` directory.

---

## 🌐 GitHub Pages Deployment

This repository includes an automated GitHub Actions deployment workflow at `.github/workflows/deploy.yml`.

When pushed to GitHub:
1. Go to your repository **Settings > Pages**.
2. Under **Build and deployment > Source**, select **GitHub Actions**.
3. Every push to `main` will automatically build and publish the website.

---

## 🔒 Security & Privacy Notice

- All real customer orders, passwords, hashed PINs, and API tokens are excluded via `.gitignore`.
- Admin routes and API endpoints are protected server-side with Bearer token authentication.

---

## ☕ Contact & Brand Information

- **Brand**: TORA HOUSE (بيت تورا)
- **Official WhatsApp**: +966 57 916 5664
- **Location**: King Abdulaziz Road, Al Malqa District, Riyadh, Saudi Arabia
