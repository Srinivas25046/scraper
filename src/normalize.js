function normalize(rawRecord) {
  const priceMatch = rawRecord.price_text.match(/[\d.]+/);
  const price_gbp = priceMatch ? parseFloat(priceMatch[0]) : NaN;

  return {
    ...rawRecord,
    price_gbp,
  };
}

module.exports = normalize;