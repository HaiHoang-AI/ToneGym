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


const BRIDAL = [60, 65, 65, 65, 60, 67, 64, 65];
const BRIDAL_BEATS = [1, 0.75, 0.25, 2, 1, 0.75, 0.25, 2];
const AMAZING = [55, 60, 64, 60, 64, 62, 60, 57, 55];
const AMAZING_BEATS = [1, 2, 0.5, 0.5, 2, 1, 2, 1, 2];
const ADESTE = [72, 72, 67, 72, 74, 67];
const ADESTE_BEATS = [1, 2, 1, 1, 2, 2];
const GREENSLEEVES = [57, 60, 62, 64, 65, 64, 62, 59, 55, 57, 59, 60, 57];
const GREENSLEEVES_BEATS = [1, 2, 1, 1.5, 0.5, 1, 2, 1, 1.5, 0.5, 1, 2, 1];
const BRAHMS = [64, 64, 67, 64, 64, 67, 64, 67, 72, 71, 69, 69, 67];
const BRAHMS_BEATS = [0.5, 0.5, 2, 0.5, 0.5, 2, 0.5, 0.5, 1, 1.5, 0.5, 1, 1];
const FIFTH = [67, 67, 67, 63, 65, 65, 65, 62];
const FIFTH_BEATS = [0.5, 0.5, 0.5, 2.5, 0.5, 0.5, 0.5, 2.5];
const OLDMAN = [67, 64, 67, 67, 64, 67, 69, 67, 65, 64, 62, 64, 65];
const OLDMAN_BEATS = [1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 1];
const MARY = [64, 62, 60, 62, 64, 64, 64];
const MARY_BEATS = [1, 1, 1, 1, 1, 1, 2];
const FURELISE = [76, 75, 76, 75, 76, 71, 74, 72, 69];
const FURELISE_BEATS = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1.5];
const BONNIE = [67, 76, 74, 72, 74, 72, 69, 67, 64];
const BONNIE_BEATS = [1, 1.5, 0.5, 1, 1, 1, 1, 1, 3];
const ENTERTAINER = [62, 63, 64, 72, 64, 72, 64, 72];
const ENTERTAINER_BEATS = [0.5, 0.5, 0.5, 1, 0.5, 1, 0.5, 2.5];

const PD = (vi: string, en: string) => ({ vi: `${vi} — hết bản quyền`, en: `${en} — public domain` });

