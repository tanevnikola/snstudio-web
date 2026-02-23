<script>
  import ConfirmDeleteButton from '../ConfirmDeleteButton.svelte';
  import DomainFunctionBlock from './DomainFunctionBlock.svelte';
  import DomainFunctionMapBlock from './DomainFunctionMapBlock.svelte';
  import DomainFunctionListBlock from './DomainFunctionListBlock.svelte';
  import { fetchSpec } from '../../../lib/specApi.js';
  import { setDragHeight, setDragItem, setRemoveSource, clearDragItem, flush } from './dragState.js';
  import { select, setSelectionYaml } from './selectionState.svelte.js';

  let { yaml = {}, detail = '', parent = null, onremove = () => {}, ondragstart = (/** @type {DragEvent} */ _e) => {}, ondragend = (/** @type {DragEvent} */ _e) => {} } = $props();

  let taskEl;
  let selected = $state(false);
  let dragging = $state(false);

  function handleDragStart(e) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/x-reorder', '');
    e.dataTransfer.setDragImage(taskEl, 0, 0);
    setDragHeight(taskEl.offsetHeight);
    setDragItem(parent ?? yaml);
    setRemoveSource(onremove);
    dragging = true;
    ondragstart(e);
  }

  function handleClick(e) {
    e.stopPropagation();
    selected = true;
    select(() => { selected = false; });
    setSelectionYaml(parent ?? yaml);
  }

  // Re-push fresh references into selection when props change after re-parse
  $effect(() => {
    if (selected) {
      setSelectionYaml(parent ?? yaml);
    }
  });

  let mnemonic = $derived(yaml?.t ?? '');
  let mnemonicSpec = $state(null);
  let collapsed = $state(false);

  $effect(() => {
    const m = mnemonic;
    if (!m) { mnemonicSpec = null; return; }
    fetchSpec(m).then(spec => {
      if (mnemonic === m) mnemonicSpec = spec;
    }).catch(() => {
      if (mnemonic === m) mnemonicSpec = null;
    });
  });

  let domainFunctionParams = $derived.by(() => {
    if (!mnemonicSpec?.parameters) return [];
    return Object.entries(mnemonicSpec.parameters)
      .filter(([, param]) => param.mnemonic === 'DomainFunction')
      .map(([name, param]) => ({ name, ...param }));
  });

  function getParamYaml(param) {
    if (param.name === '@delegating@') {
      return yaml?.v;
    }
    if (yaml?.v && param.injectionStrategy === 'COLLECTION' && !Array.isArray(yaml.v[param.name])) {
      yaml.v[param.name] = [];
    }
    return yaml?.v?.[param.name];
  }

</script>

<div
  class="task"
  class:has-children={domainFunctionParams.length > 0}
  class:collapsed
  class:dragging
>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="header"
    onclick={handleClick}
    bind:this={taskEl}
  >
    <button class="collapse-btn" class:hidden={domainFunctionParams.length === 0} onclick={(e) => { e.stopPropagation(); collapsed = !collapsed; }}>
      <span class="chevron">&#9662;</span>
    </button>
    <div class="block" style="border: 2px solid {selected ? '#4a90d9' : '#e0e0e0'}">
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="drag-handle"
        draggable="true"
        ondragstart={handleDragStart}
        ondragend={(e) => { dragging = false; clearDragItem(); ondragend(e); }}
        onclick={(e) => e.stopPropagation()}
      >&#9783;</div>
      <div class="delete">
        <ConfirmDeleteButton onclick={() => { onremove(); flush(); }} />
      </div>
      <div class="info">
        <span class="title">{mnemonic}</span>
        {#if detail}
          <span class="detail">{detail}</span>
        {/if}
      </div>
    </div>
  </div>

  {#if !collapsed}
    {#each domainFunctionParams as param (param.name)}
      <div class="children" class:named={param.name !== '@delegating@'}>
        {#if param.name !== '@delegating@'}
          <span class="param-label">{param.name}</span>
        {/if}
        <div class="children-content">
          {#if param.injectionStrategy === 'DIRECT'}
            <DomainFunctionBlock yaml={getParamYaml(param)} onremove={() => { if (param.name === '@delegating@') { yaml.v = null; } else { delete yaml.v[param.name]; } }} />
          {:else if param.injectionStrategy === 'MAP'}
            <DomainFunctionMapBlock yaml={getParamYaml(param)} />
          {:else if param.injectionStrategy === 'COLLECTION'}
            <DomainFunctionListBlock yaml={getParamYaml(param)} />
          {/if}
        </div>
      </div>
    {/each}
  {/if}
</div>

<style>
  .task {
    position: relative;
  }

  .task.dragging {
    opacity: 0.4;
  }

  .header {
    display: flex;
    align-items: stretch;
    cursor: pointer;
  }

  .drag-handle {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    border-right: 1px solid #e0e0e0;
    cursor: grab;
    color: #bbb;
    font-size: 0.85rem;
    user-select: none;
  }

  .drag-handle:hover {
    color: #777;
    background: #f5f5f5;
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .block {
    display: flex;
    align-items: stretch;
    background: white;
    border-radius: 6px;
    overflow: hidden;
    flex: 1;
    min-width: 0;
  }


  .collapse-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    flex-shrink: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 0;
    color: #999;
    font-size: 0.7rem;
  }

  .collapse-btn.hidden {
    visibility: hidden;
  }

  .collapse-btn:hover {
    color: #555;
  }

  .chevron {
    display: inline-block;
    transition: transform 0.15s ease;
  }

  .task.collapsed .chevron {
    transform: rotate(-90deg);
  }

  .delete {
    display: flex;
    flex-shrink: 0;
    border-right: 1px solid #e0e0e0;
    padding: 0 0.4rem;
    align-items: center;
  }

  .info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
    padding: 0.5rem 0.75rem;
  }

  .title {
    font-size: 0.85rem;
    font-weight: 600;
    color: #222;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .detail {
    font-size: 0.7rem;
    color: #888;
    background: #f0f0f0;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .task.has-children::after {
    content: '';
    position: absolute;
    left: 0.7rem;
    top: 100%;
    height: 0;
    width: 2px;
    background: #d0d0d0;
    border-radius: 1px;
  }

  .task.has-children:not(.collapsed)::after {
    top: 2rem;
    bottom: 0;
    height: auto;
  }

  .children {
    margin-top: 0.25rem;
    margin-left: 2rem;
  }

  .children.named + .children {
    margin-top: 0.5rem;
  }

  .children.named {
    margin-top: 0.6rem;
    position: relative;
    border: 1px dashed #ccc;
    border-radius: 6px;
    padding: 0.5rem;
  }

  .param-label {
    position: absolute;
    top: -0.55rem;
    left: 0.5rem;
    background: white;
    padding: 0 0.3rem;
    font-size: 0.65rem;
    font-weight: 600;
    color: #888;
  }
</style>
