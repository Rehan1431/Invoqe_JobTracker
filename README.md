# Invoqe Job Application Tracker (Task 3)

## 1. Architecture Overview

The Invoqe Job Application Tracker is a local-first, zero-cloud full-stack application engineered natively for Microsoft Windows environments. The system operates entirely without external third-party cloud APIs, external database hosts, or third-party SaaS dependencies.

The architecture comprises three primary tiers organized within a Windows-compatible monorepo:

- **Presentation Layer (Frontend):** A Single Page Application (SPA) built on React 18, Vite, TypeScript, and Tailwind CSS. The frontend communicates with the backend via Vite's internal development proxy (`/api` routed to port 5000), eliminating cross-origin complications during local testing.
- **Application Layer (Backend):** A modular Express.js server in TypeScript. The server exposes RESTful endpoints, executes in-process natural language processing routines, manages HTTP RPC connections to a local Ollama inference server on port 11434, and coordinates background cron schedules.
- **Persistence Layer (Database):** A local PostgreSQL 18 instance. All data operations utilize native parameterized SQL queries via `pg-pool`. Object-Relational Mappers (ORMs) such as Prisma and TypeORM are strictly excluded to ensure deterministic query plans, explicit indexing control, and zero abstraction overhead.

---

## 2. Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React |
| **Backend** | Node.js, Express.js, TypeScript, `node-cron`, `cors`, `dotenv` |
| **Database** | PostgreSQL 18, `pg` (`pg-pool`) with raw parameterized SQL |
| **Local Inference** | Ollama (`llama3` model, HTTP RPC on `127.0.0.1:11434`) |
| **Environment** | Microsoft Windows (PowerShell / Command Prompt) |

---

## 3. Core Features

### 3.1 Offline ATS Keyword Scorer (Pure TypeScript TF-IDF)
The Applicant Tracking System (ATS) scoring engine is implemented entirely in pure TypeScript with zero runtime dependencies. It computes a match score between a candidate's resume and a target job description through the following algorithmic pipeline:

1. **Text Normalization & Compound Preservation:** Normalizes case and punctuation while preserving recognized multi-word technical compounds (e.g., `node.js`, `react.js`, `ci/cd`, `distributed systems`, `tailwind css`).
2. **Stopword Elimination:** Strips standard English stopwords along with recruiter-specific boilerplate tokens.
3. **Morphological Stemming:** Applies Porter-style suffix stripping to unify word variations to common linguistic roots.
4. **Sub-linear Term Frequency ($TF$):** Applies augmented normalization to prevent bias toward document length:
   $$TF(t, d) = 0.5 + 0.5 \times \frac{f(t, d)}{\max_{t' \in d} f(t', d)}$$
5. **Smoothed Inverse Document Frequency ($IDF$):** Evaluates term distinctiveness across a reference technical corpus and document pair:
   $$IDF(t) = \ln\left(1 + \frac{N + 1}{DF(t) + 1}\right) + 1$$
6. **Cosine Semantic Vector Similarity:** Calculates the normalized inner product of the job description and resume TF-IDF vectors:
   $$\text{CosineSim}(\vec{V}_{JD}, \vec{V}_{Resume}) = \frac{\sum (JD_i \times Resume_i)}{\|\vec{V}_{JD}\| \|\vec{V}_{Resume}\|}$$
7. **Composite Score Computation:** Combines cosine semantic similarity (40% weight) with hard target keyword coverage (60% weight) to return an exact percentage (0.00% to 100.00%), categorized matched/missing keywords, and targeted resume optimization recommendations.

### 3.2 Local LLM Follow-Up Generator (Ollama Llama 3)
An automated follow-up drafting service that communicates with a local offline Ollama instance via HTTP POST requests to `http://127.0.0.1:11434/api/generate`:

- **Model:** `llama3` (configurable via `OLLAMA_MODEL` environment variable).
- **Prompt Architecture:** Ingests application metadata (candidate name, company, position, days elapsed, interviewer notes, and selected tone: Professional, Enthusiastic, Direct, or Executive) to synthesize customized, business-ready follow-up drafts.
- **Fault-Tolerant Fallback:** In the event that the Ollama daemon is unreachable or models are unloaded, the service intercepts `ECONNREFUSED` exceptions and supplies a deterministic local template draft alongside explicit operational diagnostics, preventing system crashes.

