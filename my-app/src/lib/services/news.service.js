const API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY
const BASE_URL = 'https://newsapi.org/v2'

/**
 * Fetch news articles about a movie/TV show
 * @param {string} query - Movie/show title
 * @param {number} page - Page number
 * @returns {Promise<Object>} News articles
 */
export async function searchNews(query, page = 1) {
  if (!API_KEY || API_KEY === 'demo') {
    console.log('⚠️ News API key not configured')
    return { articles: [], hasMore: false }
  }

  try {
    const url = `${BASE_URL}/everything?q="${encodeURIComponent(query)}" AND (movie OR film OR cinema)&sortBy=relevancy&pageSize=20&page=${page}&language=en&apiKey=${API_KEY}`
    
    console.log('📡 Fetching from NewsAPI...')
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status !== 'ok') {
      throw new Error(data.message || 'NewsAPI request failed')
    }

    // Filter articles to only include those that mention the query
    const filteredArticles = (data.articles || []).filter(article => {
      const queryLower = query.toLowerCase()
      const articleTitle = (article.title || '').toLowerCase()
      const articleDesc = (article.description || '').toLowerCase()
      const articleContent = (article.content || '').toLowerCase()
      
      return articleTitle.includes(queryLower) || 
             articleDesc.includes(queryLower) || 
             articleContent.includes(queryLower)
    })

    const result = {
      articles: filteredArticles,
      hasMore: filteredArticles.length > 0 && data.articles.length === 20
    }

    return result
  } catch (error) {
    console.error('❌ NewsAPI error:', error)
    return { articles: [], hasMore: false }
  }
}

// Named export `searchNews` is provided above
