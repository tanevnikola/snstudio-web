const STORAGE_KEY = "snstudio_settings";

const defaults = {
  theme: "dark",
  codeEditor: {
    maxCodeHistory: 10,
  },
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        theme: parsed.theme ?? defaults.theme,
        codeEditor: { ...defaults.codeEditor, ...parsed.codeEditor },
      };
    }
  } catch {
    // ignore parse errors, fall back to defaults
  }
  return structuredClone(defaults);
}

export const settings = $state(load());

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

// Apply saved theme immediately
applyTheme(settings.theme);

export function persistSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore write errors (e.g. private browsing quota)
  }
}
