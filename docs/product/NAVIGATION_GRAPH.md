# MATISA — NAVIGATION GRAPH & CANONICAL ROUTES

This document defines the canonical route hierarchy and navigation graph for the Matisa social platform.

---

## 1. Canonical Route Hierarchy

```text
/ (Home Feed Stream)
├── /explore (Discovery & Search)
│   ├── /explore/rooms (Active Voice & Karaoke Rooms)
│   ├── /explore/events (Public & Paid Virtual Events)
│   └── /explore/people (Namibian Creators Directory)
├── /notes (Notes Directory)
├── /note/:noteId (Individual Note Detail & Comments)
├── /events (Events Feed)
├── /event/:eventId (Event Detail & RSVP Stage)
├── /activity (User Notifications & System Activity)
├── /notifications (Alias to /activity)
├── /profile (Own User Profile)
├── /profile/:username (Public Creator Profile)
├── /inbox (Direct Conversations List)
├── /messages (Alias to /inbox)
├── /messages/:conversationId (Direct Message Chat Room)
├── /chat/:conversationId (Alias to /messages/:conversationId)
├── /rooms (Audio Rooms & Stage Directory)
├── /rooms/voice/:roomId (Live Voice Room Stage)
├── /rooms/karaoke/:roomId (Live Karaoke Stage)
├── /settings (User Account & Preferences)
├── /auth (Authentication & Phone OTP)
└── /onboarding (New User Profile Setup)
```

---

## 2. Navigation Actions & Destinations

### Home Flow
- **User Avatar / Profile Tap**: Navigates to `/profile` (if own) or `/profile/:username`.
- **Note Card Tap**: Navigates to `/note/:noteId`.
- **Comment Button**: Opens comment modal overlay for `:noteId`.
- **Live Room Banner**: Navigates to `/rooms/voice/:roomId`.
- **Story Circle**: Opens `/story/:storyId`.

### Profile Flow
- **Followers Count Tap**: Opens followers list for `:username`.
- **Following Count Tap**: Opens following list for `:username`.
- **Message Button**: Invokes `MessageService.getOrCreateDirectConversation(targetUserId)` -> navigates to `/messages/:conversationId`.
- **Voicemail Button**: Opens `VoiceNoteRecorderModal` in voicemail mode.
- **Event Item**: Navigates to `/event/:eventId`.
- **Note Item**: Navigates to `/note/:noteId`.

### Rooms Flow
- **Voice Room Item**: Navigates to `/rooms/voice/:roomId` (Renders Voice Room Component).
- **Karaoke Room Item**: Navigates to `/rooms/karaoke/:roomId` (Renders `KaraokeRoom` Component).
- **Host Room Button**: Invokes `RoomService.createRoom()` -> navigates to `/rooms/voice/:roomId` or `/rooms/karaoke/:roomId`.

### Notifications Flow
- **Like Notification**: Navigates to `/note/:noteId`.
- **Comment Notification**: Navigates to `/note/:noteId`.
- **Follow Notification**: Navigates to `/profile/:username`.
- **Message Notification**: Navigates to `/messages/:conversationId`.
- **Event Notification**: Navigates to `/event/:eventId`.
- **Room Notification**: Navigates to `/rooms/voice/:roomId`.
