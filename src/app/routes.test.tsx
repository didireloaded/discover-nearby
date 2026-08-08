import { render, screen, waitFor } from "@testing-library/react";
import { Suspense } from "react";
import { MemoryRouter, Outlet } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppRoutes } from "./routes";

// Mock all page components with simple identifiable content
vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: () => (
    <>
      <div>Matisa shell</div>
      <Outlet />
    </>
  ),
}));
vi.mock("@/pages/Home", () => ({ Home: () => <div>Home page</div> }));
vi.mock("@/pages/Discovery", () => ({
  Discovery: () => <div>Explore page</div>,
}));
vi.mock("@/pages/Messages", () => ({
  Messages: () => <div>Inbox page</div>,
}));
vi.mock("@/pages/Profile", () => ({
  Profile: () => <div>Profile page</div>,
}));
vi.mock("@/pages/Activity", () => ({
  Activity: () => <div>Activity page</div>,
}));
vi.mock("@/pages/Events", () => ({
  Events: () => <div>Events page</div>,
}));
vi.mock("@/pages/Notes", () => ({
  Notes: () => <div>Notes page</div>,
}));
vi.mock("@/pages/Music", () => ({
  Music: () => <div>Music page</div>,
}));
vi.mock("@/pages/Settings", () => ({
  Settings: () => <div>Settings page</div>,
}));
vi.mock("@/pages/Auth", () => ({
  Auth: () => <div>Auth page</div>,
}));
vi.mock("@/pages/Inbox", () => ({
  default: () => <div>Inbox page</div>,
  Inbox: () => <div>Inbox page</div>,
}));
vi.mock("@/pages/ChatRoom", () => ({
  default: () => <div>Chat page</div>,
  ChatRoom: () => <div>Chat page</div>,
}));
vi.mock("@/pages/Notifications", () => ({
  default: () => <div>Activity page</div>,
  Notifications: () => <div>Activity page</div>,
}));
vi.mock("@/pages/ExploreRooms", () => ({
  default: () => <div>Explore Rooms page</div>,
}));
vi.mock("@/pages/ExploreEvents", () => ({
  default: () => <div>Explore Events page</div>,
}));
vi.mock("@/pages/ExplorePeople", () => ({
  default: () => <div>Explore People page</div>,
}));
vi.mock("@/pages/Onboarding", () => ({
  Onboarding: () => <div>Onboarding page</div>,
}));
vi.mock("@/pages/NoteDetail", () => ({
  NoteDetail: () => <div>Note Detail page</div>,
}));
vi.mock("@/pages/EventDetail", () => ({
  EventDetail: () => <div>Event Detail page</div>,
}));
vi.mock("@/pages/NotFound", () => ({
  NotFound: () => <div>NotFound page</div>,
}));
vi.mock("@/components/karaoke/KaraokeRoom", () => ({
  KaraokeRoom: () => <div>Room page</div>,
}));

function renderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Suspense fallback={<div>Loading...</div>}>
        <AppRoutes />
      </Suspense>
    </MemoryRouter>,
  );
}

describe("AppRoutes", () => {
  it.each([
    ["/", "Home page"],
    ["/explore", "Explore page"],
    ["/inbox", "Inbox page"],
    ["/chat", "Inbox page"],
    ["/notifications", "Activity page"],
    ["/profile", "Profile page"],
    ["/activity", "Activity page"],
    ["/events", "Events page"],
    ["/notes", "Notes page"],
    ["/note/test", "Note Detail page"],
    ["/event/test", "Event Detail page"],
    ["/settings", "Settings page"],
  ])("resolves %s to the correct page", async (path, label) => {
    renderRoute(path);
    expect(await screen.findByText(label)).toBeInTheDocument();
  });

  it("redirects /music to /explore because music tab is removed", async () => {
    renderRoute("/music");
    expect(await screen.findByText("Explore page")).toBeInTheDocument();
  });

  it("resolves /auth outside the main layout", async () => {
    renderRoute("/auth");
    expect(await screen.findByText("Auth page")).toBeInTheDocument();
    expect(screen.queryByText("Matisa shell")).not.toBeInTheDocument();
  });

  it("resolves /chat/:id outside the main layout", async () => {
    renderRoute("/chat/abc123");
    expect(await screen.findByText("Chat page")).toBeInTheDocument();
    expect(screen.queryByText("Matisa shell")).not.toBeInTheDocument();
  });

  it("resolves /room/:id outside the main layout", async () => {
    renderRoute("/room/room-1");
    expect(await screen.findByText("Explore Rooms page")).toBeInTheDocument();
    expect(screen.queryByText("Matisa shell")).not.toBeInTheDocument();
  });

  it("redirects the former /discovery URL to /explore", async () => {
    renderRoute("/discovery");
    expect(await screen.findByText("Explore page")).toBeInTheDocument();
  });

  it("renders NotFound for unknown routes", async () => {
    renderRoute("/nonexistent-page");
    expect(await screen.findByText("NotFound page")).toBeInTheDocument();
  });
});
