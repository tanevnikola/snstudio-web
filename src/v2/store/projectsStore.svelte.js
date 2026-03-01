import { loadProjects, saveProjects, deleteProject, renameProject as renameProjectStorage } from './persist.js';

// projects: [{ tag }]
export const projectsList = $state({ projects: [] });

export async function initProjects() {
  const data = await loadProjects();
  if (data) Object.assign(projectsList, data);
}

// ── CRUD ───────────────────────────────────────────────────────

export async function addProject(tag) {
  if (projectsList.projects.some(p => p.tag === tag)) return null;
  const project = { tag };
  projectsList.projects = [...projectsList.projects, project];
  await saveProjects(projectsList);
  return project;
}

export async function removeProject(tag) {
  projectsList.projects = projectsList.projects.filter(p => p.tag !== tag);
  await saveProjects(projectsList);
  await deleteProject(tag);
}

export async function setProjectTag(oldTag, newTag) {
  if (oldTag === newTag || projectsList.projects.some(p => p.tag === newTag)) return;
  const p = projectsList.projects.find(p => p.tag === oldTag);
  if (!p) return;
  p.tag = newTag;
  projectsList.projects = [...projectsList.projects];
  await saveProjects(projectsList);
  await renameProjectStorage(oldTag, newTag);
}
