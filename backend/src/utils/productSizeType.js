const productSizeTypeText = (product, additionalSignals = []) => [
  product?.name,
  ...(product?.filters || []),
  ...additionalSignals,
  product?.collectionId?.name,
  product?.collectionId?.slug,
  product?.subCollectionId?.name,
  product?.subCollectionId?.slug,
].filter(Boolean).join(' ');

export const isSweatshirtProduct = (product, additionalSignals = []) => (
  /\bsweat(?:shirt|er)s?\b/i.test(productSizeTypeText(product, additionalSignals))
);

export const isTShirtProduct = (product, additionalSignals = []) => (
  /\bt[ -]?shirts?\b/i.test(productSizeTypeText(product, additionalSignals))
);
