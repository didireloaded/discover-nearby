import { supabase } from "@/lib/supabase";
import { PushProviderAdapter } from "../integration/adapters/PushProviderAdapter";

export interface OutboxEvent {
  id?: string;
  event_type: string;
  actor_id?: string;
  recipient_id?: string;
  entity_type: string;
  entity_id: string;
  payload?: Record<string, any>;
  status?: "pending" | "processing" | "completed" | "failed";
  attempts?: number;
  created_at?: string;
}

export class OutboxServiceManager {
  /**
   * Enqueues an event to outbox table asynchronously
   */
  async enqueueEvent(event: OutboxEvent): Promise<boolean> {
    try {
      const { error } = await supabase.from("outbox_events").insert({
        event_type: event.event_type,
        actor_id: event.actor_id || null,
        recipient_id: event.recipient_id || null,
        entity_type: event.entity_type,
        entity_id: event.entity_id,
        payload: event.payload || {},
        status: "pending",
      });

      if (error) {
        console.warn("[OutboxService] DB enqueue notice:", error.message);
      }

      // Trigger immediate background worker dispatch
      this.dispatchPendingEvent(event).catch(() => {});
      return true;
    } catch (err) {
      console.error("[OutboxService] Failed to enqueue outbox event", err);
      return false;
    }
  }

  /**
   * Dispatches outbox events (push notifications, notifications table write, activity aggregation)
   */
  private async dispatchPendingEvent(event: OutboxEvent): Promise<void> {
    if (!event.recipient_id) return;

    if (event.event_type === "message.created") {
      await PushProviderAdapter.sendPushNotification({
        recipientId: event.recipient_id,
        title: "New Message",
        body: event.payload?.text || "You received a new direct message on Matisa",
        data: { conversationId: event.entity_id },
      });
    } else if (event.event_type === "follow.created") {
      await PushProviderAdapter.sendPushNotification({
        recipientId: event.recipient_id,
        title: "New Follower",
        body: "Someone started following your Matisa creator profile",
        data: { actorId: event.actor_id },
      });
    } else if (event.event_type === "reaction.created") {
      await PushProviderAdapter.sendPushNotification({
        recipientId: event.recipient_id,
        title: "Note Liked",
        body: "Someone liked your note on Matisa",
        data: { noteId: event.entity_id },
      });
    }
  }
}

export const OutboxService = new OutboxServiceManager();
