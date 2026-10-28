import cron from 'node-cron';
import { env } from '../config/env';
import { ApplicationsService } from '../services/applications.service';

/**
 * USP 3: Stale Application Background Monitor
 * Sweeps the PostgreSQL database every 24 hours (or per CRON_SCHEDULE).
 * Flags applications older than 14 days without an interview (status = 'Pending').
 */
export function startStaleMonitorCron(): cron.ScheduledTask {
  const schedule = env.CRON_SCHEDULE;
  console.log(
    `[Stale Cron Worker]: Registered with schedule "${schedule}" (Threshold: >${env.STALE_THRESHOLD_DAYS} days without interview)`
  );

  const task = cron.schedule(schedule, async () => {
    console.log(`[Stale Cron Sweep Started]: ${new Date().toISOString()}`);
    try {
      const result = await ApplicationsService.sweepStaleApplications(env.STALE_THRESHOLD_DAYS);
      if (result.flaggedCount > 0) {
        console.log(
          `[Stale Cron Sweep]: Successfully flagged ${result.flaggedCount} stale application(s):`,
          result.flaggedApplications.map((app) => `${app.company} - ${app.role} (Applied: ${app.applied_date})`)
        );
      } else {
        console.log('[Stale Cron Sweep]: No stale applications found needing update.');
      }
    } catch (error) {
      console.error('[Stale Cron Sweep Error]: Failed to sweep stale applications', error);
    }
  });

  return task;
}

/**
 * Manually trigger the stale sweep (for tests, CLI, or admin action)
 */
export async function triggerManualSweep() {
  console.log(`[Manual Stale Sweep Triggered]: Threshold = ${env.STALE_THRESHOLD_DAYS} days`);
  return await ApplicationsService.sweepStaleApplications(env.STALE_THRESHOLD_DAYS);
}
