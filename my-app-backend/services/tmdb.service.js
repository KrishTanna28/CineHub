import axios from 'axios';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

class TMDBService {
  constructor() {
    this.api = axios.create({
      baseURL: TMDB_BASE_URL,
      params: {
        api_key: TMDB_API_KEY,
      },
    });
  }

  // Helper to build image URLs
  getImageUrl(path, size = 'original') {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
  }

  // Get trending movies/TV shows (day or week)
  async getTrending(mediaType = 'all', timeWindow = 'week') {
    try {
      const response = await this.api.get(`/trending/${mediaType}/${timeWindow}`);
      return this.formatMediaList(response.data.results);
    } catch (error) {
      console.error('TMDB getTrending error:', error.message);
      throw new Error('Failed to fetch trending content');
    }
  }

  // Get popular movies
  async getPopular(page = 1) {
    try {
      const response = await this.api.get('/movie/popular', {
        params: { page },
      });
      return {
        results: this.formatMovieList(response.data.results),
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results,
      };
    } catch (error) {
      console.error('TMDB getPopular error:', error.message);
      throw new Error('Failed to fetch popular movies');
    }
  }

  // Get top rated movies
  async getTopRated(page = 1) {
    try {
      const response = await this.api.get('/movie/top_rated', {
        params: { page },
      });
      return {
        results: this.formatMovieList(response.data.results),
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results,
      };
    } catch (error) {
      console.error('TMDB getTopRated error:', error.message);
      throw new Error('Failed to fetch top rated movies');
    }
  }

  // Get now playing movies
  async getNowPlaying(page = 1) {
    try {
      const response = await this.api.get('/movie/now_playing', {
        params: { page },
      });
      return {
        results: this.formatMovieList(response.data.results),
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results,
      };
    } catch (error) {
      console.error('TMDB getNowPlaying error:', error.message);
      throw new Error('Failed to fetch now playing movies');
    }
  }

  // Get upcoming movies
  async getUpcoming(page = 1) {
    try {
      const response = await this.api.get('/movie/upcoming', {
        params: { page },
      });
      return {
        results: this.formatMovieList(response.data.results),
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results,
      };
    } catch (error) {
      console.error('TMDB getUpcoming error:', error.message);
      throw new Error('Failed to fetch upcoming movies');
    }
  }

  // Get movie details by ID
  async getMovieDetails(movieId) {
    try {
      const response = await this.api.get(`/movie/${movieId}`, {
        params: {
          append_to_response: 'credits,videos,similar,recommendations,watch/providers',
        },
      });
      return this.formatMovieDetails(response.data);
    } catch (error) {
      console.error('TMDB getMovieDetails error:', error.message);
      throw new Error('Failed to fetch movie details');
    }
  }

  // Search movies
  async searchMovies(query, page = 1) {
    try {
      const response = await this.api.get('/search/movie', {
        params: { query, page },
      });
      return {
        results: this.formatMovieList(response.data.results),
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results,
      };
    } catch (error) {
      console.error('TMDB searchMovies error:', error.message);
      throw new Error('Failed to search movies');
    }
  }

  // Discover movies with filters
  async discoverMovies(filters = {}) {
    try {
      const response = await this.api.get('/discover/movie', {
        params: {
          page: filters.page || 1,
          with_genres: filters.genres,
          primary_release_year: filters.year,
          with_original_language: filters.language,
          sort_by: filters.sortBy || 'popularity.desc',
          'vote_average.gte': filters.minRating,
          'vote_average.lte': filters.maxRating,
        },
      });
      return {
        results: this.formatMovieList(response.data.results),
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results,
      };
    } catch (error) {
      console.error('TMDB discoverMovies error:', error.message);
      throw new Error('Failed to discover movies');
    }
  }

  // Get movie genres
  async getGenres() {
    try {
      const response = await this.api.get('/genre/movie/list');
      return response.data.genres;
    } catch (error) {
      console.error('TMDB getGenres error:', error.message);
      throw new Error('Failed to fetch genres');
    }
  }

  // ===== TV SHOW METHODS =====

  // Get popular TV shows
  async getPopularTV(page = 1) {
    try {
      const response = await this.api.get('/tv/popular', {
        params: { page },
      });
      return {
        results: this.formatMediaList(response.data.results),
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results,
      };
    } catch (error) {
      console.error('TMDB getPopularTV error:', error.message);
      throw new Error('Failed to fetch popular TV shows');
    }
  }

  // Get top rated TV shows
  async getTopRatedTV(page = 1) {
    try {
      const response = await this.api.get('/tv/top_rated', {
        params: { page },
      });
      return {
        results: this.formatMediaList(response.data.results),
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results,
      };
    } catch (error) {
      console.error('TMDB getTopRatedTV error:', error.message);
      throw new Error('Failed to fetch top rated TV shows');
    }
  }

  // Get airing today TV shows
  async getAiringTodayTV(page = 1) {
    try {
      const response = await this.api.get('/tv/airing_today', {
        params: { page },
      });
      return {
        results: this.formatMediaList(response.data.results),
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results,
      };
    } catch (error) {
      console.error('TMDB getAiringTodayTV error:', error.message);
      throw new Error('Failed to fetch airing today TV shows');
    }
  }

