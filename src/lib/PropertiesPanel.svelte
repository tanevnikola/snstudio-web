<script>
  import { isNestedParam, isPrimitive, fetchSpec, getNode } from './specApi.js';

  let { nodeId, onchange } = $props();

  const node = getNode(nodeId);
  const isDomainFunction = node?.mnemonic === 'DomainFunction';

  // DomainFunction params (trace, metrics, verbose) — exclude declaration, nested, @delegating@
  const DF_IGNORE = new Set(['declaration', '@delegating@']);
  const dfParams = isDomainFunction
    ? Object.values(node.spec.parameters).filter(
        (p) => !isNestedParam(p) && !DF_IGNORE.has(p.name)
      )
    : [];

  // Inner task node (for DomainFunction) or self (for other nodes)
  const innerTask = isDomainFunction
    ? node.children['task']?.[0] ?? null
    : null;

  const taskNode = isDomainFunction ? innerTask : node;
  const taskParams = taskNode
    ? Object.values(taskNode.spec.parameters).filter(
        (p) => !isNestedParam(p) && p.name !== '@delegating@'
      )
    : [];

  // Local reactive values — separate stores for DF and task
  let dfValues = $state(isDomainFunction ? { ...node.values } : {});
  let taskValues = $state(taskNode ? { ...taskNode.values } : {});

  // Collapsible DF section
  let dfExpanded = $state(false);

  // Sync back to registry
  $effect(() => {
    if (isDomainFunction) node.values = { ...dfValues };
  });
  $effect(() => {
    if (taskNode) taskNode.values = { ...taskValues };
  });

  function notifyChange() {
    queueMicrotask(() => onchange?.());
  }

  // Enum resolution
  let enumCache = $state({});

  async function resolveEnum(param) {
    if (isPrimitive(param.mnemonic) || !param.mnemonic) return;
    try {
      const spec = await fetchSpec(param.mnemonic);
      if (spec.category === 'ENUM' && spec.constraints?.values) {
        enumCache = { ...enumCache, [param.name]: spec.constraints.values };
      }
    } catch {
      // not an enum or fetch failed
    }
  }

  for (const param of [...dfParams, ...taskParams]) {
    if (param.mnemonic && !isPrimitive(param.mnemonic)) {
      resolveEnum(param);
    }
  }

  // Value accessors — take a store reference
  function getValue(store, name) {
    return store[name] ?? '';
  }
  function getBoolValue(store, name) {
    const v = store[name];
    return v === true || v === 'true';
  }
  function getMapEntries(store, name) {
    return store[name] || [];
  }
  function getCollectionEntries(store, name) {
    return store[name] || [];
  }

  // Returns a setter bound to a specific store ('df' or 'task')
  function setVal(which, name, value) {
    if (which === 'df') {
      dfValues = { ...dfValues, [name]: value };
    } else {
      taskValues = { ...taskValues, [name]: value };
    }
    notifyChange();
  }

  function addMapEntry(which, name) {
    const store = which === 'df' ? dfValues : taskValues;
    const current = store[name] || [];
    if (which === 'df') {
      dfValues = { ...dfValues, [name]: [...current, { key: '', value: '' }] };
    } else {
      taskValues = { ...taskValues, [name]: [...current, { key: '', value: '' }] };
    }
    notifyChange();
  }

  function removeMapEntry(which, name, index) {
    const store = which === 'df' ? dfValues : taskValues;
    const current = store[name] || [];
    const updated = current.filter((_, i) => i !== index);
    if (which === 'df') {
      dfValues = { ...dfValues, [name]: updated };
    } else {
      taskValues = { ...taskValues, [name]: updated };
    }
    notifyChange();
  }

  function updateMapEntry(which, name, index, field, value) {
    const store = which === 'df' ? dfValues : taskValues;
    const current = [...(store[name] || [])];
    current[index] = { ...current[index], [field]: value };
    if (which === 'df') {
      dfValues = { ...dfValues, [name]: current };
    } else {
      taskValues = { ...taskValues, [name]: current };
    }
    notifyChange();
  }

  function addCollectionEntry(which, name) {
    const store = which === 'df' ? dfValues : taskValues;
    const current = store[name] || [];
    if (which === 'df') {
      dfValues = { ...dfValues, [name]: [...current, ''] };
    } else {
      taskValues = { ...taskValues, [name]: [...current, ''] };
    }
    notifyChange();
  }

  function removeCollectionEntry(which, name, index) {
    const store = which === 'df' ? dfValues : taskValues;
    const current = store[name] || [];
    const updated = current.filter((_, i) => i !== index);
    if (which === 'df') {
      dfValues = { ...dfValues, [name]: updated };
    } else {
      taskValues = { ...taskValues, [name]: updated };
    }
    notifyChange();
  }

  function updateCollectionEntry(which, name, index, value) {
    const store = which === 'df' ? dfValues : taskValues;
    const current = [...(store[name] || [])];
    current[index] = value;
    if (which === 'df') {
      dfValues = { ...dfValues, [name]: current };
    } else {
      taskValues = { ...taskValues, [name]: current };
    }
    notifyChange();
  }
</script>

