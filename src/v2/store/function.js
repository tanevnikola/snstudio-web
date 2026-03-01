/**
 * A function entry. Key in its parent map is the function name
 * (or "path/name" for library functions).
 *
 * @typedef {{ yaml: object | null }} FunctionEntry
 */

export function createFn() {
  return {
    yaml: {
      t: 'DomainFunction',
      v: {
        task: {
          t: 'Task.Chain',
          v: [],
        },
      },
    },
  };
}
