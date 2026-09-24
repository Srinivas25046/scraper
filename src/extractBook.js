const crypto = require('crypto');
const cheerio = require('cheerio');
const fetchPage = require('./fetchPage');

async function extractBook(bookUrl, sourcePage) {
  const cacheFilename = 'book-' + crypto.createHash('md5').update(bookUrl).digest('hex') + '.html';

  const html = await fetchPage(bookUrl, cacheFilename);

  const $ = cheerio.load(html);
  const product = $('.product_page');

  const title = product.find('h1').text().trim();
  const priceText = product.find('.price_color').first().text().trim();
  const availabilityText = product.find('.availability').text().trim().replace(/\s+/g, ' ');

  const ratingClasses = product.find('p.star-rating').attr('class') || '';
  const ratingWord = ratingClasses.split(' ').find(c => c !== 'star-rating') || null;

  let description = null;
  const descEl = $('#product_description').next('p');
  if (descEl.length > 0) {
    description = descEl.text().trim();
  }

  return {
    title,
    product_url: bookUrl,
    price_text: priceText,
    availability_text: availabilityText,
    rating_text: ratingWord,
    description,
    source_page: sourcePage,
    fetched_at: new Date().toISOString(),
  };
}

module.exports = extractBook;