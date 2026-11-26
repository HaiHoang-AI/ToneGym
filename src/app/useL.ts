import { useTranslation } from 'react-i18next';
import type { Bilingual } from '../theory';

/** Inline bilingual text: `l('Xin chào', 'Hello')` or `l({ vi, en })`. */
export function useL() {
  const { i18n } = useTranslation();
  const vi = i18n.language.startsWith('vi');
  return Object.assign(
    (a: string | Bilingual, en?: string) => (typeof a === 'string' ? (vi ? a : (en ?? a)) : vi ? a.vi : a.en),
    { lang: vi ? 'vi' : 'en' },
  );
}
