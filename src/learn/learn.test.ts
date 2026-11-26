import { describe, expect, it } from 'vitest';
import { createRng, getChord } from '../theory';
import { getAnchor } from './anchors';
import { generateLesson, GUIDED_COUNT, itemPc, lessonItems, semitonesOf, TRAP_COUNT } from './generators';
import { CHORDS_PATH } from './paths/chords';
import { INTERVALS_PATH } from './paths/intervals';
import { applySession, masteryNow, newMastery, pathMastery } from './mastery';
import { PITCH_PATH } from './paths/pitch';
import { computeStars, lessonsToSkip, pathStatuses } from './stars';
import { REGISTERS, type LessonProgress } from './types';

const prog = (lessonId: string, stars: number, skipped = false): LessonProgress => ({
  profileId: 1, pathId: 'pitch', lessonId, stars, bestPct: 0, attempts: 1, skipped, pinned: false, updatedAt: 0,
});

describe('pitch path data', () => {
  it('has 32 items: intro, 24 lessons, 6 checkpoints, final', () => {
    const l = PITCH_PATH.lessons;
    expect(l).toHaveLength(32);
    expect(l.filter((x) => x.kind === 'intro')).toHaveLength(1);
    expect(l.filter((x) => x.kind === 'lesson')).toHaveLength(24);
    expect(l.filter((x) => x.kind === 'checkpoint')).toHaveLength(6);
    expect(l.at(-1)!.kind).toBe('final');
    expect(new Set(l.map((x) => x.id)).size).toBe(32);
  });

  it('every anchor exists and highlights the notes the lesson teaches', () => {
    for (const lesson of PITCH_PATH.lessons) {
      for (const id of lesson.anchors) {
        const a = getAnchor(id);
        expect(a.highlight.length).toBeGreaterThan(0);
        for (const i of a.highlight) expect(a.notes[i]).toBeDefined();
        if (a.beats) expect(a.beats).toHaveLength(a.notes.length);
      }
    }
    // Twinkle: C C G G — the first and third notes are a perfect fifth apart.
    const tw = getAnchor('twinkle-cg');
    expect(tw.notes[2]! - tw.notes[0]!).toBe(7);
  });

  it('every lesson has slides and every new item is in the pool', () => {
    for (const l of PITCH_PATH.lessons.filter((x) => x.kind === 'lesson')) {
      expect(l.slides.length).toBeGreaterThan(0);
      for (const n of l.newItems) expect(lessonItems(l)).toContain(n);
    }
  });
});

describe('question generation', () => {
  it('builds 6 guided, the graded count and 6 traps for every lesson, all in range', () => {
    const rng = createRng(7);
    for (const lesson of PITCH_PATH.lessons) {
      const q = generateLesson(lesson, rng);
      const items = lessonItems(lesson);
      if (lesson.kind === 'lesson') {
        expect(q.guided).toHaveLength(GUIDED_COUNT);
        expect(q.main).toHaveLength(lesson.questionCount);
        expect(q.traps).toHaveLength(lesson.traps.length ? TRAP_COUNT : 0);
      } else if (lesson.kind === 'intro') {
        expect(q.tries).toHaveLength(lesson.questionCount);
      } else {
        expect(q.main).toHaveLength(lesson.questionCount);
      }
      for (const x of [...q.tries, ...q.guided, ...q.main, ...q.traps]) {
        expect(items).toContain(x.itemId);
        const note = x.notes.at(-1)!;
        expect(((note % 12) + 12) % 12).toBe(itemPc(x.itemId));
        if (x.stage === 'main') {
          const r = REGISTERS[lesson.register];
          expect(note).toBeGreaterThanOrEqual(r.from);
          expect(note).toBeLessThanOrEqual(r.to);
        }
      }
    }
  });

  it('main drills use every pool item about equally', () => {
    const lesson = PITCH_PATH.lessons.find((l) => l.id === 'pitch-5')!;
    const q = generateLesson(lesson, createRng(3));
    const counts = new Map<string, number>();
    for (const x of q.main) counts.set(x.itemId, (counts.get(x.itemId) ?? 0) + 1);
    expect(counts.size).toBe(7);
    for (const c of counts.values()) expect(c).toBeGreaterThanOrEqual(2);
  });

  it('yes/no lesson: half yes, decoys get closer, traps only use declared pairs', () => {
    const lesson = PITCH_PATH.lessons.find((l) => l.id === 'pitch-1')!;
    const q = generateLesson(lesson, createRng(11));
    expect(q.main.filter((x) => x.answerId === 'yes')).toHaveLength(10);
    const decoys = q.main.filter((x) => x.answerId === 'no').map((x) => x.itemId);
    expect(decoys[0]).toBe('F#');
    expect(decoys.at(-1)).toBe('D');
    for (const t of q.traps) expect(['C', 'D']).toContain(t.itemId);
  });
});

