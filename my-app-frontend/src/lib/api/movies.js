const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class MovieAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/movies`;
  }

  // Helper method to make requests
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
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

  // Get trending movies/TV shows
  async getTrending(mediaType = 'all', timeWindow = 'week') {
    return this.request(`/trending?mediaType=${mediaType}&timeWindow=${timeWindow}`);
  }

  // Get popular movies
  async getPopular(page = 1) {
    return this.request(`/popular?page=${page}`);
  }

  // Get top rated movies
  async getTopRated(page = 1) {
    return this.request(`/top-rated?page=${page}`);
  }

  // Get now playing movies
  async getNowPlaying(page = 1) {
    return this.request(`/now-playing?page=${page}`);
  }

  // Get upcoming movies
  async getUpcoming(page = 1) {
    return this.request(`/upcoming?page=${page}`);
  }

  // Get movie details
  async getMovieDetails(movieId) {
    return this.request(`/${movieId}`);
  }

  // Search movies
  async searchMovies(query, page = 1) {
    return this.request(`/search?query=${encodeURIComponent(query)}&page=${page}`);
  }

  // Discover movies with filters
  async discoverMovies(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page);
    if (filters.genres) params.append('genres', filters.genres);
    if (filters.year) params.append('year', filters.year);
    if (filters.language) params.append('language', filters.language);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.minRating) params.append('minRating', filters.minRating);
    if (filters.maxRating) params.append('maxRating', filters.maxRating);

    return this.request(`/discover?${params.toString()}`);
  }

  // Get movie genres
  async getGenres() {
    return this.request('/genres');
  }

  // ===== TV SHOW METHODS =====

  // Get popular TV shows
  async getPopularTV(page = 1) {
    return this.request(`/tv/popular?page=${page}`);
  }

  // Get top rated TV shows
  async getTopRatedTV(page = 1) {
    return this.request(`/tv/top-rated?page=${page}`);
  }

  // Get airing today TV shows
  async getAiringTodayTV(page = 1) {
    return this.request(`/tv/airing-today?page=${page}`);
  }

  // Get on the air TV shows
  async getOnTheAirTV(page = 1) {
    return this.request(`/tv/on-the-air?page=${page}`);
  }

  // Get TV show details
  async getTVDetails(tvId) {
    return this.request(`/tv/${tvId}`);
  }

  // Get TV season details
  async getTVSeasonDetails(tvId, seasonNumber, page = 1) {
    return this.request(`/tv/${tvId}/season/${seasonNumber}?page=${page}`);
  }

  // Search TV shows
  async searchTV(query, page = 1) {
    return this.request(`/tv/search?query=${encodeURIComponent(query)}&page=${page}`);
  }

  // Search multi (movies + TV shows)
  async searchMulti(query, page = 1) {
    return this.request(`/search/multi?query=${encodeURIComponent(query)}&page=${page}`);
  }

  // Discover TV shows with filters
  async discoverTV(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page);
    if (filters.genres) params.append('genres', filters.genres);
    if (filters.year) params.append('year', filters.year);
    if (filters.language) params.append('language', filters.language);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.minRating) params.append('minRating', filters.minRating);
    if (filters.maxRating) params.append('maxRating', filters.maxRating);

    return this.request(`/tv/discover?${params.toString()}`);
  }

  // ===== PERSON/ACTOR METHODS =====

  // Get person/actor details
  async getPersonDetails(personId) {
    return this.request(`/person/${personId}`);
  }
}

export default new MovieAPI();
