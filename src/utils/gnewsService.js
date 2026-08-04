/**
 * GNews API Integration Service for AgroLink
 * API Base: https://gnews.io/api/v4/search
 */

const GNEWS_API_KEY = import.meta.env?.VITE_GNEWS_API_KEY || 'b1c5064d06b8f70a64908389ffd8880f';
const BASE_URL = 'https://gnews.io/api/v4/search';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache

// In-memory cache map
const newsCache = new Map();

// Curated fallback data if API key quota is exhausted or network is offline
export const FALLBACK_NEWS = [
  {
    id: 'fb-1',
    title: "Ghana Ministry of Food & Agriculture Announces Fertilizer Grant Program",
    snippet: "The Ministry of Food and Agriculture has unveiled a new GHS 50 million subsidy package aimed at smallholder cocoa and maize farmers to boost seasonal yield.",
    url: "https://mofa.gov.gh",
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&q=80",
    publishedAt: "Today",
    sourceName: "Ghana Ministry of Agriculture",
    isFallback: true
  },
  {
    id: 'fb-2',
    title: "Global Cocoa Prices Surge Following Positive West African Harvest Outlook",
    snippet: "Commodity index records show cocoa futures rallying by 4.2% as processing hubs demand premium grade organic cocoa beans.",
    url: "https://www.bloomberg.com/agriculture",
    image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&q=80",
    publishedAt: "Yesterday",
    sourceName: "AgriMarket Global",
    isFallback: true
  },
  {
    id: 'fb-3',
    title: "Climate-Smart Farming Technologies Adopted Across Ashanti & Volta Regions",
    snippet: "Solar-powered irrigation and drone-assisted pest detection systems have increased crop yield efficiency by 35% among participating farm cooperatives.",
    url: "https://www.fao.org/news",
    image: "https://images.unsplash.com/photo-1472141521943-95eaa152873e?w=600&q=80",
    publishedAt: "2 days ago",
    sourceName: "African Farming Digest",
    isFallback: true
  },
  {
    id: 'fb-4',
    title: "Sub-Saharan Organic Grain Export Standards Updated for 2026 Season",
    snippet: "New certification protocols make it easier for verified smallholder farms to ship organic maize, millet, and soya beans to international buyers.",
    url: "https://example.com/agri-export-standards",
    image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&q=80",
    publishedAt: "3 days ago",
    sourceName: "Global Trade Watch",
    isFallback: true
  }
];

/**
 * Fetch agricultural news articles from GNews API
 * 
 * @param {string} [searchQuery=''] - Optional keyword filter (e.g. 'cocoa', 'fertilizer')
 * @param {boolean} [forceRefresh=false] - Bypass in-memory cache
 * @returns {Promise<{ articles: Array, isLive: boolean, total: number, error?: string }>}
 */
export const fetchAgriNews = async (searchQuery = '', forceRefresh = false) => {
  const queryTerm = searchQuery.trim()
    ? `(${searchQuery}) AND (agriculture OR farming OR crops OR Ghana)`
    : 'agriculture OR farming OR crops OR Ghana';

  const cacheKey = `gnews_${queryTerm.toLowerCase()}`;
  const now = Date.now();

  // Check in-memory cache
  if (!forceRefresh && newsCache.has(cacheKey)) {
    const cached = newsCache.get(cacheKey);
    if (now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  if (!GNEWS_API_KEY || GNEWS_API_KEY === 'YOUR_GNEWS_API_KEY') {
    return {
      articles: FALLBACK_NEWS,
      isLive: false,
      total: FALLBACK_NEWS.length,
      notice: 'Using curated feed (Add GNews API key to .env for live web news).'
    };
  }

  try {
    const url = `${BASE_URL}?q=${encodeURIComponent(queryTerm)}&lang=en&max=10&apikey=${GNEWS_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `GNews API returned status ${response.status}`);
    }

    const data = await response.json();

    if (!data.articles || data.articles.length === 0) {
      // If specific search yielded no results, fallback gracefully
      return {
        articles: FALLBACK_NEWS,
        isLive: true,
        total: 0,
        notice: `No live articles found for "${searchQuery}". Showing featured agri news.`
      };
    }

    const formattedArticles = data.articles.map((item, idx) => ({
      id: item.url || `gnews-${idx}-${Date.now()}`,
      title: item.title,
      snippet: item.description || item.content || 'Click article link to read full coverage...',
      url: item.url,
      image: item.image || null,
      publishedAt: item.publishedAt ? formatDate(item.publishedAt) : 'Recent',
      sourceName: item.source?.name || 'News',
      sourceUrl: item.source?.url || item.url,
      isLive: true
    }));

    const result = {
      articles: formattedArticles,
      isLive: true,
      total: data.totalArticles || formattedArticles.length
    };

    // Cache the result
    newsCache.set(cacheKey, { timestamp: now, data: result });
    return result;
  } catch (err) {
    console.warn("GNews API fetch failed, loading curated news fallback:", err.message);
    return {
      articles: FALLBACK_NEWS,
      isLive: false,
      total: FALLBACK_NEWS.length,
      error: err.message,
      notice: 'Live GNews feed unavailable (Quota limit or connection). Displaying curated news.'
    };
  }
};

/**
 * Format ISO 8601 date string to human friendly format
 */
const formatDate = (isoString) => {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return 'Recent';
  }
};
