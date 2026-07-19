export function scoreChoice({mode, same, firstIndex=0, secondIndex=1, pointsEnabled=true}) {
  const awarded = [0, 0];
  let shared = 0;
  if (!pointsEnabled || !same) return {awarded, shared, match: Boolean(same)};
  if (mode === 'know') awarded[secondIndex] = 2;
  else {
    awarded[firstIndex] = 1;
    awarded[secondIndex] = 1;
  }
  shared = 1;
  return {awarded, shared, match: true};
}

export function scoreScale(secret, guess, pointsEnabled=true) {
  const diff = Math.abs(Number(secret) - Number(guess));
  const points = diff === 0 ? 3 : diff === 1 ? 2 : diff === 2 ? 1 : 0;
  return {diff, points: pointsEnabled ? points : 0, shared: pointsEnabled && diff === 0 ? 1 : 0, match: diff === 0};
}

export function scoreWords(secretWords, selectedWords, pointsEnabled=true) {
  const source = new Set(secretWords || []);
  const hits = (selectedWords || []).filter(word => source.has(word)).length;
  return {hits, points: pointsEnabled ? hits : 0, shared: pointsEnabled ? hits : 0, match: hits === 3};
}
