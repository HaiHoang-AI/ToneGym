import type { AnchorSong } from './types';

/*
 * Memory-hook tunes. Every one is public domain (traditional, or the composer died long ago);
 * only the notes and the title are used, never lyrics.
 * MIDI: C3 = 48, C4 = 60, C5 = 72.
 */

const TWINKLE = [60, 60, 67, 67, 69, 69, 67, 65, 65, 64, 64, 62, 62, 60];
const TWINKLE_BEATS = [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2];
const TWINKLE_SRC = { vi: 'Giai điệu dân gian Pháp thế kỷ 18 — hết bản quyền', en: '18th-century French folk tune — public domain' };

const FRERE = [60, 62, 64, 60, 60, 62, 64, 60];
const FRERE_SRC = { vi: 'Dân ca Pháp (cùng giai điệu bài thiếu nhi Việt quen thuộc) — hết bản quyền', en: 'French traditional round — public domain' };

const SAINTS = [60, 64, 65, 67, 60, 64, 65, 67];
const SAINTS_BEATS = [1, 1, 1, 3, 1, 1, 1, 3];
const SAINTS_SRC = { vi: 'Thánh ca dân gian Mỹ — hết bản quyền', en: 'American traditional spiritual — public domain' };

const BIRTHDAY = [67, 67, 69, 67, 72, 71];
const BIRTHDAY_BEATS = [0.75, 0.25, 1, 1, 1, 2];
const BIRTHDAY_SRC = { vi: 'Giai điệu "Good Morning to All" (1893) — hết bản quyền', en: '"Good Morning to All" (1893) — public domain' };

const ODE = [64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 64, 62, 62];
const ODE_BEATS = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, 0.5, 2];
const ODE_SRC = { vi: 'Beethoven, Giao hưởng số 9 (1824) — hết bản quyền', en: 'Beethoven, Symphony No. 9 (1824) — public domain' };

const AULD = [55, 60, 60, 60, 64, 62, 60, 62, 64, 60, 60, 64, 67, 69];
const AULD_BEATS = [1, 1.5, 0.5, 1, 1, 1.5, 0.5, 1, 0.5, 0.5, 1.5, 0.5, 1, 3];
const AULD_SRC = { vi: 'Dân ca Scotland — hết bản quyền', en: 'Scottish traditional — public domain' };

const shift = (notes: number[], by: number) => notes.map((n) => n + by);
const idx = (notes: number[], targets: number[]) => notes.flatMap((n, i) => (targets.includes(n) ? [i] : []));

const DEMO_SRC = { vi: 'Ví dụ tự soạn để nghe', en: 'Listening demo' };

