/** Shared composer tree state — the parsed YAML tree and its serialization. */
let _flush = null;
let _parsed = null;

/** Register the flush callback (called by FunctionComposer). */
export function registerFlush(fn) {
  _flush = fn;
}

/** Call after mutating the yaml tree to serialize and push changes. */
export function flush() {
  _flush?.();
}

/** Store the parsed yaml tree (called by FunctionComposer). */
export function setParsedTree(tree) {
  _parsed = tree;
}

/** Get the parsed yaml tree. */
export function getParsedTree() {
  return _parsed;
}
