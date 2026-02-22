/** Shared selection state for composer components. */
let _ondeselect = null;

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
}
