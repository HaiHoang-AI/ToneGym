import { chordSequence, harmonic, melodic } from '../games/sound';
import type { Sound } from '../games/types';
import {
  buildChord, buildScale, getChord, getScale, parseProgression, realizeProgression, type Bilingual,
} from '../theory';

export interface QuizItem {
  q: Bilingual;
  options: Bilingual[];
  answer: number;
  sound?: Sound;
}

export interface Lesson {
  id: string;
  unit: string;
  title: Bilingual;
  body: Bilingual[];
  examples: { label: Bilingual; sound: Sound }[];
  quiz: QuizItem[];
  /** Where to practise next. */
  practice?: { label: Bilingual; to: string };
}

export interface Unit {
  id: string;
  title: Bilingual;
  color: string;
}

const b = (vi: string, en: string): Bilingual => ({ vi, en });
const prog = (numerals: string, tonic = 60) => chordSequence(realizeProgression(parseProgression(numerals), tonic).map((c) => c.notes), 1.1);

export const UNITS: readonly Unit[] = [
  { id: 'notes', title: b('Nốt nhạc', 'Notes'), color: '#39d0c0' },
  { id: 'scales', title: b('Âm giai', 'Scales'), color: '#a78bfa' },
  { id: 'intervals', title: b('Quãng', 'Intervals'), color: '#39d0c0' },
  { id: 'chords', title: b('Hợp âm', 'Chords'), color: '#f4b740' },
  { id: 'progressions', title: b('Vòng hợp âm', 'Progressions'), color: '#60a5fa' },
  { id: 'rhythm', title: b('Tiết tấu', 'Rhythm'), color: '#fb923c' },
  { id: 'notation', title: b('Ký âm', 'Notation'), color: '#34d399' },
];

