const fs = require('fs');
const path = require('path');
const discoverBooks = require('./discoverBooks');
const extractBook = require('./extractBook');
const normalize = require('./normalize');
const BookSchema = require('./schema');

async function main() {
  const urls = await discoverBooks();

  const validRecords = [];
  const invalidRecords = [];
  const seenUrls = new Set();

  for (const url of urls) {
    const raw = await extractBook(url, 'https://books.toscrape.com/catalogue/page-1.html');
    const normalized = normalize(raw);

    if (seenUrls.has(normalized.product_url)) {
      continue;
    }

    const result = BookSchema.safeParse(normalized);
    if (result.success) {
      validRecords.push(result.data);
      seenUrls.add(normalized.product_url);
    } else {
      invalidRecords.push({ record: normalized, reason: result.error.message });
    }
  }

  fs.mkdirSync(path.join(__dirname, '..', 'output'), { recursive: true });
  fs.writeFileSync(
    path.join(__dirname, '..', 'output', 'books.json'),
    JSON.stringify(validRecords, null, 2)
  );
  fs.writeFileSync(
    path.join(__dirname, '..', 'output', 'errors.json'),
    JSON.stringify(invalidRecords, null, 2)
  );

  console.log(`valid=${validRecords.length} invalid=${invalidRecords.length}`);
}

main();