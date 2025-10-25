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
          append_to_response: 'credits,videos,similar,recommendations,watch/providers,release_dates',
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
          append_to_response: 'credits,videos,similar,recommendations,watch/providers,content_ratings',
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
      
      // Format results including people
      const formattedResults = response.data.results.map(item => {
        if (item.media_type === 'person') {
          return {
            id: item.id,
            title: item.name,
            mediaType: 'person',
            poster: this.getImageUrl(item.profile_path, 'w500'),
            knownFor: item.known_for?.map(kf => kf.title || kf.name).join(', ') || '',
            popularity: item.popularity,
          };
        } else {
          // Format movie/TV show item
          return {
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
          };
        }
      });

      return {
        results: formattedResults,
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

  // Get certification/content rating
  getCertification(releaseDates) {
    if (!releaseDates?.results) return null;
    
    // Priority order: IN (India), US, GB (UK)
    const countries = ['IN', 'US', 'GB'];
    
    for (const country of countries) {
      const countryData = releaseDates.results.find(r => r.iso_3166_1 === country);
      if (countryData?.release_dates) {
        // Find theatrical or primary release
        const release = countryData.release_dates.find(r => 
          r.type === 3 || r.type === 2 || r.certification
        );
        if (release?.certification) {
          return release.certification;
        }
      }
    }
    
    return null;
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
      certification: this.getCertification(movie.release_dates),
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

  // Get TV content rating
  getTVCertification(contentRatings) {
    if (!contentRatings?.results) return null;
    
    // Priority order: IN (India), US, GB (UK)
    const countries = ['IN', 'US', 'GB'];
    
    for (const country of countries) {
      const rating = contentRatings.results.find(r => r.iso_3166_1 === country);
      if (rating?.rating) {
        return rating.rating;
      }
    }
    
    return null;
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
      certification: this.getTVCertification(tv.content_ratings),
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

  // ===== PERSON/ACTOR METHODS =====

  // Get person/actor details
  async getPersonDetails(personId) {
    try {
      const response = await this.api.get(`/person/${personId}`, {
        params: {
          append_to_response: 'movie_credits,tv_credits,images,external_ids',
        },
      });
      return this.formatPersonDetails(response.data);
    } catch (error) {
      console.error('TMDB getPersonDetails error:', error.message);
      throw new Error('Failed to fetch person details');
    }
  }

  // Format person details
  formatPersonDetails(person) {
    return {
      id: person.id,
      name: person.name,
      biography: person.biography,
      birthday: person.birthday,
      deathday: person.deathday,
      placeOfBirth: person.place_of_birth,
      knownForDepartment: person.known_for_department,
      gender: person.gender, // 0: Not specified, 1: Female, 2: Male, 3: Non-binary
      popularity: person.popularity,
      profilePath: this.getImageUrl(person.profile_path, 'h632'),
      homepage: person.homepage,
      alsoKnownAs: person.also_known_as,
      // External IDs
      externalIds: {
        imdbId: person.external_ids?.imdb_id,
        facebookId: person.external_ids?.facebook_id,
        instagramId: person.external_ids?.instagram_id,
        twitterId: person.external_ids?.twitter_id,
      },
      // Images
      images: person.images?.profiles?.slice(0, 20).map((image) => ({
        filePath: this.getImageUrl(image.file_path, 'w500'),
        aspectRatio: image.aspect_ratio,
        height: image.height,
        width: image.width,
      })),
      // Movie credits
      movieCredits: {
        cast: person.movie_credits?.cast
          ?.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .map((movie) => ({
            id: movie.id,
            title: movie.title,
            character: movie.character,
            releaseDate: movie.release_date,
            poster: this.getImageUrl(movie.poster_path, 'w500'),
            rating: movie.vote_average,
            mediaType: 'movie',
          })),
        crew: person.movie_credits?.crew
          ?.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .map((movie) => ({
            id: movie.id,
            title: movie.title,
            job: movie.job,
            department: movie.department,
            releaseDate: movie.release_date,
            poster: this.getImageUrl(movie.poster_path, 'w500'),
            rating: movie.vote_average,
            mediaType: 'movie',
          })),
      },
      // TV credits
      tvCredits: {
        cast: person.tv_credits?.cast
          ?.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .map((tv) => ({
            id: tv.id,
            title: tv.name,
            character: tv.character,
            firstAirDate: tv.first_air_date,
            poster: this.getImageUrl(tv.poster_path, 'w500'),
            rating: tv.vote_average,
            episodeCount: tv.episode_count,
            mediaType: 'tv',
          })),
        crew: person.tv_credits?.crew
          ?.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .map((tv) => ({
            id: tv.id,
            title: tv.name,
            job: tv.job,
            department: tv.department,
            firstAirDate: tv.first_air_date,
            poster: this.getImageUrl(tv.poster_path, 'w500'),
            rating: tv.vote_average,
            episodeCount: tv.episode_count,
            mediaType: 'tv',
          })),
      },
    };
  }
}

export default new TMDBService();
