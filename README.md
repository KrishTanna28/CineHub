# Cinnect

A full-stack movie and TV show discovery platform built with Next.js. Users can browse content from TMDB, write reviews, participate in communities, track watchlists, earn achievements, and interact with an AI-powered movie assistant.

## Features

- **Browse and discover** movies and TV shows with filters (genre, year, language, rating, sort)
- **Detailed media pages** for movies, TV shows (with season breakdowns), and actors
- **User reviews** with ratings, likes/dislikes, nested replies, and spoiler flags
- **Communities** -- create and join topic-based groups (movie, TV, actor, general), post content with image/video uploads, comment threads, hot/popular/recent sorting
- **Watchlist and favorites** management per user
- **Gamification** -- points system, levels, badges, achievements, streaks, and a public leaderboard
- **AI assistant (C.A.S.T)** -- chat interface powered by Google Gemini for movie/TV recommendations and questions, with daily AI-generated conversation starters
- **Semantic search** -- vector-based search using Google Gemini embeddings and MongoDB Atlas Vector Search to find relevant reviews and community discussions based on meaning rather than keywords
- **RAG-powered recommendations** -- AI assistant uses retrieval-augmented generation to provide context-aware answers by searching through your community's actual reviews and discussions
- **Streaming availability** -- real-time display of where to watch movies and TV shows in your region, powered by TMDB and JustWatch integration
- **AI content moderation** -- automated review moderation using Gemini Pro with spam and offensive content detection, quality scoring, sentiment analysis, and duplicate content detection
- **Authentication** -- local email/password registration with OTP verification, Google OAuth 2.0, JWT-based sessions, password reset via email
- **Search** -- multi-search across movies, TV shows, and users with both keyword and semantic search capabilities
- **Spam prevention** -- rate limiting, copy-paste detection, rapid-fire blocking, spam score tracking, and duplicate content detection
- **Image/video uploads** via Cloudinary (avatars, community banners, post media)
- **News integration** -- fetch and display relevant entertainment news using News API
- **YouTube integration** -- embed trailers, clips, and related videos via YouTube Data API

## Tech Stack

- **Framework:** Next.js 16 (App Router, React Server Components, ISR)
- **Language:** JavaScript/JSX
- **Database:** MongoDB (Mongoose 8) with Atlas Vector Search for semantic search
- **Styling:** Tailwind CSS 4, Radix UI primitives, shadcn/ui
- **Authentication:** JWT + Google OAuth 2.0 (Passport.js)
- **AI:** Google Gemini (chatbot with RAG, moderation, embeddings, suggestions)
- **File Storage:** Cloudinary
- **Email:** Nodemailer (Gmail SMTP)
- **External APIs:** TMDB (with streaming providers), YouTube Data API, News API
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
        content/            # Streaming provider availability
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
      services/             # TMDB, embedding, RAG, chat tools, moderation bot, news, YouTube
      utils/                # Helper utilities and points calculator
    scripts/                # Maintenance scripts (embedding backfill)
```

## Installation

### Prerequisites

- Node.js 18+
- MongoDB instance with Atlas Vector Search capabilities (for semantic search features)
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

4. Set up MongoDB Atlas Vector Search indexes:
   - Create a vector search index named `review_embedding_index` on the `reviews` collection with the `embedding` field
   - Create a vector search index named `post_embedding_index` on the `posts` collection with the `embedding` field
   - Both indexes should use `text-embedding-004` dimensions (768)

5. (Optional) Backfill embeddings for existing content:
   ```sh
   npm run backfill-embeddings
   ```

6. Start the development server:
   ```sh
   npm run dev
   ```

   The app runs at `http://localhost:3000` by default.

### Build for production

```sh
npm run build
npm start
```

## Maintenance Tasks

### Backfilling Embeddings

If you have existing reviews and posts in your database from before the semantic search feature was added, you'll need to generate embeddings for them. The backfill script processes all content without embeddings and generates them in batch.

```sh
npm run backfill-embeddings
```

This script will:
- Find all reviews and posts without embeddings
- Generate vector embeddings using Gemini's text-embedding-004 model
- Update the database with the generated embeddings
- Display progress as it processes content

