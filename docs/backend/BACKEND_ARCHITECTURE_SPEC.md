# MATISA — BACKEND ARCHITECTURE & RECOMMENDATION SPECIFICATION

This document specifies the authoritative backend architecture, provider failure degradation matrix, outbox event schema, provider adapter interfaces, and deterministic feed recommendation engine (`feed_v1`) for the Matisa social platform.

---

## 1. Domain Boundaries & Source of Truth

Postgres is the single source of authoritative business state across all domains:

| Domain | Authoritative Schema / Tables | Third-Party Capability Provider | Provider Responsibility |
|---|---|---|---|
| **Identity & Auth** | `auth.users`, `profiles` | Supabase Auth / Turnstile | Session issuing, bot protection |
| **Social Graph** | `follows`, `user_blocks`, `user_mutes` | - | Pure Postgres state |
| **Content & Feed** | `notes`, `comments`, `reactions`, `bookmarks` | OpenAI (Server-side) | Moderation / Speech-to-text |
| **Messaging** | `conversations`, `conversation_participants`, `messages` | Supabase Realtime | Realtime message delivery |
| **Voice & Media** | `voice_intros`, `voicemails`, `message_media` | Supabase Storage | File storage & delivery |
| **Audio Rooms** | `voice_rooms`, `voice_room_participants` | LiveKit | Audio transport only |
| **Notifications** | `notifications`, `outbox_events` | OneSignal / Resend | Push & email delivery |
| **Events** | `events`, `event_attendees`, `orders`, `ledger` | Mapbox / PayToday | Map tiles & payment webhooks |
| **Analytics** | `user_events`, `feed_impressions` | PostHog / Sentry | Telemetry & error tracing |

---

## 2. Provider Failure & Graceful Degradation Matrix

Every external API provider has an explicit failure policy:

| Provider | Purpose | Failure Impact | Graceful Degradation Strategy |
|---|---|---|---|
| **Supabase Postgres** | Primary DB & RLS | Critical | Show offline error banner with retry |
| **LiveKit** | Voice Rooms & Karaoke | Room Audio Unavailable | Show active room metadata; disable join button with "Audio service reconnecting" |
| **OneSignal** | Mobile Push Notifications | Push Delivery Delayed | Write in-app notification to `notifications` table; queue push event in `outbox_events` for retry |
| **Resend** | Transactional Emails | Email Delayed | Queue email in `outbox_events`; return UI success |
| **OpenAI** | Moderation & Speech-to-Text | AI Features Offline | Allow Note/Voice publish; mark item `pending_async_moderation` |
| **PayToday** | Namibian Paid Events | Checkout Disabled | Disable paid checkout CTA; keep free RSVPs functional; never mark order paid without signed webhook |
| **Mapbox** | Event Maps | Maps Unavailable | Fall back to text location display (`Independence Ave, Windhoek`) |
| **PostHog / Sentry** | Telemetry & Crash Tracing | Observability Off | Silently drop/queue telemetry in memory; user experience unaffected |

---

## 3. Transactional Outbox Schema (`outbox_events`)

Database mutations insert an outbox event in the same Postgres transaction to ensure atomicity:

```sql
CREATE TABLE IF NOT EXISTS public.outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  attempts INT NOT NULL DEFAULT 0,
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  last_error TEXT
);
```

---

## 4. Deterministic Feed Recommendation Engine (`feed_v1`)

Feed generation follows a 5-step pipeline:

```text
Candidate Generation → Eligibility Filter → Signal Extraction → Multi-Signal Scoring → Diversity Reranking
```

### Signal Scoring Weights (`feed_v1`)

$$Score = 0.24 \cdot S_{\text{rel}} + 0.18 \cdot S_{\text{loc}} + 0.16 \cdot S_{\text{int}} + 0.12 \cdot S_{\text{fresh}} + 0.10 \cdot S_{\text{eng}} + 0.08 \cdot S_{\text{cons}} + 0.06 \cdot S_{\text{qual}} + 0.06 \cdot S_{\text{exp}} - Penalties$$

Where:
- **Relationship ($S_{\text{rel}}$)**: 1.0 if followed, 0.8 if mutual follower, 0.6 if previous DM interaction.
- **Locality ($S_{\text{loc}}$)**: 1.0 if same city (Windhoek, Swakopmund, Walvis Bay), 0.7 if same region, 0.5 if Namibia.
- **Interest Affinity ($S_{\text{int}}$)**: Matched category tags (Voice, Music, Events, Photography).
- **Freshness ($S_{\text{fresh}}$)**: Exponential time decay ($e^{-\lambda t}$).
- **Meaningful Engagement ($S_{\text{eng}}$)**: Weighted actions (Share: 1.0, Comment: 0.8, Save: 0.7, Voice Reply: 0.7, Like: 0.3).
- **Consumption Quality ($S_{\text{cons}}$)**: High audio listen completion rate (>80%).
- **Diversity Rule**: Maximum 2 posts from the same creator per 10 feed items; no more than 3 consecutive voice notes.
