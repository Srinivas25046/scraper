const discoverBooks = require('./discoverBooks');

async function main() {
  const urls = await discoverBooks();
}

main();