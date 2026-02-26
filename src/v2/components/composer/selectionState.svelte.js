/** Shared selection state for composer components. */
let _ondeselect = null;

/** The yaml object of the currently selected task. Raw (not deep-proxied). */
let _yaml = $state.raw(null);

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
}

/** Set the yaml reference of the selected task. */
export function setSelectionYaml(yaml) {
  _yaml = yaml;
}

/** Get the yaml reference of the selected task. */
export function getSelectionYaml() {
  return _yaml;
}
