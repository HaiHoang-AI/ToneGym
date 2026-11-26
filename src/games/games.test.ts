import { describe, expect, it } from 'vitest';
import { createRng } from '../theory';
import { DESIGNED_LEVELS, STAGES_PER_LEVEL, LIVES_PER_LEVEL, effectiveLevel, pickFromPool, poolSize } from './levels';
import { GAMES, playableGames } from './registry';
import { answer, next, startSession } from './session';
import { soundLength } from './sound';

const ctx = { lang: 'vi', accidentals: 'sharp' as const, naming: 'letters' as const };
const SAMPLE_LEVELS = [1, 2, 5, 10, 20, 37, 50, 75, 100, 125, 150, 151, 300];

describe('registry', () => {
  it('lists 18 games with unique ids', () => {
    expect(GAMES).toHaveLength(18);
    expect(new Set(GAMES.map((g) => g.id)).size).toBe(18);
  });

  it('ships the listening games (phase 2) and the rhythm and melody games (phase 3)', () => {
    expect(playableGames().map((g) => g.id)).toEqual(expect.arrayContaining([
      'harmonic-intervals', 'ascending-intervals', 'descending-intervals', 'interval-compare',
      'chord-id', 'chord-by-name', 'inversions', 'scale-id', 'progressions',
      'melody-hunt', 'melody-copy', 'rhythm-echo', 'rhythm-read', 'treble-reading', 'bass-reading',
    ]));
    for (const g of playableGames()) expect(g.phase).toBeLessThanOrEqual(5);
  });
});

describe('question builders', () => {
  for (const game of playableGames()) {
    it(`${game.id}: every level yields a valid question`, () => {
      const rng = createRng(7);
      for (const level of SAMPLE_LEVELS) {
        for (let i = 0; i < 25; i++) {
          const q = game.makeQuestion!(level, rng, ctx);
          if (q.input) {
            expect(q.correctId).toBe('ok');
            if (q.input.kind === 'notes') {
              expect(q.input.target.length).toBeGreaterThanOrEqual(3);
              for (const n of q.input.target) expect(q.input.palette).toContain(n);
            } else {
              const beats = q.input.pattern.events.reduce((s, e) => s + e.dur, 0);
              expect(beats).toBeCloseTo(q.input.pattern.beatsPerBar * q.input.pattern.bars);
              expect(q.input.pattern.events[0]!.rest).toBe(false);
            }
            continue;
          }
          const ids = q.options.map((o) => o.id);
          expect(ids).toContain(q.correctId);
          expect(new Set(ids).size).toBe(ids.length);
          expect(q.options.length).toBeGreaterThanOrEqual(2);
          if (!q.soundChoice && !q.staff) expect(soundLength(q.sound)).toBeGreaterThan(0);
          if (q.staff) expect(q.staff.stacks.flat().length).toBeGreaterThan(0);
          for (const step of q.sound.steps) {
            for (const n of step.notes) {
              expect(n).toBeGreaterThanOrEqual(21);
              expect(n).toBeLessThanOrEqual(108);
            }
          }
          if (q.soundChoice) expect(q.options.every((o) => o.sound)).toBe(true);
        }
      }
    });
  }

  it('unlocks more answers as levels rise', () => {
    expect(poolSize(1, 24, 3, 5)).toBe(3);
    expect(poolSize(6, 24, 3, 5)).toBe(4);
    expect(poolSize(500, 24, 3, 5)).toBe(24);
  });

  it('keeps pool order and includes the answer', () => {
    const rng = createRng(3);
    for (let i = 0; i < 50; i++) {
      const { answer: a, options } = pickFromPool(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], 8, rng, 5);
      expect(options).toContain(a);
      expect(options.length).toBe(5);
      expect([...options].sort()).toEqual(options);
    }
  });

  it('mixes earlier levels after the designed ones', () => {
    const rng = createRng(1);
    expect(effectiveLevel(40, rng)).toBe(40);
    for (let i = 0; i < 50; i++) {
      const lv = effectiveLevel(DESIGNED_LEVELS + 20, rng);
      expect(lv).toBeLessThanOrEqual(DESIGNED_LEVELS);
      expect(lv).toBeGreaterThanOrEqual(DESIGNED_LEVELS / 2);
    }
  });
});

describe('session', () => {
  const game = playableGames()[0]!;

  it('passes a level after 8 correct answers', () => {
    const rng = createRng(11);
    let s = startSession(game, 1, rng, ctx);
    for (let i = 0; i < STAGES_PER_LEVEL; i++) {
      s = answer(s, s.question.correctId);
      expect(s.lastCorrect).toBe(true);
      s = next(s, game, rng, ctx);
    }
    expect(s.phase).toBe('passed');
    expect(s.score).toBeGreaterThan(0);
    expect(s.correct).toBe(STAGES_PER_LEVEL);
  });

  it('fails a level after losing every life', () => {
    const rng = createRng(12);
    let s = startSession(game, 3, rng, ctx);
    for (let i = 0; i < LIVES_PER_LEVEL; i++) {
      const wrong = s.question.options.find((o) => o.id !== s.question.correctId)!.id;
      s = answer(s, wrong);
      expect(s.lastCorrect).toBe(false);
      s = next(s, game, rng, ctx);
    }
    expect(s.phase).toBe('failed');
    expect(s.lives).toBe(0);
  });

  it('treats a timeout as a wrong answer', () => {
    const rng = createRng(13);
    const s = answer(startSession(game, 1, rng, ctx), null);
    expect(s.lastCorrect).toBe(false);
    expect(s.lives).toBe(LIVES_PER_LEVEL - 1);
  });
});
