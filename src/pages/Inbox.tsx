import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, MessageSquare } from "lucide-react";
import { useConversations } from "@/hooks/useMessages";
import { PremiumEmptyState } from "@/components/common/PremiumEmptyState";
import { SkeletonList } from "@/components/common/SkeletonLoader";
import { Avatar } from "@/components/common/Avatar";
import { routes } from "@/app/navigation";

export function Inbox() {
  const navigate = useNavigate();
  const { conversations, isLoading } = useConversations();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter(
    (conv: any) =>
      conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#090807] text-white pb-28">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#090807] border-b border-white/10 px-5 py-3">
        <div className="flex items-center justify-between h-11">
          <h1 className="text-white font-bold text-xl tracking-wide font-display">Messages</h1>
          <button
            onClick={() => navigate(routes.explorePeople())}
            className="w-9 h-9 rounded-full bg-[#1C1714] flex items-center justify-center text-white hover:bg-white/20 transition active:scale-95 border border-white/10"
            title="Start new chat"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-5 py-3">
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#14110F] rounded-xl border border-white/10 focus-within:border-[#FFB800]">
          <Search className="w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full bg-transparent text-white text-xs placeholder:text-white/40 outline-none"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="px-5 space-y-1">
        {isLoading ? (
          <SkeletonList />
        ) : filteredConversations.length === 0 ? (
          <div className="py-12 text-center">
            <PremiumEmptyState
              icon={MessageSquare}
              title="No Direct Messages"
              description="Start a direct chat or send a voice message to creators."
              action={{
                label: "Discover Creators",
                onClick: () => navigate(routes.explorePeople()),
              }}
            />
          </div>
        ) : (
          filteredConversations.map((conv: any) => (
            <div
              key={conv.id}
              onClick={() => navigate(routes.conversation(conv.id))}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#14110F] border border-white/10 hover:bg-[#1C1714] transition cursor-pointer"
            >
              <Avatar
                size={44}
                profile={{
                  id: conv.id,
                  display_name: conv.name,
                  avatar_url: conv.avatar,
                }}
                className="rounded-full shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-white truncate">{conv.name}</p>
                  <span className="text-[10px] text-white/40">{conv.time}</span>
                </div>
                <p className="text-[11px] text-white/60 truncate mt-0.5">{conv.lastMessage}</p>
              </div>

              {conv.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#FFB800] text-black font-bold text-[10px] flex items-center justify-center shrink-0">
                  {conv.unread}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Inbox;
