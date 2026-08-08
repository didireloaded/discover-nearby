import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Avatar } from "@/components/common/Avatar";
import { SkeletonList } from "@/components/common/SkeletonLoader";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function ExplorePeople() {
  const navigate = useNavigate();
  const { requireAuth } = useAuth();
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPeople() {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20);

        if (data) setPeople(data);
      } catch (err) {
        console.error("Failed to load creators:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPeople();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0A09] text-white pb-28">
      <div className="sticky top-0 z-40 bg-[#0B0A09] border-b border-white/10 px-4 h-14 flex items-center gap-3">
        <button
          onClick={() => navigate("/explore")}
          className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-bold text-base font-display">Creators Nearby</h1>
      </div>

      <div className="px-4 py-4 space-y-2">
        {loading ? (
          <SkeletonList />
        ) : people.length > 0 ? (
          people.map((person) => (
            <div
              key={person.id}
              onClick={() => navigate(`/profile/${person.username}`)}
              className="w-full text-left bg-[#181513] rounded-2xl border border-white/10 p-3.5 flex items-center justify-between hover:border-white/20 transition cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  size={44}
                  profile={{
                    id: person.id,
                    display_name: person.display_name,
                    avatar_url: person.avatar_url,
                  }}
                  className="rounded-full shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {person.display_name || person.username}
                  </p>
                  <p className="text-[11px] text-white/40 truncate">@{person.username}</p>
                  {person.bio && (
                    <p className="text-[11px] text-white/60 truncate mt-0.5 max-w-[200px]">
                      {person.bio}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  requireAuth(() => toast.success(`Following @${person.username}`));
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FFB800] text-black font-bold text-xs hover:bg-[#FFB800]/90 transition shrink-0"
              >
                <UserPlus size={13} />
                <span>Follow</span>
              </button>
            </div>
          ))
        ) : (
          <div className="py-10 text-center text-xs text-white/40 bg-[#181513] rounded-2xl border border-white/10">
            No creators found
          </div>
        )}
      </div>
    </div>
  );
}
