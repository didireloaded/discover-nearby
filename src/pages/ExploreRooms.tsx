import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Radio } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Avatar } from "@/components/common/Avatar";
import { SkeletonList } from "@/components/common/SkeletonLoader";

export default function ExploreRooms() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRooms() {
      try {
        const { data } = await supabase
          .from("voice_rooms")
          .select("*, profiles!voice_rooms_host_id_fkey(display_name, username, avatar_url)")
          .order("created_at", { ascending: false })
          .limit(20);

        if (data) setRooms(data);
      } catch (err) {
        console.error("Failed to load rooms:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRooms();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0A09] text-white pb-28">
      <div className="sticky top-0 z-40 bg-[#0B0A09] border-b border-white/10 px-4 h-14 flex items-center gap-3">
        <button
          onClick={() => navigate("/explore")}
          className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-bold text-base font-display">Live Rooms</h1>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <SkeletonList />
        ) : rooms.length > 0 ? (
          rooms.map((room) => {
            const isKaraoke = room.room_type === "karaoke";
            const targetRoute = isKaraoke ? `/rooms/karaoke/${room.id}` : `/rooms/voice/${room.id}`;

            return (
              <div
                key={room.id}
                onClick={() => navigate(targetRoute)}
                className="w-full text-left bg-[#181513] rounded-2xl border border-white/10 p-4 space-y-3 hover:border-white/20 transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#10b981]">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                    <span>LIVE STAGE</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 text-[10px] font-semibold uppercase">
                    {room.room_type || "voice"}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white tracking-tight">{room.title}</h3>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <Avatar
                      size={28}
                      profile={{
                        id: room.host_id,
                        display_name: room.profiles?.display_name,
                        avatar_url: room.profiles?.avatar_url,
                      }}
                      className="rounded-full"
                    />
                    <span className="text-xs text-white/60">
                      Host: {room.profiles?.display_name || "Creator"}
                    </span>
                  </div>

                  <span className="px-3 py-1 rounded-xl bg-[#FFB800] text-black text-xs font-bold">
                    Join Stage
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-10 text-center text-xs text-white/40 bg-[#181513] rounded-2xl border border-white/10 space-y-2">
            <Radio size={24} className="mx-auto text-white/30" />
            <p className="font-bold text-white/70">No active audio rooms</p>
            <p className="text-[11px] text-white/40 max-w-[200px] mx-auto">
              Start a voice room to go live for your followers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
