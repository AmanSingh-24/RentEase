# 🏠 RentEase — The Digital Witness for Rentals

> **Built to solve a ₹30,000 real-world problem.** A mobile-first Progressive Web App (PWA) that eliminates rental deposit disputes through cryptographic evidence, automated KYC, digital contract signing, and transparent fintech workflows.

[![Live App](https://img.shields.io/badge/Live-rent--ease.vercel.app-0052CC?style=for-the-badge&logo=vercel)](https://rentease-five-teal.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payment_Gateway-0052CC?style=for-the-badge)](https://razorpay.com/)

---

## 💡 The Origin Story

During my 3rd semester break, I witnessed a neighbor lose their entire ₹30,000 security deposit in a rental dispute. The landlord claimed damages; the tenant insisted the damage was pre-existing. **Neither had proof.**

That loss happened because rentals operate on trust — but trust breaks when there's no shared, verifiable record of truth.

**RentEase was born** to act as a neutral "Digital Witness". What started in **Phase 1** as a PWA management tool has now evolved in **Phase 2 (V2)** into a complete **PropTech Ecosystem** bridging Public Marketplace Discovery, Verified Onboarding, Escrow Payments, HTML5 Legal Signatures, and Production Deployment.

---

## 🚀 Evolution: Phase 1 vs. Phase 2 (V2)

```
┌──────────────────────────────────────────────┐
│  Phase 1 (The Foundation)                     │
│  - Property Management CRUD                  │
│  - Move-in / Move-out Webcam Inspection      │
│  - Basic Maintenance & Rent Tracking         │
│  - Residency Vault Archive                   │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  Phase 2 (V2 — Full PropTech Ecosystem) 🌟   │
│  - 🏘️ Public Marketplace & Filter Engine      │
│  - 💳 Razorpay Gateway & Instant Invoicing   │
│  - 🖊️ HTML5 Canvas Digital Lease Signing     │
│  - 🔐 Multi-Tier KYC Role State Machine      │
│  - 👑 Admin Verification Control Center      │
│  - 🤖 Maintenance Triage Algorithm (<₹500)   │
│  - 🚀 Production Deployment on Vercel        │
└──────────────────────────────────────────────┘
```

---

## 🎯 What RentEase Does Today (V2)

RentEase connects tenants, landlords, and administrators in an automated, secure rental journey:

### For Tenants 👤
- 🔍 **Public Marketplace Discovery**: High-speed filtering by BHK count, furnishing, pet policies, price, and floor height.
- 💳 **Escrow Move-in Payment**: Instant deposit & first-month rent payments integrated with Razorpay gateway.
- 🖊️ **Digital Lease Signing**: Touch/Mouse signature pad embedding cryptographic audit trails into the rental agreement.
- 📸 **Digital Witness Move-in Audit**: Room-by-room blueprint photo audit requiring evidence before dashboard access.
- 🔧 **Self-Fix Reimbursement Vault**: Automatic triage allowing tenants to resolve minor repairs (< ₹500) and request credits with GST/worker proof.

### For Landlords & Hosts 🏠
- 🏢 **7-Step Asset Onboarding**: Comprehensive listing wizard to register property structure, deposit rules, and upload KYC ID.
- 📊 **Portfolio Oversight**: Centralized dashboard tracking active tenancies, pending bookings, and financial yields.
- 🛡️ **Maintenance & Inspection Verification**: Review tenant-submitted inspection photos, verify repair proof, or assign professionals.
- 🤝 **Tenancy Approvals**: Final verification gate to confirm payment receipts and co-sign lease agreements.

### For Platform Admins 👑
- 🛡️ **Host KYC Control Center**: Inspect landlord applications, verify government IDs, and approve/reject host applications with reasons.
- 🌐 **Marketplace Moderation**: Live management of active marketplace listings.

---

## 🛠️ Complete Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Core Framework** | Next.js 16 (App Router + Turbopack) + TypeScript | Modern server-side rendering, API routes, and type safety |
| **Styling & Motion** | Tailwind CSS + Framer Motion | Dynamic animations, glassmorphism, and responsive UI |
| **Database** | MongoDB Atlas + Mongoose ODM | Compound index searching & complex relational data models |
| **Authentication** | JWT HTTP-Only Cookies + Firebase Auth (Google) | Secure dual auth with automated cookie token refresh |
| **Fintech & Payments** | Razorpay Payment Gateway API | Security deposit & rent payment processing with instant receipting |
| **Asset Storage** | Cloudinary CDN | Preserved metadata & optimized property image delivery |
| **Signatures & Visuals** | HTML5 Canvas API + Recharts | Touch-friendly digital signing & revenue analytics charts |
| **Deployment** | Vercel | Live production cloud deployment |

---

## 🔄 State Machine & Workflow Lifecycles

### 1. User Role State Machine
```
[Unboarded User] ──(Apply as Host)──► [Host Status: Pending] ──(Admin Verification)──► [Role: Owner / Host]
        │
 (Book Property)
        ▼
[Role: Pending] ──(Pay Deposit & Sign Lease)──► [Waiting Approval] ──(Owner Verify)──► [Role: Tenant]
```

### 2. Maintenance Triage Engine
```
Tenant Reports Fault ──► System Evaluates Est. Cost
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
      Cost ≤ ₹500                       Cost > ₹500
 (Tenant-Led Minor Fix)           (Owner-Led Professional Fix)
            │                                 │
  Fixes & Uploads Bill               Host Assigns Contractor
            │                                 │
   Owner Verifies & Credits            Work Verified & Completed
```

---

## 📁 Repository & File Structure Highlights

```
rentease/
├── app/
│   ├── page.tsx                    # Landing Page (Hero, Impact, Services, Management)
│   ├── login/                      # Login with Curvy Clip-Path & Google Auth (Suspense Wrapped)
│   ├── signup/                     # Signup with Curvy Clip-Path & Google Auth (Suspense Wrapped)
│   ├── properties/                 # Public Property Marketplace (Filters & Cards)
│   │   └── [id]/                   # Property Detail Page (3-Image Hero & CTA)
│   ├── onboarding/
│   │   └── landlord/               # 7-Step Landlord Asset & KYC Registration Wizard
│   ├── dashboard-owner/            # Host Dashboard (Properties, Applications, Maintenance, Exit)
│   ├── dashboard-tenant/           # Tenant Dashboard (Witness Audit, Ledger, Maintenance Vault)
│   ├── dashboard/
│   │   ├── onboarding-payment/     # Step 1: Tenant Escrow Deposit Payment (Razorpay)
│   │   ├── onboarding-rentals/     # Step 2: HTML5 Digital Lease Agreement Signing
│   │   └── onboarding-approvals/   # Step 3: Awaiting Owner Verification Screen
│   ├── admin/                      # Admin Control Center (Host KYC Verification)
│   └── api/                        # Next.js Serverless API Endpoints (40+ routes)
├── lib/
│   ├── mongodb.ts                  # Database Connection Pooling
│   ├── auth-helper.ts              # Session Cookie Authentication
│   └── firebase.ts                 # Firebase Client Initialization
└── models/                         # Mongoose Schemas (User, Property, Booking, Inspection, Maintenance, ExitProcess)
```

---

## ⚡ Getting Started Locally

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/AmanSingh-24/RentEase.git
cd rentease
npm install
```

### 2. Configure Local Environment (`.env.local`)
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_32_character_jwt_secret_key

CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to explore RentEase!

---

## 📚 Key Engineering Takeaways

1. **State Machine Security**: Preventing unauthorized dashboard access by guarding routes until both payment and legal contract signatures are verified by the owner.
2. **Next.js 16 Production Bundling**: Solving static prerender bailouts by wrapping dynamic client hooks (`useSearchParams`) inside `<Suspense>` boundaries.
3. **Database Performance**: Leveraging compound MongoDB indexes to execute fast full-text multi-filter queries across thousands of marketplace assets.
4. **Resilient Dual Auth**: Combining standard HTTP-only JWT cookies with Firebase Google OAuth for passwordless user entry.

---

## 🌐 Live Production Link

🔗 **[https://rentease-five-teal.vercel.app](https://rentease-five-teal.vercel.app)**

---

## 📧 Contact & Connect

**Aman Kumar Singh**  
📧 Email: amansighrajput9005@gmail.com  
🔗 LinkedIn: [Aman Kumar Singh](https://www.linkedin.com/in/aman-kumar-singh-be/)  
💻 GitHub: [AmanSingh-24](https://github.com/AmanSingh-24)

---

**Built with 💙 by a student developer turning real-life problems into production software.**