export const INTERVAL_ANCHORS: readonly AnchorSong[] = [
  { id: 'iv-octave', title: { vi: 'Cùng giai điệu, cách một quãng tám', en: 'The same tune an octave apart' }, source: { vi: 'Như giọng nam và giọng nữ hát cùng nhau', en: 'Like a man and a woman singing together' }, notes: [60, 72, 62, 74, 64, 76, 60, 72], highlight: [0, 1] },
  { id: 'iv-twinkle-p5', title: { vi: 'Twinkle Twinkle Little Star', en: 'Twinkle Twinkle Little Star' }, source: TWINKLE_SRC, notes: TWINKLE.slice(0, 7), beats: TWINKLE_BEATS.slice(0, 7), highlight: [1, 2] },
  { id: 'iv-bridal-p4', title: { vi: 'Hành khúc cưới (Wagner)', en: 'Bridal Chorus (Wagner)' }, source: PD('Wagner, Lohengrin (1850)', 'Wagner, Lohengrin (1850)'), notes: BRIDAL, beats: BRIDAL_BEATS, highlight: [0, 1] },
  { id: 'iv-amazing-p4', title: { vi: 'Amazing Grace', en: 'Amazing Grace' }, source: PD('Thánh ca Mỹ thế kỷ 19', '19th-century American hymn'), notes: AMAZING, beats: AMAZING_BEATS, highlight: [0, 1] },
  { id: 'iv-auld-p4', title: { vi: 'Auld Lang Syne', en: 'Auld Lang Syne' }, source: AULD_SRC, notes: AULD, beats: AULD_BEATS, highlight: [0, 1] },
  { id: 'iv-adeste-p4d', title: { vi: 'O Come, All Ye Faithful', en: 'O Come, All Ye Faithful' }, source: PD('Thánh ca thế kỷ 18', '18th-century hymn'), notes: ADESTE, beats: ADESTE_BEATS, highlight: [1, 2] },
  { id: 'iv-twinkle-p5d', title: { vi: 'Twinkle đảo chiều', en: 'Twinkle turned around' }, source: DEMO_SRC, notes: [67, 67, 60, 60], beats: [1, 1, 1, 2], highlight: [1, 2] },
  { id: 'iv-saints-m3', title: { vi: 'When the Saints Go Marching In', en: 'When the Saints Go Marching In' }, source: SAINTS_SRC, notes: SAINTS, beats: SAINTS_BEATS, highlight: [0, 1] },
  { id: 'iv-greensleeves-m3', title: { vi: 'Greensleeves', en: 'Greensleeves' }, source: PD('Dân ca Anh thế kỷ 16', '16th-century English folk song'), notes: GREENSLEEVES, beats: GREENSLEEVES_BEATS, highlight: [0, 1] },
  { id: 'iv-brahms-m3', title: { vi: 'Khúc hát ru (Brahms)', en: 'Lullaby (Brahms)' }, source: PD('Brahms, Wiegenlied (1868)', 'Brahms, Wiegenlied (1868)'), notes: BRAHMS, beats: BRAHMS_BEATS, highlight: [1, 2] },
  { id: 'iv-major-arp', title: { vi: 'Hợp âm Đô trưởng rải', en: 'C major arpeggio' }, source: DEMO_SRC, notes: [60, 64, 67, 64, 60], highlight: [0, 1, 2] },
  { id: 'iv-minor-arp', title: { vi: 'Hợp âm La thứ rải', en: 'A minor arpeggio' }, source: DEMO_SRC, notes: [57, 60, 64, 60, 57], highlight: [0, 1, 2] },
  { id: 'iv-fifth-m3d', title: { vi: 'Giao hưởng số 5 (Beethoven)', en: 'Symphony No. 5 (Beethoven)' }, source: PD('Beethoven (1808)', 'Beethoven (1808)'), notes: FIFTH, beats: FIFTH_BEATS, highlight: [2, 3] },
  { id: 'iv-oldman-m3d', title: { vi: 'This Old Man', en: 'This Old Man' }, source: PD('Đồng dao Anh', 'English nursery rhyme'), notes: OLDMAN, beats: OLDMAN_BEATS, highlight: [0, 1] },
  { id: 'iv-birthday-m2', title: { vi: 'Happy Birthday', en: 'Happy Birthday' }, source: BIRTHDAY_SRC, notes: BIRTHDAY, beats: BIRTHDAY_BEATS, highlight: [1, 2] },
  { id: 'iv-frere-m2', title: { vi: 'Frère Jacques', en: 'Frère Jacques' }, source: FRERE_SRC, notes: FRERE, highlight: [0, 1] },
  { id: 'iv-ode-m2', title: { vi: 'Ode to Joy', en: 'Ode to Joy' }, source: ODE_SRC, notes: ODE, beats: ODE_BEATS, highlight: [1, 2] },
  { id: 'iv-mary-m2d', title: { vi: 'Mary Had a Little Lamb', en: 'Mary Had a Little Lamb' }, source: PD('Bài hát thiếu nhi Mỹ thế kỷ 19', '19th-century American children\'s song'), notes: MARY, beats: MARY_BEATS, highlight: [0, 1] },
  { id: 'iv-furelise-m2d', title: { vi: 'Für Elise (Beethoven)', en: 'Für Elise (Beethoven)' }, source: PD('Beethoven (1810)', 'Beethoven (1810)'), notes: FURELISE, beats: FURELISE_BEATS, highlight: [0, 1] },
  { id: 'iv-bonnie-m6', title: { vi: 'My Bonnie Lies over the Ocean', en: 'My Bonnie Lies over the Ocean' }, source: PD('Dân ca Scotland', 'Scottish folk song'), notes: BONNIE, beats: BONNIE_BEATS, highlight: [0, 1] },
  { id: 'iv-entertainer-m6', title: { vi: 'The Entertainer (Joplin)', en: 'The Entertainer (Joplin)' }, source: PD('Scott Joplin (1902)', 'Scott Joplin (1902)'), notes: ENTERTAINER, beats: ENTERTAINER_BEATS, highlight: [2, 3] },
  { id: 'iv-leading-m7', title: { vi: 'Nốt dẫn: Đô – Si – Đô', en: 'Leading note: C – B – C' }, source: DEMO_SRC, notes: [60, 71, 72], beats: [1, 1, 2], highlight: [0, 1] },
  { id: 'iv-g7-m7', title: { vi: 'Hợp âm Sol 7 rải', en: 'G7 arpeggio' }, source: DEMO_SRC, notes: [55, 59, 62, 65, 62, 59, 55], highlight: [0, 3] },
  { id: 'iv-macabre-tt', title: { vi: 'Danse Macabre (Saint-Saëns)', en: 'Danse Macabre (Saint-Saëns)' }, source: PD('Saint-Saëns (1874): dây Mi của vĩ cầm hạ xuống Mi♭', 'Saint-Saëns (1874): the violin\'s E string tuned down to E♭'), notes: [69, 75, 69, 75, 69, 75], beats: [1, 1, 1, 1, 1, 2], highlight: [0, 1] },
  { id: 'iv-resolve', title: { vi: 'Quãng căng và nơi nó về', en: 'Tense intervals and where they go' }, source: DEMO_SRC, notes: [65, 71, 64, 72, 55, 65, 60, 64], highlight: [0, 1, 4, 5] },
];

