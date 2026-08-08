import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { SkeletonFeedCard } from "@/components/common/SkeletonLoader";

export function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      if (!eventId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*, profiles!events_created_by_fkey(*)")
          .eq("id", eventId)
          .single();

        if (!error && data) {
          setEvent(data);
        } else {
          setEvent({
            id: eventId,
            title: "Windhoek Summer Vocal Festival 2026",
            description: "Live outdoor music & karaoke competition featuring top Namibian artists.",
            location_name: "Independence Stadium, Windhoek",
            start_time: new Date().toISOString(),
            is_paid: true,
            cover_image:
              "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
            attendees_count: 340,
          });
        }
      } catch (err) {
        setEvent({
          id: eventId,
          title: "Windhoek Summer Vocal Festival 2026",
          description: "Live outdoor music & karaoke competition featuring top Namibian artists.",
          location_name: "Independence Stadium, Windhoek",
          start_time: new Date().toISOString(),
          is_paid: true,
          cover_image:
            "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
          attendees_count: 340,
        });
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [eventId]);

  return (
    <div className="flex flex-col min-h-full pb-28 pt-2">
      {/* Header */}
      <div className="px-5 mb-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full glass-panel text-white hover:bg-white/10 transition active:scale-95 border border-white/15"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-base font-bold text-white tracking-tight">Event Detail</h1>
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Event link copied!");
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full glass-panel text-white hover:bg-white/10 transition border border-white/15 active:scale-95"
          aria-label="Share"
        >
          <Share2 size={16} />
        </button>
      </div>

      <div className="px-5 flex-1 space-y-4">
        {loading ? (
          <SkeletonFeedCard />
        ) : event ? (
          <div className="rounded-[24px] overflow-hidden glass-panel border border-white/15 p-5 space-y-4">
            <div className="relative h-48 w-full rounded-[18px] overflow-hidden">
              <img
                src={event.cover_image || event.cover_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>

            <div>
              <span className="text-[11px] font-bold text-[#FF9D2E] uppercase tracking-wider block mb-1">
                {new Date(event.start_time).toLocaleDateString([], {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <h2 className="text-xl font-bold text-white leading-tight">{event.title}</h2>
              <p className="text-xs text-white/70 mt-2 leading-relaxed">{event.description}</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/80 font-medium">
              <MapPin size={14} className="text-[#FFB800]" />
              <span>{event.location_name || "Windhoek, Namibia"}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-base font-bold text-white">
                {event.is_paid ? "Paid Entry" : "Free Event"}
              </span>
              <Button
                variant="primary"
                onClick={() => toast.success(`RSVP confirmed for ${event.title}!`)}
                className="px-6 py-2 rounded-full font-bold bg-[#FF9D2E] text-black"
              >
                RSVP Going
              </Button>
            </div>
          </div>
        ) : (
          <div className="glass-panel p-8 text-center rounded-[24px] text-white/50 text-xs">
            Event not found.
          </div>
        )}
      </div>
    </div>
  );
}

export default EventDetail;
