const STORAGE_KEY = 'snstudio_settings';

const defaults = {
  codeEditor: {
    maxCodeHistory: 10,
  },
};

function load() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        codeEditor: { ...defaults.codeEditor, ...parsed.codeEditor },
      };
    }
  } catch {
    // ignore parse errors, fall back to defaults
  }
  return structuredClone(defaults);
}

export const settings = $state(load());

export function persistSettings() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore write errors (e.g. private browsing quota)
  }
}
