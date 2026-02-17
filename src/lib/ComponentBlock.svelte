<script>
  import DropZone from './DropZone.svelte';
  import ComponentBlock from './ComponentBlock.svelte';
  import { isNestedParam, fetchSpec, createNode, unregisterNode } from './specApi.js';

  let { node, selectedId, onselect } = $props();

  let collapsed = $state(false);

  let nestedParams = $derived(
    Object.values(node.spec.parameters).filter(isNestedParam)
  );

  let selected = $derived(selectedId === node.id);

  async function handleDrop(droppedMnemonic, paramName) {
    try {
      const spec = await fetchSpec(droppedMnemonic);
      const child = createNode(droppedMnemonic, spec);
      const param = node.spec.parameters[paramName];

      if (!node.children[paramName]) {
        node.children[paramName] = [];
      }

      if (param.injectionStrategy === 'DIRECT') {
        if (node.children[paramName].length) {
          unregisterDeep(node.children[paramName][0]);
        }
        node.children[paramName] = [child];
      } else {
        node.children[paramName] = [...node.children[paramName], child];
      }
    } catch (e) {
      console.error('Failed to drop component:', e);
    }
  }

  function removeChild(paramName, index) {
    const removed = node.children[paramName][index];
    if (removed) unregisterDeep(removed);
    node.children[paramName] = node.children[paramName].filter((_, i) => i !== index);
  }

  function unregisterDeep(n) {
    unregisterNode(n.id);
    for (const kids of Object.values(n.children)) {
      for (const kid of kids) {
        unregisterDeep(kid);
      }
    }
  }
</script>

<div class="component">
  <div class="block-row">
    <button
      class="collapse-btn"
      onclick={() => (collapsed = !collapsed)}
      title={collapsed ? 'Expand' : 'Collapse'}
    >
      {collapsed ? '▶' : '▼'}
    </button>
    <button
      class="block"
      class:selected
      onclick={() => onselect?.(node.id)}
    >
      <span class="mnemonic">{node.mnemonic}</span>
      <span class="stereotype">{node.spec.implementsStereotype}</span>
    </button>
  </div>

  {#if !collapsed}
    {#each nestedParams as param (param.name)}
      <div class="nested-section">
        <span class="param-label">{param.name}:</span>
        {#if node.children[param.name]?.length}
          {#each node.children[param.name] as child, i (child.id)}
            <div class="nested-child">
              <ComponentBlock
                node={child}
                {selectedId}
                {onselect}
              />
              <button class="remove-child" onclick={() => removeChild(param.name, i)}>✕</button>
            </div>
          {/each}
        {/if}
        {#if param.injectionStrategy === 'COLLECTION' || !node.children[param.name]?.length}
          <DropZone
            paramName={param.name}
            acceptedMnemonic={param.mnemonic}
            ondrop={handleDrop}
          />
        {/if}
      </div>
    {/each}
  {/if}
</div>

<style>
  .component {
    margin-bottom: 0.25rem;
  }

  .block-row {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .collapse-btn {
    background: none;
    border: none;
    font-size: 0.6rem;
    color: #999;
    cursor: pointer;
    padding: 0.3rem;
    line-height: 1;
    flex-shrink: 0;
  }

  .collapse-btn:hover {
    color: #333;
  }

  .block {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
    padding: 0.6rem 1rem;
    background: white;
    border: 2px solid #ddd;
    border-radius: 6px;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    font-size: inherit;
  }

  .block:hover {
    border-color: #bbb;
  }

  .block.selected {
    border-color: #4a90d9;
    background: #f0f6ff;
  }

  .mnemonic {
    font-weight: 600;
    font-size: 0.9rem;
  }

  .stereotype {
    font-size: 0.7rem;
    color: #666;
    background: #eee;
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
  }

  .nested-section {
    margin-left: 1.5rem;
    margin-top: 0.25rem;
    padding-left: 0.75rem;
    border-left: 2px solid #e0e0e0;
  }

  .param-label {
    font-size: 0.75rem;
    color: #888;
    display: block;
    margin-bottom: 0.15rem;
  }

  .nested-child {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .nested-child :global(.component) {
    flex: 1;
  }

  .remove-child {
    background: none;
    border: none;
    font-size: 0.75rem;
    color: #ccc;
    cursor: pointer;
    padding: 0.3rem;
    line-height: 1;
    flex-shrink: 0;
  }

  .remove-child:hover {
    color: #d32f2f;
  }
</style>
