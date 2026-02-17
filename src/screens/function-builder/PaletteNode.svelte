<script>
  import PaletteNode from './PaletteNode.svelte';
  import { fetchSpec } from '../../lib/specApi.js';

  let { mnemonic, depth = 0, defaultCollapsed = true } = $props();

  let spec = $state(null);
  let loading = $state(true);
  let collapsed = $state(defaultCollapsed);

  $effect(() => {
    loading = true;
    spec = null;
    fetchSpec(mnemonic).then((s) => {
      spec = s;
      loading = false;
    }).catch(() => {
      loading = false;
    });
  });

  function shortName(m) {
    return m.replace(/^Task\./, '');
  }

  function onDragStart(e) {
    e.dataTransfer.setData('text/plain', mnemonic);
    e.dataTransfer.effectAllowed = 'copy';
  }
</script>

{#if loading}
  <div class="loading">...</div>
{:else if spec}
  {#if spec.category === 'ABSTRACT' && spec.implementations?.length}
    <div class="group">
      <button class="group-header" onclick={() => (collapsed = !collapsed)}>
        <span class="arrow">{collapsed ? '▶' : '▼'}</span>
        {shortName(spec.mnemonic)}
      </button>
      {#if !collapsed}
        <div class="group-children">
          {#each spec.implementations as impl (impl)}
            <PaletteNode mnemonic={impl} depth={depth + 1} />
          {/each}
        </div>
      {/if}
    </div>
  {:else if spec.category === 'CONCRETE'}
    <div
      class="palette-item"
      role="listitem"
      draggable="true"
      ondragstart={onDragStart}
    >
      {shortName(spec.mnemonic)}
    </div>
  {/if}
{/if}

<style>
  .loading {
    font-size: 0.7rem;
    color: #ccc;
    padding: 0.2rem 0.5rem;
  }

  .group {
    margin-bottom: 0.1rem;
  }

  .group-header {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    width: 100%;
    padding: 0.3rem 0.4rem;
    background: none;
    border: none;
    font-size: 0.8rem;
    font-weight: 600;
    color: #555;
    cursor: pointer;
    border-radius: 4px;
    text-align: left;
  }

  .group-header:hover {
    background: #eee;
  }

  .arrow {
    font-size: 0.55rem;
    width: 0.65rem;
  }

  .group-children {
    padding-left: 0.75rem;
  }

  .palette-item {
    padding: 0.3rem 0.5rem;
    margin: 0.1rem 0;
    font-size: 0.78rem;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: grab;
    user-select: none;
  }

  .palette-item:hover {
    border-color: #999;
    background: #f9f9f9;
  }

  .palette-item:active {
    cursor: grabbing;
  }
</style>
