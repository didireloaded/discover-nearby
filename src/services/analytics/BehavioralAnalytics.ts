import { supabase } from "@/lib/supabase";
import { Analytics } from "@/lib/analytics";

export type BehaviorEventType =
  | "impression"
  | "view"
  | "dwell"
  | "audio_start"
  | "audio_complete"
  | "like"
  | "comment"
  | "share"
  | "profile_open"
  | "follow"
  | "hide"
  | "report";

export interface BehaviorEvent {
  userId?: string;
  eventType: BehaviorEventType;
  entityType: "note" | "profile" | "room" | "event" | "story";
  entityId: string;
  creatorId?: string;
  durationMs?: number;
  metadata?: Record<string, any>;
}

class BehavioralAnalyticsLogger {
  async trackEvent(event: BehaviorEvent): Promise<void> {
    try {
      // 1. Log to PostHog telemetry
      Analytics.track(event.eventType, {
        entity_type: event.entityType,
        entity_id: event.entityId,
        creator_id: event.creatorId,
        duration_ms: event.durationMs,
        ...event.metadata,
      });

      // 2. Persist behavioral event row in Supabase for ranker signal extraction
      if (event.userId) {
        await supabase.from("user_events").insert({
          user_id: event.userId,
          event_type: event.eventType,
          entity_type: event.entityType,
          entity_id: event.entityId,
          creator_id: event.creatorId || null,
          duration_ms: event.durationMs || 0,
          metadata: event.metadata || {},
        });
      }
    } catch {
      // Silent failure: telemetry errors must never disrupt user experience
    }
  }
}

export const BehavioralAnalytics = new BehavioralAnalyticsLogger();
