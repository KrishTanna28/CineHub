# Cinnect

A full-stack movie and TV show discovery platform built with Next.js. Users can browse content from TMDB, write reviews, participate in communities, track watchlists, earn achievements, and interact with an AI-powered movie assistant.

## Features

- **Browse and discover** movies and TV shows with filters (genre, year, language, rating, sort)
- **Detailed media pages** for movies, TV shows (with season breakdowns), and actors
- **User reviews** with ratings, likes/dislikes, nested replies, and spoiler flags
- **Communities** -- create and join topic-based groups (movie, TV, actor, general), post content with image/video uploads, comment threads, hot/popular/recent sorting
- **Watchlist and favorites** management per user
- **Gamification** -- points system, levels, badges, achievements, streaks, and a public leaderboard
- **AI assistant (CineBot)** -- chat interface powered by Google Gemini for movie/TV recommendations and questions, with daily AI-generated conversation starters
- **AI content moderation** -- automated review moderation using Gemini Pro with spam and offensive content detection
- **Authentication** -- local email/password registration with OTP verification, Google OAuth 2.0, JWT-based sessions, password reset via email
- **Search** -- multi-search across movies, TV shows, and users
- **Spam prevention** -- rate limiting, copy-paste detection, rapid-fire blocking, spam score tracking
- **Image/video uploads** via Cloudinary (avatars, community banners, post media)

## Tech Stack

- **Framework:** Next.js 16 (App Router, React Server Components, ISR)
- **Language:** JavaScript/JSX
- **Database:** MongoDB (Mongoose 8)
- **Styling:** Tailwind CSS 4, Radix UI primitives, shadcn/ui
- **Authentication:** JWT + Google OAuth 2.0 (Passport.js)
- **AI:** Google Gemini (chatbot, moderation, suggestions)
- **File Storage:** Cloudinary
- **Email:** Nodemailer (Gmail SMTP)
- **External APIs:** TMDB, YouTube Data API, News API
- **Validation:** Zod, react-hook-form
- **Charts:** Recharts

## Project Structure

```
my-app/
  src/
    app/                    # Next.js App Router pages and API routes
      api/
        ai-assistant/       # Gemini-powered chatbot and suggestions
        auth/               # Google OAuth, token refresh
        communities/        # CRUD, membership, moderation
        movies/             # TMDB proxy (movies, TV, search, discover, person)
        posts/              # Post CRUD, comments, likes
        reviews/            # Review CRUD, likes, replies
        users/              # Registration, login, profile, watchlist, favorites, leaderboard
    components/             # React components (navigation, details pages, AI assistant, UI primitives)
    contexts/               # Auth and user context providers
    hooks/                  # Custom hooks (toast, infinite scroll)
    lib/
      config/               # Database, Cloudinary, Passport configuration
      middleware/            # Auth, validation, points, spam prevention, error handling, file upload
      models/               # Mongoose schemas (User, Review, Community, Post)
      services/             # TMDB, news, YouTube, moderation bot
```

## Installation

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- API keys for: TMDB, Google Cloud (OAuth + Gemini), Cloudinary, News API, YouTube Data API

### Setup

1. Clone the repository:
   ```sh
   git clone <repository-url>
   cd CineHub
   ```

2. Install dependencies:
   ```sh
   cd my-app
   npm install
   ```

