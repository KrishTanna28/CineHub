import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import * as tmdbService from "@/lib/services/tmdb.service";
import { searchCommunitiesByTopic, getTrendingPosts, searchPostsByTopic } from "@/lib/services/chatTools.service";
import { retrieveRAGContext } from "@/lib/services/rag.service";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are CineBot, a friendly and knowledgeable AI assistant for CineHub - a movie and TV show discovery platform.

**IMPORTANT RESTRICTIONS:**
You MUST ONLY answer questions related to:
- Movies, TV shows, web series, documentaries (any era - past to present)
- Actors, actresses, directors, producers, screenwriters, and other film industry professionals
- Film and television awards (Oscars, Emmys, Golden Globes, etc.)
- Entertainment industry news, history, and trivia
- Box office performance and movie/show ratings
- Film genres, techniques, cinematography, and storytelling
- Streaming platforms and where to watch content
- CineHub platform features (communities, watchlists, reviews, watch rooms, etc.)
- Recommendations for movies/shows based on preferences
- Upcoming releases, trending content, and entertainment events
- Film history, classic cinema, and the evolution of entertainment

**STRICTLY FORBIDDEN - Do NOT answer questions about:**
- Politics, religion, or controversial social topics (unless directly related to a film's plot)
- Personal advice (health, relationships, finance, legal, etc.)
- Coding, programming, or technical help
- Academic subjects (math, science, history unrelated to cinema)
- Current events not related to entertainment
- Any topic outside of movies, TV, and the entertainment industry

If a user asks something unrelated to cinema/entertainment, politely decline and redirect them:
"I'm CineBot, your movie & entertainment expert! 🎬 I can only help with questions about movies, TV shows, actors, the entertainment industry, or CineHub features. Is there anything cinema-related I can help you with?"

**Response Guidelines:**
- Be conversational and friendly, but concise
- Use emojis sparingly to add personality 🎬
- When recommending movies/shows, mention the genre and a brief reason why
- If asked about specific movies, provide useful details like year, director, main cast
- Encourage users to check out the movie/show pages on CineHub for more details
- If you don't know something specific, be honest about it
- Keep responses focused on entertainment topics only

**INTENT ROUTING — How you should handle different types of questions:**

1. **Platform help / how-to questions** (e.g. "How do I create a post?", "How do I join a community?")
   → Answer directly using the Platform Help Knowledge below. Do NOT call any tools.

2. **Community or post search / recommendation questions** (e.g. "Find Marvel communities", "Show trending posts", "Recommend a discussion")
   → Call the appropriate tool: searchCommunitiesByTopic, getTrendingPosts, or searchPostsByTopic.

3. **Opinion or discussion-based questions** (e.g. "What do people think about Interstellar?", "What are fans saying about Loki?")
   → Call the searchReviewsAndPosts tool to retrieve real user reviews and community discussions via RAG.

4. **General movie/TV questions** (e.g. "Tell me about Inception", "Suggest sci-fi movies")
   → Answer directly using your knowledge and any provided TMDB context. Use getMovieDetails if specific data is needed.

**PLATFORM HELP KNOWLEDGE — CineHub Features Guide:**

- **Creating a Post:**
  1. Navigate to a community you are a member of.
  2. Click the "Create Post" button at the top of the community page.
  3. Enter a title, write your content, and optionally attach images or videos.
  4. Click "Submit" to publish your post.

- **Joining a Community:**
  1. Go to the Communities section from the navigation bar.
  2. Browse or search for a community you're interested in.
  3. Open the community page and click the "Join" button.
  4. If the community requires approval, your request will be sent to the moderators.

- **Creating a Community:**
  1. Go to the Communities section.
  2. Click the "Create Community" button.
  3. Fill in the community name, description, category, and optionally upload a banner and icon.
  4. Set privacy and moderation settings (public/private, approval required, etc.).
  5. Click "Create" to publish your new community.

- **Following a User:**
  1. Visit the user's profile page.
  2. Click the "Follow" button on their profile.
  3. You will see their activity in your feed.

- **Writing a Review:**
  1. Go to any movie or TV show detail page.
  2. Scroll down to the Reviews section.
  3. Click "Write a Review".
  4. Give a rating (0-10), add a title and your review text.
  5. Optionally mark it as containing spoilers.
  6. Submit your review.

- **Using the Watchlist:**
  1. On any movie or TV show page, click the "Add to Watchlist" button.
  2. Access your full watchlist from your profile or the Watchlist page in the navigation.
  3. You can remove items from your watchlist at any time.

- **Searching for Movies/Shows:**
  1. Use the search bar in the navigation to search by title.
  2. Use the Browse page to filter by genre, year, rating, and more.
  3. Check the Recommendations page for personalized suggestions.

- **Managing Your Profile:**
  1. Click your avatar in the top-right corner.
  2. Go to "Profile" to view and edit your information.
  3. You can update your bio, avatar, favorite genres, and notification preferences.

Remember: You're here ONLY for cinema and entertainment discussions!`;

// Function to fetch context data from TMDB
async function fetchContextData(query) {
  const context = {};
  const lowerQuery = query.toLowerCase();

  try {
    // Always fetch trending for context
    if (lowerQuery.includes("trending") || lowerQuery.includes("popular") || lowerQuery.includes("what's hot") || lowerQuery.includes("recommend")) {
      const [trendingMovies, trendingTV] = await Promise.all([
        tmdbService.getTrending("movie", "week").catch(() => []),
        tmdbService.getTrending("tv", "week").catch(() => []),
      ]);
      context.trendingMovies = trendingMovies.slice(0, 5);
      context.trendingTV = trendingTV.slice(0, 5);
    }

    // Fetch upcoming movies
    if (lowerQuery.includes("upcoming") || lowerQuery.includes("coming soon") || lowerQuery.includes("releasing")) {
      const upcoming = await tmdbService.getUpcoming().catch(() => ({ results: [] }));
      context.upcomingMovies = upcoming.results?.slice(0, 5) || [];
    }

    // Fetch now playing
    if (lowerQuery.includes("now playing") || lowerQuery.includes("in theaters") || lowerQuery.includes("cinema")) {
      const nowPlaying = await tmdbService.getNowPlaying().catch(() => ({ results: [] }));
      context.nowPlaying = nowPlaying.results?.slice(0, 5) || [];
    }

    // Search for specific movie/show if mentioned
    const searchTerms = extractSearchTerms(query);
    if (searchTerms) {
      const [movieResults, tvResults] = await Promise.all([
        tmdbService.searchMovies(searchTerms).catch(() => ({ results: [] })),
        tmdbService.searchTV(searchTerms).catch(() => ({ results: [] })),
      ]);
      if (movieResults.results?.length > 0) {
        context.searchedMovies = movieResults.results.slice(0, 3);
      }
      if (tvResults.results?.length > 0) {
        context.searchedTV = tvResults.results.slice(0, 3);
      }
    }

    // Search for person/actor
    if (lowerQuery.includes("actor") || lowerQuery.includes("actress") || lowerQuery.includes("director") || lowerQuery.includes("who played") || lowerQuery.includes("cast")) {
      const personSearch = extractSearchTerms(query);
      if (personSearch) {
        const personResults = await tmdbService.searchPerson(personSearch).catch(() => ({ results: [] }));
        if (personResults.results?.length > 0) {
          context.searchedPerson = personResults.results.slice(0, 2);
        }
      }
    }
  } catch (error) {
    console.error("Error fetching context data:", error);
  }

  return context;
}

// Extract potential search terms from query
function extractSearchTerms(query) {
  // Remove common words and extract potential titles/names
  const stopWords = ["what", "who", "when", "where", "how", "is", "are", "the", "a", "an", "about", "tell", "me", "show", "movie", "tv", "series", "film", "actor", "actress", "director", "recommend", "suggest", "like", "similar", "to", "best", "top", "good", "great", "watch", "should", "i", "can", "you", "please", "trending", "popular", "new", "latest", "upcoming"];
  
  const words = query.toLowerCase().split(/\s+/);
  const filteredWords = words.filter(word => !stopWords.includes(word) && word.length > 2);
  
  if (filteredWords.length > 0) {
    return filteredWords.join(" ");
  }
  return null;
}

// Format context data for the AI
function formatContextForAI(context) {
  let contextStr = "\n\n--- CURRENT CINEHUB DATA ---\n";

  if (context.trendingMovies?.length > 0) {
    contextStr += "\n📽️ Trending Movies This Week:\n";
    context.trendingMovies.forEach((movie, i) => {
      contextStr += `${i + 1}. ${movie.title} (${movie.releaseDate?.split("-")[0] || "N/A"}) - ⭐ ${movie.rating?.toFixed(1) || "N/A"}\n`;
    });
  }

  if (context.trendingTV?.length > 0) {
    contextStr += "\n📺 Trending TV Shows This Week:\n";
    context.trendingTV.forEach((show, i) => {
      contextStr += `${i + 1}. ${show.title} (${show.releaseDate?.split("-")[0] || "N/A"}) - ⭐ ${show.rating?.toFixed(1) || "N/A"}\n`;
    });
  }

  if (context.upcomingMovies?.length > 0) {
    contextStr += "\n🎬 Upcoming Movies:\n";
    context.upcomingMovies.forEach((movie, i) => {
      contextStr += `${i + 1}. ${movie.title} - Releasing: ${movie.releaseDate || "TBA"}\n`;
    });
  }

  if (context.nowPlaying?.length > 0) {
    contextStr += "\n🎭 Now Playing in Theaters:\n";
    context.nowPlaying.forEach((movie, i) => {
      contextStr += `${i + 1}. ${movie.title} - ⭐ ${movie.rating?.toFixed(1) || "N/A"}\n`;
    });
  }

  if (context.searchedMovies?.length > 0) {
    contextStr += "\n🔍 Relevant Movies Found:\n";
    context.searchedMovies.forEach((movie, i) => {
      contextStr += `${i + 1}. ${movie.title} (${movie.releaseDate?.split("-")[0] || "N/A"}) - ⭐ ${movie.rating?.toFixed(1) || "N/A"} - ${movie.overview?.slice(0, 100) || "No description"}...\n`;
    });
  }

  if (context.searchedTV?.length > 0) {
    contextStr += "\n🔍 Relevant TV Shows Found:\n";
    context.searchedTV.forEach((show, i) => {
      contextStr += `${i + 1}. ${show.title} (${show.releaseDate?.split("-")[0] || "N/A"}) - ⭐ ${show.rating?.toFixed(1) || "N/A"} - ${show.overview?.slice(0, 100) || "No description"}...\n`;
    });
  }

  if (context.searchedPerson?.length > 0) {
    contextStr += "\n👤 People Found:\n";
    context.searchedPerson.forEach((person, i) => {
      contextStr += `${i + 1}. ${person.name} - Known for: ${person.knownForDepartment || "Acting"}\n`;
    });
  }

  return contextStr === "\n\n--- CURRENT CINEHUB DATA ---\n" ? "" : contextStr;
}

// ────────────────────────────────────────────────────────────────────────────
// Tool definitions for Gemini function-calling
// ────────────────────────────────────────────────────────────────────────────
const tools = [
  {
    functionDeclarations: [
      {
        name: "searchCommunitiesByTopic",
        description:
          "Search CineHub communities by topic. Use when the user asks about communities, groups, or fan clubs on the platform.",
        parameters: {
          type: "object",
          properties: {
            topic: {
              type: "string",
              description:
                "The topic to search for (e.g. 'Marvel', 'anime', 'Game of Thrones').",
            },
          },
          required: ["topic"],
        },
      },
      {
        name: "getMovieDetails",
        description:
          "Get detailed information about a specific movie or TV show from TMDB. Use when the user asks for specific details about a title.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The title of the movie or TV show to look up.",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "searchReviewsAndPosts",
        description:
          "Search CineHub user reviews and community posts about a movie, show, or topic. Use when the user asks what people think, what fans are saying, or asks for opinions/discussions from the platform.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                "The search query describing what the user wants to know about (e.g. 'Interstellar opinions', 'Loki fan reactions').",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "getTrendingPosts",
        description:
          "Get the currently trending / most popular posts across all CineHub communities. Use when the user asks for trending discussions, popular posts, hot topics, or what people are talking about on the platform.",
        parameters: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Number of posts to return (default 5, max 10).",
            },
          },
        },
      },
      {
        name: "searchPostsByTopic",
        description:
          "Search CineHub community posts by a keyword or topic. Use when the user asks to find posts, discussions, or threads about a specific subject.",
        parameters: {
          type: "object",
          properties: {
            topic: {
              type: "string",
              description:
                "The topic or keyword to search posts for (e.g. 'Marvel', 'best horror scenes', 'Dune review').",
            },
          },
          required: ["topic"],
        },
      },
    ],
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Tool execution handlers
// ────────────────────────────────────────────────────────────────────────────
async function executeTool(name, args) {
  switch (name) {
    case "searchCommunitiesByTopic": {
      const communities = await searchCommunitiesByTopic(args.topic);
      return JSON.stringify(communities);
    }

    case "getMovieDetails": {
      const [movieResults, tvResults] = await Promise.all([
        tmdbService.searchMovies(args.query).catch(() => ({ results: [] })),
        tmdbService.searchTV(args.query).catch(() => ({ results: [] })),
      ]);
      const results = {
        movies: movieResults.results?.slice(0, 3) || [],
        tvShows: tvResults.results?.slice(0, 3) || [],
      };
      return JSON.stringify(results);
    }

    case "searchReviewsAndPosts": {
      const ragContext = await retrieveRAGContext(args.query);
      return ragContext || "No reviews or posts found for this topic on CineHub.";
    }

    case "getTrendingPosts": {
      const posts = await getTrendingPosts(args.limit || 5);
      return JSON.stringify(posts);
    }

    case "searchPostsByTopic": {
      const posts = await searchPostsByTopic(args.topic);
      return JSON.stringify(posts);
    }

    default:
      return JSON.stringify({ error: "Unknown tool" });
  }
}