describe('stars and unlocking', () => {
  it('uses the 90 % and 75 % thresholds and charges anchor uses', () => {
    expect(computeStars(18, 20).stars).toBe(3);
    expect(computeStars(17, 20).stars).toBe(2);
    expect(computeStars(15, 20).stars).toBe(2);
    expect(computeStars(14, 20).stars).toBe(1);
    expect(computeStars(18, 20, 1)).toEqual({ stars: 2, pct: 85 });
  });

  it('opens lessons one by one and keeps checkpoints open', () => {
    const lessons = PITCH_PATH.lessons;
    const s0 = pathStatuses(lessons, new Map());
    expect(s0[0]).toBe('current');
    expect(s0[1]).toBe('locked');
    expect(s0[6]).toBe('open'); // CP1
    const s1 = pathStatuses(lessons, new Map([['pitch-intro', prog('pitch-intro', 3)], ['pitch-1', prog('pitch-1', 1)]]));
    expect(s1[0]).toBe('done');
    expect(s1[1]).toBe('retry');
    expect(s1[2]).toBe('locked');
  });

  it('a passed checkpoint skips the unfinished lessons before it', () => {
    const lessons = PITCH_PATH.lessons;
    const map = new Map([['pitch-intro', prog('pitch-intro', 3)]]);
    const skip = lessonsToSkip(lessons, 6, map);
    expect(skip).toEqual(['pitch-1', 'pitch-2', 'pitch-3', 'pitch-4', 'pitch-5']);
    const after = new Map(map);
    for (const id of skip) after.set(id, prog(id, 0, true));
    after.set('pitch-cp1', prog('pitch-cp1', 2));
    const s = pathStatuses(lessons, after);
    expect(s.slice(1, 6)).toEqual(['skipped', 'skipped', 'skipped', 'skipped', 'skipped']);
    expect(s[7]).toBe('current');
  });
});

describe('mastery', () => {
  it('moves the average and doubles the review spacing on good sessions', () => {
    let m = newMastery(1, 'pitch', 'C');
    m = applySession(m, [true, true, true, true, true], 0);
    expect(m.ewma).toBeGreaterThan(0.9);
    expect(m.intervalDays).toBe(1);
    m = applySession(m, [true, true, true, true], 0);
    expect(m.intervalDays).toBe(2);
    m = applySession(m, [false, false, true], 0);
    expect(m.intervalDays).toBe(1);
    expect(m.ewma).toBeLessThan(0.9);
  });

  it('fades after a week idle and averages over every path item', () => {
    const m = applySession(newMastery(1, 'pitch', 'C'), [true], 0);
    expect(masteryNow(m, 0)).toBe(1);
    expect(masteryNow(m, 37 * 86_400_000)).toBeCloseTo(0.5);
    expect(pathMastery(['C', 'D'], new Map([['C', m]]), 0)).toBe(0.5);
  });
});

