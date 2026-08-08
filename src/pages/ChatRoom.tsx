import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Mic, Image as ImageIcon, Phone } from "lucide-react";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeUserId = user?.id || "me";

  const fallbackMessages = [
    {
      id: "m-1",
      sender_id: "other",
      content: "Hey! Excited for the live room acoustic session tonight?",
      created_at: "10:42 AM",
    },
    {
      id: "m-2",
      sender_id: activeUserId,
      content: "Yes! Dropping a new voice note preview right before we start.",
      created_at: "10:44 AM",
    },
  ];

  const activeMessages = messages.length > 0 ? messages : fallbackMessages;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    const success = await sendMessage(text);
    if (!success) {
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
    toast.info("Sending photo...");
    const success = await sendMediaMessage(file, "image");
    if (success) {
      toast.success("Photo sent");
    } else {
      toast.error("Failed to send photo");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0A09] text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0B0A09]/95 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => navigate("/inbox")}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition active:scale-95 text-white"
            aria-label="Back to inbox"
          >
            <ArrowLeft className="w-5 h-5 text-white/80" />
          </button>
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
            alt="Participant"
            className="w-9 h-9 rounded-full object-cover border border-white/15 shadow-sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">Hanna Dowie</p>
            <p className="text-[#10b981] text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
              Online
            </p>
          </div>
          <button
            onClick={() => toast.info("Voice call connecting...")}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition active:scale-95 text-white"
            aria-label="Start voice call"
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
        {isLoading && activeMessages.length === 0 ? (
          <SkeletonList />
        ) : (
          activeMessages.map((msg) => {
            const isMe = msg.sender_id === activeUserId || msg.sender_id === "me";
            const timeText = msg.created_at
              ? msg.created_at.includes("T")
                ? new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : msg.created_at
              : "Now";

            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? "bg-[#FFB800] text-black font-medium rounded-br-xs shadow-md"
                      : "bg-[#181513] text-white/90 rounded-bl-xs border border-white/10"
                  }`}
                >
                  {msg.media_type === "voice" || msg.media_url?.includes("voice") ? (
                    <div className="flex items-center gap-2 py-0.5">
                      <Mic className={`w-4 h-4 ${isMe ? "text-black" : "text-[#FFB800]"}`} />
                      <span className="font-semibold text-xs">Voice Message</span>
                      {msg.media_url && (
                        <audio src={msg.media_url} controls className="h-7 w-44 mt-1 block" />
                      )}
                    </div>
                  ) : msg.media_type === "image" || msg.media_url?.includes("image") ? (
                    <div className="space-y-1">
                      {msg.media_url && (
                        <img
                          src={msg.media_url}
                          alt="Attached"
                          className="max-w-full rounded-xl max-h-48 object-cover"
                        />
                      )}
                      <p>{msg.content}</p>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}

                  <p
                    className={`text-[10px] mt-1 text-right font-mono ${
                      isMe ? "text-black/60" : "text-white/40"
                    }`}
                  >
                    {timeText}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Composer Bar */}
      <div className="px-4 py-3 bg-[#0B0A09] border-t border-white/10 sticky bottom-0 z-40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVoiceModalOpen(true)}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 hover:bg-white/20 transition active:scale-95 text-white/80"
            aria-label="Voice message"
          >
            <Mic className="w-5 h-5 text-[#FFB800]" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 hover:bg-white/20 transition active:scale-95 text-white/80"
            aria-label="Attach photo"
          >
            <ImageIcon className="w-5 h-5 text-white/60" />
          </button>

          <div className="flex-1 bg-[#181513] rounded-full px-4 py-2 border border-white/15 focus-within:border-[#FFB800]">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type message..."
              className="w-full bg-transparent text-white text-sm placeholder:text-white/40 outline-none"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-full bg-[#FFB800] text-black flex items-center justify-center flex-shrink-0 shadow-md disabled:opacity-40 transition active:scale-95 hover:bg-[#FFB800]/90"
            aria-label="Send message"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Real Voice Recording Modal */}
      {isVoiceModalOpen && (
        <VoiceNoteRecorderModal
          open={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          onPublished={() => {
            toast.success("Voice message sent!");
            setIsVoiceModalOpen(false);
          }}
          mode="direct_message"
          recipientId={conversationId}
        />
      )}
    </div>
  );
}

export default ChatRoom;
