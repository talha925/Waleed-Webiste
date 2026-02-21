# 🏗️ Multi-Domain / Multi-Brand Setup Guide

## Architecture Overview

This is a **monorepo** with two workspaces:
- `Frontend/` — Next.js 14 (App Router) 
- `Backend/` — Node.js + Express + MongoDB

Both are deployed from a **single Git repository**. Each brand/domain gets:
- Its own **Vercel project** (pointing to same repo)
- Its own **environment variables**
- Optionally, its own **MongoDB database**

---

## ✅ What's Already Implemented

### Frontend (Next.js)

| Feature | Status | Location |
|---------|--------|----------|
| Brand Config Types | ✅ | `Frontend/config/types.ts` |
| Brand A (PennyScroll) | ✅ | `Frontend/config/brandA.ts` |
| Brand B (Smart Saver) | ✅ | `Frontend/config/brandB.ts` |
| Domain Detection | ✅ | `Frontend/config/index.ts` → `getBrandConfig()` |
| Brand Context (Client) | ✅ | `Frontend/src/context/BrandContext.tsx` |
| Dynamic Metadata | ✅ | `layout.tsx`, `page.tsx`, all pages |
| Dynamic GA/Gtag | ✅ | `layout.tsx` |
| Dynamic Theme Colors | ✅ | CSS variables injected in `layout.tsx` |
| Dynamic Logo | ✅ | `Header.tsx` via `useBrand()` |
| Dynamic Footer | ✅ | `Footer.tsx` via `useBrand()` |
| Dynamic Sitemap | ✅ | `sitemap.xml/route.ts` |
| Dynamic Robots.txt | ✅ | `robots.ts` |
| Contact Page | ✅ | Uses `brand.contactEmail` |
| SEO (canonical, OG) | ✅ | All pages use `brand.siteUrl` |

### Backend (Node.js)

| Feature | Status | Location |
|---------|--------|----------|
| Brand Config Map | ✅ | `Backend/config/brands.js` |
| Brand Detection Middleware | ✅ | `Backend/middlewares/brandDetection.js` |
| CORS Multi-Origin | ✅ | `Backend/middlewares/security.js` |

---

## 🚀 Adding a New Brand / Domain

### Step 1: Frontend Config

Copy `Frontend/config/brandB.ts` → `Frontend/config/brandC.ts`:

```typescript
import type { BrandConfig } from './types';

const brandC: BrandConfig = {
  brandId: 'newbrand',
  siteName: 'New Brand',
  siteTagline: 'Your new tagline',
  logoPath: '/image/newbrand-logo.png',
  faviconPath: '/favicon-newbrand.svg',
  domain: 'www.newbrand.com',
  siteUrl: 'https://www.newbrand.com',
  metaTitle: 'New Brand - Tagline',
  metaTitleTemplate: '%s | New Brand',
  metaDescription: 'New Brand meta description',
  metaKeywords: ['keyword1', 'keyword2'],
  ogImage: '/images/og-newbrand.jpg',
  twitterImage: '/images/twitter-newbrand.jpg',
  gaId: process.env.NEXT_PUBLIC_GA_ID_BRAND_C || 'G-CCCCCCC',
  gtagConversion: { sendTo: 'AW-XXX/YYY', value: 1.0, currency: 'USD' },
  themeColor: '#F59E0B',
  primaryHSL: '38 92% 50%',
  accentHSL: '25 95% 53%',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL_BRAND_C || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://coupon-app-backend.vercel.app',
  mongoDBName: process.env.MONGO_DB_NAME_BRAND_C || undefined,
  homepageLayout: 'default',
  copyrightText: '© 2025 New Brand',
  contactEmail: 'hello@newbrand.com',
};

export default brandC;
```

### Step 2: Register in Domain Map

Edit `Frontend/config/index.ts`:

```typescript
import brandC from './brandC';

const DOMAIN_MAP = [
    { match: 'smartsaver.com', config: brandB },
    { match: 'newbrand.com',   config: brandC },  // ← Add this
    { match: '', config: brandA },  // Fallback — always last
];

export { brandA, brandB, brandC };
```

### Step 3: Backend Brand Map (Optional)

If the new brand needs a separate MongoDB database, edit `Backend/config/brands.js`:

