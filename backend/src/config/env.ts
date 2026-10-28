import dotenv from 'dotenv';
import path from 'path';

// Load .env relative to backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  PGHOST: process.env.PGHOST || '127.0.0.1',
  PGPORT: parseInt(process.env.PGPORT || '5432', 10),
  PGDATABASE: process.env.PGDATABASE || 'invoqe_job_tracker',
  PGUSER: process.env.PGUSER || 'postgres',
  PGPASSWORD: process.env.PGPASSWORD || 'postgres',

  // Local Ollama
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'llama3',

  // Cron
  STALE_THRESHOLD_DAYS: parseInt(process.env.STALE_THRESHOLD_DAYS || '14', 10),
  CRON_SCHEDULE: process.env.CRON_SCHEDULE || '0 0 * * *',
};
