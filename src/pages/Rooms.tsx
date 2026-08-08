import { useState } from "react";
import { Radio, Music2, Users, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/common/Avatar";
import { USERS } from "@/data/dummy";
import { toast } from "sonner";

export function Rooms() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"karaoke" | "voice">("karaoke");

  const karaokeRooms = [
    {
      id: "demo-room-1",
      title: "Namibian Hits Karaoke Session",
      song: "Gazza — Kickey",
      singer: USERS[0],
      listeners: 142,
      queueCount: 4,
    },
    {
      id: "demo-room-2",
      title: "Afrobeats & Acoustic Vibes",
      song: "Burna Boy — Last Last",
      singer: USERS[1],
      listeners: 89,
      queueCount: 2,
    },
  ];

  const voiceRooms = [
    {
      id: "voice-1",
      title: "Windhoek Creative Industry Dialogue",
      topic: "Independent music production & distribution in Southern Africa",
      participant_count: 54,
      profiles: USERS[2],
    },
    {
      id: "voice-2",
      title: "Swakopmund Sunset Lounge",
      topic: "Relaxed open-mic voice notes and storytelling",
      participant_count: 28,
      profiles: USERS[3],
    },
  ];

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
          onClick={() => {
            toast.success("Voice Room created! Joining stage...");
            navigate("/rooms/voice-1");
          }}
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
        </div>
      </div>

      {/* Rooms Content */}
      <div className="px-5 flex-1 space-y-4">
        {activeTab === "karaoke" ? (
          /* Karaoke Rooms */
          <div className="space-y-4">
            {karaokeRooms.map((room) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/karaoke/${room.id}`)}
                className="relative overflow-hidden rounded-[24px] bg-[#181513] p-5 cursor-pointer group border border-white/10 hover:border-[#FFB800]/50 transition shadow-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFB800]/15 border border-[#FFB800]/40 text-[#FFB800] text-[10px] font-bold uppercase tracking-wider">
                    <span className="h-2 w-2 rounded-full bg-[#FFB800] animate-ping" />
                    KARAOKE LIVE
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-white/60">
                    <Users size={14} className="text-white/40" />
                    <span>{room.listeners} listening</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-[#FFB800] transition">
                  {room.title}
                </h3>

                <div className="mt-3 flex items-center gap-3 bg-white/[0.04] p-3 rounded-2xl border border-white/5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFB800]/20 text-[#FFB800]">
                    <Music2 size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{room.song}</p>
                    <p className="text-[11px] text-white/50 truncate">
                      Singing: {room.singer.name}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-[#10b981] bg-[#10b981]/15 px-2.5 py-1 rounded-full border border-[#10b981]/30">
                    {room.queueCount} in queue
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Voice Rooms */
          <div className="space-y-4">
            {voiceRooms.map((room) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/rooms/${room.id}`)}
                className="relative overflow-hidden rounded-[24px] bg-[#181513] p-5 cursor-pointer group border border-white/10 hover:border-[#FFB800]/50 transition shadow-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFB800]/15 border border-[#FFB800]/40 text-[#FFB800] text-[10px] font-bold uppercase tracking-wider">
                    <span className="h-2 w-2 rounded-full bg-[#FFB800] animate-ping" />
                    VOICE ROOM
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-white/60">
                    <Users size={14} className="text-white/40" />
                    <span>{room.participant_count || 42} inside</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-[#FFB800] transition">
                  {room.title}
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  {room.topic || "Open community dialogue"}
                </p>

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <Avatar
                      size={28}
                      profile={{
                        id: (room.profiles as any)?.id || "host",
                        display_name:
                          (room.profiles as any)?.display_name ||
                          (room.profiles as any)?.name ||
                          "Host",
                        avatar_url:
                          (room.profiles as any)?.avatar_url ||
                          (room.profiles as any)?.avatar ||
                          "",
                      }}
                    />
                    <span className="text-xs text-white/70">
                      Host:{" "}
                      {(room.profiles as any)?.display_name ||
                        (room.profiles as any)?.name ||
                        "Member"}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-black bg-[#FFB800] px-3.5 py-1.5 rounded-full shadow-md hover:bg-[#FFB800]/90">
                    Join Room
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Rooms;