  // Get on the air TV shows
  async getOnTheAirTV(page = 1) {
    try {
      const response = await this.api.get('/tv/on_the_air', {
        params: { page },
      });
      return {
        results: this.formatMediaList(response.data.results),
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results,
      };
    } catch (error) {
      console.error('TMDB getOnTheAirTV error:', error.message);
      throw new Error('Failed to fetch on the air TV shows');
    }
  }

  // Get TV show details
  async getTVDetails(tvId) {
    try {
      const response = await this.api.get(`/tv/${tvId}`, {
        params: {
          append_to_response: 'credits,videos,similar,recommendations,watch/providers',
        },
      });
      return this.formatTVDetails(response.data);
    } catch (error) {
      console.error('TMDB getTVDetails error:', error.message);
      throw new Error('Failed to fetch TV show details');
    }
  }

  // Search TV shows
  async searchTV(query, page = 1) {
    try {
      const response = await this.api.get('/search/tv', {
        params: { query, page },
      });
      return {
        results: this.formatMediaList(response.data.results),
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results,
      };
    } catch (error) {
      console.error('TMDB searchTV error:', error.message);
      throw new Error('Failed to search TV shows');
    }
  }

  // Get TV season details
  async getTVSeasonDetails(tvId, seasonNumber) {
    try {
      const response = await this.api.get(`/tv/${tvId}/season/${seasonNumber}`);
      return this.formatSeasonDetails(response.data);
    } catch (error) {
      console.error('TMDB getTVSeasonDetails error:', error.message);
      throw new Error('Failed to fetch season details');
    }
  }

  // Search multi (movies, TV shows, people)
  async searchMulti(query, page = 1) {
    try {
      const response = await this.api.get('/search/multi', {
        params: { query, page },
      });
      return {
        results: this.formatMediaList(response.data.results.filter(item => item.media_type !== 'person')),
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results,
      };
    } catch (error) {
      console.error('TMDB searchMulti error:', error.message);
      throw new Error('Failed to search content');
    }
  }

  // Discover TV shows with filters
  async discoverTV(filters = {}) {
    try {
      const response = await this.api.get('/discover/tv', {
        params: {
          page: filters.page || 1,
          with_genres: filters.genres,
          first_air_date_year: filters.year,
          with_original_language: filters.language,
          sort_by: filters.sortBy || 'popularity.desc',
          'vote_average.gte': filters.minRating,
          'vote_average.lte': filters.maxRating,
        },
      });
      return {
        results: this.formatMediaList(response.data.results),
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results,
      };
    } catch (error) {
      console.error('TMDB discoverTV error:', error.message);
      throw new Error('Failed to discover TV shows');
    }
  }

  // Format media list (movies + TV shows) for consistent response
  formatMediaList(items) {
    return items.map((item) => ({
      id: item.id,
      mediaType: item.media_type || (item.title ? 'movie' : 'tv'),
      title: item.title || item.name,
      originalTitle: item.original_title || item.original_name,
      overview: item.overview,
      releaseDate: item.release_date || item.first_air_date,
      rating: item.vote_average,
      voteCount: item.vote_count,
      popularity: item.popularity,
      adult: item.adult,
      genres: item.genre_ids,
      poster: this.getImageUrl(item.poster_path, 'w500'),
      backdrop: this.getImageUrl(item.backdrop_path, 'w1280'),
      originalLanguage: item.original_language,
    }));
  }

  // Format movie list for consistent response (legacy support)
  formatMovieList(movies) {
    return this.formatMediaList(movies);
  }

  // Format detailed movie info
  formatMovieDetails(movie) {
    return {
      id: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      tagline: movie.tagline,
      overview: movie.overview,
      releaseDate: movie.release_date,
      runtime: movie.runtime,
      rating: movie.vote_average,
      voteCount: movie.vote_count,
      popularity: movie.popularity,
      budget: movie.budget,
      revenue: movie.revenue,
      status: movie.status,
      adult: movie.adult,
      homepage: movie.homepage,
      imdbId: movie.imdb_id,
      originalLanguage: movie.original_language,
      spokenLanguages: movie.spoken_languages,
      productionCompanies: movie.production_companies,
      productionCountries: movie.production_countries,
      genres: movie.genres,
      poster: this.getImageUrl(movie.poster_path, 'w500'),
      backdrop: this.getImageUrl(movie.backdrop_path, 'original'),
      // Credits
      cast: movie.credits?.cast?.slice(0, 20).map((person) => ({
        id: person.id,
        name: person.name,
        character: person.character,
        profilePath: this.getImageUrl(person.profile_path, 'w185'),
      })),
      crew: movie.credits?.crew?.slice(0, 10).map((person) => ({
        id: person.id,
        name: person.name,
        job: person.job,
        department: person.department,
        profilePath: this.getImageUrl(person.profile_path, 'w185'),
      })),
      // Videos (trailers, teasers)
      videos: movie.videos?.results?.map((video) => ({
        id: video.id,
        key: video.key,
        name: video.name,
        site: video.site,
        type: video.type,
        official: video.official,
      })),
      // Similar and recommended movies
      similar: this.formatMovieList(movie.similar?.results || []),
      recommendations: this.formatMovieList(movie.recommendations?.results || []),
      // Watch providers
      watchProviders: this.formatWatchProviders(movie['watch/providers']?.results),
    };
  }

