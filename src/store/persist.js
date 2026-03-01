// Single persistence layer. Today: localStorage. To switch to REST: replace bodies only.

const KEY_PROJECTS = 'snstudio_v2_projects';
const KEY_LIBRARY  = 'snstudio_v2_library';
const KEY_PROJECT  = (tag) => `snstudio_v2_project_${tag}`;

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
