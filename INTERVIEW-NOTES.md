# SignalFM — Interview / Viva Notes

Short, honest rationale for each significant design decision: why I did it this way, the tradeoff, and what I'd change at scale. These are the questions an interviewer is most likely to probe.

## Why a transparent weighted sum instead of ML collaborative filtering?

An earlier iteration attributed a "collaborative" score to the ranking, but because engagement was stored globally with no per-user dimension, the term mathematically collapsed to a binary "has anyone ever liked this" flag — while costing a full Firestore collection scan per request. Real collaborative filtering (e.g. matrix factorisation on implicit feedback) needs a dense user–item interaction matrix; with a handful of users it would overfit noise and I couldn't defend its internals line by line. A weighted sum of popularity, recency, and the user's own engagement is genuinely personal, debuggable by hand, cheap, and unit-testable. At scale, with thousands of users and millions of interactions, I'd revisit item-based CF or matrix factorisation as an *additional* candidate-generation source — not as a replacement for the transparent ranker.

## Why weights 0.35 / 0.20 / 0.45, and how were they chosen?

By reasoning about desired behaviour, then verifying with tests — not learned from data (there isn't enough data to learn from, and I'd rather say that plainly). Engagement is largest because a like or skip must visibly reorder the feed (there's a test asserting a liked niche track outranks an untouched hit). Popularity is second because it's the best available prior for unknown tracks and doubles as the cold-start ranking. Recency is smallest so the feed doesn't degenerate into a new-releases list. They sum to 1.0 (also asserted) so each weight reads as a fraction of the total. With real usage data I'd tune them against an offline metric (e.g. does the ranking predict which tracks the user goes on to like?) or an A/B test.

## Why is the engagement term signed and clamped to [−1, 1]?

Signed: a track the user repeatedly skips should rank *below* a track they've never heard, and a neutral 0 for unknown tracks makes cold start fall out of the formula for free. Clamped: log compression alone leaves the term unbounded, so one track with thousands of plays could silently dominate and the stated top-level weights would be a lie. Saturation at raw = 3.0 (~20 likes) is a judgment call: past that point, more interactions tell me nothing new about preference.

## Why store engagement per user (`users/{uid}/engagement/{trackId}`)?

Because the only query the product makes is "score these ~50 candidates for this user", and this schema answers it with one batched `db.getAll()` of point reads — no scans, no indexes, no fan-out. The write path is unchanged: one transactional document write per event. What I gave up is platform-wide totals per track; nothing reads those today, and if they were ever needed the correct design is a global aggregate document updated in the same transaction (one extra write per event), never a scan across user subcollections. The previous global-per-track schema was the root cause of the personalisation bug: every user saw essentially the same ranking.

## Why a Firestore transaction for event writes instead of `FieldValue.increment()`?

`increment()` would be simpler and contention-free, but the `unlike` action needs read-modify-write logic (floor the counter at zero so replayed or duplicated unlike events can't drive likes negative). A transaction gives me that plus lost-update protection if the same user double-fires an event. Contention is a non-issue because each document is only ever written by its own user. At much higher write volume I'd switch play/skip to `increment()` and keep the transaction only where the floor logic is needed.

## The cache and its invalidation — why this design?

In-memory `Map` keyed by `userId-genre`, 5-minute TTL, invalidated whenever that user records an event, bypassable via `?refresh=true`. The event-driven invalidation is what makes the feed feel live: like a track, refresh, and the ranking has changed. Two honest limitations: (1) it's per-process, so it vanishes on restart and is inconsistent across multiple instances — Render running >1 instance would mean a user could hit an instance with a stale cache; Redis is the standard fix and is on the roadmap. (2) Invalidation deletes by key-prefix scan over the Map, which is O(entries) — fine at this size, and I'd move to a per-user key index if it ever mattered. I also removed a second, duplicate recommendation cache that existed in `spotifyService` but was never called: one caching mechanism per concern.

## Why tiered playback instead of requiring Spotify Premium?

Spotify's Web Playback SDK — the only way to stream full tracks in the browser — is restricted to Premium accounts, so a hard dependency on it silently broke the app's core interaction for free users: Play did nothing. Rather than gate the product, playback degrades through three explicit tiers (full SDK playback → 30-second preview via a shared `<audio>` element → open-in-Spotify link), decided at click time by whether an SDK device id exists. Two details matter in a defence: fallback plays still record the `play` engagement event, so personalisation works identically for free users; and the tiers are ordered by guarantees — the deep link needs no auth, no Premium, and no deprecated API, so there is always a working bottom tier (Spotify stopped returning `preview_url` for API apps registered after Nov 2024, so tier 2 can be absent). The alternative — embedding Spotify's iframe widget per track — would have added a heavier dependency for less control.

## Security decisions

* **Identity from the JWT, never the body.** `authMiddleware` verifies the Firebase ID token and controllers read `req.user.uid`; a client cannot write events into another user's history by spoofing a userId field.
* **Firestore rules.** The original rules allowed any authenticated user to read and write *every* document — including deleting other users' playlists. The replacement rules scope client access to the requester's own `users/{uid}` subtree and to playlists whose `ownerId` matches, with creates required to stamp the caller's own uid.
* **Known remaining issue, deliberately documented rather than hidden:** the Spotify OAuth callback redirects to the frontend with tokens in the URL query string, which leaks them into browser history and potentially logs. The fix is an httpOnly-cookie session or completing the code exchange from the SPA; I scoped it out of this refactor but I know it's there.

## Testing philosophy

The scoring module was extracted into pure functions precisely so it could be tested without mocking Firestore or Spotify. The 12 tests each encode one behavioural claim I can state out loud: a skip lowers a score, a like raises it, a like beats a play, extreme counts clamp, weights sum to 1, empty engagement degrades to popularity+recency, recency handles all three Spotify date precisions, diversity keeps the best track per artist. That's worth more in a defence than a coverage percentage.

## Why an in-memory Firestore double for endpoint tests, not the real emulator?

`server/app.js` was split out of `server.js` (same Express app, minus `app.listen`) specifically so supertest could drive it directly. The remaining question was how to satisfy Firestore without hitting the real service. The real Firestore emulator was the original plan (it's what the roadmap said), but it needs a Java runtime and a running process per test invocation — for what these tests are actually checking (our routing, our validation, our transaction logic), that's cost with no signal: I'm not testing Google's transaction engine. So `server/test/fakeFirestore.js` implements exactly the handful of calls this codebase makes — `collection().doc().get()/set()`, `db.getAll()`, `db.runTransaction()` — as a plain `Map`, and `server/test/setup.js` mocks the `firebase-admin` package so `admin.auth().verifyIdToken()` (Google's code, not mine) returns a controllable fake decoded token while `admin.firestore()` returns the fake db. Everything downstream of that boundary — route → authMiddleware → controller → service → transaction logic — runs for real. 35 tests, no network calls, no external process, sub-4-second run. If a future bug ever depended on genuine Firestore transaction semantics (e.g. real contention across concurrent requests) that the fake can't model, that's exactly when I'd reach for the real emulator instead — not before.

Spotify is handled the same way: `spotifyService.searchTracks` is mocked at the module boundary in the recommendation and search tests, so no HTTP calls leave the test process and no API credentials are needed in CI.

## Honest limitations of the whole system

* **Candidate pool = Spotify genre search.** The engine reranks 50 search results; it cannot surface a track the search didn't return. A content-based candidate source (tracks by artists the user has liked) would be the natural next step and stays fully explainable.
* **No time decay on engagement** — a like from six months ago counts like one from today. A half-life decay on the counters (noted on the roadmap) would keep the profile current.
* **Popularity bias.** With a 0.35 popularity weight, unknown-to-the-user tracks are ranked mostly by global popularity — a deliberate cold-start choice, but it does mean the feed skews mainstream until the user interacts.
* **Random-offset exploration is crude.** It guarantees variety between visits but isn't informed exploration (no bandit-style balancing of explore/exploit).
* **Single-instance assumptions** in both caches, as above.
* **Spotify access tokens are not auto-refreshed on the client.** The token stored at login expires after ~1 hour and nothing renews it, so in-browser playback stops until the user reconnects. An earlier refresh helper existed but read/wrote localStorage keys nothing else used, so it was dead code and I removed it; the honest fix is a small fetch wrapper that refreshes via `/api/spotify/token` on a 401.
