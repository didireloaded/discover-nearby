import { useState, useRef, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Play,
  Pause,
  Radio,
  CheckCircle2,
  MoreHorizontal,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Avatar } from "@/components/common/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { reactionService } from "@/features/reactions";
import { useSaves } from "@/hooks/useSaves";
import { CommentsModal } from "@/components/feed/CommentsModal";
import type { Note } from "@/services/NoteService";

interface NoteCardProps {
  note: Note;
  onRefresh?: () => void;
}

export function NoteCard({ note }: NoteCardProps) {
  const navigate = useNavigate();
  const { profile, requireAuth } = useAuth();

  const authorId = note.user_id;

  // Reaction (Like) state
  const [likesCount, setLikesCount] = useState<number>(note.reaction_count || 0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeLoading, setLikeLoading] = useState<boolean>(false);

  // Save state
  const { toggleSave, checkIsSaved } = useSaves();
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [savesCount, setSavesCount] = useState<number>(0);

  // Comments state
  const [commentsCount, setCommentsCount] = useState<number>(note.reply_count || 0);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  // Voice playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch initial reaction summary & save status
  useEffect(() => {
    let active = true;

    async function loadInteractions() {
      if (profile?.id) {
        try {
          const summary = await reactionService.getSummary("note", note.id, profile.id);
          if (active) {
            if (summary.counts.heart) setLikesCount(summary.counts.heart);
            setIsLiked(summary.userReaction === "heart");
          }
        } catch (err) {
          console.error("Failed to load reaction summary for note:", err);
        }

        try {
          const saved = await checkIsSaved(note.id);
          if (active) setIsSaved(saved);
        } catch (err) {
          console.error("Failed to check save status:", err);
        }
      }
    }

    loadInteractions();
    return () => {
      active = false;
    };
  }, [note.id, profile?.id, checkIsSaved]);

  // Audio setup for voice notes
  useEffect(() => {
    if (note.type === "voice" && note.audio_url && !audioRef.current) {
      const audio = new Audio(note.audio_url);
      audio.addEventListener("timeupdate", () => {
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      });
      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setProgress(0);
      });
      audioRef.current = audio;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [note.type, note.audio_url]);

  const handleLikeToggle = async () => {
    if (!profile) return requireAuth();
    if (likeLoading) return;

    setLikeLoading(true);
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await reactionService.toggleReaction(
        {
          userId: profile.id,
          targetType: "note",
          targetId: note.id,
          reactionType: "heart",
        },
        isLiked ? "heart" : null,
      );
    } catch (err) {
      console.error("Like failed:", err);
      setIsLiked(!nextLiked);
      setLikesCount((prev) => (!nextLiked ? prev + 1 : Math.max(0, prev - 1)));
      toast.error("Could not update reaction");
    } finally {
      setLikeLoading(false);
    }
  };

  const handleSaveToggle = async () => {
    if (!profile) return requireAuth();

    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    setSavesCount((prev) => (nextSaved ? prev + 1 : Math.max(0, prev - 1)));
    const success = await toggleSave(note.id, isSaved);
    if (!success) {
      setIsSaved(!nextSaved);
      setSavesCount((prev) => (!nextSaved ? prev + 1 : Math.max(0, prev - 1)));
      toast.error("Could not save Note");
    } else {
      toast.success(nextSaved ? "Note saved to library" : "Note removed from saved");
    }
  };

  const toggleAudioPlayback = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.error("Audio playback error:", err);
        toast.error("Could not play voice note");
        setIsPlaying(false);
      }
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/notes/${note.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Note by ${note.profiles?.display_name || "a creator on Matisa"}`,
          text: note.content || "Listen to this Voice Note on Matisa!",
          url: shareUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Note link copied to clipboard!");
    }
  };

  const formatK = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + "K";
    return num.toLocaleString();
  };

  const authorName = note.profiles?.display_name || note.profiles?.username || "Creator";
  const authorUsername = note.profiles?.username || "user";
  const waveformBars = note.waveform_data?.length
    ? note.waveform_data
    : [35, 60, 40, 80, 100, 50, 75, 90, 45, 65, 85, 30, 70, 95, 40, 60];

  const timeAgoText = note.created_at
    ? new Date(note.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Just now";

  return (
    <div className="w-full rounded-2xl bg-[#181513] p-4 border border-white/10 space-y-3">
      {/* 1. Clean Author Header */}
      <div className="flex items-center justify-between gap-3">
        <div
          onClick={() => navigate(`/profile/${authorUsername}`)}
          className="flex items-center gap-2.5 cursor-pointer group min-w-0"
        >
          <Avatar
            size={36}
            profile={{
              id: authorId,
              display_name: authorName,
              avatar_url: note.profiles?.avatar_url,
            }}
            className="rounded-full shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-xs font-bold text-white truncate group-hover:text-[#FFB800] transition">
                {authorName}
              </span>
              <CheckCircle2 size={12} className="text-[#FFB800] shrink-0" />
            </div>
            <span className="text-[11px] text-white/50 truncate">
              @{authorUsername} · {timeAgoText}
            </span>
          </div>
        </div>

        <button
          onClick={() => toast.info("Options menu")}
          className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white transition active:scale-95 shrink-0"
          aria-label="More options"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* 2. Content / Media */}
      <div className="space-y-3">
        {(note as any).media_url ? (
          <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-black/40 border border-white/10">
            <img
              src={(note as any).media_url}
              alt="Note attachment"
              className="w-full h-full object-cover"
            />
            {note.content && (
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                <p className="text-xs text-white font-medium line-clamp-2 leading-relaxed">
                  {note.content}
                </p>
              </div>
            )}
          </div>
        ) : (
          note.content && (
            <p className="text-xs text-white/90 leading-relaxed whitespace-pre-line font-normal px-1">
              {note.content}
            </p>
          )
        )}

        {/* Voice Player */}
        {note.type === "voice" && (
          <div className="space-y-2">
            {note.audio_url && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <button
                  onClick={toggleAudioPlayback}
                  className="w-9 h-9 flex shrink-0 items-center justify-center rounded-full bg-[#FFB800] text-black shadow-md active:scale-95 transition"
                  aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
                >
                  {isPlaying ? (
                    <Pause size={16} fill="black" />
                  ) : (
                    <Play size={16} fill="black" className="ml-0.5" />
                  )}
                </button>

                <div className="flex-1 flex flex-col gap-1">
                  <div className="relative flex items-center gap-1 h-6 overflow-hidden">
                    {waveformBars.slice(0, 24).map((heightVal, idx) => (
                      <div
                        key={idx}
                        className={`w-1 rounded-full transition-all ${
                          isPlaying ? "bg-[#FFB800]" : "bg-white/30"
                        }`}
                        style={{
                          height: `${Math.max(20, heightVal)}%`,
                        }}
                      />
                    ))}
                    <div
                      className="absolute inset-y-0 left-0 bg-[#FFB800]/30 pointer-events-none rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {note.transcript && (
              <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/80 space-y-0.5">
                <div className="flex items-center gap-1 text-[10px] font-bold text-[#FFB800] uppercase tracking-wider">
                  <FileText size={11} /> Transcript
                </div>
                <p className="italic leading-relaxed">"{note.transcript}"</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Naked Reaction Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="flex items-center gap-5">
          {/* Heart / Like */}
          <button
            onClick={handleLikeToggle}
            className="flex items-center gap-1.5 text-white/70 hover:text-white transition active:scale-95"
            aria-label="Like"
          >
            <Heart
              size={18}
              fill={isLiked ? "#FFB800" : "none"}
              className={isLiked ? "text-[#FFB800]" : "text-white/70"}
            />
            <span
              className={`text-xs font-semibold ${isLiked ? "text-[#FFB800]" : "text-white/70"}`}
            >
              {likesCount > 0 ? formatK(likesCount) : ""}
            </span>
          </button>

          {/* Comment */}
          <button
            onClick={() => setIsCommentsOpen(true)}
            className="flex items-center gap-1.5 text-white/70 hover:text-white transition active:scale-95"
            aria-label="Comment"
          >
            <MessageCircle size={18} className="text-white/70" />
            <span className="text-xs font-semibold text-white/70">
              {commentsCount > 0 ? formatK(commentsCount) : ""}
            </span>
          </button>

          {/* Save / Bookmark */}
          <button
            onClick={handleSaveToggle}
            className="flex items-center gap-1.5 text-white/70 hover:text-white transition active:scale-95"
            aria-label="Save"
          >
            <Bookmark
              size={18}
              fill={isSaved ? "#FFB800" : "none"}
              className={isSaved ? "text-[#FFB800]" : "text-white/70"}
            />
            <span
              className={`text-xs font-semibold ${isSaved ? "text-[#FFB800]" : "text-white/70"}`}
            >
              {savesCount > 0 ? formatK(savesCount) : ""}
            </span>
          </button>
        </div>

        {/* Live Shortcut & Share */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              navigate("/rooms");
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFB800]/10 text-[#FFB800] text-[11px] font-bold hover:bg-[#FFB800]/20 transition active:scale-95"
          >
            <Radio size={11} />
            <span>Live</span>
          </button>

          <button
            onClick={handleShare}
            className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition active:scale-95"
            aria-label="Share"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Comments Modal */}
      {isCommentsOpen && (
        <CommentsModal
          postId={note.id}
          onCommentCountChange={(delta) => setCommentsCount((prev) => Math.max(0, prev + delta))}
          onClose={() => setIsCommentsOpen(false)}
        >
          <span className="hidden" />
        </CommentsModal>
      )}
    </div>
  );
}

export default NoteCard;