{#snippet paramField(param, which)}
  {@const store = which === 'df' ? dfValues : taskValues}
  <div class="param">
    <span class="param-name">
      {param.name}
      {#if param.required}<span class="required">*</span>{/if}
    </span>
    <span class="param-hint">{param.mnemonic}{param.injectionStrategy && param.injectionStrategy !== 'DIRECT' ? ` · ${param.injectionStrategy}` : ''}</span>

    {#if param.mnemonic === 'Boolean'}
      <label class="checkbox-label">
        <input
          type="checkbox"
          checked={getBoolValue(store, param.name)}
          onchange={(e) => setVal(which, param.name, e.target.checked)}
        />
        {getBoolValue(store, param.name) ? 'true' : 'false'}
      </label>

    {:else if enumCache[param.name]}
      <select
        value={getValue(store, param.name)}
        onchange={(e) => setVal(which, param.name, e.target.value)}
      >
        <option value="">-- select --</option>
        {#each enumCache[param.name] as val (val)}
          <option value={val}>{val}</option>
        {/each}
      </select>

    {:else if param.injectionStrategy === 'MAP'}
      <div class="map-entries">
        {#each getMapEntries(store, param.name) as entry, i (i)}
          <div class="map-row">
            <input
              type="text"
              class="map-key"
              placeholder="key"
              value={entry.key}
              oninput={(e) => updateMapEntry(which, param.name, i, 'key', e.target.value)}
            />
            <input
              type="text"
              class="map-value"
              placeholder="value"
              value={entry.value}
              oninput={(e) => updateMapEntry(which, param.name, i, 'value', e.target.value)}
            />
            <button class="remove-btn" onclick={() => removeMapEntry(which, param.name, i)}>✕</button>
          </div>
        {/each}
        <button class="add-btn" onclick={() => addMapEntry(which, param.name)}>+ add entry</button>
      </div>

    {:else if param.injectionStrategy === 'COLLECTION'}
      <div class="collection-entries">
        {#each getCollectionEntries(store, param.name) as entry, i (i)}
          <div class="collection-row">
            <input
              type="text"
              value={entry}
              placeholder="value"
              oninput={(e) => updateCollectionEntry(which, param.name, i, e.target.value)}
            />
            <button class="remove-btn" onclick={() => removeCollectionEntry(which, param.name, i)}>✕</button>
          </div>
        {/each}
        <button class="add-btn" onclick={() => addCollectionEntry(which, param.name)}>+ add</button>
      </div>

    {:else}
      <input
        type="text"
        value={getValue(store, param.name)}
        placeholder={param.defaultValue != null ? String(param.defaultValue) : ''}
        oninput={(e) => setVal(which, param.name, e.target.value)}
      />
    {/if}
  </div>
{/snippet}

<div class="panel">
  {#if isDomainFunction && dfParams.length > 0}
    <div class="df-section">
      <button class="df-header" onclick={() => (dfExpanded = !dfExpanded)}>
        <span class="df-arrow">{dfExpanded ? '▼' : '▶'}</span>
        <span class="df-title">DomainFunction</span>
      </button>
      {#if dfExpanded}
        <div class="df-body">
          {#each dfParams as param (param.name)}
            {@render paramField(param, 'df')}
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  {#if taskNode}
    <h3>{taskNode.mnemonic}</h3>
    {#each taskParams as param (param.name)}
      {@render paramField(param, 'task')}
    {/each}
  {:else if isDomainFunction}
    <div class="no-task">No task assigned yet</div>
  {/if}
</div>

<style>
  .panel {
    padding: 1rem;
    overflow-y: auto;
  }

  h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #ddd;
  }

  .df-section {
    margin-bottom: 0.75rem;
    border: 1px solid #e8e8e8;
    border-radius: 6px;
    overflow: hidden;
  }

  .df-header {
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

  .df-header:hover {
    background: #f0f0f0;
  }

  .df-arrow {
    font-size: 0.6rem;
    color: #999;
  }

  .df-title {
    font-weight: 600;
    color: #666;
  }

  .df-body {
    padding: 0.5rem 0.75rem;
    border-top: 1px solid #e8e8e8;
  }

  .no-task {
    color: #999;
    font-size: 0.85rem;
    font-style: italic;
  }

  .param {
    margin-bottom: 0.75rem;
  }

  .param-name {
    font-size: 0.85rem;
    font-weight: 500;
    display: block;
  }

  .required {
    color: #d32f2f;
    margin-left: 0.15rem;
  }

  .param-hint {
    font-size: 0.7rem;
    color: #888;
    display: block;
    margin-bottom: 0.25rem;
  }

  input[type="text"] {
    width: 100%;
    padding: 0.35rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.8rem;
    font-family: inherit;
  }

  input[type="text"]:focus {
    outline: none;
    border-color: #666;
  }

  select {
    width: 100%;
    padding: 0.35rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.8rem;
    font-family: inherit;
    background: white;
  }

  select:focus {
    outline: none;
    border-color: #666;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    color: #555;
    cursor: pointer;
  }

  input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    cursor: pointer;
  }

  .map-entries, .collection-entries {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .map-row {
    display: flex;
    gap: 0.25rem;
    align-items: center;
  }

  .map-key {
    width: 40% !important;
  }

  .map-value {
    flex: 1;
  }

  .collection-row {
    display: flex;
    gap: 0.25rem;
    align-items: center;
  }

  .collection-row input {
    flex: 1;
  }

  .remove-btn {
    background: none;
    border: none;
    font-size: 0.75rem;
    color: #ccc;
    cursor: pointer;
    padding: 0.2rem;
    flex-shrink: 0;
  }

  .remove-btn:hover {
    color: #d32f2f;
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
