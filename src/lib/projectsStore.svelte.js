const STORAGE_KEY = 'snstudio_projects';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore parse errors, fall back to defaults
  }
  return { projects: [] };
}

export const projectsList = $state(load());

export function persistProjectsList() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projectsList));
  } catch {
    // ignore write errors (e.g. private browsing quota)
  }
}

export function addProject(name = 'New Project') {
  const project = { id: crypto.randomUUID(), name };
  projectsList.projects = [...projectsList.projects, project];
  persistProjectsList();
  return project;
}

export function removeProject(projectId) {
  projectsList.projects = projectsList.projects.filter(p => p.id !== projectId);
  persistProjectsList();
  // Clean up project data from localStorage
  try {
    localStorage.removeItem(`snstudio_project_${projectId}`);
  } catch {
    // ignore
  }
}

export function renameProject(projectId, newName) {
  const project = projectsList.projects.find(p => p.id === projectId);
  if (project) {
    project.name = newName;
    persistProjectsList();
  }
}
