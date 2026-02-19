<script module>
  // Shared collapse state — persists across component instances (node selections)
  let _dfExpanded = false;
  let _taskExpanded = true;
  let _collapsed = {};
  let _entryCollapsed = {};
</script>

<script>
  import { isNestedParam, isMnemonicType, getNode, createNode, unregisterDeep } from '../../lib/specApi.js';
  import ParamField from '../../lib/components/ParamField.svelte';
  import MnemonicField from '../../lib/components/MnemonicField.svelte';

  let { nodeId, onchange } = $props();

  const node = getNode(nodeId);
  const isDomainFunction = node?.mnemonic === 'DomainFunction';

  // DomainFunction params — exclude nested and @delegating@
  const DF_IGNORE = new Set(['@delegating@']);
  const dfParams = isDomainFunction
    ? Object.values(node.spec.parameters)
        .filter((p) => !isNestedParam(p) && !DF_IGNORE.has(p.name))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : [];

  // Inner task node (for DomainFunction) or self (for other nodes)
  const innerTask = isDomainFunction
    ? node.children['task']?.[0] ?? null
    : null;

  const taskNode = isDomainFunction ? innerTask : node;
  const taskParams = taskNode
    ? Object.values(taskNode.spec.parameters)
        .filter((p) => !isNestedParam(p))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : [];

  // Local reactive values — separate stores for DF and task
  let dfValues = $state(isDomainFunction ? { ...node.values } : {});
  let taskValues = $state(taskNode ? { ...taskNode.values } : {});

  // Version counter to force re-derivation when children change
  let childVersion = $state(0);

  // Collapsible sections — initialized from module-level shared state
  let dfExpanded = $state(_dfExpanded);
  let taskExpanded = $state(_taskExpanded);

  // Sync back to module-level so next instance inherits the same state
  $effect(() => { _dfExpanded = dfExpanded; });
  $effect(() => { _taskExpanded = taskExpanded; });

  // Sync back to registry
  $effect(() => {
    if (isDomainFunction) node.values = { ...dfValues };
  });
  $effect(() => {
    if (taskNode) taskNode.values = { ...taskValues };
  });

  // Per-param collapse — initialized from module-level, synced back
  const COLLAPSIBLE = new Set(['MAP', 'COLLECTION']);
  let collapsed = $state({ ..._collapsed });
  function toggleParam(name) { collapsed = { ...collapsed, [name]: !collapsed[name] }; }
  $effect(() => { _collapsed = { ...collapsed }; });

  // Per-entry collapse — initialized from module-level, synced back
  let entryCollapsed = $state({ ..._entryCollapsed });
  function toggleEntry(id) { entryCollapsed = { ...entryCollapsed, [id]: !entryCollapsed[id] }; }
  $effect(() => { _entryCollapsed = { ...entryCollapsed }; });

  function setVal(which, name, value) {
    if (which === 'df') {
      dfValues = { ...dfValues, [name]: value };
      node.values = { ...dfValues };
    } else {
      taskValues = { ...taskValues, [name]: value };
      if (taskNode) taskNode.values = { ...taskValues };
    }
    onchange?.();
  }

  function getTargetNode(which) {
    return which === 'df' ? node : taskNode;
  }

  function setChild(which, name, child) {
    const target = getTargetNode(which);
    if (!target) return;
    const old = target.children[name]?.[0];
    if (old && old !== child) unregisterDeep(old);
    target.children[name] = child ? [child] : [];
    childVersion++;
    onchange?.();
  }

  function setChildren(which, name, kids) {
    const target = getTargetNode(which);
    if (!target) return;
    target.children[name] = kids;
    childVersion++;
    onchange?.();
  }

  function bumpChildren() {
    childVersion++;
    onchange?.();
  }

  // Reactive helpers — read childVersion so Svelte tracks the dependency
  // and re-evaluates template expressions when children change structurally.
  // Unlike {#key}, this preserves DOM (no destroy/recreate → no focus loss).
  function getKids(target, name) {
    void childVersion;
    return target?.children[name] ?? [];
  }
  function getFirstChild(target, name) {
    void childVersion;
    return target?.children[name]?.[0] ?? null;
  }
</script>

