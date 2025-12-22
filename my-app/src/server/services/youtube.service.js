import cache from '../utils/cache.js'

const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
const BASE_URL = 'https://www.googleapis.com/youtube/v3'

/**
 * Search for videos related to a movie/TV show
 * @param {string} query - Search query (movie/show title)
 * @param {string} pageToken - Pagination token
 * @returns {Promise<Object>} Video results
 */
export async function searchVideos(query, pageToken = null) {
  if (!API_KEY || API_KEY === 'demo') {
    console.log('⚠️ YouTube API key not configured')
    return { items: [], nextPageToken: null }
  }

  // Create cache key
  const cacheKey = `youtube:search:${query}:${pageToken || 'first'}`
  
  // Try to get from cache first
  const cached = await cache.get(cacheKey)
  if (cached) {
    console.log('✅ YouTube cache hit:', cacheKey)
    return cached
  }

  try {
    const searchQuery = `${query} official trailer OR review OR interview OR clip OR behind the scenes`
    let url = `${BASE_URL}/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=12&order=relevance&videoDuration=medium&key=${API_KEY}`
    
    if (pageToken) {
      url += `&pageToken=${pageToken}`
    }

    console.log('📡 Fetching from YouTube API...')
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`)
    }

    const data = await response.json()

    const result = {
      items: (data.items || []).map(item => ({
        id: item.id.videoId,
        key: item.id.videoId,
        name: item.snippet.title,
        type: 'Featured',
        site: 'YouTube',
        official: false,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url
      })),
      nextPageToken: data.nextPageToken || null
    }

    // Cache for 1 hour
    await cache.set(cacheKey, result, 3600)
    console.log('✅ YouTube data cached:', cacheKey)

    return result
  } catch (error) {
    console.error('❌ YouTube API error:', error)
    return { items: [], nextPageToken: null }
  }
}

// Export as default object for backward compatibility
export default {
  searchVideos
}
