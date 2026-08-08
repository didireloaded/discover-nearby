import { supabase } from "../lib/supabase";
import { AnalyticsAI } from "./ai/AnalyticsAI";
import { FeedRanker } from "@/lib/recommendation/FeedRanker";

export interface Note {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  expires_at?: string;
  note_kind?: "temporary" | "permanent";
  type?: "text" | "voice";
  audio_url?: string;
  duration_seconds?: number;
  waveform_data?: number[];
  transcript?: string;

  profiles?: {
    id: string;
    username: string;
    display_name?: string;
    full_name?: string;
    avatar_url?: string;
  };
  reaction_count?: number;
  reply_count?: number;
  save_count?: number;
  is_liked?: boolean;
  is_saved?: boolean;
  is_following_author?: boolean;
}

export const NoteService = {
  /**
   * Fetches the latest active notes for the feed (For You / Discover)
   */
  async getFeedNotes(limit = 20): Promise<Note[]> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("notes")
        .select(`*, profiles!notes_user_id_fkey(id, username, display_name, full_name, avatar_url)`)
        .or(`note_kind.eq.permanent,expires_at.gt.${now}`)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      const rawNotes = data || [];
      return FeedRanker.rankFeed(rawNotes as any, { location: "Windhoek" }) as Note[];
    } catch (err) {
      console.error("Failed to fetch feed notes:", err);
      return [];
    }
  },

  /**
   * Fetches notes only from users that the given user follows (Following Feed)
   */
  async getFollowingNotes(userId: string, limit = 20): Promise<Note[]> {
    try {
      // 1. Get following IDs
      const { data: follows, error: followsError } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId);

      if (followsError) throw followsError;
      const followingIds = (follows || []).map((f) => f.following_id);

      if (followingIds.length === 0) return [];

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("notes")
        .select(`*, profiles!notes_user_id_fkey(id, username, display_name, full_name, avatar_url)`)
        .in("user_id", followingIds)
        .or(`note_kind.eq.permanent,expires_at.gt.${now}`)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Failed to fetch following notes:", err);
      return [];
    }
  },

  /**
   * Fetches notes for a specific user
   */
  async getUserNotes(userId: string): Promise<Note[]> {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select(`*, profiles!notes_user_id_fkey(id, username, display_name, full_name, avatar_url)`)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Failed to fetch user notes:", err);
      return [];
    }
  },

  /**
   * Creates a temporary 24h note (max 200 chars)
   */
  async createTemporaryNote(
    userId: string,
    content: string,
    type: "text" | "voice" = "text",
    audioUrl?: string,
    durationSeconds?: number,
    waveformData?: number[],
  ): Promise<Note | null> {
    const trimmed = content.slice(0, 200);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return this.createNoteWithLifetime(
      userId,
      trimmed,
      "temporary",
      expiresAt,
      type,
      audioUrl,
      durationSeconds,
      waveformData,
    );
  },

  /**
   * Creates a permanent note (max 5000 chars)
   */
  async createPermanentNote(
    userId: string,
    content: string,
    type: "text" | "voice" = "text",
    audioUrl?: string,
    durationSeconds?: number,
    waveformData?: number[],
  ): Promise<Note | null> {
    const trimmed = content.slice(0, 5000);
    // 100 years in future to signal permanent lifetime
    const expiresAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();

    return this.createNoteWithLifetime(
      userId,
      trimmed,
      "permanent",
      expiresAt,
      type,
      audioUrl,
      durationSeconds,
      waveformData,
    );
  },

  /**
   * Creates a new note (legacy overload & general helper)
   */
  async createNote(
    userId: string,
    content: string,
    type: "text" | "voice" = "text",
    audioUrlOrVoiceMeta?: any,
    durationSeconds?: number,
    waveformData?: number[],
  ): Promise<Note | null> {
    const voiceMeta =
      typeof audioUrlOrVoiceMeta === "object"
        ? audioUrlOrVoiceMeta
        : {
            audio_url: audioUrlOrVoiceMeta,
            duration_seconds: durationSeconds,
            waveform_data: waveformData,
          };

    // Default to temporary 24h note if < 200 chars, else permanent
    const noteKind = content.length <= 200 ? "temporary" : "permanent";
    const expiresAt =
      noteKind === "temporary"
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();

    return this.createNoteWithLifetime(
      userId,
      content,
      noteKind,
      expiresAt,
      type,
      voiceMeta.audio_url,
      voiceMeta.duration_seconds,
      voiceMeta.waveform_data,
    );
  },

  async createNoteWithLifetime(
    userId: string,
    content: string,
    noteKind: "temporary" | "permanent",
    expiresAt: string,
    type: "text" | "voice" = "text",
    audioUrl?: string,
    durationSeconds?: number,
    waveformData?: number[],
  ): Promise<Note | null> {
    try {
      const { data, error } = await supabase
        .from("notes")
        .insert({
          user_id: userId,
          content,
          type,
          note_kind: noteKind,
          expires_at: expiresAt,
          audio_url: audioUrl,
          duration_seconds: durationSeconds,
          waveform_data: waveformData,
        })
        .select(`*, profiles!notes_user_id_fkey(id, username, display_name, full_name, avatar_url)`)
        .single();

      if (error) throw error;

      AnalyticsAI.trackEvent(userId, "note_created", data?.id || "", { type, noteKind });
      return data;
    } catch (err) {
      console.error("Database insert note error:", err);
      throw err;
    }
  },

  /**
   * Deletes a note
   */
  async deleteNote(noteId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .match({ id: noteId, user_id: userId });

      if (error) throw error;

      AnalyticsAI.trackEvent(userId, "note_deleted", noteId);
      return true;
    } catch (err) {
      console.error("Failed to delete note:", err);
      return false;
    }
  },

  /**
   * Edits a note
   */
  async editNote(noteId: string, userId: string, content: string): Promise<Note | null> {
    try {
      const { data, error } = await supabase
        .from("notes")
        .update({ content })
        .match({ id: noteId, user_id: userId })
        .select(`*, profiles!notes_user_id_fkey(id, username, display_name, full_name, avatar_url)`)
        .single();

      if (error) throw error;

      AnalyticsAI.trackEvent(userId, "note_edited", noteId);
      return data;
    } catch (err) {
      console.error("Failed to edit note:", err);
      return null;
    }
  },

  /**
   * Like / Appreciate a Note
   */
  async likeNote(noteId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("reactions").upsert(
        {
          user_id: userId,
          target_type: "note",
          target_id: noteId,
          reaction_type: "heart",
        },
        { onConflict: "user_id,target_type,target_id" },
      );

      if (error) throw error;

      // Fetch note author to send notification
      const { data: noteData } = await supabase
        .from("notes")
        .select("user_id, content")
        .eq("id", noteId)
        .single();

      if (noteData && noteData.user_id !== userId) {
        await supabase.from("notifications").insert({
          recipient_id: noteData.user_id,
          actor_id: userId,
          type: "like",
          related_id: noteId,
          title: "New Like",
          message: `Someone liked your note: "${noteData.content?.substring(0, 30) || "voice note"}"`,
        });
      }

      return true;
    } catch (err) {
      console.error("Error liking note:", err);
      return false;
    }
  },

  /**
   * Unlike a Note
   */
  async unlikeNote(noteId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("reactions")
        .delete()
        .match({ user_id: userId, target_type: "note", target_id: noteId });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Error unliking note:", err);
      return false;
    }
  },

  /**
   * Save / Bookmark a Note
   */
  async saveNote(noteId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("saves").insert({ user_id: userId, note_id: noteId });

      if (error && error.code !== "23505") throw error; // ignore duplicate constraint
      return true;
    } catch (err) {
      console.error("Error saving note:", err);
      return false;
    }
  },

  /**
   * Unsave / Remove Bookmark
   */
  async unsaveNote(noteId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("saves")
        .delete()
        .match({ user_id: userId, note_id: noteId });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Error unsaving note:", err);
      return false;
    }
  },

  /**
   * Add comment to a Note
   */
  async addNoteComment(
    noteId: string,
    userId: string,
    content: string | null,
    mediaUrl?: string,
    mediaType?: "voice" | "image",
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from("comments").insert({
        note_id: noteId,
        author_id: userId,
        content,
        media_url: mediaUrl,
        media_type: mediaType,
      });

      if (error) throw error;

      // Notification
      const { data: noteData } = await supabase
        .from("notes")
        .select("user_id")
        .eq("id", noteId)
        .single();

      if (noteData && noteData.user_id !== userId) {
        await supabase.from("notifications").insert({
          recipient_id: noteData.user_id,
          actor_id: userId,
          type: mediaType === "voice" ? "voice_reply" : "reply",
          related_id: noteId,
          title: mediaType === "voice" ? "New Voice Reply" : "New Comment",
          message: content ? content.substring(0, 50) : "🎤 Voice note reply",
        });
      }

      return true;
    } catch (err) {
      console.error("Error adding note comment:", err);
      return false;
    }
  },

  /**
   * Offline Draft Queue Helpers (Feature #11: Offline Note Drafting)
   */
  getOfflineDrafts(): Array<{
    id: string;
    content: string;
    type: "text" | "voice";
    created_at: string;
  }> {
    try {
      const stored = localStorage.getItem("matisa_offline_note_drafts");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveOfflineDraft(content: string, type: "text" | "voice" = "text") {
    try {
      const drafts = this.getOfflineDrafts();
      const newDraft = {
        id: `draft_${Date.now()}`,
        content,
        type,
        created_at: new Date().toISOString(),
      };
      drafts.push(newDraft);
      localStorage.setItem("matisa_offline_note_drafts", JSON.stringify(drafts));
      return newDraft;
    } catch (err) {
      console.error("Failed to save offline draft:", err);
      return null;
    }
  },

  async syncOfflineDrafts(userId: string): Promise<number> {
    const drafts = this.getOfflineDrafts();
    if (drafts.length === 0) return 0;

    let syncedCount = 0;
    const remainingDrafts = [];

    for (const draft of drafts) {
      const result = await this.createNote(userId, draft.content, draft.type);
      if (result) {
        syncedCount++;
      } else {
        remainingDrafts.push(draft);
      }
    }

    localStorage.setItem("matisa_offline_note_drafts", JSON.stringify(remainingDrafts));
    return syncedCount;
  },

  /**
   * Subscribe to new notes in realtime
   */
  subscribeToNotes(callback: (payload: any) => void) {
    const channel = supabase
      .channel("public:notes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notes" }, (payload) =>
        callback(payload),
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "notes" }, (payload) =>
        callback(payload),
      )
      .subscribe();

    return channel;
  },

  unsubscribe(channel: any) {
    if (channel) supabase.removeChannel(channel);
  },
};
