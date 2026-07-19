export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function hashString(value = '') {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededShuffle(items, seedValue) {
  const copy = [...items];
  let seed = hashString(String(seedValue)) || 1;
  const random = () => {
    seed += 0x6D2B79F5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

export function daysSinceEpoch(dateKey) {
  const [year, month, day] = String(dateKey).split('-').map(Number);
  const utc = Date.UTC(year, month - 1, day);
  return Math.floor(utc / 86400000);
}

export function buildDailyDefinition(payload, dateKey, questionCount = 5) {
  const categoryIds = Object.keys(payload.categories || {});
  if (!categoryIds.length) throw new Error('Brak kategorii Codziennego Dopasowania.');
  const dayNumber = daysSinceEpoch(dateKey);
  const categoryIndex = ((dayNumber % categoryIds.length) + categoryIds.length) % categoryIds.length;
  const category = categoryIds[categoryIndex];
  const pool = (payload.questions || []).filter((question) => question.category === category);
  if (pool.length < questionCount) throw new Error(`Za mało pytań w kategorii ${category}.`);
  const ordered = seededShuffle(pool, `mn-daily-${category}`);
  const occurrence = Math.floor(dayNumber / categoryIds.length);
  const start = ((occurrence * questionCount) % ordered.length + ordered.length) % ordered.length;
  const selected = [];
  for (let offset = 0; offset < questionCount; offset += 1) {
    selected.push(ordered[(start + offset) % ordered.length]);
  }
  return {
    date: dateKey,
    category,
    questionIds: selected.map((question) => question.id),
  };
}

export function questionCompatibility(question, leftAnswer, rightAnswer) {
  const left = Number(leftAnswer);
  const right = Number(rightAnswer);
  if (!Number.isInteger(left) || !Number.isInteger(right) || left < 0 || right < 0 || left > 3 || right > 3) {
    return 0;
  }
  if (left === right) return 100;
  if (question.kind === 'scale') return Math.max(0, 100 - Math.abs(left - right) * 34);
  if (question.kind === 'groups') {
    const groups = Array.isArray(question.groups) ? question.groups : [];
    return groups[left] !== undefined && groups[left] === groups[right] ? 60 : 0;
  }
  return 0;
}

export function scoreDailyMatch(questions, answers) {
  if (!Array.isArray(answers) || answers.length !== 2) throw new Error('Nieprawidłowy zestaw odpowiedzi.');
  const results = questions.map((question, index) => {
    const leftAnswer = answers[0][index];
    const rightAnswer = answers[1][index];
    return {
      questionId: question.id,
      leftAnswer,
      rightAnswer,
      compatibility: questionCompatibility(question, leftAnswer, rightAnswer),
    };
  });
  const score = results.length
    ? Math.round(results.reduce((sum, result) => sum + result.compatibility, 0) / results.length)
    : 0;
  return { score, results };
}

export function completedDailyEntries(days = {}) {
  return Object.values(days)
    .filter((entry) => entry && Number.isFinite(entry.score) && entry.finishedAt)
    .sort((left, right) => String(left.date).localeCompare(String(right.date)));
}

export function dailyStats(days = {}, period = 'all', today = new Date()) {
  const entries = completedDailyEntries(days);
  const limit = period === 'all' ? Infinity : Number(period) || 14;
  const cutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  cutoff.setDate(cutoff.getDate() - limit + 1);
  const filtered = entries.filter((entry) => {
    if (limit === Infinity) return true;
    const [year, month, day] = entry.date.split('-').map(Number);
    return new Date(year, month - 1, day) >= cutoff;
  });
  const average = filtered.length
    ? Math.round(filtered.reduce((sum, entry) => sum + entry.score, 0) / filtered.length)
    : 0;
  const byCategory = {};
  filtered.forEach((entry) => {
    const bucket = byCategory[entry.category] || { sum: 0, count: 0 };
    bucket.sum += entry.score;
    bucket.count += 1;
    byCategory[entry.category] = bucket;
  });
  const categoryAverages = Object.fromEntries(
    Object.entries(byCategory).map(([category, bucket]) => [category, Math.round(bucket.sum / bucket.count)]),
  );
  return { entries: filtered, average, categoryAverages };
}

export function calculateDailyStreak(days = {}, todayKeyValue = localDateKey()) {
  const complete = new Set(completedDailyEntries(days).map((entry) => entry.date));
  let current = 0;
  const cursor = new Date(`${todayKeyValue}T12:00:00`);
  if (!complete.has(todayKeyValue)) cursor.setDate(cursor.getDate() - 1);
  while (complete.has(localDateKey(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const sorted = [...complete].sort();
  let best = 0;
  let run = 0;
  let previous = null;
  for (const key of sorted) {
    if (!previous) run = 1;
    else {
      const prev = new Date(`${previous}T12:00:00`);
      prev.setDate(prev.getDate() + 1);
      run = localDateKey(prev) === key ? run + 1 : 1;
    }
    best = Math.max(best, run);
    previous = key;
  }
  return { current, best };
}
