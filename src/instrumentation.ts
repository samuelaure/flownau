export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startScheduler } = await import('./services/scheduler');
    // Only start scheduler in the primary process to avoid duplication in workers if clustered
    // For our single-node setup, this effectively starts it once when Next.js boots.
    startScheduler();
  }
}
