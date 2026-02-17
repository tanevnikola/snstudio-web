<script>
  import DropZone from '../../lib/components/DropZone.svelte';
  import ComponentBlock from './ComponentBlock.svelte';
  import { isNestedParam, fetchSpec, createNode, getNode, addChild, insertChild, removeChild, detachNode, moveChild } from '../../lib/specApi.js';

  let { nodeId, selectedId, onselect, onchange, treeTick = 0, listIndex = -1, listSize = 0, onmoveup, onmovedown, onremove, listParentId = null, listParamName = null } = $props();

  let inList = $derived(listIndex >= 0 && listSize > 1);
  let canMoveUp = $derived(listIndex > 0);
  let canMoveDown = $derived(listIndex < listSize - 1);

  // Drag-to-reorder state
  let dropIndicator = $state(null); // 'before' | 'after' | null
  let dragging = $state(false);

  function handleReorderDragOver(e) {
    if (!inList) return;
    if (!e.dataTransfer.types.includes('application/x-node-id')) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    dropIndicator = e.clientY < midY ? 'before' : 'after';
  }

  function handleReorderDragLeave(e) {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    dropIndicator = null;
  }

  function handleReorderDrop(e) {
    if (!inList || !listParentId || !listParamName) return;
    const sourceNodeId = e.dataTransfer.getData('application/x-node-id');
    if (!sourceNodeId || sourceNodeId === nodeId) {
      dropIndicator = null;
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const position = dropIndicator;
    dropIndicator = null;

    const movedNode = getNode(sourceNodeId);
    if (!movedNode) return;

    detachNode(sourceNodeId);
    const parent = getNode(listParentId);
    const kids = parent?.children[listParamName] || [];
    let targetIdx = kids.findIndex(k => k.id === nodeId);
    if (targetIdx === -1) targetIdx = kids.length;
    const insertIdx = position === 'after' ? targetIdx + 1 : targetIdx;
    insertChild(listParentId, listParamName, insertIdx, movedNode);
    onchange?.();
  }

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
  let hasTasks = $derived(isDomainFunction && 'tasks' in (getNode(nodeId)?.children ?? {}));

  let nestedParams = $derived.by(() => {
    if (!displayNode) return [];
    return Object.values(displayNode.spec.parameters)
      .filter(isNestedParam)
      .sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
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

  function handleMoveChild(paramName, index, delta) {
    const targetNodeId = (isDomainFunction && paramName !== 'tasks')
      ? getNode(nodeId)?.children['task']?.[0]?.id
      : nodeId;
    if (!targetNodeId) return;
    moveChild(targetNodeId, paramName, index, delta);
    onchange?.();
  }

  function onBlockDragStart(e) {
    e.dataTransfer.setData('text/plain', node.mnemonic);
    e.dataTransfer.setData('application/x-node-id', nodeId);
    // Store the block-row height for drop indicator sizing
    const blockRow = e.currentTarget.closest('.block-row');
    if (blockRow) {
      const h = blockRow.getBoundingClientRect().height;
      e.dataTransfer.setData('application/x-drag-height', String(h));
      document.documentElement.style.setProperty('--drag-height', h + 'px');
    }
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
    requestAnimationFrame(() => { dragging = true; });
  }

  function onBlockDragEnd() {
    dragging = false;
  }
</script>

{#if node}
<div
  class="component"
  class:dragging
  class:drop-before={dropIndicator === 'before'}
  class:drop-after={dropIndicator === 'after'}
  ondragover={handleReorderDragOver}
  ondragleave={handleReorderDragLeave}
  ondrop={handleReorderDrop}
>
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
        draggable="true"
        ondragstart={onBlockDragStart}
        ondragend={onBlockDragEnd}
        onclick={() => onselect?.(nodeId)}
      >
        {#if onremove}
          <button class="close-btn" onclick={(e) => { e.stopPropagation(); onremove?.(); }} title="Remove">✕</button>
        {/if}
        <span class="block-content">
          {#if inList}
            <span class="order-btns">
              <button class="order-btn" disabled={!canMoveUp} onclick={(e) => { e.stopPropagation(); onmoveup?.(); }} title="Move up">▲</button>
              <button class="order-btn" disabled={!canMoveDown} onclick={(e) => { e.stopPropagation(); onmovedown?.(); }} title="Move down">▼</button>
            </span>
          {/if}
          <span class="mnemonic">Task.Chain</span>
          <span class="stereotype">FlowTask</span>
          {#if trace}
            <span class="trace">{trace}</span>
          {/if}
        </span>
      </button>
    </div>

    {#if !collapsed}
      <div class="nested-section">
        {#if childrenSnapshot['tasks']?.length}
          {#each childrenSnapshot['tasks'] as child, i (child.id)}
            <ComponentBlock
              nodeId={child.id}
              {selectedId}
              {onselect}
              {treeTick}
              onchange={handleChildChange}
              listIndex={i}
              listSize={childrenSnapshot['tasks'].length}
              onmoveup={() => handleMoveChild('tasks', i, -1)}
              onmovedown={() => handleMoveChild('tasks', i, 1)}
              onremove={() => handleRemoveChild('tasks', i)}
              listParentId={nodeId}
              listParamName="tasks"
            />
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
        draggable="true"
        ondragstart={onBlockDragStart}
        ondragend={onBlockDragEnd}
        onclick={() => onselect?.(nodeId)}
      >
        {#if onremove}
          <button class="close-btn" onclick={(e) => { e.stopPropagation(); onremove?.(); }} title="Remove">✕</button>
        {/if}
        <span class="block-content">
          {#if inList}
            <span class="order-btns">
              <button class="order-btn" disabled={!canMoveUp} onclick={(e) => { e.stopPropagation(); onmoveup?.(); }} title="Move up">▲</button>
              <button class="order-btn" disabled={!canMoveDown} onclick={(e) => { e.stopPropagation(); onmovedown?.(); }} title="Move down">▼</button>
            </span>
          {/if}
          <span class="mnemonic">{displayNode.mnemonic}</span>
          <span class="stereotype">{displayNode.spec.implementsStereotype}</span>
          {#if trace}
            <span class="trace">{trace}</span>
          {/if}
        </span>
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
              {@const isColl = param.injectionStrategy === 'COLLECTION'}
              {@const resolvedParentId = isDomainFunction ? displayNode?.id : nodeId}
              <ComponentBlock
                nodeId={child.id}
                {selectedId}
                {onselect}
                {treeTick}
                onchange={handleChildChange}
                listIndex={isColl ? i : -1}
                listSize={isColl ? childrenSnapshot[param.name].length : 0}
                onmoveup={() => handleMoveChild(param.name, i, -1)}
                onmovedown={() => handleMoveChild(param.name, i, 1)}
                onremove={() => handleRemoveChild(param.name, i)}
                listParentId={isColl ? resolvedParentId : null}
                listParamName={isColl ? param.name : null}
              />
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
    align-items: stretch;
    flex: 1;
    padding: 0;
    background: white;
    border: 2px solid #ddd;
    border-radius: 6px;
    cursor: grab;
    text-align: left;
    font-family: inherit;
    font-size: inherit;
    overflow: hidden;
  }

  .block:active {
    cursor: grabbing;
  }

  .block:hover {
    border-color: #bbb;
  }

  .block.selected {
    border-color: #4a90d9;
    background: #f0f6ff;
  }

  .block-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
    padding: 0.6rem 0.75rem 0.6rem 0.6rem;
    min-width: 0;
  }

  .block.empty-df {
    border-style: dashed;
    color: #999;
    padding: 0.6rem 1rem;
  }

  .close-btn {
    background: #f5f5f5;
    border: none;
    border-right: 1px solid #e0e0e0;
    font-size: 0.7rem;
    color: #bbb;
    cursor: pointer;
    padding: 0.4rem 0.3rem;
    line-height: 1;
    flex-shrink: 0;
    align-self: stretch;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s, background 0.15s;
  }

  .block:hover .close-btn {
    background: #eee;
  }

  .close-btn:hover {
    color: #d32f2f;
    background: #fef2f2;
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

  .order-btns {
    display: inline-flex;
    flex-direction: row;
    gap: 0.1rem;
    flex-shrink: 0;
    margin-right: -0.25rem;
  }

  .order-btn {
    background: none;
    border: none;
    padding: 0.15rem 0.2rem;
    font-size: 0.65rem;
    color: #bbb;
    cursor: pointer;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s;
  }

  .order-btn:hover:not(:disabled) {
    color: #555;
  }

  .order-btn:disabled {
    opacity: 0.25;
    cursor: default;
  }

  .component.dragging {
    opacity: 0.25;
    pointer-events: none;
  }

  .component.drop-before {
    position: relative;
    margin-top: var(--drag-height, 2.5rem);
  }

  .component.drop-before::before {
    content: '';
    position: absolute;
    top: calc(-1 * var(--drag-height, 2.5rem));
    left: 1.45rem;
    right: 0;
    height: var(--drag-height, 2.5rem);
    border: 2px dashed #4a90d9;
    border-radius: 6px;
    background: rgba(74, 144, 217, 0.04);
    box-sizing: border-box;
  }

  .component.drop-after {
    position: relative;
    margin-bottom: var(--drag-height, 2.5rem);
  }

  .component.drop-after::after {
    content: '';
    position: absolute;
    bottom: calc(-1 * var(--drag-height, 2.5rem));
    left: 1.45rem;
    right: 0;
    height: var(--drag-height, 2.5rem);
    border: 2px dashed #4a90d9;
    border-radius: 6px;
    background: rgba(74, 144, 217, 0.04);
    box-sizing: border-box;
  }

</style>
