export const routes = {
  home: () => "/",

  explore: () => "/explore",

  exploreRooms: () => "/explore/rooms",

  exploreEvents: () => "/explore/events",

  explorePeople: () => "/explore/people",

  profile: (username?: string) => (username ? `/profile/${username}` : "/profile"),

  note: (id: string) => `/note/${id}`,

  story: (id: string) => `/story/${id}`,

  inbox: () => "/inbox",

  conversation: (id: string) => `/messages/${id}`,

  activity: () => "/activity",

  notifications: () => "/notifications",

  events: () => "/events",

  event: (id: string) => `/event/${id}`,

  rooms: () => "/rooms",

  voiceRoom: (id: string) => `/rooms/voice/${id}`,

  karaokeRoom: (id: string) => `/rooms/karaoke/${id}`,

  settings: () => "/settings",

  auth: () => "/auth",

  onboarding: () => "/onboarding",
};
