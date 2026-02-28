/** Shared selection state for composer components. */
import { getParsedTree } from './composerState.js';

let _ondeselect = null;

/** The yaml object of the currently selected task. Raw (not deep-proxied). */
let _yaml = $state.raw(null);

/** The yaml object of the selected task (for highlighting in editor). */
let _taskRef = $state.raw(null);

/** Path from the root parsed tree to the selected node (array of keys/indices). */
let _path = $state.raw(null);

function findPath(tree, target, path = []) {
  if (tree === target) return path;
  if (!tree || typeof tree !== 'object') return null;
  if (Array.isArray(tree)) {
    for (let i = 0; i < tree.length; i++) {
      const result = findPath(tree[i], target, [...path, i]);
      if (result !== null) return result;
    }
  } else {
    for (const key of Object.keys(tree)) {
      const result = findPath(tree[key], target, [...path, key]);
      if (result !== null) return result;
    }
  }
  return null;
}

/**
 * Select a task. Deselects the previous one via callback.
 * @param {Function} ondeselect - called when this task gets deselected
 */
export function select(ondeselect) {
  _ondeselect?.();
  _ondeselect = ondeselect;
}

/** Deselect the current selection. */
export function deselect() {
  _ondeselect?.();
  _ondeselect = null;
  _yaml = null;
  _taskRef = null;
  _path = null;
}

/** Set the yaml reference of the selected task. Computes and stores path into the
 *  parsed tree. If yaml is not found in the tree (e.g. a detached spread), the
 *  existing path is preserved so highlight survives property edits. */
export function setSelectionYaml(yaml) {
  const found = findPath(getParsedTree(), yaml);
  if (found !== null) _path = found;
  _yaml = yaml;
}

/** Get the yaml reference of the selected task. */
export function getSelectionYaml() {
  return _yaml;
}

/** Get the path from the root tree to the selected node. */
export function getSelectionPath() {
  return _path;
}
