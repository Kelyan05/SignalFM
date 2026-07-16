# SignalFM — Architecture

## 1. Request flow

Every authenticated API request follows the same path:

```
React hook (client)
  └─ fetch with Firebase ID token in Authorization header
       └─ Express route (server/routes/*)
            └─ authMiddleware  — verifies the ID token with the Firebase Admin
               SDK and attaches the decoded claims to req.user. Identity is
               ALWAYS taken from this verified token, never from the body.
                 └─ controller — validates input, shapes the HTTP response
                      └─ service — business logic and I/O (Spotify, Firestore)
```

The two flows that matter most:

**Recording an event** — `POST /api/track/event` with `{ trackId, action }` where action is one of `play | skip | like | unlike | queue`. The controller runs a Firestore transaction on `users/{uid}/engagement/{trackId}` that increments the relevant counter (a transaction rather than a blind write so two near-simultaneous events from the same user can't lose an update), then invalidates that user's recommendation cache. `queue` is accepted for API uniformity but writes nothing — queueing a track you haven't heard is not a preference signal.

**Getting recommendations** — `GET /api/recommendations?genre=X` (optionally `&refresh=true` to bypass the cache):

1. **Cache check.** Key is `userId-genre`, TTL 5 minutes, invalidated on every event from that user.
2. **Candidate generation.** One Spotify search for the genre (50 tracks) from a random catalogue offset, so repeat visits explore different slices. Search responses are themselves cached for 5 minutes in `spotifyService`.
3. **Engagement fetch.** One batched `db.getAll()` of exactly the 50 candidate document refs under this user's `engagement` subcollection — a single round trip, no collection scans.
4. **Scoring, diversity, cap.** Every candidate is scored (below), sorted descending, reduced to one track per artist, and capped at 20.

## 2. Data model

| Path | Written by | Contents |
|---|---|---|
| `users/{uid}/engagement/{trackId}` | Server (Admin SDK, transactional) | `{ plays, skips, likes, updatedAt }` — this user's history with this track. The input to personalisation. |
| `users/{uid}/likedTracks/{trackId}` | Client (Firestore SDK) | Denormalised track metadata for the "liked" UI list. |
| `playlists/{playlistId}` | Client | `{ ownerId, name, tracks[], createdAt }`. Share links are served read-only by the backend. |

Engagement is stored **per user, not per track globally**. The only consumer of the data is "score these candidate tracks for this user", which this schema answers with cheap point reads. The tradeoff: platform-wide totals (e.g. total plays of a track) are no longer available, but nothing in the product reads them. If they were ever needed, the right move is a global aggregate document updated inside the same event transaction — one extra write per event — never a scan across user subcollections.

Client access is governed by `firestore.rules`: a user can only touch documents under their own `users/{uid}` subtree and playlists whose `ownerId` matches their uid. The backend's Admin SDK bypasses rules, which is how server-managed engagement writes and public share-link reads work.

## 3. The recommendation formula

All logic lives in `server/services/scoring.js` as pure functions (no I/O), which is what makes it unit-testable and fully explainable.

```
score(track) = 0.35 · popularity + 0.20 · recency + 0.45 · engagement
```

**popularity ∈ [0, 1]** — Spotify's 0–100 popularity divided by 100. A strong general-audience prior for tracks the user has no history with.

**recency ∈ [0, 1]** — linear decay by release year: 1.0 for the current year down to 0 at 3 years old. Spotify release dates arrive at year, month, or day precision; only the year (first four characters) is used.

**engagement ∈ [−1, 1]** — this user's history with this track:

```
raw = ln(likes + 1)·1.0 + ln(plays + 1)·0.4 − ln(skips + 1)·1.0
engagement = clamp(raw / 3.0, −1, 1)
```

* **Log compression**: the second like matters more than the fiftieth; no obsessively-replayed track can dominate. The `+1` guards `ln(0)`.
* **Interaction weights**: a like is explicit intent (1.0); a play is weak implicit evidence — you may have merely tolerated it (0.4); a skip is explicit rejection, as strong negatively as a like is positively (1.0).
* **Saturation at 3.0** (≈ 20 likes) then clamping keeps the term bounded, so the top-level weights mean what they say.
* **The range is deliberately signed**: a never-heard track scores a neutral 0, so tracks the user keeps skipping rank *below* unknown tracks.

**Top-level weights**: engagement gets the largest share (0.45) because it's the only signal that is actually personal — a like or skip should visibly reorder the feed. Popularity (0.35) is the backbone of the ranking when engagement is 0, which is also exactly the cold-start behaviour for a brand-new user: their feed is popularity + recency until they start interacting. Recency (0.20) is a small freshness nudge, kept low so the engine isn't just a new-releases list. The weights sum to 1.0 (asserted in the test suite).

After scoring: sort descending, keep only the first (highest-scoring) track per artist, cap at 20.

## 4. Caching

Two independent in-memory caches, one per concern:

* **Spotify search cache** (`spotifyService`) — keyed by query+offset, 5-min TTL. Protects the Spotify API quota.
* **Recommendation cache** (`recommendationService`) — keyed by user+genre, 5-min TTL, invalidated on any event from that user, bypassable with `?refresh=true`.

Both are plain in-process structures: correct for a single server instance, a known limitation for horizontal scaling (see INTERVIEW-NOTES.md).
