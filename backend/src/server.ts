import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { testDbConnection, pool } from './config/db';
import rootRouter from './routes';
import { errorHandler } from './middleware/errorHandler';
import { startStaleMonitorCron } from './cron/staleMonitor.cron';
import { checkOllamaHealth } from './services/ollama.service';

const app = express();

// Middleware
app.use(cors({
  origin: true, // Allow frontend dev server
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      console.log(`[HTTP ${req.method}] ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
    });
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    postgres: 'connected',
    ollamaConfig: {
      url: env.OLLAMA_BASE_URL,
      model: env.OLLAMA_MODEL
    }
  });
});

// API Routes
app.use('/api', rootRouter);

// Centralized Error Handling
app.use(errorHandler);

// Server startup
async function startServer() {
  console.log('='.repeat(70));
  console.log('  INVOQE INTERNSHIP TASK 3: JOB APPLICATION TRACKER');
  console.log('  Pure TypeScript TF-IDF ATS Scorer | Local Ollama LLM | 24h Cron');
  console.log('='.repeat(70));

  // 1. Verify PostgreSQL 18 Connection
  const dbOk = await testDbConnection();
  if (!dbOk) {
    console.error('CRITICAL: Unable to connect to PostgreSQL 18. Check PGHOST, PGUSER, PGPASSWORD, PGDATABASE.');
  }

  // 2. Check Local Ollama Status (USP 2)
  const ollamaStatus = await checkOllamaHealth();
  if (ollamaStatus.online) {
    console.log(`[Ollama LLM Online]: ${ollamaStatus.url} (Available models: ${ollamaStatus.models.join(', ') || 'none'})`);
  } else {
    console.log(`[Ollama LLM Notice]: Offline at ${ollamaStatus.url}. Live follow-up generator will use deterministic offline fallback engine until "ollama run ${env.OLLAMA_MODEL}" is active.`);
  }

  // 3. Start 24h Stale Cron Monitor (USP 3)
  startStaleMonitorCron();

  // 4. Start HTTP Server
  const server = app.listen(env.PORT, () => {
    console.log(`[Server Ready]: http://localhost:${env.PORT}`);
    console.log(`[API Endpoints]: http://localhost:${env.PORT}/api/applications`);
  });

  // Graceful shutdown handling
  const shutdown = async () => {
    console.log('\n[Server Shutdown]: Closing server and database pools...');
    server.close(async () => {
      await pool.end();
      console.log('[Server Shutdown]: Finished cleanly.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((err) => {
  console.error('[Fatal Startup Error]:', err);
  process.exit(1);
});
