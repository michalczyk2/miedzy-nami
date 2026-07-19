export const RATINGS = new Set(['like', 'dislike', 'flag']);

export function normalizeFeedback(value) {
  if (!value || typeof value !== 'object') return {};
  const result = {};
  for (const [id, entry] of Object.entries(value)) {
    const rating = typeof entry === 'string' ? entry : entry?.rating;
    if (!RATINGS.has(rating)) continue;
    result[id] = {
      rating,
      updatedAt: Number(entry?.updatedAt) || Date.now(),
      reason: typeof entry?.reason === 'string' ? entry.reason.slice(0, 120) : undefined
    };
  }
  return result;
}

export function setCardRating(feedback, cardId, rating, metadata={}) {
  const next = {...normalizeFeedback(feedback)};
  if (!cardId) return next;
  const current = next[cardId]?.rating;
  if (!rating || current === rating) {
    delete next[cardId];
    return next;
  }
  if (!RATINGS.has(rating)) throw new Error(`Unsupported rating: ${rating}`);
  next[cardId] = {rating, updatedAt: Date.now(), ...metadata};
  return next;
}

export function feedbackSummary(feedback) {
  const result = {like: 0, dislike: 0, flag: 0};
  for (const entry of Object.values(normalizeFeedback(feedback))) result[entry.rating]++;
  return result;
}
