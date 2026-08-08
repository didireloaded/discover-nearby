export type ProviderStatus = "UNCONFIGURED" | "CONFIGURED" | "HEALTHY" | "DEGRADED" | "DOWN";

export interface ProviderHealthRecord {
  provider: string;
  status: ProviderStatus;
  lastCheckedAt: string;
  latencyMs: number;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  failureCount: number;
  lastErrorCode?: string;
}

class HealthRegistry {
  private records: Map<string, ProviderHealthRecord> = new Map();

  constructor() {
    this.initDefaultProviders();
  }

  private initDefaultProviders() {
    const defaultProviders = [
      "supabase",
      "livekit",
      "onesignal",
      "resend",
      "openai",
      "paytoday",
      "mapbox",
      "posthog",
      "sentry",
    ];

    const now = new Date().toISOString();
    defaultProviders.forEach((prov) => {
      this.records.set(prov, {
        provider: prov,
        status: "HEALTHY",
        lastCheckedAt: now,
        latencyMs: 45,
        lastSuccessAt: now,
        lastFailureAt: null,
        failureCount: 0,
      });
    });
  }

  public recordSuccess(provider: string, latencyMs: number) {
    const record = this.records.get(provider) || {
      provider,
      status: "HEALTHY",
      lastCheckedAt: new Date().toISOString(),
      latencyMs: 0,
      lastSuccessAt: null,
      lastFailureAt: null,
      failureCount: 0,
    };

    const now = new Date().toISOString();
    this.records.set(provider, {
      ...record,
      status: latencyMs > 3000 ? "DEGRADED" : "HEALTHY",
      lastCheckedAt: now,
      lastSuccessAt: now,
      latencyMs,
      failureCount: 0,
    });
  }

  public recordFailure(provider: string, errorCode: string) {
    const record = this.records.get(provider) || {
      provider,
      status: "HEALTHY",
      lastCheckedAt: new Date().toISOString(),
      latencyMs: 0,
      lastSuccessAt: null,
      lastFailureAt: null,
      failureCount: 0,
    };

    const now = new Date().toISOString();
    const newFailureCount = record.failureCount + 1;
    this.records.set(provider, {
      ...record,
      status: newFailureCount >= 3 ? "DOWN" : "DEGRADED",
      lastCheckedAt: now,
      lastFailureAt: now,
      failureCount: newFailureCount,
      lastErrorCode: errorCode,
    });
  }

  public getRecord(provider: string): ProviderHealthRecord | undefined {
    return this.records.get(provider);
  }

  public getAllRecords(): ProviderHealthRecord[] {
    return Array.from(this.records.values());
  }

  public isHealthy(provider: string): boolean {
    const rec = this.records.get(provider);
    return rec ? rec.status === "HEALTHY" || rec.status === "DEGRADED" : true;
  }
}

export const IntegrationHealthRegistry = new HealthRegistry();
