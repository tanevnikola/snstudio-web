<script>
  import DropZone from './DropZone.svelte';
  import ComponentBlock from './ComponentBlock.svelte';
  import { isNestedParam, fetchSpec, createNode, getNode, addChild, removeChild } from './specApi.js';

  let { nodeId, selectedId, onselect, onchange } = $props();

  let collapsed = $state(false);

  // Read from registry — plain object, no proxy mutation issues
  const node = getNode(nodeId);

  const isDomainFunction = node?.mnemonic === 'DomainFunction';

  // For DomainFunction: look through to the inner task
  // For other nodes: use self
  let displayNode = $derived.by(() => {
    if (!isDomainFunction) return node;
    const taskKids = getNode(nodeId)?.children['task'];
    return taskKids?.[0] ?? null;
  });

  let nestedParams = $derived.by(() => {
    if (!displayNode) return [];
    return Object.values(displayNode.spec.parameters).filter(isNestedParam);
  });

  let selected = $derived(selectedId === nodeId);

  // Reactive snapshot of children — from the display node (the inner task)
  let childrenSnapshot = $state({});

  function refreshChildren() {
    // Re-read display node's children from registry
    const n = getNode(nodeId);
    if (isDomainFunction) {
      const taskKids = n?.children['task'];
      const innerTask = taskKids?.[0];
      childrenSnapshot = innerTask ? { ...innerTask.children } : {};
    } else {
      childrenSnapshot = n ? { ...n.children } : {};
    }
  }

  // Initialize
  refreshChildren();

  async function handleDrop(droppedMnemonic, paramName) {
    try {
      const targetNodeId = isDomainFunction
        ? getNode(nodeId)?.children['task']?.[0]?.id
        : nodeId;
      if (!targetNodeId) return;

      const targetNode = getNode(targetNodeId);
      const param = targetNode?.spec.parameters[paramName];

      // If the drop zone expects DomainFunction but a task was dropped, auto-wrap
      if (param?.mnemonic === 'DomainFunction' && droppedMnemonic !== 'DomainFunction') {
        const dfSpec = await fetchSpec('DomainFunction');
        const dfNode = createNode('DomainFunction', dfSpec);
        const taskSpec = await fetchSpec(droppedMnemonic);
        const taskNode = createNode(droppedMnemonic, taskSpec);
        addChild(dfNode.id, 'task', taskNode);
        addChild(targetNodeId, paramName, dfNode);
      } else {
        const spec = await fetchSpec(droppedMnemonic);
        const child = createNode(droppedMnemonic, spec);
        addChild(targetNodeId, paramName, child);
      }
      refreshChildren();
      queueMicrotask(() => onchange?.());
    } catch (e) {
      console.error('Failed to drop component:', e);
    }
  }

  async function handleTaskDrop(droppedMnemonic) {
    // Drop a task onto a DomainFunction that has no task yet
    try {
      const spec = await fetchSpec(droppedMnemonic);
      const child = createNode(droppedMnemonic, spec);
      addChild(nodeId, 'task', child);
      refreshChildren();
      queueMicrotask(() => onchange?.());
    } catch (e) {
      console.error('Failed to drop task:', e);
    }
  }

  function handleRemoveChild(paramName, index) {
    const targetNodeId = isDomainFunction
      ? getNode(nodeId)?.children['task']?.[0]?.id
      : nodeId;
    if (!targetNodeId) return;

    removeChild(targetNodeId, paramName, index);
    refreshChildren();
    queueMicrotask(() => onchange?.());
  }

  function handleChildChange() {
    refreshChildren();
    onchange?.();
  }
</script>

{#if node}
<div class="component">
  {#if isDomainFunction && !displayNode}
    <!-- DomainFunction with no task yet — show drop zone for task -->
    <div class="block-row">
      <button
        class="block empty-df"
        class:selected
        onclick={() => onselect?.(nodeId)}
      >
        <span class="mnemonic">DomainFunction</span>
        <span class="hint">drop a task</span>
      </button>
    </div>
    <DropZone
      paramName="task"
      acceptedMnemonic="DomainTask"
      ondrop={(mnemonic, _param) => handleTaskDrop(mnemonic)}
    />
  {:else if displayNode}
    <div class="block-row">
      {#if nestedParams.length > 0}
        <button
          class="collapse-btn"
          onclick={() => (collapsed = !collapsed)}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '▶' : '▼'}
        </button>
      {/if}
      <button
        class="block"
        class:selected
        onclick={() => onselect?.(nodeId)}
      >
        <span class="mnemonic">{displayNode.mnemonic}</span>
        <span class="stereotype">{displayNode.spec.implementsStereotype}</span>
        {#if isDomainFunction}
          {#if getNode(nodeId)?.values['trace']}
            <span class="trace">{getNode(nodeId).values['trace']}</span>
          {/if}
        {/if}
      </button>
    </div>

    {#if !collapsed}
      {#each nestedParams as param (param.name)}
        <div class="nested-section">
          {#if param.name !== '@delegating@'}
            <span class="param-label">{param.name}:</span>
          {/if}
          {#if childrenSnapshot[param.name]?.length}
            {#each childrenSnapshot[param.name] as child, i (child.id)}
              <div class="nested-child">
                <ComponentBlock
                  nodeId={child.id}
                  {selectedId}
                  {onselect}
                  onchange={handleChildChange}
                />
                <button class="remove-child" onclick={() => handleRemoveChild(param.name, i)}>✕</button>
              </div>
            {/each}
          {/if}
          {#if param.injectionStrategy === 'COLLECTION' || !childrenSnapshot[param.name]?.length}
            <DropZone
              paramName={param.name}
              acceptedMnemonic={param.mnemonic}
              ondrop={handleDrop}
            />
          {/if}
        </div>
      {/each}
    {/if}
  {/if}
</div>
{/if}

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

  .block.empty-df {
    border-style: dashed;
    color: #999;
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

  .trace {
    font-size: 0.7rem;
    color: #888;
    font-style: italic;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .hint {
    font-size: 0.75rem;
    color: #bbb;
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
