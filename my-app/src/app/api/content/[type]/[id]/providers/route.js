import { NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w92";
const REGION = "IN";

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

    // The TMDB link is a JustWatch-powered URL for this title in the region
    const watchLink = regionData.link || null;

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
      }));

    return NextResponse.json({ providers, link: watchLink });
  } catch (error) {
    console.error("Providers fetch error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
