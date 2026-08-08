import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageSquare, UserPlus, Radio, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { SkeletonList } from "@/components/common/SkeletonLoader";

export function Notifications() {
  const navigate = useNavigate();
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
      deep_link: "/notes",
    },
    {
      id: "notif-2",
      type: "follow",
      message: "Lukas Shilongo started following you",
      time: "1h ago",
      read: false,
      deep_link: "/profile/lukas_vibe",
    },
    {
      id: "notif-3",
      type: "room",
      message: "Gazza Official started a Live Voice Room in Windhoek",
      time: "2h ago",
      read: true,
      deep_link: "/rooms",
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
          .eq("recipient_id", profile.id)
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
      await supabase.from("notifications").update({ read: true }).eq("recipient_id", profile.id);

      setRealNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.read && profile?.id) {
      try {
        await supabase.from("notifications").update({ read: true }).eq("id", notif.id);
        setRealNotifs((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
      } catch {
        // Silent failure
      }
    }

    const destination =
      notif.deep_link ||
      (notif.type === "like" || notif.type === "comment"
        ? `/note/${notif.related_id}`
        : notif.type === "message"
          ? `/messages/${notif.related_id}`
          : notif.type === "follow"
            ? `/profile/${notif.actor_id}`
            : notif.type === "event"
              ? `/event/${notif.related_id}`
              : "/explore");

    navigate(destination);
  };

  const activeNotifs = realNotifs.length > 0 ? realNotifs : DEMO_NOTIFICATIONS;

  const getNotifIcon = (type: string) => {
    if (type === "follow") return <UserPlus className="w-4 h-4" />;
    if (type === "comment" || type === "message") return <MessageSquare className="w-4 h-4" />;
    if (type === "room") return <Radio className="w-4 h-4" />;
    if (type === "event") return <Calendar className="w-4 h-4" />;
    return <Heart className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-[#0B0A09] text-white pb-28">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0B0A09] border-b border-white/[0.08] px-4 py-3">
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
              <button
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`w-full flex items-start gap-3 py-3 px-3 rounded-2xl border-b border-white/[0.04] transition text-left cursor-pointer active:scale-[0.99] ${
                  !isRead ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-[#FFB800]/15 text-[#FFB800] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#FFB800]/30">
                  {getNotifIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/90 text-xs leading-relaxed font-medium">{textContent}</p>
                  <p className="text-white/40 text-[10px] mt-1 font-mono">{timeAgo}</p>
                </div>
                {!isRead && (
                  <div className="w-2 h-2 bg-[#FFB800] rounded-full mt-2 flex-shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Notifications;
