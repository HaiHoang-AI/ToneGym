import { useMemo, useState } from 'react';
import { useProfile } from '../../app/ProfileContext';
import { useL } from '../../app/useL';
import { itemLabel, itemName, itemSymbol } from '../../learn/generators';
import { masteryNow, pathMastery } from '../../learn/mastery';
import { PATHS } from '../../learn/paths';
import { useAllLearnData, useMasteryDays } from '../../learn/store';
import type { MasteryDay, PathDef } from '../../learn/types';
import { displayNoteName } from '../../theory';

function shortName(path: PathDef, id: string, naming: 'letters' | 'solfege') {
  return path.id === 'pitch' ? displayNoteName(itemLabel(id), naming) : itemSymbol(path.id, id);
}

/** "Learning paths" block of the Stats page: mastery per path, best item, and a mastery-by-day chart. */
export function LearnStats() {
  const l = useL();
  const profile = useProfile();
  const data = useAllLearnData(profile.id);
  const days = useMasteryDays(profile.id);
  const [pathId, setPathId] = useState(PATHS[0]!.id);
  const [itemId, setItemId] = useState<string | null>(null);
  const path = PATHS.find((p) => p.id === pathId)!;

  const rows = useMemo(() => {
    if (!data || !days) return [];
    return PATHS.map((p) => {
      const ms = data.mastery.filter((m) => m.pathId === p.id);
      const map = new Map(ms.map((m) => [m.itemId, m]));
      const seen = ms.reduce((n, m) => n + m.seen, 0);
      const right = ms.reduce((n, m) => n + m.correct, 0);
      const best = [...ms].filter((m) => m.seen > 0).sort((a, b) => masteryNow(b) - masteryNow(a))[0];
      const ms_ = days.filter((d) => d.pathId === p.id).reduce((n, d) => n + d.ms, 0);
      return { path: p, mastery: pathMastery(p.items, map), seen, right, best, minutes: Math.round(ms_ / 60000) };
    });
  }, [data, days]);

  if (!data || !days) return null;
  const total = rows.reduce((s, r) => s + r.mastery, 0) / Math.max(1, rows.length);
  const series = days.filter((d) => d.pathId === pathId);
  const seenItems = path.items.filter((id) => data.mastery.some((m) => m.pathId === pathId && m.itemId === id && m.seen > 0));

  return (
    <section className="card flex flex-col gap-4" data-testid="learn-stats">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="h-display text-xl font-bold">{l('Lộ trình học', 'Learning paths')}</h2>
        <MasteryRing value={total} label={l('Thành thạo chung', 'Overall mastery')} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th className="py-1.5 font-semibold">{l('Lộ trình', 'Path')}</th>
              <th className="py-1.5 text-right font-semibold">{l('Thành thạo', 'Mastery')}</th>
              <th className="py-1.5 text-right font-semibold">{l('Lượt', 'Answers')}</th>
              <th className="py-1.5 text-right font-semibold">{l('% đúng', '% right')}</th>
              <th className="py-1.5 text-right font-semibold">{l('Phút', 'Minutes')}</th>
              <th className="py-1.5 pl-4 font-semibold">{l('Mục tốt nhất', 'Best item')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.path.id} className="border-t border-line">
                <td className="py-2 font-semibold"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: r.path.color }} />{l(r.path.title)}</td>
                <td className="py-2 text-right tabular-nums">{Math.round(r.mastery * 100)}%</td>
                <td className="py-2 text-right tabular-nums">{r.seen}</td>
                <td className="py-2 text-right tabular-nums">{r.seen ? `${Math.round((r.right / r.seen) * 100)}%` : '—'}</td>
                <td className="py-2 text-right tabular-nums">{r.minutes}</td>
                <td className="py-2 pl-4">{r.best ? `${shortName(r.path, r.best.itemId, profile.settings.noteNaming)} · ${Math.round(masteryNow(r.best) * 100)}%` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label={l('Chọn lộ trình', 'Pick a path')}>
        {PATHS.map((p) => (
          <button key={p.id} type="button" role="tab" aria-selected={p.id === pathId} className={`btn btn-sm ${p.id === pathId ? 'btn-primary' : ''}`} onClick={() => { setPathId(p.id); setItemId(null); }}>
            {l(p.title)}
          </button>
        ))}
      </div>
      {seenItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${itemId === null ? 'border-accent bg-accent/15' : 'border-line'}`} onClick={() => setItemId(null)}>{l('Cả lộ trình', 'Whole path')}</button>
          {seenItems.map((id) => (
            <button key={id} type="button" title={itemName(path.id, id) ? l(itemName(path.id, id)!) : undefined} className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${itemId === id ? 'border-accent bg-accent/15' : 'border-line'}`} onClick={() => setItemId(id)}>
              {shortName(path, id, profile.settings.noteNaming)}
            </button>
          ))}
        </div>
      )}
      <MasteryChart
        days={series}
        color={path.color}
        pick={(d) => (itemId ? d.items[itemId] ?? null : d.mastery)}
        title={itemId ? `${l(path.title)} · ${shortName(path, itemId, profile.settings.noteNaming)}` : l(path.title)}
        empty={l('Chưa có dữ liệu — học hoặc luyện một bài để bắt đầu biểu đồ.', 'No data yet — finish a lesson or a practice to start the chart.')}
      />
    </section>
  );
}