export const ANCHORS: readonly AnchorSong[] = [
  // ---- Pitch path ----
  { id: 'frere-c', title: { vi: 'Frère Jacques', en: 'Frère Jacques' }, source: FRERE_SRC, notes: FRERE, highlight: idx(FRERE, [60]) },
  { id: 'twinkle-c', title: { vi: 'Twinkle Twinkle Little Star', en: 'Twinkle Twinkle Little Star' }, source: TWINKLE_SRC, notes: TWINKLE, beats: TWINKLE_BEATS, highlight: [0, 1, 13] },
  { id: 'twinkle-cg', title: { vi: 'Twinkle Twinkle Little Star', en: 'Twinkle Twinkle Little Star' }, source: TWINKLE_SRC, notes: TWINKLE.slice(0, 7), beats: TWINKLE_BEATS.slice(0, 7), highlight: [0, 1, 2, 3, 6] },
  { id: 'saints-ce', title: { vi: 'When the Saints Go Marching In', en: 'When the Saints Go Marching In' }, source: SAINTS_SRC, notes: SAINTS, beats: SAINTS_BEATS, highlight: idx(SAINTS, [60, 64]) },
  { id: 'frere-e', title: { vi: 'Frère Jacques', en: 'Frère Jacques' }, source: FRERE_SRC, notes: FRERE, highlight: idx(FRERE, [64]) },
  { id: 'twinkle-a', title: { vi: 'Twinkle Twinkle Little Star', en: 'Twinkle Twinkle Little Star' }, source: TWINKLE_SRC, notes: TWINKLE.slice(0, 7), beats: TWINKLE_BEATS.slice(0, 7), highlight: [4, 5] },
  { id: 'birthday-a', title: { vi: 'Happy Birthday', en: 'Happy Birthday' }, source: BIRTHDAY_SRC, notes: BIRTHDAY, beats: BIRTHDAY_BEATS, highlight: [2] },
  { id: 'ode-f', title: { vi: 'Ode to Joy', en: 'Ode to Joy' }, source: ODE_SRC, notes: ODE, beats: ODE_BEATS, highlight: idx(ODE, [65]) },
  { id: 'birthday-b', title: { vi: 'Happy Birthday', en: 'Happy Birthday' }, source: BIRTHDAY_SRC, notes: BIRTHDAY, beats: BIRTHDAY_BEATS, highlight: [5] },
  { id: 'gmajor-fs', title: { vi: 'Âm giai Sol trưởng', en: 'G major scale' }, source: DEMO_SRC, notes: [55, 57, 59, 60, 62, 64, 66, 67], beats: [1, 1, 1, 1, 1, 1, 1, 2], highlight: [6, 7] },
  { id: 'c7-bb', title: { vi: 'Hợp âm Đô 7 rải', en: 'C7 arpeggio' }, source: DEMO_SRC, notes: [60, 64, 67, 70, 67, 64, 60], highlight: [3] },
  { id: 'cmaj-cmin', title: { vi: 'Đô trưởng rồi Đô thứ', en: 'C major, then C minor' }, source: DEMO_SRC, notes: [60, 64, 67, 60, 63, 67], highlight: [4] },
  { id: 'cminor-ab', title: { vi: 'Âm giai Đô thứ', en: 'C minor scale' }, source: DEMO_SRC, notes: [60, 62, 63, 65, 67, 68, 70, 72], highlight: [5] },
  { id: 'phrygian-db', title: { vi: 'Đô – Rê giáng – Đô', en: 'C – D♭ – C' }, source: DEMO_SRC, notes: [60, 61, 60, 61, 60], beats: [1, 1, 1, 1, 2], highlight: [1, 3] },
  { id: 'twinkle-low', title: { vi: 'Twinkle — một quãng tám thấp', en: 'Twinkle — an octave down' }, source: TWINKLE_SRC, notes: shift(TWINKLE.slice(0, 7), -12), beats: TWINKLE_BEATS.slice(0, 7), highlight: [0, 1, 2, 3, 6] },
  { id: 'arp-low', title: { vi: 'Đô – Mi – Sol dưới trầm', en: 'C – E – G down low' }, source: DEMO_SRC, notes: [48, 52, 55, 52, 48], highlight: [1, 3] },
  { id: 'scale-low', title: { vi: 'Âm giai Đô dưới trầm', en: 'C scale down low' }, source: DEMO_SRC, notes: [48, 50, 52, 53, 55, 57, 59, 60], highlight: [2, 3, 6, 7] },
  { id: 'twinkle-high', title: { vi: 'Twinkle — một quãng tám cao', en: 'Twinkle — an octave up' }, source: TWINKLE_SRC, notes: shift(TWINKLE.slice(0, 7), 12), beats: TWINKLE_BEATS.slice(0, 7), highlight: [0, 1, 2, 3, 6] },
  { id: 'arp-high', title: { vi: 'Đô – Mi – Sol trên cao', en: 'C – E – G up high' }, source: DEMO_SRC, notes: [72, 76, 79, 76, 72], highlight: [1, 3] },
  { id: 'scale-high', title: { vi: 'Âm giai Đô trên cao', en: 'C scale up high' }, source: DEMO_SRC, notes: [72, 74, 76, 77, 79, 81, 83, 84], highlight: [2, 3, 6, 7] },
  { id: 'auld-penta', title: { vi: 'Auld Lang Syne', en: 'Auld Lang Syne' }, source: AULD_SRC, notes: AULD, beats: AULD_BEATS, highlight: idx(AULD, [62, 69]) },
  { id: 'black-penta', title: { vi: 'Ngũ cung trên phím đen', en: 'Black-key pentatonic' }, source: DEMO_SRC, notes: [61, 63, 66, 68, 70, 73, 70, 68, 66, 63, 61], highlight: [0, 1, 2, 3, 4] },
  { id: 'tritone-fb', title: { vi: 'Fa – Si: quãng "ma quỷ"', en: 'F – B: the "devil" interval' }, source: { vi: 'Như dây vĩ cầm lên lệch trong Danse Macabre (Saint-Saëns, 1874) — hết bản quyền', en: 'Like the retuned violin of Danse Macabre (Saint-Saëns, 1874) — public domain' }, notes: [65, 71, 65, 71], beats: [1, 1, 1, 2], highlight: [0, 1, 2, 3] },
];

const BY_ID = new Map(ANCHORS.map((a) => [a.id, a]));

export function getAnchor(id: string): AnchorSong {
  const a = BY_ID.get(id);
  if (!a) throw new Error(`Unknown anchor ${id}`);
  return a;
}
