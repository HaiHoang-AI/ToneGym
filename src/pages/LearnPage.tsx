import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { audio } from '../audio/engine';
import { useProfile } from '../app/ProfileContext';
import { useL } from '../app/useL';
import { Teacher, Yumika } from '../components/art/Characters';
import { db, emptyStats } from '../db/schema';
import type { Sound } from '../games/types';
import { LESSONS, POINTS_PER_LESSON, UNITS } from '../learn/course';
import { useToolData } from '../tools/useToolData';

async function play(sound?: Sound) {
  if (!sound) return;
  await audio.start();
  audio.stop();
  await audio.playSequence(sound.steps);
}

export function LearnPage() {
  const l = useL();
  const [done] = useToolData<string[]>('lessons-done', []);
  const total = LESSONS.length;
  return (
    <div className="flex flex-col gap-6">
      <Link to="/learn" className="text-sm font-semibold text-link">← {l('Lộ trình học', 'Learning paths')}</Link>
      <section className="flex flex-wrap items-center gap-4 rounded-[20px] border border-line bg-surface px-5 py-4">
        <Teacher mood="wave" size={100} />
        <div className="min-w-0 flex-[1_1_280px]">
          <div className="label !mb-0">{l('Khóa nhạc lý', 'Theory course')}</div>
          <h1 className="h-display mt-1 text-[30px] font-bold">{l('Học cùng thầy nhạc', 'Learn with the teacher')}</h1>
          <p className="mt-1 text-muted">{l(`7 chương, ${total} bài. Mỗi bài có ví dụ nghe và câu hỏi; qua bài được +${POINTS_PER_LESSON} điểm học tập.`, `7 units, ${total} lessons with listening examples and quizzes; each lesson passed gives +${POINTS_PER_LESSON} learning points.`)}</p>
          <div className="mt-3 h-2 w-full max-w-md overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-teal" style={{ width: `${(done.length / total) * 100}%` }} /></div>
          <div className="mt-1 text-xs text-muted">{l(`Đã xong ${done.length}/${total} bài`, `${done.length}/${total} lessons done`)}</div>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        {UNITS.map((u, ui) => {
          const lessons = LESSONS.filter((x) => x.unit === u.id);
          const finished = lessons.filter((x) => done.includes(x.id)).length;
          return (
            <section key={u.id} className="card flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="h-display text-xl font-bold"><span style={{ color: u.color }}>{ui + 1}.</span> {l(u.title)}</h2>
                <span className="text-sm text-muted">{finished}/{lessons.length}</span>
              </div>
              <ol className="flex flex-col gap-1.5">
                {lessons.map((x) => (
                  <li key={x.id}>
                    <Link to={`/learn/theory/${x.id}`} className="flex items-center justify-between rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink no-underline hover:border-accent">
                      <span>{l(x.title)}</span>
                      {done.includes(x.id) ? <span className="font-bold text-good-ink">✓</span> : <span className="text-muted">→</span>}
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function LessonPage() {
  const { lessonId = '' } = useParams();
  const l = useL();
  const profile = useProfile();
  const lesson = LESSONS.find((x) => x.id === lessonId);
  const [done, setDone] = useToolData<string[]>('lessons-done', []);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  /** True right after this check awarded the points (the done list updates live afterwards). */
  const [justEarned, setJustEarned] = useState(false);

  if (!lesson) return <p className="text-muted">{l('Không tìm thấy bài học.', 'Lesson not found.')}</p>;
  const index = LESSONS.indexOf(lesson);
  const next = LESSONS[index + 1];
  const correct = lesson.quiz.filter((q, i) => answers[i] === q.answer).length;
  const passed = checked && correct === lesson.quiz.length;
  const already = done.includes(lesson.id);

  const check = async () => {
    setChecked(true);
    if (lesson.quiz.every((q, i) => answers[i] === q.answer) && !already) {
      setJustEarned(true);
      await setDone([...done, lesson.id]);
      const stats = (await db.stats.get(profile.id!)) ?? emptyStats(profile.id!);
      await db.stats.put({ ...stats, learningPoints: stats.learningPoints + POINTS_PER_LESSON });
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link to="/learn/theory" className="text-sm font-semibold text-link">← {l('Khóa nhạc lý', 'Theory course')}</Link>
      <section className="card flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Teacher mood={passed ? 'cheer' : 'wave'} size={72} />
          <div>
            <div className="label !mb-0">{l(UNITS.find((u) => u.id === lesson.unit)!.title)} · {l(`Bài ${index + 1}`, `Lesson ${index + 1}`)}</div>
            <h1 className="h-display mt-1 text-2xl font-bold">{l(lesson.title)}</h1>
          </div>
        </div>
        {lesson.body.map((p, i) => <p key={i} className="leading-relaxed text-ink-2">{l(p)}</p>)}
        {lesson.examples.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {lesson.examples.map((e, i) => <button key={i} type="button" className="btn" onClick={() => void play(e.sound)}>▶ {l(e.label)}</button>)}
          </div>
        )}
      </section>
      <section className="card flex flex-col gap-4">
        <h2 className="h-display text-xl font-bold">{l('Kiểm tra nhanh', 'Quick check')}</h2>
        {lesson.quiz.map((q, qi) => (
          <div key={qi} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 font-semibold">
              {l(q.q)}
              {q.sound && <button type="button" className="btn btn-sm" onClick={() => void play(q.sound)}>▶ {l('Nghe', 'Listen')}</button>}
            </div>
            <div className="flex flex-wrap gap-2">
              {q.options.map((o, oi) => {
                const chosen = answers[qi] === oi;
                const state = checked ? (oi === q.answer ? 'border-good bg-good/10' : chosen ? 'border-bad bg-bad/10' : 'border-line bg-surface-2') : chosen ? 'border-accent bg-accent/15' : 'border-line bg-surface-2';
                return (
                  <button key={oi} type="button" className={`min-h-11 rounded-xl border px-4 text-sm font-semibold ${state}`} onClick={() => { setChecked(false); setJustEarned(false); setAnswers({ ...answers, [qi]: oi }); }}>
                    {l(o)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-primary" disabled={Object.keys(answers).length < lesson.quiz.length} onClick={() => void check()}>{l('Kiểm tra', 'Check')}</button>
          {checked && (
            <span className={`flex items-center gap-2 font-semibold ${passed ? 'text-good-ink' : 'text-bad-ink'}`}>
              {passed && <Yumika mood="cheer" size={44} outfit={profile.settings.mascotOutfit ?? 'casual'} />}
              {passed ? (justEarned ? l(`Đúng hết! +${POINTS_PER_LESSON} điểm học tập`, `All right! +${POINTS_PER_LESSON} learning points`) : l('Đúng hết! (bài này đã tính điểm)', 'All right! (already counted)')) : l(`${correct}/${lesson.quiz.length} đúng — thử lại nhé`, `${correct}/${lesson.quiz.length} right — try again`)}
            </span>
          )}
        </div>
      </section>
      <div className="flex flex-wrap justify-between gap-3">
        {lesson.practice ? <Link className="btn" to={lesson.practice.to}>{l('Luyện ngay', 'Practise')}: {l(lesson.practice.label)}</Link> : <span />}
        {next ? <Link className="btn btn-primary" to={`/learn/theory/${next.id}`}>{l('Bài tiếp', 'Next lesson')} →</Link> : <Link className="btn btn-primary" to="/awards">{l('Xem chứng chỉ', 'See certificate')} →</Link>}
      </div>
    </div>
  );
}
