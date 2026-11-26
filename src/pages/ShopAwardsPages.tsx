import { Link } from 'react-router-dom';
import { audio, type InstrumentId } from '../audio/engine';
import { useProfile } from '../app/ProfileContext';
import { useL } from '../app/useL';
import { Teacher, Yumika } from '../components/art/Characters';
import { updateSettings } from '../db/profiles';
import { db, emptyStats } from '../db/schema';
import { LESSONS } from '../learn/course';
import { useAllProgress, useStats } from '../progress/hooks';
import { earIndex, rankFor } from '../progress/scoring';
import type { Bilingual } from '../theory';
import { useToolData } from '../tools/useToolData';

export interface ShopItem {
  id: InstrumentId;
  price: number;
  name: Bilingual;
}

export const SHOP: readonly ShopItem[] = [
  { id: 'piano', price: 0, name: { vi: 'Piano (mẫu thật)', en: 'Piano (sampled)' } },
  { id: 'synth', price: 0, name: { vi: 'Synth nhẹ', en: 'Soft synth' } },
  { id: 'musicbox', price: 10, name: { vi: 'Hộp nhạc', en: 'Music box' } },
  { id: 'marimba', price: 40, name: { vi: 'Marimba', en: 'Marimba' } },
  { id: 'organ', price: 80, name: { vi: 'Đàn organ', en: 'Organ' } },
  { id: 'epiano', price: 150, name: { vi: 'Piano điện', en: 'Electric piano' } },
  { id: 'bell', price: 250, name: { vi: 'Chuông', en: 'Bells' } },
  { id: 'strings', price: 400, name: { vi: 'Dàn dây', en: 'Strings' } },
  { id: 'pad', price: 600, name: { vi: 'Pad không gian', en: 'Space pad' } },
  { id: 'lead', price: 1000, name: { vi: 'Synth lead', en: 'Synth lead' } },
];

