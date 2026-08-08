import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Note } from "@/types";

export function useSaves() {
  const { user } = useAuth();
  const [savedNotes, setSavedNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSavedNotes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookmarks")
        .select(
          `
          note_id,
          notes (*, profiles!notes_user_id_fkey(*))
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const notes = data?.map((save: any) => save.notes).filter(Boolean) as unknown as Note[];
      setSavedNotes(notes);
    } catch (err) {
      console.error("Error fetching saved notes:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const toggleSave = useCallback(
    async (noteId: string, isCurrentlySaved: boolean) => {
      if (!user) return false;

      try {
        if (isCurrentlySaved) {
          await supabase.from("saves").delete().match({ user_id: user.id, note_id: noteId });
        } else {
          await supabase.from("saves").insert({ user_id: user.id, note_id: noteId });
        }
        return true;
      } catch (err) {
        console.error("Error toggling save:", err);
        return false;
      }
    },
    [user],
  );

  const checkIsSaved = useCallback(
    async (noteId: string) => {
      if (!user) return false;
      try {
        const { data, error } = await supabase
          .from("saves")
          .select("note_id")
          .match({ user_id: user.id, note_id: noteId })
          .single();

        if (error && error.code !== "PGRST116") throw error;
        return !!data;
      } catch (err) {
        return false;
      }
    },
    [user],
  );

  return {
    savedNotes,
    savedPosts: savedNotes, // Alias for backward compatibility
    loading,
    fetchSavedNotes,
    fetchSavedPosts: fetchSavedNotes,
    toggleSave,
    checkIsSaved,
  };
}
