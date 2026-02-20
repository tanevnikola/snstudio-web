import { fetchSpec } from './specApi.js';

/**
 * Recursively load ALL specs in the system starting from one or more root mnemonics.
 * Uses BFS traversal — fetches a spec, enqueues its implementations, repeats.
 * All specs end up warm in the specApi cache.
 *
 * @param {string|string[]} roots - Starting mnemonic(s) (e.g. 'Speck' or ['Speck', 'ResourceInjector'])
 * @param {(loaded: number, total: number) => void} [onProgress] - Progress callback
 * @returns {Promise<number>} Total number of specs loaded
 */
export async function loadAllSpecs(roots = ['Speck', 'Object'], onProgress) {
  const seedList = Array.isArray(roots) ? roots : [roots];
  const visited = new Set();
  const queue = [...seedList];
  let loaded = 0;
  let total = seedList.length;

  while (queue.length > 0) {
    const m = queue.shift();
    if (visited.has(m)) continue;
    visited.add(m);

    try {
      const spec = await fetchSpec(m);
      if (spec.implementations?.length) {
        for (const impl of spec.implementations) {
          if (!visited.has(impl)) {
            queue.push(impl);
            total++;
          }
        }
      }
    } catch { /* skip failed */ }

    loaded++;
    onProgress?.(loaded, total);
    await new Promise(r => setTimeout(r, 1));
  }

  return loaded;
}
