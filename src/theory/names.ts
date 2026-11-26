export type Lang = 'vi' | 'en';

/** A label in both UI languages. Music symbols (m3, Cmaj7, I–V–vi–IV) stay international. */
export interface Bilingual {
  vi: string;
  en: string;
}

export function localName(name: Bilingual, lang: string): string {
  return lang.startsWith('vi') ? name.vi : name.en;
}
