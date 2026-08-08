import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckCircle2, Radio, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { USERS } from "@/data/dummy";
import { Avatar } from "@/components/common/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useNotes } from "@/hooks/useNotes";
import { StoryService } from "@/services/stories";
import { CreateStoryModal } from "@/components/stories/CreateStoryModal";
import { StoriesViewer } from "@/components/stories/StoriesViewer";
import { CreateNoteModal } from "@/components/notes/CreateNoteModal";
import { VoiceNoteRecorderModal } from "@/components/voice/VoiceNoteRecorderModal";
import { CommentsModal } from "@/components/feed/CommentsModal";
import { NoteCard } from "@/components/feed/NoteCard";

export function Home() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [feedTab, setFeedTab] = useState<"discover" | "following">("discover");
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | "temporary" | "permanent" | "voice" | "events"
  >("all");
  const { notes, refreshNotes } = useNotes();
  const [stories, setStories] = useState<any[]>([]);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadStories() {
      try {
        const data = await StoryService.getFeedStories();
        if (data && data.length > 0) {
          setStories(data);
        } else {
          setStories(
            USERS.map((user, i) => ({
              id: `story-${user.id}`,
              user_id: user.id,
              profiles: {
                display_name: user.name,
                avatar_url: user.avatar,
              },
              media_url: user.avatar,
              media_type: i % 2 === 0 ? "image" : "voice",
              created_at: new Date(Date.now() - i * 3600000).toISOString(),
            })),
          );
        }
      } catch (err) {
        console.error("Failed to load stories", err);
      }
    }
    loadStories();
  }, []);

  const discoverFeed = [
    {
      id: "disc-1",
      author: "Maria Theodore",
      username: "maria_theodore",
      verified: true,
      avatar: USERS[0].avatar,
      videoBg:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
      caption:
        "Short scenes, deep emotions—each note carries a piece of something special under the Namibian sky. ✨",
      likesCount: 452000,
      bookmarksCount: 189000,
      commentsCount: 102000,
      type: "media",
    },
    {
      id: "disc-2",
      author: "Gazza Official",
      username: "gazzamusic",
      verified: true,
      avatar: USERS[1].avatar,
      videoBg:
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
      caption: "Live acoustic studio session in Windhoek. Join the voice room afterwards!",
      likesCount: 328000,
      bookmarksCount: 124000,
      commentsCount: 86000,
      type: "media",
    },
    {
      id: "disc-3",
      author: "Lukas Shilongo",
      username: "lukas_vibe",
      verified: false,
      avatar: USERS[2].avatar,
      videoBg:
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
      caption: "Swakopmund Sunset Jam Session — live voice notes dropping tonight",
      likesCount: 215000,
      bookmarksCount: 67000,
      commentsCount: 42000,
      type: "media",
    },
  ];

  const followingFeed = [
    {
      id: "foll-1",
      author: "Maria Theodore",
      username: "maria_theodore",
      verified: true,
      avatar: USERS[0].avatar,
      videoBg:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
      caption:
        "Exclusive update for my followers: New voice room session hosting tomorrow at 8 PM!",
      likesCount: 184000,
      bookmarksCount: 92000,
      commentsCount: 34000,
      type: "media",
    },
  ];

  const activeFeed = feedTab === "discover" ? discoverFeed : followingFeed;

  return (
    <div className="flex flex-col min-h-full pb-28 pt-1 bg-[#0B0A09] text-white">
      {/* 1. Header & Feed Selector */}
      <div className="px-5 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setFeedTab("discover")}
            className={`pb-1 text-lg font-bold tracking-wide transition relative font-display ${
              feedTab === "discover"
                ? "text-white border-b-2 border-[#FFB800]"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            Discover
          </button>

          <button
            onClick={() => setFeedTab("following")}
            className={`pb-1 text-lg font-bold tracking-wide transition relative font-display ${
              feedTab === "following"
                ? "text-white border-b-2 border-[#FFB800]"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            Following
          </button>
        </div>

        {/* Quick Voice Note Action */}
        <button
          onClick={() => setIsVoiceRecorderOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFB800]/15 text-[#FFB800] border border-[#FFB800]/30 text-xs font-bold hover:bg-[#FFB800]/25 transition active:scale-95 shadow-md"
        >
          <Mic size={14} className="text-[#FFB800]" />
          <span>Voice Note</span>
        </button>
      </div>

      {/* 2. Sub-Category Filter Bar (All, 24h Notes, Permanent, Voice, Events) */}
      <div className="px-5 mb-4 overflow-x-auto no-scrollbar flex items-center gap-2">
        {[
          { id: "all", label: "All" },
          { id: "temporary", label: "24h Notes" },
          { id: "permanent", label: "Permanent" },
          { id: "voice", label: "Voice" },
          { id: "events", label: "Events" },
        ].map((tab) => {
          const isActive = categoryFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap relative ${
                isActive
                  ? "bg-[#FFB800] text-black shadow-md"
                  : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Story Rail matching Blueprint */}
      <div className="px-5 mb-4 overflow-x-auto no-scrollbar flex items-center gap-4 py-1">
        {/* Your Story Tile */}
        <button
          onClick={() => setIsCreateStoryOpen(true)}
          className="flex flex-col items-center gap-1.5 flex-shrink-0 group active:scale-95 transition"
        >
          <div className="relative h-[66px] w-[66px] rounded-full p-[2px] bg-gradient-to-tr from-[#FFB800] to-[#FF9D2E] flex items-center justify-center shadow-md">
            <div className="h-full w-full rounded-full bg-[#0B0A09] flex items-center justify-center">
              <Avatar
                size={60}
                profile={{
                  id: profile?.id || "me",
                  display_name: profile?.display_name || "You",
                  avatar_url: profile?.avatar_url,
                }}
              />
            </div>
            <div className="absolute bottom-0 right-0 h-5.5 w-5.5 rounded-full bg-[#FFB800] text-black flex items-center justify-center border-2 border-[#0B0A09] shadow">
              <Plus size={13} strokeWidth={3} />
            </div>
          </div>
          <span className="text-[11px] font-semibold text-white/80 text-center truncate w-[68px]">
            Add Story
          </span>
        </button>

        {/* Creator Stories */}
        {stories.map((s, idx) => {
          const author = s.profiles;
          const authorName = author?.display_name || USERS[idx % USERS.length].name;
          const firstName = authorName.split(" ")[0];

          return (
            <button
              key={s.id}
              onClick={() => setViewerIndex(idx)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group active:scale-95 transition"
            >
              <div className="relative h-[66px] w-[66px] rounded-full gold-story-ring shadow-md hover:scale-105 transition">
                <Avatar
                  size={61}
                  profile={{
                    id: s.user_id,
                    display_name: authorName,
                    avatar_url: author?.avatar_url || USERS[idx % USERS.length].avatar,
                  }}
                />
              </div>
              <div className="flex items-center gap-0.5 justify-center w-[68px]">
                <span className="text-[11px] font-medium text-white/80 text-center truncate">
                  {firstName}
                </span>
                <CheckCircle2 size={10} className="text-[#FFB800] shrink-0" />
              </div>
            </button>
          );
        })}
      </div>

      {/* 4. Live Rooms Strip */}
      <div className="px-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FFB800] rounded-full shadow-[0_0_8px_#FFB800]" />
            <span className="text-xs font-bold text-white tracking-wide uppercase font-display">
              Live Rooms Right Now
            </span>
          </div>
          <button
            onClick={() => navigate("/rooms")}
            className="text-[11px] font-bold text-[#FFB800] hover:underline"
          >
            View all
          </button>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => navigate("/rooms/demo-room-1")}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-[18px] bg-white/5 border border-white/10 hover:border-[#FFB800]/60 transition active:scale-95 flex-shrink-0"
          >
            <Radio size={15} className="text-[#FFB800] animate-pulse" />
            <div className="text-left">
              <div className="text-xs font-bold text-white truncate max-w-[140px]">
                Afrobeats Only 🔥
              </div>
              <div className="text-[10px] text-white/60">34 listening • 2 singing</div>
            </div>
          </button>

          <button
            onClick={() => navigate("/rooms/demo-room-1")}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-[18px] bg-white/5 border border-white/10 hover:border-[#FFB800]/60 transition active:scale-95 flex-shrink-0"
          >
            <Mic size={15} className="text-[#FFB800] animate-pulse" />
            <div className="text-left">
              <div className="text-xs font-bold text-white truncate max-w-[140px]">
                Namibian Hits Jam
              </div>
              <div className="text-[10px] text-white/60">142 listening</div>
            </div>
          </button>
        </div>
      </div>

      {/* 5. Unified Feed Stream */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${feedTab}-${categoryFilter}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="px-5 space-y-5 flex-1"
        >
          {/* Render Live Notes from DB when available */}
          {notes && notes.length > 0 && (
            <div className="space-y-4">
              {notes.slice(0, 3).map((note) => (
                <NoteCard key={note.id} note={note} onRefresh={refreshNotes} />
              ))}
            </div>
          )}

          {/* Render Tab Media Posts */}
          {activeFeed.map((post) => (
            <NoteCard
              key={post.id}
              note={
                {
                  id: post.id,
                  user_id: post.id,
                  content: post.caption,
                  media_url: post.videoBg,
                  type: "permanent",
                  created_at: new Date().toISOString(),
                  reaction_count: post.likesCount,
                  reply_count: post.commentsCount,
                  profiles: {
                    username: post.username,
                    display_name: post.author,
                    avatar_url: post.avatar,
                  },
                } as any
              }
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Modals & Viewers */}
      {activeCommentsPostId && (
        <CommentsModal postId={activeCommentsPostId} onClose={() => setActiveCommentsPostId(null)}>
          <span className="hidden" />
        </CommentsModal>
      )}

      {isCreateStoryOpen && (
        <CreateStoryModal open={isCreateStoryOpen} onClose={() => setIsCreateStoryOpen(false)} />
      )}

      {isCreateNoteOpen && (
        <CreateNoteModal
          open={isCreateNoteOpen}
          onClose={() => setIsCreateNoteOpen(false)}
          onSuccess={refreshNotes}
          initialMode="text"
        />
      )}

      {viewerIndex !== null && (
        <StoriesViewer
          stories={stories.map((s) => ({
            id: s.id,
            userId: s.user_id,
            username: s.profiles?.display_name || "User",
            userAvatar: s.profiles?.avatar_url || "",
            mediaUrl: s.media_url,
            mediaType: s.media_type as any,
            content: { audioUrl: s.media_url },
            timestamp: new Date(s.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }))}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}

      {isVoiceRecorderOpen && (
        <VoiceNoteRecorderModal
          open={isVoiceRecorderOpen}
          onClose={() => setIsVoiceRecorderOpen(false)}
          onPublished={() => {
            refreshNotes();
            setIsVoiceRecorderOpen(false);
          }}
          mode="note"
        />
      )}
    </div>
  );
}

export default Home;