export function ShopPage() {
  const l = useL();
  const profile = useProfile();
  const stats = useStats(profile.id!);
  const owned = new Set(profile.settings.unlockAll ? SHOP.map((s) => s.id) : stats.ownedInstruments);

  const preview = async (id: InstrumentId) => {
    await audio.start();
    audio.stop();
    audio.setInstrument(id);
    await audio.playSequence([{ notes: [60, 64, 67], at: 0, duration: 1 }, { notes: [72], at: 0.9, duration: 1.2 }]);
    audio.setInstrument(profile.settings.instrument);
  };

  const buy = async (item: ShopItem) => {
    await db.transaction('rw', db.stats, async () => {
      const s = (await db.stats.get(profile.id!)) ?? emptyStats(profile.id!);
      if (s.coins < item.price || s.ownedInstruments.includes(item.id)) return;
      const ownedNow = [...s.ownedInstruments, item.id];
      const awards = new Set(s.awards);
      if (ownedNow.length >= SHOP.length) awards.add('full-studio');
      await db.stats.put({ ...s, coins: s.coins - item.price, ownedInstruments: ownedNow, awards: [...awards] });
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="h-display text-[32px] font-bold">{l('Cửa hàng nhạc cụ', 'Instrument shop')}</h1>
          <p className="mt-1 text-muted">{l('Dùng xu kiếm từ workout và thi tuần để mua tiếng đàn mới. Nhạc cụ đã có dùng được cho mọi game.', 'Spend coins from workouts and contests on new sounds. Owned instruments work in every game.')}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="h-display text-2xl font-bold">{stats.coins} {l('xu', 'coins')}</span>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-5 w-5 accent-[#f4b740]" checked={!!profile.settings.unlockAll} onChange={(e) => void updateSettings(profile.id!, { unlockAll: e.target.checked })} />
            {l('Mở hết, không cần xu', 'Unlock everything')}
          </label>
        </div>
      </div>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
        {SHOP.map((item) => {
          const has = owned.has(item.id);
          const current = profile.settings.instrument === item.id;
          return (
            <article key={item.id} className={`card flex flex-col gap-3 ${current ? '!border-accent' : ''}`}>
              <div className="flex items-center justify-between">
                <h2 className="h-display text-lg font-bold">{l(item.name)}</h2>
                <span className="text-sm font-semibold text-link">{item.price ? `${item.price} ${l('xu', 'coins')}` : l('Miễn phí', 'Free')}</span>
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                <button type="button" className="btn btn-sm" onClick={() => void preview(item.id)}>▶ {l('Nghe thử', 'Preview')}</button>
                {has ? (
                  <button type="button" className={`btn btn-sm ${current ? 'btn-primary' : ''}`} disabled={current} onClick={() => void updateSettings(profile.id!, { instrument: item.id })}>
                    {current ? l('Đang dùng', 'In use') : l('Dùng', 'Use')}
                  </button>
                ) : (
                  <button type="button" className="btn btn-sm" disabled={stats.coins < item.price} onClick={() => void buy(item)}>{l('Mua', 'Buy')}</button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

const AWARDS: { id: string; name: Bilingual; desc: Bilingual }[] = [
  { id: 'rank-iron', name: { vi: 'Huy chương Sắt', en: 'Iron medal' }, desc: { vi: 'Hoàn thành workout đầu tiên', en: 'Finish a first workout' } },
  { id: 'rank-bronze', name: { vi: 'Huy chương Đồng', en: 'Bronze medal' }, desc: { vi: 'Ear Index 250 khi xong workout', en: 'Ear Index 250 on a finished workout' } },
  { id: 'rank-silver', name: { vi: 'Huy chương Bạc', en: 'Silver medal' }, desc: { vi: 'Ear Index 500 khi xong workout', en: 'Ear Index 500 on a finished workout' } },
  { id: 'rank-gold', name: { vi: 'Huy chương Vàng', en: 'Gold medal' }, desc: { vi: 'Ear Index 800 khi xong workout', en: 'Ear Index 800 on a finished workout' } },
  { id: 'rank-diamond', name: { vi: 'Huy chương Kim cương', en: 'Diamond medal' }, desc: { vi: 'Ear Index 1400 khi xong workout', en: 'Ear Index 1400 on a finished workout' } },
  { id: 'workouts-10', name: { vi: 'Chăm chỉ', en: 'Regular' }, desc: { vi: '10 workout', en: '10 workouts' } },
  { id: 'workouts-50', name: { vi: 'Bền bỉ', en: 'Dedicated' }, desc: { vi: '50 workout', en: '50 workouts' } },
  { id: 'streak-7', name: { vi: 'Một tuần liền', en: 'Week streak' }, desc: { vi: 'Chuỗi 7 ngày', en: '7-day streak' } },
  { id: 'streak-30', name: { vi: 'Một tháng liền', en: 'Month streak' }, desc: { vi: 'Chuỗi 30 ngày', en: '30-day streak' } },
  { id: 'contest-gold', name: { vi: 'Vô địch tuần', en: 'Weekly champion' }, desc: { vi: 'Hạng 1 thử thách tuần', en: '1st in a weekly challenge' } },
  { id: 'contest-silver', name: { vi: 'Á quân tuần', en: 'Weekly runner-up' }, desc: { vi: 'Hạng 2 thử thách tuần', en: '2nd in a weekly challenge' } },
  { id: 'contest-bronze', name: { vi: 'Hạng ba tuần', en: 'Weekly third' }, desc: { vi: 'Hạng 3 thử thách tuần', en: '3rd in a weekly challenge' } },
  { id: 'full-studio', name: { vi: 'Phòng nhạc đầy đủ', en: 'Full studio' }, desc: { vi: 'Sở hữu mọi nhạc cụ', en: 'Own every instrument' } },
  { id: 'course', name: { vi: 'Tốt nghiệp nhạc lý', en: 'Theory graduate' }, desc: { vi: 'Học xong cả khóa nhạc lý', en: 'Finish the whole theory course' } },
];

export function AwardsPage() {
  const l = useL();
  const profile = useProfile();
  const stats = useStats(profile.id!);
  const progress = useAllProgress(profile.id!);
  const [lessons] = useToolData<string[]>('lessons-done', []);
  const courseDone = lessons.length >= LESSONS.length;
  const earned = new Set([...stats.awards, ...(courseDone ? ['course'] : [])]);
  const value = earIndex(progress);
  const rank = rankFor(value);

  return (
    <div className="flex flex-col gap-6">
      <div className="print:hidden">
        <h1 className="h-display text-[32px] font-bold">{l('Giải thưởng & chứng chỉ', 'Awards & certificate')}</h1>
        <p className="mt-1 text-muted">{l(`Đã nhận ${earned.size}/${AWARDS.length} giải · ${stats.learningPoints} điểm học tập`, `${earned.size}/${AWARDS.length} awards · ${stats.learningPoints} learning points`)}</p>
      </div>
      <div className="grid gap-3 print:hidden [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
        {AWARDS.map((a) => {
          const has = earned.has(a.id);
          return (
            <div key={a.id} className={`flex items-center gap-3 rounded-2xl border p-4 ${has ? 'border-accent bg-accent/10' : 'border-line bg-surface opacity-60'}`}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-xl" style={{ background: has ? '#f4b740' : 'var(--surface2)' }} aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={has ? '#1a1405' : 'currentColor'} strokeWidth="2" strokeLinejoin="round"><circle cx="12" cy="14" r="6" /><path d="M8 3l4 5 4-5" /></svg>
              </span>
              <div>
                <div className="font-semibold">{l(a.name)}</div>
                <div className="text-xs text-muted">{l(a.desc)}</div>
              </div>
            </div>
          );
        })}
      </div>

      <section className="card flex flex-col items-center gap-3 text-center print:border-0">
        {courseDone ? (
          <>
            <div className="w-full max-w-2xl rounded-2xl border-4 border-double p-8" style={{ borderColor: '#c9a24a' }}>
              <div className="flex justify-center gap-4"><Teacher mood="cheer" size={90} /><Yumika mood="cheer" size={90} outfit={profile.settings.mascotOutfit ?? 'casual'} /></div>
              <div className="label mt-4 !mb-1">EarLab</div>
              <h2 className="h-display text-3xl font-bold">{l('Chứng chỉ hoàn thành khóa nhạc lý', 'Certificate of completion — music theory')}</h2>
              <p className="mt-4 text-lg">{l('Trao cho', 'Awarded to')}</p>
              <p className="h-display text-4xl font-bold">{profile.name}</p>
              <p className="mt-4 text-muted">{l(`đã hoàn thành ${LESSONS.length} bài trong 7 chương nhạc lý · Ear Index ${value} (hạng ${rank.name.vi})`, `for completing ${LESSONS.length} lessons in 7 theory units · Ear Index ${value} (${rank.name.en})`)}</p>
              <p className="mt-2 text-sm text-muted">{new Date().toLocaleDateString(l.lang === 'vi' ? 'vi-VN' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <button type="button" className="btn btn-primary print:hidden" onClick={() => window.print()}>{l('In chứng chỉ', 'Print certificate')}</button>
          </>
        ) : (
          <>
            <Teacher mood="wave" size={90} />
            <p className="max-w-md text-muted">{l(`Học xong ${LESSONS.length} bài của khóa nhạc lý để nhận chứng chỉ in được. Bạn đã xong ${lessons.length} bài.`, `Finish all ${LESSONS.length} theory lessons to get a printable certificate. You have done ${lessons.length}.`)}</p>
            <Link to="/learn" className="btn btn-primary">{l('Vào học', 'Go to the course')}</Link>
          </>
        )}
      </section>
    </div>
  );
}
