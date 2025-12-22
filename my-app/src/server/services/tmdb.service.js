import axios from 'axios';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Create axios instance
const api = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
  },
});

  // Helper to build image URLs
export function getImageUrl(path, size = 'original') {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
  }

  // Get trending movies/TV shows (day or week)
export async function getTrending(mediaType = 'all', timeWindow = 'week') {
    try {
      const response = await api.get(`/trending/${mediaType}/${timeWindow}`);
      return formatMediaList(response.data.results);
    } catch (error) {
      console.error('TMDB getTrending error:', error.message);
      throw new Error('Failed to fetch trending content');
    }
  }

  // Get popular movies
export async function getPopular(page = 1) {
    try {
      const response = await api.get('/movie/popular', {
        params: { page },
      });
      return {
        results: formatMovieList(response.data.results),
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
export async function getTopRated(page = 1) {
    try {
      const response = await api.get('/movie/top_rated', {
        params: { page },
      });
      return {
        results: formatMovieList(response.data.results),
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
export async function getNowPlaying(page = 1) {
    try {
      const response = await api.get('/movie/now_playing', {
        params: { page },
      });
      return {
        results: formatMovieList(response.data.results),
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
export async function getUpcoming(page = 1) {
    try {
      const response = await api.get('/movie/upcoming', {
        params: { page },
      });
      return {
        results: formatMovieList(response.data.results),
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
export async function getMovieDetails(movieId) {
    try {
      const response = await api.get(`/movie/${movieId}`, {
        params: {
          append_to_response: 'credits,videos,similar,recommendations,watch/providers,release_dates',
        },
      });
      return formatMovieDetails(response.data);
    } catch (error) {
      console.error('TMDB getMovieDetails error:', error.message);
      throw new Error('Failed to fetch movie details');
    }
  }

  // Search movies
export async function searchMovies(query, page = 1) {
    try {
      const response = await api.get('/search/movie', {
        params: { query, page },
      });
      return {
        results: formatMovieList(response.data.results),
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
export async function discoverMovies(filters = {}) {
    try {
      const response = await api.get('/discover/movie', {
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
        results: formatMovieList(response.data.results),
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
export async function getGenres() {
    try {
      const response = await api.get('/genre/movie/list');
      return response.data.genres;
    } catch (error) {
      console.error('TMDB getGenres error:', error.message);
      throw new Error('Failed to fetch genres');
    }
  }

  // ===== TV SHOW METHODS =====

  // Get popular TV shows
export async function getPopularTV(page = 1) {
    try {
      const response = await api.get('/tv/popular', {
        params: { page },
      });
      return {
        results: formatMediaList(response.data.results),
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
export async function getTopRatedTV(page = 1) {
    try {
      const response = await api.get('/tv/top_rated', {
        params: { page },
      });
      return {
        results: formatMediaList(response.data.results),
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
export async function getAiringTodayTV(page = 1) {
    try {
      const response = await api.get('/tv/airing_today', {
        params: { page },
      });
      return {
        results: formatMediaList(response.data.results),
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
export async function getOnTheAirTV(page = 1) {
    try {
      const response = await api.get('/tv/on_the_air', {
        params: { page },
      });
      return {
        results: formatMediaList(response.data.results),
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
export async function getTVDetails(tvId) {
    try {
      const response = await api.get(`/tv/${tvId}`, {
        params: {
          append_to_response: 'credits,videos,similar,recommendations,watch/providers,content_ratings',
        },
      });
      return formatTVDetails(response.data);
    } catch (error) {
      console.error('TMDB getTVDetails error:', error.message);
      throw new Error('Failed to fetch TV show details');
    }
  }

  // Search TV shows
export async function searchTV(query, page = 1) {
    try {
      const response = await api.get('/search/tv', {
        params: { query, page },
      });
      return {
        results: formatMediaList(response.data.results),
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
export async function getTVSeasonDetails(tvId, seasonNumber) {
    try {
      const response = await api.get(`/tv/${tvId}/season/${seasonNumber}`);
      return formatSeasonDetails(response.data);
    } catch (error) {
      console.error('TMDB getTVSeasonDetails error:', error.message);
      throw new Error('Failed to fetch season details');
    }
  }

  // Search multi (movies, TV shows, people)
export async function searchMulti(query, page = 1) {
    try {
      const response = await api.get('/search/multi', {
        params: { query, page },
      });
      
      // Format results including people
      const formattedResults = response.data.results.map(item => {
        if (item.media_type === 'person') {
          return {
            id: item.id,
            title: item.name,
            mediaType: 'person',
            poster: getImageUrl(item.profile_path, 'w500'),
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
            poster: getImageUrl(item.poster_path, 'w500'),
            backdrop: getImageUrl(item.backdrop_path, 'w1280'),
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
export async function discoverTV(filters = {}) {
    try {
      const response = await api.get('/discover/tv', {
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
        results: formatMediaList(response.data.results),
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
export function formatMediaList(items) {
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
      poster: getImageUrl(item.poster_path, 'w500'),
      backdrop: getImageUrl(item.backdrop_path, 'w1280'),
      originalLanguage: item.original_language,
    }));
  }

  // Format movie list for consistent response (legacy support)
export function formatMovieList(movies) {
    return formatMediaList(movies);
  }

  // Get certification/content rating
export function getCertification(releaseDates) {
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
export function formatMovieDetails(movie) {
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
      certification: getCertification(movie.release_dates),
      homepage: movie.homepage,
      imdbId: movie.imdb_id,
      originalLanguage: movie.original_language,
      spokenLanguages: movie.spoken_languages,
      productionCompanies: movie.production_companies,
      productionCountries: movie.production_countries,
      genres: movie.genres,
      poster: getImageUrl(movie.poster_path, 'w500'),
      backdrop: getImageUrl(movie.backdrop_path, 'original'),
      // Credits
      cast: movie.credits?.cast?.slice(0, 20).map((person) => ({
        id: person.id,
        name: person.name,
        character: person.character,
        profilePath: getImageUrl(person.profile_path, 'w185'),
      })),
      crew: movie.credits?.crew?.slice(0, 10).map((person) => ({
        id: person.id,
        name: person.name,
        job: person.job,
        department: person.department,
        profilePath: getImageUrl(person.profile_path, 'w185'),
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
      similar: formatMovieList(movie.similar?.results || []),
      recommendations: formatMovieList(movie.recommendations?.results || []),
      // Watch providers
      watchProviders: formatWatchProviders(movie['watch/providers']?.results),
    };
  }

  // Format watch providers
export function formatWatchProviders(providers) {
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
            logo: getImageUrl(p.logo_path, 'w92'),
          })),
          rent: providers[country].rent?.map(p => ({
            id: p.provider_id,
            name: p.provider_name,
            logo: getImageUrl(p.logo_path, 'w92'),
          })),
          buy: providers[country].buy?.map(p => ({
            id: p.provider_id,
            name: p.provider_name,
            logo: getImageUrl(p.logo_path, 'w92'),
          })),
        };
      }
    });
    
    return Object.keys(formatted).length > 0 ? formatted : null;
  }

  // Get TV content rating
export function getTVCertification(contentRatings) {
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
export function formatTVDetails(tv) {
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
      certification: getTVCertification(tv.content_ratings),
      homepage: tv.homepage,
      inProduction: tv.in_production,
      originalLanguage: tv.original_language,
      spokenLanguages: tv.spoken_languages,
      productionCompanies: tv.production_companies,
      productionCountries: tv.production_countries,
      networks: tv.networks,
      genres: tv.genres,
      poster: getImageUrl(tv.poster_path, 'w500'),
      backdrop: getImageUrl(tv.backdrop_path, 'original'),
      // Credits
      cast: tv.credits?.cast?.slice(0, 20).map((person) => ({
        id: person.id,
        name: person.name,
        character: person.character,
        profilePath: getImageUrl(person.profile_path, 'w185'),
      })),
      crew: tv.credits?.crew?.slice(0, 10).map((person) => ({
        id: person.id,
        name: person.name,
        job: person.job,
        department: person.department,
        profilePath: getImageUrl(person.profile_path, 'w185'),
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
      similar: formatMediaList(tv.similar?.results || []),
      recommendations: formatMediaList(tv.recommendations?.results || []),
      // Seasons info
      seasons: tv.seasons?.map((season) => ({
        id: season.id,
        name: season.name,
        overview: season.overview,
        seasonNumber: season.season_number,
        episodeCount: season.episode_count,
        airDate: season.air_date,
        rating: season.vote_average,
        poster: getImageUrl(season.poster_path, 'w500'),
      })),
      // Watch providers
      watchProviders: formatWatchProviders(tv['watch/providers']?.results),
    };
  }

  // Format season details with episodes
export function formatSeasonDetails(season) {
    return {
      id: season.id,
      name: season.name,
      overview: season.overview,
      seasonNumber: season.season_number,
      airDate: season.air_date,
      rating: season.vote_average,
      poster: getImageUrl(season.poster_path, 'w500'),
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
        stillPath: getImageUrl(episode.still_path, 'w300'),
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
          profilePath: getImageUrl(person.profile_path, 'w185'),
        })),
      })),
    };
  }

  // ===== PERSON/ACTOR METHODS =====

  // Get person/actor details
export async function getPersonDetails(personId) {
    try {
      const response = await api.get(`/person/${personId}`, {
        params: {
          append_to_response: 'movie_credits,tv_credits,images,external_ids',
        },
      });
      return formatPersonDetails(response.data);
    } catch (error) {
      console.error('TMDB getPersonDetails error:', error.message);
      throw new Error('Failed to fetch person details');
    }
  }

  // Format person details
export function formatPersonDetails(person) {
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
      profilePath: getImageUrl(person.profile_path, 'h632'),
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
        filePath: getImageUrl(image.file_path, 'w500'),
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
            poster: getImageUrl(movie.poster_path, 'w500'),
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
            poster: getImageUrl(movie.poster_path, 'w500'),
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
            poster: getImageUrl(tv.poster_path, 'w500'),
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
            poster: getImageUrl(tv.poster_path, 'w500'),
            rating: tv.vote_average,
            episodeCount: tv.episode_count,
            mediaType: 'tv',
          })),
      },
    };
  }

  // Get movie reviews from TMDB
export async function getMovieReviews(movieId, page = 1) {
    try {
      const response = await api.get(`/movie/${movieId}/reviews`, {
        params: { page },
      });
      return {
        results: formatReviews(response.data.results),
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results,
      };
    } catch (error) {
      console.error('TMDB getMovieReviews error:', error.message);
      return { results: [], page: 1, totalPages: 0, totalResults: 0 };
    }
  }

  // Get TV show reviews from TMDB
export async function getTVReviews(tvId, page = 1) {
    try {
      const response = await api.get(`/tv/${tvId}/reviews`, {
        params: { page },
      });
      return {
        results: formatReviews(response.data.results),
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results,
      };
    } catch (error) {
      console.error('TMDB getTVReviews error:', error.message);
      return { results: [], page: 1, totalPages: 0, totalResults: 0 };
    }
  }

  // Format TMDB reviews to match our schema
export function formatReviews(reviews) {
    return reviews.map((review) => ({
      _id: `tmdb_${review.id}`,
      isTMDB: true,
      user: {
        username: review.author || review.author_details?.username || 'Anonymous',
        avatar: review.author_details?.avatar_path 
          ? (review.author_details.avatar_path.startsWith('/http') 
              ? review.author_details.avatar_path.substring(1) 
              : getImageUrl(review.author_details.avatar_path, 'w200'))
          : null,
      },
      rating: review.author_details?.rating 
        ? review.author_details.rating 
        : (Math.random() * 3 + 7), // Random rating between 7-10 if not provided
      title: review.content?.split('\n')[0]?.substring(0, 100) || 'Review',
      content: review.content || '',
      likes: [],
      dislikes: [],
      replies: [],
      likeCount: 0,
      dislikeCount: 0,
      replyCount: 0,
      spoiler: false,
      createdAt: review.created_at || review.updated_at,
      updatedAt: review.updated_at || review.created_at,
    }));
  }
// Export all functions as default object`nexport default {`n  getImageUrl, getTrending, getPopular, getTopRated, getNowPlaying, getUpcoming,`n  getMovieDetails, searchMovies, discoverMovies, getGenres, getPopularTV,`n  getTopRatedTV, getAiringTodayTV, getOnTheAirTV, getTVDetails, searchTV,`n  getTVSeasonDetails, searchMulti, discoverTV, formatMediaList, formatMovieList,`n  getCertification, formatMovieDetails, formatWatchProviders, getTVCertification,`n  formatTVDetails, formatSeasonDetails, getPersonDetails, formatPersonDetails,`n  getMovieReviews, getTVReviews, formatReviews`n};

