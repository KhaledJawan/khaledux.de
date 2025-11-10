const ASSET_VERSION = '20240702';
const SUPPORTED_LANGS = ['de', 'en'];
const DEFAULT_LANG = 'de';
const FALLBACK_LANG = 'en';
const TRANSLATION_PATH = 'i18n';

const translationStore = {};
let currentLang = DEFAULT_LANG;

const getNestedValue = (object, path) => {
  return path.split('.').reduce((accumulator, key) => {
    if (accumulator && Object.prototype.hasOwnProperty.call(accumulator, key)) {
      return accumulator[key];
    }
    return undefined;
  }, object);
};

const applyTextTranslations = (lang) => {
  const fallback =
    translationStore[FALLBACK_LANG] ||
    translationStore[DEFAULT_LANG] ||
    {};
  const target = translationStore[lang] || fallback;

  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.getAttribute('data-i18n');
    const translated =
      getNestedValue(target, key) ?? getNestedValue(fallback, key);
    if (translated !== undefined) {
      element.innerHTML = translated;
    }
  });

  document.querySelectorAll('[data-i18n-attr]').forEach((element) => {
    const mappings = element
      .getAttribute('data-i18n-attr')
      .split(';')
      .map((item) => item.trim())
      .filter(Boolean);

    mappings.forEach((mapping) => {
      const [attr, key] = mapping.split(':').map((part) => part.trim());
      if (!attr || !key) {
        return;
      }
      const translated =
        getNestedValue(target, key) ?? getNestedValue(fallback, key);
      if (translated !== undefined) {
        element.setAttribute(attr, translated);
      }
    });
  });

  const pageTitle =
    getNestedValue(target, 'meta.title') ??
    getNestedValue(fallback, 'meta.title');
  if (pageTitle) {
    document.title = pageTitle;
  }

  const langLabel = document.getElementById('langLabel');
  if (langLabel) {
    langLabel.textContent = lang === 'en' ? 'DE' : 'EN';
  }
};

const handleToggleClick = (event) => {
  event.preventDefault();
  currentLang = currentLang === 'de' ? 'en' : 'de';
  localStorage.setItem('preferredLanguage', currentLang);
  applyTextTranslations(currentLang);
};

const bindToggle = () => {
  const toggle = document.getElementById('langToggle');
  if (!toggle) {
    return;
  }
  toggle.removeEventListener('click', handleToggleClick);
  toggle.addEventListener('click', handleToggleClick);
};

const loadTranslations = async () => {
  await Promise.all(
    SUPPORTED_LANGS.map(async (lang) => {
      if (translationStore[lang]) return;
      try {
        const response = await fetch(
          `${TRANSLATION_PATH}/${lang}.json?v=${ASSET_VERSION}`
        );
        if (!response.ok) {
          throw new Error(`Failed to load translation for ${lang}`);
        }
        translationStore[lang] = await response.json();
      } catch (error) {
        console.error(error);
      }
    })
  );
};

const getInitialLanguage = () => {
  const stored = localStorage.getItem('preferredLanguage');
  if (stored && SUPPORTED_LANGS.includes(stored)) {
    return stored;
  }

  return DEFAULT_LANG;
};

const initTranslations = async () => {
  await loadTranslations();

  currentLang = getInitialLanguage();
  if (!translationStore[currentLang]) {
    currentLang = DEFAULT_LANG;
  }
  localStorage.setItem('preferredLanguage', currentLang);
  applyTextTranslations(currentLang);

  bindToggle();
};

document.addEventListener('DOMContentLoaded', initTranslations);
document.addEventListener('swup:contentReplaced', () => {
  applyTextTranslations(currentLang);
  bindToggle();
});
document.addEventListener('contentReplaced', () => {
  applyTextTranslations(currentLang);
  bindToggle();
});
