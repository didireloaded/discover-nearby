import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Mic, Radio, Sparkles } from "lucide-react";
import { useNotes } from "@/hooks/useNotes";
import { NoteCard } from "@/components/feed/NoteCard";
import { StoryService } from "@/services/stories";
import { Avatar } from "@/components/common/Avatar";
import { SkeletonList } from "@/components/common/SkeletonLoader";
import { CreateStoryModal } from "@/components/stories/CreateStoryModal";
import { VoiceNoteRecorderModal } from "@/components/voice/VoiceNoteRecorderModal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export function Home() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { notes, loading, error, refreshNotes, feedTab, setFeedTab } = useNotes("discover");
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>("all");
  const [stories, setStories] = useState<any[]>([]);
  const [liveRooms, setLiveRooms] = useState<any[]>([]);

  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const fetchedStories = await StoryService.getFeedStories();
        setStories(fetchedStories || []);

        const { data: rooms } = await supabase
          .from("voice_rooms")
          .select("*, profiles!voice_rooms_host_id_fkey(display_name, avatar_url, username)")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(5);

        setLiveRooms(rooms || []);
      } catch (err) {
        console.error("Failed to load home feed stories/rooms", err);
      }
    }
    loadData();
  }, []);

  const filteredNotes = notes.filter((note) => {
    if (subCategoryFilter === "all") return true;
    if (subCategoryFilter === "24h") return note.note_kind === "temporary";
    if (subCategoryFilter === "permanent") return note.note_kind === "permanent";
    if (subCategoryFilter === "voice") return note.type === "voice";
    return true;
  });

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

        <button
          onClick={() => setIsVoiceRecorderOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFB800] text-black text-xs font-bold shadow-md hover:bg-[#FFB800]/90 transition active:scale-95"
        >
          <Mic size={14} />
          <span>Voice Note</span>
        </button>
      </div>

      {/* 2. Sub-Category Filter Bar */}
      <div className="px-5 mb-4 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1">
        {[
          { id: "all", label: "All Feed" },
          { id: "24h", label: "24h Notes" },
          { id: "permanent", label: "Permanent" },
          { id: "voice", label: "Voice Only" },
        ].map((filter) => {
          const isActive = subCategoryFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => setSubCategoryFilter(filter.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold shrink-0 transition active:scale-95 border ${
                isActive
                  ? "bg-white text-black font-bold border-white"
                  : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* 3. Stories Bar */}
      <div className="px-5 mb-5 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-3">
          {/* Add Story Button */}
          <button
            onClick={() => setIsStoryModalOpen(true)}
            className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
          >
            <div className="relative h-16 w-16 rounded-[20px] bg-[#181513] border-2 border-dashed border-[#FFB800]/50 p-0.5 flex items-center justify-center group-hover:border-[#FFB800] transition">
              <Avatar
                size={56}
                profile={
                  profile
                    ? {
                        id: profile.id,
                        display_name: profile.display_name,
                        avatar_url: profile.avatar_url,
                      }
                    : undefined
                }
                className="w-full h-full rounded-[16px] object-cover opacity-70"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-6 w-6 rounded-full bg-[#FFB800] text-black flex items-center justify-center shadow-lg">
                  <Plus size={14} className="stroke-[3]" />
                </div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-white/80">Your Story</span>
          </button>

          {/* Real Stories Rail */}
          {stories.map((story) => (
            <button
              key={story.id}
              onClick={() => navigate(`/story/${story.id}`)}
              className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
            >
              <div className="h-16 w-16 rounded-[20px] p-[2px] bg-gradient-to-tr from-[#FFB800] via-[#FF9D2E] to-amber-500 shadow-md">
                <div className="h-full w-full rounded-[18px] bg-[#181513] p-0.5">
                  <img
                    src={
                      story.media_url ||
                      story.profiles?.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.id}`
                    }
                    alt="Story"
                    className="h-full w-full rounded-[16px] object-cover"
                  />
                </div>
              </div>
              <span className="text-[11px] font-semibold text-white/80 max-w-[64px] truncate">
                {story.profiles?.display_name || story.profiles?.username || "Creator"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Active Live Rooms Section (If Any) */}
      {liveRooms.length > 0 && (
        <div className="px-5 mb-5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white/80">
              <Radio size={14} className="text-[#FFB800] animate-pulse" />
              <span>Live Voice Rooms</span>
            </div>
            <button
              onClick={() => navigate("/rooms")}
              className="text-[11px] text-[#FFB800] font-bold hover:underline"
            >
              See All
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {liveRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => navigate(`/room/${room.id}`)}
                className="flex items-center justify-between p-3 rounded-[18px] bg-[#181513] border border-white/10 hover:border-[#FFB800]/40 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                  <div>
                    <p className="text-xs font-bold text-white">{room.title || "Voice Room"}</p>
                    <p className="text-[10px] text-white/50">
                      Host: {room.profiles?.display_name || "Creator"}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#FFB800] text-black text-[11px] font-bold">
                  Join Stage
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Main Feed Notes Stream */}
      <div className="px-5 space-y-4">
        {loading ? (
          <SkeletonList />
        ) : error ? (
          <div className="p-6 rounded-[22px] bg-[#181513] border border-red-500/20 text-center space-y-3">
            <p className="text-xs font-bold text-red-400">Failed to connect to notes database</p>
            <button
              onClick={() => refreshNotes()}
              className="px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-bold hover:bg-white/20"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="p-8 rounded-[22px] bg-[#181513] border border-white/10 text-center space-y-3">
            <Sparkles size={32} className="mx-auto text-[#FFB800]" />
            <p className="text-sm font-bold text-white">No notes published yet</p>
            <p className="text-xs text-white/50 max-w-[260px] mx-auto leading-relaxed">
              Be the first to publish a 24-hour or permanent voice/text note in Windhoek!
            </p>
            <button
              onClick={() => setIsVoiceRecorderOpen(true)}
              className="px-5 py-2 rounded-full bg-[#FFB800] text-black text-xs font-bold shadow-md hover:bg-[#FFB800]/90 transition"
            >
              Record First Note
            </button>
          </div>
        ) : (
          filteredNotes.map((note) => <NoteCard key={note.id} note={note} />)
        )}
      </div>

      {/* Create Modals */}
      {isStoryModalOpen && (
        <CreateStoryModal
          open={isStoryModalOpen}
          onClose={() => {
            setIsStoryModalOpen(false);
            StoryService.getFeedStories().then((res) => setStories(res || []));
          }}
        />
      )}

      {isVoiceRecorderOpen && (
        <VoiceNoteRecorderModal
          open={isVoiceRecorderOpen}
          onClose={() => setIsVoiceRecorderOpen(false)}
          onPublished={() => {
            setIsVoiceRecorderOpen(false);
            refreshNotes();
          }}
          mode="note"
        />
      )}
    </div>
  );
}

export default Home;
