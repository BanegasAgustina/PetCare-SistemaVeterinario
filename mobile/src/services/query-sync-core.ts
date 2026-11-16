/**
 * Coordina las consultas activas de pantalla sin depender de React Native ni de la red.
 * El adaptador de plataforma programa el tick y pausa el coordinador en segundo plano.
 */
export type LiveRefresh = () => void | boolean | Promise<void | boolean>;

type Subscription = {
  refresh: LiveRefresh;
  baseIntervalMs: number;
  intervalMs: number;
  nextAt: number;
  running: boolean;
};

/** Limita concurrencia, aplica backoff después de fallos y permite invalidar las consultas activas. */
export class QuerySyncCoordinator {
  private readonly subscriptions = new Set<Subscription>();
  private active = true;
  private running = 0;

  constructor(private readonly now: () => number = Date.now, private readonly maxConcurrent = 3) {}

  get size(): number { return this.subscriptions.size; }

  subscribe(refresh: LiveRefresh, intervalMs = 30_000): () => void {
    const interval = Math.max(5_000, intervalMs);
    const subscription: Subscription = { refresh, baseIntervalMs: interval, intervalMs: interval, nextAt: this.now() + interval, running: false };
    this.subscriptions.add(subscription);
    return () => { this.subscriptions.delete(subscription); };
  }

  setActive(active: boolean): void {
    if (this.active === active) return;
    this.active = active;
    if (active) this.invalidateAll();
  }

  invalidateAll(): void {
    if (!this.active) return;
    const now = this.now();
    for (const subscription of this.subscriptions) subscription.nextAt = now;
    this.tick();
  }

  tick(): void {
    if (!this.active) return;
    const now = this.now();
    const due = [...this.subscriptions]
      .filter(subscription => !subscription.running && subscription.nextAt <= now)
      .sort((first, second) => first.nextAt - second.nextAt);

    for (const subscription of due) {
      if (this.running >= this.maxConcurrent) break;
      subscription.running = true;
      this.running += 1;
      void Promise.resolve().then(subscription.refresh).then(success => {
        subscription.intervalMs = success === false
          ? Math.min(subscription.intervalMs * 2, 120_000)
          : subscription.baseIntervalMs;
      }).catch(() => {
        subscription.intervalMs = Math.min(subscription.intervalMs * 2, 120_000);
      }).finally(() => {
        subscription.nextAt = this.now() + subscription.intervalMs;
        subscription.running = false;
        this.running -= 1;
      });
    }
  }
}
