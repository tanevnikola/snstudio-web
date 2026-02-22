/** Shared drag state for composer components. */
let _dragHeight = 0;
let _flush = null;
let _dragItem = null;
let _removeSource = null;

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

/** Store a callback that removes the dragged item from its source. */
export function setRemoveSource(fn) {
  _removeSource = fn;
}

/** Call to remove the dragged item from its source location. */
export function removeSource() {
  _removeSource?.();
}
