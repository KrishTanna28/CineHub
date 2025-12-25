// Use internal Next.js API routes
const API_BASE_URL = '/api';
const baseURL = `${API_BASE_URL}/movies`;

async function request(endpoint, options = {}) {
  try {
    const response = await fetch(`${baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export async function getTrending(mediaType = 'all', timeWindow = 'week') {
  return request(`/trending?mediaType=${mediaType}&timeWindow=${timeWindow}`);
}

export async function getPopular(page = 1) {
  return request(`/popular?page=${page}`);
}

export async function getTopRated(page = 1) {
  return request(`/top-rated?page=${page}`);
}

export async function getNowPlaying(page = 1) {
  return request(`/now-playing?page=${page}`);
}

export async function getUpcoming(page = 1) {
  return request(`/upcoming?page=${page}`);
}

export async function getMovieDetails(movieId) {
  return request(`/${movieId}`);
}

export async function searchMovies(query, page = 1) {
  return request(`/search?query=${encodeURIComponent(query)}&page=${page}`);
}

export async function discoverMovies(filters = {}) {
  const params = new URLSearchParams();

  if (filters.page) params.append('page', filters.page);
  if (filters.genres) params.append('genres', filters.genres);
  if (filters.year) params.append('year', filters.year);
  if (filters.language) params.append('language', filters.language);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.minRating) params.append('minRating', filters.minRating);
  if (filters.maxRating) params.append('maxRating', filters.maxRating);

  return request(`/discover?${params.toString()}`);
}

export async function getGenres() {
  return request('/genres');
}

// ===== TV SHOW METHODS =====
export async function getPopularTV(page = 1) {
  return request(`/tv/popular?page=${page}`);
}

export async function getTopRatedTV(page = 1) {
  return request(`/tv/top-rated?page=${page}`);
}

export async function getAiringTodayTV(page = 1) {
  return request(`/tv/airing-today?page=${page}`);
}

export async function getOnTheAirTV(page = 1) {
  return request(`/tv/on-the-air?page=${page}`);
}

export async function getTVDetails(tvId) {
  return request(`/tv/${tvId}`);
}

export async function getTVSeasonDetails(tvId, seasonNumber, page = 1) {
  return request(`/tv/${tvId}/season/${seasonNumber}?page=${page}`);
}

export async function searchTV(query, page = 1) {
  return request(`/tv/search?query=${encodeURIComponent(query)}&page=${page}`);
}

export async function searchMulti(query, page = 1) {
  return request(`/search/multi?query=${encodeURIComponent(query)}&page=${page}`);
}

export async function discoverTV(filters = {}) {
  const params = new URLSearchParams();

  if (filters.page) params.append('page', filters.page);
  if (filters.genres) params.append('genres', filters.genres);
  if (filters.year) params.append('year', filters.year);
  if (filters.language) params.append('language', filters.language);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.minRating) params.append('minRating', filters.minRating);
  if (filters.maxRating) params.append('maxRating', filters.maxRating);

  return request(`/tv/discover?${params.toString()}`);
}

// ===== PERSON/ACTOR METHODS =====
export async function getPersonDetails(personId) {
  return request(`/person/${personId}`);
}
