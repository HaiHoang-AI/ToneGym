import { Link } from 'react-router-dom';
import { useL } from '../../app/useL';
import type { Bilingual } from '../../theory';

export interface ToolInfo {
  id: string;
  phase: number;
  color: string;
  icon: string;
  name: Bilingual;
  desc: Bilingual;
}

/** Every tool, with the build phase that ships it. Icons are simple stroke paths. */
export const TOOLS: readonly ToolInfo[] = [
  { id: 'progressions', phase: 6, color: '#f4b740', icon: 'M3 6h5v12H3zM9.5 6h5v12h-5zM16 6h5v12h-5z', name: { vi: 'Tạo vòng hợp âm', en: 'Progression generator' }, desc: { vi: 'Chọn chủ âm, tempo, kiểu phát; nghe vòng hợp âm với voice-leading, lưu vòng của bạn.', en: 'Pick tonic, tempo and style; hear voice-led progressions, save your own.' } },
  { id: 'circle', phase: 6, color: '#60a5fa', icon: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M12 3v4M21 12h-4M12 21v-4M3 12h4', name: { vi: 'Vòng quãng năm', en: 'Circle of fifths' }, desc: { vi: 'Đổi chủ âm và điệu thức, nghe hợp âm từng bậc, xem hóa biểu.', en: 'Change tonic and mode, hear each degree, see the key signature.' } },
  { id: 'scales', phase: 6, color: '#a78bfa', icon: 'M3 19h4.5v-4.5H12V10h4.5V5.5H21', name: { vi: 'Tra âm giai', en: 'Scale explorer' }, desc: { vi: 'Phát âm giai lên/xuống, xem hợp âm theo bậc, tìm âm giai từ các nốt.', en: 'Play scales up/down, see chords per degree, find scales from notes.' } },
  { id: 'chords', phase: 6, color: '#f4b740', icon: 'M12 3.5a2.4 2.4 0 1 0 0 4.8a2.4 2.4 0 1 0 0-4.8M12 9.6a2.4 2.4 0 1 0 0 4.8a2.4 2.4 0 1 0 0-4.8M12 15.7a2.4 2.4 0 1 0 0 4.8a2.4 2.4 0 1 0 0-4.8', name: { vi: 'Chơi hợp âm', en: 'Chord player' }, desc: { vi: '46 loại hợp âm, mọi thế đảo, phân tích nốt gốc, nốt màu, bass.', en: '46 chord types, every inversion, root / colour / bass analysis.' } },
  { id: 'interval-memorizer', phase: 6, color: '#39d0c0', icon: 'M7 13.4a2.6 2.6 0 1 0 0 5.2a2.6 2.6 0 1 0 0-5.2M17 5.4a2.6 2.6 0 1 0 0 5.2a2.6 2.6 0 1 0 0-5.2M9.2 14.3l5.6-4.6', name: { vi: 'Ghi nhớ quãng', en: 'Interval memorizer' }, desc: { vi: 'Gắn mỗi quãng với một bài hát bạn thuộc để nhớ lâu.', en: 'Tie each interval to a song you know.' } },
  { id: 'piano', phase: 6, color: '#f472b6', icon: 'M4 5h16v14H4zM8 5v8M12 5v8M16 5v8', name: { vi: 'Piano ghi âm', en: 'Piano recorder' }, desc: { vi: 'Chơi bằng chuột, bàn phím hoặc MIDI; ghi lại, nghe lại, xuất file MIDI.', en: 'Play with mouse, keyboard or MIDI; record, replay, export MIDI.' } },
  { id: 'metronome', phase: 6, color: '#fb923c', icon: 'M8 21h8L13 3h-2zM12 14l5-6', name: { vi: 'Metronome', en: 'Metronome' }, desc: { vi: 'Đếm nhịp với số chỉ nhịp tùy chọn, nhấn phách đầu, gõ để đặt tempo.', en: 'Click track with any meter, accented downbeat, tap tempo.' } },
  { id: 'tuner', phase: 5, color: '#39d0c0', icon: 'M12 20V8M12 8l-5 6M5 20h14', name: { vi: 'Máy lên dây', en: 'Tuner' }, desc: { vi: 'Dùng micro, kim chỉ chùng hay căng so với nốt gần nhất.', en: 'Uses the mic; the needle shows flat or sharp.' } },
  { id: 'vocal-range', phase: 5, color: '#f87171', icon: 'M9 3h6v11H9zM5 11a7 7 0 0 0 14 0M12 18v3', name: { vi: 'Đo tầm giọng', en: 'Vocal range test' }, desc: { vi: 'Hát nốt thấp nhất và cao nhất để biết tầm và loại giọng.', en: 'Sing your lowest and highest notes to find your range and voice type.' } },
  { id: 'perfect-pitch', phase: 5, color: '#34d399', icon: 'M4 12h3l2-6 4 12 2-6h5', name: { vi: 'Kiểm tra cao độ tuyệt đối', en: 'Perfect pitch test' }, desc: { vi: 'Nghe 6 nốt không có nốt mẫu và gọi tên, rồi thử hát đúng nốt.', en: 'Name 6 notes with no reference, then sing named notes.' } },
  { id: 'sight-singing', phase: 5, color: '#fb923c', icon: 'M3 7h18M3 11h18M3 15h18M14 15V5', name: { vi: 'Luyện xướng âm', en: 'Sight-singing trainer' }, desc: { vi: 'Bài xướng âm 4 cấp theo loại giọng, chấm cao độ qua micro.', en: 'Four-level sight-singing by voice type, graded by the mic.' } },
  { id: 'warmup', phase: 5, color: '#f472b6', icon: 'M3 15c2.5-7 5-7 7 0s4.5 7 7 0c1-2.6 2.4-4 4-4', name: { vi: 'Khởi động giọng', en: 'Vocal warm-up' }, desc: { vi: 'Bài khởi động mẫu và tự tạo bài theo tempo, nguyên âm, số lần lặp.', en: 'Preset warm-ups and your own, by tempo, vowel and repetitions.' } },
];

export function ToolsPage({ shipped }: { shipped: number }) {
  const l = useL();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="h-display text-[32px] font-bold">{l('Công cụ nhạc lý', 'Theory tools')}</h1>
        <p className="mt-2 text-muted">{l('Công cụ dùng micro cần cho phép micro trong trình duyệt (chỉ xử lý trên máy, không gửi đi đâu).', 'Mic tools need microphone permission (processed locally, never sent anywhere).')}</p>
      </div>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
        {TOOLS.map((t) => {
          const ready = t.phase <= shipped;
          const body = (
            <>
              <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: `${t.color}1f` }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={t.icon} /></svg>
              </span>
              <span className="h-display text-[17px] font-semibold">{l(t.name)}</span>
              <span className="text-sm leading-snug text-muted">{l(t.desc)}</span>
              {!ready && <span className="text-xs font-semibold text-link">{l(`Giai đoạn ${t.phase}`, `Phase ${t.phase}`)}</span>}
            </>
          );
          return ready ? (
            <Link key={t.id} to={`/tools/${t.id}`} className="flex flex-col gap-2.5 rounded-2xl border border-line bg-surface p-5 text-ink no-underline hover:border-accent">{body}</Link>
          ) : (
            <div key={t.id} className="flex flex-col gap-2.5 rounded-2xl border border-line bg-surface p-5 opacity-70">{body}</div>
          );
        })}
      </div>
    </div>
  );
}

export function ToolShell({ id, children }: { id: string; children: React.ReactNode }) {
  const l = useL();
  const t = TOOLS.find((x) => x.id === id)!;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/tools" className="text-sm font-semibold text-link">← {l('Công cụ', 'Tools')}</Link>
        <h1 className="h-display mt-2 text-[30px] font-bold">{l(t.name)}</h1>
        <p className="mt-1 text-muted">{l(t.desc)}</p>
      </div>
      {children}
    </div>
  );
}
