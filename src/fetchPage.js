const fs = require('fs');
const path = require('path');

const USER_AGENT = 'FlyRankInternshipA9/1.0 (+https://github.com/YOUR_USERNAME/YOUR_REPO)';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchOnce(url, cacheFilename) {
  const cachePath = path.join(__dirname, '..', 'cache', cacheFilename);

  if (fs.existsSync(cachePath)) {
    const html = fs.readFileSync(cachePath, 'utf-8');
    console.log(`CACHE HIT: ${cacheFilename} (${html.length} bytes)`);
    return { html, wasCached: true };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  let response;
  try {
    response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status !== 200) {
    const err = new Error(`Fetch failed for ${url}: status ${response.status}`);
    err.status = response.status;
    throw err;
  }

  const html = await response.text();
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, html);
  console.log(`FETCH: ${cacheFilename} (${html.length} bytes)`);

  return { html, wasCached: false };
}

async function fetchPage(url, cacheFilename, maxRetries = 1) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fetchOnce(url, cacheFilename);
      if (!result.wasCached) {
        await sleep(500);
      }
      return result.html;
    } catch (err) {
      const isServerError = err.status && err.status >= 500;
      const isTimeout = err.name === 'AbortError';
      const isRetryable = isServerError || isTimeout;

      if (!isRetryable || attempt === maxRetries) {
        throw err;
      }
      console.log(`RETRYING after failure: ${url} (attempt ${attempt + 1})`);
      await sleep(1000);
    }
  }
}

module.exports = fetchPage;