export const LESSONS: readonly Lesson[] = [
  // ── Notes ───────────────────────────────────────────────────────────────────────
  {
    id: 'notes-names', unit: 'notes',
    title: b('Bảy tên nốt và quãng tám', 'Seven note names and the octave'),
    body: [
      b('Âm nhạc phương Tây dùng bảy chữ cái C D E F G A B (hay Đô Rê Mi Fa Sol La Si). Sau B lại quay về C, cao hơn một quãng tám.', 'Western music uses seven letters, C D E F G A B (Do Re Mi Fa Sol La Si). After B comes C again, an octave higher.'),
      b('Hai nốt cách nhau một quãng tám nghe "giống nhau" vì tần số nốt trên gấp đôi nốt dưới. Ta ghi thêm số quãng tám: C4 là Đô giữa đàn piano, C5 cao hơn một quãng tám.', 'Notes an octave apart sound "the same" because the upper one vibrates twice as fast. We add an octave number: C4 is middle C, C5 is an octave higher.'),
    ],
    examples: [
      { label: b('Đô Rê Mi Fa Sol La Si Đô', 'C D E F G A B C'), sound: melodic(buildScale(60, getScale('major')), 0.45) },
      { label: b('C4 rồi C5 (quãng tám)', 'C4 then C5 (an octave)'), sound: melodic([60, 72], 0.8) },
    ],
    quiz: [
      { q: b('Nốt nào đứng sau B?', 'Which note comes after B?'), options: [b('A', 'A'), b('C', 'C'), b('H', 'H')], answer: 1 },
      { q: b('C5 so với C4 thì…', 'Compared with C4, C5 is…'), options: [b('thấp hơn một quãng tám', 'an octave lower'), b('cao hơn một quãng tám', 'an octave higher'), b('cùng cao độ', 'the same pitch')], answer: 1 },
    ],
    practice: { label: b('Luyện đọc khóa Sol', 'Practise treble reading'), to: '/play/treble-reading' },
  },
  {
    id: 'notes-semitones', unit: 'notes',
    title: b('Nửa cung, nguyên cung và dấu hóa', 'Semitones, whole tones and accidentals'),
    body: [
      b('Trên piano, hai phím sát nhau (kể cả phím đen) cách nhau một nửa cung. Hai nửa cung là một nguyên cung.', 'On a piano, two neighbouring keys (black keys included) are a semitone apart. Two semitones make a whole tone.'),
      b('Dấu thăng (♯) nâng nốt lên nửa cung, dấu giáng (♭) hạ xuống nửa cung. Vì vậy C♯ và D♭ là cùng một phím đàn — gọi là nốt trùng âm.', 'A sharp (♯) raises a note a semitone, a flat (♭) lowers it. So C♯ and D♭ are the same key — enharmonic notes.'),
      b('Giữa E–F và B–C không có phím đen: đó là hai chỗ chỉ cách nửa cung trong dãy nốt tự nhiên.', 'There is no black key between E–F and B–C: those are the two natural half steps.'),
    ],
    examples: [
      { label: b('Nửa cung: C → C♯', 'Semitone: C → C♯'), sound: melodic([60, 61], 0.7) },
      { label: b('Nguyên cung: C → D', 'Whole tone: C → D'), sound: melodic([60, 62], 0.7) },
      { label: b('Nửa cung tự nhiên: E → F', 'Natural half step: E → F'), sound: melodic([64, 65], 0.7) },
    ],
    quiz: [
      { q: b('Hai nốt nào cách nhau nửa cung?', 'Which pair is a semitone apart?'), options: [b('C – D', 'C – D'), b('E – F', 'E – F'), b('F – G', 'F – G')], answer: 1 },
      { q: b('D♭ là cùng phím với…', 'D♭ is the same key as…'), options: [b('C♯', 'C♯'), b('D♯', 'D♯'), b('E', 'E')], answer: 0 },
    ],
    practice: { label: b('Bài tập cao độ', 'Pitch exercise'), to: '/exercises' },
  },
  {
    id: 'notes-pitch', unit: 'notes',
    title: b('Cao độ tương đối', 'Relative pitch'),
    body: [
      b('Rất ít người nhận ra một nốt khi nghe riêng lẻ (cao độ tuyệt đối). Hầu hết nhạc sĩ dùng cao độ tương đối: nghe khoảng cách giữa các nốt.', 'Few people can name a lone note (perfect pitch). Most musicians use relative pitch: hearing the distance between notes.'),
      b('Tin vui là cao độ tương đối luyện được. Mỗi game trong app đều rèn một phần của nó: quãng, hợp âm, giai điệu.', 'The good news: relative pitch can be trained. Every game in this app works on part of it: intervals, chords, melodies.'),
    ],
    examples: [
      { label: b('Nốt nào cao hơn? (nốt 2)', 'Which is higher? (the second)'), sound: melodic([62, 64], 0.8) },
    ],
    quiz: [
      { q: b('Nghe: nốt thứ hai cao hơn hay thấp hơn?', 'Listen: is the second note higher or lower?'), options: [b('Cao hơn', 'Higher'), b('Thấp hơn', 'Lower')], answer: 1, sound: melodic([67, 62], 0.8) },
    ],
    practice: { label: b('Kiểm tra cao độ tuyệt đối', 'Perfect pitch test'), to: '/tools/perfect-pitch' },
  },
  // ── Scales ──────────────────────────────────────────────────────────────────────
  {
    id: 'scales-major', unit: 'scales',
    title: b('Âm giai trưởng', 'The major scale'),
    body: [
      b('Âm giai trưởng theo công thức nguyên – nguyên – nửa – nguyên – nguyên – nguyên – nửa. Bắt đầu từ C và chỉ dùng phím trắng là có C trưởng.', 'The major scale follows whole – whole – half – whole – whole – whole – half. Start on C using only white keys and you get C major.'),
      b('Bắt đầu từ nốt khác, bạn cần dấu hóa để giữ đúng công thức: G trưởng có F♯, F trưởng có B♭.', 'Starting elsewhere needs accidentals to keep the pattern: G major has F♯, F major has B♭.'),
    ],
    examples: [
      { label: b('C trưởng', 'C major'), sound: melodic(buildScale(60, getScale('major')), 0.4) },
      { label: b('G trưởng', 'G major'), sound: melodic(buildScale(55, getScale('major')), 0.4) },
    ],
    quiz: [
      { q: b('Âm giai trưởng có nửa cung ở giữa bậc…', 'The major scale has half steps between degrees…'), options: [b('3–4 và 7–8', '3–4 and 7–8'), b('2–3 và 5–6', '2–3 and 5–6'), b('1–2 và 4–5', '1–2 and 4–5')], answer: 0 },
      { q: b('G trưởng có dấu hóa nào?', 'Which accidental is in G major?'), options: [b('B♭', 'B♭'), b('F♯', 'F♯'), b('C♯', 'C♯')], answer: 1 },
    ],
    practice: { label: b('Tra âm giai', 'Scale explorer'), to: '/tools/scales' },
  },
  {
    id: 'scales-minor', unit: 'scales',
    title: b('Ba dạng âm giai thứ', 'Three minor scales'),
    body: [
      b('Thứ tự nhiên (nguyên – nửa – nguyên – nguyên – nửa – nguyên – nguyên) nghe buồn và mềm. A thứ tự nhiên dùng toàn phím trắng từ A.', 'Natural minor (whole – half – whole – whole – half – whole – whole) sounds soft and sad. A natural minor is all white keys from A.'),
      b('Thứ hòa âm nâng bậc 7 lên nửa cung để có nốt dẫn mạnh về chủ âm — tạo quãng 2 tăng đặc trưng. Thứ giai điệu nâng cả bậc 6 và 7.', 'Harmonic minor raises the 7th for a strong leading note — creating its typical augmented second. Melodic minor raises both the 6th and 7th.'),
    ],
    examples: [
      { label: b('A thứ tự nhiên', 'A natural minor'), sound: melodic(buildScale(57, getScale('naturalMinor')), 0.4) },
      { label: b('A thứ hòa âm', 'A harmonic minor'), sound: melodic(buildScale(57, getScale('harmonicMinor')), 0.4) },
      { label: b('A thứ giai điệu', 'A melodic minor'), sound: melodic(buildScale(57, getScale('melodicMinor')), 0.4) },
    ],
    quiz: [
      { q: b('Nghe: đây là âm giai nào?', 'Listen: which scale is this?'), options: [b('Thứ tự nhiên', 'Natural minor'), b('Thứ hòa âm', 'Harmonic minor')], answer: 1, sound: melodic(buildScale(57, getScale('harmonicMinor')), 0.35) },
      { q: b('Thứ hòa âm khác thứ tự nhiên ở bậc…', 'Harmonic minor differs from natural minor at degree…'), options: [b('3', '3'), b('6', '6'), b('7', '7')], answer: 2 },
    ],
    practice: { label: b('Game Truy âm giai', 'Scale Hunt game'), to: '/play/scale-id' },
  },
  {
    id: 'scales-modes', unit: 'scales',
    title: b('Điệu thức và ngũ cung', 'Modes and pentatonics'),
    body: [
      b('Chơi phím trắng nhưng bắt đầu từ nốt khác ta được các điệu thức: D Dorian, E Phrygian, F Lydian, G Mixolydian, B Locrian. Mỗi điệu thức có màu riêng.', 'Play the white keys from a different note and you get the modes: D Dorian, E Phrygian, F Lydian, G Mixolydian, B Locrian. Each has its own colour.'),
      b('Ngũ cung chỉ có 5 nốt, bỏ đi hai bậc tạo nửa cung, nên rất dễ nghe và phổ biến trong nhạc dân gian, rock, blues.', 'Pentatonic scales have only five notes, leaving out the half-step degrees, so they sound open and appear everywhere in folk, rock and blues.'),
    ],
    examples: [
      { label: b('D Dorian', 'D Dorian'), sound: melodic(buildScale(62, getScale('dorian')), 0.4) },
      { label: b('F Lydian', 'F Lydian'), sound: melodic(buildScale(65, getScale('lydian')), 0.4) },
      { label: b('C ngũ cung trưởng', 'C major pentatonic'), sound: melodic(buildScale(60, getScale('majorPentatonic')), 0.45) },
    ],
    quiz: [
      { q: b('Âm giai ngũ cung có mấy nốt?', 'How many notes in a pentatonic scale?'), options: [b('5', '5'), b('6', '6'), b('7', '7')], answer: 0 },
      { q: b('Phím trắng bắt đầu từ G là điệu thức…', 'White keys starting on G form…'), options: [b('Dorian', 'Dorian'), b('Mixolydian', 'Mixolydian'), b('Lydian', 'Lydian')], answer: 1 },
    ],
    practice: { label: b('Vòng quãng năm', 'Circle of fifths'), to: '/tools/circle' },
  },
  // ── Intervals ───────────────────────────────────────────────────────────────────
  {
    id: 'intervals-what', unit: 'intervals',
    title: b('Quãng là gì', 'What an interval is'),
    body: [
      b('Quãng là khoảng cách giữa hai nốt. Số của quãng đếm theo tên nốt (C đến E là quãng 3, đếm C-D-E), còn tính chất (trưởng, thứ, đúng…) đo bằng số nửa cung.', 'An interval is the distance between two notes. Its number counts letter names (C to E is a 3rd: C-D-E); its quality (major, minor, perfect…) is set by semitones.'),
      b('Quãng giai điệu: hai nốt lần lượt. Quãng hòa âm: hai nốt cùng lúc. Luyện cả hai vì tai nghe chúng khác nhau.', 'Melodic intervals play one note then the other; harmonic intervals play both together. Train both — the ear hears them differently.'),
    ],
    examples: [
      { label: b('C–E giai điệu', 'C–E melodic'), sound: melodic([60, 64], 0.7) },
      { label: b('C–E hòa âm', 'C–E harmonic'), sound: harmonic([60, 64], 1.6) },
    ],
    quiz: [
      { q: b('C đến G là quãng mấy?', 'C up to G is a…'), options: [b('Quãng 4', '4th'), b('Quãng 5', '5th'), b('Quãng 6', '6th')], answer: 1 },
    ],
    practice: { label: b('Game Quãng đi lên', 'Rising Intervals game'), to: '/play/ascending-intervals' },
  },
  {
    id: 'intervals-qualities', unit: 'intervals',
    title: b('Trưởng, thứ, đúng, tăng, giảm', 'Major, minor, perfect, augmented, diminished'),
    body: [
      b('Quãng 1, 4, 5, 8 gọi là "đúng". Quãng 2, 3, 6, 7 có dạng trưởng (rộng hơn) và thứ (hẹp hơn nửa cung).', 'Unisons, 4ths, 5ths and octaves are "perfect". 2nds, 3rds, 6ths and 7ths come in major (wider) and minor (a semitone narrower).'),
      b('Quãng 4 tăng và quãng 5 giảm cùng bằng 6 nửa cung — gọi là tritone, âm thanh căng và muốn giải quyết.', 'The augmented 4th and diminished 5th both span 6 semitones — the tritone, tense and restless.'),
    ],
    examples: [
      { label: b('Quãng 3 trưởng (4 nửa cung)', 'Major 3rd (4 semitones)'), sound: melodic([60, 64], 0.7) },
      { label: b('Quãng 3 thứ (3 nửa cung)', 'Minor 3rd (3 semitones)'), sound: melodic([60, 63], 0.7) },
      { label: b('Tritone (6 nửa cung)', 'Tritone (6 semitones)'), sound: melodic([60, 66], 0.7) },
    ],
    quiz: [
      { q: b('Quãng 6 thứ có bao nhiêu nửa cung?', 'How many semitones in a minor 6th?'), options: [b('7', '7'), b('8', '8'), b('9', '9')], answer: 1 },
      { q: b('Nghe: trưởng hay thứ?', 'Listen: major or minor?'), options: [b('Quãng 3 trưởng', 'Major 3rd'), b('Quãng 3 thứ', 'Minor 3rd')], answer: 1, sound: harmonic([62, 65], 1.6) },
    ],
    practice: { label: b('Ghi nhớ quãng', 'Interval memorizer'), to: '/tools/interval-memorizer' },
  },
  {
    id: 'intervals-songs', unit: 'intervals',
    title: b('Mẹo nhớ quãng', 'Remembering intervals'),
    body: [
      b('Cách nhanh nhất để nhớ một quãng là gắn nó với hai nốt đầu của một bài hát bạn thuộc lòng. Mỗi người có danh sách riêng — dùng công cụ Ghi nhớ quãng để ghi lại.', 'The quickest way to remember an interval is to tie it to the first two notes of a song you know by heart. Everyone has their own list — keep yours in the Interval memorizer.'),
      b('Một mẹo khác: quãng 5 đúng nghe "rỗng" và vững, quãng 3 trưởng sáng, quãng 3 thứ tối, quãng 7 trưởng gần chạm tới quãng tám.', 'Another trick: a perfect 5th sounds open and stable, a major 3rd bright, a minor 3rd dark, a major 7th almost reaches the octave.'),
    ],
    examples: [
      { label: b('Quãng 5 đúng — rỗng, vững', 'Perfect 5th — open'), sound: harmonic([55, 62], 1.6) },
      { label: b('Quãng 7 trưởng — sát quãng tám', 'Major 7th — nearly an octave'), sound: melodic([60, 71, 72], 0.6) },
    ],
    quiz: [
      { q: b('Nghe: quãng 5 đúng hay quãng 4 đúng?', 'Listen: perfect 5th or perfect 4th?'), options: [b('Quãng 4 đúng', 'Perfect 4th'), b('Quãng 5 đúng', 'Perfect 5th')], answer: 1, sound: melodic([57, 64], 0.7) },
    ],
    practice: { label: b('Bài tập quãng', 'Interval exercises'), to: '/exercises' },
  },
  // ── Chords ──────────────────────────────────────────────────────────────────────
  {
    id: 'chords-triads', unit: 'chords',
    title: b('Hợp âm ba nốt', 'Triads'),
    body: [
      b('Hợp âm ba nốt xếp hai quãng 3 chồng lên nhau. Trưởng = 3 trưởng + 3 thứ; thứ = 3 thứ + 3 trưởng; giảm = hai quãng 3 thứ; tăng = hai quãng 3 trưởng.', 'A triad stacks two thirds. Major = major 3rd + minor 3rd; minor = minor 3rd + major 3rd; diminished = two minor 3rds; augmented = two major 3rds.'),
      b('Nghe tổng thể: trưởng sáng, thứ buồn, giảm căng và co lại, tăng lơ lửng như đang hỏi.', 'By ear: major is bright, minor sad, diminished tight and tense, augmented floating like a question.'),
    ],
    examples: ['maj', 'min', 'dim', 'aug'].map((id) => ({
      label: b(`C ${getChord(id).name.vi.toLowerCase()}`, `C ${getChord(id).name.en.toLowerCase()}`),
      sound: harmonic(buildChord(60, getChord(id)), 1.6),
    })),
    quiz: [
      { q: b('Nghe: hợp âm gì?', 'Listen: which triad?'), options: [b('Trưởng', 'Major'), b('Thứ', 'Minor'), b('Giảm', 'Diminished')], answer: 2, sound: harmonic(buildChord(59, getChord('dim')), 1.6) },
      { q: b('Hợp âm tăng gồm…', 'An augmented triad is…'), options: [b('hai quãng 3 thứ', 'two minor 3rds'), b('hai quãng 3 trưởng', 'two major 3rds')], answer: 1 },
    ],
    practice: { label: b('Game Nhận hợp âm', 'Chord Finder game'), to: '/play/chord-id' },
  },
  {
    id: 'chords-sevenths', unit: 'chords',
    title: b('Hợp âm bảy', 'Seventh chords'),
    body: [
      b('Thêm một quãng 3 nữa lên trên hợp âm ba nốt ta có hợp âm bảy. Ba loại quen thuộc nhất: bảy trưởng (Cmaj7, êm), bảy át (C7, muốn đi tiếp), bảy thứ (Cm7, mềm).', 'Add one more third on top of a triad to get a seventh chord. The three most common: major 7th (Cmaj7, smooth), dominant 7th (C7, wants to move), minor 7th (Cm7, mellow).'),
      b('Bảy nửa giảm (m7♭5) và bảy giảm (°7) xuất hiện nhiều trong nhạc jazz và cổ điển.', 'Half-diminished (m7♭5) and diminished 7th (°7) chords are frequent in jazz and classical music.'),
    ],
    examples: ['maj7', 'dom7', 'min7', 'm7b5'].map((id) => ({
      label: b(`C${getChord(id).symbol}`, `C${getChord(id).symbol}`),
      sound: harmonic(buildChord(60, getChord(id)), 1.8),
    })),
    quiz: [
      { q: b('Hợp âm nào "muốn đi tiếp" nhất?', 'Which one most wants to resolve?'), options: [b('Cmaj7', 'Cmaj7'), b('C7', 'C7'), b('Cm7', 'Cm7')], answer: 1 },
      { q: b('Nghe: bảy trưởng hay bảy át?', 'Listen: major 7th or dominant 7th?'), options: [b('Bảy trưởng', 'Major 7th'), b('Bảy át', 'Dominant 7th')], answer: 0, sound: harmonic(buildChord(62, getChord('maj7')), 1.8) },
    ],
    practice: { label: b('Chơi hợp âm', 'Chord player'), to: '/tools/chords' },
  },
  {
    id: 'chords-inversions', unit: 'chords',
    title: b('Thế đảo', 'Inversions'),
    body: [
      b('Thế đảo đổi nốt nằm dưới cùng (nốt bass). Thế gốc: nốt gốc ở bass. Đảo 1: quãng 3 ở bass. Đảo 2: quãng 5 ở bass. Hợp âm bảy có thêm đảo 3.', 'An inversion changes which note is in the bass. Root position: root in the bass. 1st inversion: the 3rd. 2nd inversion: the 5th. Seventh chords also have a 3rd inversion.'),
      b('Mẹo: tập trung vào nốt thấp nhất. Nếu bạn hát được nốt bass rồi so với nốt gốc, bạn sẽ đoán đúng thế đảo.', 'Tip: focus on the lowest note. If you can sing the bass and compare it with the root, you will name the inversion.'),
    ],
    examples: [0, 1, 2].map((inv) => ({
      label: b(inv === 0 ? 'C thế gốc' : `C đảo ${inv}`, inv === 0 ? 'C root position' : `C inversion ${inv}`),
      sound: harmonic(buildChord(60, getChord('maj'), { inversion: inv }), 1.6),
    })),
    quiz: [
      { q: b('C–E–G với E ở dưới cùng là…', 'C–E–G with E at the bottom is…'), options: [b('Thế gốc', 'Root position'), b('Đảo 1', '1st inversion'), b('Đảo 2', '2nd inversion')], answer: 1 },
    ],
    practice: { label: b('Game Thế đảo', 'Inversions game'), to: '/play/inversions' },
  },
  // ── Progressions ────────────────────────────────────────────────────────────────
  {
    id: 'prog-numerals', unit: 'progressions',
    title: b('Ký hiệu La Mã', 'Roman numerals'),
    body: [
      b('Mỗi bậc của âm giai có một hợp âm. Ta gọi tên bằng số La Mã: chữ hoa là hợp âm trưởng (I, IV, V), chữ thường là thứ (ii, iii, vi), có ° là giảm (vii°).', 'Each scale degree has its own chord, named with Roman numerals: upper case for major (I, IV, V), lower case for minor (ii, iii, vi), ° for diminished (vii°).'),
      b('Nhờ số La Mã, một vòng như I–V–vi–IV dùng được ở mọi giọng: ở C là C–G–Am–F, ở G là G–D–Em–C.', 'Thanks to numerals, a progression like I–V–vi–IV works in any key: in C it is C–G–Am–F, in G it is G–D–Em–C.'),
    ],
    examples: [
      { label: b('I – IV – V – I ở C', 'I – IV – V – I in C'), sound: prog('I-IV-V-I') },
      { label: b('I – V – vi – IV ở G', 'I – V – vi – IV in G'), sound: prog('I-V-vi-IV', 55) },
    ],
    quiz: [
      { q: b('Ở giọng C trưởng, vi là hợp âm…', 'In C major, vi is…'), options: [b('Am', 'Am'), b('A', 'A'), b('Em', 'Em')], answer: 0 },
      { q: b('Chữ thường trong số La Mã nghĩa là…', 'Lower-case numerals mean…'), options: [b('hợp âm trưởng', 'major chords'), b('hợp âm thứ', 'minor chords')], answer: 1 },
    ],
    practice: { label: b('Tạo vòng hợp âm', 'Progression generator'), to: '/tools/progressions' },
  },
  {
    id: 'prog-cadences', unit: 'progressions',
    title: b('Kết câu', 'Cadences'),
    body: [
      b('Kết câu là cách một câu nhạc khép lại. Kết hoàn toàn V–I nghe như dấu chấm. Kết plagal IV–I mềm hơn. Kết lửng (dừng ở V) như dấu phẩy, chờ tiếp.', 'A cadence is how a phrase closes. The authentic cadence V–I feels like a full stop. The plagal IV–I is gentler. A half cadence (ending on V) is like a comma.'),
      b('Kết lừa V–vi đánh lừa tai: tưởng về I nhưng lại sang hợp âm thứ.', 'The deceptive cadence V–vi fools the ear: it seems headed home to I but lands on a minor chord.'),
    ],
    examples: [
      { label: b('Kết hoàn toàn V–I', 'Authentic V–I'), sound: prog('IV-V-I') },
      { label: b('Kết plagal IV–I', 'Plagal IV–I'), sound: prog('I-IV-I') },
      { label: b('Kết lừa V–vi', 'Deceptive V–vi'), sound: prog('IV-V-vi') },
    ],
    quiz: [
      { q: b('Nghe: vòng kết ở đâu?', 'Listen: where does it end?'), options: [b('Về I', 'On I'), b('Sang vi', 'On vi')], answer: 1, sound: prog('I-IV-V-vi') },
    ],
    practice: { label: b('Game Vòng hợp âm', 'Progression Road game'), to: '/play/progressions' },
  },
  {
    id: 'prog-bass', unit: 'progressions',
    title: b('Nghe theo nốt bass', 'Following the bass'),
    body: [
      b('Khi khó nhận ra vòng hợp âm, hãy chỉ nghe nốt bass. Bass thường đi theo nốt gốc của hợp âm, nên hát được đường bass là gần như đọc được vòng.', 'When a progression is hard to name, listen only to the bass. It usually follows the chord roots, so singing the bass line almost spells the progression.'),
      b('Trong game Vòng hợp âm, phao cứu sinh phát riêng đường bass cho bạn.', 'In Progression Road, the life-ring plays the bass line alone for you.'),
    ],
    examples: [
      { label: b('Vòng I–vi–IV–V', 'Progression I–vi–IV–V'), sound: prog('I-vi-IV-V') },
      { label: b('Chỉ nốt bass', 'Bass only'), sound: melodic(realizeProgression(parseProgression('I-vi-IV-V'), 60).map((c) => c.bass), 1.1) },
    ],
    quiz: [
      { q: b('Đường bass C–A–F–G ứng với…', 'A bass line C–A–F–G fits…'), options: [b('I–vi–IV–V', 'I–vi–IV–V'), b('I–IV–V–I', 'I–IV–V–I')], answer: 0 },
    ],
  },
  // ── Rhythm ──────────────────────────────────────────────────────────────────────
  {
    id: 'rhythm-beat', unit: 'rhythm',
    title: b('Phách và nhịp', 'Beat and meter'),
    body: [
      b('Phách là nhịp đập đều đặn của bản nhạc — cái bạn vô thức gõ chân theo. Nhịp chia phách thành nhóm: 4/4 là nhóm bốn, 3/4 là nhóm ba (như điệu valse).', 'The beat is the steady pulse you tap your foot to. Meter groups beats: 4/4 in fours, 3/4 in threes (like a waltz).'),
      b('Phách đầu mỗi ô nhịp thường mạnh nhất. Metronome của app nhấn phách đầu bằng tiếng cao hơn.', 'The first beat of each bar is usually the strongest. The app’s metronome accents it with a higher click.'),
    ],
    examples: [
      { label: b('Nhịp 4/4', '4/4 meter'), sound: { steps: Array.from({ length: 8 }, (_, i) => ({ notes: [i % 4 === 0 ? 96 : 84], at: i * 0.5, duration: 0.05, instrument: 'click' as const })) } },
      { label: b('Nhịp 3/4', '3/4 meter'), sound: { steps: Array.from({ length: 6 }, (_, i) => ({ notes: [i % 3 === 0 ? 96 : 84], at: i * 0.5, duration: 0.05, instrument: 'click' as const })) } },
    ],
    quiz: [
      { q: b('Nhịp 3/4 có mấy phách mỗi ô?', 'How many beats per bar in 3/4?'), options: [b('2', '2'), b('3', '3'), b('4', '4')], answer: 1 },
    ],
    practice: { label: b('Metronome', 'Metronome'), to: '/tools/metronome' },
  },
  {
    id: 'rhythm-values', unit: 'rhythm',
    title: b('Trường độ nốt', 'Note values'),
    body: [
      b('Nốt tròn = 4 phách, nốt trắng = 2, nốt đen = 1, móc đơn = ½, móc kép = ¼ (ở nhịp có nốt đen là một phách).', 'Whole note = 4 beats, half = 2, quarter = 1, eighth = ½, sixteenth = ¼ (when the quarter note gets the beat).'),
      b('Dấu chấm dôi cộng thêm một nửa giá trị: nốt đen chấm dôi = 1½ phách. Dấu lặng là khoảng im lặng có cùng các trường độ đó.', 'A dot adds half the value again: a dotted quarter = 1½ beats. Rests are silences with the same values.'),
    ],
    examples: [
      {
        label: b('Đen – đen – móc đơn ×2 – đen', 'Quarter, quarter, two eighths, quarter'),
        sound: { steps: [0, 0.5, 1, 1.25, 1.5].map((at) => ({ notes: [72], at, duration: 0.2 })) },
      },
    ],
    quiz: [
      { q: b('Nốt trắng chấm dôi dài mấy phách?', 'How long is a dotted half note?'), options: [b('2', '2'), b('3', '3'), b('4', '4')], answer: 1 },
      { q: b('Hai móc đơn bằng…', 'Two eighths equal…'), options: [b('một nốt đen', 'one quarter'), b('một nốt trắng', 'one half')], answer: 0 },
    ],
    practice: { label: b('Game Đọc tiết tấu', 'Rhythm Reading game'), to: '/play/rhythm-read' },
  },
  {
    id: 'rhythm-sync', unit: 'rhythm',
    title: b('Nghịch phách', 'Syncopation'),
    body: [
      b('Nghịch phách đặt điểm nhấn vào chỗ yếu — giữa hai phách hoặc ngay phách nhẹ — làm nhịp điệu "nhún nhảy". Ví dụ quen thuộc: móc đơn – đen – móc đơn.', 'Syncopation puts the accent on weak spots — between beats or on light beats — making the rhythm bounce. A classic figure: eighth – quarter – eighth.'),
      b('Khi gõ nghịch phách, hãy đếm "1 và 2 và" thành tiếng để không trôi nhịp.', 'When tapping syncopations, count "1 and 2 and" aloud so you don’t drift.'),
    ],
    examples: [
      { label: b('Móc đơn – đen – móc đơn', 'Eighth – quarter – eighth'), sound: { steps: [0, 0.25, 0.75].map((t) => ({ notes: [72], at: t * 2, duration: 0.2 })) } },
    ],
    quiz: [
      { q: b('Nghịch phách nhấn vào…', 'Syncopation accents…'), options: [b('phách mạnh', 'strong beats'), b('chỗ yếu, giữa các phách', 'weak spots between beats')], answer: 1 },
    ],
    practice: { label: b('Game Nhại tiết tấu', 'Rhythm Echo game'), to: '/play/rhythm-echo' },
  },
  // ── Notation ────────────────────────────────────────────────────────────────────
  {
    id: 'notation-clefs', unit: 'notation',
    title: b('Khuông nhạc và khóa', 'Staff and clefs'),
    body: [
      b('Khuông nhạc có 5 dòng kẻ. Khóa ở đầu khuông cho biết dòng nào là nốt nào: khóa Sol đặt G4 ở dòng 2, khóa Fa đặt F3 ở dòng 4, khóa Đô (alto) đặt C4 ở dòng giữa.', 'The staff has five lines. The clef tells which line is which note: the treble clef puts G4 on line 2, the bass clef F3 on line 4, the alto clef C4 on the middle line.'),
      b('Nốt cao hoặc thấp quá khuông được viết trên dòng kẻ phụ.', 'Notes above or below the staff sit on short ledger lines.'),
    ],
    examples: [
      { label: b('G4 (khóa Sol)', 'G4 (treble clef)'), sound: melodic([67], 1) },
      { label: b('F3 (khóa Fa)', 'F3 (bass clef)'), sound: melodic([53], 1) },
    ],
    quiz: [
      { q: b('Khóa Sol đặt nốt G4 ở dòng…', 'The treble clef puts G4 on line…'), options: [b('1', '1'), b('2', '2'), b('3', '3')], answer: 1 },
    ],
    practice: { label: b('Playground đọc nốt', 'Sight-reading playground'), to: '/playground/sight-reading' },
  },
  {
    id: 'notation-keys', unit: 'notation',
    title: b('Hóa biểu', 'Key signatures'),
    body: [
      b('Hóa biểu là nhóm dấu thăng hoặc giáng ở đầu khuông, áp dụng cho cả bản nhạc. Một dấu thăng (F♯) là G trưởng hoặc E thứ; một dấu giáng (B♭) là F trưởng hoặc D thứ.', 'A key signature is the group of sharps or flats at the start of the staff, applied to the whole piece. One sharp (F♯) means G major or E minor; one flat (B♭) means F major or D minor.'),
      b('Vòng quãng năm sắp xếp các giọng theo số dấu hóa: mỗi bước theo chiều kim đồng hồ thêm một dấu thăng.', 'The circle of fifths orders keys by their accidentals: each step clockwise adds a sharp.'),
    ],
    examples: [
      { label: b('G trưởng', 'G major'), sound: melodic(buildScale(55, getScale('major')), 0.35) },
      { label: b('F trưởng', 'F major'), sound: melodic(buildScale(53, getScale('major')), 0.35) },
    ],
    quiz: [
      { q: b('Hai dấu thăng (F♯, C♯) là giọng…', 'Two sharps (F♯, C♯) means…'), options: [b('D trưởng', 'D major'), b('A trưởng', 'A major'), b('B♭ trưởng', 'B♭ major')], answer: 0 },
    ],
    practice: { label: b('Vòng quãng năm', 'Circle of fifths'), to: '/tools/circle' },
  },
  {
    id: 'notation-reading', unit: 'notation',
    title: b('Đọc nhanh hơn', 'Reading faster'),
    body: [
      b('Đừng đếm từng dòng kẻ. Hãy học thuộc vài nốt mốc (G4 khóa Sol, F3 khóa Fa, C4 Đô giữa) rồi đọc các nốt khác theo khoảng cách so với mốc.', 'Don’t count lines. Memorise a few landmark notes (G4 in treble, F3 in bass, middle C) and read the rest by distance from them.'),
      b('Nhìn hình dạng: hai nốt cùng ở dòng (hoặc cùng ở khe) là quãng 3, 5 hoặc 7; một dòng một khe là quãng 2, 4 hoặc 6.', 'Read shapes: two notes both on lines (or both in spaces) form a 3rd, 5th or 7th; line-to-space is a 2nd, 4th or 6th.'),
    ],
    examples: [
      { label: b('Đô giữa (C4)', 'Middle C (C4)'), sound: melodic([60], 1) },
    ],
    quiz: [
      { q: b('Hai nốt đều nằm trên dòng kẻ liền nhau tạo quãng…', 'Two notes on neighbouring lines make a…'), options: [b('2', '2nd'), b('3', '3rd'), b('4', '4th')], answer: 1 },
    ],
    practice: { label: b('Game Đọc khóa Fa', 'Bass Reader game'), to: '/play/bass-reading' },
  },
];

export const POINTS_PER_LESSON = 100;
