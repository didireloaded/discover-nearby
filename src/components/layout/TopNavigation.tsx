import { useState } from "react";
import { Headphones, Heart, MessageCircle, ChevronDown, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/common/Avatar";
import { routes } from "@/app/navigation";
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

  const displayName = profile?.display_name || profile?.username || "Guest User";

  return (
    <>
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-5 pb-2 bg-[#090807]"
        style={{
          paddingTop: "calc(12px + env(safe-area-inset-top))",
        }}
      >
        {/* 1. Left Action: User Identity */}
        <div
          onClick={() => navigate(routes.profile())}
          className="flex items-center gap-2.5 cursor-pointer group hover:opacity-90 transition min-w-0"
        >
          <Avatar
            size={36}
            profile={{
              id: profile?.id || "me",
              display_name: displayName,
              avatar_url: profile?.avatar_url,
            }}
            className="rounded-full shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-white leading-tight truncate font-display">
              {displayName}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCityModalOpen(true);
                }}
                className="flex items-center gap-0.5 text-[11px] text-white/50 hover:text-white transition"
              >
                <span>{selectedCity}</span>
                <ChevronDown size={10} />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Right Actions: Naked Icons with 44px hit targets */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => navigate(routes.rooms())}
            className="w-11 h-11 flex items-center justify-center text-white/70 hover:text-white transition active:scale-95"
            aria-label="Rooms"
            title="Rooms"
          >
            <Headphones size={20} />
          </button>

          <button
            onClick={() => navigate(routes.activity())}
            className="w-11 h-11 flex items-center justify-center text-white/70 hover:text-white transition active:scale-95"
            aria-label="Activity"
            title="Activity"
          >
            <Heart size={20} />
          </button>

          <button
            onClick={() => navigate(routes.inbox())}
            className="relative w-11 h-11 flex items-center justify-center text-white/70 hover:text-white transition active:scale-95"
            aria-label="Messages"
            title="Messages"
          >
            <MessageCircle size={20} />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-[#FFB800]" />
          </button>
        </div>
      </header>

      {/* City Selector Modal */}
      {isCityModalOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl p-5 bg-[#1C1714] text-white border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold font-display">Select Location</h3>
              <button
                onClick={() => setIsCityModalOpen(false)}
                className="p-1 text-white/50 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
              {NAMIBIAN_CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => handleSelectCity(city)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-left transition ${
                    selectedCity === city
                      ? "bg-[#FFB800] text-black font-bold"
                      : "text-white/80 hover:bg-white/5"
                  }`}
                >
                  <span>{city}, Namibia</span>
                  {selectedCity === city && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
