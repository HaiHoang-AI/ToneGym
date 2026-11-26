import type { Bilingual } from '../theory';

export interface Section {
  key: string;
  path: string;
  name: Bilingual;
  /** Build phase that delivers this section. */
  phase: number;
  ready: boolean;
  description: Bilingual;
}

export const SECTIONS: readonly Section[] = [
  {
    key: 'gym', path: '/', phase: 2, ready: true,
    name: { vi: 'Gym', en: 'Gym' },
    description: { vi: 'Workout hằng ngày', en: 'Daily workout' },
  },
  {
    key: 'games', path: '/games', phase: 2, ready: true,
    name: { vi: 'Game', en: 'Games' },
    description: { vi: '18 game có level', en: '18 levelled games' },
  },
  {
    key: 'exercises', path: '/exercises', phase: 2, ready: true,
    name: { vi: 'Bài tập', en: 'Exercises' },
    description: { vi: 'Luyện tự do không giới hạn', en: 'Unlimited free practice' },
  },
  {
    key: 'stats', path: '/stats', phase: 2, ready: true,
    name: { vi: 'Thống kê', en: 'Stats' },
    description: { vi: 'Ear Index, hạng, điểm mạnh/yếu', en: 'Ear Index, ranks, strengths' },
  },
  {
    key: 'tools', path: '/tools', phase: 6, ready: false,
    name: { vi: 'Công cụ', en: 'Tools' },
    description: {
      vi: 'Tạo vòng hợp âm, vòng quãng năm, tra âm giai, chơi hợp âm, ghi nhớ quãng, piano ghi âm, máy lên dây, đo tầm giọng…',
      en: 'Progression generator, circle of fifths, scale explorer, chord player, interval memorizer, piano recorder, tuner, vocal range…',
    },
  },
  {
    key: 'learn', path: '/learn', phase: 7, ready: false,
    name: { vi: 'Học', en: 'Learn' },
    description: {
      vi: 'Khóa nhạc lý 7 chương do thầy nhạc dẫn, có ví dụ nghe và câu hỏi.',
      en: 'A seven-unit theory course led by the music teacher, with listening examples and quizzes.',
    },
  },
];
