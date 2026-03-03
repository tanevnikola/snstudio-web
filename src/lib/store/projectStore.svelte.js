import {createFn} from './function.js';
import {loadProject, saveProject} from './persist.js';

let _currentTag = $state(null);

// project: {
//   actors:    { [name]: { actorYaml } },
//   functions: { [name]: FunctionEntry }
// }
export const project = $state({ actors: {}, functions: {} });

// UI selection — not persisted
export const selection = $state({
  actorName: null,
  functionName: null,
  functionScope: null, // 'library' | 'project'
});

export function getCurrentTag() {
  return _currentTag;
}

export async function openProject(tag) {
  _currentTag = tag;
  const data = await loadProject(tag);
  Object.assign(project, data ?? { actors: {}, functions: {} });
}

export function closeProject() {
  _currentTag = null;
  Object.assign(project, { actors: {}, functions: {} });
  selection.actorName = null;
  selection.functionName = null;
  selection.functionScope = null;
}

function persist() {
  if (!_currentTag) return;
  saveProject(_currentTag, project);
}

// ── Actor CRUD ─────────────────────────────────────────────────

export function addActor(name) {
  if (name in project.actors) return;
  project.actors[name] = { actorYaml: null };
  project.actors = { ...project.actors };
  persist();
}

export function removeActor(name) {
  if (selection.actorName === name) {
    selection.actorName = null;
  }
  delete project.actors[name];
  project.actors = { ...project.actors };
  persist();
}

export function renameActor(oldName, newName) {
  if (oldName === newName || newName in project.actors) return;
  project.actors[newName] = project.actors[oldName];
  delete project.actors[oldName];
  project.actors = { ...project.actors };
  if (selection.actorName === oldName) selection.actorName = newName;
  persist();
}

export function updateActorYaml(actorName, yaml) {
  const actor = project.actors[actorName];
  if (!actor) return;
  actor.actorYaml = yaml;
  persist();
}

// ── Project function CRUD ──────────────────────────────────────

export function addFunction(name) {
  if (name in project.functions) return;
  project.functions[name] = createFn();
  project.functions = { ...project.functions };
  persist();
}

export function removeFunction(name) {
  if (selection.functionName === name && selection.functionScope === 'project') {
    selection.functionName = null;
    selection.functionScope = null;
  }
  delete project.functions[name];
  project.functions = { ...project.functions };
  persist();
}

export function renameFunction(oldName, newName) {
  if (oldName === newName || newName in project.functions) return;
  project.functions[newName] = project.functions[oldName];
  delete project.functions[oldName];
  project.functions = { ...project.functions };
  if (selection.functionName === oldName && selection.functionScope === 'project') {
    selection.functionName = newName;
  }
  persist();
}

export function updateFunctionYaml(name, yaml) {
  if (!(name in project.functions)) return;
  project.functions[name].yaml = yaml;
  persist();
}

// ── Selection ──────────────────────────────────────────────────

export function selectActor(actorName) {
  selection.actorName = actorName;
  selection.functionName = null;
  selection.functionScope = null;
}

export function selectLibraryFunction(fnName) {
  selection.functionName = fnName;
  selection.functionScope = 'library';
  selection.actorName = null;
}

export function selectProjectFunction(fnName) {
  selection.functionName = fnName;
  selection.functionScope = 'project';
  selection.actorName = null;
}

export function clearSelection() {
  selection.actorName = null;
  selection.functionName = null;
  selection.functionScope = null;
}
