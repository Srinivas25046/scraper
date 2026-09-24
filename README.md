# The Polite Scraper

A small, polite scraping pipeline that downloads the first three catalogue pages of [Books to Scrape](https://books.toscrape.com), visits all 60 book pages, turns the raw HTML into clean, schema-validated JSON records, survives a broken page without crashing, and ends every run with an honest report of what happened.

## Target classification

**Site:** books.toscrape.com

**Why:** A public sandbox explicitly built for practicing web scraping — the site itself exists for exactly this purpose.

**Scope:** The first 3 catalogue pages only (60 books total). This scraper does not, and will not, crawl the remaining 47 catalogue pages on the site.

**Data collected:** Title, price, availability, star rating, description, and product URL — all publicly displayed book listing data, nothing behind a login or paywall.

**robots.txt result:** `<paste exactly what you got from running curl.exe https://books.toscrape.com/robots.txt in Stage 0>`

I will not reuse this code on another site without checking its rules and terms first.

## How to run it

**Requirements:** Node.js 20+

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO/scraper
npm install
node src/index.js
```

This produces:
- `output/books.json` — 60 validated book records
- `output/errors.json` — any records that failed schema validation (empty on a clean run)
- `output/run-report.json` — a summary of the run

A second run reads from `cache/` and reproduces the same 60 records — it does not duplicate them.

## Record schema

Each record in `books.json` has these fields:

| Field | Type | Notes |
|---|---|---|
| `title` | string | Book title |
| `product_url` | string (URL) | Canonical identity of the record — absolute URL |
| `price_text` | string | Raw price as shown on the page, e.g. `"£51.77"` |
| `price_gbp` | number | Cleaned numeric price, e.g. `51.77` |
| `availability_text` | string | Raw availability text, e.g. `"In stock (22 available)"` |
| `rating_text` | string or null | Star rating as a word, e.g. `"Three"` |
| `description` | string or null | Full book description; `null` when the page has none |
| `source_page` | string (URL) | Which catalogue page this book was discovered on |
| `fetched_at` | string (ISO timestamp) | When this record was fetched — provenance |

Validation is done with [Zod](https://zod.dev). Any record that fails validation is written to `errors.json` with the reason, and never enters `books.json`.

## Politeness rules

This scraper follows a small set of rules on every real request:

- **User-agent:** identifies itself honestly as `FlyRankInternshipA9/1.0`, with a link back to this repository, so a site owner could find out who made the request.
- **Timeout:** every request gives up after 8 seconds rather than hanging indefinitely.
- **Delay:** waits at least 500ms between real requests to the site. Cached pages incur no delay, since they never leave the local machine.
- **Cache:** every page fetched is saved to `cache/` (git-ignored) and reused on subsequent runs, so repeated development and testing does not repeatedly hit the live site.
- **Status check:** only an HTTP `200` is treated as a usable page. Anything else is treated as a failed fetch, not content to parse.
- **Selective retry:** a `5xx` server error or a timeout is retried once after a short pause. A `404` or `403` is never retried, since retrying cannot change either outcome.

## Why this needed no browser

All the data collected here — title, price, availability, rating, description — is already present in the raw HTML the server sends back on the very first request. A browser (or a tool like Playwright) exists to run JavaScript and render a page visually, neither of which this data required; using one here would only add cost (memory, startup time, complexity) with no corresponding benefit.

## Example run report

```json
{
  "start_time": "2026-09-24T02:26:45.961Z",
  "duration_ms": 1264,
  "pages_fetched": 61,
  "valid_records": 60,
  "invalid_records": 0,
  "failed_pages": 1,
  "failures": [
    {
      "url": "https://books.toscrape.com/catalogue/this-book-does-not-exist/index.html",
      "reason": "Fetch failed for https://books.toscrape.com/catalogue/this-book-does-not-exist/index.html: status 404"
    }
  ]
}
```

This run included one deliberately broken URL added to prove the failure-survival requirement: the run still completed, the 60 good records were still written, and the failure was logged with a clear reason rather than crashing the whole process. That test URL has since been removed from the production code path.

## Known limitation

The CSS selectors used to extract data (`.price_color`, `.availability`, `#product_description`, etc.) are tied to Books to Scrape's current HTML structure. If the site's markup changed, extraction would silently return empty or incorrect fields rather than failing loudly — a production version of this pipeline would add sanity checks (e.g. "did we actually get a non-empty title for every record?") on top of the schema validation already in place.

## Ethics note

This scraper only touches a site explicitly built and offered as a public practice sandbox. In any other context: an official API is used when one exists rather than scraping; logins, paywalls, and explicit blocks (robots.txt disallows, CAPTCHAs) are never bypassed; and only the minimum data actually needed is collected, not everything a page happens to expose.