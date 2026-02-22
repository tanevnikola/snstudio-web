<script>
  import DomainFunctionBlock from './DomainFunctionBlock.svelte';
  import { getDragHeight, getDragItem, removeSource, clearDragItem, flush } from './dragState.js';

  let { yaml = [] } = $props();

  let items = $derived(Array.isArray(yaml) ? yaml : []);
  let dropIndex = $state(-1);
  let dragHeight = $state(0);
  let listEl;

  function isPaletteDrag(e) {
    return !getDragItem() && e.dataTransfer.types.includes('text/plain');
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = getDragItem() ? 'move' : 'copy';
    dragHeight = getDragItem() ? getDragHeight() : 32;

    const children = [...listEl.children].filter(el => !el.classList.contains('drop-placeholder'));
    if (children.length === 0) { dropIndex = 0; return; }

    let idx = children.length;
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (e.clientY < mid) {
        idx = i;
        break;
      }
    }
    dropIndex = idx;
  }

  function handleDragLeave(e) {
    if (!listEl.contains(e.relatedTarget)) {
      dropIndex = -1;
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    const item = getDragItem();
    if (item && dropIndex >= 0) {
      removeSource();
      yaml.splice(dropIndex, 0, item);
      flush();
    } else if (!item && dropIndex >= 0) {
      const mnemonic = e.dataTransfer.getData('text/plain');
      if (mnemonic) {
        const newItem = { v: { task: { t: mnemonic, v: {} } } };
        yaml.splice(dropIndex, 0, newItem);
        flush();
      }
    }
    dropIndex = -1;
    clearDragItem();
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="list"
  bind:this={listEl}
  ondragenter={(e) => e.preventDefault()}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
>
  {#each items as item, i (i)}
    {#if dropIndex === i}
      <div class="drop-placeholder" style="height: {dragHeight}px"></div>
    {/if}
    <DomainFunctionBlock yaml={item} onremove={() => { yaml.splice(i, 1); }} />
  {/each}
  {#if dropIndex === items.length}
    <div class="drop-placeholder" style="height: {dragHeight}px"></div>
  {/if}
</div>

<style>
  .list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-height: 0.5rem;
  }

  .drop-placeholder {
    border: 2px dashed #aaa;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.02);
  }
</style>
