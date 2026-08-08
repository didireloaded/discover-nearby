import { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "@/components/common/ProtectedRoute";

const MainLayout = lazy(() =>
  import("@/components/layout/MainLayout").then((m) => ({ default: m.MainLayout })),
);
const Home = lazy(() => import("@/pages/Home").then((m) => ({ default: m.Home })));
const Discovery = lazy(() => import("@/pages/Discovery").then((m) => ({ default: m.Discovery })));
const Notes = lazy(() => import("@/pages/Notes").then((m) => ({ default: m.Notes })));
const Events = lazy(() => import("@/pages/Events").then((m) => ({ default: m.Events })));
const Activity = lazy(() => import("@/pages/Activity").then((m) => ({ default: m.Activity })));
const Profile = lazy(() => import("@/pages/Profile").then((m) => ({ default: m.Profile })));
const Settings = lazy(() => import("@/pages/Settings").then((m) => ({ default: m.Settings })));
const Auth = lazy(() => import("@/pages/Auth").then((m) => ({ default: m.Auth })));
const Onboarding = lazy(() =>
  import("@/pages/Onboarding").then((m) => ({ default: m.Onboarding })),
);
const ExploreRooms = lazy(() => import("@/pages/ExploreRooms"));
const ExploreEvents = lazy(() => import("@/pages/ExploreEvents"));
const ExplorePeople = lazy(() => import("@/pages/ExplorePeople"));
const Inbox = lazy(() => import("@/pages/Inbox"));
const ChatRoom = lazy(() => import("@/pages/ChatRoom"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const NoteDetail = lazy(() =>
  import("@/pages/NoteDetail").then((m) => ({ default: m.NoteDetail || m.default })),
);
const EventDetail = lazy(() =>
  import("@/pages/EventDetail").then((m) => ({ default: m.EventDetail || m.default })),
);
const NotFound = lazy(() =>
  import("@/pages/NotFound").then((m) => ({ default: m.NotFound || m.default })),
);

const Rooms = lazy(() => import("@/pages/Rooms").then((m) => ({ default: m.Rooms })));
const KaraokeRoom = lazy(() =>
  import("@/components/karaoke/KaraokeRoom").then((m) => ({ default: m.KaraokeRoom })),
);

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Discovery />} />
        <Route path="/explore/rooms" element={<ExploreRooms />} />
        <Route path="/explore/events" element={<ExploreEvents />} />
        <Route path="/explore/people" element={<ExplorePeople />} />
        <Route path="/discovery" element={<Navigate to="/explore" replace />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/note/:noteId" element={<NoteDetail />} />
        <Route path="/events" element={<Events />} />
        <Route path="/event/:eventId" element={<EventDetail />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/music" element={<Navigate to="/explore" replace />} />
        <Route
          path="/activity"
          element={
            <ProtectedRoute>
              <Activity />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route
          path="/inbox"
          element={
            <ProtectedRoute>
              <Inbox />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Inbox />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Inbox />
            </ProtectedRoute>
          }
        />
        <Route path="/rooms" element={<Rooms />} />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/auth" element={<Auth />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route
        path="/messages/new"
        element={
          <ProtectedRoute>
            <ChatRoom />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages/:conversationId"
        element={
          <ProtectedRoute>
            <ChatRoom />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:id"
        element={
          <ProtectedRoute>
            <ChatRoom />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:conversationId"
        element={
          <ProtectedRoute>
            <ChatRoom />
          </ProtectedRoute>
        }
      />
      {/* Disambiguated room routes */}
      <Route path="/rooms/voice/:roomId" element={<ExploreRooms />} />
      <Route path="/room/:roomId" element={<ExploreRooms />} />
      <Route path="/rooms/karaoke/:roomId" element={<KaraokeRoom />} />
      <Route path="/karaoke/:roomId" element={<KaraokeRoom />} />
      <Route path="/live/:roomId" element={<ExploreRooms />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
