import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProfile } from '../app/ProfileContext';
import { SECTIONS } from '../app/sections';

export function HomePage() {
  const { t } = useTranslation();
  const profile = useProfile();

  return (
    <div className="space-y-8">
      <section className="card relative overflow-hidden">
        <div className="max-w-2xl space-y-3">
          <p className="text-sm font-medium text-teal">{t('app.tagline')}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{t('home.greeting', { name: profile.name })}</h1>
          <p className="text-muted">{t('home.intro')}</p>
          <Link to="/sound" className="btn btn-primary mt-2">
            {t('home.soundCta')} →
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">{t('home.roadmapTitle')}</h2>
          <p className="text-sm text-muted">{t('home.roadmapNote')}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <Link
              key={s.key}
              to={s.path}
              className="card flex flex-col gap-2 transition hover:border-accent/50"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">{t(`sections.${s.key}.title`)}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    s.ready ? 'bg-good/15 text-good' : 'bg-surface-2 text-muted'
                  }`}
                >
                  {s.ready ? '✓' : t('common.phase', { n: s.phase })}
                </span>
              </div>
              <p className="text-sm text-muted">{t(`sections.${s.key}.body`)}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
