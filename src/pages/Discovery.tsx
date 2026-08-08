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

        if (dbProfiles) {
          setPeople(
            dbProfiles.map((p) => ({
              id: p.id,
              name: p.display_name || p.username || "Creator",
              username: p.username || "creator",
              avatar: p.avatar_url,
              location: p.location || "Windhoek, Namibia",
            })),
          );
        }

        const { data: dbRooms } = await supabase
          .from("voice_rooms")
          .select("*, profiles(*)")
          .order("created_at", { ascending: false })
          .limit(5);

        if (dbRooms) {
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
        }

        const { data: dbEvents } = await supabase.from("events").select("*").limit(3);

        if (dbEvents) {
          setEvents(dbEvents);
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
    <div className="flex flex-col min-h-full pb-28 pt-2 space-y-4 bg-[#0B0A09] text-white">
      {/* 1. Header & Search Bar */}
      <div className="px-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight font-display">Explore</h1>
            <p className="text-xs text-white/50">Find Namibian creators, voice rooms & events</p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search creators, rooms or events..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#181513] text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#FFB800] transition border border-white/10"
          />
        </div>
      </div>

      {/* 2. Category Filter Tabs */}
      <div className="px-5 flex gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: "all", label: "All Explore" },
          { id: "people", label: "People" },
          { id: "rooms", label: "Rooms", icon: Radio },
          { id: "events", label: "Events", icon: Calendar },
        ].map((tab) => {
          const isActive = activeCategory === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? "bg-[#FFB800] text-black font-bold"
                  : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {Icon && <Icon size={12} />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Main Explore Stream */}
      <div className="px-5 space-y-5">
        {/* People Section */}
        {(activeCategory === "all" || activeCategory === "people") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white/80">
                <Users size={14} className="text-[#FFB800]" />
                <span>Creators</span>
              </div>
              <button
                onClick={() => navigate("/explore/people")}
                className="text-[11px] text-[#FFB800] font-semibold flex items-center gap-0.5 hover:underline"
              >
                <span>See All</span>
                <ChevronRight size={12} />
              </button>
            </div>

            <div className="space-y-2">
              {filteredPeople.length > 0 ? (
                filteredPeople.map((person) => (
                  <div
                    key={person.id}
                    onClick={() => navigate(`/profile/${person.username}`)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#181513] border border-white/10 hover:border-white/20 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        size={36}
                        profile={{
                          id: person.id,
                          display_name: person.name,
                          avatar_url: person.avatar,
                        }}
                        className="rounded-full shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{person.name}</p>
                        <p className="text-[10px] text-white/40 truncate">@{person.username}</p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.success(`Following @${person.username}`);
                      }}
                      className="flex items-center gap-1 px-3 py-1 rounded-xl bg-[#FFB800] text-black font-bold text-[11px] hover:bg-[#FFB800]/90 transition"
                    >
                      <UserPlus size={12} />
                      <span>Follow</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-6 px-4 rounded-2xl bg-[#181513] text-center text-xs text-white/40">
                  No creators found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live Audio Rooms Section */}
        {(activeCategory === "all" || activeCategory === "rooms") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white/80">
                <Radio size={14} className="text-[#FFB800]" />
                <span>Live Audio Rooms</span>
              </div>
              <button
                onClick={() => navigate("/rooms")}
                className="text-[11px] text-[#FFB800] font-semibold flex items-center gap-0.5 hover:underline"
              >
                <span>See All</span>
                <ChevronRight size={12} />
              </button>
            </div>

            <div className="space-y-2">
              {filteredRooms.length > 0 ? (
                filteredRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => navigate(`/room/${room.id}`)}
                    className="p-3.5 rounded-2xl bg-[#181513] border border-white/10 hover:border-white/20 transition cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-white truncate max-w-[220px]">
                        {room.title}
                      </h3>
                      <span className="flex items-center gap-1 text-[10px] text-[#10b981] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                        LIVE
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <Avatar
                          size={24}
                          profile={{
                            id: room.id,
                            display_name: room.host,
                            avatar_url: room.avatar,
                          }}
                        />
                        <span className="text-[11px] text-white/60">Host: {room.host}</span>
                      </div>
                      <span className="px-3 py-1 rounded-xl bg-[#FFB800] text-black text-[11px] font-bold">
                        Join
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 px-4 rounded-2xl bg-[#181513] text-center text-xs text-white/40">
                  No active voice rooms
                </div>
              )}
            </div>
          </div>
        )}

        {/* Events Section */}
        {(activeCategory === "all" || activeCategory === "events") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white/80">
                <Calendar size={14} className="text-[#FFB800]" />
                <span>Upcoming Events</span>
              </div>
              <button
                onClick={() => navigate("/events")}
                className="text-[11px] text-[#FFB800] font-semibold flex items-center gap-0.5 hover:underline"
              >
                <span>See All</span>
                <ChevronRight size={12} />
              </button>
            </div>

            <div className="space-y-2">
              {events.length > 0 ? (
                events.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => navigate(`/event/${evt.id}`)}
                    className="p-3.5 rounded-2xl bg-[#181513] border border-white/10 hover:border-white/20 transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{evt.title}</p>
                      <p className="text-[11px] text-white/40 mt-0.5">
                        {evt.location || "Windhoek"}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-white/10 text-white text-[11px] font-semibold">
                      View
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 px-4 rounded-2xl bg-[#181513] text-center text-xs text-white/40">
                  No upcoming events scheduled
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Discovery;
