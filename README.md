# 🎙️ Converso — Voice-First AI SaaS Platform for Interactive & Accessible Learning

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=for-the-badge&logo=clerk)](https://clerk.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Vapi AI](https://img.shields.io/badge/Voice_AI-Vapi-5B51D8?style=for-the-badge)](https://vapi.ai/)
[![Razorpay](https://img.shields.io/badge/Payments-Razorpay-0C2340?style=for-the-badge&logo=razorpay)](https://razorpay.com/)
[![Sentry](https://img.shields.io/badge/Monitoring-Sentry-362D59?style=for-the-badge&logo=sentry)](https://sentry.io/)

**Converso** is a full-stack, production-grade AI SaaS application designed to revolutionize online learning through voice-first interactive AI companions, real-time speech synthesis, dynamic visual whiteboards, and gamified RPG skill tree progression. Built with accessible design principles at its core, Converso caters to diverse learning styles and accessibility requirements (including ADHD, Dyslexia, and Visual/Auditory impairments).

---

## 📑 Table of Contents

- [✨ Key Features](#-key-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📂 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup (Supabase)](#database-setup-supabase)
  - [Running Locally](#running-locally)
- [🎮 Core Workflows & Features](#-core-workflows--features)
  - [Voice Companions & Real-Time Engine](#1-voice-companions--real-time-engine)
  - [Interactive Whiteboard & Mermaid Diagrams](#2-interactive-whiteboard--mermaid-diagrams)
  - [Gamified RPG Skill Tree](#3-gamified-rpg-skill-tree)
  - [Accessibility & Disability Preferences](#4-accessibility--disability-preferences)
  - [SaaS Subscriptions & Razorpay](#5-saas-subscriptions--razorpay)
- [📜 Available Scripts](#-available-scripts)
- [🛡️ Telemetry & Monitoring](#️-telemetry--monitoring)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Key Features

- 🎙️ **Real-Time Voice AI Companions**: Low-latency, two-way conversational voice learning powered by Vapi AI Web SDK & custom voice synthesis models (casual, formal, male, female).
- 🎨 **Dynamic AI Whiteboard**: Live diagram rendering with Mermaid.js, mathematical formulas, structured code snippets, note-taking, and instant PDF lesson export.
- 🌳 **Gamified RPG Skill Tree**: Visual subject progress trees (Science, Math, Coding, Language, History, Economics) with level progression, unlocked nodes, and session milestones.
- ♿ **Adaptive Accessibility Support**: Customized interaction presets tuned for user-selected learning profiles (Blind/Low Vision, Deaf, Mute, Motor Impairments, ADHD, Dyslexia).
- 👤 **Custom Companion Builder**: User-generated AI companions tailored by topic, difficulty, target duration, teaching style, and voice persona.
- 💳 **Tiered SaaS Subscriptions**: Complete billing integration with Razorpay supporting Free, Pro, and Elite tiers with server-side entitlement checks.
- 🔐 **Secure Authentication & Management**: Clerk authentication integrated with Supabase RLS, companion bookmarking, session history, and duplicate prevention.
- 📊 **Full-Stack Monitoring**: Sentry exception tracking and performance tracing across Client, Server, and Edge runtime environments.

---

## 🛠️ Tech Stack

### **Frontend & Framework**
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Turbopack, React Server Components)
- **UI & Styling**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), Radix UI primitives, Lucide Icons, tw-animate-css
- **Animations**: Lottie React (animated audio soundwaves & voice visualizers)
- **Diagrams & PDF Export**: [Mermaid.js v11](https://mermaid.js.org/), [jsPDF](https://github.com/parallax/jsPDF)

### **AI & Voice Services**
- **Voice Agent Engine**: `@vapi-ai/web` SDK
- **Speech & Voice Models**: Vapi AI Assistant integration with custom voice model configuration

### **Backend, Auth & Database**
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL with Server SDK & Client RLS)
- **Authentication**: [Clerk](https://clerk.com/) (`@clerk/nextjs` v6)
- **Form Handling & Validation**: React Hook Form, Zod schema validation

### **Payments & Infrastructure**
- **Payment Gateway**: [Razorpay](https://razorpay.com/) Node SDK
- **Telemetry**: [Sentry](https://sentry.io/) (`@sentry/nextjs`)

---

## 📂 Project Structure

```
converso/
├── app/                        # Next.js App Router Pages & API Routes
│   ├── (auth)/                 # Clerk Auth pages (sign-in, sign-up)
│   ├── account/                # User account settings & profile management
│   ├── api/                    # Serverless API routes (subscriptions, sentry)
│   ├── companions/             # Companion discovery, creation & active voice session
│   │   ├── [id]/               # Active Voice Companion session & Whiteboard view
│   │   └── new/                # Create companion page & form
│   ├── create-order/           # Razorpay payment order initialization
│   ├── my-journey/             # User stats, lesson history & bookmarks
│   ├── select-disability/      # Accessibility preference setup page
│   ├── skill-tree/             # Gamified RPG Skill Tree (Elite tier)
│   ├── subscription/           # Pricing plans & billing dashboard
│   ├── update-subscription/    # Plan upgrades & downgrade management
│   ├── verify-payment/         # Razorpay webhooks / payment confirmation
│   ├── globals.css             # Design tokens, custom utilities & theme definitions
│   ├── layout.tsx              # Root Layout with ClerkProvider & Navbar
│   └── page.tsx                # Landing Showcase & Recent Companions Dashboard
├── components/                 # Reusable UI & Feature Components
│   ├── CompanionComponent.tsx  # Voice session interface, soundwave & transcript engine
│   ├── CompanionForm.tsx       # Companion creation form with voice selection
│   ├── SkillTree.tsx           # Interactive skill tree canvas & node unlock renderer
│   ├── Whiteboard.tsx          # Real-time whiteboard, Mermaid diagram & PDF exporter
│   ├── CompanionCard.tsx       # Companion showcase card
│   ├── CompanionsList.tsx      # Subject & recent session list view
│   ├── DisabilitySelector.tsx  # Accessibility mode selection dropdown
│   └── ui/                     # Radix UI primitives (Accordion, Select, Label, etc.)
├── constants/                  # Constant definitions (subjects, soundwaves, voices)
├── lib/                        # Server Actions & Utility Libraries
│   ├── actions/
│   │   └── companion.actions.ts # Server actions (Companions, Sessions, Bookmarks)
│   ├── razorpay.ts             # Razorpay API client initialization
│   ├── supabase.ts             # Supabase Client & Server client setup
│   ├── utils.ts                # Tailwind merge, assistant config & helper functions
│   └── vapi.sdk.ts             # Vapi Web SDK instance export
├── public/                     # Static media, icons & Lottie assets
├── middleware.ts               # Clerk Auth & route protection middleware
├── next.config.ts              # Next.js & Sentry bundler configuration
├── package.json                # Project dependencies & npm scripts
└── tsconfig.json               # TypeScript compiler config
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your development machine:
- **Node.js**: `v18.17.0` or higher
- **npm** (v9+) or **yarn** or **pnpm**
- **Git**

---

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Pratham-Parmar-37/converso.git
   cd converso
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

---

### Environment Variables

Create a `.env.local` file in the root directory and populate it with your service credentials:

```env
# -----------------------------------------------------------------------------
# SUPABASE CONFIGURATION
# -----------------------------------------------------------------------------
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# -----------------------------------------------------------------------------
# CLERK AUTHENTICATION CONFIGURATION
# -----------------------------------------------------------------------------
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# -----------------------------------------------------------------------------
# VAPI VOICE AI CONFIGURATION
# -----------------------------------------------------------------------------
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your-vapi-public-key
VAPI_PRIVATE_KEY=your-vapi-private-key
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your-vapi-assistant-id

# -----------------------------------------------------------------------------
# RAZORPAY PAYMENT GATEWAY
# -----------------------------------------------------------------------------
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# -----------------------------------------------------------------------------
# SENTRY TELEMETRY & ERROR MONITORING
# -----------------------------------------------------------------------------
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

> ⚠️ **Note**: Do not commit your `.env.local` file to version control.

---

### Database Setup (Supabase)

Execute the following SQL queries in your Supabase SQL Editor to initialize the required tables:

```sql
-- 1. Companions Table
CREATE TABLE public.companions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    voice TEXT NOT NULL,
    style TEXT NOT NULL,
    duration INTEGER DEFAULT 10,
    author TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. User Sessions Table
CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    companion_id UUID REFERENCES public.companions(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    duration INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Bookmarks Table
CREATE TABLE public.companion_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    companion_id UUID REFERENCES public.companions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, companion_id)
);

-- 4. User Accessibility / Disability Profiles Table
CREATE TABLE public.eduvoice_users (
    id TEXT PRIMARY KEY,
    email TEXT,
    disability_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

---

### Running Locally

Start the Next.js development server with Turbopack:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to explore Converso!

---

## 🎮 Core Workflows & Features

### 1. Voice Companions & Real-Time Engine
- **Voice Sessions**: Click **Start Call** on any companion to initiate a bidirectional voice channel via Vapi.
- **Dynamic Feedback**: Real-time animated Lottie audio soundwaves adjust to speech activity.
- **Transcripts**: Instant text transcript generation during active sessions.

### 2. Interactive Whiteboard & Mermaid Diagrams
- **Visual Whiteboard**: Accessible during voice calls, displaying diagrams generated in response to concepts explained by the companion.
- **Mermaid.js Rendering**: Converts structural logic into clean dark-themed visual flowcharts.
- **PDF Export**: Download session summaries and whiteboard items directly as a structured PDF document using `jspdf`.

### 3. Gamified RPG Skill Tree
- **Progress Tracking**: Accessible to Elite subscribers at `/skill-tree`.
- **Leveling**: Automatically calculates completed session quotas across subjects (Science, Math, Coding, Language, Economics, History) and visually unlocks node badges.

### 4. Accessibility & Disability Preferences
- Users can specify their preferred interaction style via `/select-disability`, adjusting voice controls and dashboard layouts to accommodate Blind/Low Vision, Deaf, Mute, or Motor needs.

### 5. SaaS Subscriptions & Razorpay
- Tiered subscription management (Free, Pro, Elite) powered by Razorpay checkout and verified with server-side HMAC signatures.

---

## 📜 Available Scripts

In the project directory, you can run:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Launches the Next.js development server with Turbopack (`--turbopack`) |
| `npm run build` | Builds the production bundle and compiles server routes |
| `npm run start` | Runs the compiled production server |
| `npm run lint` | Runs Next.js ESLint verification for code quality |

---

## 🛡️ Telemetry & Monitoring

Converso uses **Sentry** for enterprise-grade error tracking and performance profiling across:
- **Client Side**: `instrumentation-client.ts`
- **Server Side**: `sentry.server.config.ts`
- **Edge Runtime**: `sentry.edge.config.ts`

To test Sentry integration, navigate to `/sentry-example-page` in your local environment.

---

## 🤝 Contributing

Contributions are welcome! If you'd like to improve Converso:

1. Fork the Repository
2. Create a Feature Branch (`git checkout -b feature/amazing-feature`)
3. Commit your Changes (`git commit -m 'Add amazing feature'`)
4. Push to the Branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<p center align="center">
  Crafted with ❤️ by <a href="https://github.com/Pratham-Parmar-37">Pratham</a> & the Converso Team.
</p>
