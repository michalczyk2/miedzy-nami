const VALID_TYPES = new Set(['scale', 'choice', 'plan', 'words', 'conversation', 'challenge']);
const VALID_LEVELS = new Set([1, 2, 3]);

export function validateCard(card, categories) {
  const errors = [];
  const warnings = [];
  if (!card || typeof card !== 'object') return {errors: ['Karta nie jest obiektem.'], warnings};
  if (!String(card.id || '').trim()) errors.push('Brak id.');
  if (!String(card.mode || '').trim()) errors.push('Brak mode.');
  if (!VALID_TYPES.has(card.type)) errors.push(`Nieznany type: ${card.type}.`);
  if (!categories.has(card.category)) errors.push(`Nieznana kategoria: ${card.category}.`);
  if (!VALID_LEVELS.has(Number(card.level))) errors.push(`Nieprawidłowy poziom: ${card.level}.`);

  const prompt = card.type === 'plan' ? card.title : card.prompt;
  if (!String(prompt || '').trim()) errors.push('Brak treści karty.');
  if (String(prompt || '').length > 190) warnings.push('Treść karty przekracza 190 znaków.');

  if (card.type === 'choice') {
    if (!Array.isArray(card.options) || card.options.length < 2 || card.options.some(value => !String(value).trim())) errors.push('Karta choice wymaga co najmniej 2 odpowiedzi.');
  }
  if (card.type === 'scale' && (!String(card.low || '').trim() || !String(card.high || '').trim())) errors.push('Karta scale wymaga low i high.');
  if (card.type === 'plan') {
    if (!Array.isArray(card.positives) || card.positives.length !== 2) errors.push('Karta plan wymaga dokładnie 2 zalet.');
    if (!String(card.twist || '').trim()) errors.push('Karta plan wymaga twist.');
  }
  if (card.type === 'words') {
    if (!Array.isArray(card.words) || card.words.length !== 12) errors.push('Plansza words musi zawierać dokładnie 12 słów.');
    if (new Set((card.words || []).map(word => String(word).toLowerCase())).size !== (card.words || []).length) errors.push('Plansza words zawiera powtórzone słowo.');
  }
  return {errors, warnings};
}
