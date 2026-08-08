import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Camera,
  Radio,
  Calendar,
  Video,
  Clock,
  Mic,
  Music2,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { NoteService } from "@/services/NoteService";
import { VoiceNoteRecorderModal } from "@/components/voice/VoiceNoteRecorderModal";
import { CreateStoryModal } from "@/components/stories/CreateStoryModal";
import { routes } from "@/app/navigation";

interface CreateSheetProps {
  open: boolean;
  onClose: () => void;
}

export function CreateSheet({ open, onClose }: CreateSheetProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, requireAuth } = useAuth();
  const [level, setLevel] = useState<"root" | "note-type" | "note-composer" | "room-type">("root");

  const [noteKind, setNoteKind] = useState<"temporary" | "permanent">("temporary");
  const [noteContent, setNoteContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceRecorderOpen, setVoiceRecorderOpen] = useState(false);
  const [storyModalOpen, setStoryModalOpen] = useState(false);

  // Contextual pre-selection based on active route when sheet opens
  useEffect(() => {
    if (!open) {
      setLevel("root");
      return;
    }

    if (location.pathname.startsWith("/notes")) {
      setLevel("note-type");
    } else if (location.pathname.startsWith("/rooms")) {
      setLevel("room-type");
    } else {
      setLevel("root");
    }
  }, [open, location.pathname]);

  // Prevent background body scroll when open
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const handleCreateTextNote = async () => {
    if (!noteContent.trim()) {
      toast.error("Please enter some text for your note");
      return;
    }

    requireAuth(async () => {
      setIsSubmitting(true);
      try {
        if (noteKind === "temporary") {
          await NoteService.createTemporaryNote(noteContent.trim());
        } else {
          await NoteService.createPermanentNote(noteContent.trim());
        }

        toast.success(
          noteKind === "temporary"
            ? "24-hour Temporary Note posted!"
            : "Permanent Note published to feed!",
        );

        setNoteContent("");
        onClose();
        navigate(routes.home());
      } catch (err) {
        console.error("Failed to post note:", err);
        toast.error("Could not post Note");
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-end justify-center">
        {/* Overlay Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Bottom Sheet Container */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="relative w-full max-w-[430px] rounded-t-[28px] bg-[#1C1714] border-t border-white/10 p-5 shadow-2xl text-white z-10"
        >
          {/* Header Controls */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              {level !== "root" && (
                <button
                  onClick={() => setLevel("root")}
                  className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <h2 className="text-base font-bold font-display">
                {level === "root" && "Create Content"}
                {level === "note-type" && "Choose Note Type"}
                {level === "note-composer" &&
                  (noteKind === "temporary" ? "Post 24-Hour Note" : "Post Permanent Note")}
                {level === "room-type" && "Choose Stage Type"}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10"
            >
              <X size={18} />
            </button>
          </div>

          {/* Level 1: Root Menu */}
          {level === "root" && (
            <div className="space-y-2.5 max-h-[75vh] overflow-y-auto pr-1">
              {/* 1. Note */}
              <button
                onClick={() => setLevel("note-type")}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#14110F] border border-white/10 hover:border-white/20 transition active:scale-[0.98] group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFB800]/15 text-[#FFB800]">
                    <FileText size={20} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xs font-bold text-white">Text or Voice Note</h3>
                    <p className="text-[11px] text-white/50">24-hour note or permanent post</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/40 group-hover:text-white" />
              </button>

              {/* 2. Story */}
              <button
                onClick={() => {
                  onClose();
                  setStoryModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#14110F] border border-white/10 hover:border-white/20 transition active:scale-[0.98] group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF9A3D]/15 text-[#FF9A3D]">
                    <Camera size={20} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xs font-bold text-white">Story</h3>
                    <p className="text-[11px] text-white/50">24-hour photo or video story</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/40 group-hover:text-white" />
              </button>

              {/* 3. Room */}
              <button
                onClick={() => setLevel("room-type")}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#14110F] border border-white/10 hover:border-white/20 transition active:scale-[0.98] group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#30C878]/15 text-[#30C878]">
                    <Radio size={20} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xs font-bold text-white">Audio Room</h3>
                    <p className="text-[11px] text-white/50">Voice Room or Karaoke Stage</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/40 group-hover:text-white" />
              </button>

              {/* 4. Event */}
              <button
                onClick={() => {
                  onClose();
                  navigate(routes.events());
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#14110F] border border-white/10 hover:border-white/20 transition active:scale-[0.98] group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFB800]/15 text-[#FFB800]">
                    <Calendar size={20} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xs font-bold text-white">Event</h3>
                    <p className="text-[11px] text-white/50">Physical or virtual social event</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/40 group-hover:text-white" />
              </button>
            </div>
          )}

          {/* Level 2: Note Types */}
          {level === "note-type" && (
            <div className="space-y-2.5">
              <button
                onClick={() => {
                  setNoteKind("temporary");
                  setLevel("note-composer");
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#14110F] border border-white/10 hover:border-white/20 transition active:scale-[0.98]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFB800]/15 text-[#FFB800]">
                    <Clock size={20} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xs font-bold text-white">24-Hour Note</h3>
                    <p className="text-[11px] text-white/50">Max 200 characters • Auto-expires</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/40" />
              </button>

              <button
                onClick={() => {
                  setNoteKind("permanent");
                  setLevel("note-composer");
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#14110F] border border-white/10 hover:border-white/20 transition active:scale-[0.98]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF9A3D]/15 text-[#FF9A3D]">
                    <FileText size={20} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xs font-bold text-white">Permanent Note</h3>
                    <p className="text-[11px] text-white/50">
                      Max 1,000 characters • Stays on profile
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/40" />
              </button>

              <button
                onClick={() => {
                  onClose();
                  setVoiceRecorderOpen(true);
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#14110F] border border-white/10 hover:border-white/20 transition active:scale-[0.98]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#30C878]/15 text-[#30C878]">
                    <Mic size={20} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xs font-bold text-white">Record Voice Note</h3>
                    <p className="text-[11px] text-white/50">Speak to your community</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/40" />
              </button>
            </div>
          )}

          {/* Level 3: Note Composer */}
          {level === "note-composer" && (
            <div className="space-y-3">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                maxLength={noteKind === "temporary" ? 200 : 1000}
                rows={4}
                placeholder={
                  noteKind === "temporary"
                    ? "Share a quick 24-hour thought (max 200 chars)..."
                    : "Share a permanent note with your followers..."
                }
                className="w-full p-3 rounded-xl bg-[#14110F] text-xs text-white placeholder-white/40 border border-white/10 focus:outline-none focus:border-[#FFB800] resize-none"
              />

              <div className="flex items-center justify-between text-[11px] text-white/50">
                <span>{noteKind === "temporary" ? "24-Hour Note" : "Permanent Note"}</span>
                <span>
                  {noteContent.length} / {noteKind === "temporary" ? 200 : 1000}
                </span>
              </div>

              <button
                onClick={handleCreateTextNote}
                disabled={isSubmitting || !noteContent.trim()}
                className="w-full py-2.5 rounded-xl bg-[#FFB800] text-black font-bold text-xs disabled:opacity-40 transition active:scale-95"
              >
                {isSubmitting ? "Posting..." : "Publish Note"}
              </button>
            </div>
          )}

          {/* Level 2: Room Types */}
          {level === "room-type" && (
            <div className="space-y-2.5">
              <button
                onClick={() => {
                  onClose();
                  navigate(routes.rooms());
                  toast.success("Opening Voice Room Stage...");
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#14110F] border border-white/10 hover:border-white/20 transition active:scale-[0.98]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFB800]/15 text-[#FFB800]">
                    <Radio size={20} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xs font-bold text-white">Live Voice Room</h3>
                    <p className="text-[11px] text-white/50">Host a real-time voice discussion</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/40" />
              </button>

              <button
                onClick={() => {
                  onClose();
                  navigate(routes.rooms());
                  toast.success("Opening Karaoke Stage...");
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#14110F] border border-white/10 hover:border-white/20 transition active:scale-[0.98]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF9A3D]/15 text-[#FF9A3D]">
                    <Music2 size={20} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xs font-bold text-white">Karaoke Room</h3>
                    <p className="text-[11px] text-white/50">Sing live with community</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/40" />
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Voice Note Recorder Modal */}
      {voiceRecorderOpen && (
        <VoiceNoteRecorderModal
          open={voiceRecorderOpen}
          onClose={() => setVoiceRecorderOpen(false)}
          onPublished={() => {
            setVoiceRecorderOpen(false);
            navigate(routes.home());
          }}
        />
      )}

      {/* Create Story Modal */}
      {storyModalOpen && (
        <CreateStoryModal
          isOpen={storyModalOpen}
          onClose={() => setStoryModalOpen(false)}
          onStoryCreated={() => {
            setStoryModalOpen(false);
            navigate(routes.home());
          }}
        />
      )}
    </AnimatePresence>,
    document.body,
  );
}
