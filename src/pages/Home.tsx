import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Mic, Radio } from "lucide-react";
import { useNotes } from "@/hooks/useNotes";
import { NoteCard } from "@/components/feed/NoteCard";
import { StoryService } from "@/services/stories";
import { Avatar } from "@/components/common/Avatar";
import { SkeletonList } from "@/components/common/SkeletonLoader";
import { CreateStoryModal } from "@/components/stories/CreateStoryModal";
import { VoiceNoteRecorderModal } from "@/components/voice/VoiceNoteRecorderModal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { routes } from "@/app/navigation";

export function Home() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { notes, loading, error, refreshNotes, feedTab, setFeedTab } = useNotes("discover");
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

  return (
    <div className="flex flex-col min-h-full pb-28 pt-1 bg-[#090807] text-white">
      {/* 1. Quiet Stream Header */}
      <div className="px-5 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <button
            onClick={() => setFeedTab("discover")}
            className={`pb-1 text-base font-bold transition relative font-display ${
              feedTab === "discover"
                ? "text-white border-b-2 border-[#FFB800]"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            Discover
          </button>
          <button
            onClick={() => setFeedTab("following")}
            className={`pb-1 text-base font-bold transition relative font-display ${
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
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FFB800] text-black text-xs font-bold shadow-md hover:bg-[#FFB800]/90 transition active:scale-95 shrink-0"
        >
          <Mic size={14} />
          <span>Voice Note</span>
        </button>
      </div>

      {/* 2. Stories Rail (Clean Circular Frames) */}
      <div className="px-5 mb-4 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-3.5">
          {/* Add Story Button */}
          <button
            onClick={() => setIsStoryModalOpen(true)}
            className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
          >
            <div className="relative h-14 w-14 rounded-full bg-[#14110F] border border-dashed border-white/30 p-0.5 flex items-center justify-center group-hover:border-[#FFB800] transition">
              <Avatar
                size={48}
                profile={
                  profile
                    ? {
                        id: profile.id,
                        display_name: profile.display_name,
                        avatar_url: profile.avatar_url,
                      }
                    : undefined
                }
                className="w-full h-full rounded-full object-cover opacity-60"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-5 w-5 rounded-full bg-[#FFB800] text-black flex items-center justify-center shadow-md">
                  <Plus size={12} className="stroke-[3]" />
                </div>
              </div>
            </div>
            <span className="text-[11px] font-medium text-white/70">Your Story</span>
          </button>

          {/* Real Stories */}
          {stories.map((story) => (
            <button
              key={story.id}
              onClick={() => navigate(routes.story(story.id))}
              className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
            >
              <div className="h-14 w-14 rounded-full p-0.5 border-2 border-[#FFB800]">
                <img
                  src={
                    story.media_url ||
                    story.profiles?.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.id}`
                  }
                  alt="Story"
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
              <span className="text-[11px] font-medium text-white/80 max-w-[60px] truncate">
                {story.profiles?.display_name || story.profiles?.username || "Creator"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Live Rooms Natural Insertion (If Active) */}
      {liveRooms.length > 0 && (
        <div className="px-5 mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/60 uppercase tracking-wider">
              Live Voice Stages
            </span>
            <button
              onClick={() => navigate(routes.rooms())}
              className="text-[11px] font-bold text-[#FFB800]"
            >
              See all
            </button>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
            {liveRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => navigate(routes.voiceRoom(room.id))}
                className="shrink-0 w-64 p-3.5 rounded-[20px] bg-[#1C1714] border border-white/10 space-y-2 cursor-pointer hover:border-white/20 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#FF493D]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF493D] animate-pulse" />
                    LIVE
                  </span>
                  <Radio size={12} className="text-white/40" />
                </div>
                <p className="text-xs font-bold text-white truncate">{room.title}</p>
                <p className="text-[11px] text-white/50 truncate">
                  Host: {room.profiles?.display_name || "Creator"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Stream Content Feed */}
      <div className="px-5 space-y-4">
        {loading ? (
          <SkeletonList />
        ) : error ? (
          <div className="p-8 text-center bg-[#14110F] rounded-2xl border border-white/10 space-y-2">
            <p className="text-xs text-white/60">Failed to load home feed notes.</p>
            <button
              onClick={() => refreshNotes()}
              className="px-4 py-1.5 rounded-xl bg-[#FFB800] text-black text-xs font-bold"
            >
              Retry
            </button>
          </div>
        ) : notes.length === 0 ? (
          <div className="p-10 text-center bg-[#14110F] rounded-2xl border border-white/10 space-y-2">
            <p className="text-sm font-bold text-white">No Notes in stream yet</p>
            <p className="text-xs text-white/50 max-w-[220px] mx-auto">
              Be the first to share a Voice or Permanent Note on Matisa!
            </p>
            <button
              onClick={() => setIsVoiceRecorderOpen(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-[#FFB800] text-black text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Mic size={14} />
              <span>Record Voice Note</span>
            </button>
          </div>
        ) : (
          notes.map((note) => <NoteCard key={note.id} note={note} onRefresh={refreshNotes} />)
        )}
      </div>

      {/* Create Story Modal */}
      {isStoryModalOpen && (
        <CreateStoryModal
          open={isStoryModalOpen}
          onClose={() => {
            setIsStoryModalOpen(false);
            StoryService.getFeedStories().then((res) => setStories(res || []));
          }}
        />
      )}

      {/* Voice Recorder Modal */}
      {isVoiceRecorderOpen && (
        <VoiceNoteRecorderModal
          open={isVoiceRecorderOpen}
          onClose={() => setIsVoiceRecorderOpen(false)}
          onPublished={() => {
            setIsVoiceRecorderOpen(false);
            refreshNotes();
          }}
        />
      )}
    </div>
  );
}
