# Netflix Clone

A full-stack Netflix Clone application featuring user authentication, profile management, content browsing, watchlists, and more. Built with FastAPI (Python) for the backend and React for the frontend.

---

## Features
- User registration, login, and authentication
- Multiple user profiles per account
- Browse popular movies and TV shows (TMDB integration)
- Search, trending, and category browsing
- Personalized watchlists
- Secure password hashing and JWT-based authentication
- Responsive, modern UI (React + TailwindCSS)

---

## Tech Stack

### Backend
- **Framework:** FastAPI
- **Database:** MongoDB (via Motor)
- **Auth:** JWT, OAuth, password hashing (passlib, pyjwt)
- **Other:** Pydantic, python-dotenv, requests, boto3, etc.

### Frontend
- **Framework:** React (Create React App)
- **Styling:** TailwindCSS
- **Routing:** react-router-dom
- **HTTP:** axios
- **UI/UX:** framer-motion, lucide-react, @headlessui/react

---

## Project Structure

```
Netflix-Clone/
  backend/         # FastAPI backend
    server.py      # Main API server
    models.py      # Pydantic models
    database.py    # MongoDB connection
    auth.py        # Auth logic
    tmdb_service.py# TMDB API integration
    requirements.txt
  frontend/        # React frontend
    src/           # React source code
    public/
    package.json
    tailwind.config.js
  tests/           # Python tests
  README.md        # (This file)
```

---

## Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 18+
- MongoDB instance (local or cloud)

### 1. Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. **Environment variables:** Create a `.env` file in `backend/` with:
   ```env
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=netflix_clone
   TMDB_API_KEY=your_tmdb_api_key
   SECRET_KEY=your_secret_key
   ```
3. **Run the server:**
   ```bash
   uvicorn server:app --reload
   ```
   The API will be available at `http://localhost:8000`.

### 2. Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   # or
   yarn install
   ```
2. **Start the development server:**
   ```bash
   npm start
   # or
   yarn start
   ```
   The app will run at `http://localhost:3000`.

---

## API Overview

- **Base URL:** `/api`
- **Auth:**
  - `POST /api/auth/register` — Register new user
  - `POST /api/auth/login` — Login and get JWT
  - `GET /api/auth/me` — Get current user info
- **Profiles:**
  - `POST /api/profiles` — Create profile
  - `GET /api/profiles` — List profiles
- **Content:**
  - `GET /api/movies/popular` — Popular movies
  - `GET /api/tv/popular` — Popular TV shows
  - `GET /api/content/trending` — Trending content
  - `GET /api/content/search?q=...` — Search
- **Watchlist:**
  - `POST /api/watchlist/{profile_id}` — Add to watchlist
  - `GET /api/watchlist/{profile_id}` — Get watchlist
  - `DELETE /api/watchlist/{profile_id}/{content_id}` — Remove from watchlist

> For full API details, see the FastAPI docs at `http://localhost:8000/docs` when the backend is running.

---

## Environment Variables
- `MONGO_URL` — MongoDB connection string
- `DB_NAME` — Database name
- `TMDB_API_KEY` — TMDB API key for content data
- `SECRET_KEY` — Secret for JWT signing

---

## Testing

- **Backend:**
  ```bash
  pytest
  ```
- **Frontend:**
  ```bash
  npm test
  # or
  yarn test
  ```

---

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## License
[MIT](LICENSE)
