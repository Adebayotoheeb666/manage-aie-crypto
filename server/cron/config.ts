/**
 * Cron Job Configuration for CryptoVault
 *
 * This module defines the scheduled tasks that run periodically to:
 * - Update cryptocurrency prices from external APIs
 * - Check and trigger price alerts for users
 * - Clean up expired sessions
 *
 * Jobs can be triggered via:
 * 1. External cron service (Vercel, AWS Lambda, etc.)
 * 2. Netlify scheduled functions
 * 3. Node-cron in development
 */

export interface CronJob {
  name: string;
  endpoint: string;
  method: "POST" | "GET";
  interval: string; // Human-readable interval (e.g., "*/15 * * * *" for every 15 minutes)
  description: string;
  requiresAuth: boolean;
  timeout: number; // Timeout in milliseconds
}

/**
 * Cron jobs configuration
 * Times are in UTC
 */
export const cronJobs: CronJob[] = [
  {
    name: "update-prices",
    endpoint: "/api/prices/update",
    method: "POST",
    interval: "0 * * * *", // Every hour at minute 0
    description: "Update cryptocurrency prices from CoinGecko API",
    requiresAuth: true,
    timeout: 30000, // 30 seconds
  },
  {
    name: "check-price-alerts",
    endpoint: "/api/prices/alerts",
    method: "POST",
    interval: "*/5 * * * *", // Every 5 minutes
    description: "Check and trigger price alerts for users",
    requiresAuth: true,
    timeout: 20000, // 20 seconds
  },
  {
    name: "cleanup-sessions",
    endpoint: "/api/maintenance/cleanup-sessions",
    method: "POST",
    interval: "0 2 * * *", // Daily at 2:00 AM UTC
    description: "Clean up expired user sessions",
    requiresAuth: true,
    timeout: 30000, // 30 seconds
  },
];

/**
 * Get cron job by name
 */
export function getCronJob(name: string): CronJob | undefined {
  return cronJobs.find((job) => job.name === name);
}

/**
 * Cron job execution context
 */
export interface CronContext {
  jobName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  success: boolean;
  error?: string;
  result?: unknown;
}

/**
 * Log cron job execution
 */
export async function logCronExecution(context: CronContext): Promise<void> {
  console.log(`[CRON] Job: ${context.jobName}`);
  console.log(`[CRON] Start: ${context.startTime.toISOString()}`);
  if (context.endTime) {
    console.log(`[CRON] Duration: ${context.duration}ms`);
  }
  console.log(`[CRON] Status: ${context.success ? "SUCCESS" : "FAILED"}`);
  if (context.error) {
    console.log(`[CRON] Error: ${context.error}`);
  }
  if (context.result) {
    console.log(`[CRON] Result: ${JSON.stringify(context.result)}`);
  }
}

/**
 * Execute a cron job with error handling and logging
 */
export async function executeCronJob(
  jobName: string,
  handler: () => Promise<unknown>,
): Promise<void> {
  const context: CronContext = {
    jobName,
    startTime: new Date(),
    success: false,
  };

  try {
    context.result = await handler();
    context.success = true;
  } catch (err) {
    context.error = err instanceof Error ? err.message : String(err);
    context.success = false;
  } finally {
    context.endTime = new Date();
    context.duration = context.endTime.getTime() - context.startTime.getTime();
    await logCronExecution(context);
  }
}
