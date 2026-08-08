import { useState, useEffect } from "react";
import { Search, Radio, Calendar, Users, ChevronRight, UserPlus, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/common/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function Discovery() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    "all" | "voice" | "rooms" | "events" | "people"
  >("all");

  const [people, setPeople] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDiscoveryData() {
      setLoading(true);
      try {
        const { data: dbProfiles } = await supabase.from("profiles").select("*").limit(10);

        if (dbProfiles && dbProfiles.length > 0) {
          setPeople(
            dbProfiles.map((p) => ({
              id: p.id,
              name: p.display_name || p.username || "Creator",
              username: p.username || "creator",
              avatar: p.avatar_url,
              location: p.location || "Windhoek, Namibia",
            })),
          );
        } else {
          setPeople([
            {
              id: "usr-1",
              name: "Hanna Dowie",
              username: "hanna_d",
              avatar:
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
              location: "Windhoek, Namibia",
            },
            {
              id: "usr-2",
              name: "Lukas Shilongo",
              username: "lukas_vibe",
              avatar:
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
              location: "Swakopmund, Namibia",
            },
            {
              id: "usr-3",
              name: "Michelle V.",
              username: "michelle_voice",
              avatar:
                "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
              location: "Walvis Bay, Namibia",
            },
          ]);
        }

        const { data: dbRooms } = await supabase
          .from("voice_rooms")
          .select("*, profiles(*)")
          .order("created_at", { ascending: false })
          .limit(5);

        if (dbRooms && dbRooms.length > 0) {
          setRooms(
            dbRooms.map((r) => ({
              id: r.id,
              title: r.title,
              host: r.profiles?.display_name || "Host",
              avatar: r.profiles?.avatar_url,
              listeners: r.max_speakers || 12,
              type: r.room_type || "voice",
            })),
          );
        } else {
          setRooms([
            {
              id: "room-1",
              title: "Windhoek Acoustic Lounge & Chill",
              host: "Lukas Shilongo",
              avatar:
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
              listeners: 34,
              type: "voice",
            },
            {
              id: "room-2",
              title: "Swakopmund Karaoke Stage",
              host: "Michelle V.",
              avatar:
                "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
              listeners: 89,
              type: "karaoke",
            },
          ]);
        }

        const { data: dbEvents } = await supabase.from("events").select("*").limit(3);

        if (dbEvents && dbEvents.length > 0) {
          setEvents(dbEvents);
        } else {
          setEvents([
            {
              id: "evt-1",
              title: "Windhoek Street Food & Acoustic Fest",
              location: "Independence Ave, Windhoek",
              start_time: new Date(Date.now() + 86400000 * 2).toISOString(),
              attendees_count: 142,
            },
            {
              id: "evt-2",
              title: "Swakopmund Sunset Live Beach Jam",
              location: "Mole Beach, Swakopmund",
              start_time: new Date(Date.now() + 86400000 * 4).toISOString(),
              attendees_count: 88,
            },
          ]);
        }
      } catch (err) {
        console.error("Error loading discovery data", err);
      } finally {
        setLoading(false);
      }
    }

    loadDiscoveryData();
  }, []);

  const filteredPeople = people.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.username.toLowerCase().includes(query.toLowerCase()) ||
      p.location.toLowerCase().includes(query.toLowerCase()),
  );

  const filteredRooms = rooms.filter((r) => r.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="flex flex-col min-h-full pb-28 pt-2 space-y-5 bg-[#0B0A09] text-white">
      {/* 1. Header & Permanent Search Bar */}
      <div className="px-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight font-display">Discover</h1>
            <p className="text-xs text-white/50">Find your favorite Namibian creators & content</p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 text-xs font-bold">
            <MapPin size={13} className="text-[#FFB800]" />
            <span>Windhoek</span>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Namibian creators, notes, rooms & events..."
            className="w-full h-11 pl-11 pr-4 rounded-full bg-[#181513] text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#FFB800] transition border border-white/10"
          />
        </div>
      </div>

      {/* 2. Category Filter Tabs */}
      <div className="px-5 flex gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: "all", label: "All Explore" },
          { id: "people", label: "People Nearby" },
          { id: "rooms", label: "Live Rooms", icon: Radio },
          { id: "events", label: "Events", icon: Calendar },
        ].map((tab) => {
          const isActive = activeCategory === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? "bg-[#FFB800] text-black shadow-md"
                  : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {Icon && <Icon size={13} />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Live Voice Rooms Section */}
      {(activeCategory === "all" || activeCategory === "rooms") && (
        <div className="px-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio size={16} className="text-[#FFB800] animate-pulse" />
              <h2 className="text-sm font-bold text-white tracking-wide">Live Rooms Now</h2>
            </div>
            <button
              onClick={() => navigate("/rooms")}
              className="text-xs font-bold text-[#FFB800] hover:underline flex items-center gap-0.5"
            >
              <span>View all</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => navigate(`/rooms/${room.id}`)}
                className="p-4 rounded-[22px] bg-[#181513] border border-white/10 hover:border-[#FFB800]/50 transition cursor-pointer active:scale-[0.98] flex items-center justify-between shadow-xl"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <Avatar
                      size={44}
                      profile={{ id: room.id, display_name: room.host, avatar_url: room.avatar }}
                    />
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#FFB800] border-2 border-[#181513]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{room.title}</h3>
                    <p className="text-xs text-white/60">
                      Hosted by @{room.host.toLowerCase().replace(/\s+/g, "_")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 text-white text-xs font-bold border border-white/10">
                  <Users size={13} className="text-[#FFB800]" />
                  <span>{room.listeners} listening</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. People Nearby Section */}
      {(activeCategory === "all" || activeCategory === "people") && (
        <div className="px-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-[#FFB800]" />
              <h2 className="text-sm font-bold text-white tracking-wide">
                People Nearby in Namibia
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {filteredPeople.map((user) => (
              <div
                key={user.id}
                className="p-3.5 rounded-[20px] bg-[#181513] border border-white/10 flex items-center justify-between hover:border-white/20 transition"
              >
                <div
                  onClick={() => navigate(`/profile/${user.username}`)}
                  className="flex items-center gap-3 cursor-pointer group hover:opacity-90 transition"
                >
                  <Avatar
                    size={42}
                    profile={{ id: user.id, display_name: user.name, avatar_url: user.avatar }}
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight group-hover:text-[#FFB800] transition">
                      {user.name}
                    </h3>
                    <p className="text-xs text-white/50">
                      @{user.username} • {user.location}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-white/80 text-[10px] font-semibold border border-white/10">
                        <Users size={10} className="text-[#FFB800]" />
                        {user.id === "usr-1"
                          ? "3 mutual friends"
                          : user.id === "usr-2"
                            ? "Both in Windhoek Creators"
                            : "Attending Swakop Sessions"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    toast.success(`Followed @${user.username}!`);
                    navigate(`/profile/${user.username}`);
                  }}
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#FFB800] text-black text-xs font-bold shadow-md transition active:scale-95 hover:bg-[#FFB800]/90"
                >
                  <UserPlus size={13} />
                  <span>Follow</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Events Happening Soon */}
      {(activeCategory === "all" || activeCategory === "events") && (
        <div className="px-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-[#FFB800]" />
              <h2 className="text-sm font-bold text-white tracking-wide">
                Namibian Events This Week
              </h2>
            </div>
            <button
              onClick={() => navigate("/events")}
              className="text-xs font-bold text-[#FFB800] hover:underline flex items-center gap-0.5"
            >
              <span>View all</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {events.map((evt) => (
              <div
                key={evt.id}
                onClick={() => navigate(`/events/${evt.id}`)}
                className="p-4 rounded-[22px] bg-[#181513] border border-white/10 hover:border-[#FFB800]/50 transition cursor-pointer active:scale-[0.98] flex items-center justify-between shadow-xl"
              >
                <div>
                  <h3 className="text-sm font-bold text-white">{evt.title}</h3>
                  <p className="text-xs text-white/50">{evt.location}</p>
                </div>
                <button className="px-3 py-1 rounded-full bg-[#FFB800]/15 text-[#FFB800] text-xs font-bold border border-[#FFB800]/30">
                  Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Discovery;
