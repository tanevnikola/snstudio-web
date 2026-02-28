/**
 * Composer state — two pointers into the same YAML tree:
 *   _fullYaml      : root owner, the full live DomainFunction object
 *   _selectionYaml : cursor, the sub-node currently selected by the user
 */

// ── State ─────────────────────────────────────────────────────────────────────

let _flush = null;         // serialization callback, registered by FunctionComposer
let _fullYaml = null;      // the full parsed DomainFunction tree (root)
let _selectionYaml = $state.raw(null); // the currently selected sub-node (cursor)
let _path = null;          // breadcrumb from root to cursor, used by refreshYaml

// ── Full yaml API ─────────────────────────────────────────────────────────────

/** Register the flush callback (called once by FunctionComposer on mount). */
export function registerFlush(fn) {
  _flush = fn;
}

/** Serialize and push changes after mutating the tree in place. */
export function flush() {
  _flush?.();
}

/** Update _fullYaml after each re-parse (called by FunctionComposer). */
export function setParsedTree(tree) {
  _fullYaml = tree;
}

export function getParsedTree() {
  return _fullYaml;
}

// ── Selection yaml API ────────────────────────────────────────────────────────

/**
 * Select a sub-node. Single entry point for both visual block selection and
 * YAML editor highlight. Only DomainFunctionBlock should call this.
 */
export function setSelectionYaml(yaml) {
  const found = findPath(_fullYaml, yaml);
  if (found !== null) _path = found;
  _selectionYaml = yaml;
}

export function getSelectionYaml() {
  return _selectionYaml;
}

/**
 * Re-point _selectionYaml at the equivalent node in a freshly parsed tree.
 * Called by FunctionComposer alongside setParsedTree after every flush.
 */
export function refreshYaml(tree) {
  if (!_path) return;
  const fresh = navigatePath(tree, _path);
  if (fresh !== undefined) _selectionYaml = fresh;
}

// ── Private helpers ───────────────────────────────────────────────────────────

/** DFS walk returning the key path to target, or null if not found. */
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

/** Follow a key path through the tree, returning undefined if any step is null. */
function navigatePath(tree, path) {
  let ref = tree;
  for (const key of path) {
    if (ref == null) return undefined;
    ref = ref[key];
  }
  return ref;
}
