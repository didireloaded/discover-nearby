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

  if (!open) return null;

  const handleCreateNote = async () => {
    if (!profile) return requireAuth();
    if (!noteContent.trim()) {
      toast.error("Please write something in your note");
      return;
    }

    setIsSubmitting(true);
    try {
      const result =
        noteKind === "temporary"
          ? await NoteService.createTemporaryNote(profile.id, noteContent.trim())
          : await NoteService.createPermanentNote(profile.id, noteContent.trim());
      if (result) {
        toast.success(
          noteKind === "temporary"
            ? "Temporary 24h Note published! 🚀"
            : "Permanent Note published! 📌",
        );
        setNoteContent("");
        setLevel("root");
        onClose();
      } else {
        toast.error("Could not publish Note");
      }
    } catch (err) {
      console.error("Error creating note:", err);
      toast.error("Failed to publish Note");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 backdrop-blur-sm">
        {/* Backdrop overlay touch to close */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-[430px] max-h-[calc(100dvh-12px)] overflow-y-auto overscroll-contain pb-[calc(24px+env(safe-area-inset-bottom))] rounded-t-[32px] glass-panel-elevated p-6 border-t border-white/20 shadow-2xl backdrop-blur-2xl bg-[#06101D]/95 text-white no-scrollbar"
        >
          {/* Centered Drag Handle */}
          <div className="flex justify-center mb-4">
            <div className="h-1.5 w-12 rounded-full bg-white/20" />
          </div>

          {/* Header Bar */}
          <div className="flex items-center justify-between mb-5">
            {level !== "root" ? (
              <button
                onClick={() => setLevel("root")}
                className="flex h-8 w-8 items-center justify-center rounded-full glass-panel text-white/80 hover:text-white"
              >
                <ArrowLeft size={16} />
              </button>
            ) : (
              <div className="w-8" />
            )}

            <h2 className="text-base font-bold text-white tracking-wide text-center flex-1">
              {level === "root" && "Create on Matisa"}
              {level === "note-type" && "Select Note Type"}
              {level === "note-composer" &&
                (noteKind === "temporary" ? "Temporary Note (24h)" : "Permanent Note")}
              {level === "room-type" && "Select Room Type"}
            </h2>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full glass-panel text-white/60 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Level 1: Main Create Category Options */}
          {level === "root" && (
            <div className="grid grid-cols-1 gap-3">
              {/* 1. Note */}
              <button
                onClick={() => setLevel("note-type")}
                className="flex items-center justify-between p-4 rounded-[22px] glass-panel hover:border-white/30 transition active:scale-[0.98] group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FF9D2E]/20 text-[#FF9D2E]">
                    <FileText size={22} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-white">Text Note</h3>
                    <p className="text-xs text-white/50">24-hour temporary or permanent note</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-white/40 group-hover:text-white" />
              </button>

              {/* 1b. Voice Note */}
              <button
                onClick={() => {
                  setVoiceRecorderOpen(true);
                }}
                className="flex items-center justify-between p-4 rounded-[22px] bg-gradient-to-r from-[#FF9D2E]/15 to-[#24A3C7]/15 border border-[#24A3C7]/30 hover:border-[#24A3C7]/60 transition active:scale-[0.98] group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#FF9D2E] to-[#24A3C7] text-white shadow-md">
                    <Mic size={22} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-white">Voice Note</h3>
                    <p className="text-xs text-white/70">Record 24h or permanent voice note</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-white/40 group-hover:text-white" />
              </button>

              {/* 2. Story */}
              <button
                onClick={() => {
                  setStoryModalOpen(true);
                }}
                className="flex items-center justify-between p-4 rounded-[22px] glass-panel hover:border-white/30 transition active:scale-[0.98] group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#39B7F2]/20 text-[#39B7F2]">
                    <Camera size={22} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-white">Story</h3>
                    <p className="text-xs text-white/50">24-hour photo, video, or voice story</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-white/40 group-hover:text-white" />
              </button>

              {/* 3. Room */}
              <button
                onClick={() => setLevel("room-type")}
                className="flex items-center justify-between p-4 rounded-[22px] glass-panel hover:border-white/30 transition active:scale-[0.98] group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6139F2]/20 text-[#6139F2]">
                    <Radio size={22} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-white">Room</h3>
                    <p className="text-xs text-white/50">Voice Room or Karaoke Stage</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-white/40 group-hover:text-white" />
              </button>

              {/* 4. Event */}
              <button
                onClick={() => {
                  onClose();
                  navigate("/events");
                }}
                className="flex items-center justify-between p-4 rounded-[22px] glass-panel hover:border-white/30 transition active:scale-[0.98] group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#35C67A]/20 text-[#35C67A]">
                    <Calendar size={22} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-white">Event</h3>
                    <p className="text-xs text-white/50">Physical or virtual live event</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-white/40 group-hover:text-white" />
              </button>

              {/* 5. Live Broadcast */}
              <button
                onClick={() => {
                  onClose();
                  navigate("/rooms");
                  toast.success("Opening Live Broadcast Stage...");
                }}
                className="flex items-center justify-between p-4 rounded-[22px] glass-panel hover:border-white/30 transition active:scale-[0.98] group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/20 text-red-400">
                    <Video size={22} />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">Live Broadcast</h3>
                      <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-[10px] font-semibold text-red-300 border border-red-500/30">
                        LIVE
                      </span>
                    </div>
                    <p className="text-xs text-white/50">Stream live video or voice to followers</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-white/40 group-hover:text-white" />
              </button>
            </div>
          )}

          {/* Level 2: Note Type Selection (Temporary vs Permanent) */}
          {level === "note-type" && (
            <div className="space-y-3">
              <button
                onClick={() => {
                  setNoteKind("temporary");
                  setLevel("note-composer");
                }}
                className="w-full text-left p-4 rounded-[22px] glass-panel border border-[#FF9D2E]/40 hover:bg-[#FF9D2E]/10 transition active:scale-95"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#FF9D2E] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={14} /> Temporary Note
                  </span>
                  <span className="text-[10px] text-white/50">Max 200 chars</span>
                </div>
                <p className="text-xs text-white/80 leading-relaxed">
                  Disappears after 24 hours. Great for quick daily thoughts & status updates.
                </p>
              </button>

              <button
                onClick={() => {
                  setNoteKind("permanent");
                  setLevel("note-composer");
                }}
                className="w-full text-left p-4 rounded-[22px] glass-panel border border-[#39B7F2]/40 hover:bg-[#39B7F2]/10 transition active:scale-95"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#39B7F2] uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={14} /> Permanent Note
                  </span>
                  <span className="text-[10px] text-white/50">Max 5,000 chars</span>
                </div>
                <p className="text-xs text-white/80 leading-relaxed">
                  Stays permanently on your profile. Supports text, images, video, and audio.
                </p>
              </button>
            </div>
          )}

          {/* Level 2: Note Composer */}
          {level === "note-composer" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-white/60">
                  {noteKind === "temporary" ? "Disappears in 24 hours" : "Stays on your profile"}
                </span>
                <span className="text-xs font-bold text-[#39B7F2]">
                  {noteContent.length} / {noteKind === "temporary" ? 200 : 5000}
                </span>
              </div>

              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                maxLength={noteKind === "temporary" ? 200 : 5000}
                placeholder={
                  noteKind === "temporary"
                    ? "What's on your mind today? (200 chars max)..."
                    : "Write a permanent note, article, or voice story..."
                }
                rows={noteKind === "temporary" ? 3 : 5}
                className="w-full p-4 rounded-[22px] glass-panel text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#24A3C7]"
              />

              <button
                onClick={handleCreateNote}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#24A3C7] to-[#6139F2] text-white font-bold text-sm shadow-lg active:scale-95 transition"
              >
                Publish Note
              </button>
            </div>
          )}

          {/* Level 2: Room Type Selection (Voice Room vs Karaoke Room) */}
          {level === "room-type" && (
            <div className="space-y-3">
              <button
                onClick={() => {
                  onClose();
                  navigate("/rooms");
                  toast.success("Creating Voice Room...");
                }}
                className="w-full text-left p-4 rounded-[22px] glass-panel border border-[#6139F2]/40 hover:bg-[#6139F2]/10 transition active:scale-95"
              >
                <div className="flex items-center gap-2 mb-1 text-[#6139F2] font-bold text-xs uppercase tracking-wider">
                  <Mic size={16} /> Voice Room
                </div>
                <p className="text-xs text-white/80">
                  Host live conversations, podcasts, and community discussions.
                </p>
              </button>

              <button
                onClick={() => {
                  onClose();
                  navigate("/rooms");
                  toast.success("Creating Karaoke Stage...");
                }}
                className="w-full text-left p-4 rounded-[22px] glass-panel border border-[#FF9D2E]/40 hover:bg-[#FF9D2E]/10 transition active:scale-95"
              >
                <div className="flex items-center gap-2 mb-1 text-[#FF9D2E] font-bold text-xs uppercase tracking-wider">
                  <Music2 size={16} /> Karaoke Stage
                </div>
                <p className="text-xs text-white/80">
                  Host live singing performances with singer queues and cheer reactions.
                </p>
              </button>
            </div>
          )}

          {voiceRecorderOpen && (
            <VoiceNoteRecorderModal
              open={voiceRecorderOpen}
              onClose={() => setVoiceRecorderOpen(false)}
              onPublished={() => {
                setVoiceRecorderOpen(false);
                onClose();
              }}
              mode="note"
            />
          )}

          {storyModalOpen && (
            <CreateStoryModal open={storyModalOpen} onClose={() => setStoryModalOpen(false)} />
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body,
  );
}

export default CreateSheet;
