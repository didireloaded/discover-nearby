import { onesignalAdapter } from "@/integrations";
import { IntegrationHealthRegistry } from "../IntegrationHealthRegistry";

export interface PushNotificationPayload {
  recipientId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface PushDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface PushProvider {
  sendPushNotification(payload: PushNotificationPayload): Promise<PushDeliveryResult>;
}

export class OneSignalPushProviderAdapter implements PushProvider {
  async sendPushNotification(payload: PushNotificationPayload): Promise<PushDeliveryResult> {
    const startTime = performance.now();
    try {
      if (!IntegrationHealthRegistry.isHealthy("onesignal")) {
        console.warn("[OneSignalPushAdapter] OneSignal is DEGRADED/DOWN; queuing fallback");
        return {
          success: false,
          error: "OneSignal service degraded",
        };
      }

      await onesignalAdapter.sendPushNotification({
        userIds: [payload.recipientId],
        heading: payload.title,
        content: payload.body,
      });
      const latency = Math.round(performance.now() - startTime);
      IntegrationHealthRegistry.recordSuccess("onesignal", latency);

      return {
        success: true,
        messageId: `os-${Date.now()}`,
      };
    } catch (err: any) {
      console.error("[OneSignalPushAdapter] Notification delivery failed:", err);
      IntegrationHealthRegistry.recordFailure("onesignal", err?.message || "PUSH_FAILED");
      return {
        success: false,
        error: err?.message || "PUSH_FAILED",
      };
    }
  }
}

export const PushProviderAdapter = new OneSignalPushProviderAdapter();
