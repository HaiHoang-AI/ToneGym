export type SectionKey = 'workout' | 'games' | 'exercises' | 'tools' | 'learn' | 'stats' | 'sound';

export interface Section {
  key: SectionKey;
  path: string;
  /** Build phase that delivers this section (see the plan in the README). */
  phase: number;
  ready: boolean;
}

export const SECTIONS: readonly Section[] = [
  { key: 'workout', path: '/workout', phase: 2, ready: false },
  { key: 'games', path: '/games', phase: 2, ready: false },
  { key: 'exercises', path: '/exercises', phase: 2, ready: false },
  { key: 'stats', path: '/stats', phase: 2, ready: false },
  { key: 'tools', path: '/tools', phase: 5, ready: false },
  { key: 'learn', path: '/learn', phase: 7, ready: false },
  { key: 'sound', path: '/sound', phase: 1, ready: true },
];
