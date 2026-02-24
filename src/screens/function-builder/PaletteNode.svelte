<script>
  import PaletteNode from './PaletteNode.svelte';
  import DocsPopover from '../../v2/components/DocsPopover.svelte';
  import { fetchSpec } from '../../lib/specApi.js';

  let { mnemonic, depth = 0, defaultCollapsed = true } = $props();

  let spec = $state(null);
  let loading = $state(true);
  let collapsed = $state(defaultCollapsed);
  let showDocs = $state(false);
  let pinned = $state(false);
  let hoverTimer = null;

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

  function onIconEnter() {
    clearTimeout(hoverTimer);
    if (!pinned) showDocs = true;
  }

  function onIconLeave() {
    if (!pinned) {
      hoverTimer = setTimeout(() => { showDocs = false; }, 200);
    }
  }

  function onPopoverEnter() {
    clearTimeout(hoverTimer);
  }

  function onPopoverLeave() {
    if (!pinned) {
      hoverTimer = setTimeout(() => { showDocs = false; }, 200);
    }
  }

  function onIconClick(e) {
    e.stopPropagation();
    e.preventDefault();
    pinned = true;
    showDocs = true;
  }

  function closeDocs() {
    showDocs = false;
    pinned = false;
    clearTimeout(hoverTimer);
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
      <span class="arrow-spacer"></span>
      <span
        class="info-icon"
        title="Documentation"
        role="button"
        tabindex="-1"
        onmouseenter={onIconEnter}
        onmouseleave={onIconLeave}
        onclick={onIconClick}
        ondragstart={(e) => e.stopPropagation()}
        draggable="false"
      >i</span>
      <span class="item-name">{shortName(spec.mnemonic)}</span>
    </div>
    {#if showDocs}
      <DocsPopover
        url="/docs/autogen.md?target={mnemonic}"
        title={mnemonic}
        {pinned}
        onclose={closeDocs}
        onmouseenter={onPopoverEnter}
        onmouseleave={onPopoverLeave}
      />
    {/if}
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

  .arrow-spacer {
    display: inline-block;
    width: 0.65rem;
    flex-shrink: 0;
  }

  .item-name {
    flex: 1;
    min-width: 0;
  }

  .info-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #ddd;
    color: #777;
    font-size: 0.5rem;
    font-style: italic;
    font-family: Georgia, serif;
    font-weight: 700;
    cursor: pointer;
    line-height: 1;
    opacity: 0;
    transition: opacity 0.12s;
  }

  .palette-item:hover .info-icon {
    opacity: 1;
  }

  .info-icon:hover {
    background: #ccc;
    color: #444;
  }

  .palette-item:hover {
    border-color: #999;
    background: #f9f9f9;
  }

  .palette-item:active {
    cursor: grabbing;
  }
</style>
