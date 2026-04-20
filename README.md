***

# 🎧 SignalFM — Music Discovery & Recommendation Platform

SignalFM is a full-stack, personalised music streaming web application designed to bridge the gap between passive music consumption and intelligent, user-responsive recommendation. It transforms standard streaming into an active, data-driven experience by capturing fine-grained user interactions to refine recommendations in real-time.

## 🎯 Key Technical Highlights

* **Weighted Recommendation Engine:** Implemented a hybrid recommendation system based on implicit feedback literature (Hu, Koren and Volinsky, 2008). 
    * **Engagement Schema:** Captures implicit and explicit signals: `play` (+1), `skip` (-2), `like` (+3).
* **Event-Driven Analytics:** Architecture utilizes Firestore transactions to ensure data integrity during real-time event logging.
* **Real-Time Feedback Loop:** Employs a server-side cache invalidation mechanism that ensures recommendations update immediately after user interactions, providing a responsive personalisation loop.
* **Domain-Driven Architecture:** Frontend built on a custom hook pattern (`useTrackEvents`, `useRecommendations`, etc.), enforcing strict separation between UI presentation and business logic.

---

## ⚙️ Core Architecture

The system is designed for maintainability and performance, using a clean separation of concerns:

* **Frontend:** React 18, utilizing domain-driven custom hooks to manage complex playback and event-tracking states without "prop drilling."
* **Backend:** Node.js/Express, following a Controller-Service-Middleware pattern.
* **Database:** Google Firestore (NoSQL), utilizing transactional writes for engagement scoring to prevent race conditions.
* **API Layer:** Spotify Web API (catalogue search & audio metadata) + Spotify Web Playback SDK (in-browser streaming).

---

## 🧠 The Recommendation Engine

SignalFM moves beyond "black box" algorithms by providing a transparent, literature-based scoring model:

1.  **Data Collection:** Captures track plays, manual skips, and explicit likes via a dedicated `processTrackEvent` service.
2.  **Weighted Scoring:** Each interaction type is assigned a weight based on empirical studies (Mehrotra et al., 2017), allowing the system to differentiate between "tolerated" (play) and "strongly preferred" (like) content.
3.  **Seed Selection:** The engine aggregates the top-scoring tracks from the user's engagement history to serve as "seed tracks" for the Spotify Recommendations endpoint, creating a personalized discovery experience from the first session.

---

## ⚡ Performance Optimization

* **Cache-First Strategy:** Implemented a server-side recommendation cache that drastically reduces Spotify API call frequency during active listening sessions.
* **Atomic Transactions:** Firestore transactions guarantee that user engagement updates (plays/skips) remain accurate even under concurrent load.
* **Optimized Hooks:** Efficient state management using `useCallback` and `useMemo` to minimize unnecessary re-renders in the playback UI.

---

## 🛠️ Tech Stack

* **Frontend:** React, HTML5, CSS3, Vite
* **Backend:** Node.js, Express.js
* **Database & Auth:** Firebase Firestore, Firebase Authentication
* **External Integration:** Spotify Web API & Web Playback SDK
* **DevOps:** Deployed on Render

---

🚀 Local Installation & Setup
Clone the repository:

Bash
git clone https://github.com/Kelyan05/SignalFM.git
cd SignalFM
Install Dependencies:

Bash
# Install Client dependencies
cd client
npm install

# Install Server dependencies
cd ../server
npm install
Run the Application:
You will need two terminal windows open:

Terminal 1 (Backend):

Bash
cd server
node server.js
Terminal 2 (Frontend):

Bash
cd client
npm run dev

### Environment Variables
Create a `.env` file in the root directory:
```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
FIREBASE_CONFIG=your_config_object
SPOTIFY_REFRESH_TOKEN = your refresh_token
SPOTIFY_REDIRECT_URI = your_spotify_redirecturi
```

---

## 🚧 Roadmap & Future Enhancements

Based on critical evaluation and identifying areas for growth, the following features are prioritized for future development:

* **Distributed Caching:** Migrating from in-memory Map caching to **Redis** to support multi-instance scaling.
* **Recency Decay:** Implementing time-based decay for engagement scores so the engine favors current preferences over old interactions.
* **Automated Testing:** Implementation of a Jest/Vitest suite for backend API endpoints and React Testing Library for frontend hooks.
* **Diversity Constraints:** Adding logic to mitigate "filter bubble" risks by ensuring recommendations include genre variety.
* **Full Accessibility Audit:** Completing a full WCAG 2.1 compliance audit.

---

## 👤 Author

**Kelyan Djomo**
📧 [darrelkelyan@outlook.com](mailto:darrelkelyan@outlook.com)
🔗 [https://github.com/Kelyan05](https://github.com/Kelyan05)

---

## 📄 License
This project is open-source and available under the MIT License.
