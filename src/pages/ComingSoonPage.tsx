import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Section } from '../app/sections';

export function ComingSoonPage({ section }: { section: Section }) {
  const { t } = useTranslation();
  return (
    <div className="card mx-auto max-w-xl space-y-3 text-center">
      <h1 className="text-xl font-semibold">
        {t('comingSoon.title', { section: t(`sections.${section.key}.title`) })}
      </h1>
      <p className="text-muted">{t(`sections.${section.key}.body`)}</p>
      <p className="text-sm text-teal">{t('comingSoon.body', { n: section.phase })}</p>
      <Link to="/" className="btn">
        ← {t('comingSoon.back')}
      </Link>
    </div>
  );
}
