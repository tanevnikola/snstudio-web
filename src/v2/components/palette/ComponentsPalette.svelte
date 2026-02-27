<script>
  import PaletteNode from './PaletteNode.svelte';

  const roots = [
    { mnemonic: 'FlowTask', label: 'Flow' },
    { mnemonic: 'EffectTask', label: 'Effect' },
    { mnemonic: 'TransformTask', label: 'Transform' },
  ];

  let componentsCollapsed = $state(false);
</script>

<div class="palette">
  <div class="section">
    <button class="section-header" onclick={() => (componentsCollapsed = !componentsCollapsed)}>
      <span class="section-arrow">{componentsCollapsed ? '▶' : '▼'}</span>
      <span class="section-title">Components</span>
      <span class="section-count">{roots.length}</span>
    </button>
    {#if !componentsCollapsed}
      {#each roots as root (root.mnemonic)}
        <PaletteNode mnemonic={root.mnemonic} depth={0} defaultCollapsed={false} />
      {/each}
    {/if}
  </div>
</div>

<style>
  .palette {
    padding: 0.75rem;
    overflow-y: auto;
  }

  .section {
    margin-bottom: 0.75rem;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    width: 100%;
    font-family: inherit;
  }

  .section-arrow {
    font-size: 0.5rem;
    color: var(--text-muted);
    width: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .section-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .section-count {
    font-size: 0.65rem;
    color: var(--text-muted);
    margin-left: auto;
  }

  .section-header:hover .section-title {
    color: var(--text-primary);
  }

  .section-header:hover .section-arrow {
    color: var(--text-secondary);
  }
</style>
