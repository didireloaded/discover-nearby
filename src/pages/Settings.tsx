import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  LogOut,
  Bell,
  Shield,
  Moon,
  HelpCircle,
  ChevronRight,
  User,
  Lock,
  Wifi,
  Sun,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar } from "@/components/common/Avatar";
import { toast } from "sonner";

export function Settings() {
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const { isOutdoorMode, toggleOutdoorMode } = useTheme();

  const [isDataSaver, setIsDataSaver] = useState<boolean>(() => {
    return localStorage.getItem("matisa_data_saver") === "true";
  });

  const toggleDataSaver = () => {
    const next = !isDataSaver;
    setIsDataSaver(next);
    localStorage.setItem("matisa_data_saver", String(next));
    toast.success(
      next
        ? "Data Saver Enabled: Compressed images & no audio preloading"
        : "Data Saver Disabled: Full quality media",
    );
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      navigate("/auth");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const sections = [
    {
      title: "Account Settings",
      items: [
        { icon: User, label: "Edit Profile Info", action: () => navigate("/profile") },
        {
          icon: Lock,
          label: "Privacy & Anonymous Wall",
          action: () => toast.info("Privacy settings updated"),
        },
        {
          icon: Shield,
          label: "Security & Passkeys",
          action: () => toast.info("Security settings ready"),
        },
      ],
    },
    {
      title: "Regional & Network Optimization",
      items: [
        {
          icon: Wifi,
          label: `Data Saver Mode (${isDataSaver ? "ON" : "OFF"})`,
          action: toggleDataSaver,
        },
        {
          icon: Sun,
          label: `Outdoor Sunlight Mode (${isOutdoorMode ? "ON" : "OFF"})`,
          action: () => {
            toggleOutdoorMode();
            toast.success(
              isOutdoorMode ? "Switched to Sleek Dark Mode" : "Switched to Sunlight Outdoor Mode",
            );
          },
        },
      ],
    },
    {
      title: "Notifications & Audio",
      items: [
        {
          icon: Bell,
          label: "Push & Voicemail Alerts",
          action: () => toast.info("Push notification settings updated"),
        },
        {
          icon: Moon,
          label: "Quiet Mode & Night Hours",
          action: () => toast.info("Quiet mode toggled"),
        },
      ],
    },

    {
      title: "Support & Legal",
      items: [
        {
          icon: HelpCircle,
          label: "Help Center & Feedback",
          action: () => toast.info("Matisa support ready"),
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col min-h-full pb-28 pt-2">
      {/* Header */}
      <div className="px-5 mb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full glass-panel text-white hover:bg-white/10 transition active:scale-95"
          aria-label="Back"
        >
          <ArrowLeft size={19} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Settings & Account</h1>
          <p className="text-xs text-white/50 mt-0.5">Manage preferences, security & privacy</p>
        </div>
      </div>

      <div className="px-5 space-y-5 flex-1">
        {/* User Card */}
        <div className="flex items-center justify-between glass-panel-elevated p-4 rounded-[22px]">
          <div className="flex items-center gap-3.5">
            <Avatar
              size={48}
              profile={{
                id: profile?.id || "me",
                display_name: profile?.display_name || "Member",
                avatar_url: profile?.avatar_url || "",
              }}
            />
            <div>
              <h3 className="text-sm font-bold text-white">
                {profile?.display_name || profile?.username || "Matisa User"}
              </h3>
              <p className="text-xs text-white/40">@{profile?.username || "user"}</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/profile")}
            className="px-3.5 py-1.5 rounded-full bg-[#FFB800]/15 text-[#FFB800] text-xs font-bold border border-[#FFB800]/30 hover:bg-[#FFB800]/25 transition"
          >
            View
          </button>
        </div>

        {/* Setting Groups */}
        {sections.map((sec, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider px-1">
              {sec.title}
            </h3>
            <div className="glass-panel rounded-[22px] overflow-hidden divide-y divide-white/5">
              {sec.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={itemIdx}
                    onClick={item.action}
                    className="w-full flex items-center justify-between p-3.5 text-left transition hover:bg-white/5 active:bg-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/70">
                        <Icon size={16} />
                      </div>
                      <span className="text-xs font-semibold text-white/90">{item.label}</span>
                    </div>
                    <ChevronRight size={16} className="text-white/30" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Logout Action */}
        <div className="pt-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[22px] bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-bold transition hover:bg-red-500/25 active:scale-95"
          >
            <LogOut size={16} />
            <span>Sign Out of Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
