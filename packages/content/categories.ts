export const gameCategories = ['Arcade', 'Puzzle', 'Strategy', 'Reflex', 'Casual'] as const;

export const courseworkGroups = [
  { key: 'subjects', label: 'Subjects' },
  { key: 'programmingLanguages', label: 'Programming languages' },
  { key: 'technologies', label: 'Technologies' },
  { key: 'concepts', label: 'Concepts' },
] as const;

export function emptyCoursework() {
  return { subjects: [], programmingLanguages: [], technologies: [], concepts: [], note: '' };
}
