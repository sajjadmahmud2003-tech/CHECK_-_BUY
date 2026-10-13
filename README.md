# LandCheck AI (ল্যান্ডচেক এআই)
### Smart Land Verification & Pre-Purchase Risk Assessment Platform (Bangladesh)
**Landtech Innovation Hackathon 2026 • Problem Statement P5: "Check Before You Buy"**

---

## 1. Project Overview

**LandCheck AI** is a citizen-first GovTech decision support web application built to empower prospective property buyers in Bangladesh. Land transactions in Bangladesh are historically vulnerable to fraud, duplicate deeds (একই জমির একাধিক দলিল), area mismatches between survey epochs, broken chains of title (বায়া দলিলের বিচ্ছিন্নতা), unapproved or missing mutations (নামজারি/খারিজের গড়মিল), and legal caveats.

LandCheck AI provides a transparent, deterministic screening engine that reconstructs historical survey chains (**CS → SA → RS → BS / City Survey**), evaluates mutation and Land Development Tax records, extracts deed text using OCR, calculates explainable risk scores, and generates official downloadable PDF verification dossiers with bilingual guidance in **বাংলা** and **English**.

> **Important GovTech Disclaimer:** LandCheck AI operates in **Demo & Sample Data Mode** for hackathon evaluation and citizen awareness. All records are realistic but fictional to protect citizen privacy. LandCheck AI is a decision-support pre-screening tool and does not claim to replace certified lawyer title searches or official judicial decrees.

---

## 2. Key Features

- **Mandatory Bilingual Support (বাংলা | English):**
  - Instant toggle in navbar with zero page reload.
  - Persistent language preference stored in `localStorage`.
  - Comprehensive translation of all navigation, forms, error states, survey matrices, and reports.
  - Native Bangla Unicode numeral support (`০-৯`) and localized date formatting.
- **Historical Survey Chain Continuity Matrix:**
  - Compares plot records chronologically across Cadastral Survey (**CS ~1940**), State Acquisition (**SA ~1962**), Revisional Survey (**RS ~1980**), and Bangladesh Survey (**BS ~2010 / City Survey**).
  - Automatically identifies area shrinkages, sudden plot inflations, or missing volume links.
- **Deterministic Rule-Based Risk Engine:**
  - 7 transparent screening rules:
    1. `RULE-OWN-01`: Conflicting ownership claims or contested heirs.
    2. `RULE-AREA-02`: Significant area variance across historical surveys.
    3. `RULE-CHAIN-03`: Missing or torn link in historical survey chain.
    4. `RULE-MUT-04 / 05 / 06`: Unregistered, rejected, or inconsistent AC Land Mutation (নামজারি).
    5. `RULE-DISPUTE-07`: Government acquisition easement or civil court injunction (স্থিতাবস্থা).
    6. `RULE-TAX-08`: Overdue Land Development Tax (ভূমি উন্নয়ন কর / খাজনা).
  - Risk categorization into **Low Concern (স্বল্প ঝুঁকি)**, **Needs Review (সতর্কতা)**, and **High Priority Review (উচ্চ ঝুঁকি)** with concrete citizen next steps.
- **Document Upload & OCR Extractor:**
  - Upload scanned Deeds (সাফ-কবলা দলিল), Khatians (পর্চা), or DCR receipts (JPEG, PNG, PDF).
  - Regex pattern matching for Dag numbers, Khatian numbers, Mouza, Area, and Owner names.
  - Side-by-side interactive review for citizens to verify and correct OCR extractions before cross-referencing against the registry.
- **Official Downloadable PDF Verification Dossier:**
  - Generates a branded GovTech verification report with a unique Verification ID, QR code badge, survey comparison table, risk breakdown, and buyer checklist.
  - Dedicated print layout (`window.print()`).
- **Citizen Dashboard & Admin Console:**
  - Citizen metrics: Total queries, completed screenings, risk alerts, and recent documents.
  - Role-Based Access Control: Citizen, Land Officer, and Administrator.
  - Admin panel with real-time audit logs, simulated record manager, and OCR queue inspection.
  - **One-Click Quick Persona Switcher:** Allows hackathon judges to effortlessly evaluate Citizen and Admin personas with a single click.

---

## 3. Technology Stack

- **Framework:** Next.js 16 (App Router, Turbopack, React 19, TypeScript)
- **Styling:** Tailwind CSS (GovTech forest green & emerald palette, accessible slate contrast)
- **Icons:** Lucide React
- **Forms & Validation:** Zod
- **OCR Engine:** Tesseract.js & client text parser with Bengali land heuristics
- **PDF Generation:** jsPDF with high-fidelity printable layouts
- **Database & Auth:** Supabase PostgreSQL with Row Level Security (RLS) policies + zero-configuration in-memory/local fallback for instantaneous testing
- **Testing:** Vitest (100% pass rate on unit tests for risk engine, localization, and search)

---

## 4. Local Installation & Setup

### Prerequisites
- Node.js 18.x, 20.x, or 24.x
- npm or pnpm

### Step 1: Clone or Navigate to Directory
```bash
cd D:/CHECK_&_BUY
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 4: Run Automated Tests
```bash
npm test
```

---

## 5. Supabase Configuration (Optional)

The application comes preconfigured with a high-fidelity local data repository so it **works 100% out of the box without any external API keys**.

To connect a live Supabase project:
1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
3. Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
4. Run the SQL migration in the Supabase SQL Editor:
   - Apply `supabase/migrations/001_initial_schema.sql` (Creates tables, indexes, RLS policies).
   - Apply `supabase/seed.sql` (Seeds demo records).

---

## 6. Demo Test Cases for Hackathon Judges

You can test these preloaded scenarios using the search bar or preset chips:

| Scenario | Location | Dag No | Khatian | Outcome & Findings |
|---|---|---|---|---|
| **Clean Consistent Case** | Dhanmondi, Dhaka | `405` | `108` | **Low Concern (10/100)**: Unbroken CS-SA-RS-BS continuity, approved mutation, zero disputes. |
| **Area Discrepancy Case** | Gulshan, Dhaka | `1204` | `542` | **Needs Review (50/100)**: RS recorded 12 dec, BS recorded 16.8 dec (+40% unexplained increase). |
| **Conflicting Title & Rejected Mutation** | Uttara, Dhaka | `870` | `319` | **High Priority Review (80/100)**: Multiple claimants, mutation rejected due to court injunction. |
| **Broken Survey Chain** | Panchlaish, Chattogram | `310` | `620` | **Needs Review (45/100)**: RS record missing from district archive, mutation pending. |
| **Government Easement Caveat** | Mirpur, Dhaka | `1540` | `812` | **High Priority Review (75/100)**: Acquisition easement buffer for highway widening. |

---

## 7. Deployment to Vercel

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete LandCheck AI platform"
   git push origin main
   ```
2. Import the project into [Vercel](https://vercel.com).
3. Set environment variables (or leave default for demo mode).
4. Deploy! Vercel automatically runs `npm run build` and serves the application globally on edge networks.

---

## 8. License

This project is licensed under the **MIT License**. See the [LICENSE](file:///d:/CHECK_&_BUY/LICENSE) file for details.
