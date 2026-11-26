import type { Bilingual } from '../theory';
import { SKILLS, type Skill } from '../games/types';
import type { GameProgress } from '../db/schema';

export interface Rank {
  id: 'iron' | 'bronze' | 'silver' | 'gold' | 'diamond';
  min: number;
  color: string;
  name: Bilingual;
}

export const RANKS: readonly Rank[] = [
  { id: 'iron', min: 0, color: '#6b7280', name: { vi: 'Sắt', en: 'Iron' } },
  { id: 'bronze', min: 250, color: '#d08a5a', name: { vi: 'Đồng', en: 'Bronze' } },
  { id: 'silver', min: 500, color: '#c7cdd6', name: { vi: 'Bạc', en: 'Silver' } },
  { id: 'gold', min: 800, color: '#f4b740', name: { vi: 'Vàng', en: 'Gold' } },
  { id: 'diamond', min: 1400, color: '#7dd3fc', name: { vi: 'Kim cương', en: 'Diamond' } },
];

export function rankFor(value: number): Rank {
  return [...RANKS].reverse().find((r) => value >= r.min) ?? RANKS[0]!;
}

export function nextRank(value: number): Rank | null {
  return RANKS.find((r) => r.min > value) ?? null;
}

export function accuracy(p: Pick<GameProgress, 'correct' | 'answered'>): number {
  return p.answered === 0 ? 0 : p.correct / p.answered;
}

/** Points one game contributes: grows with levels passed (with diminishing returns) and accuracy. */
export function gamePoints(p: GameProgress): number {
  if (p.levelsPassed <= 0) return 0;
  return Math.round(40 * Math.sqrt(p.levelsPassed) * (0.6 + 0.4 * accuracy(p)));
}

/** Ear Index: the sum over every game, like an overall performance rating. */
export function earIndex(progress: readonly GameProgress[]): number {
  return progress.reduce((sum, p) => sum + gamePoints(p), 0);
}

/** 0–100 per skill: average of the skill's games, relative to a strong player (level 60). */
export function skillScores(progress: readonly GameProgress[], gameSkill: (id: string) => Skill | undefined): Record<Skill, number> {
  const out = Object.fromEntries(SKILLS.map((s) => [s, 0])) as Record<Skill, number>;
  const counts = Object.fromEntries(SKILLS.map((s) => [s, 0])) as Record<Skill, number>;
  for (const p of progress) {
    const skill = gameSkill(p.gameId);
    if (!skill) continue;
    const levelPart = Math.min(1, Math.sqrt(p.levelsPassed / 60));
    out[skill] += Math.round(100 * (0.7 * levelPart + 0.3 * accuracy(p)));
    counts[skill] += 1;
  }
  for (const s of SKILLS) out[s] = counts[s] ? Math.round(out[s] / counts[s]) : 0;
  return out;
}
