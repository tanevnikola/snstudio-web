// Single persistence layer. Today: localStorage. To switch to REST: replace bodies only.

const KEY_PROJECTS = 'snstudio_projects';
const KEY_LIBRARY  = 'snstudio_library';
const KEY_PROJECT  = (tag) => `snstudio_project_${tag}`;

// ── Migration from old v2-prefixed keys ────────────────────────

const OLD_KEY_PROJECTS = 'snstudio_v2_projects';
const OLD_KEY_LIBRARY  = 'snstudio_v2_library';
const OLD_KEY_PROJECT  = (tag) => `snstudio_v2_project_${tag}`;

export function migrateFromV2Keys() {
  try {
    // Migrate projects list
    if (!localStorage.getItem(KEY_PROJECTS) && localStorage.getItem(OLD_KEY_PROJECTS)) {
      localStorage.setItem(KEY_PROJECTS, localStorage.getItem(OLD_KEY_PROJECTS));
      localStorage.removeItem(OLD_KEY_PROJECTS);
    }
    // Migrate library
    if (!localStorage.getItem(KEY_LIBRARY) && localStorage.getItem(OLD_KEY_LIBRARY)) {
      localStorage.setItem(KEY_LIBRARY, localStorage.getItem(OLD_KEY_LIBRARY));
      localStorage.removeItem(OLD_KEY_LIBRARY);
    }
    // Migrate individual project data
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('snstudio_v2_project_')) {
        const tag = key.slice('snstudio_v2_project_'.length);
        const newKey = KEY_PROJECT(tag);
        if (!localStorage.getItem(newKey)) {
          localStorage.setItem(newKey, localStorage.getItem(key));
        }
        localStorage.removeItem(key);
      }
    }
  } catch { /* ignore */ }
}

// ── Projects list ──────────────────────────────────────────────

export async function loadProjects() {
  try {
    const raw = localStorage.getItem(KEY_PROJECTS);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

export async function saveProjects(data) {
  try { localStorage.setItem(KEY_PROJECTS, JSON.stringify(data)); } catch { /* ignore */ }
}

// ── Project ────────────────────────────────────────────────────

export async function loadProject(tag) {
  try {
    const raw = localStorage.getItem(KEY_PROJECT(tag));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

export async function saveProject(tag, data) {
  try { localStorage.setItem(KEY_PROJECT(tag), JSON.stringify(data)); } catch { /* ignore */ }
}

export async function deleteProject(tag) {
  try { localStorage.removeItem(KEY_PROJECT(tag)); } catch { /* ignore */ }
}

export async function renameProject(oldTag, newTag) {
  const data = await loadProject(oldTag);
  if (data) await saveProject(newTag, data);
  await deleteProject(oldTag);
}

// ── Library ────────────────────────────────────────────────────

export async function loadLibrary() {
  try {
    const raw = localStorage.getItem(KEY_LIBRARY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

export async function saveLibrary(data) {
  try { localStorage.setItem(KEY_LIBRARY, JSON.stringify(data)); } catch { /* ignore */ }
}
