# 🎧 SignalFM — Music Discovery & Recommendation Platform

SignalFM is a full-stack music discovery web app. It streams music through the Spotify Web Playback SDK, records each user's listening behaviour (plays, skips, likes), and uses that history to personalise a transparent, formula-based recommendation feed per genre.

## What it actually does

* **Per-user recommendation engine.** Candidate tracks from Spotify search are ranked by an explicit weighted sum of three signals: Spotify popularity, release recency, and the requesting user's own engagement history (log-compressed likes and plays minus skips). The exact formula, weights, and the reasoning behind them live in [`server/services/scoring.js`](server/services/scoring.js) and are documented in [ARCHITECTURE.md](ARCHITECTURE.md). No black box: every ranking can be reproduced by hand.
* **Per-user engagement tracking.** Interactions are written transactionally to `users/{uid}/engagement/{trackId}`, so two users browsing the same genre get different rankings based on their own history.
* **Real-time feedback loop.** Recommendations are cached in memory per user+genre (5-minute TTL) and invalidated the moment that user records a new event, so a like or skip is reflected on the next request.
* **Works without Spotify Premium.** Full in-app playback uses the Web Playback SDK (a Premium-only Spotify feature); everyone else gets 30-second previews where Spotify provides them, or one-click open-in-Spotify links. Search, recommendations, likes, and playlists never require a Spotify connection at all — only a SignalFM account.
* **Tested scoring.** The scoring module is pure (no I/O) and covered by a 12-test Vitest suite: `cd server && npm test`.
* **Locked-down data access.** Firestore security rules restrict client access to the requester's own documents; the Express backend uses the Admin SDK for everything else.

## Architecture

* **Frontend:** React 18 + Vite, with domain-specific custom hooks (`useRecommendations`, `useTrackEvents`, `usePlaylists`, ...) separating data access from presentation.
* **Backend:** Node.js/Express in a routes → middleware → controllers → services layering. Firebase ID tokens are verified in middleware; the user identity always comes from the verified JWT, never the request body.
* **Database:** Google Firestore, with transactional writes for engagement counters.
* **External APIs:** Spotify Web API (catalogue search and metadata) and Spotify Web Playback SDK (in-browser streaming).
* **Deployment:** Render.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the request flow, data model, and the recommendation formula in full, and [INTERVIEW-NOTES.md](INTERVIEW-NOTES.md) for design-decision rationale and known limitations.

## Local installation & setup

Clone and install:

```bash
git clone https://github.com/Kelyan05/SignalFM.git
cd SignalFM/client && npm install
cd ../server && npm install
```

Run (two terminals):

```bash
# Terminal 1 — backend
cd server && node server.js

# Terminal 2 — frontend
cd client && npm run dev
```

Run the tests:

```bash
cd server && npm test
```

### Environment variables

Create `server/.env`:

```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=your_redirect_uri
FIREBASE_SERVICE_ACCOUNT=your_service_account_json
FRONTEND_URL=http://localhost:5173
```

## Known limitations & roadmap

Kept honest on purpose — these are discussed in more depth in INTERVIEW-NOTES.md:

* **In-memory caching** doesn't survive restarts and doesn't work across multiple server instances; Redis would be the fix at scale.
* **No time decay on engagement**: a like from six months ago counts the same as one from today.
* **Candidate pool = genre search results**, so the engine can only rerank what Spotify search returns; it can't surface a track outside the searched genre.
* **Spotify OAuth tokens are passed via redirect URL** during login, which exposes them to browser history; moving to an httpOnly-cookie flow is planned.
* **30-second previews depend on Spotify**: `preview_url` is not returned for API apps registered after Nov 2024, in which case the no-Premium fallback is the open-in-Spotify link.
* **Spotify access tokens are not auto-refreshed client-side**, so in-browser playback stops ~1 hour after connecting until the user reconnects.
* Expanding test coverage beyond the scoring module (API endpoints, React hooks).

## 👤 Author

**Kelyan Djomo**
📧 [darrelkelyan@outlook.com](mailto:darrelkelyan@outlook.com)
🔗 [https://github.com/Kelyan05](https://github.com/Kelyan05)

## 📄 License

This project is open-source and available under the MIT License.
