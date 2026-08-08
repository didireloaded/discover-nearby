import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Settings as SettingsIcon,
  MessageCircle,
  Mic,
  Calendar,
  Bookmark,
  Edit,
  PhoneCall,
  X,
  Grid,
} from "lucide-react";
import { VoiceIntroPlayer } from "@/components/voice/VoiceIntroPlayer";
import { VoiceNoteRecorderModal } from "@/components/voice/VoiceNoteRecorderModal";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/hooks/useFollow";
import { useSaves } from "@/hooks/useSaves";
import { supabase } from "@/lib/supabase";
import { Avatar } from "@/components/common/Avatar";
import { NoteCard } from "@/components/feed/NoteCard";
import { MessageService } from "@/services/messages";
import { routes } from "@/app/navigation";
import { toast } from "sonner";

export function Profile() {
  const { username } = useParams<{ username?: string }>();
  const navigate = useNavigate();
  const { profile: currentUser, requireAuth } = useAuth();
  const { savedNotes, fetchSavedNotes } = useSaves();

  const [isVoicemailOpen, setIsVoicemailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "voice" | "events" | "saved">("posts");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userNotes, setUserNotes] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");

  const targetId = userProfile?.id || currentUser?.id;
  const { isFollowing, toggleFollow } = useFollow(targetId);

  useEffect(() => {
    if (activeTab === "saved") {
      fetchSavedNotes();
    }
  }, [activeTab, fetchSavedNotes]);

  const isOwnProfile =
    !username || username === currentUser?.username || username === currentUser?.id;

  useEffect(() => {
    async function loadProfileData() {
      setLoading(true);
      try {
        let fetchedProf: any = null;
        if (isOwnProfile && currentUser) {
          fetchedProf = currentUser;
        } else if (username) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .or(`username.eq.${username},id.eq.${username}`)
            .maybeSingle();
          fetchedProf = data;
        }

        if (fetchedProf) {
          setUserProfile(fetchedProf);
          setEditName(fetchedProf.display_name || "");
          setEditBio(fetchedProf.bio || "");

          const { data: notesData } = await supabase
            .from("notes")
            .select("*, profiles!notes_user_id_fkey(*)")
            .eq("user_id", fetchedProf.id)
            .order("created_at", { ascending: false });

          setUserNotes(notesData || []);

          const { count } = await supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("following_id", fetchedProf.id);

          setFollowersCount(count || 0);
        }
      } catch (err) {
        console.error("Failed to load profile data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, [username, currentUser, isOwnProfile]);

  const profileData = userProfile || currentUser || {};

  const handleUpdateProfile = async () => {
    if (!currentUser?.id) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: editName,
          bio: editBio,
        })
        .eq("id", currentUser.id);

      if (error) throw error;
      setUserProfile((prev: any) => ({ ...prev, display_name: editName, bio: editBio }));
      setIsEditModalOpen(false);
      toast.success("Profile details updated");
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast.error("Could not save profile updates");
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-28 bg-[#090807] text-white">
      {/* 1. Header Navigation */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-5 h-14 bg-[#090807]">
        <h1 className="text-base font-bold text-white font-display">
          @{profileData.username || "profile"}
        </h1>

        <div className="flex items-center gap-2">
          {isOwnProfile && (
            <button
              onClick={() => navigate(routes.settings())}
              className="p-2 rounded-full text-white/70 hover:text-white transition"
              aria-label="Settings"
            >
              <SettingsIcon size={20} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Hero Profile Info */}
      <div className="px-5 space-y-4 pt-2">
        <div className="flex items-center gap-4">
          <Avatar
            size={72}
            profile={{
              id: profileData.id || "me",
              display_name: profileData.display_name,
              avatar_url: profileData.avatar_url,
            }}
            className="rounded-full border-2 border-white/10 shrink-0"
          />

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white leading-tight truncate font-display">
              {profileData.display_name || profileData.username || "Creator"}
            </h2>
            <p className="text-xs text-white/50 truncate">@{profileData.username || "creator"}</p>
            {profileData.location && (
              <p className="text-[11px] text-white/40 mt-0.5 truncate">{profileData.location}</p>
            )}
          </div>
        </div>

        {/* Bio */}
        {profileData.bio && (
          <p className="text-xs text-white/80 leading-relaxed font-normal">{profileData.bio}</p>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-4 items-center gap-2 py-3 px-4 rounded-2xl bg-[#14110F] border border-white/10 text-center">
          <div>
            <p className="text-sm font-bold text-white font-display">{userNotes.length}</p>
            <p className="text-[10px] text-white/50 font-medium uppercase">Notes</p>
          </div>
          <div>
            <p className="text-sm font-bold text-white font-display">{followersCount}</p>
            <p className="text-[10px] text-white/50 font-medium uppercase">Followers</p>
          </div>
          <div>
            <p className="text-sm font-bold text-white font-display">1.2k</p>
            <p className="text-[10px] text-white/50 font-medium uppercase">Views</p>
          </div>
          <div>
            <p className="text-sm font-bold text-white font-display">480</p>
            <p className="text-[10px] text-white/50 font-medium uppercase">Likes</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isOwnProfile ? (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex-1 py-2 rounded-xl bg-[#14110F] text-white text-xs font-semibold border border-white/10 hover:bg-[#1C1714] transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Edit size={14} />
              <span>Edit Profile</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => requireAuth(toggleFollow)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition active:scale-95 ${
                  isFollowing
                    ? "bg-[#14110F] text-white border border-white/10 hover:bg-[#1C1714]"
                    : "bg-[#FFB800] text-black hover:bg-[#FFB800]/90"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>

              <button
                onClick={async () => {
                  if (!currentUser?.id) return requireAuth();
                  const targetUser = profileData?.id;
                  if (!targetUser) return;
                  toast.info("Opening direct message...");
                  const convId = await MessageService.getOrCreateConversation(
                    currentUser.id,
                    targetUser,
                  );
                  if (convId) {
                    navigate(routes.conversation(convId));
                  } else {
                    toast.error("Could not start conversation");
                  }
                }}
                className="flex-1 py-2 rounded-xl bg-[#14110F] text-white text-xs font-semibold border border-white/10 hover:bg-[#1C1714] transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <MessageCircle size={14} />
                <span>Message</span>
              </button>

              <button
                onClick={() => setIsVoicemailOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#14110F] text-white/80 border border-white/10 hover:text-white transition active:scale-95 shrink-0"
                aria-label="Leave Voicemail"
                title="Leave Voicemail"
              >
                <PhoneCall size={16} />
              </button>
            </>
          )}
        </div>

        {/* Voice Intro Player */}
        <div className="pt-1">
          <VoiceIntroPlayer
            audioUrl={profileData.voice_intro_url || null}
            isOwner={isOwnProfile}
            profileId={profileData.id || "me"}
            onUpdated={(url) => {
              setUserProfile((prev: any) => (prev ? { ...prev, voice_intro_url: url } : prev));
            }}
          />
        </div>
      </div>

      {/* 3. Quiet Content Tabs */}
      <div className="px-5 mt-4 border-b border-white/10">
        <div className="flex items-center gap-6">
          {[
            { id: "posts", label: "Notes", icon: Grid },
            { id: "voice", label: "Voice", icon: Mic },
            { id: "events", label: "Events", icon: Calendar },
            { id: "saved", label: "Saved", icon: Bookmark },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-2.5 text-xs font-semibold transition relative ${
                  isActive
                    ? "text-white font-bold border-b-2 border-[#FFB800]"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Tab Contents */}
      <div className="px-5 mt-4">
        {activeTab === "posts" && (
          <div className="space-y-3">
            {userNotes.length > 0 ? (
              userNotes.map((note) => <NoteCard key={note.id} note={note} />)
            ) : (
              <div className="text-center py-10 bg-[#14110F] rounded-2xl border border-white/10 space-y-1.5">
                <Grid size={24} className="mx-auto text-white/30" />
                <p className="text-xs font-bold text-white/70">No notes published yet</p>
                <p className="text-[11px] text-white/40 max-w-[220px] mx-auto">
                  When {profileData.display_name || "this account"} shares a note, it will appear
                  here.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "voice" && (
          <div className="text-center py-10 bg-[#14110F] rounded-2xl border border-white/10 space-y-1.5">
            <Mic size={24} className="mx-auto text-white/30" />
            <p className="text-xs font-bold text-white/70">No voice notes recorded yet</p>
          </div>
        )}

        {activeTab === "events" && (
          <div className="text-center py-10 bg-[#14110F] rounded-2xl border border-white/10 space-y-1.5">
            <Calendar size={24} className="mx-auto text-white/30" />
            <p className="text-xs font-bold text-white/70">No events hosted yet</p>
          </div>
        )}

        {activeTab === "saved" && (
          <div className="space-y-3">
            {savedNotes.length > 0 ? (
              savedNotes.map((note) => <NoteCard key={note.id} note={note as any} />)
            ) : (
              <div className="text-center py-10 bg-[#14110F] rounded-2xl border border-white/10 space-y-1.5">
                <Bookmark size={24} className="mx-auto text-[#FFB800]" />
                <p className="text-xs font-bold text-white/70">Saved Library Empty</p>
                <p className="text-[11px] text-white/40 max-w-[220px] mx-auto">
                  Notes you bookmark will be saved here privately.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl p-5 bg-[#1C1714] text-white border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold font-display">Edit Profile Details</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-white/50 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-white/60 mb-1 font-semibold">Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#14110F] text-white border border-white/10 focus:outline-none focus:border-[#FFB800]"
                />
              </div>

              <div>
                <label className="block text-white/60 mb-1 font-semibold">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-xl bg-[#14110F] text-white border border-white/10 focus:outline-none focus:border-[#FFB800] resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 text-white/70 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                className="px-4 py-2 rounded-xl bg-[#FFB800] text-black text-xs font-bold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voicemail Recorder Modal */}
      {isVoicemailOpen && (
        <VoiceNoteRecorderModal
          open={isVoicemailOpen}
          onClose={() => setIsVoicemailOpen(false)}
          onPublished={() => {
            setIsVoicemailOpen(false);
            toast.success("Voicemail left for creator!");
          }}
          mode="voicemail"
          recipientId={profileData.id}
        />
      )}
    </div>
  );
}
