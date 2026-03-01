import { createFn } from './function.js';
import { loadProject, saveProject } from './persist.js';

function createDefaultProject() {
  return { actors: {} };
}

let _currentTag = $state(null);

// project: { actors: { [name]: { actorYaml, functions: { [name]: FunctionEntry } } } }
export const project = $state(createDefaultProject());

// UI selection — not persisted
export const selection = $state({
  actorName: null,
  functionName: null,
  functionScope: null, // 'library' | 'actor'
});

export function getCurrentTag() {
  return _currentTag;
}

export async function openProject(tag) {
  _currentTag = tag;
  const data = await loadProject(tag);
  Object.assign(project, data ?? createDefaultProject());
}

export function closeProject() {
  _currentTag = null;
  Object.assign(project, createDefaultProject());
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
  project.actors[name] = { actorYaml: null, functions: {} };
  project.actors = { ...project.actors };
  persist();
}

export function removeActor(name) {
  if (selection.actorName === name) {
    selection.actorName = null;
    selection.functionName = null;
    selection.functionScope = null;
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

// ── Actor function CRUD ────────────────────────────────────────

export function addActorFunction(actorName, fnName) {
  const actor = project.actors[actorName];
  if (!actor || fnName in actor.functions) return;
  actor.functions[fnName] = createFn();
  actor.functions = { ...actor.functions };
  persist();
}

export function removeActorFunction(actorName, fnName) {
  const actor = project.actors[actorName];
  if (!actor) return;
  if (selection.functionName === fnName && selection.actorName === actorName) {
    selection.functionName = null;
    selection.functionScope = null;
  }
  delete actor.functions[fnName];
  actor.functions = { ...actor.functions };
  persist();
}

export function renameActorFunction(actorName, oldName, newName) {
  const actor = project.actors[actorName];
  if (!actor || oldName === newName || newName in actor.functions) return;
  actor.functions[newName] = actor.functions[oldName];
  delete actor.functions[oldName];
  actor.functions = { ...actor.functions };
  if (selection.functionName === oldName && selection.actorName === actorName) {
    selection.functionName = newName;
  }
  persist();
}

export function updateActorFunctionYaml(actorName, fnName, yaml) {
  const actor = project.actors[actorName];
  if (!actor?.functions[fnName]) return;
  actor.functions[fnName].yaml = yaml;
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

export function selectActorFunction(actorName, fnName) {
  selection.actorName = actorName;
  selection.functionName = fnName;
  selection.functionScope = 'actor';
}

export function clearSelection() {
  selection.actorName = null;
  selection.functionName = null;
  selection.functionScope = null;
}
