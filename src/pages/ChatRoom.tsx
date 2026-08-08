import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Mic, Image as ImageIcon, Phone } from "lucide-react";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { MessageService } from "@/services/messages";
import { Avatar } from "@/components/common/Avatar";
import { VoiceNoteRecorderModal } from "@/components/voice/VoiceNoteRecorderModal";
import { SkeletonList } from "@/components/common/SkeletonLoader";
import { toast } from "sonner";

export function ChatRoom() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, sendMessage, sendMediaMessage, isLoading } = useMessages(conversationId);
  const [input, setInput] = useState("");
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeUserId = user?.id || "";

  useEffect(() => {
    async function loadParticipant() {
      if (conversationId && activeUserId) {
        const other = await MessageService.getOtherUser(conversationId, activeUserId);
        if (other) setOtherUser(other);
      }
    }
    loadParticipant();
  }, [conversationId, activeUserId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    try {
      await sendMessage(text);
    } catch {
      toast.error("Failed to send message");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.info("Uploading image to storage...");
    const success = await sendMediaMessage(file, "image");
    if (success) {
      toast.success("Image sent and saved!");
    } else {
      toast.error("Failed to upload and send image");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0A09] text-white flex flex-col">
      {/* Dynamic Header */}
      <div className="sticky top-0 z-40 bg-[#0B0A09]/95 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => navigate("/inbox")}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition active:scale-95 text-white"
            aria-label="Back to inbox"
          >
            <ArrowLeft className="w-5 h-5 text-white/80" />
          </button>

          <Avatar
            size={36}
            profile={{
              id: otherUser?.id || "other",
              display_name: otherUser?.display_name || otherUser?.username || "Creator",
              avatar_url: otherUser?.avatar_url,
            }}
            className="rounded-full shrink-0"
          />

          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">
              {otherUser?.display_name || otherUser?.username || "Direct Message"}
            </p>
            <p className="text-[#10b981] text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
              Active Now
            </p>
          </div>

          <button
            onClick={() => {
              navigate("/rooms");
            }}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition active:scale-95 text-white"
            aria-label="Start voice room session"
          >
            <Phone className="w-4 h-4 text-white/80" />
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />

      {/* Messages Stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-24">
        {isLoading && messages.length === 0 ? (
          <SkeletonList />
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === activeUserId;
            return (
              <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed ${
                    isMine
                      ? "bg-[#FFB800] text-black font-bold rounded-tr-sm"
                      : "bg-[#181513] text-white border border-white/10 rounded-tl-sm"
                  }`}
                >
                  {msg.media_url ? (
                    <img
                      src={msg.media_url}
                      alt="Attachment"
                      className="rounded-xl max-h-60 object-cover my-1"
                    />
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
                <span className="text-[10px] text-white/40 mt-1 px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Composer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0A09] border-t border-white/10 p-3 max-w-[430px] mx-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white/70 hover:text-white shrink-0"
            aria-label="Attach photo"
          >
            <ImageIcon size={18} />
          </button>

          <button
            onClick={() => setIsVoiceModalOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white/70 hover:text-white shrink-0"
            aria-label="Voice message"
          >
            <Mic size={18} />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 h-10 px-4 rounded-xl bg-[#181513] text-xs text-white placeholder-white/40 border border-white/10 focus:outline-none focus:border-[#FFB800]"
          />

          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#FFB800] text-black font-bold disabled:opacity-40 transition active:scale-95 shrink-0"
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Voice Recorder Modal */}
      {isVoiceModalOpen && (
        <VoiceNoteRecorderModal
          open={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          onPublished={() => {
            setIsVoiceModalOpen(false);
            toast.success("Voice message sent!");
          }}
          mode="voicemail"
          recipientId={otherUser?.id}
        />
      )}
    </div>
  );
}

export default ChatRoom;
