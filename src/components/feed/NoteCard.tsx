import { useState, useRef, useEffect } from "react";
import { Heart, MessageCircle, Bookmark, Share2, Play, Pause, Radio, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Avatar } from "@/components/common/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { reactionService } from "@/features/reactions";
import { useSaves } from "@/hooks/useSaves";
import { CommentsModal } from "@/components/feed/CommentsModal";
import { routes } from "@/app/navigation";
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

  const handleLikeToggle = async () => {
    requireAuth(async () => {
      const nextLiked = !isLiked;
      setIsLiked(nextLiked);
      setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

      try {
        await reactionService.toggle("note", note.id, "heart", profile!.id);
      } catch (err) {
        console.error("Failed to toggle reaction:", err);
        setIsLiked(!nextLiked);
        setLikesCount((prev) => (!nextLiked ? prev + 1 : Math.max(0, prev - 1)));
        toast.error("Could not save reaction");
      }
    });
  };

  const handleSaveToggle = async () => {
    requireAuth(async () => {
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
    });
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
    const shareUrl = `${window.location.origin}${routes.note(note.id)}`;
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
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    }
  };

  const authorName = note.profiles?.display_name || note.profiles?.username || "Creator";
  const authorHandle = note.profiles?.username || "creator";
  const timeAgo = getTimeAgo(note.created_at);

  const waveformBars = [
    30, 45, 60, 80, 40, 90, 75, 50, 85, 95, 65, 40, 80, 70, 85, 60, 40, 75, 90, 60,
  ];

  return (
    <article className="w-full bg-[#1C1714] rounded-[24px] border border-white/10 p-4 space-y-3 shadow-xl transition-all">
      {/* Hidden Audio element for voice playback */}
      {note.audio_url && (
        <audio
          ref={audioRef}
          src={note.audio_url}
          onEnded={() => {
            setIsPlaying(false);
            setProgress(0);
          }}
          onTimeUpdate={() => {
            if (audioRef.current) {
              const current = audioRef.current.currentTime;
              const total = audioRef.current.duration || 1;
              setProgress((current / total) * 100);
            }
          }}
        />
      )}

      {/* 1. Header: Author & Metadata */}
      <div className="flex items-center justify-between">
        <div
          onClick={() => navigate(routes.profile(authorHandle))}
          className="flex items-center gap-3 cursor-pointer group min-w-0"
        >
          <Avatar
            size={40}
            profile={{
              id: authorId,
              display_name: authorName,
              avatar_url: note.profiles?.avatar_url,
            }}
            className="rounded-full shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-bold text-white leading-tight truncate group-hover:text-[#FFB800] transition">
                {authorName}
              </span>
            </div>
            <span className="text-[11px] text-white/50 leading-none mt-0.5 truncate">
              @{authorHandle} • {timeAgo}
            </span>
          </div>
        </div>

        {/* Temporary / Permanent Badge */}
        {note.note_kind === "temporary" && (
          <span className="px-2 py-0.5 rounded-full bg-[#FFB800]/15 text-[#FFB800] text-[10px] font-bold">
            24h Note
          </span>
        )}
      </div>

      {/* 2. Media or Text Content */}
      <div className="space-y-3">
        {note.media_url ? (
          <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/5 max-h-96">
            <img
              src={note.media_url}
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
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#14110F] border border-white/10">
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
              <div className="px-3 py-2 rounded-xl bg-[#14110F] border border-white/10 text-xs text-white/80 space-y-0.5">
                <div className="flex items-center gap-1 text-[10px] font-bold text-[#FFB800] uppercase tracking-wider">
                  <FileText size={11} /> Transcript
                </div>
                <p className="italic leading-relaxed">"{note.transcript}"</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Naked Action Bar */}
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
              navigate(routes.rooms());
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFB800]/10 text-[#FFB800] text-[11px] font-bold hover:bg-[#FFB800]/20 transition active:scale-95"
          >
            <Radio size={11} />
            <span>Stage</span>
          </button>

          <button
            onClick={handleShare}
            className="p-1.5 rounded-full text-white/60 hover:text-white transition active:scale-95"
            aria-label="Share note"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* 4. Comments Bottom Sheet */}
      {isCommentsOpen && (
        <CommentsModal
          postId={note.id}
          onClose={() => setIsCommentsOpen(false)}
          onCommentCountChange={(delta) => setCommentsCount((prev) => Math.max(0, prev + delta))}
        >
          <span />
        </CommentsModal>
      )}
    </article>
  );
}

function getTimeAgo(dateString?: string): string {
  if (!dateString) return "just now";
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatK(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
}
