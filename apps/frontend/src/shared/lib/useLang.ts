import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGS, type AppLang } from '../../i18n';

export function useLang() {
  const { i18n } = useTranslation();
  const current = (i18n.language as AppLang) ?? 'uk';

  function change(lang: AppLang) {
    i18n.changeLanguage(lang);
  }

  return { current, change, supported: SUPPORTED_LANGS };
}
