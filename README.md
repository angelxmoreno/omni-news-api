# OmniNewsAPI

OmniNewsAPI is a unified news-fetching service that consolidates multiple news APIs into a **single, standardized format**. Instead of handling many different response shapes, you query OmniNewsAPI and always get back the same predictable structure.

---

## Features

* **AdapterInterface Pattern**: Different APIs are wrapped with adapters to translate their responses into a common schema.
* **Multiple Sources**: Works with RSS feeds, NewsAPI.org, and other news sources.
* **Unified Output**: Returns a standardized article object with consistent fields.
* **HTTP Caching**: Built-in caching with TTL and HTTP header support for better performance.
* **Persistent Storage**: Multiple storage backends including Redis, MongoDB, SQLite, PostgreSQL and more via Keyv integration.
* **Smart Aggregation**: Combine articles from multiple sources in parallel.
* **Extensible**: Easily add new adapters for additional news sources.

---

## How It Works

1. Each third-party API is different (different fields, naming, or structures).
2. OmniNewsAPI uses an **AdapterInterface** for each API.
3. The adapter converts the raw API response into OmniNewsAPI's **standardized format**.
4. Your app consumes the unified output without worrying about source-specific details.

---

## Example Usage

### Basic Usage with RSS

```ts
import { RssAdapter, createHttpClient } from 'omni-news-api';

const httpClient = createHttpClient();
const rssAdapter = new RssAdapter({
    rssUrl: 'https://feeds.bbci.co.uk/news/rss.xml',
    httpClient
});

const articles = await rssAdapter.getArticles();
console.log(articles);
```

### Using NewsAPI.org with Persistent Caching

```ts
import { NewsApiOrgAdapter, createCacheableHttpClient } from 'omni-news-api';
import Keyv from '@keyvhq/core';

// Create cached HTTP client with Redis backend
const keyv = new Keyv('redis://localhost:6379');
const httpClient = createCacheableHttpClient({
    keyv,
    cacheOptions: { ttl: 300000 } // 5 minutes
});

const newsApiAdapter = new NewsApiOrgAdapter({
    apiKey: 'your-newsapi-key',
    httpClient,
    searchParams: {
        q: 'technology',
        language: 'en',
        sortBy: 'publishedAt'
    }
});

const articles = await newsApiAdapter.getArticles();
```

**Storage Options:**
The `createCacheableHttpClient` supports multiple storage backends through Keyv:

```ts
// Redis
const keyv = new Keyv('redis://localhost:6379');

// MongoDB
const keyv = new Keyv('mongodb://localhost:27017/cache');

// SQLite
const keyv = new Keyv('sqlite://path/to/database.sqlite');

// PostgreSQL
const keyv = new Keyv('postgresql://user:pass@localhost:5432/cache');

// In-memory (development)
const keyv = new Keyv();
```

### Advanced Caching Configuration

For more control over caching behavior, use the `cacheOptions` parameter:

```ts
const httpClient = createCacheableHttpClient({
    keyv: new Keyv('redis://localhost:6379'),
    cacheOptions: {
        ttl: 600000, // 10 minutes cache duration
        // Additional cache options available - see axios-cache-interceptor docs
    }
});
```

### Storage Configuration Options

Configure Keyv storage behavior with `keyvStorageOptions`:

```ts
const httpClient = createCacheableHttpClient({
    keyv: new Keyv('redis://localhost:6379'),
    keyvStorageOptions: {
        debug: true // Enable debug logging for cache operations
    },
    cacheOptions: {
        ttl: 300000 // Cache TTL (5 minutes)
    }
});
```

For additional storage configuration options, see the [axios-cache-interceptor-keyv](https://www.npmjs.com/package/axios-cache-interceptor-keyv) documentation.

### Aggregating Multiple Sources

```ts
import { Aggregator, RssAdapter, NewsApiOrgAdapter, createCacheableHttpClient } from 'omni-news-api';
import Keyv from '@keyvhq/core';

const keyv = new Keyv('redis://localhost:6379');
const httpClient = createCacheableHttpClient({ 
    keyv, 
    cacheOptions: { ttl: 300000 } 
});

const aggregator = new Aggregator([
    new RssAdapter({
        rssUrl: 'https://feeds.bbci.co.uk/news/rss.xml',
        httpClient
    }),
    new NewsApiOrgAdapter({
        apiKey: 'your-api-key',
        httpClient,
        searchParams: { q: 'breaking news' }
    })
]);

// Fetch from all sources in parallel
const allArticles = await aggregator.fetchAll();
console.log(`Got ${allArticles.length} articles from all sources`);
```

### Standardized Output

All adapters return the same `NewsArticleInterface`:

```ts
interface NewsArticleInterface {
    title: string;
    url: string;
    author?: string;
    source?: string;
    publishedAt?: Date;
}
```

---

## Available Adapters

* **RssAdapter** - Fetches articles from any RSS feed
* **NewsApiOrgAdapter** - Integrates with NewsAPI.org for comprehensive news search

## Roadmap

* [ ] Add support for more news APIs (Guardian, Reddit, etc.)
* [x] ~~Implement caching layer~~ ✅ Complete with HTTP + TTL caching
* [ ] Provide REST + GraphQL endpoints
* [ ] Add rate limiting and API key authentication
* [ ] Article deduplication across sources
* [ ] Content filtering and categorization

---

## License

MIT License
