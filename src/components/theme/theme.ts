export type ThemeMode = 'light' | 'system' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'wyp-theme-mode';

export const themeModes: ThemeMode[] = ['light', 'system', 'dark'];

export const isThemeMode = (value: unknown): value is ThemeMode => {
  return typeof value === 'string' && themeModes.includes(value as ThemeMode);
};

export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var storageKey = '${THEME_STORAGE_KEY}';
    var savedMode = window.localStorage.getItem(storageKey);
    var mode = savedMode === 'light' || savedMode === 'dark' || savedMode === 'system' ? savedMode : 'system';
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = mode === 'dark' || (mode === 'system' && prefersDark) ? 'dark' : 'light';
    var root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.themeMode = mode;
    root.style.colorScheme = theme;
  } catch (error) {
    document.documentElement.dataset.theme = 'light';
    document.documentElement.dataset.themeMode = 'system';
    document.documentElement.style.colorScheme = 'light';
  }
})();
`;
