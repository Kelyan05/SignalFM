const cache = new Map();
// time to live in seconds
export const getCache = async (key) => {
  const entry = cache.get(key);

  if (!entry) return null;

  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }

  return entry.value;
};

export const setCache = async (key, value, ttl) => {
  cache.set(key, {
    value,
    expiry: Date.now() + ttl * 1000
  });
};