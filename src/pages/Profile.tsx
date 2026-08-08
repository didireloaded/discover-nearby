import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Settings as SettingsIcon,
  MessageCircle,
  Mic,
  Calendar,
  Bookmark,
  Edit,
  Share2,
  PhoneCall,
  X,
  CheckCircle2,
  Grid,
} from "lucide-react";
import { VoiceIntroPlayer } from "@/components/voice/VoiceIntroPlayer";
import { VoiceNoteRecorderModal } from "@/components/voice/VoiceNoteRecorderModal";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/hooks/useFollow";
import { supabase } from "@/lib/supabase";
import { Avatar } from "@/components/common/Avatar";
import { NoteCard } from "@/components/feed/NoteCard";
import { MessageService } from "@/services/messages";
import { toast } from "sonner";

export function Profile() {
  const { username } = useParams<{ username?: string }>();
  const navigate = useNavigate();
  const { profile: currentUser, requireAuth } = useAuth();

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

        setUserProfile(fetchedProf);

        const profId = fetchedProf?.id || currentUser?.id;
        if (profId) {
          // Fetch user notes
          const { data: notesData } = await supabase
            .from("notes")
            .select(`*, profiles!notes_user_id_fkey(*)`)
            .eq("user_id", profId)
            .order("created_at", { ascending: false });

          if (notesData) setUserNotes(notesData);

          // Fetch followers count
          const { count } = await supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("following_id", profId);

          if (count !== null) setFollowersCount(count);
        }
      } catch (err) {
        console.error("Error loading profile", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfileData();
  }, [username, currentUser, isOwnProfile]);

  const handleSaveProfile = async () => {
    const profId = userProfile?.id || currentUser?.id;
    if (!profId) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: editName.trim(),
          bio: editBio.trim(),
        })
        .eq("id", profId);

      if (error) throw error;

      setUserProfile((prev: any) => ({
        ...(prev || {}),
        display_name: editName.trim(),
        bio: editBio.trim(),
      }));
      setIsEditModalOpen(false);
      toast.success("Profile saved to database!");
    } catch (err) {
      console.error("Error saving profile to DB:", err);
      toast.error("Failed to update profile in database");
    }
  };

  const openEditModal = () => {
    setEditName(profileData?.display_name || "");
    setEditBio(profileData?.bio || "");
    setIsEditModalOpen(true);
  };

  const profileData = userProfile || currentUser;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-white/50 text-xs">
        Loading profile...
      </div>
    );
  }

  if (!profileData && !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-5 text-center text-white space-y-3">
        <p className="text-sm font-bold text-white/70">Profile Not Found</p>
        <p className="text-xs text-white/40">Please sign in to view your profile.</p>
        <button
          onClick={() => navigate("/auth")}
          className="px-5 py-2 rounded-xl bg-[#FFB800] text-black text-xs font-bold shadow-md"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full pb-28 pt-2 bg-[#0B0A09] text-white">
      {/* 1. Header Row */}
      <div className="px-5 mb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white tracking-tight font-display">Profile</h1>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              const url = `${window.location.origin}/profile/${profileData.username}`;
              if (navigator.share) {
                navigator.share({ title: profileData.display_name, url }).catch(() => {});
              } else {
                navigator.clipboard.writeText(url);
                toast.success("Profile link copied!");
              }
            }}
            className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition active:scale-95"
            aria-label="Share profile"
          >
            <Share2 size={18} />
          </button>

          {isOwnProfile && (
            <button
              onClick={() => navigate("/settings")}
              className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition active:scale-95"
              aria-label="Settings"
            >
              <SettingsIcon size={18} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Quiet User Identity Card */}
      <div className="px-5 space-y-3">
        <div className="flex items-center gap-4">
          <Avatar
            size={72}
            profile={{
              id: profileData.id || "me",
              display_name: profileData.display_name,
              avatar_url: profileData.avatar_url,
            }}
            className="rounded-full shrink-0"
          />

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-white tracking-tight truncate">
                {profileData.display_name || profileData.username}
              </h2>
              <CheckCircle2 size={14} className="text-[#FFB800] shrink-0" />
            </div>
            <p className="text-xs text-white/50 truncate">@{profileData.username}</p>
            <p className="text-xs text-white/60 font-medium pt-0.5">
              {userNotes.length} notes · {followersCount} followers
            </p>
          </div>
        </div>

        {/* Bio */}
        {profileData.bio && (
          <p className="text-xs text-white/85 leading-relaxed whitespace-pre-line">
            {profileData.bio}
          </p>
        )}

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2 pt-1">
          {isOwnProfile ? (
            <button
              onClick={openEditModal}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/15 transition active:scale-95"
            >
              <Edit size={14} />
              <span>Edit Profile</span>
            </button>
          ) : (
            <>
              <button
                onClick={toggleFollow}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition active:scale-95 ${
                  isFollowing
                    ? "bg-white/10 text-white/80"
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
                    navigate(`/messages/${convId}`);
                  } else {
                    toast.error("Could not start conversation");
                  }
                }}
                className="flex-1 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/15 transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <MessageCircle size={14} />
                <span>Message</span>
              </button>

              <button
                onClick={() => setIsVoicemailOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white/80 hover:text-white transition active:scale-95 shrink-0"
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

      {/* 4. Stream */}
      <div className="px-5 mt-4">
        {activeTab === "posts" && (
          <div className="space-y-3">
            {userNotes.length > 0 ? (
              userNotes.map((note) => <NoteCard key={note.id} note={note} />)
            ) : (
              <div className="text-center py-10 bg-[#181513] rounded-2xl border border-white/10 space-y-1.5">
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
          <div className="text-center py-10 bg-[#181513] rounded-2xl border border-white/10 space-y-1.5">
            <Mic size={24} className="mx-auto text-white/30" />
            <p className="text-xs font-bold text-white/70">No voice notes recorded yet</p>
          </div>
        )}

        {activeTab === "events" && (
          <div className="text-center py-10 bg-[#181513] rounded-2xl border border-white/10 space-y-1.5">
            <Calendar size={24} className="mx-auto text-white/30" />
            <p className="text-xs font-bold text-white/70">No events hosted yet</p>
          </div>
        )}

        {activeTab === "saved" && (
          <div className="text-center py-10 bg-[#181513] rounded-2xl border border-white/10 space-y-1.5">
            <Bookmark size={24} className="mx-auto text-[#FFB800]" />
            <p className="text-xs font-bold text-white/70">Saved Library</p>
            <p className="text-[11px] text-white/40 max-w-[220px] mx-auto">
              Notes you bookmark will be saved here privately.
            </p>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl p-5 bg-[#181513] text-white border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold">Edit Profile Details</h3>
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
                  placeholder="Your display name..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 outline-none focus:border-[#FFB800]"
                />
              </div>

              <div>
                <label className="block text-white/60 mb-1 font-semibold">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell people about yourself..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 outline-none focus:border-[#FFB800] resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-white/70 hover:text-white font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-5 py-2 rounded-xl bg-[#FFB800] text-black text-xs font-bold shadow-md active:scale-95 transition"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voicemail Modal */}
      {isVoicemailOpen && (
        <VoiceNoteRecorderModal
          open={isVoicemailOpen}
          onClose={() => setIsVoicemailOpen(false)}
          onPublished={() => {
            toast.success(`Voicemail sent to @${profileData?.username || "user"}!`);
            setIsVoicemailOpen(false);
          }}
          mode="voicemail"
          recipientId={profileData?.id}
        />
      )}
    </div>
  );
}

export default Profile;
