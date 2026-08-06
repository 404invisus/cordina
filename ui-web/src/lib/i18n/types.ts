export type Locale = 'en' | 'id';

export const LOCALES: Locale[] = ['en', 'id'];

export const DEFAULT_LOCALE: Locale = 'en';

export type Dict = Record<string, string>;

export type LocalizedDict = Record<Locale, Dict>;
