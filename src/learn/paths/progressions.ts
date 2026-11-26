import type { Bilingual } from '../../theory';
import type { LessonDef, PathDef, Register, Slide, TrapSpec } from '../types';

const b = (vi: string, en: string): Bilingual => ({ vi, en });

const BLUES = 'I7-I7-I7-I7-IV7-IV7-I7-I7-V7-IV7-I7-V7';
const BLUES_QUICK = 'I7-IV7-I7-I7-IV7-IV7-I7-I7-V7-IV7-I7-V7';
const BLUES_SLOW_END = 'I7-I7-I7-I7-IV7-IV7-I7-I7-V7-V7-I7-I7';
const CANON = 'I-V-vi-iii-IV-I-IV-V';

const POP = ['I-V-vi-IV', 'I-vi-IV-V', 'vi-IV-I-V'];
const CORE = ['I-IV-I', 'I-V-I', 'I-IV-V-I', 'I-V-IV-I', 'I-IV-I-V'];
const MINOR = ['i-iv-v-i', 'i-iv-V-i', 'i-bVI-bVII-i', 'i-bVII-bVI-V'];
const COLOUR = ['I-bVII-IV-I', 'ii7-V7-Imaj7', 'I-V-IV-I', BLUES];

const pair = (a: string, c: string, register?: Register): TrapSpec => ({ kind: 'pair', a, b: c, register });

/** Chords of C major for slide demos. */
const CH: Record<string, number[]> = {
  I: [48, 52, 55], ii: [50, 53, 57], iii: [52, 55, 59], IV: [53, 57, 60], V: [55, 59, 62], vi: [45, 48, 52],
  i: [48, 51, 55], iv: [53, 56, 60], v: [55, 58, 62], bVI: [44, 48, 51], bVII: [46, 50, 53],
};
/** A demo that plays the named chords one after another. */
const seq = (vi: string, en: string, ...names: string[]) => ({ label: b(vi, en), notes: [], chords: names.map((n) => CH[n]!) });

interface LessonInput {
  id: string;
  title: Bilingual;
  desc: Bilingual;
  newItems?: string[];
  slides: Slide[];
  anchors?: string[];
  pool: string[];
  register?: Register;
  traps?: TrapSpec[];
  mode?: 'name' | 'yesno';
  yesItem?: string;
  decoys?: string[];
}

const lesson = (x: LessonInput): LessonDef => ({ kind: 'lesson', newItems: [], anchors: [], register: 'key', traps: [], questionCount: 20, ...x });
/** Progressions take longer to play, so exams allow 15 s per question. */
const checkpoint = (id: string, title: Bilingual, desc: Bilingual, pool: string[], register: Register = 'key'): LessonDef => ({
  id, kind: 'checkpoint', title, desc, newItems: [], slides: [], anchors: [], pool, register, traps: [], questionCount: 30, timeLimitMs: 15000,
});

