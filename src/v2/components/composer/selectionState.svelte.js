/** Shared selection state for composer components. */
let _ondeselect = null;

/** The yaml object of the currently selected task. Raw (not deep-proxied). */
let _yaml = $state.raw(null);

/** Whether the selected task has unsaved changes. */
let _dirty = $state(false);

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
  _dirty = false;
}

/** Set the yaml reference of the selected task. */
export function setSelectionYaml(yaml) {
  _yaml = yaml;
  _dirty = false;
}

/** Get the yaml reference of the selected task. */
export function getSelectionYaml() {
  return _yaml;
}

/** Mark the selection as having unsaved changes. */
export function markDirty() {
  _dirty = true;
}

/** Clear the dirty flag (after saving). */
export function clearDirty() {
  _dirty = false;
}

/** Check if the selection has unsaved changes. */
export function isDirty() {
  return _dirty;
}
