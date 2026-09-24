const fs = require('fs');
const path = require('path');
const discoverBooks = require('./discoverBooks');
const extractBook = require('./extractBook');
const normalize = require('./normalize');
const BookSchema = require('./schema');

async function main() {
  const startTime = Date.now();
  const urls = await discoverBooks();

  // Prove failure survival: add one fake URL on purpose (remove after confirming the checkpoint)
  urls.push('https://books.toscrape.com/catalogue/this-book-does-not-exist/index.html');

  const validRecords = [];
  const invalidRecords = [];
  const failedPages = [];
  const seenUrls = new Set();

  for (const url of urls) {
    try {
      const raw = await extractBook(url, 'https://books.toscrape.com/catalogue/page-1.html');
      const normalized = normalize(raw);

      if (seenUrls.has(normalized.product_url)) continue;

      const result = BookSchema.safeParse(normalized);
      if (result.success) {
        validRecords.push(result.data);
        seenUrls.add(normalized.product_url);
      } else {
        invalidRecords.push({ record: normalized, reason: result.error.message });
      }
    } catch (err) {
      console.log(`FAILED: ${url} — ${err.message}`);
      failedPages.push({ url, reason: err.message });
    }
  }

  fs.mkdirSync(path.join(__dirname, '..', 'output'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, '..', 'output', 'books.json'), JSON.stringify(validRecords, null, 2));
  fs.writeFileSync(path.join(__dirname, '..', 'output', 'errors.json'), JSON.stringify(invalidRecords, null, 2));

  const report = {
    start_time: new Date(startTime).toISOString(),
    duration_ms: Date.now() - startTime,
    pages_fetched: validRecords.length + invalidRecords.length + failedPages.length,
    valid_records: validRecords.length,
    invalid_records: invalidRecords.length,
    failed_pages: failedPages.length,
    failures: failedPages,
  };
  fs.writeFileSync(path.join(__dirname, '..', 'output', 'run-report.json'), JSON.stringify(report, null, 2));

  console.log(`valid=${validRecords.length} invalid=${invalidRecords.length} failed=${failedPages.length}`);
}

main();