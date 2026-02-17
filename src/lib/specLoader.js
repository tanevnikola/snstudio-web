import { fetchSpec } from './specApi.js';

/**
 * Recursively load ALL specs in the system starting from a root mnemonic.
 * Uses BFS traversal — fetches a spec, enqueues its implementations, repeats.
 * All specs end up warm in the specApi cache.
 *
 * @param {string} root - Starting mnemonic (e.g. 'Speck')
 * @param {(loaded: number, total: number) => void} [onProgress] - Progress callback
 * @returns {Promise<number>} Total number of specs loaded
 */
export async function loadAllSpecs(root = 'Speck', onProgress) {
  const visited = new Set();
  const queue = [root];
  let loaded = 0;
  let total = 1; // start with root

  while (queue.length > 0) {
    const batch = [];
    while (queue.length > 0 && batch.length < 10) {
      const m = queue.shift();
      if (visited.has(m)) continue;
      visited.add(m);
      batch.push(m);
    }

    if (batch.length === 0) continue;

    const results = await Promise.allSettled(
      batch.map(m => fetchSpec(m))
    );

    for (const result of results) {
      loaded++;
      if (result.status === 'fulfilled') {
        const spec = result.value;
        if (spec.implementations?.length) {
          for (const impl of spec.implementations) {
            if (!visited.has(impl)) {
              queue.push(impl);
              total++;
            }
          }
        }
      }
      onProgress?.(loaded, total);
    }

  }

  return loaded;
}