{#snippet paramField(param, which)}
  {@const store = which === 'df' ? dfValues : taskValues}
  {@const target = getTargetNode(which)}
  {@const isMnemonic = isMnemonicType(param)}
  {@const isCollapsible = isMnemonic || COLLAPSIBLE.has(param.injectionStrategy)}
  {@const isCollapsed = isCollapsible && collapsed[param.name]}
  <div class="param">
    <span class="param-name">
      {#if isCollapsible}
        <button class="param-toggle" onclick={() => toggleParam(param.name)}>
          <span class="param-arrow">{isCollapsed ? '▶' : '▼'}</span>
        </button>
      {/if}
      {param.name}
      {#if param.required}<span class="required">*</span>{/if}
    </span>
    <span class="param-hint">{param.mnemonic}{param.injectionStrategy && param.injectionStrategy !== 'DIRECT' ? ` · ${param.injectionStrategy}` : ''}{param.injectionPoint ? ' · injectable' : ''}</span>

    {#if isMnemonic && !isCollapsed}
      {#if param.injectionStrategy === 'MAP'}
        <!-- MAP of mnemonic children -->
        <div class="map-entries">
          {#each getKids(target, param.name) as child, i (child.id)}
            <div class="map-mnemonic-entry">
              <div class="map-mnemonic-header">
                <button class="entry-toggle" onclick={() => toggleEntry(child.id)}>
                  <span class="entry-arrow">{entryCollapsed[child.id] ? '▶' : '▼'}</span>
                </button>
                {#if entryCollapsed[child.id]}
                  <span class="entry-label">{child.mapKey || 'key'} <span class="entry-label-hint">({child.mnemonic || param.mnemonic})</span></span>
                {:else}
                  <input
                    type="text"
                    class="map-key"
                    placeholder="key"
                    value={child.mapKey ?? ''}
                    oninput={(e) => { child.mapKey = e.target.value; onchange?.(); }}
                  />
                {/if}
                <button class="remove-btn" onclick={() => {
                  unregisterDeep(child);
                  setChildren(which, param.name, getKids(target, param.name).filter((_, idx) => idx !== i));
                }}>✕</button>
              </div>
              {#if !entryCollapsed[child.id]}
                <MnemonicField
                  {param}
                  value={child}
                  onchange={(newChild) => {
                    if (newChild && newChild !== child) {
                      newChild.mapKey = child.mapKey ?? '';
                      const kids = getKids(target, param.name);
                      const updated = [...kids];
                      updated[i] = newChild;
                      setChildren(which, param.name, updated);
                    } else if (!newChild) {
                      setChildren(which, param.name, getKids(target, param.name).filter((_, idx) => idx !== i));
                    } else {
                      onchange?.();
                    }
                  }}
                />
              {/if}
            </div>
          {/each}
          <button class="add-btn" onclick={() => {
            const placeholder = createNode('', { parameters: {} });
            setChildren(which, param.name, [...getKids(target, param.name), placeholder]);
          }}>+ add entry</button>
        </div>
      {:else if param.injectionStrategy === 'COLLECTION'}
        <!-- COLLECTION of mnemonic children -->
        <div class="collection-entries">
          {#each getKids(target, param.name) as child, i (child.id)}
            <div class="collection-entry">
              <button class="remove-btn" onclick={() => {
                unregisterDeep(child);
                setChildren(which, param.name, getKids(target, param.name).filter((_, idx) => idx !== i));
              }}>✕</button>
              <MnemonicField
                {param}
                value={child}
                onchange={(newChild) => {
                  if (newChild && newChild !== child) {
                    const kids = getKids(target, param.name);
                    const updated = [...kids];
                    updated[i] = newChild;
                    setChildren(which, param.name, updated);
                  } else if (!newChild) {
                    setChildren(which, param.name, getKids(target, param.name).filter((_, idx) => idx !== i));
                  } else {
                    onchange?.();
                  }
                }}
              />
            </div>
          {/each}
          <button class="add-btn" onclick={() => {
            const placeholder = createNode('', { parameters: {} });
            setChildren(which, param.name, [...getKids(target, param.name), placeholder]);
          }}>+ add</button>
        </div>
      {:else}
        <!-- DIRECT mnemonic child -->
        <MnemonicField
          {param}
          value={getFirstChild(target, param.name)}
          onchange={(child) => setChild(which, param.name, child)}
        />
      {/if}
    {:else if !isCollapsed}
      <ParamField
        {param}
        value={store[param.name] ?? ''}
        onchange={(v) => setVal(which, param.name, v)}
      />
    {/if}
  </div>
{/snippet}

<div class="panel">
  {#if isDomainFunction && dfParams.length > 0}
    <div class="section">
      <button class="section-header" onclick={() => (dfExpanded = !dfExpanded)}>
        <span class="section-arrow">{dfExpanded ? '▼' : '▶'}</span>
        <span class="section-title">DomainFunction</span>
      </button>
      {#if dfExpanded}
        <div class="section-body">
          {#each dfParams as param (param.name)}
            {@render paramField(param, 'df')}
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  {#if taskNode}
    <div class="section">
      <button class="section-header" onclick={() => (taskExpanded = !taskExpanded)}>
        <span class="section-arrow">{taskExpanded ? '▼' : '▶'}</span>
        <span class="section-title">{taskNode.mnemonic}</span>
      </button>
      {#if taskExpanded}
        <div class="section-body">
          {#each taskParams as param (param.name)}
            {@render paramField(param, 'task')}
          {/each}
        </div>
      {/if}
    </div>
  {:else if isDomainFunction}
    <div class="no-task">No task assigned yet</div>
  {/if}
</div>

<style>
  .panel {
    padding: 1rem;
    overflow-y: auto;
  }

  .section {
    margin-bottom: 0.5rem;
    border: 1px solid #e8e8e8;
    border-radius: 6px;
    overflow: hidden;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: #f8f8f8;
    border: none;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.8rem;
    text-align: left;
  }

  .section-header:hover {
    background: #f0f0f0;
  }

  .section-arrow {
    font-size: 0.6rem;
    color: #999;
  }

  .section-title {
    font-weight: 600;
    color: #666;
  }

  .section-body {
    padding: 0.5rem 0.75rem;
    border-top: 1px solid #e8e8e8;
    background: #fafafa;
  }

  .no-task {
    color: #999;
    font-size: 0.85rem;
    font-style: italic;
  }

  .param {
    margin-bottom: 0.5rem;
  }

  .param:last-child {
    margin-bottom: 0;
  }

  .param-name {
    font-size: 0.8rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.15rem;
  }

  .param-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }

  .param-arrow {
    font-size: 0.55rem;
    color: #999;
  }

  .param-toggle:hover .param-arrow {
    color: #555;
  }

  .required {
    color: #d32f2f;
    margin-left: 0.15rem;
  }

  .param-hint {
    font-size: 0.65rem;
    color: #888;
    display: block;
    margin-bottom: 0.2rem;
  }

  .map-entries, .collection-entries {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .map-mnemonic-entry {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    background: white;
  }

  .map-mnemonic-header {
    display: flex;
    gap: 0.25rem;
    align-items: center;
  }

  .entry-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }

  .entry-arrow {
    font-size: 0.55rem;
    color: #999;
  }

  .entry-toggle:hover .entry-arrow {
    color: #555;
  }

  .entry-label {
    flex: 1;
    font-size: 0.8rem;
    font-weight: 500;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .entry-label-hint {
    font-weight: 400;
    color: #999;
  }

  .map-key {
    flex: 1;
    font-weight: 500;
    padding: 0.35rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.8rem;
    font-family: inherit;
  }

  .map-key:focus {
    outline: none;
    border-color: #666;
  }

  .collection-entry {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    background: white;
  }

  .remove-btn {
    background: none;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.75rem;
    color: #bbb;
    cursor: pointer;
    width: 1.75rem;
    height: 1.75rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding: 0;
    line-height: 1;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
  }

  .remove-btn:hover {
    color: #d32f2f;
    border-color: #d32f2f;
    background: #fef2f2;
  }

  .add-btn {
    background: none;
    border: 1px dashed #ccc;
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    color: #888;
    cursor: pointer;
    text-align: left;
  }

  .add-btn:hover {
    border-color: #999;
    color: #555;
  }
</style>
