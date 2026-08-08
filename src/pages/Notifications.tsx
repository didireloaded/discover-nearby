import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageSquare, UserPlus, Radio, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { routes } from "@/app/navigation";
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
      deep_link: routes.home(),
    },
    {
      id: "notif-2",
      type: "follow",
      message: "Lukas Shilongo started following you",
      time: "1h ago",
      read: false,
      deep_link: routes.profile("lukas_vibe"),
    },
    {
      id: "notif-3",
      type: "room",
      message: "Gazza Official started a Live Voice Room in Windhoek",
      time: "2h ago",
      read: true,
      deep_link: routes.rooms(),
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
        ? routes.note(notif.related_id)
        : notif.type === "message"
          ? routes.conversation(notif.related_id)
          : notif.type === "follow"
            ? routes.profile(notif.actor_id)
            : notif.type === "event"
              ? routes.event(notif.related_id)
              : routes.explore());

    navigate(destination);
  };

  const activeNotifs = realNotifs.length > 0 ? realNotifs : DEMO_NOTIFICATIONS;

  const getNotifIcon = (type: string) => {
    if (type === "follow") return <UserPlus className="w-4 h-4 text-[#FFB800]" />;
    if (type === "comment" || type === "message")
      return <MessageSquare className="w-4 h-4 text-[#FFB800]" />;
    if (type === "room") return <Radio className="w-4 h-4 text-[#FF493D]" />;
    if (type === "event") return <Calendar className="w-4 h-4 text-[#FF9A3D]" />;
    return <Heart className="w-4 h-4 text-[#FFB800]" />;
  };

  return (
    <div className="min-h-screen bg-[#090807] text-white pb-28">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#090807] border-b border-white/10 px-5 py-3">
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
      <div className="px-5 space-y-1.5 pt-2">
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
                onClick={() => handleNotificationClick(notif)}
                className={`flex items-start gap-3.5 p-3.5 rounded-2xl transition cursor-pointer border ${
                  isRead
                    ? "bg-[#14110F] border-white/5 opacity-80"
                    : "bg-[#1C1714] border-white/10 hover:border-white/20"
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-[#14110F] flex items-center justify-center shrink-0 border border-white/10">
                  {getNotifIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white leading-relaxed">{textContent}</p>
                  <span className="text-[10px] text-white/40 mt-1 block">{timeAgo}</span>
                </div>

                {!isRead && <span className="w-2 h-2 rounded-full bg-[#FFB800] shrink-0 mt-2" />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Notifications;