const C3 = [48, 52, 55];
const G2 = [43, 47, 50];
const AM2 = [45, 48, 52];

export const CHORD_ANCHORS: readonly AnchorSong[] = [
  {
    id: 'ch-ode-maj', title: { vi: 'Ode to Joy đệm Đô và Sol trưởng', en: 'Ode to Joy over C and G major' }, source: ODE_SRC,
    notes: ODE, beats: ODE_BEATS, highlight: [0, 4, 8, 12],
    harmony: ODE.map((_, i) => (i === 0 || i === 8 ? C3 : i === 4 || i === 12 ? G2 : null)),
  },
  {
    id: 'ch-greensleeves-min', title: { vi: 'Greensleeves đệm La thứ', en: 'Greensleeves over A minor' }, source: PD('Dân ca Anh thế kỷ 16', '16th-century English folk song'),
    notes: GREENSLEEVES, beats: GREENSLEEVES_BEATS, highlight: [1, 11],
    harmony: GREENSLEEVES.map((_, i) => (i === 1 || i === 11 ? AM2 : i === 6 ? G2 : null)),
  },
  { id: 'ch-maj-min', title: { vi: 'Đô trưởng rồi Đô thứ', en: 'C major, then C minor' }, source: DEMO_SRC, notes: [60, 64, 67, 60, 63, 67], beats: [1, 1, 2, 1, 1, 2], highlight: [1, 4], harmony: [null, null, [48, 52, 55], null, null, [48, 51, 55]] },
  { id: 'ch-dim', title: { vi: 'Hợp âm giảm "phim câm"', en: 'The "silent film" diminished chord' }, source: DEMO_SRC, notes: [59, 62, 65, 59, 62, 65, 60], beats: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 2], highlight: [0, 1, 2], harmony: [[47, 50, 53], null, null, [47, 50, 53], null, null, [48, 52, 55]] },
  { id: 'ch-aug', title: { vi: 'Âm giai toàn cung (kiểu Debussy)', en: 'Whole-tone scale (Debussy style)' }, source: DEMO_SRC, notes: [60, 62, 64, 66, 68, 70, 72], highlight: [0, 2, 4], harmony: [null, null, null, null, [48, 52, 56], null, [48, 52, 56]] },
  { id: 'ch-cmaj7', title: { vi: 'Đô bảy trưởng rải', en: 'Cmaj7 arpeggio' }, source: DEMO_SRC, notes: [60, 64, 67, 71, 67, 64, 60], highlight: [3], harmony: [null, null, null, [48, 52, 55, 59], null, null, null] },
  { id: 'ch-blues-i7', title: { vi: 'Đô 7 kiểu blues', en: 'Bluesy C7' }, source: DEMO_SRC, notes: [60, 64, 67, 70, 69, 67, 64], highlight: [3], harmony: [[48, 52, 55, 58], null, null, null, null, [48, 52, 55, 58], null] },
  { id: 'ch-am7', title: { vi: 'La bảy thứ rải', en: 'Am7 arpeggio' }, source: DEMO_SRC, notes: [57, 60, 64, 67, 64, 60, 57], highlight: [3], harmony: [null, null, null, [45, 48, 52, 55], null, null, null] },
  { id: 'ch-ii-minor', title: { vi: 'Rê nửa giảm → Sol 7 → Đô thứ', en: 'Dø7 → G7 → C minor' }, source: DEMO_SRC, notes: [62, 65, 68, 72, 71, 67, 63], beats: [1, 1, 1, 1, 1, 1, 2], highlight: [0, 1, 2, 3], harmony: [[50, 53, 56, 60], null, null, null, [43, 47, 50, 53], null, [48, 51, 55]] },
  {
    id: 'ch-toccata', title: { vi: 'Toccata và Fugue cung Rê thứ (Bach)', en: 'Toccata and Fugue in D minor (Bach)' }, source: PD('J. S. Bach, BWV 565', 'J. S. Bach, BWV 565'),
    notes: [81, 79, 81, 79, 77, 76, 74, 73, 74, 61], beats: [0.25, 0.25, 1.5, 0.25, 0.25, 0.25, 0.25, 0.5, 1.5, 3], highlight: [9],
    harmony: [null, null, null, null, null, null, null, null, null, [64, 67, 70, 73]],
  },
];

const BY_ID = new Map([...ANCHORS, ...INTERVAL_ANCHORS, ...CHORD_ANCHORS].map((a) => [a.id, a]));

export function getAnchor(id: string): AnchorSong {
  const a = BY_ID.get(id);
  if (!a) throw new Error(`Unknown anchor ${id}`);
  return a;
}
