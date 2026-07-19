const polishMap = new Map([
  ['ą','a'],['ć','c'],['ę','e'],['ł','l'],['ń','n'],['ó','o'],['ś','s'],['ż','z'],['ź','z']
]);

export function normalizeText(value='') {
  return String(value)
    .toLowerCase()
    .split('')
    .map(char => polishMap.get(char) ?? char)
    .join('')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cardSignature(card) {
  if (!card) return '';
  if (card.type === 'words') {
    return `words:${[...(card.words || [])].map(normalizeText).sort().join('|')}`;
  }
  if (card.type === 'plan') {
    return `plan:${normalizeText(card.title)}:${normalizeText(card.twist)}`;
  }
  return `${card.mode || ''}:${normalizeText(card.prompt || '')}`;
}

const STOPWORDS = new Set(['jak','jaki','jaka','jakie','jest','sa','nasz','nasza','nasze','wasz','wasza','czy','ktory','ktora','ktore','wyglada','bardziej']);

export function tokenSet(card) {
  const source = card.type === 'plan'
    ? `${card.title || ''} ${card.twist || ''}`
    : `${card.prompt || ''} ${(card.options || []).join(' ')}`;
  return new Set(normalizeText(source).split(' ').filter(token => token.length > 2 && !STOPWORDS.has(token)));
}

export function jaccardSimilarity(a, b) {
  const left = a instanceof Set ? a : tokenSet(a);
  const right = b instanceof Set ? b : tokenSet(b);
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  for (const token of left) if (right.has(token)) intersection++;
  return intersection / (left.size + right.size - intersection);
}

export function dedupeCards(cards) {
  const ids = new Set();
  const signatures = new Set();
  const result = [];
  for (const card of cards || []) {
    if (!card?.id || ids.has(card.id)) continue;
    const signature = cardSignature(card);
    if (signature && signatures.has(signature)) continue;
    ids.add(card.id);
    if (signature) signatures.add(signature);
    result.push(card);
  }
  return result;
}

function ratingFor(feedback, id) {
  const entry = feedback?.[id];
  return typeof entry === 'string' ? entry : entry?.rating || null;
}

function targetLevel(position, count, intensity) {
  if (intensity <= 1) return 1;
  const ratio = count <= 1 ? 1 : position / (count - 1);
  if (intensity === 2) return ratio < 0.35 ? 1 : 2;
  if (ratio < 0.25) return 1;
  if (ratio < 0.7) return 2;
  return 3;
}

function seededTieBreak(rng) {
  return Math.max(0, Math.min(0.999999, Number(rng?.() ?? Math.random()))) * 8;
}

export function createSmartDeck(cards, count, options={}) {
  const desired = Math.max(0, Number(count) || 0);
  if (!desired) return [];

  const seen = new Set(options.seen || []);
  const favorites = new Set(options.favorites || []);
  const hidden = new Set(options.hidden || []);
  const preferred = new Set(options.preferredCategories || []);
  const avoided = new Set(options.avoidedCategories || []);
  const feedback = options.feedback || {};
  const intensity = Math.max(1, Math.min(3, Number(options.intensity) || 2));
  const rng = options.rng || Math.random;

  let pool = dedupeCards(cards).filter(card => !hidden.has(card.id));
  const safe = pool.filter(card => ratingFor(feedback, card.id) !== 'flag');
  if (safe.length) pool = safe;

  const withoutAvoided = pool.filter(card => !avoided.has(card.category));
  if (withoutAvoided.length >= Math.min(desired, 5)) pool = withoutAvoided;

  const withoutDisliked = pool.filter(card => ratingFor(feedback, card.id) !== 'dislike');
  if (withoutDisliked.length >= Math.min(desired, 5)) pool = withoutDisliked;
  if (!pool.length) return [];

  const chosen = [];
  const categoryCounts = new Map();
  const modeCounts = new Map();
  const usedIds = new Set();

  for (let position = 0; position < Math.min(desired, pool.length); position++) {
    const levelTarget = targetLevel(position, desired, intensity);
    let best = null;
    let bestScore = -Infinity;

    for (const card of pool) {
      if (usedIds.has(card.id)) continue;
      const rating = ratingFor(feedback, card.id);
      const last = chosen.at(-1);
      const recent = chosen.slice(-3);
      const categoryCount = categoryCounts.get(card.category) || 0;
      const modeCount = modeCounts.get(card.mode) || 0;
      let score = seededTieBreak(rng);

      score += seen.has(card.id) ? -16 : 35;
      score += favorites.has(card.id) ? 18 : 0;
      score += rating === 'like' ? 28 : rating === 'dislike' ? -60 : 0;
      score += preferred.has(card.category) ? 13 : 0;
      score -= categoryCount * 8;
      score -= modeCount * 4;
      score -= Math.abs((card.level || 1) - levelTarget) * 12;

      if (last?.category === card.category) score -= 24;
      if (last?.mode === card.mode) score -= 18;
      if ((last?.level || 1) >= 3 && (card.level || 1) >= 3) score -= 45;
      for (const previous of recent) {
        const similarity = jaccardSimilarity(card, previous);
        if (similarity >= 0.72) score -= 90;
        else if (similarity >= 0.5) score -= 35;
      }

      if (score > bestScore) {
        bestScore = score;
        best = card;
      }
    }

    if (!best) break;
    chosen.push(best);
    usedIds.add(best.id);
    categoryCounts.set(best.category, (categoryCounts.get(best.category) || 0) + 1);
    modeCounts.set(best.mode, (modeCounts.get(best.mode) || 0) + 1);
  }

  if (chosen.length < desired) {
    const fallback = pool.filter(card => !usedIds.has(card.id));
    for (const card of fallback) {
      if (chosen.length >= desired) break;
      chosen.push(card);
    }
  }

  if (chosen.length < desired && chosen.length) {
    let index = 0;
    while (chosen.length < desired) {
      chosen.push({...chosen[index % chosen.length]});
      index++;
    }
  }

  return chosen.slice(0, desired).map(card => ({...card}));
}