Note: This process can take time depending on the amount of content in your database. The script processes items sequentially to respect API rate limits.

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

### Content

| Endpoint | Method | Description |
|---|---|---|
| `/api/content/[type]/[id]/providers` | GET | Streaming availability by region (movie or TV) |

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

## Key Features Deep Dive

### Semantic Search and RAG

The platform uses vector embeddings and MongoDB Atlas Vector Search to provide semantic search capabilities. When users create reviews or community posts, the content is automatically converted into vector embeddings using Google Gemini's text-embedding-004 model. This allows for intelligent search based on meaning rather than just keyword matching.

The AI assistant leverages Retrieval-Augmented Generation (RAG) to provide contextually relevant answers. When you ask a question, it searches through your community's reviews and discussions using vector similarity to find the most relevant content, then uses that context to generate informed responses.

**How it works:**
- Reviews and posts are automatically embedded when created
- Vector search indexes enable fast similarity queries
- The AI assistant retrieves relevant content before generating responses
- Chat tools allow the AI to search communities, find trending posts, and perform semantic searches

**Setting up vector search:**
You'll need MongoDB Atlas with vector search indexes configured. See the setup instructions for details on creating the required indexes.

### Gamification System

The platform includes a comprehensive points and achievements system to encourage quality content and engagement:

- **Points**: Earn points for reviews, posts, comments, and community participation
- **Levels**: Progress through levels as you accumulate points
- **Badges**: Unlock special badges for specific achievements
- **Streaks**: Maintain daily login and activity streaks for bonus points
- **Leaderboard**: Compete with other users for top positions

The points system considers various factors including content quality, engagement from other users, and consistency of participation.

### AI-Powered Moderation

Content moderation is handled by an AI system that analyzes reviews and posts for:

- Spam detection using pattern matching and AI analysis
- Offensive content identification
- Duplicate content detection
- Quality scoring based on length and constructiveness
- Sentiment analysis
- Promotional content flagging

The system uses both rule-based checks and Google Gemini AI for comprehensive moderation, with fallback mechanisms to ensure reliability.

### Streaming Provider Integration

The platform integrates with TMDB's streaming provider data (powered by JustWatch) to show users where they can watch movies and TV shows in their region. The system:

- Displays available streaming services with logos
- Prioritizes subscription services over rentals
- Provides direct links to watch content
- Updates availability information regularly
- Supports multiple regions with preference for India (IN)

## Important Notes

### MongoDB Atlas Vector Search

The semantic search and RAG features require MongoDB Atlas with vector search capabilities. You cannot use a local MongoDB instance for these features. The vector search indexes must use the following configuration:

- **Index name for reviews**: `review_embedding_index`
- **Index name for posts**: `post_embedding_index`
- **Field path**: `embedding`
- **Dimensions**: 768 (matches text-embedding-004 model)
- **Similarity**: cosine

### API Rate Limits

The application makes extensive use of external APIs. Be aware of rate limits:

- **TMDB**: 40 requests per 10 seconds
- **Google Gemini**: Depends on your API tier
- **YouTube Data API**: 10,000 quota units per day
- **News API**: 100 requests per day (free tier)

The application includes caching and rate limiting to help stay within these limits.

### Content Moderation

While the AI moderation system is comprehensive, it should not be considered perfect. Consider implementing:

- Manual review workflows for flagged content
- User reporting mechanisms
- Admin moderation tools
- Appeal processes for false positives

### Performance Considerations

For optimal performance:

- Enable ISR (Incremental Static Regeneration) for frequently accessed pages
- Configure appropriate revalidation times based on your content update frequency
- Use pagination for large result sets
- Monitor your MongoDB Atlas cluster performance and scale as needed
- Consider implementing Redis for session storage and caching in production

### Security Best Practices

- Never commit your `.env` file to version control
- Use strong JWT secrets (minimum 32 characters, randomly generated)
- Enable CORS restrictions in production
- Implement HTTPS in production environments
- Regularly update dependencies to patch security vulnerabilities
- Configure MongoDB access controls and IP whitelisting
- Use environment-specific credentials for different deployment stages