  // Format watch providers
  formatWatchProviders(providers) {
    if (!providers) return null;
    
    // Get providers for US, IN, and GB (you can add more countries)
    const countries = ['US', 'IN', 'GB'];
    const formatted = {};
    
    countries.forEach(country => {
      if (providers[country]) {
        formatted[country] = {
          link: providers[country].link,
          flatrate: providers[country].flatrate?.map(p => ({
            id: p.provider_id,
            name: p.provider_name,
            logo: this.getImageUrl(p.logo_path, 'w92'),
          })),
          rent: providers[country].rent?.map(p => ({
            id: p.provider_id,
            name: p.provider_name,
            logo: this.getImageUrl(p.logo_path, 'w92'),
          })),
          buy: providers[country].buy?.map(p => ({
            id: p.provider_id,
            name: p.provider_name,
            logo: this.getImageUrl(p.logo_path, 'w92'),
          })),
        };
      }
    });
    
    return Object.keys(formatted).length > 0 ? formatted : null;
  }

  // Format detailed TV show info
  formatTVDetails(tv) {
    return {
      id: tv.id,
      mediaType: 'tv',
      title: tv.name,
      originalTitle: tv.original_name,
      tagline: tv.tagline,
      overview: tv.overview,
      firstAirDate: tv.first_air_date,
      lastAirDate: tv.last_air_date,
      numberOfSeasons: tv.number_of_seasons,
      numberOfEpisodes: tv.number_of_episodes,
      episodeRunTime: tv.episode_run_time,
      rating: tv.vote_average,
      voteCount: tv.vote_count,
      popularity: tv.popularity,
      status: tv.status,
      type: tv.type,
      homepage: tv.homepage,
      inProduction: tv.in_production,
      originalLanguage: tv.original_language,
      spokenLanguages: tv.spoken_languages,
      productionCompanies: tv.production_companies,
      productionCountries: tv.production_countries,
      networks: tv.networks,
      genres: tv.genres,
      poster: this.getImageUrl(tv.poster_path, 'w500'),
      backdrop: this.getImageUrl(tv.backdrop_path, 'original'),
      // Credits
      cast: tv.credits?.cast?.slice(0, 20).map((person) => ({
        id: person.id,
        name: person.name,
        character: person.character,
        profilePath: this.getImageUrl(person.profile_path, 'w185'),
      })),
      crew: tv.credits?.crew?.slice(0, 10).map((person) => ({
        id: person.id,
        name: person.name,
        job: person.job,
        department: person.department,
        profilePath: this.getImageUrl(person.profile_path, 'w185'),
      })),
      // Videos (trailers, teasers)
      videos: tv.videos?.results?.map((video) => ({
        id: video.id,
        key: video.key,
        name: video.name,
        site: video.site,
        type: video.type,
        official: video.official,
      })),
      // Similar and recommended TV shows
      similar: this.formatMediaList(tv.similar?.results || []),
      recommendations: this.formatMediaList(tv.recommendations?.results || []),
      // Seasons info
      seasons: tv.seasons?.map((season) => ({
        id: season.id,
        name: season.name,
        overview: season.overview,
        seasonNumber: season.season_number,
        episodeCount: season.episode_count,
        airDate: season.air_date,
        rating: season.vote_average,
        poster: this.getImageUrl(season.poster_path, 'w500'),
      })),
      // Watch providers
      watchProviders: this.formatWatchProviders(tv['watch/providers']?.results),
    };
  }

  // Format season details with episodes
  formatSeasonDetails(season) {
    return {
      id: season.id,
      name: season.name,
      overview: season.overview,
      seasonNumber: season.season_number,
      airDate: season.air_date,
      rating: season.vote_average,
      poster: this.getImageUrl(season.poster_path, 'w500'),
      episodes: season.episodes?.map((episode) => ({
        id: episode.id,
        name: episode.name,
        overview: episode.overview,
        episodeNumber: episode.episode_number,
        seasonNumber: episode.season_number,
        airDate: episode.air_date,
        runtime: episode.runtime,
        rating: episode.vote_average,
        voteCount: episode.vote_count,
        stillPath: this.getImageUrl(episode.still_path, 'w300'),
        crew: episode.crew?.slice(0, 5).map((person) => ({
          id: person.id,
          name: person.name,
          job: person.job,
          department: person.department,
        })),
        guestStars: episode.guest_stars?.slice(0, 5).map((person) => ({
          id: person.id,
          name: person.name,
          character: person.character,
          profilePath: this.getImageUrl(person.profile_path, 'w185'),
        })),
      })),
    };
  }
}

export default new TMDBService();
