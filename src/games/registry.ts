import { chordByNameQuestion, chordIdQuestion, inversionQuestion } from './defs/chords';
import { compareQuestion, intervalQuestion } from './defs/intervals';
import { progressionQuestion, scaleQuestion } from './defs/scalesProgressions';
import { readingQuestion } from './defs/reading';
import { sightSingQuestion, singBackQuestion, singIntervalQuestion } from './defs/singing';
import { melodyCopyQuestion, melodyHuntQuestion, rhythmEchoQuestion, rhythmReadQuestion } from './defs/melodyRhythm';
import type { GameDef } from './types';

/**
 * All 18 games. Each is an original take on a common ear-training drill; names and art are ours.
 * Games whose phase has not shipped yet have no `makeQuestion` and show as "coming soon".
 */
export const GAMES: GameDef[] = [
  {
    id: 'harmonic-intervals', skill: 'intervals', phase: 2, art: { variant: 0, mark: 'both' },
    name: { vi: 'Quãng hòa âm', en: 'Harmonic Intervals' },
    desc: { vi: 'Hai nốt vang cùng lúc. Chọn đúng quãng giữa chúng.', en: 'Two notes sound together. Name the interval.' },
    makeQuestion: intervalQuestion('harmonic'),
  },
  {
    id: 'ascending-intervals', skill: 'intervals', phase: 2, art: { variant: 1, mark: 'up' },
    name: { vi: 'Quãng đi lên', en: 'Rising Intervals' },
    desc: { vi: 'Hai nốt đi lên lần lượt. Đo khoảng cách và chọn quãng.', en: 'Two notes going up. Name the distance.' },
    makeQuestion: intervalQuestion('ascending'),
  },
  {
    id: 'descending-intervals', skill: 'intervals', phase: 2, art: { variant: 2, mark: 'down' },
    name: { vi: 'Quãng đi xuống', en: 'Falling Intervals' },
    desc: { vi: 'Hai nốt đi xuống lần lượt. Đo khoảng cách và chọn quãng.', en: 'Two notes going down. Name the distance.' },
    makeQuestion: intervalQuestion('descending'),
  },
  {
    id: 'interval-compare', skill: 'intervals', phase: 2, art: { variant: 3, mark: 'three' },
    name: { vi: 'So quãng', en: 'Interval Compare' },
    desc: { vi: 'Nghe ba quãng và chọn quãng rộng nhất.', en: 'Hear three intervals, pick the widest.' },
    makeQuestion: compareQuestion,
  },
  {
    id: 'chord-id', skill: 'chords', phase: 2, art: { variant: 0, mark: 'up' },
    name: { vi: 'Nhận hợp âm', en: 'Chord Finder' },
    desc: { vi: 'Nhiều nốt vang cùng lúc. Gọi tên loại hợp âm.', en: 'Several notes at once. Name the chord.' },
    makeQuestion: chordIdQuestion,
  },
  {
    id: 'chord-by-name', skill: 'chords', phase: 2, art: { variant: 1, mark: 'up' },
    name: { vi: 'Tên ra tiếng', en: 'Name to Sound' },
    desc: { vi: 'Cho sẵn tên hợp âm. Nghe các phương án và chọn tiếng khớp.', en: 'A chord name is shown. Find the sound that matches.' },
    makeQuestion: chordByNameQuestion,
  },
  {
    id: 'inversions', skill: 'chords', phase: 2, art: { variant: 2, mark: 'up' },
    name: { vi: 'Thế đảo', en: 'Inversions' },
    desc: { vi: 'Nghe một hợp âm và nhận ra nó đang ở thế đảo nào.', en: 'Hear a chord and tell its inversion.' },
    makeQuestion: inversionQuestion,
  },
  {
    id: 'scale-id', skill: 'scales', phase: 2, art: { variant: 3, mark: 'up' },
    name: { vi: 'Truy âm giai', en: 'Scale Hunt' },
    desc: { vi: 'Một chuỗi nốt vang lên. Đoán âm giai trước khi hết giờ.', en: 'A run of notes plays. Name the scale before time runs out.' },
    makeQuestion: scaleQuestion,
  },
  {
    id: 'progressions', skill: 'progressions', phase: 2, art: { variant: 0, mark: 'up' },
    name: { vi: 'Vòng hợp âm', en: 'Progression Road' },
    desc: { vi: 'Nghe vòng hợp âm, chọn ký hiệu La Mã. Phao gợi ý phát nốt bass.', en: 'Hear a progression, pick its Roman numerals. The life-ring plays the bass.' },
    makeQuestion: progressionQuestion,
  },
  {
    id: 'melody-hunt', skill: 'melody', phase: 3, art: { variant: 1, mark: 'up' },
    name: { vi: 'Săn giai điệu', en: 'Melody Hunt' },
    desc: { vi: 'Nghe giai điệu ngắn rồi dựng lại bằng các nốt cho sẵn.', en: 'Hear a short melody, rebuild it from the given notes.' },
    makeQuestion: melodyHuntQuestion,
  },
  {
    id: 'melody-copy', skill: 'melody', phase: 3, art: { variant: 2, mark: 'up' },
    name: { vi: 'Chép giai điệu', en: 'Melody Copy' },
    desc: { vi: 'Nhớ giai điệu và chọn đúng từng cao độ theo thứ tự.', en: 'Memorise a melody and pick each pitch in order.' },
    makeQuestion: melodyCopyQuestion,
  },
  {
    id: 'rhythm-echo', skill: 'rhythm', phase: 3, art: { variant: 1, mark: 'up' },
    name: { vi: 'Nhại tiết tấu', en: 'Rhythm Echo' },
    desc: { vi: 'Nghe tiết tấu rồi gõ lại bằng phím cách hoặc chạm màn hình.', en: 'Hear a rhythm, tap it back with Space or touch.' },
    makeQuestion: rhythmEchoQuestion,
  },
  {
    id: 'rhythm-read', skill: 'rhythm', phase: 3, art: { variant: 3, mark: 'up' },
    name: { vi: 'Đọc tiết tấu', en: 'Rhythm Reading' },
    desc: { vi: 'Nhìn ký hiệu tiết tấu và gõ đúng nhịp sau phần đếm vào.', en: 'Read a rhythm and tap it in time after the count-in.' },
    makeQuestion: rhythmReadQuestion,
  },
  {
    id: 'treble-reading', skill: 'reading', phase: 4, art: { variant: 0, mark: 'up' },
    name: { vi: 'Đọc khóa Sol', en: 'Treble Reader' },
    desc: { vi: 'Đọc nốt, quãng, hợp âm trên khóa Sol càng nhanh càng tốt.', en: 'Read notes, intervals and chords on the treble clef, fast.' },
    makeQuestion: readingQuestion('treble'),
  },
  {
    id: 'bass-reading', skill: 'reading', phase: 4, art: { variant: 2, mark: 'down' },
    name: { vi: 'Đọc khóa Fa', en: 'Bass Reader' },
    desc: { vi: 'Luyện đọc khóa Fa: nhanh, chính xác, tự tin.', en: 'Bass clef reading: speed, accuracy, confidence.' },
    makeQuestion: readingQuestion('bass'),
  },
  {
    id: 'sing-back', skill: 'singing', phase: 5, art: { variant: 3, mark: 'up' },
    name: { vi: 'Hát lại', en: 'Sing Back' },
    desc: { vi: 'Nghe giai điệu rồi hát lại vào micro.', en: 'Hear a melody, sing it back into the microphone.' },
    makeQuestion: singBackQuestion,
  },
  {
    id: 'sight-sing', skill: 'singing', phase: 5, art: { variant: 0, mark: 'up' },
    name: { vi: 'Xướng âm', en: 'Sight Singing' },
    desc: { vi: 'Nhìn bản nhạc và hát đúng cao độ vào micro.', en: 'Read the notation and sing it in tune.' },
    makeQuestion: sightSingQuestion,
  },
  {
    id: 'sing-interval', skill: 'singing', phase: 5, art: { variant: 2, mark: 'up' },
    name: { vi: 'Hát quãng', en: 'Sing the Interval' },
    desc: { vi: 'Cho nốt đầu và tên quãng. Hát ra nốt thứ hai.', en: 'Given a note and an interval name, sing the second note.' },
    makeQuestion: singIntervalQuestion,
  },
];

export const GAME_BY_ID = new Map(GAMES.map((g) => [g.id, g]));

export function getGame(id: string): GameDef | undefined {
  return GAME_BY_ID.get(id);
}

export function playableGames(): GameDef[] {
  return GAMES.filter((g) => g.makeQuestion);
}
