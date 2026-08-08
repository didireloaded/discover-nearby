import { Home, Search, Plus, Bell, User } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { routes } from "@/app/navigation";

interface BottomNavigationProps {
  onOpenCreate?: () => void;
  compact?: boolean;
}

export function BottomNavigation({ onOpenCreate, compact = false }: BottomNavigationProps) {
  const location = useLocation();
  const path = location.pathname;

  const isHomeActive = path === "/";
  const isExploreActive = path === "/explore" || path.startsWith("/explore");
  const isActivityActive =
    path === "/activity" || path === "/notifications" || path.startsWith("/notifications");
  const isProfileActive = path === "/profile" || path.startsWith("/profile");

  return (
    <nav
      className={`fixed left-1/2 z-50 grid grid-cols-5 items-center -translate-x-1/2 overflow-hidden rounded-full border border-white/10 bg-[#1C1714] shadow-2xl transition-all duration-300 ease-out ${
        compact
          ? "bottom-3 h-11 w-[72%] max-w-[290px] px-1 opacity-90 scale-95"
          : "bottom-5 h-14 w-[92%] max-w-[390px] px-2 opacity-100 scale-100"
      }`}
      style={{
        marginBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* 1. Home */}
      <Link
        to={routes.home()}
        className="relative flex items-center justify-center py-1.5 transition active:scale-95 text-white/60 hover:text-white"
        aria-label="Home"
      >
        <div
          className={`flex items-center justify-center p-2 rounded-full transition ${
            isHomeActive ? "text-[#FFB800]" : "text-white/60 hover:text-white"
          }`}
        >
          <Home size={20} strokeWidth={isHomeActive ? 2.5 : 2} />
        </div>
        {isHomeActive && <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-[#FFB800]" />}
      </Link>

      {/* 2. Explore */}
      <Link
        to={routes.explore()}
        className="relative flex items-center justify-center py-1.5 transition active:scale-95 text-white/60 hover:text-white"
        aria-label="Explore"
      >
        <div
          className={`flex items-center justify-center p-2 rounded-full transition ${
            isExploreActive ? "text-[#FFB800]" : "text-white/60 hover:text-white"
          }`}
        >
          <Search size={20} strokeWidth={isExploreActive ? 2.5 : 2} />
        </div>
        {isExploreActive && (
          <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-[#FFB800]" />
        )}
      </Link>

      {/* 3. Center Create Trigger */}
      <button
        onClick={onOpenCreate}
        className={`mx-auto flex shrink-0 items-center justify-center rounded-full bg-white text-black shadow-md border border-white active:scale-90 transition-all ${
          compact ? "h-8 w-8" : "h-10 w-10"
        }`}
        aria-label="Create"
      >
        <Plus size={compact ? 18 : 22} strokeWidth={3} className="text-black" />
      </button>

      {/* 4. Activity */}
      <Link
        to={routes.activity()}
        className="relative flex items-center justify-center py-1.5 transition active:scale-95 text-white/60 hover:text-white"
        aria-label="Activity"
      >
        <div
          className={`flex items-center justify-center p-2 rounded-full transition ${
            isActivityActive ? "text-[#FFB800]" : "text-white/60 hover:text-white"
          }`}
        >
          <Bell size={20} strokeWidth={isActivityActive ? 2.5 : 2} />
        </div>
        {isActivityActive && (
          <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-[#FFB800]" />
        )}
      </Link>

      {/* 5. Profile */}
      <Link
        to={routes.profile()}
        className="relative flex items-center justify-center py-1.5 transition active:scale-95 text-white/60 hover:text-white"
        aria-label="Profile"
      >
        <div
          className={`flex items-center justify-center p-2 rounded-full transition ${
            isProfileActive ? "text-[#FFB800]" : "text-white/60 hover:text-white"
          }`}
        >
          <User size={20} strokeWidth={isProfileActive ? 2.5 : 2} />
        </div>
        {isProfileActive && (
          <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-[#FFB800]" />
        )}
      </Link>
    </nav>
  );
}
