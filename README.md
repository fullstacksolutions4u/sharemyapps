# 🚀 ShareMyApps

> **Where developers meet opportunity** — A full-stack developer community platform for showcasing projects, job placement, mentorship, freelancing, and AI-powered tools.

🌐 **Live:** [sharemyapps.in](https://sharemyapps.in)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture Flowchart](#architecture-flowchart)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

---

## Overview

ShareMyApps is a full-stack SaaS platform built for developers. It combines a developer portfolio showcase, job placement services, AI interview tools, a mentorship program, a community blog, quiz zone, freelance opportunities, and an admin management system — all in one platform.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose) |
| **Auth** | JWT (JSON Web Tokens) |
| **Payments** | Razorpay |
| **AI** | OpenAI GPT-4o |
| **Email** | Nodemailer / SMTP |
| **Storage** | Firebase Storage |
| **Hosting (Client)** | Firebase Hosting |
| **Hosting (Server)** | Google Cloud Run |
| **Containerization** | Docker |

---

## Architecture Flowchart

```mermaid
flowchart TD
    User([👤 User / Browser])
    Admin([🛡️ Admin])

    User -->|HTTPS| Firebase[Firebase Hosting\nReact + Vite SPA]
    Admin -->|HTTPS| Firebase

    Firebase -->|API Requests /api/*| Vite[Vite Dev Proxy\nlocalhost:3000]
    Vite -->|Forwards| CloudRun

    subgraph CloudRun[☁️ Google Cloud Run]
        Express[Node.js / Express Server]
        Express --> Auth[JWT Auth Middleware]
        Auth --> Routes

        subgraph Routes[API Routes]
            R1[/auth]
            R2[/users]
            R3[/projects]
            R4[/mentorship]
            R5[/vacancies]
            R6[/payments]
            R7[/admin]
            R8[/quiz]
            R9[/ai]
            R10[/plans]
            R11[/community]
            R12[/freelance]
        end

        Routes --> Controllers[Controllers]
        Controllers --> Models[Mongoose Models]
    end

    Models -->|Read / Write| MongoDB[(🍃 MongoDB Atlas)]

    Controllers --> OpenAI[🤖 OpenAI GPT-4o\nAI Interview + JD Analysis]
    Controllers --> Razorpay[💳 Razorpay\nPayments]
    Controllers --> Email[📧 Email Service\nSMTP / Nodemailer]
    Controllers --> FirebaseStorage[🗂️ Firebase Storage\nFile Uploads]

    subgraph Frontend Pages
        P1[🏠 Home]
        P2[👤 Profile / Portfolio]
        P3[📁 Projects]
        P4[🎓 Mentorship Program]
        P5[💼 Job Assistance Services]
        P6[🤖 AI Interview Screening]
        P7[📰 Community Blog]
        P8[🧠 Quiz Zone]
        P9[🔔 Job Alerts]
        P10[💬 Messages]
        P11[🛡️ Admin Panel]
    end

    Firebase --> P1 & P2 & P3 & P4 & P5 & P6 & P7 & P8 & P9 & P10 & P11
```

---

## Project Structure

```
sharemyapps/
├── client/                     # React Frontend (Vite)
│   └── src/
│       ├── components/         # Reusable UI components (Navbar, Footer, etc.)
│       ├── pages/              # Page-level components
│       │   ├── admin/          # Admin panel sections
│       │   ├── MentorshipProgram.jsx
│       │   ├── Vacancies.jsx
│       │   ├── LearningTracker.jsx
│       │   └── ...
│       ├── context/            # React Context (Auth, etc.)
│       ├── api/                # Axios instance
│       └── utils/              # Utility helpers
│
├── server/                     # Node.js Backend (Express)
│   ├── controllers/            # Business logic
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # Express route definitions
│   ├── middleware/             # Auth, error handling
│   ├── utils/                  # Email, helpers
│   ├── cron/                   # Scheduled jobs
│   ├── jobs/                   # Background jobs
│   ├── Dockerfile              # Docker config for Cloud Run
│   └── index.js                # Express entry point
│
├── docs/                       # Documentation
├── firebase.json               # Firebase hosting config
└── README.md
```

---

## Key Features

| Feature | Description |
|---|---|
| 🗂️ **Project Showcase** | Developers share and showcase their projects publicly |
| 👤 **Developer Portfolios** | Auto-generated public portfolio pages |
| 🎓 **Mentorship Program** | 8-month structured mentorship with 30 modules, placement support |
| 💼 **Job Assistance Services** | Paid placement service with resume & referral support |
| 🤖 **AI Interview Screening** | AI-powered mock interviews with feedback |
| 🧠 **AI JD Analysis** | Analyse job descriptions with OpenAI |
| 🧩 **Quiz Zone** | Leaderboard-based developer quiz platform |
| 📰 **Community Blog** | Developer blog / feed with likes, comments, shares |
| 🔔 **Job Alerts** | Curated job link notifications |
| 💳 **Payments** | Razorpay integration for plan purchases |
| 🛡️ **Admin Panel** | Full admin dashboard for users, projects, applications, payments |
| 📧 **Email System** | Automated & bulk email with custom templates |
| 🔗 **Freelance Opportunities** | Community-posted freelance project listings |

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas connection string
- Razorpay API keys
- OpenAI API key
- Firebase project

### 1. Clone the repository
```bash
git clone https://github.com/your-org/sharemyapps.git
cd sharemyapps
```

### 2. Setup the Server
```bash
cd server
cp ../.env.example .env
# Fill in your values in .env
npm install
npm run dev
```

### 3. Setup the Client
```bash
cd client
npm install
npm run dev
```

The client runs on `http://localhost:3000` and proxies API requests to the server at `http://localhost:5000`.

---

## Environment Variables

Copy `.env.example` to `server/.env` and fill in:

```env
MONGO_URI=             # MongoDB Atlas connection string
JWT_SECRET=            # Secret key for JWT signing
RAZORPAY_KEY_ID=       # Razorpay Key ID
RAZORPAY_KEY_SECRET=   # Razorpay Key Secret
OPENAI_API_KEY=        # OpenAI API key
EMAIL_HOST=            # SMTP host
EMAIL_USER=            # SMTP email
EMAIL_PASS=            # SMTP password
FIREBASE_*=            # Firebase config for storage
```

---

## Deployment

| Component | Platform |
|---|---|
| **Frontend** | Firebase Hosting (`firebase deploy`) |
| **Backend** | Google Cloud Run (Docker container) |
| **Database** | MongoDB Atlas |
| **Files** | Firebase Storage |

### Deploy Backend to Cloud Run
```bash
cd server
docker build -t sharemyapps-server .
gcloud run deploy sharemyapps-server --source .
```

### Deploy Frontend to Firebase
```bash
cd client
npm run build
firebase deploy
```

---

## License

© 2024 ShareMyApps. All rights reserved.