function MasteryRing({ value, label }: { value: number; label: string }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-2" role="img" aria-label={`${label}: ${Math.round(value * 100)}%`}>
      <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--color-line)" strokeWidth="6" />
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--color-accent)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${c * value} ${c}`} transform="rotate(-90 28 28)" />
      </svg>
      <div>
        <div className="text-xs text-muted">{label}</div>
        <div className="h-display text-2xl font-bold">{Math.round(value * 100)}%</div>
      </div>
    </div>
  );
}

/** Single-series line chart, 0–100 %, one point per practised day, hover tooltip. */
function MasteryChart({ days, color, pick, title, empty }: { days: MasteryDay[]; color: string; pick: (d: MasteryDay) => number | null; title: string; empty: string }) {
  const l = useL();
  const [hover, setHover] = useState<number | null>(null);
  const points = days.map((d) => ({ date: d.date, v: pick(d), answered: d.answered })).filter((p): p is { date: string; v: number; answered: number } => p.v !== null);
  if (points.length === 0) return <div className="grid h-[200px] place-items-center rounded-xl bg-surface-2 text-sm text-muted">{empty}</div>;
  const W = 640;
  const H = 200;
  const pad = { l: 36, r: 12, t: 12, b: 26 };
  const x = (i: number) => (points.length === 1 ? (pad.l + W - pad.r) / 2 : pad.l + (i / (points.length - 1)) * (W - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - v) * (H - pad.t - pad.b);
  const h = hover !== null ? points[hover] : undefined;
  return (
    <figure className="relative" data-testid="mastery-chart">
      <figcaption className="mb-1 text-sm font-semibold">{l(`Thành thạo theo ngày — ${title}`, `Mastery by day — ${title}`)}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={l(`Biểu đồ thành thạo ${title}`, `Mastery chart ${title}`)} onMouseLeave={() => setHover(null)}>
        {[0, 0.5, 1].map((g) => (
          <g key={g}>
            <line x1={pad.l} x2={W - pad.r} y1={y(g)} y2={y(g)} stroke="var(--color-line)" strokeWidth="1" />
            <text x={pad.l - 6} y={y(g)} dy="0.35em" textAnchor="end" fontSize="11" fill="var(--color-muted)">{g * 100}%</text>
          </g>
        ))}
        <text x={pad.l} y={H - 6} fontSize="11" fill="var(--color-muted)">{points[0]!.date}</text>
        {points.length > 1 && <text x={W - pad.r} y={H - 6} textAnchor="end" fontSize="11" fill="var(--color-muted)">{points.at(-1)!.date}</text>}
        {points.length > 1 && <polyline points={points.map((p, i) => `${x(i)},${y(p.v)}`).join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
        {h && <line x1={x(hover!)} x2={x(hover!)} y1={pad.t} y2={H - pad.b} stroke="var(--color-muted)" strokeWidth="1" strokeDasharray="3 3" />}
        {points.map((p, i) => (
          <g key={p.date}>
            <circle cx={x(i)} cy={y(p.v)} r={hover === i ? 6 : 4.5} fill={color} stroke="var(--color-surface)" strokeWidth="2" />
            <rect x={x(i) - 14} y={pad.t} width="28" height={H - pad.t - pad.b} fill="transparent" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0} aria-label={`${p.date}: ${Math.round(p.v * 100)}%`} />
          </g>
        ))}
      </svg>
      {h && (
        <div className="pointer-events-none absolute top-6 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs shadow" style={{ left: `${(x(hover!) / W) * 100}%`, transform: 'translateX(-50%)' }}>
          <div className="font-semibold">{h.date}</div>
          <div>{l(`Thành thạo ${Math.round(h.v * 100)}%`, `Mastery ${Math.round(h.v * 100)}%`)} · {l(`${h.answered} câu`, `${h.answered} answers`)}</div>
        </div>
      )}
    </figure>
  );
}
