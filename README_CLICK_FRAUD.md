# Website-Wide Ad Click Fraud Detection & Evidence Collection System

A free, lightweight, privacy-conscious monitoring and evidence-collection system built for **Penny Scroll** and its multi-brand web network (**SpecReveal**, **BlogZenix**, **TrendFiltered**).

> **Important Mode Notice:** This system is strictly **MONITOR ONLY** (Phase 1). It monitors, scores, and collects forensic evidence in MongoDB without blocking, redirecting, challenging, or interrupting legitimate website visitors.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Multi-Brand & Multi-Website Support](#2-multi-brand--multi-website-support)
3. [Installation & Setup](#3-installation--setup)
4. [Environment Variables](#4-environment-variables)
5. [Frontend Component Integration](#5-frontend-component-integration)
6. [Backend Route Mounting](#6-backend-route-mounting)
7. [Privacy & Consent Integration](#7-privacy--consent-integration)
8. [Fraud Scoring Engine & Rules](#8-fraud-scoring-engine--rules)
9. [Running Scoring Tests](#9-running-scoring-tests)
10. [Weekly CSV Evidence Export](#10-weekly-csv-evidence-export)
11. [How to Read the 3 CSV Reports](#11-how-to-read-the-3-csv-reports)
12. [Google Ads IP Exclusions Guide](#12-google-ads-ip-exclusions-guide)
13. [Google Ads Invalid Activity Refund Investigation](#13-google-ads-invalid-activity-refund-investigation)
14. [Google Ads Conversion Audit Checklist](#14-google-ads-conversion-audit-checklist)
15. [Phase 2: Cloudflare Turnstile Integration](#15-phase-2-cloudflare-turnstile-integration)
16. [Assumptions & Limitations](#16-assumptions--limitations)

---

## 1. Architecture Overview

```
Visitor Browser (Next.js App Router)
   │
   ├─► components/AdTracker.tsx (Client Component)
   │     ├─ Visit Identification (crypto.randomUUID, sessionStorage)
   │     ├─ SHA-256 Browser Fingerprint (Excludes User-Agent)
   │     ├─ Bot Signals (navigator.webdriver, software WebGL, missing languages)
   │     ├─ Behaviour Tracking (Counts only: clicks, pointer moves, scroll depth)
   │     └─ Beacon Dispatch (navigator.sendBeacon with text/plain, 10s snapshots)
   │
   ▼
Cloudflare CDN / Proxy (Free Plan)
   │  Injects: CF-Connecting-IP, CF-IPCountry, CF-Timezone
   ▼
Express Backend (Node.js)
   │
   ├─► middlewares/brandDetection.js (Resolves Pennyscroll / SpecReveal / Blogzenix / Trendfiltered)
   │
   ├─► routes/adVisitRoutes.js (POST /api/ad-visit)
   │     ├─ Rate Limiting (60 req/min per IP via express-rate-limit)
   │     ├─ Strict CORS (Whitelisted brand domains only, NO '*')
   │     ├─ Text Parser (20KB limit for text/plain JSON)
   │     └─ Own IP Exclusion (Exempts OWN_IPS)
   │
   ├─► controllers/adVisitController.js
   │     ├─ Input Whitelisting & MongoDB Injection Prevention
   │     ├─ Traffic Classifier (Google Ads, Google Organic, Bing, Social, Direct, etc.)
   │     ├─ Fraud Scoring Engine (10 configurable weights)
   │     └─ Rotating Proxy Cluster Analysis (Past 24 hours, same fpHash across 4+ IPs)
   │
   ▼
MongoDB (Mongoose Tenant Model)
   │  advisits collection (60-day automatic TTL index)
   ▼
Evidence Reporting
   └─► scripts/exportSuspicious.js
         ├─ out/suspicious-ips.csv
         ├─ out/device-clusters.csv
         └─ out/suspicious-gclids.csv
```

---

## 2. Multi-Brand & Multi-Website Support

Your repository hosts multiple websites within a unified codebase:
- **Penny Scroll** (`pennyscroll.com`)
- **SpecReveal** (`specreveal.com`)
- **BlogZenix** (`blogzenix.com`)
- **TrendFiltered** (`trendfiltered.com`)

### How Multi-Brand Works in this System:
1. **Frontend**: `AdTracker.tsx` automatically resolves the current brand using the Next.js `useBrand()` context or active domain hostname. It includes `brandId` in every beacon and sets the `x-brand-id` request header.
2. **Backend**: The `brandDetection` middleware automatically routes the request to that brand's dedicated tenant database connection (`req.models.AdVisit`).
3. **Data Tagging**: Every record in MongoDB is tagged with `brandId`.
4. **CSV Exporting**: `scripts/exportSuspicious.js` supports an optional `[brandId]` argument to generate reports for a specific brand or all brands combined.

---

## 3. Installation & Setup

All required packages use existing dependencies (`express`, `express-rate-limit`, `mongoose`, `dotenv`, `jest`). No paid dependencies are introduced.

### Install dependencies (if setting up fresh):
```bash
# In Backend
cd Backend
npm install express express-rate-limit mongoose dotenv axios

# In Frontend
cd ../Frontend
npm install
```

---

## 4. Environment Variables

### Backend (`Backend/.env`)
```ini
# Primary or Brand-Specific MongoDB URIs
MONGO_URI=mongodb+srv://user:pass@cluster0.mongodb.net/penny_scroll?retryWrites=true&w=majority
PENNYSCROLL_MONGO_URI=mongodb+srv://user:pass@cluster0.mongodb.net/penny_scroll?retryWrites=true&w=majority
SPECREVEAL_MONGO_URI=mongodb+srv://user:pass@cluster0.mongodb.net/specreveal?retryWrites=true&w=majority

# Target geography for ad campaign (default: US)
TARGET_COUNTRY=US

# Owner & Internal Testing IPs (Comma-separated list to exempt from scoring and evidence collection)
OWN_IPS=127.0.0.1,192.168.1.100

# Trusted reverse proxy configuration (Cloudflare)
TRUST_PROXY=1
TRUSTED_PROXY_CONFIGURATION=cloudflare

# Phase 2: Cloudflare Turnstile (Disabled by default)
ENABLE_TURNSTILE=false
TURNSTILE_SECRET_KEY=
TURNSTILE_SITE_KEY=
```

### Frontend (`Frontend/.env`)
```ini
NEXT_PUBLIC_TRACK_URL=http://localhost:5000/api/ad-visit
NEXT_PUBLIC_TARGET_COUNTRY=US
NEXT_PUBLIC_APP_BRAND_ID=pennyscroll

# Phase 2: Cloudflare Turnstile (Disabled by default)
NEXT_PUBLIC_ENABLE_TURNSTILE=false
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

---

## 5. Frontend Component Integration

The tracking component is already integrated into `Frontend/src/app/layout.tsx` inside `<Providers>`:

```tsx
import AdTracker from '@/components/AdTracker';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const brand = await getBrandConfig();

  return (
    <html lang="en">
      <body>
        <Providers initialToken={initialToken} brand={brand}>
          {/* Website-Wide Ad Click Fraud Detection & Evidence Collection */}
          <React.Suspense fallback={null}>
            <AdTracker brandId={brand.brandId} />
          </React.Suspense>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### Features of `AdTracker.tsx`:
- **Tracks all traffic**: Tracks visitors whether they arrived with `gad_source=1`, GCLID, UTM tags, organic search, or direct.
- **Fingerprinting**: Computes a SHA-256 hash using canvas rendering, WebGL vendor/renderer, device memory, CPU cores, screen geometry, pixel ratio, timezone, platform, and touch support. **User-Agent is intentionally excluded from the hash** to allow matching across changing UA strings.
- **Privacy Safe**: Never collects keystrokes, form text, or sensitive inputs. Only event counts (`pointerMoves`, `scrollEvents`, `clicks`, `keyPresses`, `visibleTimeMs`).
- **Zero Render Blocking**: Dispatches via `navigator.sendBeacon` with `text/plain` on load, on 10s intervals, and on `pagehide` / `visibilitychange`.

---

## 6. Backend Route Mounting

The route is mounted in `Backend/app.js`:

```javascript
const adVisitRoutes = require('./routes/adVisitRoutes');

// Brand Detection attaches req.brand, req.db, and req.models
app.use(brandDetection);

// Mounted before generic body parsers to handle text/plain beacons and strict CORS
app.use('/api/ad-visit', adVisitRoutes);
```

### Protection & Security:
- **Strict CORS**: Only accepts requests originating from whitelisted brand domains (`pennyscroll.com`, `specreveal.com`, etc.). Wildcard `*` is explicitly disabled.
- **Rate Limiting**: 60 requests per minute per IP.
- **Safe Text Parser**: Accepts `text/plain` or `application/json` with a 20KB cap.
- **Input Sanitization**: Rejects keys starting with `$`, strictly enforces string length bounds, and never trusts client-supplied IP or server headers.

---

## 7. Privacy & Consent Integration

Data protection regulations (GDPR, UK-GDPR, ePrivacy Directive) treat IP addresses and browser fingerprints as pseudonymous personal data.

### Built-in Hook: `hooks/useConsent.ts`
- **UK / EU Visitors**: Defaults to waiting for consent before enabling fingerprinting and behavioral tracking.
- **US / Non-EU Visitors**: Defaults to active tracking unless explicitly opted out.
- **Banner Integration**: Listens to standard custom events:
  ```javascript
  // When user clicks 'Accept' on your cookie banner:
  window.dispatchEvent(new CustomEvent('consentGranted'));

  // When user clicks 'Reject':
  window.dispatchEvent(new CustomEvent('consentRevoked'));
  ```

---

## 8. Fraud Scoring Engine & Rules

All weights are centralized in `Backend/utils/fraudScorer.js`:

| Signal | Points | Condition |
|---|---:|---|
| `navigator.webdriver` | +4 | Browser automation tool detected |
| `Headless User-Agent` | +4 | HeadlessChrome, Puppeteer, Playwright patterns |
| `Software WebGL` | +2 | SwiftShader, llvmpipe, Mesa soft-rasterizer |
| `No browser languages` | +2 | `navigator.languages` is empty or missing |
| `Country mismatch` | +1 | Country differs from `TARGET_COUNTRY` (Weak signal) |
| `Timezone mismatch` | +1 | Client timezone differs from Cloudflare timezone (Weak signal) |
| `No interaction after end` | +2 | 0 clicks, 0 moves, 0 scrolls after session end |
| `Active visible time < 2s` | +2 | Active visible duration under 2000ms |
| `Rotating proxy cluster` | +4 | Same `fpHash` across 4+ distinct IPs and 4+ identifiers in 24h |
| `GCLID reuse` | +3 | Identical GCLID claimed by a different `visitId` |

### Risk Categorization:
- **0 – 3**: `Low` (Normal human visitors)
- **4 – 6**: `Medium` (Unusual environment or multiple weak signals; monitor closely)
- **7+**: `High` (Confirmed automated bot, rotating proxy, or strong fraud indicators)

---

## 9. Running Scoring Tests

Comprehensive unit tests cover all 15 required test specifications:

```bash
cd Backend
npm test
```

### Tested Scenarios:
1. Normal browser, normal behaviour = Low risk
2. `WebDriver` = +4
3. `Headless` browser = +4
4. `Software WebGL` = +2
5. Missing languages = +2
6. Country mismatch = +1
7. No interaction after session end = +2
8. Active visible time < 2s = +2
9. Same fingerprint across 4+ IPs & qualifying identifiers = +4
10. Same GCLID used by different visit = +3
11. Duplicate beacons do not double-count scores
12. Multiple weak signals produce correct cumulative score
13. Consent denied disables tracking
14. Visitors without GCLID (e.g. `gad_source=1`) are fully tracked
15. Traffic classification functions independently from fraud scoring

---

## 10. Weekly CSV Evidence Export

Run the export script from the `Backend` directory:

```bash
node scripts/exportSuspicious.js <days=7> <minScore=7> [brandId]
```

### Examples:
```bash
# Export past 7 days with score >= 7 across all brands
node scripts/exportSuspicious.js 7 7

# Export past 14 days for Penny Scroll specifically
node scripts/exportSuspicious.js 14 7 pennyscroll

# Export past 30 days for SpecReveal
node scripts/exportSuspicious.js 30 7 specreveal
```

Files are generated inside `Backend/out/`:
- `Backend/out/suspicious-ips.csv`
- `Backend/out/device-clusters.csv`
- `Backend/out/suspicious-gclids.csv`

---

## 11. How to Read the 3 CSV Reports

### File 1: `suspicious-ips.csv`
Aggregates high-risk activity grouped by IP address.
- **`ip`**: The client IP address observed by Cloudflare.
- **`hits`**: Number of suspicious sessions originating from this IP.
- **`maxScore`**: Highest fraud score assigned to this IP.
- **`country`**: Two-letter ISO country code.
- **`asn`**: Autonomous System Number (identifies data centres vs residential ISPs).
- **`reasons`**: Forensic list of detected signals (e.g., `navigator.webdriver; Active visible time under 2s`).
- **`first` / `last`**: Timestamps of first and most recent visits.
- **`trafficSource`**: Primary acquisition channel (`Google Ads`, `Google Organic`, etc.).

### File 2: `device-clusters.csv`
Identifies **potential rotating residential proxy traffic** where the same device fingerprint appears across **5 or more distinct IP addresses**.
- **`fpHash`**: SHA-256 fingerprint hash of the browser hardware and graphics stack.
- **`visits`**: Total sessions associated with this fingerprint.
- **`distinctIPs`**: Count of distinct IP addresses used by this fingerprint.
- **`distinctGclids`**: Count of distinct Google Ads click identifiers associated with this fingerprint.
- **`avgScore`**: Average fraud score across all sessions.
- **`countries`**: List of countries reported by Cloudflare.
- **`trafficSources`**: Traffic channels involved.

> **Investigative Caution:** Fingerprint collisions can occur on common mobile or desktop devices. Do not treat clusters as conclusive proof of fraud without corroborating behavioral and network evidence.

### File 3: `suspicious-gclids.csv`
Contains high-risk sessions that included a valid Google Ads `gclid`.
- **`time`**: Exact timestamp of the visit.
- **`gclid`**: The Google Click Identifier.
- **`ip`**: Originating IP address.
- **`country`**: Country of visitor.
- **`score`**: Assigned fraud score (7+).
- **`reasons`**: Triggered fraud signals.
- **`kw`**: Keyword from Google Ads ValueTrack.
- **`network`**: Search network (`g` = Search, `d` = Display, `s` = Search Partner).
- **`device`**: Device type (`m` = Mobile, `c` = Computer, `t` = Tablet).

---

## 12. Google Ads IP Exclusions Guide

### How to Manually Exclude IPs in Google Ads:
1. Log in to your **Google Ads** dashboard.
2. Select your Campaign (e.g. `Growi US 1`).
3. In the left-hand menu, navigate to **Settings** → **Additional settings**.
4. Click on **IP exclusions**.
5. Paste the confirmed suspicious IP addresses (one per line).
6. Click **Save**.

### Crucial Safety Rules:
- **500 IP Exclusion Limit**: Google Ads enforces a strict maximum limit of **500 IP exclusions per campaign**. Do not add single-visit IPs randomly. Reserve exclusions for repeat offenders with high hit counts and confirmed automated signals (`navigator.webdriver`, headless UA).
- **Never Automatically Block or Exclude**: Scores of 7+ indicate strong suspicion, but false positives happen (e.g. shared university or office NATs). Always review the reasons and hit volume manually before excluding.
- **Monitor Monitor Only**: Never redirect or block users on the site during Phase 1.

---

## 13. Google Ads Invalid Activity Refund Investigation

When submitting an Invalid Click Activity Investigation request to Google Ads:

1. **Open Google Ads Invalid Clicks Form**:
   Access Google Ads Help → Contact Us → Submit an Invalid Clicks Investigation.
2. **Attach Supporting Evidence**:
   - Provide `suspicious-gclids.csv` for clicks where GCLID was present.
   - For visits where GCLID was disabled (`gad_source=1`): provide `suspicious-ips.csv` with timestamps, hit frequencies, keyword/campaign parameters, and behavioral proof (e.g., automated browser signals, 0ms visible interaction).
3. **Key Clarity for Google**:
   State clearly that GCLID was disabled, so timestamps, IPs, and ValueTrack parameters represent the primary correlation evidence.

---

## 14. Google Ads Conversion Audit Checklist

### Why Google Ads Sometimes Reports More Conversions Than Clicks:
Example scenario: **129 Clicks and 130 Conversions**.
This is a common tracking misconfiguration and is **NOT automatically proof of click fraud**.

Use this audit checklist to inspect and fix conversion tracking:

#### 1. Primary vs Secondary Conversion Actions
- In Google Ads, navigate to **Goals** → **Conversions** → **Summary**.
- Check if multiple actions are marked as **Primary**. Primary actions are counted in your main "Conversions" column. If page views, "Add to Cart", and "Purchase" are all Primary, one click can easily yield 3+ conversions.
- **Fix**: Set only the ultimate objective (e.g., completed purchase) as Primary. Set intermediate funnel steps to **Secondary** (observation only).

#### 2. Count Setting: "One" vs "Every"
- In conversion action settings, check the **Count** configuration.
- **"Every"**: Counts every conversion after a click (recommended for sales/orders).
- **"One"**: Counts only one conversion per click (recommended for leads/signups).
- **Fix**: If a visitor submits a lead form or reloads a page twice, "Every" counts 2 conversions for 1 click. Switch lead actions to "One".

#### 3. Duplicate Conversion Tracking Tags
- Check if you are tracking conversions via **both**:
  - Google Analytics 4 (GA4) imported conversion, **AND**
  - Google Ads Native Conversion Tag (gtag.js / GTM).
- If both are set as Primary, Google Ads counts every single purchase twice!
- **Fix**: Choose one method as Primary (prefer native Google Ads tag with Enhanced Conversions) and mark the GA4 import as Secondary.

#### 4. Duplicate Google Tag Manager (GTM) Triggers
- Check if your GTM container has multiple triggers firing on the thank-you/order confirmation page.
- Common issue: A "DOM Ready" trigger AND a "Custom Event (purchase)" trigger both firing the conversion tag.

#### 5. Thank-You Page Reloads
- When a user refreshes the confirmation page (`/order-success`) or re-opens their browser tab on mobile days later, the conversion script fires again without a new ad click.
- **Fix**: Always pass a unique `transaction_id` (Order ID) in the conversion tag:
  ```javascript
  gtag('event', 'conversion', {
      'send_to': 'AW-XXXXXXXXX/YYYYYYYY',
      'value': 49.99,
      'currency': 'USD',
      'transaction_id': orderId // Crucial: Google deduplicates identical transaction IDs!
  });
  ```

#### 6. Enhanced Conversions Deduplication
- Ensure Enhanced Conversions has customer email/phone hashed with SHA-256 and matched with `transaction_id`.

#### 7. Attribution & Reporting Date Differences
- Google Ads attributes conversions to the **day of the ad click**, not the day of the conversion.
- Cross-device conversions and view-through conversions can also record conversions without an immediate direct click.

---

## 15. Phase 2: Cloudflare Turnstile Integration

Cloudflare Turnstile is an invisible, privacy-first CAPTCHA replacement with a generous 100% free tier.

- **Status**: Disabled by default (`ENABLE_TURNSTILE=false`).
- **Files**:
  - Client component: `Frontend/src/components/TurnstileVerification.tsx`
  - Server verifier: `Backend/utils/verifyTurnstile.js`
- **When to enable**:
  Enable only after monitoring establishes baseline risk. When enabled, only present challenges to **High-risk** visitors prior to sensitive actions (e.g., checkout/coupon reveal), never on general page entry.

---

## 16. Assumptions & Limitations

1. **Free Cloudflare Plan**: Cloudflare Free passes `CF-Connecting-IP` and `CF-IPCountry`. `CF-Timezone` and `X-Client-ASN` are captured when Cloudflare provides them, with safe fallbacks.
2. **GCLID Absence**: When GCLID is disabled, Google Ads clicks cannot be individually matched to specific billing entries with 100% certainty. The system uses `gad_source`, campaign parameters, ValueTrack, and precise timestamps as proxy evidence.
3. **No Automatic Blocking**: Automated blocking of IPs or fingerprints carries a high risk of false positives. Phase 1 adheres strictly to monitoring and evidence gathering.
4. **Fingerprint Collisions**: Standard consumer devices (e.g. standard iPhone or Windows laptop) have identical hardware and canvas signatures. A shared fingerprint alone is not conclusive evidence of fraud.

