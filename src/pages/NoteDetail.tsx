import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { NoteCard } from "@/components/feed/NoteCard";
import { SkeletonFeedCard } from "@/components/common/SkeletonLoader";
import { routes } from "@/app/navigation";
import type { Note } from "@/services/NoteService";

export function NoteDetail() {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNote() {
      if (!noteId) return;
      setLoading(true);
      try {
        const { data } = await supabase
          .from("notes")
          .select("*, profiles!notes_user_id_fkey(*)")
          .eq("id", noteId)
          .single();

        if (data) {
          setNote(data as unknown as Note);
        }
      } catch (err) {
        console.error("Error loading note detail:", err);
      } finally {
        setLoading(false);
      }
    }
    loadNote();
  }, [noteId]);

  return (
    <div className="min-h-screen bg-[#090807] text-white flex flex-col pb-28">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-[#090807] border-b border-white/10 px-4 h-14 flex items-center gap-3">
        <button
          onClick={() => navigate(routes.home())}
          className="w-9 h-9 rounded-full bg-[#1C1714] flex items-center justify-center text-white/80 hover:text-white transition active:scale-95"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-white font-display">Note Detail</h1>
      </div>

      <div className="px-5 py-4 max-w-lg mx-auto w-full">
        {loading ? (
          <SkeletonFeedCard />
        ) : note ? (
          <NoteCard note={note} />
        ) : (
          <div className="text-center py-12 bg-[#14110F] rounded-2xl border border-white/10 text-xs text-white/50">
            Note not found or deleted.
          </div>
        )}
      </div>
    </div>
  );
}

export default NoteDetail;
