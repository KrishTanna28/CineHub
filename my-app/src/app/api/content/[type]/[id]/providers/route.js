import { NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w92";
const REGION = "IN";

// Direct URLs for streaming providers by TMDB provider_id
// These are the homepage / browse URLs for each platform in India
const PROVIDER_URLS = {
  8:   "https://www.netflix.com/in/",           // Netflix
  10:  "https://www.primevideo.com/",            // Amazon Prime Video
  122: "https://www.hotstar.com/in",             // Disney+ Hotstar
  237: "https://www.hotstar.com/in",             // Hotstar (legacy id)
  220: "https://www.hotstar.com/in",             // Hotstar Premium
  11:  "https://www.mubi.com/",                  // MUBI
  15:  "https://www.hulu.com/",                  // Hulu (rare in IN)
  119: "https://www.primevideo.com/",            // Amazon Prime Video (alt id)
  309: "https://www.zee5.com/",                  // ZEE5
  232: "https://www.zee5.com/",                  // ZEE5 (alt)
  255: "https://www.sonyliv.com/",               // SonyLIV
  423: "https://www.sonyliv.com/",               // SonyLIV (alt)
  218: "https://www.erosnow.com/",               // Eros Now
  315: "https://www.voot.com/",                  // Voot
  121: "https://www.voot.com/",                  // Voot Select
  192: "https://www.youtube.com/",               // YouTube
  188: "https://www.youtube.com/",               // YouTube Premium
  207: "https://www.hooq.tv/",                   // HOOQ
  350: "https://www.apple.com/apple-tv-plus/",   // Apple TV+
  2:   "https://tv.apple.com/",                  // Apple TV
  337: "https://www.disneyplus.com/",            // Disney+
  384: "https://www.hbomax.com/",                // HBO Max
  283: "https://www.crunchyroll.com/",           // Crunchyroll
  283: "https://www.crunchyroll.com/",           // Crunchyroll
  531: "https://www.paramountplus.com/",         // Paramount+
  387: "https://www.peacocktv.com/",             // Peacock
  444: "https://www.plex.tv/",                   // Plex
  538: "https://www.mxplayer.in/",               // MX Player
  220: "https://www.hotstar.com/in",             // Star (Hotstar)
  634: "https://www.jiocinema.com/",             // JioCinema
  220: "https://www.hotstar.com/in",             // Hotstar
};

export async function GET(request, { params }) {
  const { type, id } = await params;

  if (!["movie", "tv"].includes(type)) {
    return NextResponse.json({ error: "Invalid type. Must be 'movie' or 'tv'." }, { status: 400 });
  }

  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: "TMDB API key not configured." }, { status: 500 });
  }

  try {
    const url = `${TMDB_BASE}/${type}/${id}/watch/providers?api_key=${TMDB_API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch providers from TMDB." }, { status: res.status });
    }

    const data = await res.json();
    const regionData = data.results?.[REGION];

    if (!regionData) {
      return NextResponse.json({ providers: [], link: null });
    }

    // The TMDB link is a JustWatch-powered fallback URL for this title
    const tmdbLink = regionData.link || null;

    // Prefer flatrate (subscription), then free, then ads, then rent, then buy
    const providerList =
      regionData.flatrate ||
      regionData.free ||
      regionData.ads ||
      regionData.rent ||
      regionData.buy ||
      [];

    // Deduplicate by provider_id and map to simplified shape
    const seen = new Set();
    const providers = providerList
      .filter((p) => {
        if (seen.has(p.provider_id)) return false;
        seen.add(p.provider_id);
        return true;
      })
      .map((p) => ({
        id: p.provider_id,
        name: p.provider_name,
        logo: p.logo_path ? `${TMDB_IMAGE_BASE}${p.logo_path}` : null,
        // Use direct provider URL if known, otherwise fall back to TMDB link
        url: PROVIDER_URLS[p.provider_id] || tmdbLink,
      }));

    return NextResponse.json({ providers, link: tmdbLink });
  } catch (error) {
    console.error("Providers fetch error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
