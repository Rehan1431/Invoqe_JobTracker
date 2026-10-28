# Job Application Tracker (Invoqe Internship Task 3)

A complete, production-ready full-stack Job Application Tracker built with **React 18, Vite, TypeScript, Tailwind CSS**, **Node.js, Express.js**, and **PostgreSQL 18** (via `pg-pool`). Engineered natively for a Windows environment using **zero cloud APIs**, strictly **no ORMs** (raw parameterized SQL), and complete offline execution.

---

## 🌟 The 3 Unique Selling Propositions (USPs - 100% Local)

### 1. Offline ATS Keyword Scorer (Pure TypeScript TF-IDF Engine)
- **Zero Cloud APIs / 100% Offline**: Calculates a real-time "ATS Match Score" percentage without external dependencies or paid NLP APIs.
- **Sub-linear Term Frequency ($TF$) & Smoothed Inverse Document Frequency ($IDF$)**:
  $$TF(t, d) = 0.5 + 0.5 \times \frac{f(t, d)}{\max_{t' \in d} f(t', d)}$$
  $$IDF(t) = \ln\left(1 + \frac{N + 1}{DF(t) + 1}\right) + 1$$
- **Cosine Semantic Vector Similarity**: Computes cosine similarity between job requirements and candidate resume vectors:
  $$\text{CosineSim}(\vec{JD}, \vec{Resume}) = \frac{\sum (JD_i \times Resume_i)}{\|\vec{JD}\| \|\vec{Resume}\|}$$
- **Target Keyword Coverage & Extraction**: Extracts top job keywords, checks stemmed and raw matches, classifies keywords into **Matched** and **Missing**, and generates actionable resume optimization tips.

### 2. Local LLM Follow-Up Generator (Ollama Llama 3)
- **Direct Local Inference**: Connects directly to an offline Ollama instance at `http://127.0.0.1:11434/api/generate` with model `llama3`.
- **Structured Context-Aware Prompting**: Automatically compiles company, role, days elapsed, recruiter name, and interview notes into high-converting follow-up email drafts.
- **Tone Personalization**: Generates emails in **Professional**, **Enthusiastic**, **Direct**, or **Executive** tone.
- **Fail-Safe Offline Resilience**: If Ollama is offline or downloading models, gracefully switches to a high-quality deterministic local fallback engine with clear status diagnostics.

### 3. Stale Application Cron Monitor (node-cron Background Worker)
- **24-Hour Scheduled Sweeps**: Sweeps the PostgreSQL 18 database daily using `node-cron` (`0 0 * * *`).
- **Automated Inactivity Detection**: Scans for applications older than 14 days without an interview (`status = 'Pending'` and `applied_date <= NOW() - INTERVAL '14 days'`), sets `is_stale = TRUE`, and records `stale_flagged_at`.
- **Instant Manual Trigger**: On-demand sweep trigger (`POST /api/applications/sweep-stale`) integrated directly into the Kanban dashboard.

---

## 📂 Windows-Style Monorepo Directory Tree

```
D:\invoque\task3\
│   package.json                      # Monorepo orchestrator with concurrent scripts
│   start-windows.bat                 # One-click Windows Batch launcher
│   start-windows.ps1                 # Native Windows PowerShell runner script
│   README.md                         # Comprehensive architecture documentation
│
├── database\
│   └── init.sql                      # PostgreSQL 18 DDL schema (native UUID & TIMESTAMPTZ)
│
├── backend\
│   ├── package.json                  # Express, pg, node-cron, cors, tsx
│   ├── tsconfig.json                 # Strict CommonJS/NodeNext TypeScript configuration
│   ├── .env                          # Local PostgreSQL and Ollama credentials
│   ├── .env.example
│   └── src\
│       ├── server.ts                 # Express initialization, health checks, cron startup
│       ├── config\
│       │   ├── db.ts                 # pg.Pool configuration & raw parameterized query wrapper
│       │   └── env.ts                # Strict typed environment variable parser
│       ├── controllers\
│       │   ├── applications.controller.ts  # CRUD endpoints & manual cron sweep trigger
│       │   ├── ats.controller.ts           # Pure TS TF-IDF ATS scorer endpoint
│       │   └── ollama.controller.ts        # Ollama Llama 3 follow-up email generator
│       ├── cron\
│       │   └── staleMonitor.cron.ts  # 24h node-cron background sweep worker
│       ├── services\
│       │   ├── atsScorer.service.ts  # Pure TypeScript TF-IDF engine (Cosine Sim & Keywords)
│       │   ├── ollama.service.ts     # Offline Ollama HTTP client & fallback engine
│       │   └── applications.service.ts # Raw parameterized SQL queries (Strictly No ORM)
│       ├── types\
│       │   └── application.types.ts  # TypeScript domain interfaces and DTOs
│       ├── routes\
│       │   ├── applications.routes.ts
│       │   ├── ats.routes.ts
│       │   ├── ollama.routes.ts
│       │   └── index.ts
│       └── middleware\
│           └── errorHandler.ts       # Centralized error handler
│
└── frontend\
    ├── package.json                  # React 18, Vite, Tailwind CSS, Lucide icons
    ├── tsconfig.json                 # Strict Vite/React TypeScript compiler options
    ├── vite.config.ts                # Vite config with /api reverse proxy to port 5000
    ├── tailwind.config.js            # Modern sleek Tailwind styling configuration
    ├── postcss.config.js
    ├── index.html                    # Root HTML with Google Inter/Jakarta font
    └── src\
        ├── main.tsx                  # React 18 DOM mount point
        ├── App.tsx                   # Main dashboard layout and modal coordination
        ├── index.css                 # Tailwind directives and custom scrollbar styling
        ├── types\
        │   └── index.ts              # Frontend TypeScript definitions
        ├── services\
        │   └── api.ts                # Typed client for backend REST API
        ├── hooks\
        │   └── useApplications.ts    # State management with optimistic updates
        └── components\
            ├── Navbar.tsx            # Header with PostgreSQL, Ollama & Cron status pills
            ├── StatsSummary.tsx      # Metrics: Total, Pending, Interview Rate, Stale, ATS Avg
            ├── KanbanBoard.tsx       # 4 columns: Pending, Interview, Offer, Rejected + Filters
            ├── KanbanColumn.tsx      # Column container with HTML5 Drag-and-Drop
            ├── ApplicationCard.tsx   # Card with ATS score bar, stale alert & Ollama action
            ├── AtsScoreBar.tsx       # Progress bar with color tiers & keyword popover
            ├── ApplicationModal.tsx  # Create/Edit modal with in-modal live ATS testing
            ├── FollowUpModal.tsx     # Ollama Llama 3 follow-up modal with tone selector & copy
            └── AtsCalculatorModal.tsx # Standalone ATS keyword benchmarking tool
```

