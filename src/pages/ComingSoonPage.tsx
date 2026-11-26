import { Link } from 'react-router-dom';
import { useL } from '../app/useL';
import type { Section } from '../app/sections';
import { Teacher } from '../components/art/Characters';

export function ComingSoonPage({ section }: { section: Section }) {
  const l = useL();
  return (
    <div className="card mx-auto flex max-w-xl flex-col items-center gap-3 text-center">
      <Teacher mood="wave" size={110} />
      <h1 className="h-display text-2xl font-bold">{l(`${section.name.vi} — sắp có`, `${section.name.en} — coming soon`)}</h1>
      <p className="text-muted">{l(section.description)}</p>
      <p className="text-sm text-link">{l(`Phần này sẽ có ở giai đoạn ${section.phase}.`, `This part arrives in phase ${section.phase}.`)}</p>
      <Link to="/" className="btn">← {l('Về Gym', 'Back to the Gym')}</Link>
    </div>
  );
}