describe('intervals path', () => {
  const lessons = INTERVALS_PATH.lessons;

  it('has 42 items: intro, 33 lessons, 7 checkpoints, final', () => {
    expect(lessons).toHaveLength(42);
    expect(lessons.filter((x) => x.kind === 'lesson')).toHaveLength(33);
    expect(lessons.filter((x) => x.kind === 'checkpoint')).toHaveLength(7);
    expect(lessons.at(-1)!.kind).toBe('final');
    expect(new Set(lessons.map((x) => x.id)).size).toBe(42);
  });

  it('every question plays the interval it names, in the lesson direction', () => {
    const rng = createRng(5);
    for (const lesson of lessons) {
      const q = generateLesson(lesson, rng, 'intervals');
      const all = [...q.tries, ...q.guided, ...q.main, ...q.traps];
      expect(all.length).toBeGreaterThan(0);
      for (const x of all) {
        expect(lessonItems(lesson)).toContain(x.itemId);
        expect(Math.abs(x.notes[1]! - x.notes[0]!)).toBe(semitonesOf(x.itemId));
        if (x.stage !== 'trap') {
          if (lesson.direction === 'up') expect(x.notes[1]! > x.notes[0]! && !x.harmonic).toBe(true);
          if (lesson.direction === 'down') expect(x.notes[1]! < x.notes[0]!).toBe(true);
        }
        if (lesson.root !== undefined) expect(Math.min(...x.notes)).toBe(lesson.root);
        if (lesson.resolve && ['TT', 'm7', 'P4', 'm2'].includes(x.itemId)) expect(x.tail).toBeDefined();
      }
      if (lesson.kind === 'lesson') expect(q.main).toHaveLength(20);
    }
  });

  it('each anchor highlights the interval its lesson teaches', () => {
    const expected: Record<string, number> = {
      'iv-octave': 12, 'iv-twinkle-p5': 7, 'iv-bridal-p4': 5, 'iv-amazing-p4': 5, 'iv-auld-p4': 5, 'iv-adeste-p4d': -5, 'iv-twinkle-p5d': -7,
      'iv-saints-m3': 4, 'iv-greensleeves-m3': 3, 'iv-brahms-m3': 3, 'iv-fifth-m3d': -4, 'iv-oldman-m3d': -3, 'iv-birthday-m2': 2, 'iv-frere-m2': 2,
      'iv-ode-m2': 1, 'iv-mary-m2d': -2, 'iv-furelise-m2d': -1, 'iv-bonnie-m6': 9, 'iv-entertainer-m6': 8, 'iv-leading-m7': 11, 'iv-g7-m7': 10, 'iv-macabre-tt': 6,
    };
    for (const [id, semis] of Object.entries(expected)) {
      const a = getAnchor(id);
      const [i, j] = a.highlight;
      expect(a.notes[j!]! - a.notes[i!]!, id).toBe(semis);
      if (a.beats) expect(a.beats).toHaveLength(a.notes.length);
    }
    for (const l of lessons) for (const id of l.anchors) expect(() => getAnchor(id)).not.toThrow();
  });

  it('yes/no octave lesson ends with its closest decoy', () => {
    const q = generateLesson(lessons[1]!, createRng(2), 'intervals');
    expect(q.main.filter((x) => x.answerId === 'yes')).toHaveLength(10);
    expect(q.main.filter((x) => x.answerId === 'no').at(-1)!.itemId).toBe('M7');
  });
});

describe('chords path', () => {
  const lessons = CHORDS_PATH.lessons;

  it('has 26 items: intro, 19 lessons, 5 checkpoints, final', () => {
    expect(lessons).toHaveLength(26);
    expect(lessons.filter((x) => x.kind === 'lesson')).toHaveLength(19);
    expect(lessons.filter((x) => x.kind === 'checkpoint')).toHaveLength(5);
    expect(lessons.at(-1)!.kind).toBe('final');
  });

  it('every question plays the chord it names, in the lesson register', () => {
    const rng = createRng(9);
    for (const lesson of lessons) {
      const q = generateLesson(lesson, rng, 'chords');
      for (const x of [...q.tries, ...q.guided, ...q.main, ...q.traps]) {
        expect(lessonItems(lesson)).toContain(x.itemId);
        expect(x.harmonic).toBe(true);
        const root = x.notes[0]!;
        expect(x.notes.map((n) => n - root)).toEqual([...getChord(x.itemId).formula]);
        if (x.stage === 'main') {
          const r = REGISTERS[lesson.register];
          expect(root).toBeGreaterThanOrEqual(r.from);
          expect(root).toBeLessThanOrEqual(r.to);
        }
      }
      for (const id of lesson.anchors) expect(() => getAnchor(id)).not.toThrow();
    }
  });

  it('chord anchors line up their accompaniment with the melody', () => {
    for (const id of ['ch-ode-maj', 'ch-greensleeves-min', 'ch-maj-min', 'ch-dim', 'ch-aug', 'ch-cmaj7', 'ch-blues-i7', 'ch-am7', 'ch-ii-minor', 'ch-toccata']) {
      const a = getAnchor(id);
      if (a.harmony) expect(a.harmony, id).toHaveLength(a.notes.length);
      if (a.beats) expect(a.beats, id).toHaveLength(a.notes.length);
    }
    // The Toccata chord is a diminished seventh.
    const t = getAnchor('ch-toccata').harmony!.at(-1)!;
    expect(t.map((n) => n - t[0]!)).toEqual([0, 3, 6, 9]);
  });
});
