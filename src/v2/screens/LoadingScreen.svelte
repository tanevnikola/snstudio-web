<script>
  import { fetchSpec } from '../mnemoUtils.js';

  let { onready } = $props();

  let loaded = $state(0);
  let total = $state(0);
  let error = $state(null);

  async function fetchAllSpecs(onProgress) {
    const roots = [
      'Speck', 'Object',
      'int', 'long', 'double', 'float', 'boolean', 'byte',
      'int[]', 'long[]', 'double[]', 'float[]', 'boolean[]', 'byte[]',
    ];
    const visited = new Set();
    const queue = [...roots];
    let l = 0;
    let t = roots.length;

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
              t++;
            }
          }
        }
      } catch { /* skip failed */ }

      l++;
      onProgress?.(l, t);
      await new Promise(r => setTimeout(r, 0));
    }
  }

  $effect(() => {
    fetchAllSpecs((l, t) => {
      loaded = l;
      total = t;
    })
      .then(() => onready?.())
      .catch((e) => {
        error = e.message;
      });
  });
</script>

<div class="loading-screen">
  <div class="content">
    <h1 class="title">SwarmNet Studio</h1>
    {#if error}
      <div class="error">
        <p>Failed to load specifications</p>
        <p class="error-detail">{error}</p>
        <button class="retry-btn" onclick={() => location.reload()}>Retry</button>
      </div>
    {:else}
      <div class="progress-area">
        <div class="progress-bar">
          <div
            class="progress-fill"
            style="width: {total > 0 ? (loaded / total) * 100 : 0}%"
          ></div>
        </div>
        <p class="progress-text">
          Loading specs{#if total > 0}... ({loaded}/{total}){/if}
        </p>
      </div>
    {/if}
  </div>
</div>

<style>
  .loading-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: var(--surface-1);
    font-family: system-ui, -apple-system, sans-serif;
  }

  .content {
    text-align: center;
    width: 320px;
  }

  .title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 2rem 0;
  }

  .progress-area {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .progress-bar {
    height: 4px;
    background: var(--border-default);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--primary);
    border-radius: 2px;
    transition: none;
  }

  .progress-text {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin: 0;
  }

  .error {
    color: var(--danger);
  }

  .error p {
    margin: 0.25rem 0;
  }

  .error-detail {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  .retry-btn {
    margin-top: 1rem;
    padding: 0.5rem 1.5rem;
    border: 1px solid var(--border-default);
    border-radius: 4px;
    background: var(--surface-2);
    color: var(--text-primary);
    cursor: pointer;
    font-size: 0.85rem;
  }

  .retry-btn:hover {
    background: var(--surface-3);
  }
</style>
