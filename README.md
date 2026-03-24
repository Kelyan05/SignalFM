# 🎧 SignalFM — Music Discovery & Recommendation Platform

## 🚀 Overview

SignalFM is a full-stack music discovery platform designed to deliver personalised recommendations through a hybrid recommendation system.

The application integrates external music data with user behaviour to create a dynamic and responsive user experience, focusing on performance, scalability, and clean system architecture.

---
## 🎯 Key Highlights

- Built full-stack application with scalable architecture  
- Designed hybrid recommendation system (content + collaborative filtering)  
- Implemented cache-first strategy improving performance and reducing API calls  
- Integrated external APIs (Spotify) with real-time data processing  


## 🚧 Project Status

SignalFM is currently under active development.

Core functionality including music search, playlist management, and recommendation logic is implemented. Ongoing work focuses on improving recommendation accuracy, performance optimisation, and scalability.


## ✨ Features

* 🔍 Search and discover music using Spotify Web API
* 🎵 Playlist creation and management
* 🤖 Hybrid recommendation system:

  * Content-based filtering (genre, popularity, recency)
  * Collaborative filtering (user interaction patterns)
* ⚡ Cache-first data retrieval to reduce redundant API calls
* 🔐 Secure authentication and user session handling
* 📊 Real-time data integration for tracks, artists, and genres

---

## 🧠 Recommendation System

SignalFM uses a hybrid approach to improve recommendation quality:

* **Content-Based Filtering**: Matches songs based on genre similarity, popularity, and recency
* **Collaborative Filtering**: Learns from user behaviour such as likes and engagement patterns
* **Behavioural Signals**: Enhances recommendations using interaction data

This approach balances accuracy, diversity, and personalisation.

---

## 🏗️ System Architecture

The backend follows a modular architecture:

* Controller → Service → Middleware pattern
* Separation of concerns for maintainability and scalability
* RESTful API design for client-server communication

### Key Design Decisions

* Implemented **in-memory caching** for fast data retrieval
* Designed with **future Redis integration** in mind for distributed caching
* Structured for **future machine learning enhancements**

---

## ⚙️ Tech Stack

### Frontend

* React
* HTML5, CSS3
* Component-based architecture
* Hooks & Context API

### Backend

* Node.js
* Express.js
* REST APIs
* Authentication middleware

### Tools & Platforms

* Firebase (authentication & data storage)
* Spotify Web API
* Postman (API testing)
* Git & version control

---

## ⚡ Performance Optimisation

* Cache-first query strategy reduces external API calls
* Lazy loading improves frontend performance
* Efficient state management reduces unnecessary re-renders
* Modular backend improves scalability and maintainability

---

## 🔌 API Integration

SignalFM integrates with the Spotify Web API to:

* Retrieve track and artist data
* Fetch genre metadata
* Enable music search functionality

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/Kelyan05/SignalFM.git

# Navigate into the project
cd SignalFM

# Install dependencies
npm install

# Run the development server
npm run dev
```

---

## 🔐 Environment Variables

Create a `.env` file and add:

```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
FIREBASE_CONFIG=your_config
```

---

## 📈 Future Improvements

- Implement Redis-based distributed caching layer  
- Enhance recommendation system with advanced ranking algorithms  
- Introduce automated testing (Jest, integration tests)  
- Deploy CI/CD pipeline for continuous delivery  
- Improve scalability for high-traffic environments  
---

## 📸 Demo

Project is still undergoing development locally

---

## 🤝 Contributing

Contributions are welcome! Feel free to fork the repo and submit a pull request.

---

## 📄 License

This project is open-source and available under the MIT License.

---

## 👤 Author

**Kelyan Djomo**
📧 [darrelkelyan@outlook.com](mailto:darrelkelyan@outlook.com)
🔗 https://github.com/Kelyan05

## ⚠️ Current Limitations

- Recommendation system is not yet fully optimised for large-scale datasets  
- Caching is currently in-memory and not distributed  
- No automated testing implemented yet

## 🏗️ Architecture Diagram

🚧 Diagram coming soon (will illustrate system components and data flow)
  
Demo account login:
demo@signalfm.test/ SignalFM123!

reviewer@signalfm.test / reviwer123

