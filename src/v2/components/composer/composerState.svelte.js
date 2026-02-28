/**
 * Composer state — two pointers into the same YAML tree:
 *   _fullYaml      : root owner, the full live DomainFunction object
 *   _selectionYaml : cursor, the sub-node currently selected by the user
 */

// ── State ─────────────────────────────────────────────────────────────────────

let _flush = null;         // serialization callback, registered by FunctionComposer
let _fullYaml = $state.raw(null); // the full parsed DomainFunction tree (root)
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

// ── Exported: collectors ──────────────────────────────────────────────────────

/**
 * Collect all param keys visible to any given yaml node from its ancestors.
 * Works for any block regardless of whether it is currently selected.
 * Only ancestor params are included — the node's own params are excluded.
 * Innermost ancestor takes precedence on duplicate keys.
 * @param {object} yaml - the yaml reference owned by the block (e.g. the `yaml` prop)
 * @returns {string[]}
 */
export function collectParamsInScopeFor(yaml) {
  if (!_fullYaml) return [];
  const path = findPath(_fullYaml, yaml);
  if (!path?.length) return [];
  const keys = new Set();
  const ancestors = [_fullYaml];
  let ref = _fullYaml;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    ref = ref?.[key];
    if (ref == null) break;
    if (key !== 'v' && key !== 'task' && key !== 'tasks' && isDomainFunction(ref)) {
      ancestors.push(ref);
    }
  }
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const node = ancestors[i];
    const v = node.v ?? node;
    if (v.params && typeof v.params === 'object' && !Array.isArray(v.params)) {
      for (const key of Object.keys(v.params)) keys.add(key);
    }
  }
  return [...keys];
}

// ── Private: ancestor / upstream traversal ────────────────────────────────────

/** Returns true if a node is a DomainFunction item (has task or tasks directly). */
function isDomainFunction(node) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return false;
  return 'task' in node || 'tasks' in node || node.t === 'DomainFunction';
}

/**
 * Walk from the immediate parent of the current selection toward the root,
 * calling visitor(node) for each DomainFunction ancestor (innermost first).
 * The selection itself is excluded. No-op when the root is selected.
 *
 * @param {(node: {task?: object, tasks?: any[], params?: object, [key: string]: any}) => void} visitor
 */
function walkAncestors(visitor) {
  if (!_path?.length || !_fullYaml) return;
  const ancestors = [_fullYaml];
  let ref = _fullYaml;
  // Navigate path stopping one step short of the selection
  for (let i = 0; i < _path.length - 1; i++) {
    const key = _path[i];
    ref = ref?.[key];
    if (ref == null) return;
    // Structural keys ('v', 'task', 'tasks') navigate inside a DomainFunction;
    // any other key reaching a DomainFunction-shaped node is a nested function param.
    if (key !== 'v' && key !== 'task' && key !== 'tasks' && isDomainFunction(ref)) {
      ancestors.push(ref);
    }
  }
  for (let i = ancestors.length - 1; i >= 0; i--) {
    visitor(ancestors[i]);
  }
}

/**
 * Walk all DomainFunction nodes that precede the selection in execution order:
 * siblings before the selection in its collection (nearest first), then the
 * containing DomainFunction, then its prior siblings, then the grandparent, etc.
 * Visits from innermost collection level outward.
 *
 * @param {(node: {task?: object, tasks?: any[], params?: object, [key: string]: any}) => void} visitor
 */
function walkUpstream(visitor) {
  if (!_path?.length || !_fullYaml) return;
  const frames = []; // { array, index, container: nearest ancestor DomainFunction }
  let ref = _fullYaml;
  let container = _fullYaml;
  for (let i = 0; i < _path.length; i++) {
    const key = _path[i];
    if (Array.isArray(ref) && typeof key === 'number') {
      frames.push({ array: ref, index: key, container });
    }
    ref = ref?.[key];
    if (ref == null) break;
    if (key !== 'v' && key !== 'task' && key !== 'tasks' && isDomainFunction(ref)) {
      container = ref;
    }
  }
  for (let f = frames.length - 1; f >= 0; f--) {
    const { array, index } = frames[f];
    for (let i = index - 1; i >= 0; i--) {
      visitor(array[i]);
    }
    visitor(frames[f].container);
  }
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
