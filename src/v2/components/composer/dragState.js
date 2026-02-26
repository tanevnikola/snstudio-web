/** Shared drag state for composer components. */
let _dragHeight = 0;
let _flush = null;
let _dragItem = null;
let _removeSource = null;
let _parsed = null;

export function setDragHeight(h) {
  _dragHeight = h;
}

export function getDragHeight() {
  return _dragHeight;
}

/** Register the flush callback (called by FunctionComposer). */
export function registerFlush(fn) {
  _flush = fn;
}

/** Call after mutating the yaml tree to serialize and push changes. */
export function flush() {
  _flush?.();
}

/** Store the yaml object reference of the item being dragged. */
export function setDragItem(item) {
  _dragItem = item;
}

export function getDragItem() {
  return _dragItem;
}

export function clearDragItem() {
  _dragItem = null;
  _removeSource = null;
}

/**
 * Check if the dragged item is the container itself or a descendant of it.
 * Used to prevent dropping an item into itself or its ancestors.
 */
export function isDragDescendant(containerYaml) {
  if (!_dragItem) return false;
  return containsRef(_dragItem, containerYaml);
}

function containsRef(node, target) {
  if (node === target) return true;
  if (Array.isArray(node)) return node.some(child => containsRef(child, target));
  if (node?.task) return containsRef(node.task, target);
  if (node?.v && typeof node.v === 'object') return containsRef(node.v, target);
  if (typeof node === 'object' && node !== null) {
    return Object.values(node).some(v => typeof v === 'object' && v !== null && containsRef(v, target));
  }
  return false;
}

/** Store a callback that removes the dragged item from its source. */
export function setRemoveSource(fn) {
  _removeSource = fn;
}

/** Call to remove the dragged item from its source location. */
export function removeSource() {
  _removeSource?.();
}

/** Store the parsed yaml tree (called by FunctionComposer). */
export function setParsedTree(tree) {
  _parsed = tree;
}

/** Get the parsed yaml tree. */
export function getParsedTree() {
  return _parsed;
}
