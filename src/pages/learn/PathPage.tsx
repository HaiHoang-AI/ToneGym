import { Link, useParams } from 'react-router-dom';
import { useProfile } from '../../app/ProfileContext';
import { useL } from '../../app/useL';
import { StarRow } from '../../components/learn/StarRow';
import { getPath } from '../../learn/paths';
import { countDone, pathStatuses, type NodeStatus } from '../../learn/stars';
import { togglePin, usePathProgress } from '../../learn/store';
import type { LessonDef } from '../../learn/types';

export function PathPage() {
  const { pathId = '' } = useParams();
  const l = useL();
  const profile = useProfile();
  const path = getPath(pathId);
  const progress = usePathProgress(profile.id, path?.id ?? 'pitch');
  if (!path) return <p className="text-muted">{l('Lộ trình này sắp có.', 'This path is coming soon.')}</p>;
  if (!progress) return null;
  const statuses = pathStatuses(path.lessons, progress);
  const done = countDone(path.lessons, progress);
  let lessonNo = 0;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <Link to="/learn" className="text-sm font-semibold text-link">← {l('Lộ trình học', 'Learning paths')}</Link>
      <header className="card flex flex-col gap-2" style={{ borderTop: `5px solid ${path.color}` }}>
        <h1 className="h-display text-3xl font-bold" style={{ color: path.color }}>{l(path.title)}</h1>
        <p className="text-muted">{l(path.tagline)}</p>
        <div className="h-2.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full" style={{ width: `${(done / path.lessons.length) * 100}%`, background: path.color }} /></div>
        <div className="text-sm font-semibold" data-testid="path-count">{done} / {path.lessons.length}</div>
      </header>
      <ol className="relative flex flex-col gap-3 border-l-4 pl-6" style={{ borderColor: `${path.color}55` }}>
        {path.lessons.map((lesson, i) => {
          if (lesson.kind === 'lesson') lessonNo++;
          const p = progress.get(lesson.id);
          return (
            <PathNode
              key={lesson.id}
              lesson={lesson}
              number={lesson.kind === 'lesson' ? lessonNo : undefined}
              status={statuses[i]!}
              stars={p?.stars ?? 0}
              bestPct={p?.bestPct ?? 0}
              pinned={!!p?.pinned}
              color={path.color}
              to={`/learn/${path.id}/${lesson.id}`}
              onPin={() => void togglePin(profile.id!, path.id, lesson.id)}
            />
          );
        })}
      </ol>
    </div>
  );
}

function PathNode(props: { lesson: LessonDef; number?: number; status: NodeStatus; stars: number; bestPct: number; pinned: boolean; color: string; to: string; onPin: () => void }) {
  const { lesson, number, status, stars, bestPct, pinned, color, to, onPin } = props;
  const l = useL();
  const locked = status === 'locked';
  const exam = lesson.kind === 'checkpoint' || lesson.kind === 'final';
  const badge: Record<NodeStatus, string> = {
    done: '✓',
    skipped: l('BỎ QUA', 'SKIPPED'),
    retry: l('THỬ LẠI', 'TRY AGAIN'),
    current: l('BẮT ĐẦU', 'START'),
    open: exam ? l('THI', 'TAKE') : l('MỞ', 'OPEN'),
    locked: '🔒',
  };
  const kindLabel = lesson.kind === 'checkpoint' ? 'CHECKPOINT' : lesson.kind === 'final' ? l('THI CUỐI', 'FINAL EXAM') : lesson.kind === 'intro' ? 'INTRO' : l(`BÀI ${number}`, `LESSON ${number}`);
  const body = (
    <>
      <span className="absolute -left-[34px] top-5 flex h-5 w-5 items-center justify-center rounded-full border-4 border-bg" style={{ background: locked ? 'var(--color-line)' : color }} />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold tracking-wide" style={{ color: exam ? color : undefined }}>{kindLabel}</div>
        <div className="font-bold">{l(lesson.title)}</div>
        <div className="text-sm text-muted">{l(lesson.desc)}</div>
        {(stars > 0 || status === 'skipped') && (
          <div className="mt-1 flex items-center gap-2 text-xs text-muted">
            <StarRow stars={stars} size={14} />
            {bestPct > 0 && <span>{l(`cao nhất ${bestPct}%`, `best ${bestPct}%`)}</span>}
          </div>
        )}
      </div>
      <span
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${status === 'current' || status === 'retry' ? 'text-[#1b1d22]' : 'bg-surface-2 text-muted'}`}
        style={status === 'current' || status === 'retry' ? { background: color } : undefined}
        data-status={status}
      >
        {badge[status]}
      </span>
    </>
  );
  return (
    <li className="relative flex items-center gap-2" data-lesson={lesson.id}>
      {locked ? (
        <div className="relative flex flex-1 items-center gap-3 rounded-2xl border border-line bg-surface p-4 opacity-55" aria-disabled="true">{body}</div>
      ) : (
        <Link to={to} className={`relative flex flex-1 items-center gap-3 rounded-2xl border bg-surface p-4 text-ink no-underline hover:border-accent ${exam ? 'border-2' : 'border-line'}`} style={exam ? { borderColor: `${color}aa` } : undefined}>
          {body}
        </Link>
      )}
      {lesson.kind === 'lesson' && !locked && (
        <button type="button" className={`btn btn-sm ${pinned ? 'btn-primary' : ''}`} onClick={onPin} aria-pressed={pinned} title={l('Ghim để ôn', 'Pin for review')}>📌</button>
      )}
    </li>
  );
}
