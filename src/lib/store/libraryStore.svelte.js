import {createFn} from './function.js';
import {loadLibrary, saveLibrary} from './persist.js';

// functions: { [path/name]: FunctionEntry }
// e.g. { "myFunc": { yaml }, "utils/helper": { yaml } }
export const library = $state({ functions: {} });

export async function initLibrary() {
  const data = await loadLibrary();
  if (data) Object.assign(library, data);
}

function persist() {
  saveLibrary(library);
}

// ── CRUD ───────────────────────────────────────────────────────

export function addFunction(key) {
  if (key in library.functions) return;
  library.functions[key] = createFn();
  persist();
}

export function removeFunction(key) {
  delete library.functions[key];
  library.functions = { ...library.functions };
  persist();
}

export function renameFunction(oldKey, newKey) {
  if (oldKey === newKey || newKey in library.functions) return;
  library.functions[newKey] = library.functions[oldKey];
  delete library.functions[oldKey];
  library.functions = { ...library.functions };
  persist();
}

export function moveFunction(oldKey, newKey) {
  renameFunction(oldKey, newKey);
}

export function updateFunctionYaml(key, yaml) {
  if (!(key in library.functions)) return;
  library.functions[key].yaml = yaml;
  persist();
}

// ── Helpers ────────────────────────────────────────────────────

export function keysUnderPath(path) {
  const prefix = path + '/';
  return Object.keys(library.functions).filter(k => k === path || k.startsWith(prefix));
}

export function topLevelSegments() {
  const segments = new Set();
  for (const key of Object.keys(library.functions)) {
    segments.add(key.split('/')[0]);
  }
  return [...segments];
}
