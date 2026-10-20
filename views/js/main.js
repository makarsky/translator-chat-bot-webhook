const themeStorageKey = 'translator-chat-bot-theme';
const root = document.documentElement;
const themeToggle = document.querySelector('#theme-toggle');
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
let systemColorScheme;

try {
  systemColorScheme = window.matchMedia('(prefers-color-scheme: dark)');
} catch {
  systemColorScheme = undefined;
}

const isTheme = (theme) => theme === 'light' || theme === 'dark';
let hasSavedTheme = false;
let hasSessionOverride = false;

try {
  const savedTheme = localStorage.getItem(themeStorageKey);
  if (isTheme(savedTheme)) {
    root.dataset.theme = savedTheme;
    hasSavedTheme = true;
  } else {
    root.removeAttribute('data-theme');
  }
} catch {
  hasSessionOverride = isTheme(root.dataset.theme);
}

const getSystemTheme = () => (systemColorScheme?.matches ? 'dark' : 'light');
const getCurrentTheme = () =>
  isTheme(root.dataset.theme) ? root.dataset.theme : getSystemTheme();

function updateThemeControl() {
  const isDark = getCurrentTheme() === 'dark';
  themeToggle?.setAttribute('aria-pressed', String(isDark));
  if (themeColorMeta) {
    themeColorMeta.content = isDark ? '#121916' : '#f7f9f8';
  }
}

themeToggle?.addEventListener('click', () => {
  const nextTheme = getCurrentTheme() === 'dark' ? 'light' : 'dark';
  root.dataset.theme = nextTheme;
  hasSessionOverride = true;

  try {
    localStorage.setItem(themeStorageKey, nextTheme);
    hasSavedTheme = true;
    hasSessionOverride = false;
  } catch {
    hasSavedTheme = false;
    hasSessionOverride = true;
  }

  updateThemeControl();
});

systemColorScheme?.addEventListener('change', () => {
  if (!hasSavedTheme && !hasSessionOverride) {
    updateThemeControl();
  }
});

updateThemeControl();

window.onload = function () {
  let query = window.location.search;

  if (!query) {
    query = '?start=organic';
  }

  Array.from(document.querySelectorAll('a.telegram')).forEach((l) => {
    l.href += query;
  });
};
