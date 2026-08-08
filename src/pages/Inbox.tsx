import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, MoreHorizontal, MessageSquare } from "lucide-react";
import { useConversations } from "@/hooks/useMessages";
import { PremiumEmptyState } from "@/components/common/PremiumEmptyState";
import { SkeletonList } from "@/components/common/SkeletonLoader";

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
    <div className="min-h-screen bg-[#0B0A09] text-white pb-28">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0B0A09]/95 backdrop-blur-xl border-b border-white/[0.08] px-4 py-3">
        <div className="flex items-center justify-between h-11">
          <h1 className="text-white font-bold text-xl tracking-wide font-display">Messages</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/explore/people")}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition active:scale-95 border border-white/10"
              title="Start new chat"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition border border-white/10">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#181513] rounded-full border border-white/10 focus-within:border-[#FFB800]">
          <Search className="w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages or people..."
            className="w-full bg-transparent text-white text-sm placeholder:text-white/40 outline-none"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="px-4 space-y-1">
        {isLoading ? (
          <SkeletonList />
        ) : filteredConversations.length === 0 ? (
          <div className="py-12 text-center">
            <PremiumEmptyState
              icon={MessageSquare}
              title="No messages found"
              description="Start a conversation with creators around Windhoek!"
            />
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => navigate(`/messages/${conv.id}`)}
              className="w-full flex items-center gap-3 py-3 px-3 rounded-2xl hover:bg-white/5 transition text-left active:scale-[0.99] border-b border-white/[0.04]"
            >
              <div className="relative shrink-0">
                <img
                  src={conv.avatar}
                  alt={conv.name}
                  className="w-12 h-12 rounded-full object-cover border border-white/10 shadow-md"
                />
                {conv.online && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#10b981] rounded-full border-2 border-[#0B0A09]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-white font-semibold text-sm truncate">{conv.name}</p>
                  <span className="text-white/40 text-xs font-mono">{conv.time}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-white/60 text-xs truncate max-w-[220px]">{conv.lastMessage}</p>
                  {conv.unread > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-[#FFB800] text-black text-[11px] font-bold rounded-full shadow-sm">
                      {conv.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default Inbox;
