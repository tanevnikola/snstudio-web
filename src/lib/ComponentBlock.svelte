<script>
  import DropZone from './DropZone.svelte';
  import ComponentBlock from './ComponentBlock.svelte';
  import { isNestedParam, fetchSpec, createNode, getNode, addChild, removeChild, detachNode } from './specApi.js';

  let { nodeId, selectedId, onselect, onchange, treeTick = 0 } = $props();

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

  // Does this DF use `tasks` (chain sugar) instead of singular `task`?
  let hasTasks = $derived(isDomainFunction && (getNode(nodeId)?.children['tasks']?.length ?? 0) > 0);

  let nestedParams = $derived.by(() => {
    if (!displayNode) return [];
    return Object.values(displayNode.spec.parameters).filter(isNestedParam);
  });

  let selected = $derived(selectedId === nodeId);

  // Reactive values snapshot — re-read from registry when treeTick changes.
  // Used for any property shown on the card (trace, and future additions).
  let dfValues = $derived.by(() => {
    void treeTick;
    return isDomainFunction ? getNode(nodeId)?.values ?? {} : {};
  });
  let trace = $derived(dfValues['trace'] || null);

  // Reactive snapshot of children — refreshes when treeTick changes
  let childrenSnapshot = $derived.by(() => {
    void treeTick; // re-run when treeTick changes
    const n = getNode(nodeId);
    if (isDomainFunction) {
      const taskKids = n?.children['task'];
      const innerTask = taskKids?.[0];
      const inner = innerTask ? { ...innerTask.children } : {};
      if (n?.children['tasks']?.length) {
        inner['tasks'] = n.children['tasks'];
      }
      return inner;
    } else {
      return n ? { ...n.children } : {};
    }
  });

  async function handleDrop(droppedMnemonic, paramName, sourceNodeId) {
    try {
      // `tasks` param lives on the DomainFunction itself, not the inner task
      const targetNodeId = (isDomainFunction && paramName !== 'tasks')
        ? getNode(nodeId)?.children['task']?.[0]?.id
        : nodeId;
      if (!targetNodeId) return;

      if (sourceNodeId) {
        // Move existing node — prevent dropping onto self or own descendant
        if (sourceNodeId === targetNodeId) return;
        const movedNode = getNode(sourceNodeId);
        if (!movedNode) return;
        detachNode(sourceNodeId);
        addChild(targetNodeId, paramName, movedNode);
      } else {
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
      }
      onchange?.();
    } catch (e) {
      console.error('Failed to drop component:', e);
    }
  }

  async function handleTaskDrop(droppedMnemonic, _paramName, sourceNodeId) {
    // Drop a task onto a DomainFunction that has no task yet
    try {
      if (sourceNodeId) {
        const movedNode = getNode(sourceNodeId);
        if (!movedNode) return;
        detachNode(sourceNodeId);
        addChild(nodeId, 'task', movedNode);
      } else {
        const spec = await fetchSpec(droppedMnemonic);
        const child = createNode(droppedMnemonic, spec);
        addChild(nodeId, 'task', child);
      }
      onchange?.();
    } catch (e) {
      console.error('Failed to drop task:', e);
    }
  }

  function handleRemoveChild(paramName, index) {
    const targetNodeId = (isDomainFunction && paramName !== 'tasks')
      ? getNode(nodeId)?.children['task']?.[0]?.id
      : nodeId;
    if (!targetNodeId) return;

    removeChild(targetNodeId, paramName, index);
    onchange?.();
  }

  function handleChildChange() {
    onchange?.();
  }

  function onBlockDragStart(e) {
    e.dataTransfer.setData('text/plain', node.mnemonic);
    e.dataTransfer.setData('application/x-node-id', nodeId);
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
  }
</script>

{#if node}
<div class="component">
  {#if isDomainFunction && !displayNode && !hasTasks}
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
      ondrop={(mnemonic, _param, sourceNodeId) => handleTaskDrop(mnemonic, _param, sourceNodeId)}
    />
  {:else if isDomainFunction && !displayNode && hasTasks}
    <!-- DomainFunction with tasks → render as Task.Chain -->
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
        onclick={() => onselect?.(nodeId)}
      >
        <span
          class="drag-handle"
          draggable="true"
          ondragstart={onBlockDragStart}
          role="img"
          aria-label="Drag to move"
        >⠿</span>
        <span class="mnemonic">Task.Chain</span>
        <span class="stereotype">FlowTask</span>
        {#if trace}
          <span class="trace">{trace}</span>
        {/if}
      </button>
    </div>

    {#if !collapsed}
      <div class="nested-section">
        {#if childrenSnapshot['tasks']?.length}
          {#each childrenSnapshot['tasks'] as child, i (child.id)}
            <div class="nested-child">
              <ComponentBlock
                nodeId={child.id}
                {selectedId}
                {onselect}
                {treeTick}
                onchange={handleChildChange}
              />
              <button class="remove-child" onclick={() => handleRemoveChild('tasks', i)}>✕</button>
            </div>
          {/each}
        {/if}
        <DropZone
          paramName="tasks"
          acceptedMnemonic="DomainFunction"
          ondrop={handleDrop}
        />
      </div>
    {/if}
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
      {:else}
        <span class="collapse-btn placeholder" aria-hidden="true"></span>
      {/if}
      <button
        class="block"
        class:selected
        onclick={() => onselect?.(nodeId)}
      >
        <span
          class="drag-handle"
          draggable="true"
          ondragstart={onBlockDragStart}
          role="img"
          aria-label="Drag to move"
        >⠿</span>
        <span class="mnemonic">{displayNode.mnemonic}</span>
        <span class="stereotype">{displayNode.spec.implementsStereotype}</span>
        {#if trace}
          <span class="trace">{trace}</span>
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
                  {treeTick}
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
    width: 1.2rem;
    text-align: center;
    box-sizing: border-box;
  }

  .collapse-btn:hover {
    color: #333;
  }

  .collapse-btn.placeholder {
    visibility: hidden;
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

  .drag-handle {
    cursor: grab;
    color: #bbb;
    font-size: 0.85rem;
    line-height: 1;
    user-select: none;
    flex-shrink: 0;
  }

  .drag-handle:hover {
    color: #666;
  }

  .drag-handle:active {
    cursor: grabbing;
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
