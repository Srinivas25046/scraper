const discoverBooks = require('./discoverBooks');
const extractBook = require('./extractBook');

async function main() {
  const urls = await discoverBooks();

  const records = [];
  for (const url of urls) {
    const record = await extractBook(url, 'https://books.toscrape.com/catalogue/page-1.html');
    records.push(record);
  }

  console.log(JSON.stringify(records[0], null, 2));
  console.log(`detail_pages=${records.length}`);
}

main();