---

## 🗄️ Database DDL (`init.sql`)

PostgreSQL 18 schema utilizing native UUIDs (`gen_random_uuid()`) and `TIMESTAMPTZ`:

```sql
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' 
        CHECK (status IN ('Pending', 'Interview', 'Rejected', 'Offer')),
    location VARCHAR(255) DEFAULT 'Remote',
    salary_range VARCHAR(100),
    job_description TEXT,
    resume_text TEXT,
    ats_score NUMERIC(5,2) DEFAULT 0.00 CHECK (ats_score >= 0 AND ats_score <= 100),
    matched_keywords JSONB DEFAULT '[]'::jsonb,
    missing_keywords JSONB DEFAULT '[]'::jsonb,
    is_stale BOOLEAN NOT NULL DEFAULT FALSE,
    stale_flagged_at TIMESTAMPTZ,
    contact_email VARCHAR(255),
    contact_name VARCHAR(255),
    notes TEXT,
    applied_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_applied_date ON job_applications(applied_date);
CREATE INDEX IF NOT EXISTS idx_job_applications_is_stale ON job_applications(is_stale);
```

To initialize or reset the database:
```powershell
$env:PGPASSWORD="postgres"; & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d invoqe_job_tracker -f "D:\invoque\task3\database\init.sql"
```

---

## 🚀 Windows Quick-Start Guide

### Option 1: One-Click Windows Launcher (Recommended)
Double-click `start-windows.bat` or run:
```cmd
D:\invoque\task3\start-windows.bat
```

### Option 2: Native PowerShell Runner
Open PowerShell and run:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
& "D:\invoque\task3\start-windows.ps1"
```

### Option 3: Standard NPM Commands (Concurrent Dev Mode)
From `D:\invoque\task3`:
```powershell
# 1. Install all dependencies
npm run install:all
npm install --save-dev concurrently

# 2. Run backend & frontend concurrently
npm run dev
```

The application will be live at:
- **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
- **Backend REST API:** [http://localhost:5000/api/applications](http://localhost:5000/api/applications)
- **Health Check:** [http://localhost:5000/health](http://localhost:5000/health)

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server, PostgreSQL 18 & Ollama status probe |
| `GET` | `/api/applications` | List applications (supports `?status=&isStale=&search=`) |
| `GET` | `/api/applications/stats` | Pipeline metrics, conversion rates & average ATS score |
| `GET` | `/api/applications/:id` | Get single application by UUID |
| `POST` | `/api/applications` | Create application (automatically calculates ATS score) |
| `PUT` | `/api/applications/:id` | Update application (re-computes ATS score if texts change) |
| `PATCH`| `/api/applications/:id/status` | Fast Kanban move (`Pending`, `Interview`, `Offer`, `Rejected`) |
| `DELETE`| `/api/applications/:id` | Delete application |
| `POST` | `/api/applications/sweep-stale` | Trigger 24h stale application cron sweep on demand |
| `POST` | `/api/ats/score` | **USP 1**: Pure TypeScript TF-IDF ATS keyword scorer |
| `POST` | `/api/ollama/generate-followup` | **USP 2**: Local LLM follow-up email generator (Llama 3) |
| `GET` | `/api/ollama/status` | Check local Ollama connectivity and installed models |

---

## 🧠 Using Local Ollama with Llama 3 (USP 2)

The application communicates directly with your local Ollama instance at `http://127.0.0.1:11434`.

To activate live local Llama 3 generation:
1. Download Ollama from [ollama.com](https://ollama.com).
2. Pull and start Llama 3 in a terminal:
   ```powershell
   ollama run llama3
   ```
3. The dashboard navbar indicator will automatically switch to green (**Ollama Online**).
4. If Ollama is not active, the system's built-in offline fallback engine drafts emails seamlessly with zero downtime.

---

## 🛡️ Architecture & Constraints Compliance

1. **Strictly No ORMs**: No Prisma, No TypeORM. All queries use raw, parameterized SQL queries via `pg.Pool` to prevent SQL injection and maximize PostgreSQL 18 performance.
2. **Zero Cloud APIs**: No OpenAI, No AWS Bedrock, No cloud endpoints. Everything executes 100% locally on the Windows host machine.
3. **Explicitly Typed**: 100% TypeScript across backend Express and frontend React 18 components with zero compilation errors (`tsc --noEmit` clean).
