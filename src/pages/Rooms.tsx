import { useState, useEffect } from "react";
import { Radio, Music2, Users, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/common/Avatar";
import { supabase } from "@/lib/supabase";
import { SkeletonList } from "@/components/common/SkeletonLoader";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function Rooms() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"karaoke" | "voice">("voice");
  const [dbRooms, setDbRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRooms() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("voice_rooms")
          .select("*, profiles!voice_rooms_host_id_fkey(id, username, display_name, avatar_url)")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setDbRooms(data || []);
      } catch (err) {
        console.error("Error fetching voice rooms:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRooms();
  }, []);

  const handleHostRoom = async () => {
    if (!profile?.id) {
      toast.error("Please sign in to host a Voice Room");
      return;
    }

    try {
      const roomTitle = `${profile.display_name || profile.username}'s Live Room`;
      const { data, error } = await supabase
        .from("voice_rooms")
        .insert({
          host_id: profile.id,
          title: roomTitle,
          topic: "Live Discussion & Voice Notes",
          room_type: activeTab === "karaoke" ? "karaoke" : "audio",
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Voice Room created!");
      if (data?.id) {
        navigate(activeTab === "karaoke" ? `/karaoke/${data.id}` : `/room/${data.id}`);
      }
    } catch (err) {
      console.error("Error creating room:", err);
      toast.error("Failed to create room in database");
    }
  };

  const filteredRooms = dbRooms.filter((room) =>
    activeTab === "karaoke"
      ? room.room_type === "karaoke" || room.title?.toLowerCase().includes("karaoke")
      : room.room_type !== "karaoke",
  );

  return (
    <div className="flex flex-col min-h-full pb-28 pt-2 bg-[#0B0A09] text-white">
      {/* Top Header Row */}
      <div className="px-5 mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-white tracking-tight truncate font-display">
            Audio Rooms & Stage
          </h1>
          <p className="text-xs text-white/50 mt-0.5 truncate">
            Join live voice sessions and karaoke stages
          </p>
        </div>
        <button
          onClick={handleHostRoom}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#FFB800] text-black font-bold text-xs shadow-lg active:scale-95 transition shrink-0 hover:bg-[#FFB800]/90"
        >
          <Plus size={15} strokeWidth={3} />
          <span>Host Room</span>
        </button>
      </div>

      {/* Segmented Tabs: Karaoke vs Voice */}
      <div className="px-5 mb-5">
        <div className="flex rounded-full bg-[#181513] p-1 border border-white/10">
          <button
            onClick={() => setActiveTab("voice")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-xs font-bold transition ${
              activeTab === "voice"
                ? "bg-[#FFB800] text-black shadow-md"
                : "text-white/50 hover:text-white"
            }`}
          >
            <Radio size={15} />
            <span>Voice Rooms</span>
          </button>

          <button
            onClick={() => setActiveTab("karaoke")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-xs font-bold transition ${
              activeTab === "karaoke"
                ? "bg-[#FFB800] text-black shadow-md"
                : "text-white/50 hover:text-white"
            }`}
          >
            <Music2 size={15} />
            <span>Karaoke Stage</span>
          </button>
        </div>
      </div>

      {/* Room Grid Stream */}
      <div className="px-5 space-y-3">
        {loading ? (
          <SkeletonList />
        ) : filteredRooms.length === 0 ? (
          <div className="py-12 px-6 rounded-[24px] bg-[#181513] border border-white/10 text-center space-y-3">
            {activeTab === "karaoke" ? (
              <Music2 size={32} className="mx-auto text-[#FFB800]" />
            ) : (
              <Radio size={32} className="mx-auto text-[#FFB800]" />
            )}
            <p className="text-sm font-bold text-white">
              No active {activeTab === "karaoke" ? "karaoke stages" : "voice rooms"}
            </p>
            <p className="text-xs text-white/40 max-w-[260px] mx-auto leading-relaxed">
              Start a live room to invite creators and host audio sessions in Windhoek!
            </p>
            <button
              onClick={handleHostRoom}
              className="px-5 py-2 rounded-full bg-[#FFB800] text-black text-xs font-bold shadow-md hover:bg-[#FFB800]/90 transition"
            >
              Host {activeTab === "karaoke" ? "Karaoke Stage" : "Voice Room"}
            </button>
          </div>
        ) : (
          filteredRooms.map((room) => (
            <div
              key={room.id}
              onClick={() =>
                navigate(room.room_type === "karaoke" ? `/karaoke/${room.id}` : `/room/${room.id}`)
              }
              className="p-4 rounded-[22px] bg-[#181513] border border-white/10 hover:border-[#FFB800]/40 transition text-left cursor-pointer space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{room.title}</h3>
                  {room.topic && <p className="text-xs text-white/60 mt-1">{room.topic}</p>}
                </div>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10b981]/15 text-[#10b981] text-[10px] font-bold border border-[#10b981]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                  LIVE
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <Avatar
                    size={28}
                    profile={{
                      id: (room.profiles as any)?.id || "host",
                      display_name: (room.profiles as any)?.display_name || "Host",
                      avatar_url: (room.profiles as any)?.avatar_url || "",
                    }}
                  />
                  <span className="text-xs text-white/70">
                    Host: {(room.profiles as any)?.display_name || "Creator"}
                  </span>
                </div>
                <button className="text-xs font-bold text-black bg-[#FFB800] px-3.5 py-1.5 rounded-full shadow-md hover:bg-[#FFB800]/90">
                  Join Stage
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Rooms;
