export type ScaleKind =
  | 'agreement'
  | 'likelihood'
  | 'frequency'
  | 'intensity'
  | 'comfort';

export type ScaleV2Category =
  | 'codzienność'
  | 'podróże'
  | 'przyszłość'
  | 'relacja'
  | 'romantyczne'
  | 'głębsze';

export type ScaleV2Card = Readonly<{
  id: `scale-v2-${string}`;
  mode: 'scale_v2';
  prompt: string;
  scaleKind: ScaleKind;
  category: ScaleV2Category;
  level: 1 | 2 | 3;
}>;

const cards: ScaleV2Card[] = [
  {
    id: 'scale-v2-001',
    mode: 'scale_v2',
    prompt: 'Wspólne planowanie z wyprzedzeniem daje mi spokój.',
    scaleKind: 'agreement',
    category: 'codzienność',
    level: 1,
  },
  {
    id: 'scale-v2-002',
    mode: 'scale_v2',
    prompt: 'W związku powinniśmy mówić od razu, gdy coś nas uwiera.',
    scaleKind: 'agreement',
    category: 'relacja',
    level: 2,
  },
  {
    id: 'scale-v2-003',
    mode: 'scale_v2',
    prompt: 'Ważne decyzje finansowe powinniśmy podejmować razem.',
    scaleKind: 'agreement',
    category: 'głębsze',
    level: 3,
  },
  {
    id: 'scale-v2-004',
    mode: 'scale_v2',
    prompt: 'Regularny czas tylko we dwoje jest ważniejszy niż spontaniczne spotkania.',
    scaleKind: 'agreement',
    category: 'romantyczne',
    level: 2,
  },
  {
    id: 'scale-v2-005',
    mode: 'scale_v2',
    prompt: 'Jak prawdopodobne jest, że zgodzisz się na spontaniczny wyjazd w najbliższy weekend?',
    scaleKind: 'likelihood',
    category: 'podróże',
    level: 1,
  },
  {
    id: 'scale-v2-006',
    mode: 'scale_v2',
    prompt: 'Jak prawdopodobne jest, że przeprowadzilibyśmy się kiedyś do innego kraju?',
    scaleKind: 'likelihood',
    category: 'przyszłość',
    level: 3,
  },
  {
    id: 'scale-v2-007',
    mode: 'scale_v2',
    prompt: 'Jak prawdopodobne jest, że spróbujemy w tym roku zupełnie nowego wspólnego hobby?',
    scaleKind: 'likelihood',
    category: 'relacja',
    level: 1,
  },
  {
    id: 'scale-v2-008',
    mode: 'scale_v2',
    prompt: 'Jak prawdopodobne jest, że w wolny dzień wybierzesz odpoczynek zamiast dodatkowych obowiązków?',
    scaleKind: 'likelihood',
    category: 'codzienność',
    level: 1,
  },
  {
    id: 'scale-v2-009',
    mode: 'scale_v2',
    prompt: 'Jak często potrzebujesz pobyć sam lub sama po trudnym dniu?',
    scaleKind: 'frequency',
    category: 'relacja',
    level: 2,
  },
  {
    id: 'scale-v2-010',
    mode: 'scale_v2',
    prompt: 'Jak często masz ochotę wspólnie planować najbliższe tygodnie?',
    scaleKind: 'frequency',
    category: 'przyszłość',
    level: 2,
  },
  {
    id: 'scale-v2-011',
    mode: 'scale_v2',
    prompt: 'Jak często drobne gesty partnera poprawiają ci humor?',
    scaleKind: 'frequency',
    category: 'romantyczne',
    level: 1,
  },
  {
    id: 'scale-v2-012',
    mode: 'scale_v2',
    prompt: 'Jak często chciałbyś lub chciałabyś robić coś nowego tylko we dwoje?',
    scaleKind: 'frequency',
    category: 'relacja',
    level: 1,
  },
  {
    id: 'scale-v2-013',
    mode: 'scale_v2',
    prompt: 'Jak mocno zależy ci teraz na większej ilości wspólnego czasu?',
    scaleKind: 'intensity',
    category: 'relacja',
    level: 2,
  },
  {
    id: 'scale-v2-014',
    mode: 'scale_v2',
    prompt: 'Jak mocno stresują cię nagłe zmiany planów?',
    scaleKind: 'intensity',
    category: 'codzienność',
    level: 2,
  },
  {
    id: 'scale-v2-015',
    mode: 'scale_v2',
    prompt: 'Jak mocno cieszy cię, gdy partner przejmuje inicjatywę?',
    scaleKind: 'intensity',
    category: 'romantyczne',
    level: 2,
  },
  {
    id: 'scale-v2-016',
    mode: 'scale_v2',
    prompt: 'Jak mocno potrzebujesz dzisiaj spokojnej rozmowy?',
    scaleKind: 'intensity',
    category: 'głębsze',
    level: 2,
  },
  {
    id: 'scale-v2-017',
    mode: 'scale_v2',
    prompt: 'Jak komfortowo czujesz się, rozmawiając wspólnie o pieniądzach?',
    scaleKind: 'comfort',
    category: 'głębsze',
    level: 3,
  },
  {
    id: 'scale-v2-018',
    mode: 'scale_v2',
    prompt: 'Jak komfortowo czujesz się, prosząc partnera o więcej przestrzeni?',
    scaleKind: 'comfort',
    category: 'relacja',
    level: 3,
  },
  {
    id: 'scale-v2-019',
    mode: 'scale_v2',
    prompt: 'Jak komfortowo czujesz się, mówiąc wprost o swoich potrzebach?',
    scaleKind: 'comfort',
    category: 'głębsze',
    level: 3,
  },
  {
    id: 'scale-v2-020',
    mode: 'scale_v2',
    prompt: 'Jak komfortowo czujesz się, gdy partner planuje dla was niespodziankę?',
    scaleKind: 'comfort',
    category: 'romantyczne',
    level: 1,
  },
];

const ids = new Set(cards.map((card) => card.id));
if (cards.length !== 20 || ids.size !== cards.length) {
  throw new Error('Nieprawidłowa biblioteka prototypu Skali 1–5.');
}

export const SCALE_V2_CARDS: readonly ScaleV2Card[] = Object.freeze(
  cards.map((card) => Object.freeze(card)),
);

declare global {
  interface Window {
    MN_SCALE_V2_CARDS?: readonly ScaleV2Card[];
  }
}

window.MN_SCALE_V2_CARDS = SCALE_V2_CARDS;
