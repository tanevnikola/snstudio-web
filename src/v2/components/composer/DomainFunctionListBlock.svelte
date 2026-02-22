<script>
  import DomainFunctionBlock from './DomainFunctionBlock.svelte';
  import { getDragHeight } from './dragState.js';

  let { yaml = [] } = $props();

  let items = $derived(Array.isArray(yaml) ? yaml : []);
  let dropIndex = $state(-1);
  let dragHeight = $state(0);
  let listEl;

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dragHeight = getDragHeight();

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
    dropIndex = -1;
  }
</script>

{#if items.length > 0}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="list"
    bind:this={listEl}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
  >
    {#each items as item, i (i)}
      {#if dropIndex === i}
        <div class="drop-placeholder" style="height: {dragHeight}px"></div>
      {/if}
      <DomainFunctionBlock yaml={item} />
    {/each}
    {#if dropIndex === items.length}
      <div class="drop-placeholder" style="height: {dragHeight}px"></div>
    {/if}
  </div>
{/if}

<style>
  .list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .drop-placeholder {
    border: 2px dashed #aaa;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.02);
  }
</style>
