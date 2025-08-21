# OmniNewsAPI

OmniNewsAPI is a unified news-fetching service that consolidates multiple news APIs into a **single, standardized format**. Instead of handling many different response shapes, you query OmniNewsAPI and always get back the same predictable structure.

---

## 🚀 Features

* 🔄 **AdapterInterface Pattern**: Different APIs are wrapped with adapters to translate their responses into a common schema.
* 📡 **Multiple Sources**: Works with various public or private news APIs.
* 🧩 **Unified Output**: Returns a standardized article object, e.g.:

  ```json
  {
    "title": "Breaking: Cats take over city",
    "url": "https://example.com/cats",
    "source": "API A"
  }
  ```
* 🛠️ **Extensible**: Easily add new adapters for additional news sources.

---

## 📖 How It Works

1. Each third-party API is different (different fields, naming, or structures).
2. OmniNewsAPI uses an **AdapterInterface** for each API.
3. The adapter converts the raw API response into OmniNewsAPI's **standardized format**.
4. Your app consumes the unified output without worrying about source-specific details.

---

## 🧑‍💻 Example Usage

```ts
const articles: NewsArticleInterface[] = [];

// Use adapters for different APIs
articles.push(...new ApiAAdapter(new ApiA()).getArticles());
articles.push(...new ApiBAdapter(new ApiB()).getArticles());

console.log(articles);
```

Output:

```json
[
  { "title": "Breaking: Cats take over city", "url": "a.com/cats", "source": "API A" },
  { "title": "Dogs run for mayor", "url": "b.com/dogs", "source": "API B" }
]
```

---

## 🏗️ Roadmap

* [ ] Add support for more news APIs
* [ ] Implement caching layer
* [ ] Provide REST + GraphQL endpoints
* [ ] Add rate limiting and API key authentication

---

## 📜 License

MIT License
