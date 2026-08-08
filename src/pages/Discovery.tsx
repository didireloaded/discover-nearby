import { useState, useEffect } from "react";
import { Search, Radio, Calendar, Users, ChevronRight, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/common/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { routes } from "@/app/navigation";
import { toast } from "sonner";

export function Discovery() {
  const navigate = useNavigate();
  const { requireAuth } = useAuth();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Popular");

  const [people, setPeople] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = ["Popular", "Latest", "Music", "Travel", "Events"];

  useEffect(() => {
    async function loadDiscoveryData() {
      setLoading(true);
      try {
        const { data: dbProfiles } = await supabase.from("profiles").select("*").limit(10);

        if (dbProfiles) {
          setPeople(
            dbProfiles.map((p) => ({
              id: p.id,
              name: p.display_name || p.username || "Creator",
              username: p.username || "creator",
              avatar: p.avatar_url,
              bio: p.bio,
              location: p.location || "Windhoek, Namibia",
            })),
          );
        }

        const { data: dbRooms } = await supabase
          .from("voice_rooms")
          .select("*, profiles!voice_rooms_host_id_fkey(display_name, avatar_url, username)")
          .order("created_at", { ascending: false })
          .limit(5);

        if (dbRooms) setRooms(dbRooms);

        const { data: dbEvents } = await supabase.from("events").select("*").limit(3);
        if (dbEvents) setEvents(dbEvents);
      } catch (err) {
        console.error("Error loading discovery data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDiscoveryData();
  }, []);

  const filteredPeople = query.trim()
    ? people.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.username.toLowerCase().includes(query.toLowerCase()),
      )
    : people;

  return (
    <div className="flex flex-col min-h-full pb-28 pt-1 bg-[#090807] text-white">
      {/* 1. Discover Header */}
      <div className="px-5 mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white font-display tracking-tight">Discover</h1>
            <p className="text-xs text-white/50">Find your favorite creators & content</p>
          </div>

          <button
            onClick={() => navigate(routes.explorePeople())}
            className="p-2 rounded-full bg-[#1C1714] text-white/70 hover:text-white border border-white/10"
            aria-label="Search people"
          >
            <Search size={18} />
          </button>
        </div>

        {/* Inline Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search creators, rooms, events..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#14110F] text-xs text-white placeholder-white/40 border border-white/10 focus:outline-none focus:border-[#FFB800]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                activeCategory === cat
                  ? "bg-[#FFB800] text-black shadow-md"
                  : "bg-[#14110F] text-white/70 border border-white/10 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Live Voice Stages Section */}
      <div className="px-5 mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio size={16} className="text-[#FF493D]" />
            <h2 className="text-sm font-bold text-white font-display">Live Stages</h2>
          </div>
          <button
            onClick={() => navigate(routes.exploreRooms())}
            className="text-xs font-bold text-[#FFB800] flex items-center gap-0.5 hover:underline"
          >
            <span>See all</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {rooms.length > 0 ? (
          <div className="space-y-3">
            {rooms.slice(0, 2).map((room) => (
              <div
                key={room.id}
                onClick={() => navigate(routes.voiceRoom(room.id))}
                className="p-4 rounded-[24px] bg-[#1C1714] border border-white/10 space-y-3 hover:border-white/20 transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#30C878]">
                    <span className="w-2 h-2 rounded-full bg-[#30C878] animate-pulse" />
                    LIVE STAGE
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
                    Join
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-white/40 bg-[#14110F] rounded-2xl border border-white/10">
            No live voice stages right now
          </div>
        )}
      </div>

      {/* 3. Creators Nearby Section */}
      <div className="px-5 mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[#FFB800]" />
            <h2 className="text-sm font-bold text-white font-display">Creators Nearby</h2>
          </div>
          <button
            onClick={() => navigate(routes.explorePeople())}
            className="text-xs font-bold text-[#FFB800] flex items-center gap-0.5 hover:underline"
          >
            <span>See all</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="space-y-2">
          {filteredPeople.slice(0, 4).map((person) => (
            <div
              key={person.id}
              onClick={() => navigate(routes.profile(person.username))}
              className="p-3 rounded-2xl bg-[#1C1714] border border-white/10 flex items-center justify-between hover:border-white/20 transition cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  size={42}
                  profile={{
                    id: person.id,
                    display_name: person.name,
                    avatar_url: person.avatar,
                  }}
                  className="rounded-full shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{person.name}</p>
                  <p className="text-[11px] text-white/40 truncate">@{person.username}</p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  requireAuth(() => toast.success(`Following @${person.username}`));
                }}
                className="flex items-center gap-1 px-3 py-1 rounded-xl bg-[#FFB800] text-black font-bold text-xs hover:bg-[#FFB800]/90 transition shrink-0"
              >
                <UserPlus size={13} />
                <span>Follow</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Upcoming Events Section */}
      <div className="px-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[#FF9A3D]" />
            <h2 className="text-sm font-bold text-white font-display">Upcoming Events</h2>
          </div>
          <button
            onClick={() => navigate(routes.exploreEvents())}
            className="text-xs font-bold text-[#FFB800] flex items-center gap-0.5 hover:underline"
          >
            <span>See all</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {events.length > 0 ? (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => navigate(routes.event(event.id))}
                className="p-4 rounded-[24px] bg-[#1C1714] border border-white/10 space-y-2 hover:border-white/20 transition cursor-pointer"
              >
                <h3 className="text-sm font-bold text-white">{event.title}</h3>
                <p className="text-xs text-white/60">{event.location_name || "Namibia"}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-white/40 bg-[#14110F] rounded-2xl border border-white/10">
            No events scheduled yet
          </div>
        )}
      </div>
    </div>
  );
}