```javascript
const BRAND_MAP = [
    { match: 'smartsaver.com', brandId: 'smartsaver', mongoUri: process.env.MONGO_URI_BRAND_B || null },
    { match: 'newbrand.com',   brandId: 'newbrand',   mongoUri: process.env.MONGO_URI_BRAND_C || null },
    { match: '', brandId: 'pennyscroll', mongoUri: null },
];
```

### Step 4: Backend CORS

Add the new domain to `ALLOWED_ORIGINS` env var:

```
ALLOWED_ORIGINS=http://localhost:3000,https://www.pennyscroll.com,https://www.smartsaver.com,https://www.newbrand.com
```

### Step 5: Vercel Deployment

1. Create a **new Vercel project** → connect to the same Git repo
2. Set **Root Directory** to `Frontend`
3. Set environment variables:

```
NEXT_PUBLIC_SITE_URL=https://www.newbrand.com
NEXT_PUBLIC_API_BASE_URL=https://your-backend.vercel.app
NEXT_PUBLIC_GA_ID_BRAND_C=G-CCCCCCC
NEXT_PUBLIC_APP_BRAND_ID=newbrand                   # 🔑 ESSENTIAL: For fast static generation
NEXT_PUBLIC_IMAGE_DOMAIN=your-new-bucket.s3.amazonaws.com  # Optional: for custom image domains
```

4. Add the custom domain `www.newbrand.com` in Vercel dashboard

### Technical Notes (Critical) ⚠️

- **Build-Time Optimization**: `NEXT_PUBLIC_APP_BRAND_ID` use karne se Next.js static files generate karega, jo ke fast load time ke liye best approach hai.
- **Dynamic Rendering**: `store/[slug]` jaise pages abhi bhi data ke liye dynamic rahenge, lekin landing aur category pages static honge.
- **Canonical URLs**: Automatically set to `brand.siteUrl` to prevent SEO duplicate content issues.
- **Preview Deployments**: Agar `NEXT_PUBLIC_APP_BRAND_ID` set nahi hai, toh preview URLs default brand (PennyScroll) par fallback karenge.


### Step 6: Done! 🎉

No component changes. No page duplication. Just config + env vars.

---

## 🧪 Local Development

```bash
# Run both frontend + backend
npm run dev

# Run only frontend
npm run dev:frontend

# Run only backend  
npm run dev:backend
```

### Testing a Different Brand Locally

Option 1: Add to your system's hosts file:
```
127.0.0.1  www.smartsaver.com
```
Then visit `http://www.smartsaver.com:3000`

Option 2: Use `X-Forwarded-Host` header in your requests

---

## 📁 File Structure

```
waleed-website/
├── package.json            # Root monorepo config
├── .gitignore              # Root gitignore
│
├── Frontend/               # Next.js App
│   ├── config/             # 🔑 Brand configurations
│   │   ├── types.ts        # BrandConfig interface
│   │   ├── index.ts        # Domain → Brand resolver
│   │   ├── brandA.ts       # PennyScroll config
│   │   └── brandB.ts       # Smart Saver config
│   ├── src/
│   │   ├── app/            # Next.js pages (brand-aware)
│   │   ├── components/     # Reusable components (use useBrand())
│   │   ├── context/        # BrandContext, AppContext
│   │   └── lib/            # Utils, theme, config
│   └── package.json
│
└── Backend/                # Express API
    ├── config/
    │   ├── brands.js       # 🔑 Backend brand map
    │   ├── db.js           # MongoDB connection
    │   └── env.js          # Environment validation
    ├── middlewares/
    │   ├── brandDetection.js  # 🔑 req.brand middleware
    │   └── security.js     # CORS, etc.
    └── package.json
```

---

## ⚡ Key Design Decisions

1. **Zero code duplication** — All pages/components are shared. Only config files differ.
2. **Server-side brand detection** — `getBrandConfig()` reads headers at request time, not build time.
3. **CSS variables for theming** — Brand colors injected as `--brand-primary`, `--brand-accent` in layout.
4. **Separate analytics** — Each brand has its own GA ID and conversion tags.
5. **Optional DB isolation** — Brands can share a DB or have their own via env vars.
6. **Future-proof** — Adding a new brand = 1 config file + env vars. No logic changes.
