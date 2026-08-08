import { useState, useEffect, useCallback } from "react";
import { NoteService, Note } from "@/services/NoteService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useNotes(initialTab: "discover" | "following" = "discover") {
  const { profile } = useAuth();
  const [feedTab, setFeedTab] = useState<"discover" | "following">(initialTab);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let data: Note[] = [];
      if (feedTab === "following" && profile?.id) {
        data = await NoteService.getFollowingNotes(profile.id);
      } else {
        data = await NoteService.getFeedNotes();
      }
      setNotes(data);
    } catch (err: any) {
      setError(err);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [feedTab, profile?.id]);

  useEffect(() => {
    fetchNotes();

    const channel = NoteService.subscribeToNotes((payload) => {
      if (payload.eventType === "INSERT") {
        fetchNotes();
      } else if (payload.eventType === "DELETE") {
        setNotes((prev) => prev.filter((n) => n.id !== payload.old.id));
      }
    });

    return () => {
      NoteService.unsubscribe(channel);
    };
  }, [fetchNotes]);

  const createNote = async (
    content: string,
    type: "text" | "voice" = "text",
    audioUrl?: string,
    durationSeconds?: number,
    waveformData?: number[],
  ) => {
    if (!profile?.id) {
      toast.error("Please sign in to publish notes");
      return null;
    }
    const newNote = await NoteService.createNote(
      profile.id,
      content,
      type,
      audioUrl,
      durationSeconds,
      waveformData,
    );
    if (newNote) {
      setNotes((prev) => [newNote, ...prev]);
    }
    return newNote;
  };

  const createTemporaryNote = async (
    content: string,
    type: "text" | "voice" = "text",
    audioUrl?: string,
    durationSeconds?: number,
    waveformData?: number[],
  ) => {
    if (!profile?.id) {
      toast.error("Please sign in to publish notes");
      return null;
    }
    const newNote = await NoteService.createTemporaryNote(
      profile.id,
      content,
      type,
      audioUrl,
      durationSeconds,
      waveformData,
    );
    if (newNote) {
      setNotes((prev) => [newNote, ...prev]);
    }
    return newNote;
  };

  const createPermanentNote = async (
    content: string,
    type: "text" | "voice" = "text",
    audioUrl?: string,
    durationSeconds?: number,
    waveformData?: number[],
  ) => {
    if (!profile?.id) {
      toast.error("Please sign in to publish notes");
      return null;
    }
    const newNote = await NoteService.createPermanentNote(
      profile.id,
      content,
      type,
      audioUrl,
      durationSeconds,
      waveformData,
    );
    if (newNote) {
      setNotes((prev) => [newNote, ...prev]);
    }
    return newNote;
  };

  const toggleLikeNote = async (noteId: string, currentLikedState: boolean) => {
    if (!profile) {
      toast.error("Please sign in to like notes");
      return false;
    }

    // Optimistic update
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId) {
          const newCount = currentLikedState
            ? Math.max(0, (n.reaction_count || 0) - 1)
            : (n.reaction_count || 0) + 1;
          return { ...n, is_liked: !currentLikedState, reaction_count: newCount };
        }
        return n;
      }),
    );

    const success = currentLikedState
      ? await NoteService.unlikeNote(noteId, profile.id)
      : await NoteService.likeNote(noteId, profile.id);

    if (!success) {
      // Revert optimistic update on failure
      setNotes((prev) =>
        prev.map((n) => {
          if (n.id === noteId) {
            const revertedCount = currentLikedState
              ? (n.reaction_count || 0) + 1
              : Math.max(0, (n.reaction_count || 0) - 1);
            return { ...n, is_liked: currentLikedState, reaction_count: revertedCount };
          }
          return n;
        }),
      );
      toast.error("Failed to update like status");
    }

    return success;
  };

  const toggleSaveNote = async (noteId: string, currentSavedState: boolean) => {
    if (!profile) {
      toast.error("Please sign in to save notes");
      return false;
    }

    // Optimistic update
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, is_saved: !currentSavedState } : n)),
    );

    const success = currentSavedState
      ? await NoteService.unsaveNote(noteId, profile.id)
      : await NoteService.saveNote(noteId, profile.id);

    if (!success) {
      // Revert optimistic update
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, is_saved: currentSavedState } : n)),
      );
      toast.error("Failed to update save status");
    } else {
      toast.success(currentSavedState ? "Removed from saved notes" : "Note saved!");
    }

    return success;
  };

  const deleteNote = async (noteId: string) => {
    if (!profile) return false;
    const success = await NoteService.deleteNote(noteId, profile.id);
    if (success) {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success("Note deleted");
    } else {
      toast.error("Failed to delete note");
    }
    return success;
  };

  const editNote = async (noteId: string, content: string) => {
    if (!profile) return null;
    const updatedNote = await NoteService.editNote(noteId, profile.id, content);
    if (updatedNote) {
      setNotes((prev) => prev.map((n) => (n.id === noteId ? updatedNote : n)));
      toast.success("Note updated");
    } else {
      toast.error("Failed to update note");
    }
    return updatedNote;
  };

  return {
    feedTab,
    setFeedTab,
    notes,
    loading,
    error,
    createNote,
    createTemporaryNote,
    createPermanentNote,
    toggleLikeNote,
    toggleSaveNote,
    deleteNote,
    editNote,
    refreshNotes: fetchNotes,
  };
}
