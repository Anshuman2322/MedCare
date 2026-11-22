// What a review can be about. Keys match the server (services/reviewDrafts.js).
export const REVIEW_TOPICS = {
  prices: 'Prices',
  quote: 'Quick quotes',
  support: 'Customer support',
  delivery: 'Delivery',
  packaging: 'Packaging',
  quality: 'Product quality',
  ordering: 'Easy ordering',
};

export const MAX_TOPICS = 4;

// Product reviews lead with the product; store reviews lead with the service.
export const PRODUCT_TOPIC_ORDER = ['quality', 'packaging', 'delivery', 'prices', 'support', 'quote', 'ordering'];
export const STORE_TOPIC_ORDER = ['prices', 'quote', 'support', 'delivery', 'ordering', 'packaging', 'quality'];

export const topicLabel = (key) => REVIEW_TOPICS[key] || key;
