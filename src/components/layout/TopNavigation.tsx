import { useState } from "react";
import { Headphones, Heart, MessageCircle, MapPin, ChevronDown, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/common/Avatar";
import { toast } from "sonner";

const NAMIBIAN_CITIES = [
  "Windhoek",
  "Swakopmund",
  "Walvis Bay",
  "Oshakati",
  "Rundu",
  "Lüderitz",
  "Katima Mulilo",
];

export function TopNavigation() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [selectedCity, setSelectedCity] = useState(() => {
    return localStorage.getItem("matisa_user_city") || "Windhoek";
  });
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    localStorage.setItem("matisa_user_city", city);
    setIsCityModalOpen(false);
    toast.success(`Location set to ${city}, Namibia`);
  };

  const displayName = profile?.display_name || "Budiarti Rohman";
  const username = profile?.username || "budiartirohman";

  return (
    <>
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-5 pb-3 bg-gradient-to-b from-[#0B0A09] via-[#0B0A09]/95 to-transparent backdrop-blur-md"
        style={{
          paddingTop: "calc(12px + env(safe-area-inset-top))",
        }}
      >
        {/* 1. Left Action: User Avatar & Handle */}
        <div
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2.5 cursor-pointer group hover:opacity-90 transition min-w-0"
        >
          <Avatar
            size={38}
            profile={{
              id: profile?.id || "me",
              display_name: displayName,
              avatar_url: profile?.avatar_url,
            }}
            className="rounded-full ring-2 ring-[#FFB800]/50"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-white leading-tight truncate group-hover:text-[#FFB800] transition">
              {displayName}
            </span>
            <span className="text-[11px] text-white/50 truncate">@{username}</span>
          </div>
        </div>

        {/* 2. Center Location Pill */}
        <button
          onClick={() => setIsCityModalOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 text-white/80 hover:text-white text-[10px] font-bold border border-white/10 transition active:scale-95 shrink-0"
        >
          <MapPin size={9} className="text-[#FFB800]" />
          <span>{selectedCity}</span>
          <ChevronDown size={9} className="text-white/50" />
        </button>

        {/* 3. Right Header Actions (Audio, Heart/Activity, Messages) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate("/rooms")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/80 hover:text-white transition active:scale-95 border border-white/10"
            aria-label="Rooms"
            title="Rooms"
          >
            <Headphones size={16} />
          </button>

          <button
            onClick={() => navigate("/activity")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/80 hover:text-white transition active:scale-95 border border-white/10"
            aria-label="Activity"
            title="Activity"
          >
            <Heart size={16} />
          </button>

          <button
            onClick={() => navigate("/messages")}
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/80 hover:text-white transition active:scale-95 border border-white/10"
            aria-label="Messages"
            title="Messages"
          >
            <MessageCircle size={16} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#FFB800] shadow-[0_0_6px_#FFB800]" />
          </button>
        </div>
      </header>

      {/* City Selector Modal */}
      {isCityModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xs rounded-[28px] glass-panel-elevated p-5 bg-[#181513] text-white border border-white/20 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-[#FFB800]" />
                <h3 className="text-sm font-bold">Select Your City</h3>
              </div>
              <button
                onClick={() => setIsCityModalOpen(false)}
                className="p-1 text-white/50 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {NAMIBIAN_CITIES.map((city) => {
                const isSelected = city === selectedCity;
                return (
                  <button
                    key={city}
                    onClick={() => handleSelectCity(city)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isSelected
                        ? "bg-[#FFB800] text-black font-bold"
                        : "hover:bg-white/10 text-white/80"
                    }`}
                  >
                    <span>{city}, Namibia</span>
                    {isSelected && <Check size={14} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TopNavigation;
