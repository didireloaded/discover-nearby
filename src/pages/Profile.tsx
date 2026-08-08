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
  Eye,
  Grid,
} from "lucide-react";
import { VoiceIntroPlayer } from "@/components/voice/VoiceIntroPlayer";
import { VoiceNoteRecorderModal } from "@/components/voice/VoiceNoteRecorderModal";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/hooks/useFollow";
import { supabase } from "@/lib/supabase";
import { Avatar } from "@/components/common/Avatar";
import { NoteCard } from "@/components/feed/NoteCard";
import { toast } from "sonner";

export function Profile() {
  const { username } = useParams<{ username?: string }>();
  const navigate = useNavigate();
  const { profile: currentUser } = useAuth();

  const [isVoicemailOpen, setIsVoicemailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"photo" | "subscription" | "reels" | "marked">(
    "photo",
  );
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
        Loading profile data...
      </div>
    );
  }

  if (!profileData && !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-5 text-center text-white space-y-3">
        <p className="text-sm font-bold text-white/70">Profile Not Found</p>
        <p className="text-xs text-white/40">
          Please sign in or select a valid Namibian creator profile.
        </p>
        <button
          onClick={() => navigate("/auth")}
          className="px-5 py-2 rounded-full bg-[#FFB800] text-black text-xs font-bold shadow-md"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full pb-28 pt-3 bg-[#0B0A09] text-white">
      {/* 1. Top Header Actions */}
      <div className="px-5 mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-white font-display">Profile</h1>

        <div className="flex items-center gap-2">
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
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/80 hover:text-white transition active:scale-95 border border-white/10"
            aria-label="Share profile"
          >
            <Share2 size={16} />
          </button>

          {isOwnProfile && (
            <button
              onClick={() => navigate("/settings")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/80 hover:text-white transition active:scale-95 border border-white/10"
              aria-label="Settings"
            >
              <SettingsIcon size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 2. User Info & Avatar Container */}
      <div className="px-5 space-y-4">
        <div className="flex items-center gap-4">
          {/* Rounded-Square Avatar Frame with Gold Border */}
          <div className="relative shrink-0">
            <div className="h-22 w-22 rounded-[22px] p-1 bg-[#181513] shadow-2xl border-2 border-[#FFB800]">
              <Avatar
                size={80}
                profile={{
                  id: profileData.id || "me",
                  display_name: profileData.display_name,
                  avatar_url: profileData.avatar_url,
                }}
                className="w-full h-full rounded-[18px] object-cover"
              />
            </div>
            <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-[#FFB800] border-2 border-[#0B0A09]" />
          </div>

          {/* User Display Name, Handle & Action Buttons */}
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-bold text-white tracking-tight truncate">
                  {profileData.display_name || profileData.username}
                </h2>
                <CheckCircle2 size={15} className="text-[#FFB800] fill-[#FFB800]/20 shrink-0" />
              </div>
              <p className="text-xs text-white/50 truncate">@{profileData.username}</p>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2 pt-0.5">
              {isOwnProfile ? (
                <button
                  onClick={openEditModal}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-bold border border-white/20 hover:bg-white/20 transition active:scale-95"
                >
                  <Edit size={13} />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={toggleFollow}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition active:scale-95 ${
                      isFollowing
                        ? "bg-white/10 text-white/80 border border-white/20"
                        : "bg-[#FFB800] text-black shadow-md hover:bg-[#FFB800]/90"
                    }`}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>

                  <button
                    onClick={() => navigate(`/chat/${profileData.id || profileData.username}`)}
                    className="px-4 py-1.5 rounded-full bg-white/5 text-[#FFB800] border border-[#FFB800]/40 text-xs font-bold hover:bg-[#FFB800]/10 transition active:scale-95 flex items-center gap-1"
                  >
                    <MessageCircle size={13} />
                    <span>Message</span>
                  </button>

                  <button
                    onClick={() => setIsVoicemailOpen(true)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[#FFB800] hover:bg-white/20 transition border border-[#FFB800]/30 active:scale-95"
                    aria-label="Leave Voicemail"
                    title="Leave Voicemail"
                  >
                    <PhoneCall size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 3. Real Engagement Bar (Posts, Followers, Views, Likes) */}
        <div className="grid grid-cols-4 items-center gap-1 py-3 px-3 rounded-[22px] bg-[#181513] border border-white/10 text-center">
          <div>
            <p className="text-sm font-extrabold text-white">{userNotes.length}</p>
            <p className="text-[10px] text-white/50 font-medium">Posts</p>
          </div>
          <div>
            <p className="text-sm font-extrabold text-white">{followersCount}</p>
            <p className="text-[10px] text-white/50 font-medium">Followers</p>
          </div>
          <div>
            <p className="text-sm font-extrabold text-white">0</p>
            <p className="text-[10px] text-white/50 font-medium">Views</p>
          </div>
          <div>
            <p className="text-sm font-extrabold text-white">0</p>
            <p className="text-[10px] text-white/50 font-medium">Likes</p>
          </div>
        </div>

        {/* 4. Bio Section */}
        {profileData.bio && (
          <div className="space-y-1.5 pt-1">
            <p className="text-xs text-white/90 leading-relaxed font-normal whitespace-pre-line">
              {profileData.bio}
            </p>
          </div>
        )}

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

      {/* 5. Segmented Navigation Bar */}
      <div className="px-5 mt-5 border-b border-white/10">
        <div className="grid grid-cols-4 items-center text-center pb-2">
          {[
            { id: "photo", label: "Posts", icon: Grid },
            { id: "subscription", label: "Voice", icon: Mic },
            { id: "reels", label: "Events", icon: Calendar },
            { id: "marked", label: "Saved", icon: Bookmark },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-col items-center gap-1 py-1.5 transition relative ${
                  isActive ? "text-[#FFB800] font-bold" : "text-white/40 hover:text-white/70"
                }`}
              >
                <Icon size={18} />
                <span className="text-[11px] font-semibold">{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-[#FFB800]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Real Media / Notes Stream */}
      <div className="px-5 mt-4">
        {activeTab === "photo" && (
          <div className="space-y-4">
            {userNotes.length > 0 ? (
              userNotes.map((note) => <NoteCard key={note.id} note={note} />)
            ) : (
              <div className="text-center py-10 bg-[#181513] rounded-[22px] border border-white/10 space-y-2">
                <Grid size={28} className="mx-auto text-white/30" />
                <p className="text-xs font-bold text-white/70">No posts published yet</p>
                <p className="text-[11px] text-white/40">
                  Notes and posts created by this account will appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "subscription" && (
          <div className="text-center py-10 bg-[#181513] rounded-[22px] border border-white/10 space-y-2">
            <Mic size={28} className="mx-auto text-white/30" />
            <p className="text-xs font-bold text-white/70">No voice sessions recorded yet</p>
          </div>
        )}

        {activeTab === "reels" && (
          <div className="text-center py-10 bg-[#181513] rounded-[22px] border border-white/10 space-y-2">
            <Calendar size={28} className="mx-auto text-white/30" />
            <p className="text-xs font-bold text-white/70">No events hosted yet</p>
          </div>
        )}

        {activeTab === "marked" && (
          <div className="text-center py-10 bg-[#181513] rounded-[22px] border border-white/10 space-y-2">
            <Bookmark size={28} className="mx-auto text-[#FFB800]" />
            <p className="text-xs font-bold text-white/70">Saved Library</p>
            <p className="text-[11px] text-white/40">
              Notes you bookmark will be stored here privately.
            </p>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-[28px] glass-panel-elevated p-6 bg-[#181513] text-white border border-white/20 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-base font-bold">Edit Profile Details</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-white/50 hover:text-white"
              >
                <X size={18} />
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
                className="px-4 py-2 rounded-full glass-panel text-xs text-white/70 hover:text-white font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-5 py-2 rounded-full bg-[#FFB800] text-black text-xs font-bold shadow-md active:scale-95 transition"
              >
                Save to Database
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
