import tmdbService from '../services/tmdb.service.js';

// Get trending movies/TV shows
export const getTrending = async (req, res) => {
  try {
    const { mediaType = 'all', timeWindow = 'week' } = req.query;
    const content = await tmdbService.getTrending(mediaType, timeWindow);

    res.json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error('getTrending error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch trending content',
    });
  }
};

// Get popular movies
export const getPopular = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const data = await tmdbService.getPopular(parseInt(page));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('getPopular error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch popular movies',
    });
  }
};

// Get top rated movies
export const getTopRated = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const data = await tmdbService.getTopRated(parseInt(page));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('getTopRated error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch top rated movies',
    });
  }
};

// Get now playing movies
export const getNowPlaying = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const data = await tmdbService.getNowPlaying(parseInt(page));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('getNowPlaying error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch now playing movies',
    });
  }
};

// Get upcoming movies
export const getUpcoming = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const data = await tmdbService.getUpcoming(parseInt(page));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('getUpcoming error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch upcoming movies',
    });
  }
};

// Get movie details
export const getMovieDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const movie = await tmdbService.getMovieDetails(id);

    res.json({
      success: true,
      data: movie,
    });
  } catch (error) {
    console.error('getMovieDetails error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch movie details',
    });
  }
};

// Search movies
export const searchMovies = async (req, res) => {
  try {
    const { query, page = 1 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const data = await tmdbService.searchMovies(query, parseInt(page));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('searchMovies error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search movies',
    });
  }
};

// Discover movies with filters
export const discoverMovies = async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      genres: req.query.genres,
      year: req.query.year,
      language: req.query.language,
      sortBy: req.query.sortBy,
      minRating: req.query.minRating,
      maxRating: req.query.maxRating,
    };

    const data = await tmdbService.discoverMovies(filters);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('discoverMovies error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to discover movies',
    });
  }
};

// Get movie genres
export const getGenres = async (req, res) => {
  try {
    const genres = await tmdbService.getGenres();

    res.json({
      success: true,
      data: genres,
    });
  } catch (error) {
    console.error('getGenres error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch genres',
    });
  }
};

// ===== TV SHOW CONTROLLERS =====

// Get popular TV shows
export const getPopularTV = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const data = await tmdbService.getPopularTV(parseInt(page));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('getPopularTV error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch popular TV shows',
    });
  }
};

// Get top rated TV shows
export const getTopRatedTV = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const data = await tmdbService.getTopRatedTV(parseInt(page));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('getTopRatedTV error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch top rated TV shows',
    });
  }
};

// Get airing today TV shows
export const getAiringTodayTV = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const data = await tmdbService.getAiringTodayTV(parseInt(page));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('getAiringTodayTV error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch airing today TV shows',
    });
  }
};

// Get on the air TV shows
export const getOnTheAirTV = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const data = await tmdbService.getOnTheAirTV(parseInt(page));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('getOnTheAirTV error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch on the air TV shows',
    });
  }
};

// Get TV show details
export const getTVDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const tv = await tmdbService.getTVDetails(id);

    res.json({
      success: true,
      data: tv,
    });
  } catch (error) {
    console.error('getTVDetails error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch TV show details',
    });
  }
};

// Get TV season details
export const getTVSeasonDetails = async (req, res) => {
  try {
    const { id, seasonNumber } = req.params;
    const season = await tmdbService.getTVSeasonDetails(id, parseInt(seasonNumber));

    res.json({
      success: true,
      data: season,
    });
  } catch (error) {
    console.error('getTVSeasonDetails error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch season details',
    });
  }
};

// Search TV shows
export const searchTV = async (req, res) => {
  try {
    const { query, page = 1 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const data = await tmdbService.searchTV(query, parseInt(page));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('searchTV error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search TV shows',
    });
  }
};

// Search multi (movies + TV shows)
export const searchMulti = async (req, res) => {
  try {
    const { query, page = 1 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const data = await tmdbService.searchMulti(query, parseInt(page));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('searchMulti error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search content',
    });
  }
};

// Discover TV shows with filters
export const discoverTV = async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      genres: req.query.genres,
      year: req.query.year,
      language: req.query.language,
      sortBy: req.query.sortBy,
      minRating: req.query.minRating,
      maxRating: req.query.maxRating,
    };

    const data = await tmdbService.discoverTV(filters);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('discoverTV error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to discover TV shows',
    });
  }
};
