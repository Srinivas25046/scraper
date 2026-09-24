const fetchPage = require('./fetchPage');

async function main() {
  const html = await fetchPage(
    'https://books.toscrape.com/catalogue/page-1.html',
    'catalogue-page-1.html'
  );
}

main();