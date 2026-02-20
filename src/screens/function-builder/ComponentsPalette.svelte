<script>
  import PaletteNode from './PaletteNode.svelte';
  import { project, getAllFunctions } from '../../lib/projectStore.svelte.js';

  const roots = [
    { mnemonic: 'FlowTask', label: 'Flow' },
    { mnemonic: 'EffectTask', label: 'Effect' },
    { mnemonic: 'TransformTask', label: 'Transform' },
  ];

  let componentsCollapsed = $state(false);
  let functionsCollapsed = $state(false);
  let allFunctions = $derived(getAllFunctions());
  let collapsedDirs = $state({});
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

  <div class="section">
    <button class="section-header" onclick={() => (functionsCollapsed = !functionsCollapsed)}>
      <span class="section-arrow">{functionsCollapsed ? '▶' : '▼'}</span>
      <span class="section-title">Functions</span>
      <span class="section-count">{allFunctions.length}</span>
    </button>
    {#if !functionsCollapsed}
      {#snippet functionTree(items, depth, path)}
        {#each [...items].sort((a, b) => (a.type === 'directory' ? 0 : 1) - (b.type === 'directory' ? 0 : 1)) as item (item.id)}
          {#if item.type === 'directory'}
            <div class="group">
              <button
                class="group-header"
                onclick={() => { collapsedDirs[item.id] = !collapsedDirs[item.id]; }}
              >
                <span class="arrow">{collapsedDirs[item.id] ? '▶' : '▼'}</span>
                {item.name}
              </button>
              {#if !collapsedDirs[item.id]}
                <div class="group-children">
                  {@render functionTree(item.children || [], depth + 1, `${path}${item.name}/`)}
                </div>
              {/if}
            </div>
          {:else}
            <div
              class="palette-item"
              role="listitem"
              draggable="true"
              ondragstart={(e) => {
                e.dataTransfer.setData('text/plain', 'Inject.Configuration');
                e.dataTransfer.setData('application/x-function-path', `<actor>/functions/${path}${item.name}.yaml`);
                e.dataTransfer.effectAllowed = 'copy';
              }}
            ><span class="arrow-spacer"></span>{item.name}</div>
          {/if}
        {/each}
      {/snippet}

      {#if project.functions.length === 0}
        <div class="empty-hint">No functions defined</div>
      {:else}
        {@render functionTree(project.functions, 0, '')}
      {/if}
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
    color: #999;
    width: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .section-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .section-count {
    font-size: 0.65rem;
    color: #aaa;
    margin-left: auto;
  }

  .section-header:hover .section-title {
    color: #333;
  }

  .section-header:hover .section-arrow {
    color: #666;
  }

  .palette-item {
    display: flex;
    align-items: center;
    gap: 0.3rem;
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
    font-family: inherit;
  }

  .group-header:hover {
    background: #eee;
  }

  .arrow {
    font-size: 0.55rem;
    width: 0.65rem;
  }

  .arrow-spacer {
    display: inline-block;
    width: 0.65rem;
    flex-shrink: 0;
  }

  .group-children {
    padding-left: 0.75rem;
  }

  .empty-hint {
    padding: 0.3rem 0.5rem 0.3rem 1.25rem;
    font-size: 0.75rem;
    color: #aaa;
    font-style: italic;
  }
</style>
