# Integration Tests

Integration tests validate that our adapters work correctly with real APIs and data sources. These tests make actual network requests to live services.

## Running Integration Tests

### All Integration Tests
```bash
bun run test:integration
```

### Specific Adapter Tests
```bash
bun test tests/integration/adapters/RssAdapter.integration.test.ts
bun test tests/integration/adapters/NewsApiOrgAdapter.integration.test.ts
```

## Setup Requirements

### RSS Integration Tests
RSS integration tests run automatically without any setup - they test against publicly available RSS feeds.

### NewsAPI Integration Tests
NewsAPI integration tests require an API key:

1. **Get a free API key** from [NewsAPI.org](https://newsapi.org/)
2. **Set environment variable:**
   ```bash
   export NEWSAPI_API_KEY=your_api_key_here
   ```
3. **Run the tests:**
   ```bash
   bun run test:integration
   ```

**Without API key:** NewsAPI integration tests will be skipped automatically.

## Test Categories

### RSS Integration Tests (`RssAdapter.integration.test.ts`)
- Tests against real RSS feeds from BBC News, NPR News, TechCrunch
- Validates RSS parser handles real-world XML variations  
- Tests pagination with actual feed data
- Tests different RSS formats and versions
- Validates error handling with malformed feeds

### NewsAPI Integration Tests (`NewsApiOrgAdapter.integration.test.ts`)
- Tests real API calls to NewsAPI.org
- Validates pagination with live data
- Tests different search parameters and filters
- Tests error handling (invalid keys, rate limits)
- Validates response structure matches our interfaces

## Benefits of Integration Tests

1. **Catch API Changes:** Detect when third-party APIs change their response format
2. **Validate Real Data:** Ensure our adapters work with actual API responses, not just mocked data
3. **Document API Behavior:** Tests serve as living documentation of how APIs actually behave
4. **Build Confidence:** Know that the adapters work in production scenarios

## CI/CD Usage

Integration tests are designed to work in CI environments:
- **RSS tests:** Always run (no credentials needed)
- **NewsAPI tests:** Run only when `NEWSAPI_API_KEY` is available
- **Timeouts:** Configured with longer timeouts for network requests
- **Error Handling:** Gracefully handle temporary service outages

## Mock Data Generation

Integration tests help generate realistic mock data:
- Run integration tests to capture real API responses
- Use captured responses to create comprehensive mock datasets
- Ensure unit tests use realistic data structures

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEWSAPI_API_KEY` | Optional | API key for NewsAPI.org integration tests |

## Troubleshooting

### Tests are slow
- Integration tests make real network requests and have longer timeouts (15-45 seconds)
- Use `bun run test:unit` for faster feedback during development

### NewsAPI tests failing
- Check your API key is valid: `echo $NEWSAPI_API_KEY`
- Verify you haven't exceeded rate limits (1000 requests/day on free tier)
- Check NewsAPI status at [status.newsapi.org](https://status.newsapi.org)

### RSS tests failing
- Some RSS feeds may be temporarily unavailable
- Tests include fallback feeds and graceful error handling
- Check your internet connection