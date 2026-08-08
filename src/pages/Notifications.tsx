import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { SkeletonList } from "@/components/common/SkeletonLoader";

export function Notifications() {
  const { profile } = useAuth();
  const [realNotifs, setRealNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const DEMO_NOTIFICATIONS = [
    {
      id: "notif-1",
      type: "like",
      message: "Maria Theodore liked your voice note session",
      time: "10m ago",
      read: false,
    },
    {
      id: "notif-2",
      type: "follow",
      message: "Lukas Shilongo started following you",
      time: "1h ago",
      read: false,
    },
    {
      id: "notif-3",
      type: "room",
      message: "Gazza Official started a Live Voice Room in Windhoek",
      time: "2h ago",
      read: true,
    },
  ];

  useEffect(() => {
    async function loadNotifications() {
      if (!profile?.id) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          setRealNotifs(data);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        setLoading(false);
      }
    }
    loadNotifications();
  }, [profile?.id]);

  const markAllRead = async () => {
    if (!profile?.id) return;
    try {
      await supabase.from("notifications").update({ read: true }).eq("user_id", profile.id);

      setRealNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const activeNotifs = realNotifs.length > 0 ? realNotifs : DEMO_NOTIFICATIONS;

  return (
    <div className="min-h-screen bg-[#0B0A09] text-white pb-28">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0B0A09]/95 backdrop-blur-xl border-b border-white/[0.08] px-4 py-3">
        <div className="flex items-center justify-between h-11">
          <h1 className="text-white font-bold text-xl tracking-wide font-display">Activity</h1>
          <button
            onClick={markAllRead}
            className="text-[#FFB800] text-xs font-bold hover:underline transition"
          >
            Mark all read
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-4 space-y-1 pt-2">
        {loading ? (
          <SkeletonList />
        ) : (
          activeNotifs.map((notif) => {
            const isRead = notif.read;
            const textContent = notif.message || notif.title || notif.text;
            const timeAgo = notif.created_at
              ? new Date(notif.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : notif.time || "Recently";

            return (
              <div
                key={notif.id}
                className={`w-full flex items-start gap-3 py-3 px-3 rounded-2xl border-b border-white/[0.04] transition ${
                  !isRead ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-[#FFB800]/15 text-[#FFB800] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#FFB800]/30">
                  <Heart className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/90 text-xs leading-relaxed font-medium">{textContent}</p>
                  <p className="text-white/40 text-[10px] mt-1 font-mono">{timeAgo}</p>
                </div>
                {!isRead && (
                  <div className="w-2 h-2 bg-[#FFB800] rounded-full mt-2 flex-shrink-0" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Notifications;