const LESSONS: LessonDef[] = [
  {
    id: 'pr-intro',
    kind: 'intro',
    title: b('Làm quen với vòng hợp âm', 'Getting started with progressions'),
    desc: b('Bậc La Mã và chủ âm', 'Roman numerals and the tonic'),
    newItems: [],
    slides: [
      { title: b('Chủ âm là "nhà"', 'The tonic is home'), body: b('Trong một giọng, hợp âm dựng trên chủ âm (bậc I) là "nhà": nghe vững, kết thúc được. Các hợp âm khác đưa ta đi xa rồi quay về.', 'In a key, the chord on the tonic (I) is home: steady, it can end a piece. The others take us away and back.'), keys: CH.I!, examples: [{ label: b('Bậc I (Đô trưởng)', 'I (C major)'), notes: CH.I!, together: true }] },
      { title: b('Bậc La Mã', 'Roman numerals'), body: b('Mỗi hợp âm được gọi theo bậc của nốt gốc: I, ii, iii, IV, V, vi. Chữ hoa là hợp âm trưởng, chữ thường là hợp âm thứ. Nhờ vậy cùng một vòng có thể chơi ở mọi giọng.', 'Each chord is named by the degree of its root: I, ii, iii, IV, V, vi. Upper case = major, lower case = minor. That way the same progression works in any key.'), examples: [seq('I – IV – V – I', 'I – IV – V – I', 'I', 'IV', 'V', 'I')] },
      { title: b('Cách luyện', 'How to practise'), body: b('Mỗi câu phát cả vòng, bắt đầu từ chủ âm. Hãy theo dõi đường bass: nó đi lên hay xuống, xa hay gần nhà?', 'Each question plays the whole progression, starting on the tonic. Follow the bass line: up or down, near home or far?') },
    ],
    anchors: [],
    pool: ['I-V-I', 'I-IV-I'],
    register: 'key',
    traps: [],
    questionCount: 5,
  },
  lesson({
    id: 'pr-1', title: b('I – V', 'I – V'), desc: b('Đi xa rồi về', 'Away and back'),
    newItems: ['I-V-I'], pool: ['I-V-I'], mode: 'yesno', yesItem: 'I-V-I', decoys: ['I-I-I', 'I-IV-I'],
    anchors: ['pr-i-v-i'], traps: [pair('I-V-I', 'I-IV-I')],
    slides: [{ title: b('Hợp âm át (V)', 'The dominant (V)'), body: b('V là hợp âm dựng trên bậc 5 (Sol trưởng trong giọng Đô). Nó căng và kéo mạnh về I. Bài này hỏi: có nghe thấy I – V – I không?', 'V is the chord on the 5th degree (G major in C). It is tense and pulls hard back to I. This lesson asks: do you hear I – V – I?'), keys: CH.V!, examples: [seq('I – V – I', 'I – V – I', 'I', 'V', 'I')] }],
  }),
  lesson({
    id: 'pr-2', title: b('I – IV', 'I – IV'), desc: b('Tiếng "A-men"', 'The "Amen" sound'),
    newItems: ['I-IV-I'], pool: ['I-IV-I', 'I-V-I'], anchors: ['pr-amazing'], traps: [pair('I-IV-I', 'I-V-I')],
    slides: [{ title: b('Hợp âm hạ át (IV)', 'The subdominant (IV)'), body: b('IV (Fa trưởng trong giọng Đô) mềm hơn V: như mở cửa bước ra rồi khép lại. IV – I là tiếng "A-men" cuối thánh ca.', 'IV (F major in C) is softer than V: like stepping out and closing the door. IV – I is the "Amen" at the end of hymns.'), keys: CH.IV!, examples: [seq('I – IV – I', 'I – IV – I', 'I', 'IV', 'I')] }],
  }),
  lesson({
    id: 'pr-3', title: b('IV hay V', 'IV or V'), desc: b('Nghe theo bass', 'Follow the bass'),
    pool: ['I-IV-I-V-I', 'I-V-I-IV-I'], anchors: ['pr-twinkle'], traps: [pair('I-IV-I-V-I', 'I-V-I-IV-I')],
    slides: [{ title: b('Fa hay Sol ở dưới', 'F or G in the bass'), body: b('Nốt bass của IV là Fa, của V là Sol. V nghe căng hơn và "đòi" về nhà mạnh hơn. Twinkle dùng đúng I – IV – I – V – I.', 'IV has F in the bass, V has G. V is tenser and pulls home harder. Twinkle uses exactly I – IV – I – V – I.'), examples: [seq('IV', 'IV', 'I', 'IV'), seq('V', 'V', 'I', 'V')] }],
  }),
  lesson({
    id: 'pr-4', title: b('Kết câu', 'Cadences'), desc: b('Kết hoàn toàn, plagal và kết nửa', 'Authentic, plagal and half cadences'),
    pool: ['I-IV-V-I', 'I-V-IV-I', 'I-IV-I-V'], traps: [pair('I-IV-V-I', 'I-V-IV-I')],
    slides: [{ title: b('Câu nhạc kết ra sao', 'How a phrase ends'), body: b('V → I: kết hoàn toàn, dứt khoát. IV → I: kết plagal, mềm. Dừng ở V: kết nửa, như dấu hỏi.', 'V → I: authentic, final. IV → I: plagal, gentle. Stopping on V: a half cadence, like a question.'), examples: [seq('… V – I', '… V – I', 'IV', 'V', 'I'), seq('… IV – I', '… IV – I', 'V', 'IV', 'I'), seq('… I – V', '… I – V', 'IV', 'I', 'V')] }],
  }),
  checkpoint('pr-cp1', b('Checkpoint: ba hợp âm chính', 'Checkpoint: the three main chords'), b('30 câu với I, IV, V', '30 questions with I, IV, V'), CORE),
  lesson({
    id: 'pr-5', title: b('I – IV – V – I', 'I – IV – V – I'), desc: b('Vòng cơ bản', 'The basic loop'),
    pool: ['I-IV-V-I', 'I-IV-I-V', 'I-V-I-V'], traps: [pair('I-IV-I-V', 'I-V-I-V')],
    slides: [{ title: b('Ba hợp âm làm nên cả bài', 'Three chords make a song'), body: b('Vô số bài dân ca và rock\'n\'roll chỉ dùng I, IV, V. Hãy nghe vị trí của IV và V trong vòng.', 'Countless folk and rock\'n\'roll songs use only I, IV and V. Listen for where IV and V fall.'), examples: [seq('I – IV – V – I', 'I – IV – V – I', 'I', 'IV', 'V', 'I')] }],
  }),
  lesson({
    id: 'pr-6', title: b('vi — hợp âm thứ "họ hàng"', 'vi — the relative minor'), desc: b('La thứ trong giọng Đô', 'A minor in C'),
    newItems: ['I-vi-I'], pool: ['I-vi-I', 'I-IV-I', 'I-V-I'], traps: [pair('I-vi-I', 'I-IV-I')],
    slides: [{ title: b('Màu buồn trong giọng trưởng', 'A sad colour in a major key'), body: b('vi (La thứ) dùng chung hai nốt với I (Đô, Mi). Nó đưa vòng sang màu buồn mà không rời giọng.', 'vi (A minor) shares two notes with I (C and E). It turns the mood sad without leaving the key.'), keys: CH.vi!, examples: [seq('I – vi – I', 'I – vi – I', 'I', 'vi', 'I')] }],
  }),
  lesson({
    id: 'pr-7', title: b('Vòng pop I – V – vi – IV', 'Pop loop I – V – vi – IV'), desc: b('Bốn hợp âm của hàng nghìn bài hát', 'The four chords of a thousand songs'),
    newItems: ['I-V-vi-IV'], pool: ['I-V-vi-IV', 'I-vi-IV-V', 'I-IV-V-I'], anchors: ['pr-pop'], traps: [pair('I-V-vi-IV', 'I-vi-IV-V')],
    slides: [{ title: b('Vòng bốn hợp âm', 'The four-chord loop'), body: b('I – V – vi – IV: bass đi Đô – Sol – La – Fa. Rất nhiều bài pop hiện đại chỉ lặp lại vòng này.', 'I – V – vi – IV: the bass goes C – G – A – F. Plenty of modern pop just loops it.'), examples: [seq('I – V – vi – IV', 'I – V – vi – IV', 'I', 'V', 'vi', 'IV')] }],
  }),
  lesson({
    id: 'pr-8', title: b('Vòng thập niên 50', 'The fifties loop'), desc: b('I – vi – IV – V', 'I – vi – IV – V'),
    newItems: ['I-vi-IV-V'], pool: ['I-vi-IV-V', 'I-V-vi-IV', 'I-IV-vi-V'], traps: [pair('I-vi-IV-V', 'I-IV-vi-V')],
    slides: [{ title: b('Bass đi xuống rồi lên', 'Bass down, then up'), body: b('Đô – La – Fa – Sol: vòng của những bản ballad doo-wop.', 'C – A – F – G: the doo-wop ballad loop.'), examples: [seq('I – vi – IV – V', 'I – vi – IV – V', 'I', 'vi', 'IV', 'V')] }],
  }),
  lesson({
    id: 'pr-9', title: b('vi – IV – I – V', 'vi – IV – I – V'), desc: b('Bắt đầu bằng hợp âm thứ', 'Starting on the minor chord'),
    newItems: ['vi-IV-I-V'], pool: POP, traps: [pair('vi-IV-I-V', 'I-V-vi-IV')],
    slides: [{ title: b('Cùng bốn hợp âm, khác điểm bắt đầu', 'Same chords, new start'), body: b('Vẫn bốn hợp âm của vòng pop nhưng bắt đầu từ vi, nên nghe buồn và da diết hơn.', 'The same four chords as the pop loop, starting on vi, so it sounds sadder.'), examples: [seq('vi – IV – I – V', 'vi – IV – I – V', 'vi', 'IV', 'I', 'V')] }],
  }),
  checkpoint('pr-cp2', b('Checkpoint: vòng pop', 'Checkpoint: pop loops'), b('30 câu', '30 questions'), [...POP, 'I-IV-V-I']),
  lesson({
    id: 'pr-10', title: b('ii – V – I', 'ii – V – I'), desc: b('Vòng của jazz', 'The jazz move'),
    newItems: ['ii-V-I'], pool: ['ii-V-I', 'IV-V-I', 'vi-V-I'], traps: [pair('ii-V-I', 'IV-V-I')],
    slides: [{ title: b('ii thay cho IV', 'ii instead of IV'), body: b('ii (Rê thứ) gần giống IV nhưng buồn hơn. ii – V – I là chuỗi quan trọng nhất của jazz.', 'ii (D minor) is close to IV but darker. ii – V – I is the most important move in jazz.'), keys: CH.ii!, examples: [seq('ii – V – I', 'ii – V – I', 'ii', 'V', 'I'), seq('IV – V – I', 'IV – V – I', 'IV', 'V', 'I')] }],
  }),
  lesson({
    id: 'pr-11', title: b('iii', 'iii'), desc: b('Mi thứ trong giọng Đô', 'E minor in C'),
    newItems: ['I-V-vi-iii'], pool: ['I-V-vi-iii', 'I-V-vi-IV', 'I-iii-IV-V'], anchors: ['pr-canon'], traps: [pair('I-iii-IV-V', 'I-V-IV-V')],
    slides: [{ title: b('Hợp âm ít gặp', 'The rare one'), body: b('iii (Mi thứ) mờ, nhẹ. Canon của Pachelbel dùng nó: I – V – vi – iii – IV – I – IV – V.', 'iii (E minor) is soft and pale. Pachelbel\'s Canon uses it: I – V – vi – iii – IV – I – IV – V.'), keys: CH.iii!, examples: [seq('I – V – vi – iii', 'I – V – vi – iii', 'I', 'V', 'vi', 'iii')] }],
  }),
  lesson({
    id: 'pr-12', title: b('Kết lừa V – vi', 'Deceptive cadence V – vi'), desc: b('Tưởng về nhà mà không', 'Almost home, but not'),
    newItems: ['I-IV-V-vi'], pool: ['I-IV-V-I', 'I-IV-V-vi'], traps: [pair('I-IV-V-I', 'I-IV-V-vi')],
    slides: [{ title: b('Bất ngờ', 'A surprise'), body: b('Sau V ta chờ I, nhưng lại nghe vi: câu nhạc chưa xong, phải đi tiếp.', 'After V we expect I, but hear vi: the phrase is not over yet.'), examples: [seq('V – I', 'V – I', 'IV', 'V', 'I'), seq('V – vi', 'V – vi', 'IV', 'V', 'vi')] }],
  }),
  lesson({
    id: 'pr-13', title: b('Thế đảo và bass đi bậc', 'Inversions and a walking bass'), desc: b('V⁶ cho bass đi xuống', 'V⁶ lets the bass step down'),
    newItems: ['I-V6-vi-V'], pool: ['I-V6-vi-V', 'I-V-vi-V', 'IV-I64-V-I'], traps: [pair('I-V6-vi-V', 'I-V-vi-V')],
    slides: [{ title: b('Đặt nốt khác xuống bass', 'Another note in the bass'), body: b('V⁶ là Sol trưởng với Si ở bass. Nhờ vậy bass đi Đô – Si – La từng bậc, nghe trơn tru hơn hẳn.', 'V⁶ is G major with B in the bass. The bass then steps C – B – A, much smoother.') }],
  }),
  checkpoint('pr-cp3', b('Checkpoint: giọng trưởng mở rộng', 'Checkpoint: the extended major key'), b('30 câu', '30 questions'), ['ii-V-I', 'IV-V-I', 'I-IV-V-vi', 'I-IV-V-I', 'I-V-vi-iii', 'I-V6-vi-V']),
  lesson({
    id: 'pr-14', title: b('Giọng thứ i – iv – v', 'Minor key i – iv – v'), desc: b('Cả ba đều thứ', 'All three minor'),
    newItems: ['i-iv-v-i'], pool: ['i-iv-v-i', 'i-v-iv-i', 'i-iv-i-v'], traps: [pair('i-iv-v-i', 'i-v-iv-i')],
    slides: [{ title: b('Màu tối', 'The dark colour'), body: b('Trong giọng Đô thứ: Đô thứ, Fa thứ, Sol thứ. Tất cả đều buồn, không có lực kéo mạnh.', 'In C minor: C minor, F minor, G minor. All sad, no strong pull.'), examples: [seq('i – iv – v – i', 'i – iv – v – i', 'i', 'iv', 'v', 'i')] }],
  }),
  lesson({
    id: 'pr-15', title: b('V trưởng trong giọng thứ', 'Major V in a minor key'), desc: b('Có nốt dẫn', 'With a leading note'),
    newItems: ['i-iv-V-i'], pool: ['i-iv-V-i', 'i-iv-v-i'], traps: [pair('i-iv-V-i', 'i-iv-v-i')],
    slides: [{ title: b('Mượn nốt Si', 'Borrowing B natural'), body: b('Đổi Sol thứ thành Sol trưởng (có Si) để có nốt dẫn về Đô: vòng thứ nghe kết dứt khoát hơn.', 'Swap G minor for G major (with B) to get a leading note to C: the minor cadence lands harder.'), examples: [seq('v', 'v', 'iv', 'v', 'i'), seq('V', 'V', 'iv', 'V', 'i')] }],
  }),
  lesson({
    id: 'pr-16', title: b('♭VI và ♭VII', '♭VI and ♭VII'), desc: b('Màu hùng tráng', 'The epic colour'),
    newItems: ['i-bVI-bVII-i'], pool: ['i-bVI-bVII-i', 'i-bVII-bVI-i', 'i-iv-v-i'], traps: [pair('i-bVI-bVII-i', 'i-bVII-bVI-i')],
    slides: [{ title: b('Hợp âm trưởng trong giọng thứ', 'Major chords in a minor key'), body: b('♭VI (La♭) và ♭VII (Si♭) là hợp âm trưởng nhưng thuộc giọng thứ. Đi lên ♭VI → ♭VII → i nghe như nhạc phim hành động.', '♭VI (A♭) and ♭VII (B♭) are major chords that belong to the minor key. ♭VI → ♭VII → i sounds like an action film.'), examples: [seq('i – ♭VI – ♭VII – i', 'i – ♭VI – ♭VII – i', 'i', 'bVI', 'bVII', 'i')] }],
  }),
  lesson({
    id: 'pr-17', title: b('Kết Andalusia', 'Andalusian cadence'), desc: b('i – ♭VII – ♭VI – V', 'i – ♭VII – ♭VI – V'),
    newItems: ['i-bVII-bVI-V'], pool: ['i-bVII-bVI-V', 'i-bVI-bVII-i', 'i-iv-V-i'], anchors: ['pr-andalusian'], traps: [pair('i-bVII-bVI-V', 'i-bVI-bVII-i')],
    slides: [{ title: b('Bass đi xuống bốn bậc', 'The bass walks down four steps'), body: b('La – Sol – Fa – Mi trong giọng La thứ: âm thanh của flamenco.', 'A – G – F – E in A minor: the sound of flamenco.') }],
  }),
  checkpoint('pr-cp4', b('Checkpoint: giọng thứ', 'Checkpoint: minor keys'), b('30 câu', '30 questions'), [...MINOR, 'i-v-iv-i']),
  lesson({
    id: 'pr-18', title: b('♭VII trong giọng trưởng', '♭VII in a major key'), desc: b('Màu Mixolydian, rất rock', 'Mixolydian colour, very rock'),
    newItems: ['I-bVII-IV-I'], pool: ['I-bVII-IV-I', 'I-V-IV-I'], anchors: ['pr-mixolydian'], traps: [pair('I-bVII-IV-I', 'I-V-IV-I')],
    slides: [{ title: b('Si♭ trưởng trong giọng Đô', 'B♭ major in C'), body: b('Mượn ♭VII từ điệu Mixolydian: nghe phóng khoáng, kiểu rock cổ điển.', 'Borrowing ♭VII from Mixolydian: loose and classic-rock.'), examples: [seq('I – ♭VII – IV – I', 'I – ♭VII – IV – I', 'I', 'bVII', 'IV', 'I')] }],
  }),
  lesson({
    id: 'pr-19', title: b('Hợp âm 7: ii7 – V7 – Imaj7', 'Sevenths: ii7 – V7 – Imaj7'), desc: b('Jazz', 'Jazz'),
    newItems: ['ii7-V7-Imaj7'], pool: ['ii7-V7-Imaj7', 'IV-V7-Imaj7', 'ii7-V7-vi7'], traps: [pair('ii7-V7-Imaj7', 'ii7-V7-vi7')],
    slides: [{ title: b('Thêm nốt 7 cho mọi hợp âm', 'A seventh on every chord'), body: b('Cùng đường đi ii – V – I nhưng mỗi hợp âm có thêm nốt 7: mềm và "jazz" hơn hẳn.', 'The same ii – V – I path with a 7th on each chord: much softer and jazzier.') }],
  }),
  lesson({
    id: 'pr-20', title: b('Blues 12 ô nhịp', '12-bar blues'), desc: b('Khuôn của blues và rock\'n\'roll', 'The frame of blues and rock\'n\'roll'),
    newItems: [BLUES], pool: [BLUES, BLUES_QUICK, BLUES_SLOW_END], anchors: ['pr-blues'], traps: [pair(BLUES, BLUES_QUICK)],
    slides: [{ title: b('12 ô nhịp', 'Twelve bars'), body: b('4 ô I, 2 ô IV, 2 ô I, rồi V – IV – I – V. Biến thể "quick change" chuyển sang IV ngay ô thứ hai.', '4 bars of I, 2 of IV, 2 of I, then V – IV – I – V. The "quick change" goes to IV in bar two.') }],
  }),
  checkpoint('pr-cp5', b('Checkpoint: màu sắc', 'Checkpoint: colours'), b('30 câu', '30 questions'), COLOUR),
  lesson({
    id: 'pr-21', title: b('Vòng dài 6–8 hợp âm', 'Long progressions'), desc: b('Theo dõi cả chặng đường', 'Follow the whole journey'),
    newItems: [CANON], pool: [CANON, 'I-vi-IV-V-I-vi-IV-V', 'I-V-vi-IV-I-V-IV-I'], anchors: ['pr-canon'], traps: [pair(CANON, 'I-V-vi-IV-I-V-IV-I')],
    slides: [{ title: b('Nhớ từng chặng', 'Remember each leg'), body: b('Chia vòng dài thành hai nửa bốn hợp âm và nhận ra từng nửa.', 'Split a long progression into two halves of four and recognise each half.') }],
  }),
  lesson({
    id: 'pr-22', title: b('Giọng ngẫu nhiên', 'Any key'), desc: b('Chủ âm bất kỳ', 'Any tonic'),
    pool: ['I-V-vi-IV', 'I-vi-IV-V', 'ii-V-I', 'I-IV-V-I'], register: 'keyAny', traps: [pair('I-V-vi-IV', 'I-vi-IV-V', 'keyAny')],
    slides: [{ title: b('Bậc, không phải tên nốt', 'Degrees, not note names'), body: b('Đổi giọng thì tên hợp âm đổi, nhưng bậc La Mã và cảm giác giữ nguyên.', 'Change key and the chord names change, but the numerals and the feel stay.') }],
  }),
  checkpoint('pr-cp6', b('Checkpoint: tổng hợp', 'Checkpoint: everything'), b('30 câu, giọng ngẫu nhiên', '30 questions, any key'), ['I-IV-V-I', 'I-V-vi-IV', 'ii-V-I', 'I-IV-V-vi', 'i-iv-V-i', 'i-bVII-bVI-V', 'I-bVII-IV-I', 'ii7-V7-Imaj7'], 'keyAny'),
  {
    id: 'pr-final',
    kind: 'final',
    title: b('Thi cuối: đọc vòng bằng tai', 'Final exam: progressions by ear'),
    desc: b('40 câu, giọng ngẫu nhiên, 12 giây mỗi câu', '40 questions, any key, 12 s each'),
    newItems: [],
    slides: [],
    anchors: [],
    pool: [...CORE, ...POP, 'ii-V-I', 'I-IV-V-vi', ...MINOR, 'I-bVII-IV-I', 'ii7-V7-Imaj7', CANON],
    register: 'keyAny',
    traps: [],
    questionCount: 40,
    timeLimitMs: 12000,
  },
];

export const PROGRESSIONS_PATH: PathDef = {
  id: 'progressions',
  title: b('Vòng hợp âm', 'Progressions'),
  tagline: b('Nghe ra vòng hòa âm', 'Hear chord progressions'),
  color: '#39d0c0',
  items: [...new Set(LESSONS.flatMap((l) => l.pool))],
  lessons: LESSONS,
};