### 3.3 Stale Application Cron Monitor (node-cron)
An in-process background worker utilizing `node-cron` scheduled to execute daily at midnight (`0 0 * * *`):

- **Stale Sweep Criteria:** Scans `job_applications` for records matching `status = 'Pending'` where `applied_date <= CURRENT_TIMESTAMP - INTERVAL '14 days'` and `is_stale = FALSE`.
- **Database Mutation:** Automatically updates matching rows to `is_stale = TRUE` and assigns `stale_flagged_at = CURRENT_TIMESTAMP`.
- **Manual API Override:** Exposes `POST /api/applications/sweep-stale` to allow immediate, on-demand sweeps directly from administrative interfaces or automated integration pipelines.

---

## 4. Prerequisites

The following software must be installed and active on the host Windows machine:

1. **Operating System:** Microsoft Windows 10, Windows 11, or Windows Server 2019+.
2. **Node.js:** Version 18.0.0 or higher (Node.js v22.x LTS recommended; includes `npm` v9+).
3. **PostgreSQL 18:** Service `postgresql-x64-18` installed and running on port 5432 with administrative access.
4. **Ollama:** Installed locally from [https://ollama.com](https://ollama.com) with the `llama3` model pulled:
   ```cmd
   ollama pull llama3
   ```

---

## 5. Local Environment Setup

### 5.1 Repository Navigation
Open PowerShell or Command Prompt at the target directory:
```powershell
cd D:\invoque\task3
```

### 5.2 Database Provisioning & Schema Initialization
Create the PostgreSQL database and execute the Data Definition Language (DDL) migration:

```powershell
# Set PostgreSQL session credentials
$env:PGPASSWORD = "postgres"

# Create the dedicated database
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE invoqe_job_tracker;"

# Execute DDL schema and seed data
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d invoqe_job_tracker -f "D:\invoque\task3\database\init.sql"
```

Verify that the `job_applications` table exists:
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d invoqe_job_tracker -c "SELECT COUNT(*) FROM job_applications;"
```

### 5.3 Backend Configuration
Ensure `D:\invoque\task3\backend\.env` contains the required configuration:
```env
PORT=5000
NODE_ENV=development

# PostgreSQL 18 Configuration
PGHOST=127.0.0.1
PGPORT=5432
PGDATABASE=invoqe_job_tracker
PGUSER=postgres
PGPASSWORD=postgres

# Local Offline Ollama Configuration
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3

# Stale Application Monitor Configuration
STALE_THRESHOLD_DAYS=14
CRON_SCHEDULE=0 0 * * *
```

### 5.4 Dependency Installation
Install dependencies across both backend and frontend workspaces:

```powershell
# Install backend dependencies
cd D:\invoque\task3\backend
npm install

# Install frontend dependencies
cd D:\invoque\task3\frontend
npm install

# Return to root and install orchestrator
cd D:\invoque\task3
npm install --save-dev concurrently
```

### 5.5 Execution

#### Option A: Concurrent Development Boot (Root Workspace)
From `D:\invoque\task3`, start both servers simultaneously:
```powershell
npm run dev
```

#### Option B: Windows Batch Launcher
Double-click `start-windows.bat` or execute:
```cmd
D:\invoque\task3\start-windows.bat
```

#### Option C: Native Windows PowerShell Script
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
& "D:\invoque\task3\start-windows.ps1"
```

### 5.6 Service Endpoints
Once booted, the application is accessible at:
- **Frontend Dashboard:** `http://localhost:5173`
- **Backend REST API:** `http://localhost:5000/api/applications`
- **Backend Health Check:** `http://localhost:5000/health`
- **Ollama Inference RPC:** `http://127.0.0.1:11434`

---

## 6. License

Proprietary - Invoqe Internship Evaluation. All rights reserved.
