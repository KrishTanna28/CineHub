import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import * as tmdbService from "@/lib/services/tmdb.service";

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

export async function POST(request) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Fetch TMDB context
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

    const result = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents,
  generationConfig: {
    maxOutputTokens: 1024,
    temperature: 0.7,
  },
});


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