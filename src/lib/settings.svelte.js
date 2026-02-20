const STORAGE_KEY = 'snstudio_settings';

const defaults = {
  codeEditor: {
    maxCodeHistory: 10,
  },
  debug: false,
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        codeEditor: { ...defaults.codeEditor, ...parsed.codeEditor },
        debug: parsed.debug ?? defaults.debug,
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore write errors (e.g. private browsing quota)
  }
}