// ────────────────────────────────────────────────────────────────────────────
// POST handler
// ────────────────────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Fetch TMDB context (existing logic)
    const contextData = await fetchContextData(message);
    const contextStr = formatContextForAI(contextData);

    // Build contents (chat-style memory)
    const contents = [
      {
        role: "user",
        parts: [{ text: SYSTEM_PROMPT }],
      },
      {
        role: "model",
        parts: [
          {
            text: "Understood! I'm CineBot, ready to help you explore movies and TV shows.",
          },
        ],
      },
      ...conversationHistory.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })),
      {
        role: "user",
        parts: [
          {
            text: contextStr
              ? `${message}\n${contextStr}`
              : message,
          },
        ],
      },
    ];

    // ── First call: let the LLM decide whether to call tools ──
    let result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        tools,
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    // ── Handle tool calls (may be multiple) ──
    const candidate = result.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    const functionCalls = parts.filter((p) => p.functionCall);

    if (functionCalls.length > 0) {
      // Execute all requested tools
      const toolResults = [];
      for (const fc of functionCalls) {
        const output = await executeTool(fc.functionCall.name, fc.functionCall.args);
        toolResults.push({
          functionResponse: {
            name: fc.functionCall.name,
            response: { result: output },
          },
        });
      }

      // Send tool results back to the model for final answer
      contents.push({
        role: "model",
        parts: functionCalls.map((fc) => ({ functionCall: fc.functionCall })),
      });
      contents.push({
        role: "user",
        parts: toolResults,
      });

      result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          tools,
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      });
    }

    return NextResponse.json({
      message: result.text,
      context: Object.keys(contextData).length ? contextData : null,
    });
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return NextResponse.json(
      { error: "Failed to process your request." },
      { status: 500 }
    );
  }
}