3. Create a `.env` file in the project root (see [Configuration](#configuration) below).

4. Start the development server:
   ```sh
   npm run dev
   ```

   The app runs at `http://localhost:3000` by default.

### Build for production

```sh
npm run build
npm start
```

## Configuration

Create a `.env` file in the project root with the following variables:

```
# Database
MONGODB_URL=

# Authentication
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URL=

# Application URLs
NEXT_PUBLIC_FRONTEND_URL=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_API_URL=

# Google Gemini AI
GEMINI_API_KEY=

# TMDB
TMDB_API_KEY=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email (Gmail SMTP)
EMAIL_USER=
EMAIL_PASSWORD=

# News API
NEXT_PUBLIC_NEWS_API_KEY=

# YouTube Data API
NEXT_PUBLIC_YOUTUBE_API_KEY=
```

## API Overview

All API routes are under `/api/`.

### Auth

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/google` | GET | Initiate Google OAuth flow |
| `/api/auth/google/callback` | GET | Google OAuth callback |
| `/api/auth/refresh` | POST | Refresh JWT token |

### Users

| Endpoint | Method | Description |
|---|---|---|
| `/api/users/register` | POST | Register (with OTP email verification) |
| `/api/users/complete-registration` | POST | Verify OTP and finalize account |
| `/api/users/login` | POST | Email/password login |
| `/api/users/me` | GET/PUT | Get or update own profile |
| `/api/users/me/favorites` | GET/POST | Manage favorites |
| `/api/users/me/watchlist` | GET/POST | Manage watchlist |
| `/api/users/me/stats` | GET | Points, level, badges, achievements |
| `/api/users/[id]` | GET | Public user profile |
| `/api/users/leaderboard` | GET | Top users by points |
| `/api/users/search` | GET | Search users |
| `/api/users/forgot-password` | POST | Request password reset |
| `/api/users/reset-password` | POST | Reset password with token |

### Movies and TV

| Endpoint | Method | Description |
|---|---|---|
| `/api/movies/popular` | GET | Popular movies |
| `/api/movies/top-rated` | GET | Top-rated movies |
| `/api/movies/trending` | GET | Trending content |
| `/api/movies/discover` | GET | Discover with filters |
| `/api/movies/search` | GET | Search movies |
| `/api/movies/search/multi` | GET | Multi-search (movies + TV) |
| `/api/movies/[id]` | GET | Movie details |
| `/api/movies/person/[id]` | GET | Actor/person details |
| `/api/movies/tv/popular` | GET | Popular TV shows |
| `/api/movies/tv/top-rated` | GET | Top-rated TV shows |
| `/api/movies/tv/discover` | GET | Discover TV with filters |
| `/api/movies/tv/[id]` | GET | TV show details |
| `/api/movies/tv/[id]/season/[seasonNumber]` | GET | Season details |

### Reviews

| Endpoint | Method | Description |
|---|---|---|
| `/api/reviews` | GET/POST | List or create reviews |
| `/api/reviews/[reviewId]` | GET/PUT/DELETE | Single review operations |
| `/api/reviews/[reviewId]/like` | POST | Toggle like |
| `/api/reviews/[reviewId]/dislike` | POST | Toggle dislike |
| `/api/reviews/[reviewId]/reply` | POST | Add reply |
| `/api/reviews/user/[userId]` | GET | Reviews by user |

### Communities

| Endpoint | Method | Description |
|---|---|---|
| `/api/communities` | GET/POST | List or create communities |
| `/api/communities/search` | GET | Search communities |
| `/api/communities/posts` | GET | All posts across communities |
| `/api/communities/[slug]` | GET/POST | Community details or join |
| `/api/communities/[slug]/posts` | GET/POST | Community posts |
| `/api/communities/[slug]/requests` | POST | Approve/reject join requests |
| `/api/communities/[slug]/update` | PATCH | Update community |
| `/api/communities/[slug]/delete` | DELETE | Delete community |

### Posts

| Endpoint | Method | Description |
|---|---|---|
| `/api/posts/[id]` | GET/POST/DELETE | Get, like/dislike, or delete post |
| `/api/posts/[id]/comment` | POST/PATCH | Add or like/dislike comment |
| `/api/posts/[id]/comment/[commentId]/reply` | POST | Reply to comment |

### AI Assistant

| Endpoint | Method | Description |
|---|---|---|
| `/api/ai-assistant` | POST | Chat with CineBot (Gemini-powered) |
| `/api/ai-assistant/suggestions` | GET | Daily AI-generated conversation starters |
