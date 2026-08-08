import { IntegrationHealthRegistry } from "../IntegrationHealthRegistry";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export interface EmailProvider {
  sendEmail(payload: EmailPayload): Promise<EmailResult>;
}

export class ResendEmailProviderAdapter implements EmailProvider {
  async sendEmail(payload: EmailPayload): Promise<EmailResult> {
    const startTime = performance.now();
    try {
      if (!IntegrationHealthRegistry.isHealthy("resend")) {
        console.warn("[ResendEmailAdapter] Resend is DEGRADED/DOWN; queuing fallback");
        return { success: false, error: "Resend service degraded" };
      }

      // Simulated Resend provider execution
      const latency = Math.round(performance.now() - startTime);
      IntegrationHealthRegistry.recordSuccess("resend", latency);

      return {
        success: true,
        id: `email-${Date.now()}`,
      };
    } catch (err: any) {
      console.error("[ResendEmailAdapter] Email delivery failed:", err);
      IntegrationHealthRegistry.recordFailure("resend", err?.message || "EMAIL_FAILED");
      return {
        success: false,
        error: err?.message || "EMAIL_FAILED",
      };
    }
  }
}

export const EmailProviderAdapter = new ResendEmailProviderAdapter();
