const cheerio = require('cheerio');
const fetchPage = require('./fetchPage');

async function discoverBooks() {
  const bookUrls = new Set();
  let pageUrl = 'https://books.toscrape.com/catalogue/page-1.html';
  let pageNum = 1;
  let pagesVisited = 0;

  while (pageUrl && pageNum <= 3) {
    const cacheFilename = `catalogue-page-${pageNum}.html`;
    const html = await fetchPage(pageUrl, cacheFilename);
    pagesVisited++;

    const $ = cheerio.load(html);

    $('h3 a').each((_, el) => {
      const href = $(el).attr('href');
      const absoluteUrl = new URL(href, pageUrl).href;
      bookUrls.add(absoluteUrl);
    });

    const nextLink = $('.next a').attr('href');
    if (nextLink) {
      pageUrl = new URL(nextLink, pageUrl).href;
      pageNum++;
    } else {
      pageUrl = null;
    }
  }

  console.log(`catalogue_pages=${pagesVisited}`);
  console.log(`discovered=${bookUrls.size}`);
  console.log(`unique_urls=${bookUrls.size}`);

  return Array.from(bookUrls);
}

module.exports = discoverBooks;